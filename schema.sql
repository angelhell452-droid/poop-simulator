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

CREATE INDEX IF NOT EXISTS idx_player_saves_biomass ON player_saves(biomass DESC);
CREATE INDEX IF NOT EXISTS idx_player_saves_player_id ON player_saves(player_id);
