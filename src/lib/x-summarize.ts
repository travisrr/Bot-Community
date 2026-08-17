import { getEnv } from "./env";
import { parseRunMarkdown, type ParsedRunMarkdown } from "./markdown";
import { BOT_X_HANDLE } from "./site";

const MODELS = ["@cf/meta/llama-3.1-8b-instruct-fast", "@cf/meta/llama-3.3-70b-instruct-fp8-fast"] as const;
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
- job_text: what they asked the bot to do, 20+ characters.
- connectors: only tools/services the thread says were used (web, Gmail, calendar, browser, X, Slack, GitHub, …). Non-empty array.
- what_happened: what the bot actually did, 20+ characters.
- would_run_again: yes | with_changes | no
- sensitive_kind: legal | medical | financial | null
- Redact names of uninvolved people, street addresses, account numbers, unpublished credentials.
- skip=true when: not a finished job, hypothetical, how-to question, hello-world, "get me a House", only tagging @${BOT_X_HANDLE}, or too thin to file.
- skip_reason: short, public-safe.`;

function aiText(result: unknown): string {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return "";
  const row = result as Record<string, unknown>;
  if (typeof row.response === "string") return row.response;
  if (typeof row.text === "string") return row.text;
  if (typeof row.result === "string") return row.result;
  return "";
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

export async function summarizeThread(threadText: string): Promise<ThreadSummary> {
  const env = getEnv();
  if (!env.AI) return { ok: false, reason: "Summarizer is offline.", retry: true };
  const input = threadText.trim().slice(0, MAX_THREAD_CHARS);
  if (input.length < 40) return { ok: false, reason: "Thread is too thin to file.", retry: false };

  let raw = "";
  for (const model of MODELS) {
    try {
      const result = await env.AI.run(model as never, {
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Thread:\n\n${input}` },
        ],
        max_tokens: 1200,
      });
      raw = aiText(result);
      if (raw) break;
    } catch (err) {
      console.error(JSON.stringify({ event: "x_summarize_failed", model, error: String(err) }));
    }
  }
  if (!raw) return { ok: false, reason: "Could not read this thread.", retry: true };

  let parsed: Record<string, unknown>;
  try {
    const json = extractJson(raw);
    if (!json || typeof json !== "object") throw new Error("not object");
    parsed = json as Record<string, unknown>;
  } catch {
    return { ok: false, reason: "Could not turn this thread into a job.", retry: true };
  }

  if (parsed.skip === true) {
    const reason = asString(parsed.skip_reason) || "This thread does not look like a finished Grok job.";
    return { ok: false, reason, retry: false };
  }

  const connectors = Array.isArray(parsed.connectors)
    ? parsed.connectors.map((c) => String(c).trim()).filter(Boolean)
    : asString(parsed.connectors)
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

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
  const filing = parseRunMarkdown(markdown);
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
