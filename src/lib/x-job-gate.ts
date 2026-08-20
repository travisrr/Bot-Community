import { BOT_X_HANDLE } from "./site";

export const NOT_A_GROK_JOB =
  "This thread does not look like a finished Grok Bot job.";

export const NO_HARVEST_JOBS =
  "No Grok jobs in the replies yet. Tag again when people share ones they actually run.";

const AGENT =
  /\b(grok(?:\s*bots?)?|grokbot|@grok|chatgpt|gpt-?[45]|claude|gemini|copilot|computer use|x\.ai|grok\.com)\b/i;

/** Ads, hellos, and House-farming. Not a roundup to harvest. */
const NEVER_A_JOB: RegExp[] = [
  /\bgrok\s*bots?\s+directory\b/i,
  /\bdirectory of (?:ready-to-use\s+)?grok\s*bots?\b/i,
  /\bready-to-use grok\s*bots?\b/i,
  /\bbot directory\b/i,
  /\bbotdirectory(?:\.ai)?\b/i,
  /\b@botdirectoryai\b/i,
  /\breally\.bot\b/i,
  /\bget me a house\b/i,
  /\bhello world\b/i,
];

/** Root tweets asking people to share Grok bots — harvest each reply, do not file the ask. */
const HARVEST_ASK: RegExp[] = [
  /\bwhich bots?\b.{0,80}\b(?:created|built|made|set up|running|using)\b/i,
  /\bbots?\b.{0,48}\b(?:have you|did you|you(?:['’]ve| have))\b.{0,40}\b(?:created|built|made)\b/i,
  /\bupgrade my grok bot setup\b/i,
  /\b(?:share|drop|post|show)\b.{0,40}\b(?:your|the|their)\b.{0,32}\b(?:grok\s*)?bots?\b/i,
  /\b(?:\d{2,}|a hundred)\s+use cases\b/i,
  /\buse cases\b.{0,48}\b(?:i['’]?ve|i have|we(?:['’]ve| have)?)\s+seen\b/i,
  /\bwhat(?:['’]s| is) your (?:grok\s*)?bots?\b/i,
  /\breply with (?:your|the) (?:grok\s*)?bots?\b/i,
  /\bbots have you created\b/i,
];

/** Tag text that means “file every use case in this thread.” */
const HARVEST_TAG: RegExp[] = [
  /\b(?:file|log|import|add|catalog|collect|grab|harvest)\b.{0,48}\b(?:all|these|them|every|replies|comments|use cases|bots)\b/i,
  /\b(?:all|every)\b.{0,24}\b(?:use cases?|bots?|replies|comments)\b.{0,24}\b(?:board|directory|really\.bot)\b/i,
];

const REACTION_ONLY =
  /^(this|same|following|interested|me too|yes|yeah|yep|wow|cool|nice|love this|great (?:question|thread)|underrated|needed this)[.!]?\s*$/i;

const SHOUTOUT_HANDLES = new Set(["elonmusk", "openai", "sama"]);

export function strippedText(text: string): string {
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
  const rest = strippedText(mentionText);
  if (rest.length >= 48) return false;
  if (others.length >= 2) return true;
  return others.some((h) => SHOUTOUT_HANDLES.has(h));
}

export function isHarvestAsk(text: string): boolean {
  const body = text.trim();
  if (!body) return false;
  return HARVEST_ASK.some((re) => re.test(body));
}

export function isHarvestTag(mentionText: string): boolean {
  return HARVEST_TAG.some((re) => re.test(mentionText));
}

export function isNeverAJob(text: string): boolean {
  return NEVER_A_JOB.some((re) => re.test(text));
}

export function isReactionReply(text: string): boolean {
  return REACTION_ONLY.test(strippedText(text));
}

const NUMBERED_ITEM = /(?:^|\n)\s*\d{1,3}[.)]\s+\S/;

export function hasNumberedUseCases(text: string): boolean {
  const parts = splitNumberedUseCases(text);
  return parts.length >= 2;
}

export function splitNumberedUseCases(text: string): string[] {
  const body = text.trim();
  if (!NUMBERED_ITEM.test(`\n${body}`)) return [];
  const parts = body
    .split(/(?=(?:^|\n)\s*\d{1,3}[.)]\s+)/)
    .map((part) => part.trim())
    .filter((part) => /^\d{1,3}[.)]\s+\S/.test(part) && strippedText(part).length >= 24);
  return parts.length >= 2 ? parts : [];
}

/** A tag is a filing only when the thread is someone's finished Grok (or agent) job. */
export function finishedJobGate(
  threadText: string,
  mentionText = "",
): { ok: true } | { ok: false; reason: string } {
  const thread = threadText.trim();
  const mention = mentionText.trim();
  if (mentionIsShoutout(mention)) return { ok: false, reason: NOT_A_GROK_JOB };
  if (isHarvestAsk(thread) || isHarvestAsk(mention) || isHarvestTag(mention)) {
    return { ok: false, reason: NOT_A_GROK_JOB };
  }
  if (isNeverAJob(thread) || isNeverAJob(mention)) {
    return { ok: false, reason: NOT_A_GROK_JOB };
  }
  if (strippedText(thread).length < 24) return { ok: false, reason: NOT_A_GROK_JOB };
  if (!AGENT.test(thread) && !AGENT.test(mention)) return { ok: false, reason: NOT_A_GROK_JOB };
  return { ok: true };
}
