import type { APIRoute } from "astro";
import { indexJson, listPublishedRuns } from "../lib/runs";
import { json } from "../lib/http";
import { siteOrigin } from "../lib/env";

export const GET: APIRoute = async ({ request }) => {
  const runs = await listPublishedRuns(5000);
  return json(indexJson(runs, siteOrigin(request)));
};
