import { getEnv } from "./env";
import { parseRunMarkdown, type ParsedRunMarkdown } from "./markdown";
import { BOT_X_HANDLE } from "./site";

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
- title: plain language, what the job was, 8+ characters.
- job_text: what they asked the bot to do, 20+ characters. A Grok Bot prompt, configured task, or job run counts even if it is short — copy the ask.
- connectors: only tools/services the thread says were used (web, Gmail, calendar, browser, X, Slack, GitHub, …). One name per service. Do not list Gmail and email, or Chrome and browser. Non-empty array.
- what_happened: what the bot actually did, 20+ characters. If the thread is a configured bot / prompt / task with no long transcript, say they set that bot up or posted that job, using only what the thread shows.
- would_run_again: yes | with_changes | no
- prompt_text: the user's prompt if the thread contains it, even if it is one line; else "".
- constraints: hard limits from the thread; else "".
- sensitive_kind: legal | medical | financial | null
- Redact names of uninvolved people, street addresses, account numbers, unpublished credentials.
- skip=true when: not a bot job, hypothetical, how-to question with no finished work, hello-world, "get me a House", or only tagging @${BOT_X_HANDLE}.
- Do NOT skip a Grok Bot prompt, configured task, or job run just because it is short. File it. A later pass crystallizes the copyable prompt.
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

export const MAX_WHO_WORDS = 7;

export function clampWho(raw: string, max = MAX_WHO_WORDS): string {
  const words = raw
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.slice(0, max).join(" ").replace(/[.,;:]+$/g, "");
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

const WHO_SYSTEM = `You write a 7-word-max summary of who this person is from their public X bio.

Return ONLY JSON: {"summary":"Engineer now building at SpaceXAI"}

Rules:
- Who they are right now. Not a list of companies, @handles, hashtags, or tags.
- At most 7 words. Prefer 4–6.
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
- Prefer specific names of tools, sites, files, steps, and artifacts.
- title: plain language, what the job was.
- job_text: the actual ask from the thread, not a slogan. 20+ characters.
- connectors: only tools/services the thread says were used. One name per service. Do not list Gmail and email, or Chrome and browser. Non-empty array.
- what_happened: past tense, what the bot actually did, including failures. 20+ characters.
- prompt_text: the user's prompt if the thread contains it; else "".
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

const STRENGTHEN_SYSTEM = `You write a copyable job prompt for a published Run on really.bot.

The Run already happened. Write instructions a visitor can paste into an AI bot to do that same job.

Return ONLY JSON, no markdown fences, no preamble. Shape:
{"skip":false,"skip_reason":"","prompt_text":"","findings":["named Gmail and the venue"]}

Rules:
- Ground only in the filing and optional thread. Do not invent tools, files, people, sites, or outcomes.
- prompt_text is imperative: the ask, tools to use (from connectors), constraints, and what done looks like from what happened.
- Prefer the author's words from job_text and the current prompt when they are specific.
- Name each connector from the filing. One name per service. Gmail not email. Chrome not browser.
- Crystalize a thin prompt. A slogan, a title restated, or "Ask @bot to …" with no steps is not done. Expand it into pasteable instructions: who the bot is, the ask, each connector, steps from what happened, constraints, and what done looks like.
- A one-line Grok Bot task or a configured-bot prompt is never skip=true. Write the strongest pasteable prompt the filing supports.
- If the current prompt is already a complete instruction set (role + ask + tools + constraints or success checks), skip=true.
- If the current prompt is empty, a slogan, or just restates the title, write a real prompt from the filing.
- The thread may be missing or thin. Still write the strongest prompt the filing supports. Do not skip just because the thread is thin.
- Do not write a prompt pack of many jobs. One job. Not marketing.
- 80+ characters unless the filing itself is shorter; then as specific as the filing allows.
- Redact names of uninvolved people, street addresses, account numbers, unpublished credentials.`;

export type PromptStrengthening =
  | { ok: true; prompt_text: string; findings: string[] }
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

  const thread = (threadText || "").trim().slice(0, MAX_THREAD_CHARS);
  const user = `Current filing:
${JSON.stringify(current, null, 2)}
${thread.length >= 40 ? `\nOptional source thread (may be truncated or thin):\n${thread}` : "\nNo source thread. Write from the filing only."}`;

  let parsed: Record<string, unknown> | null;
  try {
    parsed = await runJsonPrompt(STRENGTHEN_SYSTEM, user, 900);
  } catch {
    return { ok: false, reason: "Could not strengthen this prompt.", retry: true };
  }
  if (!parsed) return { ok: false, reason: "Could not read this filing.", retry: true };

  if (parsed.skip === true) {
    const reason = asString(parsed.skip_reason) || "The published prompt is already a complete instruction set.";
    return { ok: false, reason, retry: false };
  }

  const prompt = asString(parsed.prompt_text);
  if (prompt.length < 40) {
    return { ok: false, reason: "The filing has nothing more for a prompt.", retry: false };
  }
  return { ok: true, prompt_text: prompt, findings: asStringList(parsed.findings) };
}
