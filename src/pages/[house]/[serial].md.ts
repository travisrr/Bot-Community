import type { APIRoute } from "astro";
import { parseSerialParam, padSerial, parseHouseParam, houseSlug, runPath } from "../../lib/format";
import { changelogFor, getPublishedRun, getSteward, runToMarkdown, canonicalPublishedLocation } from "../../lib/runs";
import { CRAWL_CACHE, text } from "../../lib/http";

export const GET: APIRoute = async ({ params }) => {
  const house = parseHouseParam(params.house);
  const serial = parseSerialParam(params.serial);
  if (!house || !serial) return text("not found", 404);
  const loc = await canonicalPublishedLocation(serial);
  if (loc && (loc.serial !== serial || loc.house !== house)) {
    return new Response(null, { status: 301, headers: { Location: `${loc.path}.md` } });
  }
  const run = await getPublishedRun(serial);
  if (!run?.house_number) return text("not found", 404);
  if (run.house_number !== house) {
    return new Response(null, { status: 301, headers: { Location: `${runPath(run.house_number, serial)}.md` } });
  }
  if (params.house !== houseSlug(house) || params.serial !== padSerial(serial)) {
    return new Response(null, { status: 301, headers: { Location: `${runPath(house, serial)}.md` } });
  }
  const [steward, changelog] = await Promise.all([getSteward(run.user_id), changelogFor(serial)]);
  const body = runToMarkdown(run, { steward, changelog });
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": CRAWL_CACHE },
  });
};
