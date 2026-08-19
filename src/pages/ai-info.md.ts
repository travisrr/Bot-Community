import type { APIRoute } from "astro";
import { aiInfoMarkdown } from "../lib/ai-info";
import { siteOrigin } from "../lib/env";
import { crawlable } from "../lib/http";

export const GET: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  return crawlable(aiInfoMarkdown(origin), "text/markdown; charset=utf-8");
};
