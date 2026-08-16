import type { APIRoute } from "astro";
import { startXLogin, xConfigured } from "../../../lib/x-oauth";
import { siteOrigin } from "../../../lib/env";
import { redirectTo, safeNextPath } from "../../../lib/http";
import { flashCookie } from "../../../lib/flash";
import { rateLimit, clientIp } from "../../../lib/rate-limit";

export const GET: APIRoute = async ({ request, url }) => {
  const origin = siteOrigin(request);
  if (!xConfigured()) {
    return redirectTo("/login", [flashCookie("X login is not configured yet.", origin)]);
  }
  const allowed = await rateLimit(`xauth:${clientIp(request)}`, 20, 60 * 60 * 1000);
  if (!allowed) {
    return redirectTo("/login", [flashCookie("Slow down. Rate limit.", origin)]);
  }
  const next = safeNextPath(url.searchParams.get("next"));
  const loc = await startXLogin(origin, next);
  return new Response(null, { status: 302, headers: { Location: loc } });
};
