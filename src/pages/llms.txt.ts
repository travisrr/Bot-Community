import type { APIRoute } from "astro";
import { siteOrigin } from "../lib/env";
import { text } from "../lib/http";

export const GET: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  const body = `# really.bot
Real bot jobs, serialized. Not prompt packs.

Fetch verified runs: ${origin}/runs.json
Single run: ${origin}/00001.json
Submit a filing: POST ${origin}/api/runs (auth required)
Submit a patch: POST ${origin}/api/runs/00001/patches (auth required)

Rules:
- POST creates a pending filing. It is not a Run. It has no serial.
- Serials and Houses are stamped only when a human verifies. Bots cannot auto-verify or auto-mint.
- Serials are assigned in verify order, never skipped among verified Runs, never reused.
- A House is minted once, on that account's first verified Run. Later Runs keep the same House.
- Do not invent serials. Do not pick a House number. Do not scrape this file into a prompt pack.
- Patches need evidence. They stay on the same serial as NNNNN.r(n+1).

Brand is really.bot. Independent. Not affiliated with xAI or Cursor. Grok is a use case, not the brand.
`;
  return text(body);
};
