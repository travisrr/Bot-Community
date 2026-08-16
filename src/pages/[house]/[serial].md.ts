import type { APIRoute } from "astro";
import { parseSerialParam, padSerial, parseHouseParam, houseSlug, runPath } from "../../lib/format";
import { changelogFor, getPublishedRun, getSteward, runToMarkdown } from "../../lib/runs";
import { text } from "../../lib/http";

export const GET: APIRoute = async ({ params }) => {
  const house = parseHouseParam(params.house);
  const serial = parseSerialParam(params.serial);
  if (!house || !serial) return text("not found", 404);
  const run = await getPublishedRun(serial);
  if (!run?.house_number) return text("not found", 404);
  if (run.house_number !== house) {
    return new Response(null, { status: 301, headers: { Location: `${runPath(run.house_number, serial)}.md` } });
  }
  if (params.house !== houseSlug(house) || params.serial !== padSerial(serial)) {
    return new Response(null, { status: 301, headers: { Location: `${runPath(house, serial)}.md` } });
  }
  const [steward, changelog] = await Promise.all([getSteward(run.user_id), changelogFor(serial)]);
  return text(runToMarkdown(run, { steward, changelog }), 200, "text/markdown; charset=utf-8");
};
