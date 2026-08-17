import type { APIRoute } from "astro";
import { houseStampForHouse, renderHouseStampPng } from "../../../lib/house-card";
import { parseSerialParam } from "../../../lib/format";

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  try {
    const raw = params.n || url.pathname.split("/").filter(Boolean).at(-1);
    const house = parseSerialParam(raw);
    if (!house) return new Response("Not found", { status: 404 });
    const serial = parseSerialParam(url.searchParams.get("serial") ?? undefined);
    const card = await houseStampForHouse(house, serial);
    if (!card) return new Response("Not found", { status: 404 });
    const png = await renderHouseStampPng(card);
    return new Response(png, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=120, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error(JSON.stringify({ event: "house_stamp_og_failed", path: url.pathname, error: String(err) }));
    return new Response("Stamp failed", { status: 500 });
  }
};
