import { dedupeConnectors } from "./tools";

export function looksPrivateCopy(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/\b(an?|my|our)\s+associate\b/i.test(t)) return true;
  if (/\bnamed\s+['"“]/i.test(t)) return true;
  if (/\bover\s+\d+\s*%\s+of\b/i.test(t)) return true;
  if (/\b(my|our)\s+(group chat|imessage)\b/i.test(t)) return true;
  if (/\b(text|message|ping)\s+(to\s+)?(an?\s+)?(associate|colleague)\s+named\b/i.test(t)) return true;
  return /['"“][^'"”]{2,40}['"”]/.test(t) && /\b(named|associate|colleague|text to)\b/i.test(t);
}

export const looksPrivatePrompt = looksPrivateCopy;

export function isGlueConnector(name: string): boolean {
  return /^(grok(\s*bot)?|chatgpt|gpt-?\d(\.\d)?|claude|gemini|llama|copilot|hermes)$/i.test(name.trim());
}

export function looksPrivateFiling(current: {
  title: string;
  job_text: string;
  prompt_text?: string | null;
  what_happened: string;
  connectors: string[];
}): boolean {
  if (looksPrivateCopy(current.title)) return true;
  if (looksPrivateCopy(current.job_text)) return true;
  if (looksPrivateCopy(current.prompt_text || "")) return true;
  if (looksPrivateCopy(current.what_happened)) return true;
  return current.connectors.some(isGlueConnector);
}

export function publicTitleFrom(text: string, prev: string): string {
  const first = (text.split(/(?<=\.)\s+/)[0] || text).replace(/\s+/g, " ").trim().replace(/[.,;:]+$/, "");
  if (first.length >= 8 && first.length <= 72 && !looksPrivateCopy(first)) return first;
  if (first.length > 72) {
    const cut = first.slice(0, 72).replace(/\s+\S*$/, "").replace(/[.,;:]+$/, "");
    if (cut.length >= 8 && !looksPrivateCopy(cut)) return cut;
  }
  return prev;
}

export function derivePublicConnectors(text: string, listed: string[]): string[] {
  const t = text.toLowerCase();
  const out: string[] = [];
  if (/\b(gmail|e-?mail)\b/.test(t)) out.push("Gmail");
  if (/\bslack\b/.test(t)) out.push("Slack");
  if (/\bgithub\b/.test(t)) out.push("GitHub");
  if (/\bcalendar\b/.test(t)) out.push("Calendar");
  if (/\b(chrome|safari|firefox|browser)\b/.test(t)) out.push("Chrome");
  if (/\b(web|watch|monitor|feed|show|podcast|news)\b/.test(t)) out.push("web");
  if (/\b(sms|imessage|over sms|text a |text the |send a text)\b/.test(t)) out.push("SMS");
  if (/(^|[^a-z])(x|twitter)([^a-z]|$)/.test(t)) out.push("X");
  const derived = dedupeConnectors(out);
  if (derived.length) return derived;
  return dedupeConnectors(listed.filter((c) => !isGlueConnector(c)));
}

export type FilingFields = {
  title: string;
  job_text: string;
  connectors: string[];
  what_happened: string;
  prompt_text: string | null;
};

export type PublicFiling = {
  title: string;
  job_text: string;
  connectors: string[];
  what_happened: string;
  prompt_text: string;
  findings: string[];
  generalized: boolean;
};

const PUBLIC_STORY =
  "The original run watched a specific show for first-time startups and texted a colleague the clip. The published job is written so the next person can watch any feed and text any colleague.";

export function coalescePublicFiling(
  current: FilingFields,
  next: {
    title?: string;
    job_text?: string;
    connectors?: string[];
    what_happened?: string;
    prompt_text: string;
    findings?: string[];
    generalized?: boolean;
  },
): PublicFiling {
  const generalized = next.generalized === true || looksPrivateFiling(current);
  if (!generalized) {
    return {
      title: current.title,
      job_text: current.job_text,
      connectors: current.connectors,
      what_happened: current.what_happened,
      prompt_text: next.prompt_text,
      findings: next.findings ?? [],
      generalized: false,
    };
  }

  let job = (next.job_text || "").trim();
  if (!job || looksPrivateCopy(job)) {
    job = looksPrivateCopy(next.prompt_text) ? current.job_text : next.prompt_text;
  }

  let title = (next.title || "").trim();
  if (!title || looksPrivateCopy(title) || /\bwith grok bot\b/i.test(title)) {
    title = publicTitleFrom(job, current.title);
  }

  let happened = (next.what_happened || "").trim();
  if (!happened || looksPrivateCopy(happened)) {
    happened = looksPrivateCopy(current.what_happened) ? PUBLIC_STORY : current.what_happened;
  }

  const listed = (next.connectors ?? []).map((c) => c.trim()).filter((c) => c && !isGlueConnector(c));
  const connectors = derivePublicConnectors(`${job} ${next.prompt_text}`, listed.length ? listed : current.connectors);
  const findings = [...(next.findings ?? [])];
  if (!findings.length) findings.push("Public title, job, connectors, and prompt from the specific filing.");

  return {
    title,
    job_text: job,
    connectors: connectors.length ? connectors : current.connectors,
    what_happened: happened,
    prompt_text: next.prompt_text,
    findings,
    generalized: true,
  };
}
