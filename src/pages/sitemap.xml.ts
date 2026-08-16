import type { APIRoute } from "astro";
import { listPublishedRuns } from "../lib/runs";
import { listClaimedHouses } from "../lib/houses";
import { housePath, paddedPath } from "../lib/format";
import { siteOrigin } from "../lib/env";
import { canonical } from "../lib/site";

export const GET: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  const runs = await listPublishedRuns(5000);
  const houses = await listClaimedHouses();
  const urls = [
    { loc: canonical(origin, "/"), pri: "1.0" },
    { loc: canonical(origin, "/runs"), pri: "0.9" },
    { loc: canonical(origin, "/houses"), pri: "0.8" },
    { loc: canonical(origin, "/about"), pri: "0.7" },
    { loc: canonical(origin, "/submit"), pri: "0.6" },
    { loc: canonical(origin, "/changelog"), pri: "0.5" },
    ...runs.filter((r) => r.serial).map((r) => ({ loc: canonical(origin, paddedPath(r.serial as number)), pri: "0.8" })),
    ...houses.map((h) => ({ loc: canonical(origin, housePath(h.house_number)), pri: "0.6" })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url><loc>${u.loc}</loc><changefreq>weekly</changefreq><priority>${u.pri}</priority></url>`,
  )
  .join("\n")}
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
