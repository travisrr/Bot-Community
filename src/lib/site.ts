export const SITE_NAME = "really.bot";
export const SITE_TAGLINE = "Real bot jobs. Not prompt packs.";
export const FOOTER_NOTE =
  "Not affiliated with xAI or Cursor. Real jobs only. You own your prompt. really.bot displays it.";

export const VETO_HOURS = 24;
export const SESSION_DAYS = 30;
export const SESSION_COOKIE = "br_session";
export const FLASH_COOKIE = "br_flash";
export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
export const MAX_EVIDENCE_FILES = 6;
export const USERNAME_RE = /^[a-z0-9_]{3,24}$/;
export const MIN_PASSWORD = 10;

export function canonical(origin: string, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${origin.replace(/\/$/, "")}${p}`;
}
