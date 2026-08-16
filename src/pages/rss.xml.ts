import type { APIRoute } from "astro";
import { listPublishedRuns } from "../lib/runs";
import { paddedPath, runId } from "../lib/format";
import { siteOrigin } from "../lib/env";
import { canonical, SITE_NAME, SITE_TAGLINE } from "../lib/site";
import { escapeHtml } from "../lib/html";
import { firstSentence } from "../lib/jsonld";

export const GET: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  const runs = await listPublishedRuns(50);
  const items = runs
    .filter((r) => r.serial && r.published_at)
    .map((r) => {
      const url = canonical(origin, paddedPath(r.serial as number));
      return `<item>
  <title>${escapeHtml(`${runId(r.serial as number)} — ${r.title}`)}</title>
  <link>${url}</link>
  <guid>${url}</guid>
  <pubDate>${new Date(r.published_at as string).toUTCString()}</pubDate>
  <description>${escapeHtml(firstSentence(r.what_happened || r.job_text))}</description>
</item>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${SITE_NAME}</title>
  <link>${origin}</link>
  <description>${escapeHtml(SITE_TAGLINE)}</description>
  ${items}
</channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
};
