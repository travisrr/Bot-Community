import type { FaqItem } from "./jsonld";
import { jsonLdFaq, organizationId, websiteId } from "./jsonld";
import { canonical, OG_IMAGE_PATH, SITE_NAME } from "./site";

export const BLOG_PATH = "/blog";
export const BLOG_TITLE = "Blog";
export const BLOG_DESCRIPTION =
  "A serialized public log explained in English. Every post cites a live Run, a House, and official docs — not a prompt pack.";

export const BLOG_PILLARS = ["Run Breakdowns", "Agentic Architecture", "State of Grok"] as const;
export type BlogPillar = (typeof BLOG_PILLARS)[number];

export type BlogFaq = FaqItem;

export type BlogPostData = {
  title: string;
  week: number;
  pillar: BlogPillar;
  description: string;
  published: Date;
  updated?: Date;
  primaryQuery: string;
  secondaryQueries: string[];
  faqs: BlogFaq[];
  sensitiveKind?: "legal" | "medical" | "financial";
};

export function blogPath(slug: string): string {
  return `${BLOG_PATH}/${slug}`;
}

export function blogOrigin(site: URL | undefined): string {
  return site?.origin ?? "https://really.bot";
}

export function pillarKicker(pillar: BlogPillar): string {
  switch (pillar) {
    case "Run Breakdowns":
      return "Run Breakdowns";
    case "Agentic Architecture":
      return "Agentic Architecture";
    case "State of Grok":
      return "State of Grok";
    default: {
      const _never: never = pillar;
      return _never;
    }
  }
}

export function sortBlogPosts<T extends { data: { week: number } }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => a.data.week - b.data.week);
}

export function jsonLdBlogIndex(
  origin: string,
  posts: { title: string; slug: string }[],
): Record<string, unknown> {
  const url = canonical(origin, BLOG_PATH);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    url,
    name: `${BLOG_TITLE} | ${SITE_NAME}`,
    description: BLOG_DESCRIPTION,
    isPartOf: { "@id": websiteId(origin) },
    isAccessibleForFree: true,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: posts.length,
      itemListElement: posts.map((post, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: post.title,
        url: canonical(origin, blogPath(post.slug)),
      })),
    },
  };
}

export function jsonLdBlogPost(opts: {
  origin: string;
  slug: string;
  title: string;
  description: string;
  published: Date;
  updated?: Date;
  faqs: FaqItem[];
}): Record<string, unknown>[] {
  const url = canonical(opts.origin, blogPath(opts.slug));
  const published = opts.published.toISOString();
  const modified = (opts.updated ?? opts.published).toISOString();
  const image = canonical(opts.origin, OG_IMAGE_PATH);
  const article = {
    "@context": "https://schema.org",
    "@type": ["BlogPosting", "TechArticle"],
    "@id": `${url}#article`,
    headline: opts.title,
    name: opts.title,
    description: opts.description,
    datePublished: published,
    dateModified: modified,
    url,
    mainEntityOfPage: url,
    isPartOf: { "@id": websiteId(opts.origin) },
    isAccessibleForFree: true,
    inLanguage: "en",
    image,
    author: { "@id": organizationId(opts.origin) },
    publisher: { "@id": organizationId(opts.origin) },
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: opts.origin },
      { "@type": "ListItem", position: 2, name: BLOG_TITLE, item: canonical(opts.origin, BLOG_PATH) },
      { "@type": "ListItem", position: 3, name: opts.title, item: url },
    ],
  };
  return [article, breadcrumb, jsonLdFaq(opts.faqs)];
}
