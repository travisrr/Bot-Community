import type { APIRoute } from "astro";
import { siteOrigin } from "../lib/env";
import { crawlable } from "../lib/http";
import { changelogMarkdown, loadChangelogEntries } from "../lib/changelog";

export const GET: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  const entries = await loadChangelogEntries();
  const body = `${changelogMarkdown(entries).trim()}\n\nHTML: ${origin}/changelog\n`;
  return crawlable(body, "text/markdown; charset=utf-8");
};
