// Cloudflare Pages Function: /api/cloud-save
// Connected to Cloudflare D1 Database (binding: DB)

interface Env {
  DB: D1Database;
}

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

// Automatic self-healing schema creation if table does not exist
async function ensureSchema(db: D1Database) {
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
  } catch (err) {
    console.warn("Schema initialization notice:", err);
  }
}

export const onRequestOptions = async () => {
  return new Response(null, { headers });
};

export const onRequest = async (context: { request: Request; env: Env }) => {
  const { request: req, env } = context;

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (!env || !env.DB) {
    return new Response(
      JSON.stringify({
        error: "D1 database binding 'DB' is missing. Please configure D1 database binding named 'DB' in Cloudflare Pages dashboard (Settings -> Functions -> D1 Database Bindings).",
      }),
      { status: 500, headers }
    );
  }

  try {
    await ensureSchema(env.DB);

    if (req.method === "POST") {
      const body: any = await req.json();
      const { playerId, playerName, saveData } = body;

      if (!playerId || !saveData) {
        return new Response(
          JSON.stringify({ error: "Missing playerId or saveData" }),
          { status: 400, headers }
        );
      }

      const stage = Number(saveData?.game?.evoStage !== undefined ? saveData.game.evoStage + 1 : saveData?.game?.stage) || 1;
      const biomass = Number(saveData?.game?.allTimeBiomass ?? saveData?.game?.biomass) || 0;
      const sparkles = Number(saveData?.game?.sparkles) || 0;
      const prestigeCurrency = Number(saveData?.game?.prestigeRolls ?? saveData?.game?.prestigeCurrency) || 0;
      const name = typeof playerName === "string" && playerName.trim()
        ? playerName.trim().substring(0, 50)
        : "Игрок #" + playerId.substring(playerId.length - 4);
      const jsonStr = typeof saveData === "string" ? saveData : JSON.stringify(saveData);

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
      `).bind(playerId, name, stage, biomass, sparkles, prestigeCurrency, jsonStr).run();

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

      // Handle leaderboard
      if (action === "leaderboard") {
        const { results } = await env.DB.prepare(`
          SELECT
            player_id as playerId,
            player_name as playerName,
            stage,
            biomass,
            sparkles,
            prestige_currency as prestigeCurrency,
            updated_at as updatedAt
          FROM player_saves
          ORDER BY biomass DESC
          LIMIT 20
        `).all();

        return new Response(
          JSON.stringify({ success: true, leaderboard: results || [] }),
          { status: 200, headers }
        );
      }

      if (!playerId) {
        return new Response(
          JSON.stringify({ error: "Missing playerId param" }),
          { status: 400, headers }
        );
      }

      const record: any = await env.DB.prepare(`
        SELECT * FROM player_saves WHERE player_id = ? LIMIT 1
      `).bind(playerId).first();

      if (!record) {
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

      return new Response(
        JSON.stringify({
          exists: true,
          data: parsedData,
          updatedAt: record.updated_at,
          playerName: record.player_name,
          stage: record.stage,
        }),
        { status: 200, headers }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers }
    );
  } catch (err: any) {
    console.error("Cloudflare D1 error in cloud-save function:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Internal database error" }),
      { status: 500, headers }
    );
  }
};
