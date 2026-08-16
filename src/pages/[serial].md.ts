import type { APIRoute } from "astro";
import { parseSerialParam, padSerial, paddedPath } from "../lib/format";
import { changelogFor, getPublishedRun, getSteward, runToMarkdown } from "../lib/runs";
import { text } from "../lib/http";

export const GET: APIRoute = async ({ params }) => {
  const serial = parseSerialParam(params.serial);
  if (!serial) return text("not found", 404);
  if (params.serial !== padSerial(serial)) {
    return new Response(null, { status: 301, headers: { Location: `${paddedPath(serial)}.md` } });
  }
  const run = await getPublishedRun(serial);
  if (!run) return text("not found", 404);
  const [steward, changelog] = await Promise.all([getSteward(run.user_id), changelogFor(serial)]);
  return text(runToMarkdown(run, { steward, changelog }), 200, "text/markdown; charset=utf-8");
};
