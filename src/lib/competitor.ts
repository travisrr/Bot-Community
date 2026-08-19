import type { EvidenceItem } from "./types";

export const COMPETITOR_FILING_ERROR = "This filing cites a blocked catalog.";

const HOSTS = ["botdirectory.ai", "www.botdirectory.ai"];
const PHRASES = [
  /\bbotdirectory(?:\.ai)?\b/gi,
  /\bbot\s*directory(?:\s+api)?\b/gi,
  /\b@botdirectoryai\b/gi,
];

export const COMPETITOR_X_HANDLES = ["elie2222", "botdirectoryai"];

export function isCompetitorHandle(handle: string | null | undefined): boolean {
  return COMPETITOR_X_HANDLES.includes((handle || "").replace(/^@/, "").trim().toLowerCase());
}

export function isCompetitorUrl(raw: string | null | undefined): boolean {
  const href = (raw || "").trim();
  if (!href) return false;
  try {
    const host = new URL(href).hostname.replace(/^www\./, "").toLowerCase();
    return HOSTS.some((h) => h.replace(/^www\./, "") === host);
  } catch {
    return HOSTS.some((h) => href.toLowerCase().includes(h));
  }
}

export function mentionsCompetitor(text: string | null | undefined): boolean {
  const s = text || "";
  if (!s.trim()) return false;
  if (HOSTS.some((h) => s.toLowerCase().includes(h))) return true;
  return PHRASES.some((re) => {
    re.lastIndex = 0;
    return re.test(s);
  });
}

export function filingCitesCompetitor(...parts: Array<string | null | undefined>): boolean {
  return parts.some((part) => mentionsCompetitor(part));
}

export function scrubCompetitorCopy(text: string): string {
  let out = text;
  out = out.replace(/\bGrok Bot Directory\b/gi, "Grok bot catalog");
  out = out.replace(/\bFetch and Save Bot Directory Data\b/gi, "Fetch and save catalog data");
  out = out.replace(/https?:\/\/(?:www\.)?botdirectory\.ai\S*/gi, "");
  out = out.replace(/\bpublished (?:this )?(?:Grok Bot )?setup on botdirectory\.ai\b/gi, "published this Grok Bot setup");
  out = out.replace(/\bpublished on botdirectory\.ai by @(\w+)\b/gi, "published by @$1");
  out = out.replace(/\bby @(\w+) on botdirectory\.ai\b/gi, "by @$1");
  out = out.replace(/\bon botdirectory\.ai by @(\w+)\b/gi, "by @$1");
  out = out.replace(/\bcreated a bot on botdirectory\.ai\b/gi, "published this Grok Bot setup");
  out = out.replace(/\ba new bot on botdirectory\.ai\b/gi, "a new bot");
  out = out.replace(/\bin the botdirectory\.ai\b/gi, "");
  out = out.replace(/\bon botdirectory\.ai\b/gi, "");
  out = out.replace(/\bfrom botdirectory\.ai\b/gi, "");
  out = out.replace(/\b@botdirectoryai\b/gi, "");
  out = out.replace(/\bBotDirectory API\b/gi, "web");
  out = out.replace(/\bBot Directory API\b/gi, "web");
  out = out.replace(/\bthe Bot Directory website\b/gi, "the public web");
  out = out.replace(/\bthe Bot Directory\b/gi, "a public catalog");
  out = out.replace(/\bBot Directory\b/gi, "a public catalog");
  out = out.replace(/\bbotdirectory(?:\.ai)?\b/gi, "");
  return out
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/  +/g, " ")
    .trim();
}

export function scrubCompetitorConnectors(connectors: string[]): string[] {
  const out: string[] = [];
  for (const raw of connectors) {
    const n = raw.trim();
    if (!n) continue;
    if (/bot\s*directory/i.test(n) || /botdirectory/i.test(n)) {
      if (!out.some((c) => c.toLowerCase() === "web")) out.push("web");
      continue;
    }
    out.push(n);
  }
  return out;
}

export function scrubCompetitorEvidence(items: EvidenceItem[], fallbackHandle?: string | null): EvidenceItem[] {
  const cleaned: EvidenceItem[] = [];
  for (const item of items) {
    const href = (item.href || item.url || "").trim();
    const note = scrubCompetitorCopy(item.note || item.alt || "");
    if (href && isCompetitorUrl(href)) continue;
    if (mentionsCompetitor(item.note) && !href) continue;
    if (item.kind === "url" && href) {
      cleaned.push({ ...item, href, note: note || "Public Grok Bot setup." });
      continue;
    }
    cleaned.push({ ...item, note: note || item.note });
  }
  if (cleaned.length) return cleaned;
  const handle = (fallbackHandle || "").replace(/^@/, "").trim();
  if (handle && !isCompetitorHandle(handle)) {
    return [
      {
        kind: "url",
        href: `https://x.com/${handle}`,
        note: `Public Grok Bot setup attributed to @${handle}.`,
      },
    ];
  }
  return [{ kind: "note", note: "Public Grok Bot setup. Catalog URL removed." }];
}
