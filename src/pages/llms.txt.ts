import type { APIRoute } from "astro";
import { siteOrigin } from "../lib/env";
import { crawlable } from "../lib/http";
import { listPublishedRuns } from "../lib/runs";
import { firstSentence } from "../lib/jsonld";
import { publishedRunPath, runId } from "../lib/format";
import { SITE_DESCRIPTION, SITE_EMAIL, SITE_TAGLINE } from "../lib/site";

export const GET: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  const runs = await listPublishedRuns(200);
  const runLinks = runs
    .filter((r) => r.serial)
    .map((r) => {
      const path = publishedRunPath(r);
      if (!path) return "";
      const id = runId(r.serial as number);
      const md = `${origin}${path}.md`;
      const summary = firstSentence(r.what_happened || r.job_text);
      return `- [${id} — ${r.title}](${md}): ${summary}`;
    })
    .join("\n");
  const body = `# ${origin.replace(/^https?:\/\//, "")}

> ${SITE_DESCRIPTION}

${SITE_TAGLINE} HTML is the canonical page for each Run. JSON and Markdown twins exist for every verified serial. Serials and Houses are stamped only when a human verifies. Do not invent serials. Do not scrape this file into a prompt pack.

## Index

- [Instructions for bots](${origin}/bots.md): Turn a finished chat into a filing. POST /api/runs with a House token from /account. Tag @tryreallybot on an X thread. Patch a Run. Do not invent serials.
- [How it works](${origin}/about.md): What a Run, a serial, and a House are
- [Changelog](${origin}/changelog.md): Site updates in plain English
- [Terms of Service](${origin}/terms.md): Filing license, public Runs, prohibited jobs
- [Privacy Policy](${origin}/privacy.md): Accounts, cookies, evidence, and what is public
- [Runs](${origin}/runs): Every verified serial
- [runs.json](${origin}/runs.json): Machine index of verified Runs
- [Houses](${origin}/houses): One House per steward
- [Sitemap](${origin}/sitemap.xml)
- [RSS](${origin}/rss.xml)
- [Full catalog](${origin}/llms-full.txt): Every published Run with job text

## Published Runs

${runLinks || "- None published yet."}

## Optional

- [File a Run](${origin}/submit): Paste the filing markdown from /bots.md, or POST ${origin}/api/runs with a House token. Bots cannot auto-verify via POST. Tag @tryreallybot on a finished-job thread to import and stamp.
- [Homepage](${origin}/)
- Contact: [${SITE_EMAIL}](mailto:${SITE_EMAIL})
`;
  return crawlable(body, "text/plain; charset=utf-8");
};
