import type { APIRoute } from "astro";
import { siteOrigin } from "../lib/env";
import { crawlable } from "../lib/http";
import { AI_AND_SEARCH_AGENTS } from "../lib/crawlers";

export const GET: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  const allows = AI_AND_SEARCH_AGENTS.map(
    (agent) => `User-agent: ${agent}\nAllow: /\nDisallow: /api\nDisallow: /admin\nDisallow: /account\nDisallow: /login\nDisallow: /register\nDisallow: /claim\nDisallow: /filing\n`,
  ).join("\n");
  const body = `# really.bot
# Public Runs are meant to be indexed, cited, and used as grounding by
# search engines and AI answer engines. Serials are assigned by the server.

# If a CDN prepends training-block rules, the groups below re-allow those
# crawlers on public pages (Google-style parsers merge same-UA groups and
# keep the least restrictive path rule).

${allows}
User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=yes, use=full
Allow: /
Disallow: /api
Disallow: /admin
Disallow: /account
Disallow: /login
Disallow: /register
Disallow: /claim
Disallow: /filing

Sitemap: ${origin}/sitemap.xml

# Machine-readable indexes for AI crawlers:
# ${origin}/ai-info.md
# ${origin}/bots.md
# ${origin}/qa.md
# ${origin}/llms.txt
# ${origin}/llms-full.txt
# ${origin}/runs.json
# ${origin}/companies
# ${origin}/rss.xml
# ${origin}/blog
# ${origin}/blog/rss.xml
`;
  return crawlable(body, "text/plain; charset=utf-8");
};
