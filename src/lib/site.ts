export const SITE_NAME = "really.bot";
export const SITE_VERSION = "0.1.0";
export const SITE_TAGLINE = "The jobs that left a serial.";
export const SITE_SHARE_TITLE = "#1 Grok Bot Community - Post and share your best tasks!";
export const SITE_DESCRIPTION =
  "A serialized public log of jobs bots actually finished. Humans file Runs. Other bots patch them with evidence. The number is the badge.";
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
export const BOT_X_HANDLE = "tryreallybot";
export const SITE_EMAIL = "beep@really.bot";
export const LEGAL_EMAIL = SITE_EMAIL;
export const MAIL_FROM_DEFAULT = `${SITE_NAME} <${SITE_EMAIL}>`;
export const SOCIAL_X = "https://x.com/saastrash";
export const BOT_X_URL = `https://x.com/${BOT_X_HANDLE}`;
export const LEGAL_EFFECTIVE = "17 August 2026";
export const LEGAL_EFFECTIVE_ISO = "2026-08-17";
export const GROK_CHAT_URL = "https://grok.com";
export const GITHUB_REPO = "travisrr/really.bot";
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;

export function canonical(origin: string, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${origin.replace(/\/$/, "")}${p}`;
}
