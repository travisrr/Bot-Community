import { getEnv } from "./env";
import { isoNow } from "./format";
import { randomToken } from "./crypto";
import { parseJsonArray } from "./html";
import { getRunById } from "./runs";
import { announcePublishedRun } from "./publish-cache";
import { sourceForRun } from "./qa";
import { botUser, fetchThreadByTweetId, formatThread } from "./x-api";
import { strengthenPromptFromFiling, looksPrivateFiling } from "./x-summarize";
import type { PromptStrengthenRow, PromptStrengthenStatus, RunRow } from "./types";

export class PromptStrengthenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromptStrengthenError";
  }
}

const MAX_PER_TICK = 2;
export const MAX_DAILY_PROMPT_STRENGTHENS = 80;
const STALE_RUNNING_MS = 2 * 60 * 1000;
const MAX_PROMPT = 4000;
const D1_BATCH = 80;

export type PromptStrengthenFindings = {
  findings: string[];
  previous_chars: number;
  prompt_chars: number;
  used_thread: boolean;
  generalized: boolean;
};

export function parsePromptStrengthenFindings(raw: string | null | undefined): PromptStrengthenFindings | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return null;
    const row = v as Record<string, unknown>;
    return {
      findings: Array.isArray(row.findings) ? row.findings.map((x) => String(x)).filter(Boolean) : [],
      previous_chars: typeof row.previous_chars === "number" ? row.previous_chars : 0,
      prompt_chars: typeof row.prompt_chars === "number" ? row.prompt_chars : 0,
      used_thread: row.used_thread === true,
      generalized: row.generalized === true,
    };
  } catch {
    return null;
  }
}

function strongerPrompt(next: string, prev: string, generalized = false): boolean {
  const a = next.trim();
  const b = prev.trim();
  if (a.length < 40) return false;
  if (a === b) return generalized;
  if (a.length > MAX_PROMPT) return false;
  if (generalized && a.length >= 80) return true;
  if (a.length < b.length) return false;
  if (!b) return true;
  if (b.length < 80 && a.length >= 80) return true;
  const extraChars = a.length - b.length;
  const extraWords = a.split(/\s+/).filter(Boolean).length - b.split(/\s+/).filter(Boolean).length;
  return extraChars >= 40 || extraWords >= 8;
}

function filingChanged(
  run: RunRow,
  next: { title: string; job_text: string; connectors: string[]; what_happened: string; prompt_text: string },
): boolean {
  const prevConnectors = parseJsonArray(run.connectors).join("|").toLowerCase();
  const nextConnectors = next.connectors.join("|").toLowerCase();
  return (
    next.title !== run.title ||
    next.job_text !== run.job_text ||
    next.what_happened !== run.what_happened ||
    next.prompt_text !== (run.prompt_text || "").trim() ||
    prevConnectors !== nextConnectors
  );
}

function utcDayStart(now = new Date()): string {
  return `${now.toISOString().slice(0, 10)}T00:00:00.000Z`;
}

export async function getPromptStrengthen(id: string): Promise<PromptStrengthenRow | null> {
  return getEnv().DB.prepare("SELECT * FROM prompt_strengthens WHERE id = ?").bind(id).first<PromptStrengthenRow>();
}

export async function latestPromptStrengthenForRun(runId: string): Promise<PromptStrengthenRow | null> {
  return getEnv()
    .DB.prepare("SELECT * FROM prompt_strengthens WHERE run_id = ? ORDER BY created_at DESC LIMIT 1")
    .bind(runId)
    .first<PromptStrengthenRow>();
}

export async function activePromptStrengthenForRun(runId: string): Promise<PromptStrengthenRow | null> {
  return getEnv()
    .DB.prepare(
      "SELECT * FROM prompt_strengthens WHERE run_id = ? AND status IN ('queued', 'running') ORDER BY created_at DESC LIMIT 1",
    )
    .bind(runId)
    .first<PromptStrengthenRow>();
}

export async function listPromptStrengthens(
  limit = 40,
): Promise<(PromptStrengthenRow & { title: string; house_number: number | null })[]> {
  const { results } = await getEnv()
    .DB.prepare(
      `SELECT p.*, r.title, r.house_number
       FROM prompt_strengthens p
       JOIN runs r ON r.id = p.run_id
       ORDER BY p.created_at DESC
       LIMIT ?`,
    )
    .bind(limit)
    .all<PromptStrengthenRow & { title: string; house_number: number | null }>();
  return results ?? [];
}

/** After 5:00 AM Central (10:00 UTC), queue any published Run that has not had a prompt pass today. */
export async function maybeQueueDailyPromptStrengthens(): Promise<{ queued: number; skipped: boolean }> {
  if (new Date().getUTCHours() < 10) return { queued: 0, skipped: true };
  return queueDailyPromptStrengthens();
}

export async function queueDailyPromptStrengthens(): Promise<{ queued: number; skipped: boolean }> {
  const dayStart = utcDayStart();
  const { results } = await getEnv()
    .DB.prepare(
      `SELECT r.id, r.serial
       FROM runs r
       WHERE r.status = 'published' AND r.serial IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM prompt_strengthens p
           WHERE p.run_id = r.id
             AND (
               p.status IN ('queued', 'running')
               OR (p.status IN ('strengthened', 'unchanged') AND p.created_at >= ?)
             )
         )
       ORDER BY
         CASE WHEN TRIM(COALESCE(r.prompt_text, '')) = '' THEN 0 ELSE 1 END,
         LENGTH(COALESCE(r.prompt_text, '')) ASC,
         r.serial ASC`,
    )
    .bind(dayStart)
    .all<{ id: string; serial: number }>();

  const now = isoNow();
  const rows = results ?? [];
  const db = getEnv().DB;
  let queued = 0;
  for (let i = 0; i < rows.length; i += D1_BATCH) {
    const slice = rows.slice(i, i + D1_BATCH);
    await db.batch(
      slice.map((run) =>
        db
          .prepare(
            `INSERT INTO prompt_strengthens (
              id, run_id, run_serial, status, thread_chars, findings_json, error,
              created_at, started_at, finished_at
            ) VALUES (?, ?, ?, 'queued', NULL, NULL, NULL, ?, NULL, NULL)`,
          )
          .bind(`ps_${randomToken(12)}`, run.id, run.serial, now),
      ),
    );
    queued += slice.length;
  }
  return { queued, skipped: false };
}

export async function queuePromptStrengthenForRun(run: RunRow): Promise<PromptStrengthenRow | null> {
  if (run.status !== "published" || !run.serial) return null;
  const active = await activePromptStrengthenForRun(run.id);
  if (active) return active;
  const now = isoNow();
  const id = `ps_${randomToken(12)}`;
  await getEnv()
    .DB.prepare(
      `INSERT INTO prompt_strengthens (
        id, run_id, run_serial, status, thread_chars, findings_json, error,
        created_at, started_at, finished_at
      ) VALUES (?, ?, ?, 'queued', NULL, NULL, NULL, ?, NULL, NULL)`,
    )
    .bind(id, run.id, run.serial, now)
    .run();
  const row = await getPromptStrengthen(id);
  if (!row) throw new PromptStrengthenError("Could not queue prompt strengthen.");
  return row;
}

async function markStrengthen(
  row: PromptStrengthenRow,
  patch: Partial<PromptStrengthenRow>,
): Promise<PromptStrengthenRow> {
  const next: PromptStrengthenRow = { ...row, ...patch };
  await getEnv()
    .DB.prepare(
      `UPDATE prompt_strengthens SET
        status = ?,
        thread_chars = ?,
        findings_json = ?,
        error = ?,
        started_at = ?,
        finished_at = ?
       WHERE id = ?`,
    )
    .bind(
      next.status,
      next.thread_chars,
      next.findings_json,
      next.error,
      next.started_at,
      next.finished_at,
      next.id,
    )
    .run();
  const updated = await getPromptStrengthen(row.id);
  if (!updated) throw new PromptStrengthenError("Prompt-strengthen row missing after update.");
  return updated;
}

async function threadTextFor(run: RunRow): Promise<{ text: string; chars: number }> {
  try {
    const source = await sourceForRun(run);
    if (!source) return { text: "", chars: 0 };
    const thread = await fetchThreadByTweetId(source.tweet_id);
    const bot = await botUser();
    const text = formatThread(thread, bot.id);
    return { text, chars: text.length };
  } catch {
    return { text: "", chars: 0 };
  }
}

async function applyPrompt(
  run: RunRow,
  next: {
    title: string;
    job_text: string;
    connectors: string[];
    what_happened: string;
    prompt_text: string;
    generalized: boolean;
  },
): Promise<number> {
  if (!run.serial) throw new PromptStrengthenError("Only a stamped Run can get a stronger prompt.");
  const revision = run.revision + 1;
  const now = isoNow();
  const db = getEnv().DB;
  await db.batch([
    db
      .prepare(
        `UPDATE runs SET
          title = ?,
          job_text = ?,
          connectors = ?,
          what_happened = ?,
          prompt_text = ?,
          revision = ?,
          updated_at = ?
         WHERE id = ? AND serial = ?`,
      )
      .bind(
        next.title,
        next.job_text,
        JSON.stringify(next.connectors),
        next.what_happened,
        next.prompt_text,
        revision,
        now,
        run.id,
        run.serial,
      ),
    db
      .prepare(
        "INSERT INTO changelog_entries (id, run_serial, revision, one_liner, patch_id, created_at) VALUES (?, ?, ?, ?, NULL, ?)",
      )
      .bind(
        `cl_${randomToken(10)}`,
        run.serial,
        revision,
        next.generalized
          ? "Public job and prompt from the specific filing."
          : "Stronger copyable prompt from the filing.",
        now,
      ),
  ]);
  announcePublishedRun({
    ...run,
    title: next.title,
    job_text: next.job_text,
    connectors: JSON.stringify(next.connectors),
    what_happened: next.what_happened,
    prompt_text: next.prompt_text,
    revision,
    updated_at: now,
  });
  return revision;
}

export async function processPromptStrengthen(id: string): Promise<PromptStrengthenRow> {
  const row = await getPromptStrengthen(id);
  if (!row) throw new PromptStrengthenError("Prompt-strengthen row missing.");
  switch (row.status) {
    case "strengthened":
    case "unchanged":
    case "failed":
      return row;
    case "queued":
    case "running":
      break;
    default: {
      const _never: never = row.status;
      return _never;
    }
  }

  const started = await markStrengthen(row, {
    status: "running",
    started_at: row.started_at || isoNow(),
    error: null,
  });
  const run = await getRunById(started.run_id);
  if (!run || run.status !== "published" || !run.serial) {
    return markStrengthen(started, {
      status: "failed",
      error: "Run is not a published serial.",
      finished_at: isoNow(),
    });
  }

  try {
    const thread = await threadTextFor(run);
    const result = await strengthenPromptFromFiling(
      {
        title: run.title,
        job_text: run.job_text,
        connectors: parseJsonArray(run.connectors),
        what_happened: run.what_happened,
        prompt_text: run.prompt_text,
        constraints: run.constraints,
      },
      thread.text,
    );

    if (!result.ok) {
      const status: PromptStrengthenStatus = result.retry ? "queued" : "unchanged";
      return markStrengthen(started, {
        thread_chars: thread.chars || null,
        status,
        error: result.reason,
        finished_at: result.retry ? null : isoNow(),
      });
    }

    const previous = (run.prompt_text || "").trim();
    const nextPrompt = result.prompt_text.trim().slice(0, MAX_PROMPT);
    const next = {
      title: result.title.trim() || run.title,
      job_text: result.job_text.trim() || run.job_text,
      connectors: result.connectors.length ? result.connectors : parseJsonArray(run.connectors),
      what_happened: result.what_happened.trim() || run.what_happened,
      prompt_text: nextPrompt,
      generalized:
        result.generalized ||
        looksPrivateFiling({
          title: run.title,
          job_text: run.job_text,
          prompt_text: run.prompt_text,
          what_happened: run.what_happened,
          connectors: parseJsonArray(run.connectors),
        }),
    };
    const promptOk = strongerPrompt(next.prompt_text, previous, next.generalized);
    if (!promptOk && !(next.generalized && filingChanged(run, next))) {
      return markStrengthen(started, {
        thread_chars: thread.chars || null,
        status: "unchanged",
        error: "New prompt was not stronger than the published one.",
        finished_at: isoNow(),
      });
    }
    if (!filingChanged(run, next)) {
      return markStrengthen(started, {
        thread_chars: thread.chars || null,
        status: "unchanged",
        error: "New prompt was not stronger than the published one.",
        finished_at: isoNow(),
      });
    }

    await applyPrompt(run, next);
    const findings: PromptStrengthenFindings = {
      findings: result.findings,
      previous_chars: previous.length,
      prompt_chars: nextPrompt.length,
      used_thread: thread.chars >= 40,
      generalized: next.generalized,
    };
    return markStrengthen(started, {
      thread_chars: thread.chars || null,
      status: "strengthened",
      findings_json: JSON.stringify(findings),
      error: null,
      finished_at: isoNow(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Prompt strengthen failed.";
    console.error(JSON.stringify({ event: "prompt_strengthen_failed", id: started.id, error: String(err) }));
    const retryable = /offline|token|429|Could not load|Could not read/i.test(message);
    return markStrengthen(started, {
      status: retryable ? "queued" : "failed",
      error: message,
      finished_at: retryable ? null : isoNow(),
    });
  }
}

export type PromptStrengthenPollResult = {
  processed: number;
  strengthened: number;
  unchanged: number;
  failed: number;
  queued: number;
};

export async function processQueuedPromptStrengthens(
  limit = MAX_PER_TICK,
): Promise<PromptStrengthenPollResult> {
  const staleBefore = new Date(Date.now() - STALE_RUNNING_MS).toISOString();
  const { results } = await getEnv()
    .DB.prepare(
      `SELECT id FROM prompt_strengthens
       WHERE status = 'queued'
          OR (status = 'running' AND COALESCE(started_at, created_at) <= ?)
       ORDER BY created_at ASC
       LIMIT ?`,
    )
    .bind(staleBefore, Math.max(1, Math.min(limit, MAX_DAILY_PROMPT_STRENGTHENS)))
    .all<{ id: string }>();
  const counts: PromptStrengthenPollResult = {
    processed: 0,
    strengthened: 0,
    unchanged: 0,
    failed: 0,
    queued: 0,
  };
  for (const item of results ?? []) {
    const done = await processPromptStrengthen(item.id);
    counts.processed += 1;
    switch (done.status) {
      case "strengthened":
        counts.strengthened += 1;
        break;
      case "unchanged":
        counts.unchanged += 1;
        break;
      case "failed":
        counts.failed += 1;
        break;
      case "queued":
      case "running":
        counts.queued += 1;
        break;
      default: {
        const _never: never = done.status;
        void _never;
      }
    }
  }
  return counts;
}

export async function runDailyPromptStrengthens(): Promise<{
  queued: number;
  skipped: boolean;
  processed: number;
  strengthened: number;
  unchanged: number;
  failed: number;
  left: number;
}> {
  const queued = await queueDailyPromptStrengthens();
  const prompts = await processQueuedPromptStrengthens(MAX_DAILY_PROMPT_STRENGTHENS);
  return {
    queued: queued.queued,
    skipped: queued.skipped,
    processed: prompts.processed,
    strengthened: prompts.strengthened,
    unchanged: prompts.unchanged,
    failed: prompts.failed,
    left: prompts.queued,
  };
}
