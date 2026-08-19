import { BOT_X_HANDLE } from "./site";

export const NOT_A_GROK_JOB =
  "This thread does not look like a finished Grok Bot job.";

const AGENT =
  /\b(grok(?:\s*bots?)?|grokbot|@grok|chatgpt|gpt-?[45]|claude|gemini|copilot|computer use|x\.ai|grok\.com)\b/i;

const NOT_A_JOB: RegExp[] = [
  /\bgrok\s*bots?\s+directory\b/i,
  /\bdirectory of (?:ready-to-use\s+)?grok\s*bots?\b/i,
  /\bready-to-use grok\s*bots?\b/i,
  /\bbot directory\b/i,
  /\breally\.bot\b/i,
  /\bshare (?:your|the|their) .{0,48}\b(?:grok\s*)?bots?\b.{0,40}\b(?:designs?|setups?|prompts?|creations?)\b/i,
  /\b(?:post|show|drop) (?:us |me )?(?:your|the) .{0,24}\b(?:grok\s*)?bots?\b/i,
  /\bget me a house\b/i,
  /\bhello world\b/i,
];

const SHOUTOUT_HANDLES = new Set(["elonmusk", "openai", "sama"]);

function stripped(text: string): string {
  const bot = BOT_X_HANDLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text
    .replace(new RegExp(`@${bot}`, "gi"), " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/t\.co\/\S+/gi, " ")
    .replace(/@\w+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mentionIsShoutout(mentionText: string): boolean {
  const handles = [...mentionText.matchAll(/@([A-Za-z0-9_]+)/g)].map((m) => m[1].toLowerCase());
  if (!handles.includes(BOT_X_HANDLE.toLowerCase())) return false;
  const others = handles.filter((h) => h !== BOT_X_HANDLE.toLowerCase());
  const rest = stripped(mentionText);
  if (rest.length >= 48) return false;
  if (others.length >= 2) return true;
  return others.some((h) => SHOUTOUT_HANDLES.has(h));
}

/** A tag is a filing only when the thread is someone's finished Grok (or agent) job. */
export function finishedJobGate(
  threadText: string,
  mentionText = "",
): { ok: true } | { ok: false; reason: string } {
  const thread = threadText.trim();
  const mention = mentionText.trim();
  if (mentionIsShoutout(mention)) return { ok: false, reason: NOT_A_GROK_JOB };
  if (NOT_A_JOB.some((re) => re.test(thread) || re.test(mention))) {
    return { ok: false, reason: NOT_A_GROK_JOB };
  }
  if (stripped(thread).length < 24) return { ok: false, reason: NOT_A_GROK_JOB };
  if (!AGENT.test(thread) && !AGENT.test(mention)) return { ok: false, reason: NOT_A_GROK_JOB };
  return { ok: true };
}
