// Cloudflare Pages Function: /api/version
// Connected to Cloudflare D1 Database (binding: DB)

interface Env {
  DB: D1Database;
}

const MIN_PATCH = "5.4.1";

function compareSemver(a: string, b: string): number {
  const pa = String(a || "0").split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(b || "0").split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
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

  let worldReset = 3;
  let patchVersion = MIN_PATCH;

  if (env && env.DB) {
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS server_config (
          config_key TEXT PRIMARY KEY,
          config_value TEXT NOT NULL
        );
      `).run();
      await env.DB.prepare(`
        INSERT OR IGNORE INTO server_config (config_key, config_value) VALUES ('world_reset', '3');
      `).run().catch(() => {});
      await env.DB.prepare(`
        INSERT OR IGNORE INTO server_config (config_key, config_value) VALUES ('patch_version', '5.4.1');
      `).run().catch(() => {});

      const rows: any = await env.DB.prepare(`
        SELECT config_key, config_value FROM server_config WHERE config_key IN ('world_reset', 'patch_version')
      `).all();

      if (rows && rows.results) {
        for (const row of rows.results) {
          if (row.config_key === "world_reset") {
            worldReset = Number(row.config_value) || 3;
          } else if (row.config_key === "patch_version") {
            patchVersion = String(row.config_value || MIN_PATCH);
          }
        }
      }

      if (compareSemver(MIN_PATCH, patchVersion) > 0) {
        patchVersion = MIN_PATCH;
        await env.DB.prepare(`
          INSERT INTO server_config (config_key, config_value) VALUES ('patch_version', ?)
          ON CONFLICT(config_key) DO UPDATE SET config_value = excluded.config_value
        `).bind(patchVersion).run().catch(() => {});
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
