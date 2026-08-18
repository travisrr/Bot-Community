import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { BLOG_DESCRIPTION, BLOG_PATH, blogOrigin, blogPath, sortBlogPosts } from "../../lib/blog";
import { CRAWL_CACHE } from "../../lib/http";
import { escapeHtml } from "../../lib/html";
import { canonical, OG_IMAGE_PATH, SITE_NAME } from "../../lib/site";

export const GET: APIRoute = async ({ site, locals }) => {
  const origin = blogOrigin(site) || locals.origin;
  const posts = sortBlogPosts(await getCollection("blog"));
  const items = posts
    .map((post) => {
      const url = canonical(origin, blogPath(post.id));
      return `<item>
  <title>${escapeHtml(post.data.title)}</title>
  <link>${url}</link>
  <guid>${url}</guid>
  <pubDate>${post.data.published.toUTCString()}</pubDate>
  <description>${escapeHtml(post.data.description)}</description>
</item>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${SITE_NAME} blog</title>
  <link>${canonical(origin, BLOG_PATH)}</link>
  <atom:link href="${canonical(origin, "/blog/rss.xml")}" rel="self" type="application/rss+xml"/>
  <description>${escapeHtml(BLOG_DESCRIPTION)}</description>
  <language>en-us</language>
  <image>
    <url>${canonical(origin, OG_IMAGE_PATH)}</url>
    <title>${SITE_NAME} blog</title>
    <link>${canonical(origin, BLOG_PATH)}</link>
  </image>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  ${items}
</channel>
</rss>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": CRAWL_CACHE,
    },
  });
};
