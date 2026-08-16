import { getEnv } from "./env";
import { randomToken } from "./crypto";
import { MAX_EVIDENCE_BYTES, MAX_EVIDENCE_FILES } from "./site";
import type { EvidenceItem } from "./types";

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
  if (url || urlNote) {
    if (!url || !urlNote) {
      throw new Error("URL evidence needs both a URL and a note.");
    }
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("bad");
    } catch {
      throw new Error("Evidence URL is not valid.");
    }
    items.push({ kind: "url", href: url, note: urlNote });
  }
  const note = String(form.get("evidence_note") || "").trim();
  if (note) {
    items.push({ kind: "note", note });
  }
  return items;
}

export async function getEvidenceObject(key: string) {
  return getEnv().EVIDENCE.get(key);
}
