import { escapeHtml } from "./html";

export const MAX_WHO_WORDS = 7;

const FILLER_LEAD = /^(makes?|making|does|do|writes?|creates?|provides?|offers?)\s+/i;

function mailPhrase(): RegExp {
  return /\b(?:(?:weekly|daily|email)\s+)?(?:the\s+)?newsletter\b/gi;
}

function mailIconHtml(): string {
  return `<span class="who-mail" title="newsletter"><svg class="who-mail-ic" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"/></svg><span class="sr-only">newsletter</span></span>`;
}

/** Shorten a who-line so it fits beside an @handle. */
export function packWho(raw: string): string {
  let t = raw.replace(/\s+/g, " ").trim();
  if (!t) return "";
  t = t.replace(/\s*,?\s+\band\s+/gi, ", ");
  t = t.replace(/\s+as well as\s+/gi, ", ");
  t = t.replace(/\s+&\s+/g, ", ");
  t = t.replace(/\s*,\s*,+/g, ", ");
  t = t.replace(/\s+,/g, ",").replace(/,(?=\S)/g, ", ");
  t = t.replace(/\s+/g, " ").trim();
  return t.replace(/^,+\s*/, "").replace(/[.,;:]+$/g, "");
}

export function clampWho(raw: string, max = MAX_WHO_WORDS): string {
  const stripped = raw
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(FILLER_LEAD, "");
  const packed = packWho(stripped);
  const words = packed.split(/\s+/).filter(Boolean);
  const clipped = packWho(words.slice(0, max).join(" "));
  if (!clipped) return "";
  return clipped.charAt(0).toUpperCase() + clipped.slice(1);
}

export function whoLine(raw: string | null | undefined): string | null {
  const t = clampWho((raw || "").trim());
  return t || null;
}

export function fallbackWhoFromBio(bio: string): string {
  let t = bio.replace(/https?:\/\/\S+/gi, " ").replace(/t\.co\/\S+/gi, " ");
  t = t.replace(/@([A-Za-z0-9_]+)/g, (_m, handle: string) => handle.replaceAll("_", " "));
  t = t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, " ");
  t = t.split(/[|•/]+/)[0] ?? t;
  t = t.split(/\b(?:prev(?:iously)?|former|ex-)\b/i)[0] ?? t;
  t = t.replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
  return clampWho(t);
}

/** Escaped who-line with newsletter packed to a mail mark. */
export function whoLineHtml(raw: string | null | undefined): string {
  const packed = whoLine(raw);
  if (!packed) return "";
  return escapeHtml(packed).replace(mailPhrase(), mailIconHtml());
}
