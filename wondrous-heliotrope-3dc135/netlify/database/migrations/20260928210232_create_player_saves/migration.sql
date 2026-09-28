CREATE TABLE "player_saves" (
	"id" serial PRIMARY KEY,
	"player_id" text NOT NULL UNIQUE,
	"player_name" text DEFAULT 'Игрок',
	"stage" integer DEFAULT 1 NOT NULL,
	"biomass" double precision DEFAULT 0 NOT NULL,
	"sparkles" integer DEFAULT 0 NOT NULL,
	"prestige_currency" integer DEFAULT 0 NOT NULL,
	"save_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
