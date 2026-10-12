// Cloudflare Pages Function: /api/version
// Connected to Cloudflare D1 Database (binding: DB)

interface Env {
  DB: D1Database;
}

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

export const onRequestOptions = async () => {
  return new Response(null, { headers });
};

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { env } = context;

  let worldReset = 0;
  let patchVersion = "5.4.0";

  if (env && env.DB) {
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS server_config (
          config_key TEXT PRIMARY KEY,
          config_value TEXT NOT NULL
        );
      `).run();
      await env.DB.prepare(`
        INSERT OR IGNORE INTO server_config (config_key, config_value) VALUES ('world_reset', '0');
      `).run().catch(() => {});
      await env.DB.prepare(`
        INSERT OR IGNORE INTO server_config (config_key, config_value) VALUES ('patch_version', '5.4.0');
      `).run().catch(() => {});

      const rows: any = await env.DB.prepare(`
        SELECT config_key, config_value FROM server_config WHERE config_key IN ('world_reset', 'patch_version')
      `).all();

      if (rows && rows.results) {
        for (const row of rows.results) {
          if (row.config_key === "world_reset") {
            worldReset = Number(row.config_value) || 0;
          } else if (row.config_key === "patch_version") {
            patchVersion = String(row.config_value || "5.4.0");
          }
        }
      }
    } catch (e) {
      console.warn("Version fetch DB fallback:", e);
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      worldReset,
      patchVersion,
      timestamp: Date.now(),
    }),
    { status: 200, headers }
  );
};

export const onRequest = onRequestGet;
