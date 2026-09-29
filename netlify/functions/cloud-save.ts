import { eq, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { playerSaves } from "../../db/schema.js";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    if (req.method === "POST") {
      const body = await req.json();
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

      // Upsert player progress into Postgres player_saves table
      const [savedRecord] = await db
        .insert(playerSaves)
        .values({
          playerId,
          playerName: name,
          stage,
          biomass,
          sparkles,
          prestigeCurrency,
          saveData,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: playerSaves.playerId,
          set: {
            playerName: name,
            stage,
            biomass,
            sparkles,
            prestigeCurrency,
            saveData,
            updatedAt: new Date(),
          },
        })
        .returning();

      return new Response(
        JSON.stringify({
          success: true,
          timestamp: Date.now(),
          recordId: savedRecord?.id,
          playerName: savedRecord?.playerName,
          updatedAt: savedRecord?.updatedAt,
        }),
        { status: 200, headers }
      );
    }

    if (req.method === "GET") {
      const url = new URL(req.url);
      const playerId = url.searchParams.get("playerId");
      const action = url.searchParams.get("action");

      // Handle leaderboard or list of players
      if (action === "leaderboard") {
        const topPlayers = await db
          .select({
            playerId: playerSaves.playerId,
            playerName: playerSaves.playerName,
            stage: playerSaves.stage,
            biomass: playerSaves.biomass,
            sparkles: playerSaves.sparkles,
            prestigeCurrency: playerSaves.prestigeCurrency,
            updatedAt: playerSaves.updatedAt,
          })
          .from(playerSaves)
          .orderBy(desc(playerSaves.biomass))
          .limit(20);

        return new Response(
          JSON.stringify({ success: true, leaderboard: topPlayers }),
          { status: 200, headers }
        );
      }

      if (!playerId) {
        return new Response(
          JSON.stringify({ error: "Missing playerId param" }),
          { status: 400, headers }
        );
      }

      const records = await db
        .select()
        .from(playerSaves)
        .where(eq(playerSaves.playerId, playerId))
        .limit(1);

      if (records.length === 0) {
        return new Response(
          JSON.stringify({ exists: false }),
          { status: 200, headers }
        );
      }

      const record = records[0];
      return new Response(
        JSON.stringify({
          exists: true,
          data: record.saveData,
          updatedAt: record.updatedAt,
          playerName: record.playerName,
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
    console.error("Database error in cloud-save function:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Internal database error" }),
      { status: 500, headers }
    );
  }
};
