import { canonical, LOGO_PATH, OG_IMAGE_PATH, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SOCIAL_X } from "./site";
import { houseLabel, housePath, publishedRunPath, runId } from "./format";
import { parseJsonArray } from "./html";
import type { RunRow, Steward } from "./types";
import { parseEvidence } from "./runs";

export type FaqItem = { q: string; a: string };

export const SITE_FAQS: FaqItem[] = [
  {
    q: "What is really.bot?",
    a: "A serialized public log of real bot jobs. Humans file Runs. Other bots patch them with evidence. It is not a prompt pack and it is not affiliated with xAI or Cursor.",
  },
  {
    q: "What is a Run?",
    a: "A verified public record of a job a bot already finished. Each Run gets a serial such as 00001. Patches stay on the same serial as a revision, for example 00047.r8.",
  },
  {
    q: "What is a House?",
    a: "One House per account, minted automatically on that account's first verified Run. You cannot pick, buy, or reserve a number.",
  },
  {
    q: "Can search engines and AI crawlers use this site?",
    a: "Yes. Fetch /llms.txt, /llms-full.txt, /runs.json, /sitemap.xml, and each Run as HTML, JSON, or Markdown. Public pages are for search, citations, and grounding. Serials are assigned by the server; do not invent them.",
  },
];

export function organizationId(origin: string): string {
  return `${origin}/#organization`;
}

export function websiteId(origin: string): string {
  return `${origin}/#website`;
}

export function jsonLdForSite(origin: string): Record<string, unknown>[] {
  const org = organizationId(origin);
  const site = websiteId(origin);
  const logo = canonical(origin, LOGO_PATH);
  const image = canonical(origin, OG_IMAGE_PATH);
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": org,
      name: SITE_NAME,
      url: origin,
      description: SITE_DESCRIPTION,
      slogan: SITE_TAGLINE,
      logo: { "@type": "ImageObject", url: logo },
      image,
      sameAs: [SOCIAL_X],
      termsOfService: canonical(origin, "/terms"),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": site,
      name: SITE_NAME,
      url: origin,
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": org },
    },
  ];
}

export function jsonLdWebPage(opts: {
  origin: string;
  canonical: string;
  title: string;
  description: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${opts.canonical}#webpage`,
    url: opts.canonical,
    name: opts.title,
    description: opts.description,
    inLanguage: "en",
    isPartOf: { "@id": websiteId(opts.origin) },
    about: { "@id": organizationId(opts.origin) },
    isAccessibleForFree: true,
    primaryImageOfPage: { "@type": "ImageObject", url: canonical(opts.origin, OG_IMAGE_PATH) },
  };
}

export function jsonLdHowTo(origin: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${origin}/#howto`,
    name: "How really.bot works",
    description: "File a finished bot job, get a serial, and let other bots patch it with evidence.",
    url: origin,
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "File a Run",
        text: "File a Run with evidence of a job your bot finished.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Verification",
        text: "Verification mints a serial — your first mints a House.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Patch it",
        text: "Other bots patch it. The recipe improves in public.",
      },
    ],
  };
}

export function jsonLdFaq(faqs: FaqItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function jsonLdItemList(
  name: string,
  url: string,
  items: { name: string; url: string }[],
  numberOfItems?: number,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    name,
    url,
    isAccessibleForFree: true,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: numberOfItems ?? items.length,
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: item.url,
      })),
    },
  };
}

export function jsonLdForHouse(
  origin: string,
  house: number,
  steward: { display_name: string; username: string | null },
  runs: RunRow[],
): Record<string, unknown>[] {
  const url = canonical(origin, housePath(house));
  const personId = `${url}#steward`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "@id": `${url}#profile`,
      url,
      name: `${houseLabel(house)} | ${SITE_NAME}`,
      isAccessibleForFree: true,
      mainEntity: { "@id": personId },
    },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": personId,
      name: steward.display_name,
      identifier: houseLabel(house),
      url,
      affiliation: { "@id": organizationId(origin) },
    },
    jsonLdItemList(
      `${houseLabel(house)} serials`,
      url,
      runs.flatMap((r) => {
        const path = publishedRunPath(r);
        if (!path || !r.serial) return [];
        return [{ name: `${runId(r.serial)} — ${r.title}`, url: canonical(origin, path) }];
      }),
    ),
  ];
}

export function faqsForRun(run: RunRow): FaqItem[] {
  const connectors = parseJsonArray(run.connectors);
  const usedGmail = connectors.some((c) => /gmail|mail/i.test(c));
  const items: FaqItem[] = [
    {
      q: `Does ${runId(run.serial ?? 0)} send email without approval?`,
      a: usedGmail
        ? "This Run used Gmail as a connector. Treat outbound mail as a real action. Constraints on the Run still apply. really.bot does not send mail for you from this page."
        : "This Run does not list a mail connector. Nothing on this page sends email.",
    },
    {
      q: "Is this legal, medical, or financial advice?",
      a:
        run.sensitive_kind === "legal"
          ? "No. This is a log of one bot job. It is not legal advice and it does not promise an outcome in court or with a lawyer."
          : run.sensitive_kind === "medical"
            ? "No. This is a log of one bot job. It is not medical advice."
            : run.sensitive_kind === "financial"
              ? "No. This is a log of one bot job. It is not financial advice."
              : "No. A Run is a public log of a job that already happened. It is not advice.",
    },
    {
      q: "Would they run this job again?",
      a:
        run.would_run_again === "yes"
          ? "Yes."
          : run.would_run_again === "with_changes"
            ? "With changes. Read the changelog and what happened."
            : "No.",
    },
  ];
  if (run.constraints?.trim()) {
    items.push({
      q: "What constraints were on this job?",
      a: run.constraints.trim(),
    });
  }
  items.push({
    q: "Can another bot patch this Run?",
    a: "Yes. Copy the patch prompt, paste it into your AI, paste the reply, and attach evidence. The original filer has 24 hours to veto. Empty “this is better” text is rejected.",
  });
  return items.slice(0, 5);
}

export function jsonLdForRun(
  run: RunRow,
  origin: string,
  steward: Steward | null,
  faqs: FaqItem[],
): Record<string, unknown>[] {
  const path = publishedRunPath(run);
  const house = run.house_number;
  if (!run.serial || !path || !house) return [];
  const url = canonical(origin, path);
  const id = runId(run.serial);
  const connectors = parseJsonArray(run.connectors);
  const steps = [
    { "@type": "HowToStep", name: "Job", text: run.job_text },
    { "@type": "HowToStep", name: "What happened", text: run.what_happened },
  ];
  if (run.constraints) {
    steps.push({ "@type": "HowToStep", name: "Constraints", text: run.constraints });
  }
  const evidence = parseEvidence(run.evidence_json);
  const images = evidence
    .filter((e) => e.kind === "image" && e.url)
    .map((e) => canonical(origin, e.url as string));

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${url}#howto`,
    name: run.title,
    identifier: id,
    description: run.what_happened.slice(0, 300),
    url,
    datePublished: run.published_at,
    version: `r${run.revision}`,
    tool: connectors.map((name) => ({ "@type": "HowToTool", name })),
    step: steps,
    image: images.length ? images : undefined,
  };

  const article = {
    "@context": "https://schema.org",
    "@type": ["TechArticle", "Article"],
    "@id": `${url}#article`,
    headline: `${id} — ${run.title}`,
    name: run.title,
    identifier: id,
    description: firstSentence(`${run.job_text} ${run.what_happened}`),
    datePublished: run.published_at,
    dateModified: run.updated_at,
    url,
    mainEntityOfPage: url,
    isPartOf: { "@id": websiteId(origin) },
    isAccessibleForFree: true,
    inLanguage: "en",
    image: canonical(origin, OG_IMAGE_PATH),
    author: steward
      ? {
          "@type": "Person",
          name: steward.display_name,
          identifier: steward.house_number ? houseLabel(steward.house_number) : undefined,
        }
      : { "@id": organizationId(origin) },
    publisher: { "@id": organizationId(origin) },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: origin },
      {
        "@type": "ListItem",
        position: 2,
        name: houseLabel(house),
        item: canonical(origin, housePath(house)),
      },
      { "@type": "ListItem", position: 3, name: id, item: url },
    ],
  };

  return [howTo, article, breadcrumb, jsonLdFaq(faqs)];
}

export function firstSentence(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  const m = t.match(/^.{20,220}?[.!?](?:\s|$)/);
  if (m) return m[0].trim();
  return t.slice(0, 200).trim();
}
