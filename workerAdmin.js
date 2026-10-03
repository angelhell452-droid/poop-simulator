// Admin sessions and grants. The creator is env.CREATOR_PLAYER_ID, with CREATOR_USERNAME still accepted.

const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const RELIC_LEVELS = ["cosmicSynergy", "passiveRolls", "omniMult", "afkCap", "knifeForge", "factoryOverdrive", "plungerIncubator", "meteorStorm", "evoBlessing"];
const RELIC_FLAGS = ["autoBuyer", "autoEvolution", "singularityRift"];

export async function ensureAdminSchema(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );
  `).run();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS game_admins (
      username TEXT PRIMARY KEY COLLATE NOCASE,
      added_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `).run();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS admin_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      target TEXT NOT NULL,
      detail TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `).run();
  try {
    await db.prepare(`ALTER TABLE player_saves ADD COLUMN admin_seq INTEGER NOT NULL DEFAULT 0`).run();
  } catch (err) {
    // Column already exists.
  }
  try {
    await db.prepare(`ALTER TABLE game_admins ADD COLUMN player_id TEXT`).run();
  } catch (err) {
    // Column already exists.
  }
}

function creatorName(env) {
  return String(env.CREATOR_USERNAME || "").trim();
}

function creatorPlayerId(env) {
  return String(env.CREATOR_PLAYER_ID || "").trim();
}

export function isCreator(env, account) {
  const username = typeof account === "string" ? account : account?.username;
  const playerId = typeof account === "string" ? "" : account?.playerId;
  const byId = creatorPlayerId(env);
  if (byId && playerId && byId === String(playerId).trim()) return true;
  const byName = creatorName(env);
  return byName.length > 0 && byName.toLowerCase() === String(username || "").trim().toLowerCase();
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function newSessionToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function bearerToken(req) {
  const raw = req.headers.get("Authorization") || "";
  const match = raw.match(/^Bearer\s+([a-f0-9]{64})$/i);
  return match ? match[1] : "";
}

export async function issueSession(db, username) {
  await db.prepare(`DELETE FROM auth_sessions WHERE username = ? COLLATE NOCASE`).bind(username).run();
  const token = newSessionToken();
  const tokenHash = await sha256Hex(token);
  const expires = new Date(Date.now() + SESSION_MS).toISOString().slice(0, 19).replace("T", " ");
  await db.prepare(`
    INSERT INTO auth_sessions (token_hash, username, expires_at) VALUES (?, ?, ?)
  `).bind(tokenHash, username, expires).run();
  return token;
}

export async function sessionUser(db, req) {
  const token = bearerToken(req);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  return db.prepare(`
    SELECT a.username, a.player_id as playerId
    FROM auth_sessions s
    JOIN user_accounts a ON a.username = s.username COLLATE NOCASE
    WHERE s.token_hash = ? AND s.expires_at > datetime('now')
    LIMIT 1
  `).bind(tokenHash).first();
}

async function roleOf(env, account) {
  if (isCreator(env, account)) return "creator";
  const row = await env.DB.prepare(`
    SELECT username FROM game_admins
    WHERE player_id = ? OR username = ? COLLATE NOCASE
    LIMIT 1
  `).bind(account.playerId || "", account.username || "").first();
  return row ? "admin" : null;
}

async function requireStaff(env, req) {
  const user = await sessionUser(env.DB, req);
  if (!user) return { error: "Нужно войти в аккаунт заново.", status: 401 };
  const role = await roleOf(env, user);
  if (!role) return { error: "Недостаточно прав.", status: 403 };
  return { user, role };
}

function json(headers, body, status) {
  return new Response(JSON.stringify(body), { status, headers });
}

function finiteAmount(value, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(max, n);
}

function addStat(game, key, amount, max) {
  const n = finiteAmount(amount, max);
  if (n === null || n === 0) return false;
  game[key] = Math.min(max, (Number(game[key]) || 0) + n);
  return true;
}

function applyGrant(save, grant) {
  if (!save.game || typeof save.game !== "object") save.game = {};
  const game = save.game;
  const notes = [];

  if (addStat(game, "biomass", grant.biomass, 1e300)) {
    addStat(game, "cycleBiomass", grant.biomass, 1e300);
    addStat(game, "allTimeBiomass", grant.biomass, 1e300);
    notes.push("biomass");
  }
  if (addStat(game, "sparkles", grant.sparkles, 1e15)) notes.push("sparkles");
  if (addStat(game, "prestigeRolls", grant.rolls, 1e15)) {
    addStat(game, "allTimePrestigeRolls", grant.rolls, 1e15);
    notes.push("rolls");
  }
  if (addStat(game, "transcendPlungers", grant.plungers, 1e9)) notes.push("plungers");
  if (addStat(game, "totalPrestiges", grant.flushes, 100000)) notes.push("flushes");
  if (addStat(game, "totalTranscend", grant.transcends, 1000)) notes.push("transcends");

  if (grant.form != null && grant.form !== "") {
    const form = Math.floor(finiteAmount(grant.form, 20000));
    if (form >= 1) {
      game.evoStage = form - 1;
      const need = Math.max(0, Math.ceil(form / 1000) - 1);
      if ((Number(game.totalTranscend) || 0) < need) game.totalTranscend = need;
      notes.push("form");
    }
  }

  if (grant.factoryId && /^[a-z0-9_]{1,48}$/.test(grant.factoryId)) {
    const count = Math.floor(finiteAmount(grant.factoryCount, 100000));
    if (count !== null) {
      if (!Array.isArray(save.factories)) save.factories = [];
      const row = save.factories.find((f) => f && f.id === grant.factoryId);
      if (row) row.count = count;
      else save.factories.push({ id: grant.factoryId, count });
      notes.push("factory");
    }
  }

  if (grant.talentId && /^[a-z0-9_]{1,48}$/.test(grant.talentId)) {
    const level = Math.floor(finiteAmount(grant.talentLevel, 100));
    if (level !== null) {
      if (!Array.isArray(save.talents)) save.talents = [];
      const row = save.talents.find((t) => t && t.id === grant.talentId);
      if (row) row.level = level;
      else save.talents.push({ id: grant.talentId, level });
      notes.push("talent");
    }
  }

  if (grant.knifeId && /^knife_[a-z0-9_]{1,80}$/.test(grant.knifeId)) {
    if (!Array.isArray(game.unlockedKnives)) game.unlockedKnives = [];
    if (!game.unlockedKnives.includes(grant.knifeId)) game.unlockedKnives.push(grant.knifeId);
    if (grant.equipKnife) game.equippedKnife = grant.knifeId;
    notes.push("knife");
  }

  if (grant.itemId && /^(hat_|upg_)[a-z0-9_]{1,80}$/.test(grant.itemId)) {
    if (!Array.isArray(save.purchasedItems)) save.purchasedItems = [];
    if (!save.purchasedItems.includes(grant.itemId)) save.purchasedItems.push(grant.itemId);
    if (grant.itemId.startsWith("hat_") && grant.equipHat) game.equippedHat = grant.itemId;
    notes.push("item");
  }

  if (grant.boutiqueId && /^[a-z0-9_]{1,48}$/.test(grant.boutiqueId)) {
    const level = Math.floor(finiteAmount(grant.boutiqueLevel, 20));
    if (level !== null) {
      if (!game.boutiqueLevels || typeof game.boutiqueLevels !== "object") game.boutiqueLevels = {};
      game.boutiqueLevels[grant.boutiqueId] = level;
      notes.push("boutique");
    }
  }

  if (RELIC_LEVELS.includes(grant.relicKey)) {
    const level = Math.floor(finiteAmount(grant.relicLevel, 100));
    if (level !== null) {
      if (!game.transcendUpgrades || typeof game.transcendUpgrades !== "object") game.transcendUpgrades = {};
      game.transcendUpgrades[grant.relicKey] = level;
      notes.push("relic");
    }
  } else if (RELIC_FLAGS.includes(grant.relicKey)) {
    if (!game.transcendUpgrades || typeof game.transcendUpgrades !== "object") game.transcendUpgrades = {};
    game.transcendUpgrades[grant.relicKey] = !!grant.relicOn;
    notes.push("relic");
  }

  return notes;
}

async function writePlayerSave(db, playerId, playerName, save, seq) {
  save.adminSeq = seq;
  if (!save.game || typeof save.game !== "object") save.game = {};
  save.game.cloudAdminSeq = seq;
  const stage = Number(save.game.evoStage !== undefined ? save.game.evoStage + 1 : 1) || 1;
  const biomass = Number(save.game.allTimeBiomass ?? save.game.biomass) || 0;
  const sparkles = Number(save.game.sparkles) || 0;
  const rolls = Number(save.game.prestigeRolls) || 0;
  await db.prepare(`
    INSERT INTO player_saves (player_id, player_name, stage, biomass, sparkles, prestige_currency, save_data, admin_seq, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(player_id) DO UPDATE SET
      player_name = excluded.player_name,
      stage = excluded.stage,
      biomass = excluded.biomass,
      sparkles = excluded.sparkles,
      prestige_currency = excluded.prestige_currency,
      save_data = excluded.save_data,
      admin_seq = excluded.admin_seq,
      updated_at = datetime('now')
  `).bind(playerId, playerName, stage, biomass, sparkles, rolls, JSON.stringify(save), seq).run();
}

async function audit(db, actor, action, target, detail) {
  const text = JSON.stringify(detail).slice(0, 500);
  await db.prepare(`
    INSERT INTO admin_audit (actor, action, target, detail) VALUES (?, ?, ?, ?)
  `).bind(actor, action, target, text).run();
}

async function tooFast(db, actor) {
  const row = await db.prepare(`
    SELECT COUNT(*) as n FROM admin_audit
    WHERE actor = ? AND created_at > datetime('now', '-1 minute')
  `).bind(actor).first();
  return Number(row?.n || 0) >= 20;
}

export async function handleAdmin(req, env, headers, url) {
  const action = url.searchParams.get("action") || "";
  if (!action.startsWith("admin_")) return null;

  if (req.method === "GET" && action === "admin_session") {
    const user = await sessionUser(env.DB, req);
    if (!user) return json(headers, { success: true, role: null }, 200);
    const role = await roleOf(env, user);
    return json(headers, {
      success: true,
      role,
      username: user.username,
      playerId: user.playerId,
      creatorReady: creatorName(env).length > 0 || creatorPlayerId(env).length > 0
    }, 200);
  }

  const staff = await requireStaff(env, req);
  if (staff.error) return json(headers, { success: false, error: staff.error }, staff.status);
  if (await tooFast(env.DB, staff.user.username)) {
    return json(headers, { success: false, error: "Слишком много действий. Подождите минуту." }, 429);
  }

  if (req.method === "GET" && action === "admin_find") {
    const q = String(url.searchParams.get("q") || "").trim().replace(/[%_]/g, "");
    if (q.length < 2) return json(headers, { success: true, users: [] }, 200);
    const { results } = await env.DB.prepare(`
      SELECT username, player_id as playerId FROM user_accounts
      WHERE username LIKE ? COLLATE NOCASE OR player_id LIKE ?
      ORDER BY username LIMIT 8
    `).bind(`${q}%`, `${q}%`).all();
    return json(headers, { success: true, users: results || [] }, 200);
  }

  if (req.method === "GET" && action === "admin_list") {
    if (staff.role !== "creator") return json(headers, { success: false, error: "Список админов видит только создатель." }, 403);
    const { results } = await env.DB.prepare(`
      SELECT username, player_id as playerId, added_by as addedBy, created_at as createdAt
      FROM game_admins ORDER BY username
    `).all();
    return json(headers, { success: true, admins: results || [] }, 200);
  }

  if (req.method === "GET" && action === "admin_audit") {
    const { results } = await env.DB.prepare(`
      SELECT actor, action, target, detail, created_at as createdAt
      FROM admin_audit ORDER BY id DESC LIMIT 20
    `).all();
    return json(headers, { success: true, audit: results || [] }, 200);
  }

  if (req.method !== "POST") return json(headers, { success: false, error: "Method not allowed" }, 405);
  const body = await req.json().catch(() => ({}));

  if (action === "admin_add" || action === "admin_remove") {
    if (staff.role !== "creator") return json(headers, { success: false, error: "Добавлять админов может только создатель." }, 403);
    const key = String(body.playerId || body.username || "").trim();
    if (key.length < 3) return json(headers, { success: false, error: "Укажите Cloud ID существующего аккаунта." }, 400);
    const account = await env.DB.prepare(`
      SELECT username, player_id as playerId FROM user_accounts
      WHERE player_id = ? OR username = ? COLLATE NOCASE
      LIMIT 1
    `).bind(key, key).first();
    if (!account) return json(headers, { success: false, error: "Такого аккаунта нет." }, 404);
    if (isCreator(env, account)) return json(headers, { success: false, error: "Создатель уже имеет полные права." }, 400);
    if (action === "admin_add") {
      const count = await env.DB.prepare(`SELECT COUNT(*) as n FROM game_admins`).first();
      if (Number(count?.n || 0) >= 20) return json(headers, { success: false, error: "Уже 20 админов." }, 400);
      await env.DB.prepare(`
        INSERT INTO game_admins (username, added_by, player_id) VALUES (?, ?, ?)
        ON CONFLICT(username) DO UPDATE SET player_id = excluded.player_id
      `).bind(account.username, staff.user.username, account.playerId).run();
      await audit(env.DB, staff.user.username, "add_admin", account.playerId, { username: account.username });
      return json(headers, { success: true, username: account.username, playerId: account.playerId }, 200);
    }
    await env.DB.prepare(`DELETE FROM game_admins WHERE player_id = ? OR username = ? COLLATE NOCASE`).bind(account.playerId, account.username).run();
    await audit(env.DB, staff.user.username, "remove_admin", account.playerId, { username: account.username });
    return json(headers, { success: true, username: account.username, playerId: account.playerId }, 200);
  }

  if (action === "admin_grant") {
    const targetKey = String(body.targetPlayerId || body.targetUsername || staff.user.playerId).trim();
    const account = await env.DB.prepare(`
      SELECT username, player_id as playerId FROM user_accounts
      WHERE player_id = ? OR username = ? COLLATE NOCASE
      LIMIT 1
    `).bind(targetKey, targetKey).first();
    if (!account) return json(headers, { success: false, error: "Игрок с таким Cloud ID не найден." }, 404);

    const row = await env.DB.prepare(`
      SELECT save_data, admin_seq, player_name FROM player_saves WHERE player_id = ? LIMIT 1
    `).bind(account.playerId).first();
    let save = {};
    if (row?.save_data) {
      try { save = JSON.parse(row.save_data); } catch (err) { save = {}; }
    }
    if (!save.game) save.game = { playerId: account.playerId, playerName: account.username };
    const notes = applyGrant(save, body.grant || {});
    if (!notes || !notes.length) return json(headers, { success: false, error: "Нечего выдавать: заполните хотя бы одно поле." }, 400);

    const seq = (Number(row?.admin_seq) || 0) + 1;
    await writePlayerSave(env.DB, account.playerId, account.username, save, seq);
    await audit(env.DB, staff.user.username, "grant", account.username, { notes });
    const same = account.playerId === staff.user.playerId;
    return json(headers, {
      success: true,
      username: account.username,
      notes,
      saveData: same ? save : null
    }, 200);
  }

  return json(headers, { success: false, error: "Неизвестное действие." }, 404);
}

export async function rejectStaleSave(db, playerId, incomingSeq, headers) {
  const row = await db.prepare(`
    SELECT admin_seq, save_data FROM player_saves WHERE player_id = ? LIMIT 1
  `).bind(playerId).first();
  const current = Number(row?.admin_seq) || 0;
  if (!row || current <= incomingSeq) return { current };
  let saveData = null;
  try { saveData = JSON.parse(row.save_data); } catch (err) { saveData = null; }
  return {
    current,
    response: json(headers, { success: false, error: "stale_save", adminSeq: current, saveData }, 409)
  };
}
