import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { listPublishedRuns } from "../lib/runs";
import { listClaimedHouses } from "../lib/houses";
import { housePath, publishedRunPath } from "../lib/format";
import { RUN_CAT_IDS, catPath } from "../lib/category";
import { BLOG_PATH, blogPath } from "../lib/blog";
import { siteOrigin } from "../lib/env";
import { canonical } from "../lib/site";
import { crawlable } from "../lib/http";

function w3cDate(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export const GET: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  const runs = await listPublishedRuns(5000);
  const houses = await listClaimedHouses();
  const posts = await getCollection("blog");
  const latestRun = runs[0]?.updated_at ?? runs[0]?.published_at;
  const latestPost = posts
    .map((p) => (p.data.updated ?? p.data.published).toISOString())
    .sort()
    .at(-1);
  const now = new Date().toISOString();
  const urls: { loc: string; pri: string; lastmod?: string; changefreq: string }[] = [
    { loc: canonical(origin, "/"), pri: "1.0", lastmod: w3cDate(latestRun) ?? now, changefreq: "daily" },
    { loc: canonical(origin, "/runs"), pri: "0.9", lastmod: w3cDate(latestRun) ?? now, changefreq: "daily" },
    { loc: canonical(origin, "/houses"), pri: "0.8", lastmod: now, changefreq: "weekly" },
    { loc: canonical(origin, "/about"), pri: "0.8", lastmod: now, changefreq: "monthly" },
    { loc: canonical(origin, "/ai-info"), pri: "0.8", lastmod: now, changefreq: "monthly" },
    { loc: canonical(origin, "/bots"), pri: "0.8", lastmod: now, changefreq: "monthly" },
    { loc: canonical(origin, BLOG_PATH), pri: "0.7", lastmod: latestPost ?? now, changefreq: "weekly" },
    { loc: canonical(origin, "/qa"), pri: "0.7", lastmod: now, changefreq: "monthly" },
    { loc: canonical(origin, "/sponsor"), pri: "0.5", lastmod: now, changefreq: "monthly" },
    { loc: canonical(origin, "/submit"), pri: "0.5", changefreq: "monthly" },
    { loc: canonical(origin, "/changelog"), pri: "0.4", changefreq: "weekly" },
    { loc: canonical(origin, "/terms"), pri: "0.3", lastmod: now, changefreq: "yearly" },
    { loc: canonical(origin, "/privacy"), pri: "0.3", lastmod: now, changefreq: "yearly" },
    ...RUN_CAT_IDS.map((cat) => ({
      loc: canonical(origin, catPath(cat)),
      pri: "0.7",
      lastmod: w3cDate(latestRun) ?? now,
      changefreq: "daily",
    })),
    ...runs.flatMap((r) => {
      const path = publishedRunPath(r);
      if (!path) return [];
      return [
        {
          loc: canonical(origin, path),
          pri: "0.8",
          lastmod: w3cDate(r.updated_at ?? r.published_at),
          changefreq: "weekly",
        },
      ];
    }),
    ...houses.map((h) => ({
      loc: canonical(origin, housePath(h.house_number)),
      pri: "0.6",
      lastmod: w3cDate(h.house_claimed_at),
      changefreq: "weekly",
    })),
    ...posts.map((post) => ({
      loc: canonical(origin, blogPath(post.id)),
      pri: "0.7",
      lastmod: (post.data.updated ?? post.data.published).toISOString(),
      changefreq: "monthly",
    })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => {
    const last = u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : "";
    return `  <url><loc>${u.loc}</loc>${last}<changefreq>${u.changefreq}</changefreq><priority>${u.pri}</priority></url>`;
  })
  .join("\n")}
</urlset>`;
  return crawlable(xml, "application/xml; charset=utf-8");
};
