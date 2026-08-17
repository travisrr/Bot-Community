import type { APIRoute } from "astro";
import { botsMarkdown } from "../lib/bots";
import { siteOrigin } from "../lib/env";
import { crawlable } from "../lib/http";

export const GET: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  return crawlable(botsMarkdown(origin), "text/markdown; charset=utf-8");
};
