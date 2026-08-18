import { getEnv } from "./env";
import { isoNow } from "./format";
import { randomToken } from "./crypto";
import { parseJsonArray } from "./html";
import { dedupeConnectors, duplicateConnectorGroups } from "./tools";
import { getRunById, parseEvidence } from "./runs";
import { getImportForRun } from "./x-import";
import {
  fetchThreadByTweetId,
  formatThread,
  parseTweetUrl,
  tweetUrl,
  botUser,
  type XThread,
} from "./x-api";
import { enrichFromThread } from "./x-summarize";
import { urlEvidence } from "./evidence";
import type { EvidenceItem, PublicUser, QaRevisitRow, QaStatus, RunRow } from "./types";

export class QaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QaError";
  }
}

const MAX_PER_TICK = 2;
const STALE_RUNNING_MS = 2 * 60 * 1000;
const MAX_NOTE = 400;

export type QaFindings = {
  changes: string[];
  findings: string[];
  source: string | null;
};

export type QaSource = {
  tweet_id: string;
  conversation_id: string | null;
  handle: string | null;
  href: string | null;
};

export function parseQaFindings(raw: string | null | undefined): QaFindings | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return null;
    const row = v as Record<string, unknown>;
    return {
      changes: Array.isArray(row.changes) ? row.changes.map((x) => String(x)).filter(Boolean) : [],
      findings: Array.isArray(row.findings) ? row.findings.map((x) => String(x)).filter(Boolean) : [],
      source: typeof row.source === "string" ? row.source : null,
    };
  } catch {
    return null;
  }
}

export function weaknessHints(run: RunRow): string[] {
  const hints: string[] = [];
  const connectors = parseJsonArray(run.connectors);
  const dupes = duplicateConnectorGroups(connectors);
  if (run.job_text.trim().length < 80) hints.push("Job text is short.");
  if (run.what_happened.trim().length < 80) hints.push("What happened is short.");
  if (!(run.prompt_text || "").trim()) hints.push("No public prompt.");
  if (dupes.length) {
    hints.push(`Same service listed twice (${dupes.map((group) => group.join(" and ")).join("; ")}). Keep one name.`);
  }
  if (dedupeConnectors(connectors).length <= 1) hints.push("Few connectors.");
  if (run.title.trim().length < 24) hints.push("Title is thin.");
  return hints;
}

function tweetIdFromEvidence(items: EvidenceItem[]): { id: string; handle: string | null } | null {
  for (const item of items) {
    const parsed = parseTweetUrl(item.href || item.url || "");
    if (parsed) return parsed;
  }
  return null;
}

export async function sourceForRun(run: RunRow, overrideUrl?: string | null): Promise<QaSource | null> {
  const override = parseTweetUrl(overrideUrl);
  if (override) {
    return {
      tweet_id: override.id,
      conversation_id: override.id,
      handle: override.handle,
      href: override.handle ? tweetUrl(override.handle, override.id) : `https://x.com/i/web/status/${override.id}`,
    };
  }
  const imported = await getImportForRun(run.id);
  if (imported) {
    const tweetId = imported.conversation_id || imported.mention_tweet_id;
    return {
      tweet_id: tweetId,
      conversation_id: imported.conversation_id,
      handle: imported.author_x_handle,
      href: tweetUrl(imported.author_x_handle, tweetId),
    };
  }
  const fromEvidence = tweetIdFromEvidence(parseEvidence(run.evidence_json));
  if (!fromEvidence) return null;
  return {
    tweet_id: fromEvidence.id,
    conversation_id: fromEvidence.id,
    handle: fromEvidence.handle,
    href: fromEvidence.handle
      ? tweetUrl(fromEvidence.handle, fromEvidence.id)
      : `https://x.com/i/web/status/${fromEvidence.id}`,
  };
}

export async function getQaRevisit(id: string): Promise<QaRevisitRow | null> {
  return getEnv().DB.prepare("SELECT * FROM qa_revisits WHERE id = ?").bind(id).first<QaRevisitRow>();
}

export async function latestQaForRun(runId: string): Promise<QaRevisitRow | null> {
  return getEnv()
    .DB.prepare("SELECT * FROM qa_revisits WHERE run_id = ? ORDER BY created_at DESC LIMIT 1")
    .bind(runId)
    .first<QaRevisitRow>();
}

export async function listQaRevisits(limit = 40): Promise<(QaRevisitRow & { title: string; house_number: number | null })[]> {
  const { results } = await getEnv()
    .DB.prepare(
      `SELECT q.*, r.title, r.house_number
       FROM qa_revisits q
       JOIN runs r ON r.id = q.run_id
       ORDER BY q.created_at DESC
       LIMIT ?`,
    )
    .bind(limit)
    .all<QaRevisitRow & { title: string; house_number: number | null }>();
  return results ?? [];
}

export async function countOpenQa(): Promise<number> {
  const row = await getEnv()
    .DB.prepare(
      `SELECT
         (SELECT COUNT(*) FROM qa_revisits WHERE status IN ('queued', 'running'))
       + (SELECT COUNT(*) FROM prompt_strengthens WHERE status IN ('queued', 'running'))
       AS n`,
    )
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function activeQaForRun(runId: string): Promise<QaRevisitRow | null> {
  return getEnv()
    .DB.prepare(
      "SELECT * FROM qa_revisits WHERE run_id = ? AND status IN ('queued', 'running') ORDER BY created_at DESC LIMIT 1",
    )
    .bind(runId)
    .first<QaRevisitRow>();
}

function richerText(next: string, prev: string): boolean {
  const a = next.trim();
  const b = prev.trim();
  if (a.length < 20) return false;
  if (a === b) return false;
  const extraChars = a.length - b.length;
  const extraWords = a.split(/\s+/).filter(Boolean).length - b.split(/\s+/).filter(Boolean).length;
  return extraChars >= 40 || extraWords >= 8 || (a.length > b.length && a.includes(b) === false && extraChars >= 16);
}

function mergeConnectors(current: string[], next: string[]): string[] {
  return dedupeConnectors([...current, ...next]);
}

function extraEvidence(thread: XThread, existing: EvidenceItem[]): EvidenceItem[] {
  const have = new Set(
    existing
      .map((item) => parseTweetUrl(item.href || item.url || "")?.id)
      .filter((id): id is string => Boolean(id)),
  );
  const quotedIds = new Set<string>();
  for (const tweet of thread.tweets) {
    for (const ref of tweet.referenced_tweets ?? []) {
      if (ref.type === "quoted") quotedIds.add(ref.id);
    }
  }
  const added: EvidenceItem[] = [];
  for (const tweet of thread.tweets) {
    if (have.has(tweet.id)) continue;
    if (tweet.id !== thread.root.id && !quotedIds.has(tweet.id)) continue;
    const user = thread.users.get(tweet.author_id);
    if (!user?.username) continue;
    try {
      added.push(urlEvidence(tweetUrl(user.username, tweet.id), "Pulled on QA revisit of the source thread."));
      have.add(tweet.id);
    } catch {
      continue;
    }
  }
  return added.slice(0, 4);
}

async function applyEnrichment(
  run: RunRow,
  filing: {
    title: string;
    job_text: string;
    connectors: string[];
    what_happened: string;
    prompt_text: string;
    constraints: string;
  },
  extra: EvidenceItem[],
): Promise<{ revision: number; changes: string[] }> {
  if (!run.serial) throw new QaError("Only a stamped Run can be enriched.");
  const currentConnectors = parseJsonArray(run.connectors);
  const nextConnectors = mergeConnectors(currentConnectors, filing.connectors);
  const changes: string[] = [];
  const title = richerText(filing.title, run.title) || (filing.title.trim().length > run.title.trim().length && filing.title.trim().length >= 8)
    ? filing.title.trim()
    : run.title;
  if (title !== run.title) changes.push("title");
  const job = richerText(filing.job_text, run.job_text) ? filing.job_text.trim() : run.job_text;
  if (job !== run.job_text) changes.push("job");
  const happened = richerText(filing.what_happened, run.what_happened) ? filing.what_happened.trim() : run.what_happened;
  if (happened !== run.what_happened) changes.push("what happened");
  const prompt = richerText(filing.prompt_text, run.prompt_text || "") ? filing.prompt_text.trim() : run.prompt_text;
  if ((prompt || "") !== (run.prompt_text || "")) changes.push("prompt");
  const constraints = richerText(filing.constraints, run.constraints || "") ? filing.constraints.trim() : run.constraints;
  if ((constraints || "") !== (run.constraints || "")) changes.push("constraints");
  if (nextConnectors.join("|").toLowerCase() !== currentConnectors.join("|").toLowerCase()) changes.push("connectors");
  const evidence = parseEvidence(run.evidence_json);
  const mergedEvidence = extra.length ? [...evidence, ...extra] : evidence;
  if (extra.length) changes.push("evidence");
  if (!changes.length) throw new QaError("The thread has nothing more than the current filing.");

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
          constraints = ?,
          evidence_json = ?,
          revision = ?,
          updated_at = ?
         WHERE id = ? AND serial = ?`,
      )
      .bind(
        title,
        job,
        JSON.stringify(nextConnectors),
        happened,
        prompt || null,
        constraints || null,
        JSON.stringify(mergedEvidence),
        revision,
        now,
        run.id,
        run.serial,
      ),
    db
      .prepare(
        "INSERT INTO changelog_entries (id, run_serial, revision, one_liner, patch_id, created_at) VALUES (?, ?, ?, ?, NULL, ?)",
      )
      .bind(`cl_${randomToken(10)}`, run.serial, revision, "QA revisit: more from the source thread.", now),
  ]);
  return { revision, changes };
}

async function markQa(row: QaRevisitRow, patch: Partial<QaRevisitRow>): Promise<QaRevisitRow> {
  const next: QaRevisitRow = { ...row, ...patch };
  await getEnv()
    .DB.prepare(
      `UPDATE qa_revisits SET
        conversation_id = ?,
        tweet_id = ?,
        status = ?,
        thread_chars = ?,
        findings_json = ?,
        error = ?,
        started_at = ?,
        finished_at = ?
       WHERE id = ?`,
    )
    .bind(
      next.conversation_id,
      next.tweet_id,
      next.status,
      next.thread_chars,
      next.findings_json,
      next.error,
      next.started_at,
      next.finished_at,
      next.id,
    )
    .run();
  const updated = await getQaRevisit(row.id);
  if (!updated) throw new QaError("QA row missing after update.");
  return updated;
}

export async function processQaRevisit(id: string): Promise<QaRevisitRow> {
  const row = await getQaRevisit(id);
  if (!row) throw new QaError("QA row missing.");
  switch (row.status) {
    case "enriched":
    case "insufficient":
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

  const started = await markQa(row, { status: "running", started_at: row.started_at || isoNow(), error: null });
  const run = await getRunById(started.run_id);
  if (!run || run.status !== "published" || !run.serial) {
    return markQa(started, {
      status: "failed",
      error: "Run is not a published serial.",
      finished_at: isoNow(),
    });
  }

  try {
    const source = await sourceForRun(run, started.tweet_id ? `https://x.com/i/web/status/${started.tweet_id}` : null);
    if (!source) {
      return markQa(started, {
        status: "failed",
        error: "No source thread. Add a tweet URL.",
        finished_at: isoNow(),
      });
    }
    const thread = await fetchThreadByTweetId(source.tweet_id);
    const bot = await botUser();
    const threadText = formatThread(thread, bot.id);
    const enrichment = await enrichFromThread(
      {
        title: run.title,
        job_text: run.job_text,
        connectors: parseJsonArray(run.connectors),
        what_happened: run.what_happened,
        prompt_text: run.prompt_text,
        constraints: run.constraints,
        would_run_again: run.would_run_again,
      },
      threadText,
    );
    if (!enrichment.ok) {
      return markQa(started, {
        conversation_id: thread.root.conversation_id || source.conversation_id,
        tweet_id: source.tweet_id,
        thread_chars: threadText.length,
        status: enrichment.retry ? "queued" : "insufficient",
        error: enrichment.reason,
        finished_at: enrichment.retry ? null : isoNow(),
      });
    }

    try {
      const extra = extraEvidence(thread, parseEvidence(run.evidence_json));
      const applied = await applyEnrichment(run, enrichment.filing, extra);
      const findings: QaFindings = {
        changes: applied.changes,
        findings: enrichment.findings,
        source: source.href,
      };
      return markQa(started, {
        conversation_id: thread.root.conversation_id || source.conversation_id,
        tweet_id: source.tweet_id,
        thread_chars: threadText.length,
        status: "enriched",
        findings_json: JSON.stringify(findings),
        error: null,
        finished_at: isoNow(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not apply QA.";
      return markQa(started, {
        conversation_id: thread.root.conversation_id || source.conversation_id,
        tweet_id: source.tweet_id,
        thread_chars: threadText.length,
        status: "insufficient",
        error: message,
        finished_at: isoNow(),
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "QA revisit failed.";
    console.error(JSON.stringify({ event: "qa_revisit_failed", id: started.id, error: String(err) }));
    const retryable = /offline|token|429|Could not load|Could not read/i.test(message);
    return markQa(started, {
      status: retryable ? "queued" : "failed",
      error: message,
      finished_at: retryable ? null : isoNow(),
    });
  }
}

export async function queueQaRevisit(input: {
  run: RunRow;
  user: PublicUser;
  note?: string | null;
  tweet_url?: string | null;
}): Promise<{ row: QaRevisitRow; processed: QaRevisitRow }> {
  if (input.run.status !== "published" || !input.run.serial) {
    throw new QaError("Only a published Run can be tagged for QA.");
  }
  const active = await activeQaForRun(input.run.id);
  if (active) {
    const processed = active.status === "queued" ? await processQaRevisit(active.id) : active;
    return { row: active, processed };
  }

  const source = await sourceForRun(input.run, input.tweet_url);
  if (!source) throw new QaError("No source thread. Paste a tweet URL from the original job.");

  const id = `qa_${randomToken(12)}`;
  const now = isoNow();
  await getEnv()
    .DB.prepare(
      `INSERT INTO qa_revisits (
        id, run_id, run_serial, conversation_id, tweet_id, flagged_by, note, status,
        thread_chars, findings_json, error, created_at, started_at, finished_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', NULL, NULL, NULL, ?, NULL, NULL)`,
    )
    .bind(
      id,
      input.run.id,
      input.run.serial,
      source.conversation_id,
      source.tweet_id,
      input.user.id,
      (input.note || "").trim().slice(0, MAX_NOTE) || null,
      now,
    )
    .run();
  const row = await getQaRevisit(id);
  if (!row) throw new QaError("Could not queue QA.");
  const processed = await processQaRevisit(id);
  return { row, processed };
}

export type QaPollResult = {
  processed: number;
  enriched: number;
  insufficient: number;
  failed: number;
  queued: number;
};

export async function processQueuedQaRevisits(): Promise<QaPollResult> {
  const staleBefore = new Date(Date.now() - STALE_RUNNING_MS).toISOString();
  const { results } = await getEnv()
    .DB.prepare(
      `SELECT id FROM qa_revisits
       WHERE status = 'queued'
          OR (status = 'running' AND COALESCE(started_at, created_at) <= ?)
       ORDER BY created_at ASC
       LIMIT ?`,
    )
    .bind(staleBefore, MAX_PER_TICK)
    .all<{ id: string }>();
  const counts: QaPollResult = { processed: 0, enriched: 0, insufficient: 0, failed: 0, queued: 0 };
  for (const item of results ?? []) {
    const done = await processQaRevisit(item.id);
    counts.processed += 1;
    switch (done.status) {
      case "enriched":
        counts.enriched += 1;
        break;
      case "insufficient":
        counts.insufficient += 1;
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
