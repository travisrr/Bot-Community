import type { APIRoute } from "astro";
import { finishXLogin } from "../../../../lib/x-oauth";
import { createSession, createUser, findUserByUsername, findUserByX, sessionCookie } from "../../../../lib/auth";
import { siteOrigin } from "../../../../lib/env";
import { redirectTo } from "../../../../lib/http";
import { flashCookie } from "../../../../lib/flash";
import { USERNAME_RE } from "../../../../lib/site";

export const GET: APIRoute = async ({ request, url }) => {
  const origin = siteOrigin(request);
  const err = url.searchParams.get("error");
  if (err) return redirectTo("/login", [flashCookie("X login cancelled.", origin)]);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  if (!code || !state) return redirectTo("/login", [flashCookie("X login failed.", origin)]);
  try {
    const profile = await finishXLogin(origin, code, state);
    let user = await findUserByX(profile.x_user_id);
    if (!user) {
      let username = profile.x_handle.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
      if (!USERNAME_RE.test(username)) username = `x_${profile.x_user_id.slice(-8)}`;
      if (await findUserByUsername(username)) username = `${username}_${profile.x_user_id.slice(-4)}`.slice(0, 24);
      user = await createUser({
        display_name: profile.display_name,
        username,
        x_user_id: profile.x_user_id,
        x_handle: profile.x_handle,
      });
    }
    const token = await createSession(user.id, origin);
    return redirectTo(profile.redirect_to || "/account", [
      sessionCookie(token, origin),
      flashCookie("Logged in with X.", origin),
    ]);
  } catch (e) {
    return redirectTo("/login", [flashCookie(e instanceof Error ? e.message : "X login failed.", origin)]);
  }
};
