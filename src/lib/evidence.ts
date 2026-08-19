import { getEnv } from "./env";
import { randomToken } from "./crypto";
import { MAX_EVIDENCE_BYTES, MAX_EVIDENCE_FILES } from "./site";
import type { EvidenceItem } from "./types";
import { COMPETITOR_FILING_ERROR, isCompetitorUrl } from "./competitor";

export type EvidenceFields = {
  evidence_url?: string;
  evidence_url_note?: string;
  evidence_note?: string;
};

export function urlEvidence(href: string, note: string): EvidenceItem {
  const url = href.trim();
  const urlNote = note.trim();
  if (!url || !urlNote) {
    throw new Error("URL evidence needs both a URL and a note.");
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("bad");
  } catch {
    throw new Error("Evidence URL is not valid.");
  }
  if (isCompetitorUrl(url)) throw new Error(COMPETITOR_FILING_ERROR);
  return { kind: "url", href: url, note: urlNote };
}

export function coerceEvidenceList(raw: unknown): EvidenceItem[] {
  if (!Array.isArray(raw)) return [];
  const items: EvidenceItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    if (item.kind === "url" || item.kind === "image" || item.kind === "note") {
      items.push(item as EvidenceItem);
      continue;
    }
    const href = String(item.href || item.url || "").trim();
    const note = String(item.note || "").trim();
    if (href || note) items.push(urlEvidence(href, note));
  }
  return items;
}

export function collectJsonEvidence(body: Record<string, unknown>, parsed: EvidenceFields = {}): EvidenceItem[] {
  const items = coerceEvidenceList(body.evidence ?? body.evidence_urls);
  const url = String(body.evidence_url || parsed.evidence_url || "").trim();
  const urlNote = String(body.evidence_url_note || parsed.evidence_url_note || "").trim();
  if (url || urlNote) {
    const item = urlEvidence(url, urlNote);
    if (!items.some((entry) => entry.kind === "url" && entry.href === item.href)) items.push(item);
  }
  const note = String(body.evidence_note || parsed.evidence_note || "").trim();
  if (note && !items.some((entry) => entry.kind === "note" && !entry.key)) {
    items.push({ kind: "note", note });
  }
  return items;
}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "text/plain"]);

export async function putEvidenceFile(file: File, alt: string): Promise<EvidenceItem> {
  if (file.size > MAX_EVIDENCE_BYTES) {
    throw new Error(`File too large. Max ${MAX_EVIDENCE_BYTES / 1024 / 1024} MB.`);
  }
  const type = file.type || "application/octet-stream";
  if (!ALLOWED.has(type)) {
    throw new Error("Evidence must be an image, PDF, or text file.");
  }
  const key = `${randomToken(16)}`;
  await getEnv().EVIDENCE.put(key, file.stream(), {
    httpMetadata: { contentType: type },
    customMetadata: { alt: alt.slice(0, 240) },
  });
  const kind = type.startsWith("image/") ? "image" : "note";
  return {
    kind: kind === "image" ? "image" : "note",
    key,
    url: `/e/${key}`,
    alt: alt.slice(0, 240),
    note: kind === "note" ? alt : undefined,
    content_type: type,
  };
}

export async function collectEvidence(form: FormData): Promise<EvidenceItem[]> {
  const items: EvidenceItem[] = [];
  const files = form.getAll("evidence_file").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_EVIDENCE_FILES) {
    throw new Error(`At most ${MAX_EVIDENCE_FILES} files.`);
  }
  const alts = form.getAll("evidence_alt").map((v) => String(v));
  let i = 0;
  for (const file of files) {
    const alt = (alts[i] || file.name || "Evidence file").trim();
    items.push(await putEvidenceFile(file, alt));
    i += 1;
  }
  const url = String(form.get("evidence_url") || "").trim();
  const urlNote = String(form.get("evidence_url_note") || "").trim();
  if (url || urlNote) items.push(urlEvidence(url, urlNote));
  const note = String(form.get("evidence_note") || "").trim();
  if (note) {
    items.push({ kind: "note", note });
  }
  return items;
}

export async function getEvidenceObject(key: string) {
  return getEnv().EVIDENCE.get(key);
}
