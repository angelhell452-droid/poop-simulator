// Social API Worker: friends, guild, mail. Same D1 as the main Worker.
import { ensureAdminSchema } from "./workerAdmin.js";
import { ensureFriendSchema, handleFriendGet, handleFriendPost } from "./workerFriends.js";
import { ensureGuildSchema, handleGuildGet, handleGuildPost } from "./workerGuild.js";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

const SOCIAL_GET = new Set(["friends", "friend_profile", "guild", "mail", "guild_list"]);

function isFriendPost(action) {
  return typeof action === "string" && action.startsWith("friend_");
}

function isGuildPost(action) {
  return typeof action === "string" && (action.startsWith("guild_") || action === "mail_claim");
}

async function ensureSocialSchema(db) {
  try {
    await ensureFriendSchema(db);
    await ensureGuildSchema(db);
    await ensureAdminSchema(db);
  } catch (err) {
    console.warn("Social schema notice:", err);
  }
}

export async function handleSocial(req, env) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (!env || !env.DB) {
    return new Response(
      JSON.stringify({
        error: "D1 database binding 'DB' is missing. Bind poop_simulator_d1 as DB on this Worker.",
      }),
      { status: 500, headers }
    );
  }

  try {
    await ensureSocialSchema(env.DB);

    const url = new URL(req.url);
    const actionParam = url.searchParams.get("action");

    if (req.method === "POST") {
      let body = {};
      try {
        body = await req.json();
      } catch (e) {
        body = {};
      }
      const action = actionParam || body.action;
      if (isFriendPost(action)) {
        return handleFriendPost(action, body, req, env, headers);
      }
      if (isGuildPost(action)) {
        return handleGuildPost(action, body, req, env, headers);
      }
      return new Response(
        JSON.stringify({ success: false, error: "Unknown social action" }),
        { status: 400, headers }
      );
    }

    if (req.method === "GET") {
      const action = actionParam;
      if (action === "friends" || action === "friend_profile") {
        return handleFriendGet(action, url, req, env, headers);
      }
      if (action === "guild" || action === "mail" || action === "guild_list") {
        return handleGuildGet(action, req, env, headers);
      }
      if (!action || !SOCIAL_GET.has(action)) {
        return new Response(
          JSON.stringify({ success: false, error: "Unknown social action" }),
          { status: 400, headers }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers }
    );
  } catch (err) {
    console.error("Social Worker error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Social server error" }),
      { status: 500, headers }
    );
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/social" || url.pathname === "/api/social/") {
      return handleSocial(request, env);
    }
    // Workers.dev root health check
    if (url.pathname === "/" || url.pathname === "") {
      return new Response(JSON.stringify({ ok: true, service: "poop-simulator-social" }), {
        status: 200,
        headers,
      });
    }
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });
  },
};
