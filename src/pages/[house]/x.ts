import type { APIRoute } from "astro";
import { normalizeXHandle } from "../../lib/auth";
import { houseSlug, houseXPath, parseHouseParam } from "../../lib/format";
import { getHouseSteward } from "../../lib/houses";
import { noindex } from "../../lib/http";
import { sourcePostForHouse } from "../../lib/x-import";
import { tweetStillPosted, tweetUrl, xProfileUrl } from "../../lib/x-api";

function sendToX(url: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      "Cache-Control": "private, no-store",
      ...noindex(),
    },
  });
}

export const GET: APIRoute = async ({ params }) => {
  const house = parseHouseParam(params.house);
  if (!house) return new Response("Not found", { status: 404, headers: noindex() });
  if (params.house !== houseSlug(house)) {
    return new Response(null, {
      status: 301,
      headers: { Location: houseXPath(house), ...noindex() },
    });
  }

  const steward = await getHouseSteward(house);
  const handle = normalizeXHandle(steward?.x_handle);
  if (!steward || !handle) return new Response("Not found", { status: 404, headers: noindex() });

  const post = await sourcePostForHouse(house);
  const tweetId = post?.tweetId;
  const tweetHandle = normalizeXHandle(post?.handle) || handle;
  if (tweetId) {
    const live = await tweetStillPosted(tweetId);
    if (live !== false) return sendToX(tweetUrl(tweetHandle, tweetId));
  }
  return sendToX(xProfileUrl(handle));
};
