-- Cloudflare D1 Database Schema for Poop Simulator
-- Executes on Cloudflare D1 (SQLite)

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

CREATE TABLE IF NOT EXISTS friend_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

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

CREATE INDEX IF NOT EXISTS idx_guild_members_guild ON guild_members(guild_id);

CREATE TABLE IF NOT EXISTS guild_unlocks (
  guild_id INTEGER NOT NULL,
  boss_index INTEGER NOT NULL,
  clears INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (guild_id, boss_index)
);

CREATE TABLE IF NOT EXISTS guild_hits (
  guild_id INTEGER NOT NULL,
  player_id TEXT NOT NULL,
  started_ms INTEGER NOT NULL,
  damage REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (guild_id, player_id, started_ms)
);

CREATE TABLE IF NOT EXISTS guild_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id INTEGER NOT NULL,
  player_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE (guild_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_guild_applications_guild ON guild_applications(guild_id);

CREATE TABLE IF NOT EXISTS guild_invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id INTEGER NOT NULL,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE (guild_id, to_id)
);

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

CREATE INDEX IF NOT EXISTS idx_mail_player ON mail(player_id, id DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_friend_links_pair ON friend_links(from_id, to_id);
CREATE INDEX IF NOT EXISTS idx_friend_links_to ON friend_links(to_id, status);

CREATE INDEX IF NOT EXISTS idx_player_saves_biomass ON player_saves(biomass DESC);
CREATE INDEX IF NOT EXISTS idx_player_saves_player_id ON player_saves(player_id);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS game_admins (
  username TEXT PRIMARY KEY COLLATE NOCASE,
  player_id TEXT,
  added_by TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 2,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS game_flags (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
