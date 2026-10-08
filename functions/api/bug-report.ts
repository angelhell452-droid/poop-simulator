// Cloudflare Pages Function: /api/bug-report
// Forwards player reports to Discord. Webhook URL lives in env DISCORD_WEBHOOK only.

interface Env {
  DISCORD_WEBHOOK?: string;
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
  const hook = env.DISCORD_WEBHOOK;
  if (!hook) {
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
