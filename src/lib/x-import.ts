import { getEnv } from "./env";
import { isoNow } from "./format";
import { BOT_X_HANDLE, OWNER_X_HANDLE } from "./site";
import { loginOrCreateFromX, normalizeXHandle, toPublicUser } from "./auth";
import { rememberXBio } from "./x-bio";
import { createRun, getPublishedRun, getRunById, parseEvidence } from "./runs";
import { verifyRun } from "./review";
import { urlEvidence } from "./evidence";
import {
  botUser,
  fetchThread,
  formatThread,
  lastMentionId,
  listMentions,
  replyToTweet,
  deleteTweet,
  uploadTweetImage,
  setLastMentionId,
  parseTweetUrl,
  tweetUrl,
  tweetBody,
  xBotReady,
  type XThread,
  type XTweet,
} from "./x-api";
import { summarizeThread } from "./x-summarize";
import { finishedJobGate, NOT_A_GROK_JOB } from "./x-job-gate";
import { isCompetitorHandle } from "./competitor";
import { houseStampForRun, renderHouseStampPng } from "./house-card";
import { polishPublishedRun } from "./run-followup";
import type { RunRow } from "./types";

const MAX_PER_TICK = 2;
const MAX_IMPORTS_PER_AUTHOR_DAY = 5;
const RETRYABLE_SKIPS = new Set(["Could not read this thread.", "Summarizer is offline."]);

function retryableSkip(reason: string | null): boolean {
  return Boolean(reason && RETRYABLE_SKIPS.has(reason));
}

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

export async function getImportForRun(runId: string): Promise<XImportRow | null> {
  return getEnv()
    .DB.prepare(
      "SELECT * FROM x_imports WHERE run_id = ? AND status IN ('imported', 'duplicate') ORDER BY created_at ASC LIMIT 1",
    )
    .bind(runId)
    .first<XImportRow>();
}

export async function sourcePostForHouse(
  house: number,
): Promise<{ handle: string; tweetId: string } | null> {
  const run = await getEnv()
    .DB.prepare(
      "SELECT * FROM runs WHERE house_number = ? AND status = 'published' ORDER BY serial ASC LIMIT 1",
    )
    .bind(house)
    .first<RunRow>();
  if (!run) return null;
  const imported = await getImportForRun(run.id);
  if (imported) {
    return {
      handle: imported.author_x_handle,
      tweetId: imported.conversation_id || imported.mention_tweet_id,
    };
  }
  for (const item of parseEvidence(run.evidence_json)) {
    const parsed = parseTweetUrl(item.href || item.url || "");
    if (parsed) return { handle: parsed.handle || "", tweetId: parsed.id };
  }
  return null;
}

async function importedForConversation(conversationId: string): Promise<XImportRow | null> {
  return getEnv()
    .DB.prepare(
      "SELECT * FROM x_imports WHERE conversation_id = ? AND status IN ('imported', 'duplicate') AND run_id IS NOT NULL ORDER BY created_at ASC LIMIT 1",
    )
    .bind(conversationId)
    .first<XImportRow>();
}

async function liveRunFromImport(row: XImportRow | null): Promise<RunRow | null> {
  if (!row?.run_id) return null;
  const run = await getRunById(row.run_id);
  if (!run) return null;
  if (run.status === "published") return run;
  if (run.canonical_serial) return getPublishedRun(run.canonical_serial);
  return null;
}

async function publishedRunForTweetId(tweetId: string): Promise<RunRow | null> {
  const id = tweetId.trim();
  if (!/^\d+$/.test(id)) return null;
  const { results } = await getEnv()
    .DB.prepare(
      "SELECT * FROM runs WHERE status = 'published' AND evidence_json LIKE ? ORDER BY serial ASC LIMIT 20",
    )
    .bind(`%${id}%`)
    .all<RunRow>();
  for (const run of results ?? []) {
    for (const item of parseEvidence(run.evidence_json)) {
      const parsed = parseTweetUrl(item.href || item.url || "");
      if (parsed?.id === id) return run;
    }
  }
  return null;
}

async function setImportReply(mentionId: string, replyId: string): Promise<void> {
  await getEnv()
    .DB.prepare("UPDATE x_imports SET reply_tweet_id = ? WHERE mention_tweet_id = ?")
    .bind(replyId, mentionId)
    .run();
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(mention_tweet_id) DO UPDATE SET
        conversation_id = excluded.conversation_id,
        author_x_user_id = excluded.author_x_user_id,
        author_x_handle = excluded.author_x_handle,
        tagger_x_user_id = excluded.tagger_x_user_id,
        tagger_x_handle = excluded.tagger_x_handle,
        run_id = excluded.run_id,
        reply_tweet_id = COALESCE(excluded.reply_tweet_id, x_imports.reply_tweet_id),
        status = excluded.status,
        skip_reason = excluded.skip_reason`,
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

function skippedThanksHandles(tagger?: string | null): Set<string> {
  return new Set(
    [BOT_X_HANDLE, OWNER_X_HANDLE, tagger]
      .map((h) => normalizeXHandle(h).toLowerCase())
      .filter(Boolean),
  );
}

function usableThanksHandle(raw: string | null | undefined, skipped: Set<string>): string | null {
  const h = normalizeXHandle(raw);
  if (!h || skipped.has(h.toLowerCase())) return null;
  return h;
}

function handlesInText(text: string): string[] {
  return [...text.matchAll(/@([A-Za-z0-9_]{1,15})/g)].map((match) => match[1]);
}

function refTweetAuthorId(thread: XThread, type: "replied_to" | "quoted"): string | undefined {
  const ref = thread.mention.referenced_tweets?.find((row) => row.type === type);
  if (!ref) return undefined;
  return thread.tweets.find((tweet) => tweet.id === ref.id)?.author_id;
}

function thanksHandleFromThread(thread: XThread): string | null {
  const skipped = skippedThanksHandles(thread.mentionAuthor.username);
  const userHandle = (id?: string) => (id ? thread.users.get(id)?.username : null);
  const taggedAuthorId =
    thread.mention.in_reply_to_user_id || refTweetAuthorId(thread, "replied_to") || refTweetAuthorId(thread, "quoted");
  const candidates = [
    userHandle(taggedAuthorId),
    ...handlesInText(tweetBody(thread.mention)),
    ...handlesInText(tweetBody(thread.root)),
    userHandle(thread.root.author_id),
  ];
  for (const candidate of candidates) {
    const handle = usableThanksHandle(candidate, skipped);
    if (handle) return handle;
  }
  return usableThanksHandle(thread.originalAuthor.username, skippedThanksHandles(null));
}

function thanksMention(handle?: string | null): string {
  const h = normalizeXHandle(handle);
  return h ? `Thanks @${h}!` : "Thanks!";
}

function replyText(
  status: XImportStatus,
  opts: { run?: RunRow | null; minted?: boolean; reason?: string; handle?: string | null },
): string | null {
  switch (status) {
    case "imported": {
      const run = opts.run;
      if (!run?.house_number || !run.serial) return null;
      return `${thanksMention(opts.handle)} We're logging this Grok job prompt, minting your house (where your Groks live) and going live with this one. Check it out when you have a chance!`;
    }
    case "duplicate":
      return opts.run?.house_number ? "Already on the board." : null;
    case "skipped":
      return opts.reason ? `${opts.reason} Tag a finished Grok job next time.` : null;
    case "failed":
      return null;
    default: {
      const _never: never = status;
      return _never;
    }
  }
}

async function attachHouseStamp(run: RunRow | null | undefined): Promise<string | null> {
  if (!run) return null;
  try {
    const card = await houseStampForRun(run);
    if (!card) return null;
    const png = await renderHouseStampPng(card);
    return await uploadTweetImage(png);
  } catch (err) {
    console.error(JSON.stringify({ event: "x_import_media_failed", run_id: run.id, error: String(err) }));
    return null;
  }
}

async function maybeReply(
  mentionId: string,
  status: XImportStatus,
  opts: { run?: RunRow | null; minted?: boolean; reason?: string; handle?: string | null },
): Promise<string | null> {
  const text = replyText(status, opts);
  if (!text) return null;
  const mediaId =
    status === "imported" || status === "duplicate" ? await attachHouseStamp(opts.run) : null;
  try {
    return await replyToTweet(mentionId, text.slice(0, 270), mediaId);
  } catch (err) {
    if (mediaId) {
      try {
        return await replyToTweet(mentionId, text.slice(0, 270));
      } catch (retryErr) {
        console.error(
          JSON.stringify({ event: "x_import_reply_failed", mention_tweet_id: mentionId, error: String(retryErr) }),
        );
        return null;
      }
    }
    console.error(JSON.stringify({ event: "x_import_reply_failed", mention_tweet_id: mentionId, error: String(err) }));
    return null;
  }
}

async function retractSkippedImportReplies(): Promise<void> {
  const { results } = await getEnv()
    .DB.prepare(
      `SELECT mention_tweet_id, reply_tweet_id FROM x_imports
       WHERE status = 'skipped' AND reply_tweet_id IS NOT NULL AND skip_reason = ?
       LIMIT 5`,
    )
    .bind(NOT_A_GROK_JOB)
    .all<{ mention_tweet_id: string; reply_tweet_id: string }>();
  for (const row of results ?? []) {
    try {
      await deleteTweet(row.reply_tweet_id);
    } catch (err) {
      console.error(
        JSON.stringify({
          event: "x_import_delete_reply_failed",
          mention_tweet_id: row.mention_tweet_id,
          error: String(err),
        }),
      );
      continue;
    }
    await getEnv()
      .DB.prepare("UPDATE x_imports SET reply_tweet_id = NULL WHERE mention_tweet_id = ?")
      .bind(row.mention_tweet_id)
      .run();
  }
}

async function fileFromThread(thread: XThread): Promise<{ run: RunRow; minted: boolean }> {
  if (isCompetitorHandle(thread.originalAuthor.username)) {
    const err = new Error(NOT_A_GROK_JOB);
    err.name = "XSkip";
    throw err;
  }
  const bot = await botUser();
  const formatted = formatThread(thread, bot.id);
  const gate = finishedJobGate(formatted, tweetBody(thread.mention));
  if (!gate.ok) {
    const err = new Error(gate.reason);
    err.name = "XSkip";
    throw err;
  }
  const summary = await summarizeThread(formatted);
  if (!summary.ok) {
    const err = new Error(summary.reason);
    err.name = summary.retry ? "XFail" : "XSkip";
    throw err;
  }
  const filing = summary.filing;
  const user = await loginOrCreateFromX({
    x_user_id: thread.originalAuthor.id,
    display_name: thread.originalAuthor.name || thread.originalAuthor.username,
    x_handle: thread.originalAuthor.username,
  });
  try {
    await rememberXBio(user.id, thread.originalAuthor.description);
  } catch (err) {
    console.error(JSON.stringify({ event: "x_import_bio_failed", user_id: user.id, error: String(err) }));
  }
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
  if (existing) {
    switch (existing.status) {
      case "imported":
      case "duplicate":
        return existing.status;
      case "skipped":
        if (!retryableSkip(existing.skip_reason)) return existing.status;
        break;
      case "failed":
        break;
      default: {
        const _never: never = existing.status;
        return _never;
      }
    }
  }

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
  const tagger = thread.mentionAuthor;
  const author = thread.originalAuthor;
  if (isCompetitorHandle(author.username)) {
    await recordImport({
      mention_tweet_id: mention.id,
      conversation_id: conversationId,
      author_x_user_id: author.id,
      author_x_handle: author.username,
      tagger_x_user_id: tagger.id,
      tagger_x_handle: tagger.username,
      run_id: null,
      reply_tweet_id: null,
      status: "skipped",
      skip_reason: NOT_A_GROK_JOB,
    });
    return "skipped";
  }
  const prior =
    (await importedForConversation(conversationId)) ||
    (thread.root.id !== conversationId ? await importedForConversation(thread.root.id) : null);
  const existingRun = (await liveRunFromImport(prior)) || (await publishedRunForTweetId(thread.root.id));

  if (existingRun) {
    await recordImport({
      mention_tweet_id: mention.id,
      conversation_id: conversationId,
      author_x_user_id: author.id,
      author_x_handle: author.username,
      tagger_x_user_id: tagger.id,
      tagger_x_handle: tagger.username,
      run_id: existingRun.id,
      reply_tweet_id: null,
      status: "duplicate",
      skip_reason: null,
    });
    const replyId = await maybeReply(mention.id, "duplicate", { run: existingRun });
    if (replyId) await setImportReply(mention.id, replyId);
    return "duplicate";
  }

  const gate = finishedJobGate(formatThread(thread, bot.id), tweetBody(mention));
  if (!gate.ok) {
    await recordImport({
      mention_tweet_id: mention.id,
      conversation_id: conversationId,
      author_x_user_id: author.id,
      author_x_handle: author.username,
      tagger_x_user_id: tagger.id,
      tagger_x_handle: tagger.username,
      run_id: null,
      reply_tweet_id: null,
      status: "skipped",
      skip_reason: gate.reason,
    });
    return "skipped";
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
    await recordImport({
      mention_tweet_id: mention.id,
      conversation_id: conversationId,
      author_x_user_id: author.id,
      author_x_handle: author.username,
      tagger_x_user_id: tagger.id,
      tagger_x_handle: tagger.username,
      run_id: run.id,
      reply_tweet_id: null,
      status: "imported",
      skip_reason: null,
    });
    try {
      await polishPublishedRun(run);
    } catch (err) {
      console.error(JSON.stringify({ event: "x_import_polish_failed", run_id: run.id, error: String(err) }));
    }
    const replyId = await maybeReply(mention.id, "imported", {
      run,
      minted,
      handle: thanksHandleFromThread(thread),
    });
    if (replyId) await setImportReply(mention.id, replyId);
    return "imported";
  } catch (err) {
    const skip = err instanceof Error && err.name === "XSkip";
    const retry = err instanceof Error && err.name === "XFail";
    const reason = err instanceof Error ? err.message : "Could not file this thread.";
    const status: XImportStatus = skip ? "skipped" : "failed";
    const silent = skip && reason === NOT_A_GROK_JOB;
    const replyId = skip && !silent ? await maybeReply(mention.id, "skipped", { reason }) : null;
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
      console.error(
        JSON.stringify({
          event: retry ? "x_import_retryable" : "x_import_failed",
          mention_tweet_id: mention.id,
          error: String(err),
        }),
      );
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
  try {
    await retractSkippedImportReplies();
  } catch (err) {
    console.error(JSON.stringify({ event: "x_import_retract_failed", error: String(err) }));
  }
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
