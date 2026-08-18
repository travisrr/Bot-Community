import type { APIRoute } from "astro";
import { parseSerialParam, padSerial, parseHouseParam, houseSlug, runPath } from "../../lib/format";
import { changelogFor, getPublishedRun, getSteward, openPatchCount, runToJson } from "../../lib/runs";
import { CRAWL_CACHE, json } from "../../lib/http";
import { siteOrigin } from "../../lib/env";

export const GET: APIRoute = async ({ params, request }) => {
  const house = parseHouseParam(params.house);
  const serial = parseSerialParam(params.serial);
  if (!house || !serial) return json({ error: "not_found" }, 404);
  const run = await getPublishedRun(serial);
  if (!run?.house_number) return json({ error: "not_found" }, 404);
  if (run.house_number !== house) {
    return new Response(null, { status: 301, headers: { Location: `${runPath(run.house_number, serial)}.json` } });
  }
  if (params.house !== houseSlug(house) || params.serial !== padSerial(serial)) {
    return new Response(null, { status: 301, headers: { Location: `${runPath(house, serial)}.json` } });
  }
  const origin = siteOrigin(request);
  const [steward, changelog, open_patch_count] = await Promise.all([
    getSteward(run.user_id),
    changelogFor(serial),
    openPatchCount(serial),
  ]);
  return json(runToJson(run, origin, { steward, changelog, open_patch_count }), 200, {
    "Cache-Control": CRAWL_CACHE,
  });
};
