import type { APIRoute } from "astro";
import { siteOrigin } from "../lib/env";
import { crawlable } from "../lib/http";
import { PRIVACY_DOC, renderLegalMarkdown } from "../lib/legal";

export const GET: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  return crawlable(renderLegalMarkdown(PRIVACY_DOC, origin), "text/markdown; charset=utf-8");
};
