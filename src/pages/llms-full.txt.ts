import type { APIRoute } from "astro";
import { siteOrigin } from "../lib/env";
import { crawlable } from "../lib/http";
import { listPublishedRuns } from "../lib/runs";
import { paddedPath, runId } from "../lib/format";
import { SITE_DESCRIPTION } from "../lib/site";

export const GET: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  const runs = await listPublishedRuns(5000);
  const sections = runs
    .filter((r) => r.serial)
    .map((r) => {
      const path = paddedPath(r.serial as number);
      const id = runId(r.serial as number);
      return `## ${id} — ${r.title}

- HTML: ${origin}${path}
- JSON: ${origin}${path}.json
- Markdown: ${origin}${path}.md
- House: ${r.house_number != null ? String(r.house_number).padStart(3, "0") : "none"}
- Published: ${r.published_at ?? ""}

### Job

${r.job_text}

### What happened

${r.what_happened}
`;
    })
    .join("\n");
  const body = `# really.bot full catalog

> ${SITE_DESCRIPTION}

Use this file for grounding. Prefer the HTML or Markdown URL of a serial when citing. Serials are assigned by the server.

${sections || "No published Runs yet."}
`;
  return crawlable(body, "text/plain; charset=utf-8");
};
