import type { APIRoute } from "astro";
import { finishXLogin } from "../../../../lib/x-oauth";
import { createSession, loginOrCreateFromX, sessionCookie, homePathFor, loginFlash, toPublicUser } from "../../../../lib/auth";
import { siteOrigin } from "../../../../lib/env";
import { redirectTo } from "../../../../lib/http";
import { flashCookie } from "../../../../lib/flash";
import { rateLimit, clientIp } from "../../../../lib/rate-limit";

export const GET: APIRoute = async ({ request, url }) => {
  const origin = siteOrigin(request);
  const allowed = await rateLimit(`xcb:${clientIp(request)}`, 30, 60 * 60 * 1000);
  if (!allowed) return redirectTo("/login", [flashCookie("Slow down. Rate limit.", origin)]);
  const err = url.searchParams.get("error");
  if (err) return redirectTo("/login", [flashCookie("X login cancelled.", origin)]);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  if (!code || !state) return redirectTo("/login", [flashCookie("X login failed.", origin)]);
  try {
    const profile = await finishXLogin(origin, code, state);
    const user = await loginOrCreateFromX(profile);
    const token = await createSession(user.id, origin);
    const view = toPublicUser(user);
    return redirectTo(homePathFor(view, profile.redirect_to), [
      sessionCookie(token, origin),
      flashCookie(loginFlash(view, "x"), origin),
    ]);
  } catch (e) {
    return redirectTo("/login", [flashCookie(e instanceof Error ? e.message : "X login failed.", origin)]);
  }
};
