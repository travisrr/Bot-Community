import type { APIRoute } from "astro";
import { finishXBotConnect, xConfigured } from "../../../../../lib/x-oauth";
import { installBotTokens } from "../../../../../lib/x-api";
import { siteOrigin } from "../../../../../lib/env";
import { redirectTo } from "../../../../../lib/http";
import { flashCookie } from "../../../../../lib/flash";
import { userFromRequest, isOwner, normalizeXHandle } from "../../../../../lib/auth";
import { BOT_X_HANDLE } from "../../../../../lib/site";

export const GET: APIRoute = async ({ request, url }) => {
  const origin = siteOrigin(request);
  const user = await userFromRequest(request);
  if (!isOwner(user)) {
    return redirectTo("/admin", [flashCookie("Owner only.", origin)]);
  }
  if (!xConfigured()) {
    return redirectTo("/admin", [flashCookie("X login is not configured yet.", origin)]);
  }
  const err = url.searchParams.get("error");
  if (err) {
    return redirectTo("/admin", [flashCookie("X bot connect was cancelled.", origin)]);
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return redirectTo("/admin", [flashCookie("X bot connect missing code.", origin)]);
  }
  try {
    const profile = await finishXBotConnect(origin, code, state);
    if (normalizeXHandle(profile.x_handle).toLowerCase() !== BOT_X_HANDLE) {
      return redirectTo("/admin", [
        flashCookie(`Connect the @${BOT_X_HANDLE} account, not @${profile.x_handle}.`, origin),
      ]);
    }
    await installBotTokens({
      access_token: profile.access_token,
      refresh_token: profile.refresh_token,
      expires_in: profile.expires_in,
      bot_user_id: profile.x_user_id,
    });
    return redirectTo("/admin", [flashCookie(`@${BOT_X_HANDLE} connected. Mentions will import.`, origin)]);
  } catch (error) {
    console.error(JSON.stringify({ event: "x_bot_connect_failed", error: String(error) }));
    return redirectTo("/admin", [
      flashCookie(error instanceof Error ? error.message : "Could not connect @tryreallybot.", origin),
    ]);
  }
};
