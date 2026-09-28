import { pgTable, serial, text, timestamp, integer, doublePrecision, jsonb } from "drizzle-orm/pg-core";

export const playerSaves = pgTable("player_saves", {
  id: serial("id").primaryKey(),
  playerId: text("player_id").notNull().unique(),
  playerName: text("player_name").default("Игрок"),
  stage: integer("stage").notNull().default(1),
  biomass: doublePrecision("biomass").notNull().default(0),
  sparkles: integer("sparkles").notNull().default(0),
  prestigeCurrency: integer("prestige_currency").notNull().default(0),
  saveData: jsonb("save_data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
