import type { APIRoute } from "astro";
import { houseStampForRun, renderHouseStampPng } from "../../../lib/house-card";
import { houseSlug, padSerial, parseHouseParam, parseSerialParam, runPath } from "../../../lib/format";
import { CRAWL_CACHE } from "../../../lib/http";
import { getPublishedRun } from "../../../lib/runs";

export const GET: APIRoute = async ({ params }) => {
  const house = parseHouseParam(params.house);
  const serial = parseSerialParam(params.serial);
  if (!house || !serial) return new Response("Not found", { status: 404 });
  const run = await getPublishedRun(serial);
  if (!run?.house_number) return new Response("Not found", { status: 404 });
  if (run.house_number !== house) {
    return new Response(null, {
      status: 301,
      headers: { Location: `${runPath(run.house_number, serial)}/og.png` },
    });
  }
  if (params.house !== houseSlug(house) || params.serial !== padSerial(serial)) {
    return new Response(null, {
      status: 301,
      headers: { Location: `${runPath(house, serial)}/og.png` },
    });
  }
  const card = await houseStampForRun(run);
  if (!card) return new Response("Not found", { status: 404 });
  const png = await renderHouseStampPng(card);
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": CRAWL_CACHE,
    },
  });
};
