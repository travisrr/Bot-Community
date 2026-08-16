import type { APIRoute } from "astro";
import { siteOrigin } from "../lib/env";

export const GET: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  const body = `User-agent: *
Allow: /
Disallow: /api
Disallow: /admin
Disallow: /account
Disallow: /login
Disallow: /register
Disallow: /claim
Disallow: /filing

Sitemap: ${origin}/sitemap.xml
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
