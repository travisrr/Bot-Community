import { getEnv, siteOrigin } from "./env";
import { isoNow, publishedRunPath, houseLabel } from "./format";
import { canonical, BOT_X_HANDLE } from "./site";
import { loginOrCreateFromX, toPublicUser } from "./auth";
import { createRun, getRunById } from "./runs";
import { verifyRun } from "./review";
import { urlEvidence } from "./evidence";
import {
  botUser,
  fetchThread,
  formatThread,
  lastMentionId,
  listMentions,
  replyToTweet,
  setLastMentionId,
  tweetUrl,
  xBotReady,
  type XThread,
  type XTweet,
} from "./x-api";
import { summarizeThread } from "./x-summarize";
import type { RunRow } from "./types";

const MAX_PER_TICK = 2;
const MAX_IMPORTS_PER_AUTHOR_DAY = 5;

export type XImportStatus = "imported" | "skipped" | "failed" | "duplicate";

export type XImportRow = {
  mention_tweet_id: string;
  conversation_id: string;
  author_x_user_id: string;
  author_x_handle: string;
  tagger_x_user_id: string;
  tagger_x_handle: string;
  run_id: string | null;
  reply_tweet_id: string | null;
  status: XImportStatus;
  skip_reason: string | null;
  created_at: string;
};

export type PollResult = {
  ok: true;
  configured: boolean;
  processed: number;
  imported: number;
  skipped: number;
  failed: number;
  duplicate: number;
};

async function getImport(mentionId: string): Promise<XImportRow | null> {
  return getEnv()
    .DB.prepare("SELECT * FROM x_imports WHERE mention_tweet_id = ?")
    .bind(mentionId)
    .first<XImportRow>();
}

async function importedForConversation(conversationId: string): Promise<XImportRow | null> {
  return getEnv()
    .DB.prepare(
      "SELECT * FROM x_imports WHERE conversation_id = ? AND status = 'imported' ORDER BY created_at ASC LIMIT 1",
    )
    .bind(conversationId)
    .first<XImportRow>();
}

async function authorImportCount(authorXUserId: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const row = await getEnv()
    .DB.prepare(
      "SELECT COUNT(*) AS n FROM x_imports WHERE author_x_user_id = ? AND status = 'imported' AND created_at >= ?",
    )
    .bind(authorXUserId, since)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

async function recordImport(row: Omit<XImportRow, "created_at">): Promise<void> {
  await getEnv()
    .DB.prepare(
      `INSERT INTO x_imports (
        mention_tweet_id, conversation_id, author_x_user_id, author_x_handle,
        tagger_x_user_id, tagger_x_handle, run_id, reply_tweet_id, status, skip_reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      row.mention_tweet_id,
      row.conversation_id,
      row.author_x_user_id,
      row.author_x_handle,
      row.tagger_x_user_id,
      row.tagger_x_handle,
      row.run_id,
      row.reply_tweet_id,
      row.status,
      row.skip_reason,
      isoNow(),
    )
    .run();
}

function origin(): string {
  return siteOrigin();
}

function publicRunUrl(run: RunRow): string | null {
  const path = publishedRunPath(run);
  if (!path) return null;
  return canonical(origin(), path);
}

function replyText(
  status: XImportStatus,
  opts: { run?: RunRow | null; minted?: boolean; reason?: string },
): string | null {
  switch (status) {
    case "imported": {
      const run = opts.run;
      const url = run ? publicRunUrl(run) : null;
      if (!run?.house_number || !url) return null;
      const house = houseLabel(run.house_number);
      if (opts.minted) return `Recorded. ${house} minted. See it: ${url}`;
      return `Recorded under ${house}: ${url}`;
    }
    case "duplicate": {
      const run = opts.run;
      const url = run ? publicRunUrl(run) : null;
      return url ? `Already on the board: ${url}` : null;
    }
    case "skipped":
      return opts.reason
        ? `${opts.reason} File at ${canonical(origin(), "/submit")} if it was a real job.`
        : null;
    case "failed":
      return null;
    default: {
      const _never: never = status;
      return _never;
    }
  }
}

async function maybeReply(
  mentionId: string,
  status: XImportStatus,
  opts: { run?: RunRow | null; minted?: boolean; reason?: string },
): Promise<string | null> {
  const text = replyText(status, opts);
  if (!text) return null;
  try {
    return await replyToTweet(mentionId, text.slice(0, 270));
  } catch (err) {
    console.error(JSON.stringify({ event: "x_import_reply_failed", mention_tweet_id: mentionId, error: String(err) }));
    return null;
  }
}

async function fileFromThread(thread: XThread): Promise<{ run: RunRow; minted: boolean }> {
  const bot = await botUser();
  const summary = await summarizeThread(formatThread(thread, bot.id));
  if (!summary.ok) {
    const err = new Error(summary.reason);
    err.name = "XSkip";
    throw err;
  }
  const filing = summary.filing;
  const user = await loginOrCreateFromX({
    x_user_id: thread.originalAuthor.id,
    display_name: thread.originalAuthor.name || thread.originalAuthor.username,
    x_handle: thread.originalAuthor.username,
  });
  const evidenceUrl = tweetUrl(thread.originalAuthor.username, thread.root.id);
  const evidence = [urlEvidence(evidenceUrl, "Imported from the X thread tagged for @tryreallybot.")];
  const pending = await createRun({
    user: toPublicUser(user),
    title: filing.title,
    job_text: filing.job_text,
    connectors: filing.connectors,
    what_happened: filing.what_happened,
    would_run_again: filing.would_run_again,
    evidence,
    prompt_text: filing.prompt_text || null,
    constraints: filing.constraints || null,
    sensitive_kind: filing.sensitive_kind,
    queue: true,
  });
  const { run, minted_house } = await verifyRun(pending);
  return { run, minted: minted_house };
}

async function processMention(mention: XTweet): Promise<XImportStatus> {
  const existing = await getImport(mention.id);
  if (existing) return existing.status;

  const bot = await botUser();
  if (mention.author_id === bot.id) {
    await recordImport({
      mention_tweet_id: mention.id,
      conversation_id: mention.conversation_id || mention.id,
      author_x_user_id: mention.author_id,
      author_x_handle: BOT_X_HANDLE,
      tagger_x_user_id: mention.author_id,
      tagger_x_handle: BOT_X_HANDLE,
      run_id: null,
      reply_tweet_id: null,
      status: "skipped",
      skip_reason: "Bot mention.",
    });
    return "skipped";
  }

  const thread = await fetchThread(mention);
  const conversationId = thread.root.conversation_id || thread.root.id;
  const prior = await importedForConversation(conversationId);
  const tagger = thread.mentionAuthor;
  const author = thread.originalAuthor;

  if (prior?.run_id) {
    const run = await getRunById(prior.run_id);
    const replyId = await maybeReply(mention.id, "duplicate", { run });
    await recordImport({
      mention_tweet_id: mention.id,
      conversation_id: conversationId,
      author_x_user_id: author.id,
      author_x_handle: author.username,
      tagger_x_user_id: tagger.id,
      tagger_x_handle: tagger.username,
      run_id: prior.run_id,
      reply_tweet_id: replyId,
      status: "duplicate",
      skip_reason: null,
    });
    return "duplicate";
  }

  if ((await authorImportCount(author.id)) >= MAX_IMPORTS_PER_AUTHOR_DAY) {
    const reason = "Slow down — a few imports a day per author.";
    const replyId = await maybeReply(mention.id, "skipped", { reason });
    await recordImport({
      mention_tweet_id: mention.id,
      conversation_id: conversationId,
      author_x_user_id: author.id,
      author_x_handle: author.username,
      tagger_x_user_id: tagger.id,
      tagger_x_handle: tagger.username,
      run_id: null,
      reply_tweet_id: replyId,
      status: "skipped",
      skip_reason: reason,
    });
    return "skipped";
  }

  try {
    const { run, minted } = await fileFromThread(thread);
    const replyId = await maybeReply(mention.id, "imported", { run, minted });
    await recordImport({
      mention_tweet_id: mention.id,
      conversation_id: conversationId,
      author_x_user_id: author.id,
      author_x_handle: author.username,
      tagger_x_user_id: tagger.id,
      tagger_x_handle: tagger.username,
      run_id: run.id,
      reply_tweet_id: replyId,
      status: "imported",
      skip_reason: null,
    });
    return "imported";
  } catch (err) {
    const skip = err instanceof Error && err.name === "XSkip";
    const reason = err instanceof Error ? err.message : "Could not file this thread.";
    const status: XImportStatus = skip ? "skipped" : "failed";
    const replyId = skip ? await maybeReply(mention.id, "skipped", { reason }) : null;
    await recordImport({
      mention_tweet_id: mention.id,
      conversation_id: conversationId,
      author_x_user_id: author.id,
      author_x_handle: author.username,
      tagger_x_user_id: tagger.id,
      tagger_x_handle: tagger.username,
      run_id: null,
      reply_tweet_id: replyId,
      status,
      skip_reason: reason,
    });
    if (!skip) {
      console.error(JSON.stringify({ event: "x_import_failed", mention_tweet_id: mention.id, error: String(err) }));
    }
    return status;
  }
}

export async function pollXMentions(): Promise<PollResult> {
  const empty: PollResult = {
    ok: true,
    configured: false,
    processed: 0,
    imported: 0,
    skipped: 0,
    failed: 0,
    duplicate: 0,
  };
  if (!(await xBotReady())) return empty;
  if (!getEnv().AI) {
    console.error(JSON.stringify({ event: "x_import_no_ai" }));
    return empty;
  }

  const since = await lastMentionId();
  const mentions = await listMentions(since, 20);
  const counts: PollResult = {
    ok: true,
    configured: true,
    processed: 0,
    imported: 0,
    skipped: 0,
    failed: 0,
    duplicate: 0,
  };
  if (!since) {
    const newest = mentions.at(-1);
    if (newest) await setLastMentionId(newest.id);
    return counts;
  }
  for (const mention of mentions.slice(0, MAX_PER_TICK)) {
    const status = await processMention(mention);
    counts.processed += 1;
    switch (status) {
      case "imported":
        counts.imported += 1;
        break;
      case "skipped":
        counts.skipped += 1;
        break;
      case "failed":
        counts.failed += 1;
        break;
      case "duplicate":
        counts.duplicate += 1;
        break;
      default: {
        const _never: never = status;
        void _never;
      }
    }
    await setLastMentionId(mention.id);
  }
  return counts;
}
