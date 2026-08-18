import type { APIRoute } from "astro";
import { listPublishedRuns } from "../lib/runs";
import { publishedRunPath, runId } from "../lib/format";
import { siteOrigin } from "../lib/env";
import { canonical, OG_IMAGE_PATH, SITE_NAME, SITE_TAGLINE } from "../lib/site";
import { escapeHtml } from "../lib/html";
import { firstSentence } from "../lib/jsonld";

export const GET: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  const runs = await listPublishedRuns(50);
  const items = runs
    .filter((r) => r.serial && r.published_at)
    .map((r) => {
      const path = publishedRunPath(r);
      if (!path) return "";
      const url = canonical(origin, path);
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
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${SITE_NAME}</title>
  <link>${origin}</link>
  <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml"/>
  <description>${escapeHtml(SITE_TAGLINE)}</description>
  <language>en-us</language>
  <image>
    <url>${canonical(origin, OG_IMAGE_PATH)}</url>
    <title>${SITE_NAME}</title>
    <link>${origin}</link>
  </image>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  ${items}
</channel>
</rss>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, must-revalidate",
    },
  });
};
