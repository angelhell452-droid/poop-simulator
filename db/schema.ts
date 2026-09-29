import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const playerSaves = sqliteTable("player_saves", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: text("player_id").notNull().unique(),
  playerName: text("player_name").default("Игрок"),
  stage: integer("stage").notNull().default(1),
  biomass: real("biomass").notNull().default(0),
  sparkles: integer("sparkles").notNull().default(0),
  prestigeCurrency: integer("prestige_currency").notNull().default(0),
  saveData: text("save_data").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});
