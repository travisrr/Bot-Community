import type { APIRoute } from "astro";
import { startXLogin, xConfigured } from "../../../lib/x-oauth";
import { siteOrigin } from "../../../lib/env";

export const GET: APIRoute = async ({ request, url }) => {
  const origin = siteOrigin(request);
  if (!xConfigured()) {
    return new Response("X login is not configured.", { status: 501 });
  }
  const next = url.searchParams.get("next") || "/account";
  const loc = await startXLogin(origin, next);
  return new Response(null, { status: 302, headers: { Location: loc } });
};
