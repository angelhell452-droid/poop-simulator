import { sessionUser } from "./workerAdmin.js";
import { GUILD_BOSSES, bossByIndex, bossReward, guildLevelFromPoints } from "./src/data/bosses.data.js";
import { bossClickCap, bossClickPower, bossMaxHp } from "./src/data/bossCombat.js";

const MEMBER_CAP = 20;
const APPLICATION_CAP = 10;
const STRIKE_MS = 15000;
const STRIKE_CD_MS = 3 * 60 * 60 * 1000;
const ATTEMPT_MS = 12 * 60 * 60 * 1000;
const TAG_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function json(headers, payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers });
}

function clean(value, max) {
  return String(value || "").trim().slice(0, max);
}

function changesOf(result) {
  return Number(result?.meta?.changes ?? result?.changes ?? 0);
}

function jsonValue(raw) {
  if (raw == null || raw === "") return null;
  if (typeof raw === "object") return raw;
  try { return JSON.parse(String(raw)); } catch (err) { return String(raw); }
}

function textId(raw) {
  const value = jsonValue(raw);
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

function bagNumber(raw, key) {
  const bag = jsonValue(raw);
  if (!bag || typeof bag !== "object") return 1;
  const n = Number(bag[key] ?? 1);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.floor(n);
}

function validTag(tag) {
  return /^[\p{L}\p{N}]{2,5}$/u.test(tag);
}

async function actorOf(db, req, headers) {
  const actor = await sessionUser(db, req);
  if (!actor) return { error: json(headers, { success: false, error: "Войдите в аккаунт" }, 401) };
  return { actor };
}

let guildSchemaReady = false;

/** Social Worker: tables already exist — skip DDL to stay under free CPU limits. */
export function trustGuildSchema() {
  guildSchemaReady = true;
}

export async function ensureGuildSchema(db) {
  if (guildSchemaReady) return;
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS guilds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      tag TEXT NOT NULL COLLATE NOCASE UNIQUE,
      points INTEGER NOT NULL DEFAULT 0,
      boss_index INTEGER NOT NULL DEFAULT 0,
      boss_circle INTEGER NOT NULL DEFAULT 1,
      boss_hp REAL NOT NULL DEFAULT 0,
      boss_max_hp REAL NOT NULL DEFAULT 0,
      boss_started_ms INTEGER NOT NULL DEFAULT 0,
      boss_deadline_ms INTEGER NOT NULL DEFAULT 0,
      tag_changed_ms INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `).run();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS guild_members (
      player_id TEXT PRIMARY KEY,
      guild_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      strike_open_ms INTEGER NOT NULL DEFAULT 0,
      strike_clicks INTEGER NOT NULL DEFAULT 0,
      strike_started_ms INTEGER NOT NULL DEFAULT 0,
      next_strike_ms INTEGER NOT NULL DEFAULT 0,
      joined_at TEXT DEFAULT (datetime('now'))
    );
  `).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_guild_members_guild ON guild_members(guild_id);`).run();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS guild_unlocks (
      guild_id INTEGER NOT NULL,
      boss_index INTEGER NOT NULL,
      clears INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, boss_index)
    );
  `).run();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS guild_hits (
      guild_id INTEGER NOT NULL,
      player_id TEXT NOT NULL,
      started_ms INTEGER NOT NULL,
      damage REAL NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, player_id, started_ms)
    );
  `).run();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS guild_boss_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id INTEGER NOT NULL,
      boss_index INTEGER NOT NULL,
      circle INTEGER NOT NULL,
      win INTEGER NOT NULL,
      damage REAL NOT NULL DEFAULT 0,
      hitters INTEGER NOT NULL DEFAULT 0,
      points INTEGER NOT NULL DEFAULT 0,
      plungers INTEGER NOT NULL DEFAULT 0,
      started_ms INTEGER NOT NULL,
      ended_ms INTEGER NOT NULL
    );
  `).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_guild_boss_log ON guild_boss_log(guild_id, id DESC);`).run();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS guild_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id INTEGER NOT NULL,
      player_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE (guild_id, player_id)
    );
  `).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_guild_applications_guild ON guild_applications(guild_id);`).run();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS guild_invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id INTEGER NOT NULL,
      from_id TEXT NOT NULL,
      to_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE (guild_id, to_id)
    );
  `).run();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS mail (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      plungers INTEGER NOT NULL DEFAULT 0,
      seen INTEGER NOT NULL DEFAULT 0,
      claimed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_mail_player ON mail(player_id, id DESC);`).run();
  try {
    await db.prepare(`ALTER TABLE guilds ADD COLUMN req_epoch INTEGER NOT NULL DEFAULT 1`).run();
  } catch (err) {
    const message = String(err?.message || err);
    if (!/duplicate column/i.test(message)) throw err;
  }
  guildSchemaReady = true;
}

function epochOfForm(form) {
  const clamped = Math.min(200 * 500, Math.max(1, Math.floor(Number(form) || 1)));
  return Math.floor((clamped - 1) / 500) + 1;
}

async function accountEpoch(db, playerId) {
  const row = await db.prepare(`
    SELECT stage, json_extract(save_data, '$.game.peakForm') as peak
    FROM player_saves WHERE player_id = ? LIMIT 1
  `).bind(playerId).first();
  const form = Math.max(Number(row?.stage) || 1, Number(row?.peak) || 1);
  return epochOfForm(form);
}

async function epochBlock(db, playerId, guild) {
  const need = Math.max(1, Math.min(200, Number(guild?.req_epoch) || 1));
  const have = await accountEpoch(db, playerId);
  if (have >= need) return "";
  return `Нужна эпоха ${need}. На аккаунте эпоха ${have}.`;
}

function strikePhase(guild, me, now = Date.now()) {
  const open = Number(me?.strikeOpenMs) || 0;
  const same = open > 0 && Number(me?.strikeStartedMs) === Number(guild?.boss_started_ms);
  if (same && now < open + STRIKE_MS) {
    return { phase: "hitting", windowUntilMs: open + STRIKE_MS, cdUntilMs: 0 };
  }
  const cd = Number(me?.nextStrikeMs) || 0;
  if (cd > now) return { phase: "cooldown", windowUntilMs: 0, cdUntilMs: cd };
  return { phase: "ready", windowUntilMs: 0, cdUntilMs: 0 };
}

function blowOf(gear, extra = {}) {
  return {
    perClick: bossClickPower(gear.stage, gear.knifeId, gear.stars),
    cap: bossClickCap(gear.knifeId, gear.stars),
    form: gear.stage,
    knifeId: gear.knifeId || "",
    stars: gear.stars,
    ...extra
  };
}

async function membership(db, playerId) {
  return db.prepare(`
    SELECT guild_id as guildId, role, strike_open_ms as strikeOpenMs, strike_clicks as strikeClicks,
      strike_started_ms as strikeStartedMs, next_strike_ms as nextStrikeMs
    FROM guild_members WHERE player_id = ? LIMIT 1
  `).bind(playerId).first();
}

async function guildRow(db, guildId) {
  return db.prepare(`SELECT * FROM guilds WHERE id = ? LIMIT 1`).bind(guildId).first();
}

async function memberCount(db, guildId) {
  const row = await db.prepare(`SELECT COUNT(*) as n FROM guild_members WHERE guild_id = ?`).bind(guildId).first();
  return Number(row?.n) || 0;
}

export async function inviteRight(db, playerId) {
  const row = await membership(db, playerId);
  return row?.role === "leader" || row?.role === "officer";
}

export async function presenceOf(db, playerId) {
  const row = await db.prepare(`
    SELECT guilds.tag as tag, guilds.points as points
    FROM guild_members
    JOIN guilds ON guilds.id = guild_members.guild_id
    WHERE guild_members.player_id = ?
    LIMIT 1
  `).bind(playerId).first();
  if (!row) return { level: 0, tag: "" };
  return { level: guildLevelFromPoints(row.points), tag: String(row.tag || "") };
}

export async function tagsFor(db, playerIds) {
  const ids = [...new Set((playerIds || []).filter(Boolean))];
  const map = new Map();
  if (!ids.length) return map;
  const marks = ids.map(() => "?").join(",");
  const { results } = await db.prepare(`
    SELECT guild_members.player_id as playerId, guilds.tag as tag
    FROM guild_members
    JOIN guilds ON guilds.id = guild_members.guild_id
    WHERE guild_members.player_id IN (${marks})
  `).bind(...ids).all();
  for (const row of results || []) map.set(row.playerId, String(row.tag || ""));
  return map;
}

async function accountByName(db, username) {
  return db.prepare(`
    SELECT username, player_id as playerId FROM user_accounts WHERE username = ? COLLATE NOCASE LIMIT 1
  `).bind(username).first();
}

async function gearOf(db, playerId) {
  const row = await db.prepare(`
    SELECT stage,
      json_extract(save_data, '$.game.equippedKnife') as knifeId,
      json_extract(save_data, '$.game.knifeStars') as knifeStars
    FROM player_saves WHERE player_id = ? LIMIT 1
  `).bind(playerId).first();
  const knifeId = textId(row?.knifeId);
  const stars = knifeId ? bagNumber(row?.knifeStars, knifeId) : 1;
  return {
    stage: Math.max(1, Number(row?.stage) || 1),
    knifeId,
    stars
  };
}

async function settleBoss(db, guild) {
  if (!guild || !Number(guild.boss_index)) return { guild, result: null };
  const now = Date.now();
  const hp = Number(guild.boss_hp) || 0;
  if (hp > 0 && now < Number(guild.boss_deadline_ms)) return { guild, result: null };
  const result = await finishAttempt(db, guild, hp <= 0);
  return { guild: await guildRow(db, guild.id), result };
}

async function finishAttempt(db, guild, win) {
  const index = Number(guild.boss_index) || 0;
  const circle = Number(guild.boss_circle) || 1;
  const started = Number(guild.boss_started_ms) || 0;
  const ended = Date.now();
  const boss = bossByIndex(index);
  const reward = bossReward(index, circle);
  if (win && boss) {
    const points = (Number(guild.points) || 0) + reward.points;
    await db.prepare(`UPDATE guilds SET points = ? WHERE id = ?`).bind(points, guild.id).run();
    await db.prepare(`
      UPDATE guild_unlocks SET clears = clears + 1 WHERE guild_id = ? AND boss_index = ?
    `).bind(guild.id, index).run();
    if (index < GUILD_BOSSES.length) {
      await db.prepare(`
        INSERT OR IGNORE INTO guild_unlocks (guild_id, boss_index, clears) VALUES (?, ?, 0)
      `).bind(guild.id, index + 1).run();
    }
  }
  const { results: members } = await db.prepare(`
    SELECT player_id as playerId FROM guild_members WHERE guild_id = ?
  `).bind(guild.id).all();
  const { results: hits } = await db.prepare(`
    SELECT player_id as playerId FROM guild_hits
    WHERE guild_id = ? AND started_ms = ? AND damage > 0
  `).bind(guild.id, started).all();
  const hitSum = await db.prepare(`
    SELECT COALESCE(SUM(damage), 0) as total, COUNT(*) as n
    FROM guild_hits
    WHERE guild_id = ? AND started_ms = ? AND damage > 0
  `).bind(guild.id, started).first();
  const hitters = new Set((hits || []).map((row) => row.playerId));
  const totalDamage = Number(hitSum?.total) || 0;
  const hitterCount = Number(hitSum?.n) || 0;
  if (index > 0) {
    await db.prepare(`
      INSERT INTO guild_boss_log (
        guild_id, boss_index, circle, win, damage, hitters, points, plungers, started_ms, ended_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      guild.id,
      index,
      circle,
      win ? 1 : 0,
      totalDamage,
      hitterCount,
      win ? reward.points : 0,
      win ? reward.plungers : 0,
      started,
      ended
    ).run();
  }
  const title = win ? "Победа" : "Проигрыш";
  const name = boss?.name || "Босс";
  const mailStmts = (members || []).map((member) => {
    const plungers = win && hitters.has(member.playerId) ? reward.plungers : 0;
    const body = !win
      ? `${title}. ${name}, круг ${circle}. Вантузов за проигрыш нет.`
      : plungers > 0
        ? `${title}. ${name}, круг ${circle}. В письме ${plungers} вантузов за ваш удар.`
        : `${title}. ${name}, круг ${circle}. Вы были в гильдии, но не били. Вантузов нет.`;
    return db.prepare(`
      INSERT INTO mail (player_id, kind, title, body, plungers, seen, claimed, created_at)
      VALUES (?, ?, ?, ?, ?, 0, 0, datetime('now'))
    `).bind(member.playerId, win ? "boss_win" : "boss_loss", title, body, plungers);
  });
  if (mailStmts.length) await db.batch(mailStmts);
  await db.prepare(`
    UPDATE guilds
    SET boss_index = 0, boss_circle = 1, boss_hp = 0, boss_max_hp = 0, boss_started_ms = 0, boss_deadline_ms = 0
    WHERE id = ?
  `).bind(guild.id).run();
  await db.prepare(`
    UPDATE guild_members SET strike_open_ms = 0, strike_clicks = 0, strike_started_ms = 0 WHERE guild_id = ?
  `).bind(guild.id).run();
  return {
    win: !!win,
    bossName: name,
    bossIcon: boss?.icon || "💀",
    bossId: boss?.id || "",
    circle,
    totalDamage,
    hitters: hitterCount,
    points: win ? reward.points : 0,
    plungers: win ? reward.plungers : 0,
    durationMs: Math.max(0, ended - started)
  };
}

function publicBoss(guild, me) {
  const boss = bossByIndex(guild.boss_index);
  if (!boss || !Number(guild.boss_index)) return null;
  return {
    index: boss.index,
    id: boss.id,
    name: boss.name,
    icon: boss.icon,
    circle: Number(guild.boss_circle) || 1,
    hp: Math.max(0, Number(guild.boss_hp) || 0),
    maxHp: Math.max(1, Number(guild.boss_max_hp) || 1),
    deadlineMs: Number(guild.boss_deadline_ms) || 0,
    ...strikePhase(guild, me)
  };
}

async function damageOf(db, guild, playerId) {
  const row = await db.prepare(`
    SELECT damage FROM guild_hits
    WHERE guild_id = ? AND player_id = ? AND started_ms = ? LIMIT 1
  `).bind(guild.id, playerId, guild.boss_started_ms).first();
  return Number(row?.damage) || 0;
}

async function rosterOf(db, guildId) {
  const { results } = await db.prepare(`
    SELECT boss_index as bossIndex, clears FROM guild_unlocks WHERE guild_id = ?
  `).bind(guildId).all();
  const known = new Map((results || []).map((row) => [Number(row.bossIndex), Number(row.clears) || 0]));
  return GUILD_BOSSES.map((boss) => {
    const unlocked = known.has(boss.index);
    const clears = known.get(boss.index) || 0;
    const circle = clears + 1;
    const reward = bossReward(boss.index, circle);
    return {
      index: boss.index,
      id: boss.id,
      name: boss.name,
      icon: boss.icon,
      unlocked,
      clears,
      circle,
      points: reward.points,
      plungers: reward.plungers
    };
  });
}

async function journalOf(db, guildId) {
  const { results } = await db.prepare(`
    SELECT id, boss_index as bossIndex, circle, win, damage, hitters, points, plungers,
           started_ms as startedMs, ended_ms as endedMs
    FROM guild_boss_log
    WHERE guild_id = ?
    ORDER BY id DESC
    LIMIT 40
  `).bind(guildId).all();
  return (results || []).map((row) => {
    const boss = bossByIndex(row.bossIndex);
    return {
      id: Number(row.id) || 0,
      index: Number(row.bossIndex) || 0,
      bossId: boss?.id || "",
      name: boss?.name || "Босс",
      icon: boss?.icon || "⚔️",
      circle: Number(row.circle) || 1,
      win: !!Number(row.win),
      damage: Number(row.damage) || 0,
      hitters: Number(row.hitters) || 0,
      points: Number(row.points) || 0,
      plungers: Number(row.plungers) || 0,
      endedMs: Number(row.endedMs) || 0
    };
  });
}

async function viewOf(db, playerId) {
  let member = await membership(db, playerId);
  let guild = member ? await guildRow(db, member.guildId) : null;
  if (guild) {
    const settled = await settleBoss(db, guild);
    guild = settled.guild;
  }
  member = await membership(db, playerId);
  const invites = await incomingInvites(db, playerId);
  if (!guild || !member) {
    return { guild: null, invites, presence: { level: 0, tag: "" } };
  }
  const { results: people } = await db.prepare(`
    SELECT accounts.username as username, members.role as role
    FROM guild_members members
    JOIN user_accounts accounts ON accounts.player_id = members.player_id
    WHERE members.guild_id = ?
    ORDER BY CASE members.role WHEN 'leader' THEN 0 WHEN 'officer' THEN 1 ELSE 2 END, accounts.username
  `).bind(guild.id).all();
  const canLead = member.role === "leader";
  const canInvite = canLead || member.role === "officer";
  const applications = canInvite ? await applicationsOf(db, guild.id) : [];
  return {
    presence: { level: guildLevelFromPoints(guild.points), tag: String(guild.tag || "") },
    invites,
    guild: {
      id: guild.id,
      name: guild.name,
      tag: guild.tag,
      level: guildLevelFromPoints(guild.points),
      points: Number(guild.points) || 0,
      role: member.role,
      canInvite,
      canSummon: canInvite,
      canLead,
      reqEpoch: Math.max(1, Number(guild.req_epoch) || 1),
      applications,
      boss: await bossView(db, guild, member, playerId),
      roster: await rosterOf(db, guild.id),
      journal: await journalOf(db, guild.id),
      members: (people || []).map((row) => ({ username: row.username, role: row.role }))
    }
  };
}

async function bossView(db, guild, member, playerId) {
  const boss = publicBoss(guild, member);
  if (!boss) return null;
  const gear = await gearOf(db, playerId);
  return {
    ...boss,
    blow: blowOf(gear, {
      myDamage: await damageOf(db, guild, playerId),
      clicks: Number(member?.strikeClicks) || 0
    })
  };
}

async function applicationsOf(db, guildId) {
  const { results } = await db.prepare(`
    SELECT accounts.username as username
    FROM guild_applications apps
    JOIN user_accounts accounts ON accounts.player_id = apps.player_id
    WHERE apps.guild_id = ?
    ORDER BY apps.id
  `).bind(guildId).all();
  return (results || []).map((row) => ({ username: row.username }));
}

async function clearJoinQueue(db, playerId) {
  await db.prepare(`DELETE FROM guild_invites WHERE to_id = ?`).bind(playerId).run();
  await db.prepare(`DELETE FROM guild_applications WHERE player_id = ?`).bind(playerId).run();
}

async function listGuilds(db, headers, playerId, query, levelRaw) {
  const needle = clean(query, 24).toLocaleLowerCase("ru");
  const level = Math.floor(Number(levelRaw));
  const wantLevel = Number.isFinite(level) && level >= 1 && level <= 25 ? level : 0;
  const { results } = await db.prepare(`
    SELECT guilds.id as id, guilds.name as name, guilds.tag as tag, guilds.points as points,
      guilds.req_epoch as reqEpoch,
      (SELECT COUNT(*) FROM guild_members members WHERE members.guild_id = guilds.id) as members
    FROM guilds
    ORDER BY guilds.points DESC, members DESC, guilds.name
    LIMIT 200
  `).all();
  const { results: mine } = await db.prepare(`
    SELECT guild_id as guildId FROM guild_applications WHERE player_id = ?
  `).bind(playerId).all();
  const applied = new Set((mine || []).map((row) => Number(row.guildId)));
  const guilds = (results || []).filter((row) => {
    const named = !needle
      || String(row.name || "").toLocaleLowerCase("ru").includes(needle)
      || String(row.tag || "").toLocaleLowerCase("ru").includes(needle);
    const leveled = !wantLevel || guildLevelFromPoints(row.points) === wantLevel;
    return named && leveled;
  }).slice(0, 40).map((row) => ({
    id: row.id,
    name: row.name,
    tag: row.tag,
    level: guildLevelFromPoints(row.points),
    reqEpoch: Math.max(1, Number(row.reqEpoch) || 1),
    members: Number(row.members) || 0,
    cap: MEMBER_CAP,
    applied: applied.has(Number(row.id))
  }));
  return json(headers, { success: true, guilds });
}

async function incomingInvites(db, playerId) {
  const { results } = await db.prepare(`
    SELECT invites.id as id, invites.guild_id as guildId, guilds.name as name, guilds.tag as tag, accounts.username as fromName
    FROM guild_invites invites
    JOIN guilds ON guilds.id = invites.guild_id
    JOIN user_accounts accounts ON accounts.player_id = invites.from_id
    WHERE invites.to_id = ?
  `).bind(playerId).all();
  return (results || []).map((row) => ({
    id: row.id,
    guildId: row.guildId,
    name: row.name,
    tag: row.tag,
    fromName: row.fromName
  }));
}

export async function handleGuildPost(action, body, req, env, headers) {
  await ensureGuildSchema(env.DB);
  const gate = await actorOf(env.DB, req, headers);
  if (gate.error) return gate.error;
  const me = gate.actor.playerId;
  if (action === "guild_create") return createGuild(env.DB, headers, me, body);
  if (action === "guild_invite") return invite(env.DB, headers, me, clean(body?.username, 32));
  if (action === "guild_apply") return applyGuild(env.DB, headers, me, Number(body?.guildId));
  if (action === "guild_apply_cancel") return cancelApply(env.DB, headers, me, Number(body?.guildId));
  if (action === "guild_apply_accept") return acceptApply(env.DB, headers, me, clean(body?.username, 32));
  if (action === "guild_apply_decline") return declineApply(env.DB, headers, me, clean(body?.username, 32));
  if (action === "guild_accept") return acceptInvite(env.DB, headers, me, Number(body?.guildId));
  if (action === "guild_decline") return declineInvite(env.DB, headers, me, Number(body?.guildId));
  if (action === "guild_kick") return kick(env.DB, headers, me, clean(body?.username, 32));
  if (action === "guild_role") return setRole(env.DB, headers, me, clean(body?.username, 32), clean(body?.role, 16));
  if (action === "guild_leave") return leave(env.DB, headers, me);
  if (action === "guild_disband") return disband(env.DB, headers, me);
  if (action === "guild_tag") return renameTag(env.DB, headers, me, clean(body?.tag, 5));
  if (action === "guild_gate") return setGate(env.DB, headers, me, body?.epoch);
  if (action === "guild_summon") return summon(env.DB, headers, me, Number(body?.bossIndex));
  if (action === "guild_strike") return strike(env.DB, headers, me, Number(body?.clicks));
  if (action === "mail_claim") return claimMail(env.DB, headers, me, Number(body?.id));
  return json(headers, { success: false, error: "Неизвестное действие" }, 400);
}

export async function handleGuildGet(action, req, env, headers) {
  await ensureGuildSchema(env.DB);
  const gate = await actorOf(env.DB, req, headers);
  if (gate.error) return gate.error;
  if (action === "guild") {
    const view = await viewOf(env.DB, gate.actor.playerId);
    return json(headers, { success: true, ...view });
  }
  if (action === "guild_list") {
    const url = new URL(req.url);
    return listGuilds(env.DB, headers, gate.actor.playerId, url.searchParams.get("q") || "", url.searchParams.get("level") || "");
  }
  if (action === "mail") return listMail(env.DB, headers, gate.actor.playerId);
  return json(headers, { success: false, error: "Неизвестное действие" }, 400);
}

async function createGuild(db, headers, me, body) {
  if (await membership(db, me)) return json(headers, { success: false, error: "Вы уже в гильдии" }, 409);
  const name = clean(body?.name, 24);
  const tag = clean(body?.tag, 5);
  if (name.length < 3) return json(headers, { success: false, error: "Название от 3 символов" }, 400);
  if (!validTag(tag)) return json(headers, { success: false, error: "Титул: 2–5 букв или цифр" }, 400);
  const taken = await db.prepare(`SELECT id FROM guilds WHERE tag = ? COLLATE NOCASE LIMIT 1`).bind(tag).first();
  if (taken) return json(headers, { success: false, error: "Такой титул уже занят" }, 409);
  const inserted = await db.prepare(`
    INSERT INTO guilds (name, tag, points, tag_changed_ms) VALUES (?, ?, 0, ?)
  `).bind(name, tag, Date.now()).run();
  const guildId = Number(inserted?.meta?.last_row_id ?? inserted?.lastInsertRowid ?? 0);
  const created = guildId
    ? { id: guildId }
    : await db.prepare(`SELECT id FROM guilds WHERE tag = ? COLLATE NOCASE LIMIT 1`).bind(tag).first();
  await db.prepare(`
    INSERT INTO guild_members (player_id, guild_id, role) VALUES (?, ?, 'leader')
  `).bind(me, created.id).run();
  await db.prepare(`
    INSERT INTO guild_unlocks (guild_id, boss_index, clears) VALUES (?, 1, 0)
  `).bind(created.id).run();
  await clearJoinQueue(db, me);
  return json(headers, { success: true, ...(await viewOf(db, me)) });
}

async function invite(db, headers, me, username) {
  const mine = await membership(db, me);
  if (!mine || (mine.role !== "leader" && mine.role !== "officer")) {
    return json(headers, { success: false, error: "Приглашать могут глава и офицер" }, 403);
  }
  const other = await accountByName(db, username);
  if (!other) return json(headers, { success: false, error: "Игрок не найден" }, 404);
  if (other.playerId === me) return json(headers, { success: false, error: "Себя пригласить нельзя" }, 400);
  if (await membership(db, other.playerId)) return json(headers, { success: false, error: "Игрок уже в гильдии" }, 409);
  if ((await memberCount(db, mine.guildId)) >= MEMBER_CAP) {
    return json(headers, { success: false, error: "В гильдии нет места" }, 409);
  }
  await db.prepare(`
    INSERT INTO guild_invites (guild_id, from_id, to_id, created_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(guild_id, to_id) DO NOTHING
  `).bind(mine.guildId, me, other.playerId).run();
  return json(headers, { success: true, username: other.username });
}

async function acceptInvite(db, headers, me, guildId) {
  if (await membership(db, me)) return json(headers, { success: false, error: "Вы уже в гильдии" }, 409);
  const invite = await db.prepare(`
    SELECT id FROM guild_invites WHERE guild_id = ? AND to_id = ? LIMIT 1
  `).bind(guildId, me).first();
  if (!invite) return json(headers, { success: false, error: "Приглашения нет" }, 404);
  const guild = await guildRow(db, guildId);
  const blocked = await epochBlock(db, me, guild);
  if (blocked) return json(headers, { success: false, error: blocked }, 403);
  if ((await memberCount(db, guildId)) >= MEMBER_CAP) {
    return json(headers, { success: false, error: "В гильдии нет места" }, 409);
  }
  await db.prepare(`INSERT INTO guild_members (player_id, guild_id, role) VALUES (?, ?, 'member')`).bind(me, guildId).run();
  await clearJoinQueue(db, me);
  return json(headers, { success: true, ...(await viewOf(db, me)) });
}

async function applyGuild(db, headers, me, guildId) {
  if (await membership(db, me)) return json(headers, { success: false, error: "Вы уже в гильдии" }, 409);
  const guild = await guildRow(db, guildId);
  if (!guild) return json(headers, { success: false, error: "Гильдия не найдена" }, 404);
  if ((await memberCount(db, guildId)) >= MEMBER_CAP) {
    return json(headers, { success: false, error: "В гильдии нет места" }, 409);
  }
  const blocked = await epochBlock(db, me, guild);
  if (blocked) return json(headers, { success: false, error: blocked }, 403);
  const pending = await db.prepare(`
    SELECT COUNT(*) as n FROM guild_applications WHERE player_id = ?
  `).bind(me).first();
  const already = await db.prepare(`
    SELECT id FROM guild_applications WHERE guild_id = ? AND player_id = ? LIMIT 1
  `).bind(guildId, me).first();
  if (!already && (Number(pending?.n) || 0) >= APPLICATION_CAP) {
    return json(headers, { success: false, error: "Слишком много заявок" }, 409);
  }
  await db.prepare(`
    INSERT INTO guild_applications (guild_id, player_id, created_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(guild_id, player_id) DO NOTHING
  `).bind(guildId, me).run();
  return json(headers, { success: true });
}

async function cancelApply(db, headers, me, guildId) {
  await db.prepare(`DELETE FROM guild_applications WHERE guild_id = ? AND player_id = ?`).bind(guildId, me).run();
  return json(headers, { success: true });
}

async function acceptApply(db, headers, me, username) {
  const mine = await membership(db, me);
  if (!mine || (mine.role !== "leader" && mine.role !== "officer")) {
    return json(headers, { success: false, error: "Заявки принимают глава и офицер" }, 403);
  }
  const other = await accountByName(db, username);
  if (!other) return json(headers, { success: false, error: "Игрок не найден" }, 404);
  const application = await db.prepare(`
    SELECT id FROM guild_applications WHERE guild_id = ? AND player_id = ? LIMIT 1
  `).bind(mine.guildId, other.playerId).first();
  if (!application) return json(headers, { success: false, error: "Заявки нет" }, 404);
  if (await membership(db, other.playerId)) {
    await db.prepare(`DELETE FROM guild_applications WHERE player_id = ?`).bind(other.playerId).run();
    return json(headers, { success: false, error: "Игрок уже в гильдии" }, 409);
  }
  if ((await memberCount(db, mine.guildId)) >= MEMBER_CAP) {
    return json(headers, { success: false, error: "В гильдии нет места" }, 409);
  }
  const guild = await guildRow(db, mine.guildId);
  const blocked = await epochBlock(db, other.playerId, guild);
  if (blocked) return json(headers, { success: false, error: blocked }, 403);
  await db.prepare(`INSERT INTO guild_members (player_id, guild_id, role) VALUES (?, ?, 'member')`).bind(other.playerId, mine.guildId).run();
  await clearJoinQueue(db, other.playerId);
  return json(headers, { success: true, ...(await viewOf(db, me)) });
}

async function declineApply(db, headers, me, username) {
  const mine = await membership(db, me);
  if (!mine || (mine.role !== "leader" && mine.role !== "officer")) {
    return json(headers, { success: false, error: "Заявки принимают глава и офицер" }, 403);
  }
  const other = await accountByName(db, username);
  if (!other) return json(headers, { success: false, error: "Игрок не найден" }, 404);
  await db.prepare(`
    DELETE FROM guild_applications WHERE guild_id = ? AND player_id = ?
  `).bind(mine.guildId, other.playerId).run();
  return json(headers, { success: true, ...(await viewOf(db, me)) });
}

async function declineInvite(db, headers, me, guildId) {
  await db.prepare(`DELETE FROM guild_invites WHERE guild_id = ? AND to_id = ?`).bind(guildId, me).run();
  return json(headers, { success: true });
}

async function kick(db, headers, me, username) {
  const mine = await membership(db, me);
  if (!mine || (mine.role !== "leader" && mine.role !== "officer")) {
    return json(headers, { success: false, error: "Недостаточно прав" }, 403);
  }
  const other = await accountByName(db, username);
  if (!other) return json(headers, { success: false, error: "Игрок не найден" }, 404);
  const theirs = await membership(db, other.playerId);
  if (!theirs || theirs.guildId !== mine.guildId) return json(headers, { success: false, error: "Этого игрока нет в гильдии" }, 404);
  if (theirs.role === "leader") return json(headers, { success: false, error: "Главу нельзя выгнать" }, 403);
  if (mine.role === "officer" && theirs.role !== "member") {
    return json(headers, { success: false, error: "Офицер выгоняет только участников" }, 403);
  }
  await db.prepare(`DELETE FROM guild_members WHERE player_id = ?`).bind(other.playerId).run();
  return json(headers, { success: true, ...(await viewOf(db, me)) });
}

async function setRole(db, headers, me, username, role) {
  if (role !== "officer" && role !== "member" && role !== "leader") {
    return json(headers, { success: false, error: "Неизвестная роль" }, 400);
  }
  const mine = await membership(db, me);
  if (!mine || mine.role !== "leader") return json(headers, { success: false, error: "Это может глава" }, 403);
  const other = await accountByName(db, username);
  if (!other || other.playerId === me) return json(headers, { success: false, error: "Игрок не найден" }, 404);
  const theirs = await membership(db, other.playerId);
  if (!theirs || theirs.guildId !== mine.guildId) return json(headers, { success: false, error: "Этого игрока нет в гильдии" }, 404);
  if (role === "leader") {
    await db.prepare(`UPDATE guild_members SET role = 'member' WHERE player_id = ?`).bind(me).run();
    await db.prepare(`UPDATE guild_members SET role = 'leader' WHERE player_id = ?`).bind(other.playerId).run();
  } else {
    await db.prepare(`UPDATE guild_members SET role = ? WHERE player_id = ?`).bind(role, other.playerId).run();
  }
  return json(headers, { success: true, ...(await viewOf(db, me)) });
}

async function leave(db, headers, me) {
  const mine = await membership(db, me);
  if (!mine) return json(headers, { success: false, error: "Вы не в гильдии" }, 404);
  if (mine.role === "leader") {
    if ((await memberCount(db, mine.guildId)) > 1) {
      return json(headers, { success: false, error: "Сначала передайте главу" }, 409);
    }
    return disband(db, headers, me);
  }
  await db.prepare(`DELETE FROM guild_members WHERE player_id = ?`).bind(me).run();
  return json(headers, { success: true, guild: null, presence: { level: 0, tag: "" } });
}

async function disband(db, headers, me) {
  const mine = await membership(db, me);
  if (!mine || mine.role !== "leader") return json(headers, { success: false, error: "Распустить может глава" }, 403);
  const id = mine.guildId;
  await db.prepare(`DELETE FROM guild_members WHERE guild_id = ?`).bind(id).run();
  await db.prepare(`DELETE FROM guild_invites WHERE guild_id = ?`).bind(id).run();
  await db.prepare(`DELETE FROM guild_applications WHERE guild_id = ?`).bind(id).run();
  await db.prepare(`DELETE FROM guild_unlocks WHERE guild_id = ?`).bind(id).run();
  await db.prepare(`DELETE FROM guild_hits WHERE guild_id = ?`).bind(id).run();
  await db.prepare(`DELETE FROM guild_boss_log WHERE guild_id = ?`).bind(id).run();
  await db.prepare(`DELETE FROM guilds WHERE id = ?`).bind(id).run();
  return json(headers, { success: true, guild: null, presence: { level: 0, tag: "" } });
}

async function renameTag(db, headers, me, tag) {
  const mine = await membership(db, me);
  if (!mine || mine.role !== "leader") return json(headers, { success: false, error: "Титул меняет глава" }, 403);
  if (!validTag(tag)) return json(headers, { success: false, error: "Титул: 2–5 букв или цифр" }, 400);
  const guild = await guildRow(db, mine.guildId);
  if (Date.now() - Number(guild?.tag_changed_ms || 0) < TAG_COOLDOWN_MS && String(guild.tag).toLowerCase() !== tag.toLowerCase()) {
    return json(headers, { success: false, error: "Титул можно сменить раз в сутки" }, 409);
  }
  const taken = await db.prepare(`SELECT id FROM guilds WHERE tag = ? COLLATE NOCASE AND id <> ? LIMIT 1`).bind(tag, mine.guildId).first();
  if (taken) return json(headers, { success: false, error: "Такой титул уже занят" }, 409);
  await db.prepare(`UPDATE guilds SET tag = ?, tag_changed_ms = ? WHERE id = ?`).bind(tag, Date.now(), mine.guildId).run();
  return json(headers, { success: true, ...(await viewOf(db, me)) });
}

async function summon(db, headers, me, bossIndex) {
  const mine = await membership(db, me);
  if (!mine || (mine.role !== "leader" && mine.role !== "officer")) {
    return json(headers, { success: false, error: "Босса вызывают глава и офицер" }, 403);
  }
  let guild = (await settleBoss(db, await guildRow(db, mine.guildId))).guild;
  if (Number(guild.boss_index)) return json(headers, { success: false, error: "Сначала закончите текущего босса" }, 409);
  const boss = bossByIndex(bossIndex);
  if (!boss) return json(headers, { success: false, error: "Такого босса нет" }, 404);
  const unlock = await db.prepare(`
    SELECT clears FROM guild_unlocks WHERE guild_id = ? AND boss_index = ? LIMIT 1
  `).bind(guild.id, boss.index).first();
  if (!unlock) return json(headers, { success: false, error: "Этот босс ещё закрыт" }, 403);
  const circle = (Number(unlock.clears) || 0) + 1;
  const now = Date.now();
  const hp = bossMaxHp(boss.index, circle, await memberCount(db, guild.id));
  await db.prepare(`
    UPDATE guilds
    SET boss_index = ?, boss_circle = ?, boss_hp = ?, boss_max_hp = ?, boss_started_ms = ?, boss_deadline_ms = ?
    WHERE id = ?
  `).bind(boss.index, circle, hp, hp, now, now + ATTEMPT_MS, guild.id).run();
  return json(headers, { success: true, ...(await viewOf(db, me)) });
}

async function strike(db, headers, me, reported) {
  const mine = await membership(db, me);
  if (!mine) return json(headers, { success: false, error: "Вы не в гильдии" }, 404);
  const live = await guildRow(db, mine.guildId);
  const settled = await settleBoss(db, live);
  let guild = settled.guild;
  if (settled.result) {
    const gear = await gearOf(db, me);
    const myDamage = await damageOf(db, live, me);
    const clicks = Number(mine.strikeClicks) || 0;
    return json(headers, {
      success: true,
      mailReady: true,
      fight: {
        ended: settled.result.win ? "win" : "loss",
        result: {
          ...settled.result,
          kind: settled.result.win ? "win" : "loss",
          myDamage,
          myClicks: clicks,
          myPlungers: settled.result.win && myDamage > 0 ? settled.result.plungers : 0,
          perClick: bossClickPower(gear.stage, gear.knifeId, gear.stars),
          cap: bossClickCap(gear.knifeId, gear.stars)
        }
      }
    });
  }
  if (!Number(guild.boss_index)) return json(headers, { success: false, error: "Босс не вызван" }, 409);
  const fresh = await membership(db, me);
  const now = Date.now();
  let openMs = Number(fresh.strikeOpenMs) || 0;
  let clicks = Number(fresh.strikeClicks) || 0;
  const windowExpired = openMs > 0
    && Number(fresh.strikeStartedMs) === Number(guild.boss_started_ms)
    && now > openMs + STRIKE_MS;
  if (!openMs || fresh.strikeStartedMs !== guild.boss_started_ms || windowExpired) {
    if (windowExpired && clicks > 0) {
      const gear = await gearOf(db, me);
      const boss = bossByIndex(guild.boss_index);
      return json(headers, {
        success: true,
        fight: {
          ended: "window",
          result: {
            win: false,
            kind: "window",
            bossName: boss?.name || "Босс",
            bossIcon: boss?.icon || "💀",
            bossId: boss?.id || "",
            circle: Number(guild.boss_circle) || 1,
            totalDamage: 0,
            hitters: 0,
            points: 0,
            plungers: 0,
            myDamage: await damageOf(db, guild, me),
            myClicks: clicks,
            myPlungers: 0,
            perClick: bossClickPower(gear.stage, gear.knifeId, gear.stars),
            cap: bossClickCap(gear.knifeId, gear.stars),
            durationMs: STRIKE_MS
          },
          ...publicBoss(guild, fresh)
        }
      });
    }
    if (now < Number(fresh.nextStrikeMs || 0)) {
      const gear = await gearOf(db, me);
      const boss = publicBoss(guild, fresh);
      return json(headers, {
        success: true,
        fight: {
          ...boss,
          blow: blowOf(gear, {
            myDamage: await damageOf(db, guild, me),
            clicks: Number(fresh.strikeClicks) || 0
          })
        }
      });
    }
    openMs = now;
    clicks = 0;
    await db.prepare(`
      UPDATE guild_members
      SET strike_open_ms = ?, strike_clicks = 0, strike_started_ms = ?, next_strike_ms = ?
      WHERE player_id = ?
    `).bind(openMs, guild.boss_started_ms, openMs + STRIKE_MS + STRIKE_CD_MS, me).run();
  }
  const gear = await gearOf(db, me);
  const cap = bossClickCap(gear.knifeId, gear.stars);
  const elapsed = Math.min(STRIKE_MS, Math.max(0, now - openMs)) / 1000;
  const allowed = Math.floor(cap * elapsed);
  const want = Math.max(0, Math.min(Math.floor(reported) || 0, allowed));
  const add = want - clicks;
  if (add > 0) {
    const tick = add * bossClickPower(gear.stage, gear.knifeId, gear.stars);
    const hp = Math.max(0, (Number(guild.boss_hp) || 0) - tick);
    await db.prepare(`UPDATE guilds SET boss_hp = ? WHERE id = ?`).bind(hp, guild.id).run();
    await db.prepare(`UPDATE guild_members SET strike_clicks = ? WHERE player_id = ?`).bind(want, me).run();
    await db.prepare(`
      INSERT INTO guild_hits (guild_id, player_id, started_ms, damage) VALUES (?, ?, ?, ?)
      ON CONFLICT(guild_id, player_id, started_ms) DO UPDATE SET damage = damage + excluded.damage
    `).bind(guild.id, me, guild.boss_started_ms, tick).run();
    guild = await guildRow(db, guild.id);
    if (hp <= 0) {
      const myDamage = await damageOf(db, guild, me);
      const summary = await finishAttempt(db, guild, true);
      return json(headers, {
        success: true,
        mailReady: true,
        fight: {
          ended: "win",
          result: {
            ...summary,
            kind: "win",
            myDamage,
            myClicks: want,
            myPlungers: myDamage > 0 ? summary.plungers : 0,
            perClick: bossClickPower(gear.stage, gear.knifeId, gear.stars),
            cap
          }
        }
      });
    }
  }
  const freshMember = await membership(db, me);
  const current = await guildRow(db, guild.id);
  const boss = publicBoss(current, freshMember);
  return json(headers, {
    success: true,
    fight: {
      ...boss,
      blow: blowOf(gear, {
        added: add,
        myDamage: await damageOf(db, current, me),
        clicks: want
      })
    }
  });
}

async function setGate(db, headers, me, epochRaw) {
  const mine = await membership(db, me);
  if (!mine || mine.role !== "leader") return json(headers, { success: false, error: "Порог ставит глава" }, 403);
  const epoch = Math.floor(Number(epochRaw));
  if (!Number.isFinite(epoch) || epoch < 1 || epoch > 200) {
    return json(headers, { success: false, error: "Эпоха от 1 до 200" }, 400);
  }
  await db.prepare(`UPDATE guilds SET req_epoch = ? WHERE id = ?`).bind(epoch, mine.guildId).run();
  return json(headers, { success: true, ...(await viewOf(db, me)) });
}

async function listMail(db, headers, playerId) {
  // Mark unseen first so badge drops quickly; prune old empty mail only occasionally.
  const unseen = await db.prepare(`
    SELECT COUNT(*) as n FROM mail WHERE player_id = ? AND seen = 0
  `).bind(playerId).first();
  if (Number(unseen?.n) > 0) {
    await db.prepare(`UPDATE mail SET seen = 1 WHERE player_id = ? AND seen = 0`).bind(playerId).run();
  }
  const { results } = await db.prepare(`
    SELECT id, kind, title, body, plungers, seen, claimed, created_at as createdAt
    FROM mail WHERE player_id = ? ORDER BY id DESC LIMIT 50
  `).bind(playerId).all();
  const letters = (results || []).map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    plungers: Number(row.plungers) || 0,
    seen: true,
    claimed: Number(row.claimed) === 1,
    createdAt: row.createdAt
  }));
  const rewardCount = letters.filter((letter) => letter.plungers > 0 && !letter.claimed).length;
  // Lightweight prune once per ~20 reads with empty mail at the end of the page.
  if ((letters.length || 0) >= 40) {
    db.prepare(`
      DELETE FROM mail
      WHERE player_id = ? AND plungers = 0 AND claimed = 1 AND created_at < datetime('now', '-30 days')
    `).bind(playerId).run();
  }
  return json(headers, { success: true, letters, rewardCount });
}

async function claimMail(db, headers, playerId, mailId) {
  const letter = await db.prepare(`
    SELECT id, plungers, claimed FROM mail WHERE id = ? AND player_id = ? LIMIT 1
  `).bind(mailId, playerId).first();
  if (!letter) return json(headers, { success: false, error: "Письма нет" }, 404);
  if (Number(letter.claimed) === 1 || !(Number(letter.plungers) > 0)) {
    await db.prepare(`UPDATE mail SET claimed = 1, seen = 1 WHERE id = ?`).bind(mailId).run();
    return json(headers, { success: true, already: true });
  }
  const marked = await db.prepare(`
    UPDATE mail SET claimed = 1, seen = 1 WHERE id = ? AND player_id = ? AND claimed = 0
  `).bind(mailId, playerId).run();
  if (!changesOf(marked)) return json(headers, { success: true, already: true });
  const row = await db.prepare(`
    SELECT save_data, admin_seq, player_name FROM player_saves WHERE player_id = ? LIMIT 1
  `).bind(playerId).first();
  if (!row?.save_data) {
    await db.prepare(`UPDATE mail SET claimed = 0 WHERE id = ?`).bind(mailId).run();
    return json(headers, { success: false, error: "Сначала сохранитесь в облако" }, 409);
  }
  let save = null;
  try { save = JSON.parse(row.save_data); } catch (err) { save = null; }
  if (!save?.game) {
    await db.prepare(`UPDATE mail SET claimed = 0 WHERE id = ?`).bind(mailId).run();
    return json(headers, { success: false, error: "Сейв не читается" }, 409);
  }
  const amount = Number(letter.plungers) || 0;
  const next = (Number(save.game.transcendPlungers) || 0) + amount;
  save.game.transcendPlungers = next;
  const seq = (Number(row.admin_seq) || 0) + 1;
  save.adminSeq = seq;
  save.game.cloudAdminSeq = seq;
  const stage = Number(save.game.evoStage !== undefined ? save.game.evoStage + 1 : 1) || 1;
  await db.prepare(`
    UPDATE player_saves
    SET save_data = ?, admin_seq = ?, stage = ?, updated_at = datetime('now')
    WHERE player_id = ?
  `).bind(JSON.stringify(save), seq, stage, playerId).run();
  return json(headers, { success: true, plungers: next, gained: amount, adminSeq: seq });
}
