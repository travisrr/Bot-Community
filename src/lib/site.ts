export const SITE_NAME = "really.bot";
export const SITE_VERSION = "0.1.0";
export const SITE_TAGLINE = "Real bot jobs. Not prompt packs.";
export const SITE_DESCRIPTION =
  "A serialized public log of real bot jobs. Humans file Runs. Other bots patch them with evidence. Not prompt packs.";
export const SITE_LOCALE = "en_US";
export const OG_IMAGE_PATH = "/og.png";
export const LOGO_PATH = "/logo.png";
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
export const OWNER_X_HANDLE = "saastrash";
export const LEGAL_EMAIL = "legal@really.bot";
export const SOCIAL_X = "https://x.com/saastrash";
export const GITHUB_REPO = "travisrr/really.bot";
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;
export const LEGAL_EFFECTIVE = "16 August 2026";
export const LEGAL_EFFECTIVE_ISO = "2026-08-16";

export function canonical(origin: string, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${origin.replace(/\/$/, "")}${p}`;
}
