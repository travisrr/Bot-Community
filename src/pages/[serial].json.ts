import type { APIRoute } from "astro";
import { parseSerialParam, padSerial, paddedPath } from "../lib/format";
import { changelogFor, getPublishedRun, getSteward, openPatchCount, runToJson } from "../lib/runs";
import { json } from "../lib/http";
import { siteOrigin } from "../lib/env";

export const GET: APIRoute = async ({ params, request }) => {
  const serial = parseSerialParam(params.serial);
  if (!serial) return json({ error: "not_found" }, 404);
  if (params.serial !== padSerial(serial)) {
    return new Response(null, { status: 301, headers: { Location: `${paddedPath(serial)}.json` } });
  }
  const run = await getPublishedRun(serial);
  if (!run) return json({ error: "not_found" }, 404);
  const origin = siteOrigin(request);
  const [steward, changelog, open_patch_count] = await Promise.all([
    getSteward(run.user_id),
    changelogFor(serial),
    openPatchCount(serial),
  ]);
  return json(runToJson(run, origin, { steward, changelog, open_patch_count }));
};
