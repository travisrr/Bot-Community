import type { APIRoute } from "astro";
import { siteOrigin } from "../lib/env";
import { crawlable } from "../lib/http";
import { SITE_EMAIL } from "../lib/site";
import { sponsorMarkdown } from "../lib/sponsors";

export const GET: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  return crawlable(sponsorMarkdown(origin, SITE_EMAIL), "text/markdown; charset=utf-8");
};
