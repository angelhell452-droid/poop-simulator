// Cloudflare Worker with Static Assets & D1 Database
import { ensureAdminSchema, handleAdmin, issueSession, rejectStaleSave, sessionUser, isCreator, wipePlayerProgress, wipeWorldProgress, replacementIfSeasonReset, displayName, vipLevelOf } from "./workerAdmin.js";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

// Automatic self-healing schema creation if table does not exist
async function ensureSchema(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS player_saves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id TEXT NOT NULL UNIQUE,
        player_name TEXT DEFAULT 'Игрок',
        stage INTEGER NOT NULL DEFAULT 1,
        biomass REAL NOT NULL DEFAULT 0,
        sparkles INTEGER NOT NULL DEFAULT 0,
        prestige_currency INTEGER NOT NULL DEFAULT 0,
        save_data TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `).run();

    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_player_saves_biomass ON player_saves(biomass DESC);
    `).run();
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS user_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL COLLATE NOCASE UNIQUE,
        password_hash TEXT NOT NULL,
        player_id TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT (datetime('now')),
        last_login TEXT DEFAULT (datetime('now'))
      );
    `).run();

    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_user_accounts_username ON user_accounts(username);
    `).run();
    await ensureAdminSchema(db);
  } catch (err) {
    console.warn("Schema initialization notice:", err);
  }
}

async function handleCloudSave(req, env) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (!env || !env.DB) {
    return new Response(
      JSON.stringify({
        error: "D1 database binding 'DB' is missing. Please configure D1 database binding named 'DB' in Cloudflare Settings -> Bindings.",
      }),
      { status: 500, headers }
    );
  }

  try {
    await ensureSchema(env.DB);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const playerIdParam = url.searchParams.get("playerId");

    const adminResponse = await handleAdmin(req, env, headers, url);
    if (adminResponse) return adminResponse;

    // Own cloud wipe, or the creator wiping one account. A public playerId is not enough.
    if (action === "wipe" || action === "delete") {
      let targetId = playerIdParam;
      if (!targetId && req.method === "POST") {
        try {
          const body = await req.clone().json();
          targetId = body.playerId;
        } catch (e) { }
      }
      const actor = await sessionUser(env.DB, req);
      if (!actor) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
      }
      if (!targetId) {
        return new Response(JSON.stringify({ error: "Укажите игрока" }), { status: 400, headers });
      }
      const resolved = await env.DB.prepare(`
        SELECT player_id FROM user_accounts
        WHERE player_id = ? OR username = ? COLLATE NOCASE
        LIMIT 1
      `).bind(targetId, targetId).first();
      const resolvedId = resolved?.player_id || targetId;
      const saveRow = await env.DB.prepare(`SELECT player_id FROM player_saves WHERE player_id = ? LIMIT 1`).bind(resolvedId).first();
      if (!resolved && !saveRow) {
        return new Response(JSON.stringify({ error: "Игрок не найден" }), { status: 404, headers });
      }
      if (resolvedId === actor.playerId || await isCreator(env, actor)) {
        await wipePlayerProgress(env.DB, resolvedId);
        return new Response(JSON.stringify({ success: true, wiped: resolvedId }), { status: 200, headers });
      }
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers });
    }

    // Full season reset belongs to the creator session, not to a key in the source.
    if (action === "wipe_all") {
      const actor = await sessionUser(env.DB, req);
      if (actor && await isCreator(env, actor)) {
        const season = await wipeWorldProgress(env.DB);
        return new Response(JSON.stringify({ success: true, season }), { status: 200, headers });
      }
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers });
    }

    if (req.method === "POST") {
      const body = await req.json();

      // Action: Register user account
      if (action === "register" || body.action === "register") {
        const username = (body.username || "").trim();
        const passwordHash = (body.passwordHash || "").trim();
        const clientPlayerId = (body.playerId || "").trim();

        if (!username || username.length < 3 || username.length > 32) {
          return new Response(JSON.stringify({ success: false, error: "Логин должен содержать от 3 до 32 символов!" }), { status: 400, headers });
        }
        if (!passwordHash || passwordHash.length < 32) {
          return new Response(JSON.stringify({ success: false, error: "Некорректный пароль!" }), { status: 400, headers });
        }

        const existing = await env.DB.prepare(`SELECT id FROM user_accounts WHERE username = ? COLLATE NOCASE LIMIT 1`).bind(username).first();
        if (existing) {
          return new Response(JSON.stringify({ success: false, error: "Логин уже занят! Выберите другое имя." }), { status: 409, headers });
        }

        let finalPlayerId = clientPlayerId;
        if (finalPlayerId) {
          const idTaken = await env.DB.prepare(`SELECT id FROM user_accounts WHERE player_id = ? LIMIT 1`).bind(finalPlayerId).first();
          if (idTaken) finalPlayerId = "";
        }
        if (!finalPlayerId) {
          finalPlayerId = 'usr_' + (typeof crypto.randomUUID === 'function' ? crypto.randomUUID().replace(/-/g, '').slice(0, 16) : Math.random().toString(36).slice(2, 14));
        }

        await env.DB.prepare(`
          INSERT INTO user_accounts (username, password_hash, player_id, created_at, last_login)
          VALUES (?, ?, ?, datetime('now'), datetime('now'))
        `).bind(username, passwordHash, finalPlayerId).run();

        if (body.saveData) {
          const sData = body.saveData;
          const stage = Number(sData?.game?.evoStage !== undefined ? sData.game.evoStage + 1 : sData?.game?.stage) || 1;
          const biomass = Number(sData?.game?.allTimeBiomass ?? sData?.game?.biomass) || 0;
          const sparkles = Number(sData?.game?.sparkles) || 0;
          const prestigeCurrency = Number(sData?.game?.prestigeRolls ?? sData?.game?.prestigeCurrency) || 0;
          const jsonStr = typeof sData === "string" ? sData : JSON.stringify(sData);

          await env.DB.prepare(`
            INSERT INTO player_saves (player_id, player_name, stage, biomass, sparkles, prestige_currency, save_data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(player_id) DO UPDATE SET
              player_name = excluded.player_name,
              stage = excluded.stage,
              biomass = excluded.biomass,
              sparkles = excluded.sparkles,
              prestige_currency = excluded.prestige_currency,
              save_data = excluded.save_data,
              updated_at = datetime('now')
          `).bind(finalPlayerId, username, stage, biomass, sparkles, prestigeCurrency, jsonStr).run();
        }

        const sessionToken = await issueSession(env.DB, username);
        return new Response(JSON.stringify({
          success: true,
          username,
          playerId: finalPlayerId,
          sessionToken,
          message: "Аккаунт успешно создан!"
        }), { status: 200, headers });
      }

      // Action: Login user account
      if (action === "login" || body.action === "login") {
        const username = (body.username || "").trim();
        const passwordHash = (body.passwordHash || "").trim();

        if (!username || !passwordHash) {
          return new Response(JSON.stringify({ success: false, error: "Введите логин и пароль!" }), { status: 400, headers });
        }

        const account = await env.DB.prepare(`
          SELECT * FROM user_accounts WHERE username = ? COLLATE NOCASE LIMIT 1
        `).bind(username).first();

        if (!account) {
          return new Response(JSON.stringify({ success: false, error: "Пользователь с таким логином не найден!" }), { status: 404, headers });
        }

        if (account.password_hash !== passwordHash) {
          return new Response(JSON.stringify({ success: false, error: "Неверный пароль!" }), { status: 401, headers });
        }

        await env.DB.prepare(`
          UPDATE user_accounts SET last_login = datetime('now') WHERE id = ?
        `).bind(account.id).run();

        const saveRow = await env.DB.prepare(`
          SELECT * FROM player_saves WHERE player_id = ? LIMIT 1
        `).bind(account.player_id).first();

        let parsedSave = null;
        if (saveRow && saveRow.save_data) {
          try {
            parsedSave = typeof saveRow.save_data === 'string' ? JSON.parse(saveRow.save_data) : saveRow.save_data;
          } catch (e) {
            parsedSave = null;
          }
        }

        const sessionToken = await issueSession(env.DB, account.username);
        const vipLevel = await vipLevelOf(env.DB, account.player_id);
        return new Response(JSON.stringify({
          success: true,
          username: account.username,
          playerId: account.player_id,
          saveData: parsedSave,
          sessionToken,
          vipLevel,
          message: "Вход выполнен успешно!"
        }), { status: 200, headers });
      }

      const { playerId, playerName, saveData } = body;

      if (!playerId || !saveData) {
        return new Response(
          JSON.stringify({ error: "Missing playerId or saveData" }),
          { status: 400, headers }
        );
      }

      const owner = await env.DB.prepare(`SELECT username FROM user_accounts WHERE player_id = ? LIMIT 1`).bind(playerId).first();
      const actor = await sessionUser(env.DB, req);
      if (!owner || !actor || actor.playerId !== playerId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
      }

      const seasonName = await displayName(env.DB, playerId, playerName);
      const seasonSave = await replacementIfSeasonReset(env.DB, playerId, seasonName, saveData);
      if (seasonSave) {
        return new Response(JSON.stringify({ success: false, error: "stale_save", saveData: seasonSave }), { status: 409, headers });
      }

      const incomingSeq = Number(body.adminSeq ?? saveData?.adminSeq ?? saveData?.game?.cloudAdminSeq) || 0;
      const stale = await rejectStaleSave(env.DB, playerId, incomingSeq, headers);
      if (stale.response) return stale.response;
      const nextSeq = stale.current || 0;
      if (saveData && typeof saveData === "object") {
        saveData.adminSeq = nextSeq;
        if (saveData.game && typeof saveData.game === "object") saveData.game.cloudAdminSeq = nextSeq;
      }

      const stage = Number(saveData?.game?.evoStage !== undefined ? saveData.game.evoStage + 1 : saveData?.game?.stage) || 1;
      const biomass = Number(saveData?.game?.allTimeBiomass ?? saveData?.game?.biomass) || 0;
      const sparkles = Number(saveData?.game?.sparkles) || 0;
      const prestigeCurrency = Number(saveData?.game?.prestigeRolls ?? saveData?.game?.prestigeCurrency) || 0;
      const name = await displayName(env.DB, playerId, playerName);
      const jsonStr = typeof saveData === "string" ? saveData : JSON.stringify(saveData);

      await env.DB.prepare(`
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
      `).bind(playerId, name, stage, biomass, sparkles, prestigeCurrency, jsonStr, nextSeq).run();

      return new Response(
        JSON.stringify({
          success: true,
          timestamp: Date.now(),
          playerName: name,
          stage,
        }),
        { status: 200, headers }
      );
    }

    if (req.method === "GET") {
      const url = new URL(req.url);
      const playerId = url.searchParams.get("playerId");
      const action = url.searchParams.get("action");

      if (action === "session") {
        const user = await sessionUser(env.DB, req);
        if (!user) {
          return new Response(JSON.stringify({ online: false }), { status: 401, headers });
        }
        return new Response(JSON.stringify({
          online: true,
          username: user.username,
          playerId: user.playerId,
          vipLevel: await vipLevelOf(env.DB, user.playerId)
        }), { status: 200, headers });
      }

      if (action === "leaderboard") {
        return handleLeaderboard(url, env, headers);
      }

      // Handle account lookup
      if (action === "get_account" || action === "account") {
        if (!playerId) {
          return new Response(JSON.stringify({ success: false, error: "Missing playerId" }), { status: 400, headers });
        }
        const account = await env.DB.prepare(`
          SELECT username, player_id as playerId, created_at as createdAt, last_login as lastLogin
          FROM user_accounts WHERE player_id = ? LIMIT 1
        `).bind(playerId).first();

        return new Response(JSON.stringify({ success: true, account: account || null }), { status: 200, headers });
      }

      if (!playerId) {
        return new Response(
          JSON.stringify({ error: "Missing playerId param" }),
          { status: 400, headers }
        );
      }

      const record = await env.DB.prepare(`
        SELECT * FROM player_saves WHERE player_id = ? LIMIT 1
      `).bind(playerId).first();

      if (!record) {
        const fresh = await replacementIfSeasonReset(env.DB, playerId, "", null);
        if (fresh) {
          return new Response(JSON.stringify({ exists: true, data: fresh, wiped: true }), { status: 200, headers });
        }
        return new Response(
          JSON.stringify({ exists: false }),
          { status: 200, headers }
        );
      }

      let parsedData = null;
      try {
        parsedData = typeof record.save_data === "string" ? JSON.parse(record.save_data) : record.save_data;
      } catch (e) {
        parsedData = null;
      }

      const loginName = await displayName(env.DB, playerId, record.player_name);
      if (record.save_data && !parsedData) {
        return new Response(JSON.stringify({
          exists: true,
          parseError: true,
          playerName: loginName
        }), { status: 200, headers });
      }
      if (loginName && record.player_name !== loginName) {
        await env.DB.prepare(`UPDATE player_saves SET player_name = ? WHERE player_id = ?`).bind(loginName, playerId).run();
        if (parsedData?.game) parsedData.game.playerName = loginName;
      }

      const replaced = await replacementIfSeasonReset(env.DB, playerId, loginName, parsedData);
      if (replaced) {
        return new Response(JSON.stringify({ exists: true, data: replaced, wiped: true, playerName: loginName }), { status: 200, headers });
      }

      return new Response(
        JSON.stringify({
          exists: true,
          data: parsedData,
          updatedAt: record.updated_at,
          playerName: loginName,
          stage: record.stage,
          vipLevel: await vipLevelOf(env.DB, playerId)
        }),
        { status: 200, headers }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers }
    );
  } catch (err) {
    console.error("Cloudflare D1 error in worker:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Internal database error" }),
      { status: 500, headers }
    );
  }
}

function gloryScore(player) {
  const transcends = Number(player.transcends || 0);
  const plungers = Number(player.plungers || 0);
  const prestiges = Number(player.prestiges || 0);
  const rolls = Number(player.rolls || 0);
  const stage = Number(player.stage || 1);
  const bio = Number(player.biomass || 0);
  const logBio = bio > 1 ? Math.floor(Math.log10(bio) * 150) : 0;
  return Math.floor(
    (transcends * 25000) +
    (plungers * 100) +
    (prestiges * 500) +
    Math.min(rolls * 0.1, 50000) +
    (stage * 100) +
    logBio
  );
}

function byGlory(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  if (b.stage !== a.stage) return b.stage - a.stage;
  return String(a.playerId).localeCompare(String(b.playerId));
}

function publicLadderEntry(entry) {
  const { accountName, ...rest } = entry;
  return rest;
}

// The hall lists accounts only. A save with no user_accounts row is a guest and stays out.
export function accountLadder(ranked) {
  return ranked.filter((entry) => entry.accountName).sort(byGlory);
}

async function handleLeaderboard(url, env, headers) {
  const { results } = await env.DB.prepare(`
    SELECT
      player_saves.player_id as playerId,
      player_saves.player_name as playerName,
      player_saves.stage,
      player_saves.biomass,
      CAST(IFNULL(json_extract(player_saves.save_data, '$.game.totalTranscend'), 0) AS INTEGER) as transcends,
      CAST(IFNULL(json_extract(player_saves.save_data, '$.game.transcendPlungers'), 0) AS INTEGER) as plungers,
      CAST(IFNULL(json_extract(player_saves.save_data, '$.game.totalPrestiges'), 0) AS INTEGER) as prestiges,
      CAST(IFNULL(json_extract(player_saves.save_data, '$.game.allTimePrestigeRolls'), 0) AS INTEGER) as rolls,
      CAST(IFNULL(user_accounts.vip_level, 0) AS INTEGER) as vipLevel,
      user_accounts.username as accountName,
      player_saves.updated_at as updatedAt
    FROM player_saves
    INNER JOIN user_accounts ON user_accounts.player_id = player_saves.player_id
  `).all();

  const ranked = (results || []).map((row) => {
    const entry = {
      playerId: row.playerId,
      playerName: String(row.accountName || row.playerName || "Игрок"),
      stage: Number(row.stage) || 1,
      biomass: Number(row.biomass) || 0,
      transcends: Number(row.transcends) || 0,
      plungers: Number(row.plungers) || 0,
      prestiges: Number(row.prestiges) || 0,
      rolls: Number(row.rolls) || 0,
      vipLevel: Math.max(0, Math.min(5, Math.floor(Number(row.vipLevel) || 0))),
      accountName: row.accountName ? String(row.accountName) : "",
      updatedAt: row.updatedAt
    };
    entry.score = gloryScore(entry);
    return entry;
  }).sort(byGlory);

  const board = accountLadder(ranked);
  const top = board.slice(0, 50).map((entry, index) => ({ ...publicLadderEntry(entry), rank: index + 1 }));
  const viewerId = url.searchParams.get("playerId");
  const youIndex = viewerId ? board.findIndex((entry) => entry.playerId === viewerId) : -1;
  const viewer = viewerId ? ranked.find((entry) => entry.playerId === viewerId) : null;
  let you = null;
  if (youIndex >= 0) you = { ...publicLadderEntry(board[youIndex]), rank: youIndex + 1 };
  else if (viewer && !viewer.accountName) you = { guest: true, playerId: viewer.playerId, playerName: viewer.playerName };

  return new Response(
    JSON.stringify({ success: true, leaderboard: top, you, total: board.length }),
    { status: 200, headers }
  );
}

async function handleBugReport(request, env, headers) {
  const hook = env.DISCORD_WEBHOOK;
  if (!hook) {
    return new Response(JSON.stringify({ success: false, error: "not_configured" }), { status: 503, headers });
  }
  const body = await request.text();
  if (!body || body.length > 8000) {
    return new Response(JSON.stringify({ success: false, error: "bad_report" }), { status: 400, headers });
  }
  const discordRes = await fetch(hook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  });
  return new Response(
    JSON.stringify({ success: discordRes.ok }),
    { status: discordRes.ok ? 200 : 502, headers }
  );
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/cloud-save" || url.pathname === "/.netlify/functions/cloud-save") {
      return handleCloudSave(request, env);
    }

    if (url.pathname === "/api/bug-report" && request.method === "POST") {
      return handleBugReport(request, env, headers);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  }
};
