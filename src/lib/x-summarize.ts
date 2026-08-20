import { getEnv } from "./env";
import { parseRunMarkdown, type ParsedRunMarkdown } from "./markdown";
import { BOT_X_HANDLE } from "./site";
import { coalescePublicFiling, looksPrivateFiling, looksPrivatePrompt } from "./public-filing";
import { clampWho, fallbackWhoFromBio } from "./who-line";

export { clampWho, fallbackWhoFromBio, MAX_WHO_WORDS, whoLine } from "./who-line";

const MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";
const FALLBACK_MODEL = "@cf/meta/llama-3.2-3b-instruct";
const MAX_THREAD_CHARS = 12_000;

export type ThreadSummary =
  | { ok: true; filing: ParsedRunMarkdown }
  | { ok: false; reason: string; retry: boolean };

const SYSTEM = `You extract a finished Grok Bot (or other AI agent) job from a public X thread for really.bot.

Return ONLY JSON, no markdown fences, no preamble. Shape:
{"skip":false,"skip_reason":"","title":"","job_text":"","connectors":["web"],"what_happened":"","would_run_again":"yes","prompt_text":"","constraints":"","sensitive_kind":null}

Rules:
- Credit what the original author actually did with their bot. Past tense. Do not invent connectors, tools, or outcomes.
- title: plain language public job, 8+ characters. No private nicknames, quoted handles, or one-off show names as a required source.
- job_text: the reusable method a stranger follows, 20+ characters. Not "text my associate 'are we in this?'". Watch a feed, email a lawyer, that shape.
- connectors: only reusable services a visitor would connect (web, Gmail, Calendar, Slack, SMS, Chrome, …). One name per service. Do not list Gmail and email, or Chrome and browser. Do not list Grok Bot, ChatGPT, or Claude. Non-empty array.
- what_happened: what this person actually did, including specific names if that is the story, 20+ characters. No puffery like "over 50% of my job".
- would_run_again: yes | with_changes | no
- prompt_text: a public, pasteable version of the job. If the thread's prompt names a private person, nickname, show, chat, or internal metric, rewrite that pattern for a stranger.
- constraints: hard limits from the thread; else "".
- sensitive_kind: legal | medical | financial | null
- Redact names of uninvolved people, street addresses, account numbers, unpublished credentials.
- Title, job, and prompt are the public pattern. What happened can keep this person's story.
- skip=true when: not a finished Grok Bot (or other agent) job; hypothetical; how-to with no finished work; hello-world; "get me a House"; only tagging @${BOT_X_HANDLE}; a directory/shoutout/ad for really.bot; "share your Grok bot" community posts; product news; tagging @${BOT_X_HANDLE} for attention next to @elonmusk or @bot.
- The original author must have run or configured a specific job. Asking other people to share bots, or posting a bot catalog, is not a job.
- Never name competing catalogs, botdirectory.ai, Bot Directory, or @elie2222 in any field. If the thread is a listing, scraper, or ad for that catalog, skip=true.
- Do NOT skip a real Grok Bot prompt, configured task, or job run just because it is short. File that. A later pass writes the public copyable prompt.
- skip_reason: short, public-safe.`;

async function aiText(result: unknown): Promise<string> {
  if (typeof result === "string") return result;
  if (result instanceof ReadableStream) return new Response(result).text();
  if (!result || typeof result !== "object") return "";
  const row = result as Record<string, unknown>;
  if (typeof row.response === "string") return row.response;
  if (row.response && typeof row.response === "object") return JSON.stringify(row.response);
  if (typeof row.text === "string") return row.text;
  if (typeof row.result === "string") return row.result;
  return "";
}

function logAiResult(model: string, result: unknown, text: string): void {
  const row = result && typeof result === "object" ? (result as Record<string, unknown>) : null;
  console.log(
    JSON.stringify({
      event: "x_summarize_result",
      model,
      kind: result === null ? "null" : typeof result,
      keys: row ? Object.keys(row).slice(0, 12) : [],
      request_id: typeof row?.request_id === "string" ? row.request_id : undefined,
      chars: text.length,
      preview: text.slice(0, 160),
    }),
  );
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : trimmed).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("no json");
  return JSON.parse(body.slice(start, end + 1));
}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asStringList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((c) => String(c).trim()).filter(Boolean);
  return asString(v)
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const WHO_SYSTEM = `You write a 7-word-max summary of who this person is from their public X bio.

Return ONLY JSON: {"summary":"Practical AI tutorials for people"}

Rules:
- Who they are right now. A noun phrase, not a sentence.
- Do not add a verb the bio does not use. No "Makes", "Does", "Helps", "Writes", "Creates".
- "Practical AI tutorials for people" not "Makes practical AI tutorials for people".
- At most 7 words. Prefer 4–5 so it fits on one line beside an @handle. Commas beat "and".
- Two current roles: join with a comma, never "and". "Crypto researcher, DeFi expert" not "Crypto researcher and DeFi expert". "X employee, kettlebell founder" not "X employee and kettlebell founder".
- If they publish a newsletter, keep the publication name and the word "newsletter". "Pragmatic Engineer newsletter" not a longer description of the list.
- One current role or identity. Do not stack past employers or "prev X, Y, Z".
- You may name one current workplace or project if that is the identity.
- Drop @handles, URLs, emojis, slogans, and location unless that is the identity.
- Expand a lone company handle into who they are there when obvious (@GradientVC → "At Gradient Ventures").
- If the bio is empty, return "".
- No quotation marks. No trailing punctuation unless it is part of a name.`;

export async function summarizeWhoFromBio(bio: string): Promise<string> {
  const input = bio.trim().slice(0, 600);
  if (!input) return "";
  const fallback = fallbackWhoFromBio(input);
  const parsed = await runJsonPrompt(WHO_SYSTEM, `X bio:\n\n${input}`, 120);
  const summary = clampWho(asString(parsed?.summary));
  return summary || fallback;
}

const ENRICH_SYSTEM = `You are QA for really.bot. A published Run was tagged weak. Re-read the public X thread and return a richer filing from what the thread actually says.

Return ONLY JSON, no markdown fences, no preamble. Shape:
{"skip":false,"skip_reason":"","title":"","job_text":"","connectors":["web"],"what_happened":"","would_run_again":"yes","prompt_text":"","constraints":"","sensitive_kind":null,"findings":["missing tool names"]}

Rules:
- Do not invent connectors, tools, quotes, or outcomes that are not in the thread.
- Prefer specific names of tools, sites, files, steps, and artifacts in what_happened.
- title: plain language public job. No private nicknames or one-off required sources.
- job_text: the reusable method a stranger follows, 20+ characters. This field is public, not the author's private sentence.
- connectors: only reusable services a visitor would connect. One name per service. Do not list Gmail and email, or Chrome and browser. Do not list Grok Bot, ChatGPT, or Claude. Non-empty array.
- what_happened: past tense, what this person actually did, including failures. 20+ characters. Specific names belong here.
- prompt_text: a public, pasteable version of the ask. Do not dump nicknames, quoted handles, private chats, or internal metrics into the prompt. Rewrite that pattern so a stranger can run the same kind of job.
- constraints: hard limits from the thread; else "".
- findings: short bullets of what the current filing was missing that you pulled from the thread.
- skip=true only if the thread has nothing more than the current filing, or is not a finished job.
- skip_reason: short, public-safe.
- Redact names of uninvolved people, street addresses, account numbers, unpublished credentials.`;

async function runJsonPrompt(system: string, user: string, maxTokens: number): Promise<Record<string, unknown> | null> {
  const env = getEnv();
  if (!env.AI) return null;
  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
  const attempts: { model: typeof MODEL | typeof FALLBACK_MODEL; run: () => Promise<unknown> }[] = [
    { model: MODEL, run: () => env.AI.run(MODEL, { messages, max_tokens: maxTokens }) },
    {
      model: MODEL,
      run: () => env.AI.run(MODEL, { prompt: `${system}\n\n${user}\n\nJSON:`, max_tokens: maxTokens }),
    },
    { model: FALLBACK_MODEL, run: () => env.AI.run(FALLBACK_MODEL, { messages, max_tokens: maxTokens }) },
  ];
  let raw = "";
  for (const attempt of attempts) {
    try {
      const result = await attempt.run();
      raw = (await aiText(result)).trim();
      logAiResult(attempt.model, result, raw);
      if (!raw) continue;
      try {
        const json = extractJson(raw);
        if (!json || typeof json !== "object") throw new Error("not object");
        return json as Record<string, unknown>;
      } catch {
        raw = "";
      }
    } catch (err) {
      console.error(JSON.stringify({ event: "x_summarize_failed", model: attempt.model, error: String(err) }));
    }
  }
  return null;
}

function filingFromParsed(parsed: Record<string, unknown>): ParsedRunMarkdown {
  const connectors = asStringList(parsed.connectors);
  const wouldRaw = asString(parsed.would_run_again).toLowerCase().replaceAll(" ", "_");
  const sensitive = asString(parsed.sensitive_kind).toLowerCase();
  const markdown = `---
title: ${asString(parsed.title).replaceAll("\n", " ")}
connectors: ${connectors.join(", ")}
would_run_again: ${wouldRaw || "yes"}
sensitive_kind: ${sensitive}
---

# Job

${asString(parsed.job_text)}

# What happened

${asString(parsed.what_happened)}

# Prompt

${asString(parsed.prompt_text)}

# Constraints

${asString(parsed.constraints)}
`;
  return parseRunMarkdown(markdown);
}

export async function summarizeThread(threadText: string): Promise<ThreadSummary> {
  const env = getEnv();
  if (!env.AI) return { ok: false, reason: "Summarizer is offline.", retry: true };
  const input = threadText.trim().slice(0, MAX_THREAD_CHARS);
  if (input.length < 40) return { ok: false, reason: "Thread is too thin to file.", retry: false };

  let parsed: Record<string, unknown> | null;
  try {
    parsed = await runJsonPrompt(SYSTEM, `Thread:\n\n${input}`, 800);
  } catch {
    return { ok: false, reason: "Could not turn this thread into a job.", retry: true };
  }
  if (!parsed) return { ok: false, reason: "Could not read this thread.", retry: true };

  if (parsed.skip === true) {
    const reason = asString(parsed.skip_reason) || "This thread does not look like a finished Grok job.";
    return { ok: false, reason, retry: false };
  }

  const filing = filingFromParsed(parsed);
  if (filing.title.length < 8) {
    return { ok: false, reason: "This thread does not look like a finished Grok job.", retry: false };
  }
  if (filing.job_text.length < 20 || filing.what_happened.length < 20) {
    return { ok: false, reason: "This thread does not look like a finished Grok job.", retry: false };
  }
  if (!filing.connectors.length) {
    return { ok: false, reason: "This thread does not look like a finished Grok job.", retry: false };
  }
  return { ok: true, filing };
}

export type ThreadEnrichment =
  | { ok: true; filing: ParsedRunMarkdown; findings: string[] }
  | { ok: false; reason: string; retry: boolean };

export async function enrichFromThread(
  current: {
    title: string;
    job_text: string;
    connectors: string[];
    what_happened: string;
    prompt_text: string | null;
    constraints: string | null;
    would_run_again: string;
  },
  threadText: string,
): Promise<ThreadEnrichment> {
  const env = getEnv();
  if (!env.AI) return { ok: false, reason: "Summarizer is offline.", retry: true };
  const input = threadText.trim().slice(0, MAX_THREAD_CHARS);
  if (input.length < 40) return { ok: false, reason: "Thread is too thin to pull more.", retry: false };

  const user = `Current filing (too thin):
${JSON.stringify(current, null, 2)}

Thread:
${input}`;

  let parsed: Record<string, unknown> | null;
  try {
    parsed = await runJsonPrompt(ENRICH_SYSTEM, user, 1200);
  } catch {
    return { ok: false, reason: "Could not turn this thread into a richer job.", retry: true };
  }
  if (!parsed) return { ok: false, reason: "Could not read this thread.", retry: true };

  if (parsed.skip === true) {
    const reason = asString(parsed.skip_reason) || "The thread has nothing more than the current filing.";
    return { ok: false, reason, retry: false };
  }

  const filing = filingFromParsed(parsed);
  if (filing.job_text.length < 20 || filing.what_happened.length < 20) {
    return { ok: false, reason: "The thread has nothing more than the current filing.", retry: false };
  }
  const findings = asStringList(parsed.findings);
  return { ok: true, filing, findings };
}

export { looksPrivateCopy, looksPrivateFiling, looksPrivatePrompt } from "./public-filing";

const STRENGTHEN_SYSTEM = `You write the public version of a published Run on really.bot.

The Run already happened — it is one person's specific job. Title, job, connectors, and prompt are for the next person. Extract how this job generalizes for the public, then write that.

Return ONLY JSON, no markdown fences, no preamble. Shape:
{"skip":false,"skip_reason":"","title":"","job_text":"","connectors":["web","SMS"],"what_happened":"","prompt_text":"","generalized":true,"findings":["dropped private nickname; kept watch-and-text pattern"]}

Rules:
- Ground only in the filing and optional thread. Do not invent a different job or outcomes that did not happen.
- First extract the public pattern: what is watched or done, what gets sent, to whom (a role, not a private name), and what done looks like.
- title: plain language public job. No nicknames, quoted handles, or one-off required sources.
- job_text: the method a stranger follows. Not the author's private sentence.
- prompt_text: imperative pasteable instructions for that public job. No leftover "without additional constraints" unless the filing had real constraints.
- connectors: reusable services a visitor would connect (web, Gmail, Slack, SMS, Calendar, Chrome). Not Grok Bot, ChatGPT, Claude, a specific show, or a private chat app.
- what_happened: this person's story in past tense. Specific names belong here. No puffery like "over 50% of my job". End by saying the published job is the public pattern.
- skip=true only if title, job, prompt, AND connectors are already a complete public instruction set.
- If the prompt is already public but title, job, or connectors are still a private runbook, generalized=true and rewrite those. Do not skip.
- A one-line Grok Bot task is never skip=true.
- Do not write a prompt pack. One job. Not marketing.
- Redact names of uninvolved people, street addresses, account numbers, unpublished credentials.
- generalized=true when you stripped private or one-off details. findings: what you generalized.`;

export type PromptStrengthening =
  | {
      ok: true;
      prompt_text: string;
      title: string;
      job_text: string;
      connectors: string[];
      what_happened: string;
      findings: string[];
      generalized: boolean;
    }
  | { ok: false; reason: string; retry: boolean };

export async function strengthenPromptFromFiling(
  current: {
    title: string;
    job_text: string;
    connectors: string[];
    what_happened: string;
    prompt_text: string | null;
    constraints: string | null;
  },
  threadText?: string | null,
): Promise<PromptStrengthening> {
  const env = getEnv();
  if (!env.AI) return { ok: false, reason: "Summarizer is offline.", retry: true };

  const privateFiling = looksPrivateFiling(current);
  const thread = (threadText || "").trim().slice(0, MAX_THREAD_CHARS);
  const privateHint = privateFiling
    ? "\n\nTitle, job, connectors, or prompt is still a private runbook. skip must be false. Write the public title, job, connectors, what happened, and prompt."
    : "";
  const user = `Current filing:
${JSON.stringify(current, null, 2)}
${thread.length >= 40 ? `\nOptional source thread (may be truncated or thin):\n${thread}` : "\nNo source thread. Write from the filing only."}${privateHint}

Write the public version of this job. Title, job, connectors, and prompt must be reusable by a stranger.`;

  let parsed: Record<string, unknown> | null;
  try {
    parsed = await runJsonPrompt(STRENGTHEN_SYSTEM, user, 1200);
  } catch {
    return { ok: false, reason: "Could not strengthen this prompt.", retry: true };
  }
  if (!parsed) return { ok: false, reason: "Could not read this filing.", retry: true };

  if (parsed.skip === true && privateFiling) {
    try {
      parsed = await runJsonPrompt(
        STRENGTHEN_SYSTEM,
        `${user}\n\nDo not skip. Title, job, or connectors are still too specific. generalized=true.`,
        1200,
      );
    } catch {
      parsed = null;
    }
    if (!parsed) return { ok: false, reason: "Could not read this filing.", retry: true };
  }

  const existingPrompt = (current.prompt_text || "").trim();
  if (parsed.skip === true) {
    if (privateFiling && existingPrompt.length >= 80 && !looksPrivatePrompt(existingPrompt)) {
      const pub = coalescePublicFiling(current, {
        prompt_text: existingPrompt,
        generalized: true,
        findings: ["Public prompt already written; generalized title, job, and connectors."],
      });
      return { ok: true, ...pub };
    }
    const reason = asString(parsed.skip_reason) || "The published filing is already a complete public instruction set.";
    return { ok: false, reason, retry: false };
  }

  let prompt = asString(parsed.prompt_text);
  if (prompt.length < 40 && existingPrompt.length >= 80 && !looksPrivatePrompt(existingPrompt)) {
    prompt = existingPrompt;
  }
  if (prompt.length < 40) {
    return { ok: false, reason: "The filing has nothing more for a prompt.", retry: false };
  }

  const pub = coalescePublicFiling(current, {
    title: asString(parsed.title),
    job_text: asString(parsed.job_text),
    connectors: asStringList(parsed.connectors),
    what_happened: asString(parsed.what_happened),
    prompt_text: prompt,
    findings: asStringList(parsed.findings),
    generalized: parsed.generalized === true || privateFiling,
  });
  return { ok: true, ...pub };
}
