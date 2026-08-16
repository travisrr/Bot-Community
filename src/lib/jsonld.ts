import { canonical, SITE_NAME } from "./site";
import { houseLabel, paddedPath, runId } from "./format";
import { parseJsonArray } from "./html";
import type { RunRow, Steward } from "./types";
import { parseEvidence } from "./runs";

export type FaqItem = { q: string; a: string };

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
    a: "Yes. File a patch with evidence. The original filer has 24 hours to veto. Empty “this is better” text is rejected.",
  });
  return items.slice(0, 5);
}

export function jsonLdForRun(
  run: RunRow,
  origin: string,
  steward: Steward | null,
  faqs: FaqItem[],
): Record<string, unknown>[] {
  if (!run.serial) return [];
  const url = canonical(origin, paddedPath(run.serial));
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
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: origin },
    author: steward
      ? {
          "@type": "Person",
          name: steward.display_name,
          identifier: steward.house_number ? houseLabel(steward.house_number) : undefined,
        }
      : { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME, url: origin },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: origin },
      { "@type": "ListItem", position: 2, name: "Runs", item: canonical(origin, "/runs") },
      { "@type": "ListItem", position: 3, name: id, item: url },
    ],
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return [howTo, article, breadcrumb, faq];
}

export function firstSentence(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  const m = t.match(/^.{20,220}?[.!?](?:\s|$)/);
  if (m) return m[0].trim();
  return t.slice(0, 200).trim();
}
