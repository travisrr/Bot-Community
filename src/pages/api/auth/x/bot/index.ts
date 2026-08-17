import type { APIRoute } from "astro";
import { startXBotConnect, xConfigured } from "../../../../../lib/x-oauth";
import { siteOrigin } from "../../../../../lib/env";
import { redirectTo } from "../../../../../lib/http";
import { flashCookie } from "../../../../../lib/flash";
import { rateLimit, clientIp } from "../../../../../lib/rate-limit";
import { userFromRequest, isOwner } from "../../../../../lib/auth";

export const GET: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  const user = await userFromRequest(request);
  if (!isOwner(user)) {
    return redirectTo("/admin", [flashCookie("Owner only.", origin)]);
  }
  if (!xConfigured()) {
    return redirectTo("/admin", [flashCookie("X login is not configured yet.", origin)]);
  }
  const allowed = await rateLimit(`xbot:${clientIp(request)}`, 10, 60 * 60 * 1000);
  if (!allowed) {
    return redirectTo("/admin", [flashCookie("Slow down. Rate limit.", origin)]);
  }
  const loc = await startXBotConnect(origin);
  return new Response(null, { status: 302, headers: { Location: loc } });
};
