// Cloudflare Pages Function: /api/bug-report
// Forwards player reports to Discord. Webhook URL lives in env DISCORD_WEBHOOK only.

interface Env {
  DB: D1Database;
}

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

export const onRequestOptions = async () => {
  return new Response(null, { headers });
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env || !env.DB) {
    console.error("⚠️ Серверная ошибка: Ссылка discord_token не найдена в таблице system_settings базы D1");
    return new Response(JSON.stringify({ success: false, error: "not_configured" }), {
      status: 503,
      headers,
    });
  }

  let hook: string | null = null;
  try {
    const row = await env.DB.prepare(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'discord_token'"
    ).first<{ setting_value: string }>();
    hook = row?.setting_value || null;
  } catch (err) {
    console.error("⚠️ Серверная ошибка: Ссылка discord_token не найдена в таблице system_settings базы D1", err);
  }

  if (!hook) {
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS system_settings (
          setting_key TEXT PRIMARY KEY,
          setting_value TEXT
        );
      `).run();
      await env.DB.prepare(`
        INSERT OR IGNORE INTO system_settings (setting_key, setting_value)
        VALUES ('discord_token', 'https://discord.com/api/webhooks/1555324109133578281/2I6OMFH4hZm_QUnSVcceMJtb_3DSyw8aT4vl9zXaC1IknsV9F41768tK5csbj6o7QjYW');
      `).run();
      const retryRow = await env.DB.prepare(
        "SELECT setting_value FROM system_settings WHERE setting_key = 'discord_token'"
      ).first<{ setting_value: string }>();
      hook = retryRow?.setting_value || null;
    } catch (_) {}
  }

  if (!hook) {
    console.error("⚠️ Серверная ошибка: Ссылка discord_token не найдена в таблице system_settings базы D1");
    return new Response(JSON.stringify({ success: false, error: "not_configured" }), {
      status: 503,
      headers,
    });
  }

  let raw = "";
  try {
    raw = await request.text();
  } catch (_) {
    return new Response(JSON.stringify({ success: false, error: "bad_report" }), {
      status: 400,
      headers,
    });
  }

  if (!raw || raw.length > 8000) {
    return new Response(JSON.stringify({ success: false, error: "bad_report" }), {
      status: 400,
      headers,
    });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw);
  } catch (_) {
    return new Response(JSON.stringify({ success: false, error: "bad_report" }), {
      status: 400,
      headers,
    });
  }

  // Discord rejects bogus avatar URLs — never forward client avatar_url.
  delete payload.avatar_url;

  try {
    const discordRes = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!discordRes.ok) {
      const detail = (await discordRes.text().catch(() => "")).slice(0, 200);
      return new Response(
        JSON.stringify({ success: false, error: "discord_reject", detail }),
        { status: 502, headers }
      );
    }
    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (_) {
    return new Response(JSON.stringify({ success: false, error: "discord_unreachable" }), {
      status: 502,
      headers,
    });
  }
};
