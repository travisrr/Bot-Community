import type { APIRoute } from "astro";
import { qaMarkdown } from "../lib/qa-docs";
import { siteOrigin } from "../lib/env";
import { crawlable } from "../lib/http";

export const GET: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  return crawlable(qaMarkdown(origin), "text/markdown; charset=utf-8");
};
