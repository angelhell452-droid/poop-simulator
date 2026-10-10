// Admin sessions and grants. Staff rows live in game_admins: level 1 is the creator, level 2 is an admin.

const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const RELIC_LEVELS = ["cosmicSynergy", "passiveRolls", "omniMult", "afkCap", "knifeForge", "factoryOverdrive", "plungerIncubator", "meteorStorm", "evoBlessing"];
const RELIC_FLAGS = ["autoCare", "autoBuyer", "autoEvolution", "singularityRift"];

let adminSchemaReady = false;

/** Social Worker: tables already exist — skip DDL to stay under free CPU limits. */
export function trustAdminSchema() {
  adminSchemaReady = true;
}

export async function ensureAdminSchema(db) {
  if (adminSchemaReady) return;
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
      player_id TEXT,
      added_by TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 2,
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
  try {
    await db.prepare(`ALTER TABLE game_admins ADD COLUMN level INTEGER NOT NULL DEFAULT 2`).run();
  } catch (err) {
    // Column already exists.
  }
  try {
    await db.prepare(`ALTER TABLE user_accounts ADD COLUMN vip_level INTEGER NOT NULL DEFAULT 0`).run();
  } catch (err) {
    // Column already exists.
  }
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS game_flags (
      key TEXT PRIMARY KEY,
      value INTEGER NOT NULL DEFAULT 0
    );
  `).run();
  adminSchemaReady = true;
}

async function staffLevel(env, account) {
  if (!account || typeof account === "string") return 0;
  const row = await env.DB.prepare(`
    SELECT level FROM game_admins
    WHERE player_id = ? OR username = ? COLLATE NOCASE
    ORDER BY level ASC
    LIMIT 1
  `).bind(account.playerId || "", account.username || "").first();
  const level = Number(row?.level);
  return level === 1 || level === 2 ? level : 0;
}

export async function isCreator(env, account) {
  return (await staffLevel(env, account)) === 1;
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
  const level = await staffLevel(env, account);
  if (level === 1) return "creator";
  if (level === 2) return "admin";
  return null;
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
      level: role === "creator" ? 1 : role === "admin" ? 2 : 0,
      username: user.username,
      playerId: user.playerId
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
      SELECT username, player_id as playerId, level, added_by as addedBy, created_at as createdAt
      FROM game_admins ORDER BY level, username
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
    if (await isCreator(env, account)) return json(headers, { success: false, error: "Создателя не меняют из панели. Его уровень 1 записан в базе." }, 400);
    if (action === "admin_add") {
      const count = await env.DB.prepare(`SELECT COUNT(*) as n FROM game_admins WHERE level = 2`).first();
      if (Number(count?.n || 0) >= 20) return json(headers, { success: false, error: "Уже 20 админов." }, 400);
      await env.DB.prepare(`
        INSERT INTO game_admins (username, added_by, player_id, level) VALUES (?, ?, ?, 2)
        ON CONFLICT(username) DO UPDATE SET player_id = excluded.player_id
        WHERE game_admins.level = 2
      `).bind(account.username, staff.user.username, account.playerId).run();
      await audit(env.DB, staff.user.username, "add_admin", account.playerId, { username: account.username, level: 2 });
      return json(headers, { success: true, username: account.username, playerId: account.playerId, level: 2 }, 200);
    }
    await env.DB.prepare(`
      DELETE FROM game_admins
      WHERE level = 2 AND (player_id = ? OR username = ? COLLATE NOCASE)
    `).bind(account.playerId, account.username).run();
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

  if (action === "admin_set_vip") {
    if (staff.role !== "creator" && staff.role !== "admin") return json(headers, { success: false, error: "VIP выдают создатель и админы." }, 403);
    const targetKey = String(body.targetPlayerId || body.targetUsername || "").trim();
    const level = Math.max(0, Math.min(5, Math.floor(Number(body.level) || 0)));
    if (targetKey.length < 3) return json(headers, { success: false, error: "Укажите игрока." }, 400);
    const account = await env.DB.prepare(`
      SELECT username, player_id as playerId FROM user_accounts
      WHERE player_id = ? OR username = ? COLLATE NOCASE
      LIMIT 1
    `).bind(targetKey, targetKey).first();
    if (!account) return json(headers, { success: false, error: "Игрок с таким Cloud ID не найден." }, 404);
    await env.DB.prepare(`UPDATE user_accounts SET vip_level = ? WHERE player_id = ?`).bind(level, account.playerId).run();
    await audit(env.DB, staff.user.username, "set_vip", account.username, { level });
    return json(headers, {
      success: true,
      username: account.username,
      playerId: account.playerId,
      vipLevel: level
    }, 200);
  }

  return json(headers, { success: false, error: "Неизвестное действие." }, 404);
}

export function blankProgressSave(playerId, playerName, worldReset, seq) {
  const name = playerName || "Игрок";
  return {
    saveVersion: 5,
    worldReset,
    adminSeq: seq,
    resetProgress: true,
    feedCount: 0,
    washCount: 0,
    polishCount: 0,
    flushCount: 0,
    factories: [],
    talents: [],
    achievements: [],
    purchasedItems: [],
    knifeStats: [],
    knifeStars: {},
    hatLevels: {},
    game: {
      playerId,
      playerName: name,
      biomass: 0,
      cycleBiomass: 0,
      allTimeBiomass: 0,
      lifetimeBiomassInCurrentCycle: 0,
      breakthroughProgress: 0,
      biomassExpLevel: 0,
      sparkles: 20,
      prestigeRolls: 0,
      allTimePrestigeRolls: 0,
      transcendCycleRolls: 0,
      totalPrestiges: 0,
      flushCount: 0,
      breakthroughCount: 0,
      transcendPlungers: 0,
      totalTranscend: 0,
      phaseEcho: {},
      flushesThisCycle: 0,
      pairPlungersFromFlushes: 0,
      horizonSparks: 0,
      horizonUpgrades: { pace: 0, seal: 0 },
      evoStage: 0,
      archetype: "balanced",
      hunger: 100,
      clean: 100,
      happy: 100,
      autoFeed: false,
      autoWash: false,
      autoTickle: false,
      totalClicks: 0,
      lastFlushTime: 0,
      equippedHat: null,
      equippedKnife: null,
      equippedSkin: null,
      ownedSkins: [],
      peakForm: 1,
      meteorsCaught: 0,
      turboCount: 0,
      unlockedKnives: [],
      knifeStars: {},
      hatLevels: {},
      boutiqueLevels: {},
      casesOpened: 0,
      comboHeat: 0,
      turboRushTime: 0,
      turboStarMultTime: 0,
      autoclickerActive: false,
      autoclickerSpeed: 1,
      cloudAdminSeq: seq,
      worldReset,
      relics: {},
      ownedPerks: {},
      tutorialStepIndex: 0,
      currentQuestId: 1,
      tutorialCompleted: false,
      guildTickets: 0,
      clicksTowardsTicket: 0,
      vipPass: false,
      vipPassExpires: 0,
      transcendUpgrades: {
        cosmicSynergy: 0,
        autoCare: false,
        autoBuyer: false,
        passiveRolls: 0,
        omniMult: 0,
        afkCap: 0,
        knifeForge: 0,
        factoryOverdrive: 0,
        plungerIncubator: 0,
        meteorStorm: 0,
        evoBlessing: 0,
        autoEvolution: false,
        singularityRift: false
      }
    }
  };
}

export async function currentWorldReset(db) {
  const row = await db.prepare(`SELECT value FROM game_flags WHERE key = 'world_reset' LIMIT 1`).first();
  return Number(row?.value) || 0;
}

export async function wipePlayerProgress(db, playerId) {
  const row = await db.prepare(`
    SELECT player_name, admin_seq FROM player_saves WHERE player_id = ? LIMIT 1
  `).bind(playerId).first();
  const account = await db.prepare(`
    SELECT username FROM user_accounts WHERE player_id = ? LIMIT 1
  `).bind(playerId).first();
  const name = account?.username || row?.player_name || "Игрок";
  const seq = (Number(row?.admin_seq) || 0) + 1;
  const reset = await currentWorldReset(db);
  const save = blankProgressSave(playerId, name, reset, seq);
  await writePlayerSave(db, playerId, name, save, seq);
  return save;
}

export async function accountUsername(db, playerId) {
  if (!playerId) return "";
  const row = await db.prepare(`
    SELECT username FROM user_accounts WHERE player_id = ? LIMIT 1
  `).bind(playerId).first();
  const name = row?.username ? String(row.username).trim() : "";
  return name.substring(0, 32);
}

function usableName(name) {
  const clean = typeof name === "string" ? name.trim() : "";
  if (!clean || clean === "Игрок" || clean.startsWith("Игрок #") || clean.startsWith("Гость")) return "";
  return clean.substring(0, 32);
}

export async function vipLevelOf(db, playerId) {
  if (!playerId) return 0;
  try {
    const row = await db.prepare(`
      SELECT vip_level as vipLevel FROM user_accounts WHERE player_id = ? LIMIT 1
    `).bind(playerId).first();
    const level = Math.floor(Number(row?.vipLevel) || 0);
    return Math.max(0, Math.min(5, level));
  } catch (err) {
    return 0;
  }
}

export async function displayName(db, playerId, fallback) {
  const login = await accountUsername(db, playerId);
  if (login) return login;
  return usableName(fallback) || ("Игрок #" + String(playerId || "").slice(-4));
}

export async function wipeWorldProgress(db) {
  const next = (await currentWorldReset(db)) + 1;
  await db.prepare(`
    INSERT INTO game_flags (key, value) VALUES ('world_reset', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).bind(next).run();
  await db.prepare(`DELETE FROM player_saves`).run();
  await db.prepare(`DELETE FROM auth_sessions`).run();
  return next;
}

export async function replacementIfSeasonReset(db, playerId, playerName, saveData) {
  const reset = await currentWorldReset(db);
  if (reset <= 0) return null;
  const clientReset = Number(saveData?.worldReset ?? saveData?.game?.worldReset) || 0;
  if (clientReset === reset) return null;
  const name = await displayName(db, playerId, playerName);
  const save = blankProgressSave(playerId, name, reset, 1);
  await writePlayerSave(db, playerId, name, save, 1);
  return save;
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
