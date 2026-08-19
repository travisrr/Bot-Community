import type { APIRoute } from "astro";
import { inferCategory, parseCatParam } from "../lib/category";
import { companySlug, parseCompanySlug, runHasCompany } from "../lib/companies";
import { CRAWL_CACHE, json } from "../lib/http";
import { siteOrigin } from "../lib/env";
import { indexJson, listPublishedRuns } from "../lib/runs";
import type { RunRow } from "../lib/types";

const CATALOG_CAP = 5000;

function parseLimit(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, CATALOG_CAP);
}

function sinceCutoff(raw: string | null): number | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const ms = Date.parse(`${raw}T00:00:00.000Z`);
  return Number.isNaN(ms) ? null : ms;
}

function lastDay(runs: RunRow[]): RunRow[] {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return runs
    .filter((r) => r.published_at && new Date(r.published_at).getTime() >= cutoff)
    .sort((a, b) => (b.published_at || "").localeCompare(a.published_at || ""));
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const dayToday = url.searchParams.get("day") === "today";
  const cat = parseCatParam(url.searchParams.get("cat"));
  const toolRaw = url.searchParams.get("tool") || url.searchParams.get("connector");
  const tool = toolRaw ? companySlug(toolRaw) ?? parseCompanySlug(toolRaw) : null;
  const since = sinceCutoff(url.searchParams.get("since"));
  const limit = parseLimit(url.searchParams.get("limit"), dayToday ? 5 : CATALOG_CAP);

  const catalog = await listPublishedRuns(CATALOG_CAP);
  let runs = catalog;
  if (dayToday) runs = lastDay(runs);
  if (since != null) {
    runs = runs.filter((r) => r.published_at && new Date(r.published_at).getTime() >= since);
  }
  if (cat) runs = runs.filter((r) => inferCategory(r) === cat);
  if (tool) runs = runs.filter((r) => runHasCompany(r, tool));
  runs = runs.slice(0, limit);

  return json(indexJson(runs, siteOrigin(request), { catalog }), 200, {
    "Cache-Control": CRAWL_CACHE,
  });
};
