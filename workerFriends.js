// Friend graph lives in D1. The client never receives a raw save.
import { sessionUser } from "./workerAdmin.js";
import { inviteRight, tagsFor } from "./workerGuild.js";

const FRIEND_CAP = 50;
const PENDING_CAP = 20;
const ONLINE_MS = 5 * 60 * 1000;

function json(headers, payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers });
}

function cleanName(value) {
  return String(value || "").trim();
}

function jsonValue(raw) {
  if (raw == null || raw === "") return null;
  if (typeof raw === "object") return raw;
  const text = String(raw);
  try { return JSON.parse(text); } catch (err) { return text; }
}

function textId(raw) {
  const value = jsonValue(raw);
  if (typeof value !== "string") return "";
  const id = value.trim();
  if (!id || id.length > 80) return "";
  return id;
}

function bagNumber(raw, key) {
  const bag = jsonValue(raw);
  if (!bag || typeof bag !== "object") return 0;
  const n = Number(bag[key] ?? 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

function fresh(updatedAt) {
  if (!updatedAt) return false;
  const ts = Date.parse(String(updatedAt).replace(" ", "T") + "Z");
  return Number.isFinite(ts) && (Date.now() - ts) < ONLINE_MS && (Date.now() - ts) > -60000;
}

// Same weights as the hall of fame in worker.js. Plungers stay inside the score and are not sent out.
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

async function accountByName(db, username) {
  return db.prepare(`
    SELECT username, player_id as playerId
    FROM user_accounts
    WHERE username = ? COLLATE NOCASE
    LIMIT 1
  `).bind(username).first();
}

async function acceptedCount(db, playerId) {
  const row = await db.prepare(`
    SELECT COUNT(*) as n FROM friend_links
    WHERE status = 'accepted' AND (from_id = ? OR to_id = ?)
  `).bind(playerId, playerId).first();
  return Number(row?.n) || 0;
}

async function pendingIncoming(db, playerId) {
  const row = await db.prepare(`
    SELECT COUNT(*) as n FROM friend_links
    WHERE status = 'pending' AND to_id = ?
  `).bind(playerId).first();
  return Number(row?.n) || 0;
}

async function linkBetween(db, a, b) {
  return db.prepare(`
    SELECT id, from_id as fromId, to_id as toId, status
    FROM friend_links
    WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)
    LIMIT 1
  `).bind(a, b, b, a).first();
}

const CARD_SQL = `
  SELECT
    user_accounts.username as username,
    player_saves.stage as stage,
    player_saves.biomass as biomass,
    player_saves.updated_at as updatedAt,
    CAST(IFNULL(json_extract(player_saves.save_data, '$.game.peakForm'), 1) AS INTEGER) as peakForm,
    CAST(IFNULL(json_extract(player_saves.save_data, '$.game.totalPrestiges'), 0) AS INTEGER) as prestiges,
    CAST(IFNULL(json_extract(player_saves.save_data, '$.game.totalTranscend'), 0) AS INTEGER) as transcends,
    CAST(IFNULL(json_extract(player_saves.save_data, '$.game.transcendPlungers'), 0) AS INTEGER) as plungers,
    CAST(IFNULL(json_extract(player_saves.save_data, '$.game.allTimePrestigeRolls'), 0) AS INTEGER) as rolls,
    json_extract(player_saves.save_data, '$.game.equippedKnife') as knifeId,
    json_extract(player_saves.save_data, '$.game.equippedHat') as hatId,
    json_extract(player_saves.save_data, '$.game.equippedSkin') as skinId,
    json_extract(player_saves.save_data, '$.game.knifeStars') as knifeStars,
    json_extract(player_saves.save_data, '$.game.hatLevels') as hatLevels
  FROM user_accounts
  LEFT JOIN player_saves ON player_saves.player_id = user_accounts.player_id
  WHERE user_accounts.player_id = ?
  LIMIT 1
`;

function publicCard(row, slots) {
  const stage = Math.max(1, Number(row?.stage) || 1);
  const peakForm = Math.max(stage, Number(row?.peakForm) || 1);
  const knifeId = textId(row?.knifeId);
  const hatId = textId(row?.hatId);
  const skinId = textId(row?.skinId);
  const card = {
    username: String(row?.username || "Игрок"),
    stage,
    peakForm,
    prestiges: Math.max(0, Number(row?.prestiges) || 0),
    transcends: Math.max(0, Number(row?.transcends) || 0),
    score: gloryScore({
      transcends: row?.transcends,
      plungers: row?.plungers,
      prestiges: row?.prestiges,
      rolls: row?.rolls,
      stage,
      biomass: row?.biomass
    }),
    updatedAt: row?.updatedAt || null,
    online: fresh(row?.updatedAt),
    knife: null,
    hat: null,
    skin: null
  };
  if (slots) {
    if (knifeId) card.knife = { id: knifeId, stars: bagNumber(row?.knifeStars, knifeId) };
    if (hatId) card.hat = { id: hatId, level: Math.max(1, bagNumber(row?.hatLevels, hatId) || 1) };
    if (skinId) card.skin = { id: skinId };
  }
  return card;
}

function listCard(row) {
  const card = publicCard(row, false);
  return {
    username: card.username,
    stage: card.stage,
    peakForm: card.peakForm,
    updatedAt: card.updatedAt,
    online: card.online
  };
}

async function requireUser(db, req, headers) {
  const actor = await sessionUser(db, req);
  if (!actor) return { error: json(headers, { success: false, error: "Войдите в аккаунт" }, 401) };
  return { actor };
}

let friendSchemaReady = false;

/** Social Worker: tables already exist — skip DDL to stay under free CPU limits. */
export function trustFriendSchema() {
  friendSchemaReady = true;
}

export async function ensureFriendSchema(db) {
  if (friendSchemaReady) return;
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS friend_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_id TEXT NOT NULL,
      to_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `).run();
  await db.prepare(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_friend_links_pair ON friend_links(from_id, to_id);
  `).run();
  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_friend_links_to ON friend_links(to_id, status);
  `).run();
  friendSchemaReady = true;
}

export async function handleFriendPost(action, body, req, env, headers) {
  await ensureFriendSchema(env.DB);
  const gate = await requireUser(env.DB, req, headers);
  if (gate.error) return gate.error;
  const me = gate.actor.playerId;
  const username = cleanName(body?.username);
  if (username.length < 3 || username.length > 32) {
    return json(headers, { success: false, error: "Введите логин от 3 до 32 символов" }, 400);
  }
  const other = await accountByName(env.DB, username);
  if (!other) return json(headers, { success: false, error: "Игрок не найден" }, 404);
  if (other.playerId === me) return json(headers, { success: false, error: "Себя добавить нельзя" }, 400);

  if (action === "friend_request") return sendRequest(env.DB, headers, me, other);
  if (action === "friend_accept") return acceptRequest(env.DB, headers, me, other);
  if (action === "friend_decline" || action === "friend_cancel") return dropPending(env.DB, headers, me, other, action);
  if (action === "friend_remove") return removeFriend(env.DB, headers, me, other);
  return json(headers, { success: false, error: "Неизвестное действие" }, 400);
}

async function sendRequest(db, headers, me, other) {
  const existing = await linkBetween(db, me, other.playerId);
  if (existing?.status === "accepted") {
    return json(headers, { success: false, error: "Вы уже друзья" }, 409);
  }
  if (existing?.status === "pending" && existing.fromId === me) {
    return withRoster(db, headers, me, { pending: true, username: other.username });
  }
  if (existing?.status === "pending" && existing.toId === me) {
    return acceptRequest(db, headers, me, other);
  }
  if ((await acceptedCount(db, me)) >= FRIEND_CAP || (await acceptedCount(db, other.playerId)) >= FRIEND_CAP) {
    return json(headers, { success: false, error: "Список друзей заполнен" }, 409);
  }
  if ((await pendingIncoming(db, other.playerId)) >= PENDING_CAP) {
    return json(headers, { success: false, error: "У игрока слишком много заявок" }, 409);
  }
  await db.prepare(`
    INSERT INTO friend_links (from_id, to_id, status, created_at, updated_at)
    VALUES (?, ?, 'pending', datetime('now'), datetime('now'))
  `).bind(me, other.playerId).run();
  return withRoster(db, headers, me, { pending: true, username: other.username });
}

async function acceptRequest(db, headers, me, other) {
  const existing = await linkBetween(db, me, other.playerId);
  if (!existing || existing.status !== "pending" || existing.toId !== me) {
    if (existing?.status === "accepted") return withRoster(db, headers, me, { username: other.username });
    return json(headers, { success: false, error: "Заявки нет" }, 404);
  }
  if ((await acceptedCount(db, me)) >= FRIEND_CAP || (await acceptedCount(db, other.playerId)) >= FRIEND_CAP) {
    return json(headers, { success: false, error: "Список друзей заполнен" }, 409);
  }
  await db.prepare(`
    UPDATE friend_links SET status = 'accepted', updated_at = datetime('now') WHERE id = ?
  `).bind(existing.id).run();
  return withRoster(db, headers, me, { username: other.username });
}

async function dropPending(db, headers, me, other, action) {
  const existing = await linkBetween(db, me, other.playerId);
  if (!existing || existing.status !== "pending") {
    return json(headers, { success: false, error: "Заявки нет" }, 404);
  }
  const mine = action === "friend_cancel" ? existing.fromId === me : existing.toId === me;
  if (!mine) return json(headers, { success: false, error: "Заявки нет" }, 404);
  await db.prepare(`DELETE FROM friend_links WHERE id = ?`).bind(existing.id).run();
  return withRoster(db, headers, me, { username: other.username });
}

async function removeFriend(db, headers, me, other) {
  const existing = await linkBetween(db, me, other.playerId);
  if (!existing || existing.status !== "accepted") {
    return json(headers, { success: false, error: "Этого игрока нет в друзьях" }, 404);
  }
  await db.prepare(`
    DELETE FROM friend_links
    WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)
  `).bind(me, other.playerId, other.playerId, me).run();
  return withRoster(db, headers, me, { username: other.username });
}

export async function handleFriendGet(action, url, req, env, headers) {
  await ensureFriendSchema(env.DB);
  const gate = await requireUser(env.DB, req, headers);
  if (gate.error) return gate.error;
  const me = gate.actor.playerId;
  if (action === "friends") return listFriends(env.DB, headers, me);
  if (action === "friend_profile") return friendProfile(env.DB, headers, me, cleanName(url.searchParams.get("username")));
  return json(headers, { success: false, error: "Неизвестное действие" }, 400);
}

async function friendsPayload(db, me) {
  const { results } = await db.prepare(`
    SELECT
      links.status as status,
      links.from_id as fromId,
      links.to_id as toId,
      links.created_at as createdAt,
      accounts.player_id as otherId,
      accounts.username as username,
      IFNULL(saves.stage, 1) as stage,
      saves.updated_at as updatedAt,
      CAST(IFNULL(json_extract(saves.save_data, '$.game.peakForm'), 1) AS INTEGER) as peakForm
    FROM friend_links links
    JOIN user_accounts accounts
      ON accounts.player_id = CASE WHEN links.from_id = ? THEN links.to_id ELSE links.from_id END
    LEFT JOIN player_saves saves ON saves.player_id = accounts.player_id
    WHERE links.from_id = ? OR links.to_id = ?
  `).bind(me, me, me).all();

  const friends = [];
  const friendIds = [];
  const incoming = [];
  const outgoing = [];
  for (const row of results || []) {
    if (row.status === "accepted") {
      friends.push(listCard(row));
      friendIds.push(row.otherId);
    } else if (row.status === "pending" && row.toId === me) {
      incoming.push({ username: String(row.username), createdAt: row.createdAt || null });
    } else if (row.status === "pending" && row.fromId === me) {
      outgoing.push({ username: String(row.username), createdAt: row.createdAt || null });
    }
  }
  const tagMap = await tagsFor(db, friendIds);
  friends.forEach((friend, index) => {
    friend.guildTag = tagMap.get(friendIds[index]) || "";
  });
  friends.sort((a, b) => Number(b.online) - Number(a.online) || String(a.username).localeCompare(String(b.username)));
  return {
    friends,
    incoming,
    outgoing,
    canInvite: await inviteRight(db, me)
  };
}

async function listFriends(db, headers, me) {
  return json(headers, { success: true, ...(await friendsPayload(db, me)) });
}

async function withRoster(db, headers, me, extra = {}) {
  return json(headers, { success: true, ...(await friendsPayload(db, me)), ...extra });
}

async function friendProfile(db, headers, me, username) {
  if (username.length < 3 || username.length > 32) {
    return json(headers, { success: false, error: "Введите логин от 3 до 32 символов" }, 400);
  }
  const other = await accountByName(db, username);
  if (!other) return json(headers, { success: false, error: "Игрок не найден" }, 404);
  const self = other.playerId === me;
  if (!self) {
    const link = await linkBetween(db, me, other.playerId);
    if (!link || link.status !== "accepted") {
      return json(headers, { success: false, error: "Сначала станьте друзьями" }, 403);
    }
  }
  const row = await db.prepare(CARD_SQL).bind(other.playerId).first();
  const profile = publicCard(row || other, true);
  const tagMap = await tagsFor(db, [other.playerId]);
  profile.guildTag = tagMap.get(other.playerId) || "";
  return json(headers, { success: true, profile });
}
