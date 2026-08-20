import { getEnv } from "./env";
import { isoNow } from "./format";
import { randomToken } from "./crypto";
import { BOT_X_HANDLE } from "./site";
import { loginOrCreateFromX, normalizeXHandle, toPublicUser } from "./auth";
import { rememberXBio } from "./x-bio";
import { createRun } from "./runs";
import { verifyRun } from "./review";
import { urlEvidence } from "./evidence";
import { isCompetitorHandle } from "./competitor";
import {
  botUser,
  fetchThreadByTweetId,
  deleteTweet,
  formatHarvestItem,
  formatThread,
  replyToTweet,
  tweetBody,
  tweetUrl,
  type XThread,
  type XTweet,
  type XUser,
} from "./x-api";
import { classifyThreadRole, summarizeHarvestItem } from "./x-summarize";
import {
  hasNumberedUseCases,
  isHarvestAsk,
  isHarvestTag,
  isNeverAJob,
  isReactionReply,
  NO_HARVEST_JOBS,
  splitNumberedUseCases,
  strippedText,
} from "./x-job-gate";
import type { RunRow } from "./types";

const MAX_ITEMS_PER_TICK = 2;
const MAX_IMPORTS_PER_AUTHOR_DAY = 5;
const RETRYABLE = new Set(["Could not read this reply.", "Summarizer is offline.", "Could not turn this reply into a job."]);

export type HarvestStatus = "pending" | "done" | "failed";
export type HarvestItemStatus = "pending" | "imported" | "skipped" | "failed" | "duplicate";

export type XHarvestRow = {
  id: string;
  mention_tweet_id: string;
  conversation_id: string;
  root_tweet_id: string;
  tagger_x_user_id: string;
  tagger_x_handle: string;
  status: HarvestStatus;
  reply_tweet_id: string | null;
  created_at: string;
  updated_at: string;
};

export type XHarvestItemRow = {
  id: string;
  harvest_id: string;
  source_tweet_id: string;
  item_index: number;
  author_x_user_id: string;
  author_x_handle: string;
  source_text: string;
  run_id: string | null;
  status: HarvestItemStatus;
  skip_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type HarvestTick = {
  started: number;
  filed: number;
  skipped: number;
  failed: number;
  duplicate: number;
  pending: number;
};

type Candidate = {
  tweet: XTweet;
  author: XUser;
  text: string;
  itemIndex: number;
};

export async function getHarvestForConversation(conversationId: string): Promise<XHarvestRow | null> {
  return getEnv()
    .DB.prepare("SELECT * FROM x_harvests WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 1")
    .bind(conversationId)
    .first<XHarvestRow>();
}

export async function harvestSourceForRun(runId: string): Promise<{
  tweet_id: string;
  conversation_id: string;
  handle: string;
} | null> {
  const item = await getEnv()
    .DB.prepare(
      `SELECT i.source_tweet_id, i.author_x_handle, h.conversation_id
       FROM x_harvest_items i
       JOIN x_harvests h ON h.id = i.harvest_id
       WHERE i.run_id = ?
       ORDER BY i.created_at ASC LIMIT 1`,
    )
    .bind(runId)
    .first<{ source_tweet_id: string; author_x_handle: string; conversation_id: string }>();
  if (!item) return null;
  return {
    tweet_id: item.source_tweet_id,
    conversation_id: item.conversation_id,
    handle: item.author_x_handle,
  };
}

export function threadLooksLikeHarvest(thread: XThread, mentionText: string): boolean {
  if (isHarvestTag(mentionText)) return true;
  if (isHarvestAsk(tweetBody(thread.root))) return true;
  for (const tweet of thread.tweets) {
    const body = tweetBody(tweet);
    if (tweet.author_id === thread.root.author_id && isHarvestAsk(body)) return true;
    if (tweet.author_id === thread.root.author_id && hasNumberedUseCases(body)) return true;
  }
  return false;
}

export async function shouldHarvestThread(
  thread: XThread,
  mentionText: string,
  botUserId: string,
): Promise<boolean> {
  if (threadLooksLikeHarvest(thread, mentionText)) return true;
  const conversationId = thread.root.conversation_id || thread.root.id;
  if (await getHarvestForConversation(conversationId)) return true;
  if (substantialOtherAuthors(thread, botUserId) < 2) return false;
  const root = tweetBody(thread.root);
  if (!/\?/.test(root) || !/\bbots?\b/i.test(root)) return false;
  const role = await classifyThreadRole(formatThread(thread, botUserId), mentionText);
  return role === "harvest";
}

function substantialOtherAuthors(thread: XThread, botUserId: string): number {
  const authors = new Set<string>();
  for (const tweet of thread.tweets) {
    if (tweet.author_id === botUserId || tweet.author_id === thread.root.author_id) continue;
    if (strippedText(tweetBody(tweet)).length < 24) continue;
    if (isReactionReply(tweetBody(tweet))) continue;
    authors.add(tweet.author_id);
  }
  return authors.size;
}

function harvestCandidates(thread: XThread, botUserId: string, mentionId: string): Candidate[] {
  const conversationId = thread.root.conversation_id || thread.root.id;
  const out: Candidate[] = [];
  for (const tweet of thread.tweets) {
    if (tweet.author_id === botUserId) continue;
    const convo = tweet.conversation_id || tweet.id;
    if (convo !== conversationId && tweet.id !== thread.root.id) continue;
    const body = tweetBody(tweet);
    if (tweet.id === mentionId && (strippedText(body).length < 48 || isHarvestTag(body))) continue;
    const author = thread.users.get(tweet.author_id);
    if (!author || isCompetitorHandle(author.username)) continue;
    if (isNeverAJob(body) || isReactionReply(body)) continue;
    const numbered = splitNumberedUseCases(body);
    if (numbered.length) {
      for (let i = 0; i < numbered.length; i++) {
        out.push({ tweet, author, text: numbered[i], itemIndex: i + 1 });
      }
      continue;
    }
    if (tweet.id === thread.root.id && isHarvestAsk(body)) continue;
    if (strippedText(body).length < 24) continue;
    out.push({ tweet, author, text: body, itemIndex: 1 });
  }
  return out;
}

async function authorImportCount(authorXUserId: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const row = await getEnv()
    .DB.prepare(
      `SELECT
         (SELECT COUNT(*) FROM x_imports WHERE author_x_user_id = ? AND status = 'imported' AND created_at >= ?)
       + (SELECT COUNT(*) FROM x_harvest_items WHERE author_x_user_id = ? AND status = 'imported' AND created_at >= ?)
       AS n`,
    )
    .bind(authorXUserId, since, authorXUserId, since)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

async function insertHarvest(row: Omit<XHarvestRow, "created_at" | "updated_at">): Promise<void> {
  const now = isoNow();
  await getEnv()
    .DB.prepare(
      `INSERT INTO x_harvests (
        id, mention_tweet_id, conversation_id, root_tweet_id,
        tagger_x_user_id, tagger_x_handle, status, reply_tweet_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      row.id,
      row.mention_tweet_id,
      row.conversation_id,
      row.root_tweet_id,
      row.tagger_x_user_id,
      row.tagger_x_handle,
      row.status,
      row.reply_tweet_id,
      now,
      now,
    )
    .run();
}

async function insertItem(row: Omit<XHarvestItemRow, "created_at" | "updated_at">): Promise<boolean> {
  const now = isoNow();
  const result = await getEnv()
    .DB.prepare(
      `INSERT OR IGNORE INTO x_harvest_items (
        id, harvest_id, source_tweet_id, item_index, author_x_user_id, author_x_handle,
        source_text, run_id, status, skip_reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      row.id,
      row.harvest_id,
      row.source_tweet_id,
      row.item_index,
      row.author_x_user_id,
      row.author_x_handle,
      row.source_text,
      row.run_id,
      row.status,
      row.skip_reason,
      now,
      now,
    )
    .run();
  return (result.meta.changes ?? 0) > 0;
}

async function updateItem(
  id: string,
  patch: { status: HarvestItemStatus; run_id?: string | null; skip_reason?: string | null },
): Promise<void> {
  await getEnv()
    .DB.prepare(
      "UPDATE x_harvest_items SET status = ?, run_id = COALESCE(?, run_id), skip_reason = ?, updated_at = ? WHERE id = ?",
    )
    .bind(patch.status, patch.run_id ?? null, patch.skip_reason ?? null, isoNow(), id)
    .run();
}

async function setHarvestReply(id: string, replyId: string): Promise<void> {
  await getEnv()
    .DB.prepare("UPDATE x_harvests SET reply_tweet_id = ?, updated_at = ? WHERE id = ?")
    .bind(replyId, isoNow(), id)
    .run();
}

async function finishHarvestIfIdle(harvestId: string): Promise<void> {
  const row = await getEnv()
    .DB.prepare("SELECT COUNT(*) AS n FROM x_harvest_items WHERE harvest_id = ? AND status = 'pending'")
    .bind(harvestId)
    .first<{ n: number }>();
  if ((row?.n ?? 0) > 0) return;
  await getEnv()
    .DB.prepare("UPDATE x_harvests SET status = 'done', updated_at = ? WHERE id = ? AND status = 'pending'")
    .bind(isoNow(), harvestId)
    .run();
}

async function pendingCount(harvestId?: string): Promise<number> {
  if (harvestId) {
    const row = await getEnv()
      .DB.prepare("SELECT COUNT(*) AS n FROM x_harvest_items WHERE harvest_id = ? AND status = 'pending'")
      .bind(harvestId)
      .first<{ n: number }>();
    return row?.n ?? 0;
  }
  const row = await getEnv()
    .DB.prepare("SELECT COUNT(*) AS n FROM x_harvest_items WHERE status = 'pending'")
    .first<{ n: number }>();
  return row?.n ?? 0;
}

function thanksMention(handle?: string | null): string {
  const h = normalizeXHandle(handle);
  return h ? `Thanks @${h}!` : "Thanks!";
}

function harvestThanksHandle(thread: XThread): string | null {
  const handle = normalizeXHandle(thread.originalAuthor.username);
  if (!handle || handle.toLowerCase() === BOT_X_HANDLE.toLowerCase()) return null;
  return handle;
}

async function replyHarvest(mentionId: string, ownerHandle: string | null, filed: number): Promise<string | null> {
  const thanks = thanksMention(ownerHandle);
  const text =
    filed > 0
      ? `${thanks} Filing each Grok bot from this thread onto the board — one serial each.`
      : `${thanks} Pulling the Grok jobs from this thread onto the board, one serial each.`;
  try {
    return await replyToTweet(mentionId, text.slice(0, 270));
  } catch (err) {
    console.error(JSON.stringify({ event: "x_harvest_reply_failed", mention_tweet_id: mentionId, error: String(err) }));
    return null;
  }
}

async function ensureHarvestReply(harvest: XHarvestRow, thread: XThread, mentionId: string): Promise<string | null> {
  const owner = harvestThanksHandle(thread);
  const tagger = normalizeXHandle(harvest.tagger_x_handle);
  const shouldReplace =
    Boolean(harvest.reply_tweet_id) &&
    Boolean(owner) &&
    Boolean(tagger) &&
    tagger.toLowerCase() !== owner.toLowerCase() &&
    (await harvestReplyThanksTagger(harvest.reply_tweet_id as string, tagger, owner));
  if (shouldReplace && harvest.reply_tweet_id) {
    try {
      await deleteTweet(harvest.reply_tweet_id);
    } catch (err) {
      console.error(
        JSON.stringify({
          event: "x_harvest_delete_reply_failed",
          mention_tweet_id: harvest.mention_tweet_id,
          error: String(err),
        }),
      );
    }
    harvest.reply_tweet_id = null;
    await getEnv()
      .DB.prepare("UPDATE x_harvests SET reply_tweet_id = NULL, updated_at = ? WHERE id = ?")
      .bind(isoNow(), harvest.id)
      .run();
  }
  if (harvest.reply_tweet_id) return harvest.reply_tweet_id;
  const replyId = await replyHarvest(mentionId, owner, 0);
  if (replyId) {
    await setHarvestReply(harvest.id, replyId);
    harvest.reply_tweet_id = replyId;
  }
  return replyId;
}

async function harvestReplyThanksTagger(replyId: string, tagger: string, owner: string): Promise<boolean> {
  try {
    const posted = await fetchThreadByTweetId(replyId);
    const body = tweetBody(posted.mention);
    const tag = new RegExp(`@${tagger}\\b`, "i").test(body);
    const own = new RegExp(`@${owner}\\b`, "i").test(body);
    return tag && !own;
  } catch {
    return false;
  }
}

async function syncCandidates(harvest: XHarvestRow, thread: XThread, botUserId: string): Promise<number> {
  const candidates = harvestCandidates(thread, botUserId, harvest.mention_tweet_id);
  let added = 0;
  for (const candidate of candidates) {
    const inserted = await insertItem({
      id: `hi_${randomToken(10)}`,
      harvest_id: harvest.id,
      source_tweet_id: candidate.tweet.id,
      item_index: candidate.itemIndex,
      author_x_user_id: candidate.author.id,
      author_x_handle: candidate.author.username,
      source_text: candidate.text,
      run_id: null,
      status: "pending",
      skip_reason: null,
    });
    if (inserted) added += 1;
  }
  return added;
}

async function fileItem(thread: XThread, item: XHarvestItemRow, botUserId: string): Promise<HarvestItemStatus> {
  const tweet = thread.tweets.find((row) => row.id === item.source_tweet_id);
  const author = tweet ? thread.users.get(tweet.author_id) : null;
  if (!tweet || !author) {
    await updateItem(item.id, { status: "skipped", skip_reason: "Could not load that reply." });
    return "skipped";
  }
  if (isCompetitorHandle(author.username)) {
    await updateItem(item.id, { status: "skipped", skip_reason: "This reply does not look like a Grok job." });
    return "skipped";
  }
  if ((await authorImportCount(author.id)) >= MAX_IMPORTS_PER_AUTHOR_DAY) {
    return "pending";
  }

  const summary = await summarizeHarvestItem(formatHarvestItem(thread, tweet, item.source_text, botUserId));
  if (!summary.ok) {
    const status: HarvestItemStatus = summary.retry ? "failed" : "skipped";
    if (summary.retry && RETRYABLE.has(summary.reason)) {
      await updateItem(item.id, { status: "pending", skip_reason: summary.reason });
      return "pending";
    }
    await updateItem(item.id, { status, skip_reason: summary.reason });
    return status;
  }

  const user = await loginOrCreateFromX({
    x_user_id: author.id,
    display_name: author.name || author.username,
    x_handle: author.username,
  });
  try {
    await rememberXBio(user.id, author.description);
  } catch (err) {
    console.error(JSON.stringify({ event: "x_harvest_bio_failed", user_id: user.id, error: String(err) }));
  }

  const filing = summary.filing;
  const evidenceUrl = tweetUrl(author.username, tweet.id);
  const note =
    item.item_index > 1
      ? `Use case ${item.item_index} from the X thread tagged for @${BOT_X_HANDLE}.`
      : `Imported from a reply on the X thread tagged for @${BOT_X_HANDLE}.`;
  const pending = await createRun({
    user: toPublicUser(user),
    title: filing.title,
    job_text: filing.job_text,
    connectors: filing.connectors,
    what_happened: filing.what_happened,
    would_run_again: filing.would_run_again,
    evidence: [urlEvidence(evidenceUrl, note)],
    prompt_text: filing.prompt_text || null,
    constraints: filing.constraints || null,
    sensitive_kind: filing.sensitive_kind,
    queue: true,
  });
  const { run } = await verifyRun(pending, { followup: "prompt" });
  await updateItem(item.id, { status: "imported", run_id: run.id, skip_reason: null });
  return "imported";
}

async function drainHarvest(harvest: XHarvestRow, thread: XThread, botUserId: string, limit: number): Promise<HarvestTick> {
  const counts: HarvestTick = { started: 0, filed: 0, skipped: 0, failed: 0, duplicate: 0, pending: 0 };
  const { results } = await getEnv()
    .DB.prepare(
      "SELECT * FROM x_harvest_items WHERE harvest_id = ? AND status = 'pending' ORDER BY created_at ASC LIMIT 20",
    )
    .bind(harvest.id)
    .all<XHarvestItemRow>();
  let stamped = 0;
  for (const item of results ?? []) {
    if (stamped >= limit) break;
    counts.started += 1;
    try {
      const status = await fileItem(thread, item, botUserId);
      switch (status) {
        case "imported":
          counts.filed += 1;
          stamped += 1;
          break;
        case "skipped":
          counts.skipped += 1;
          stamped += 1;
          break;
        case "failed":
          counts.failed += 1;
          stamped += 1;
          break;
        case "duplicate":
          counts.duplicate += 1;
          stamped += 1;
          break;
        case "pending":
          counts.pending += 1;
          break;
        default: {
          const _never: never = status;
          void _never;
        }
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Could not file this reply.";
      await updateItem(item.id, { status: "failed", skip_reason: reason });
      counts.failed += 1;
      stamped += 1;
      console.error(JSON.stringify({ event: "x_harvest_item_failed", item_id: item.id, error: String(err) }));
    }
  }
  await finishHarvestIfIdle(harvest.id);
  counts.pending += await pendingCount(harvest.id);
  return counts;
}

export async function processHarvestMention(
  thread: XThread,
  mention: XTweet,
): Promise<{ status: "imported" | "skipped" | "failed" | "duplicate"; filed: number; harvestId: string; replyId: string | null }> {
  const bot = await botUser();
  const conversationId = thread.root.conversation_id || thread.root.id;
  const tagger = thread.mentionAuthor;
  let harvest = await getHarvestForConversation(conversationId);
  const created = !harvest;
  if (!harvest) {
    harvest = {
      id: `hv_${randomToken(10)}`,
      mention_tweet_id: mention.id,
      conversation_id: conversationId,
      root_tweet_id: thread.root.id,
      tagger_x_user_id: tagger.id,
      tagger_x_handle: tagger.username,
      status: "pending",
      reply_tweet_id: null,
      created_at: isoNow(),
      updated_at: isoNow(),
    };
    await insertHarvest(harvest);
  }

  const added = await syncCandidates(harvest, thread, bot.id);
  if (added > 0 && harvest.status === "done") {
    await getEnv()
      .DB.prepare("UPDATE x_harvests SET status = 'pending', updated_at = ? WHERE id = ?")
      .bind(isoNow(), harvest.id)
      .run();
    harvest.status = "pending";
  }
  const pending = await pendingCount(harvest.id);
  if (!pending && added === 0) {
    if (created) {
      await getEnv()
        .DB.prepare("UPDATE x_harvests SET status = 'done', updated_at = ? WHERE id = ?")
        .bind(isoNow(), harvest.id)
        .run();
      const owner = harvestThanksHandle(thread);
      const replyId = await replyToTweet(
        mention.id,
        `${thanksMention(owner)} ${NO_HARVEST_JOBS}`.slice(0, 270),
      ).catch((err) => {
        console.error(JSON.stringify({ event: "x_harvest_reply_failed", mention_tweet_id: mention.id, error: String(err) }));
        return null;
      });
      if (replyId) await setHarvestReply(harvest.id, replyId);
      return { status: "skipped", filed: 0, harvestId: harvest.id, replyId };
    }
    return { status: "duplicate", filed: 0, harvestId: harvest.id, replyId: harvest.reply_tweet_id };
  }

  const replyId = await ensureHarvestReply(harvest, thread, mention.id);
  return { status: "imported", filed: 0, harvestId: harvest.id, replyId };
}

export async function drainPendingHarvests(): Promise<HarvestTick> {
  const empty: HarvestTick = { started: 0, filed: 0, skipped: 0, failed: 0, duplicate: 0, pending: 0 };
  const harvest = await getEnv()
    .DB.prepare(
      `SELECT h.* FROM x_harvests h
       JOIN x_harvest_items i ON i.harvest_id = h.id
       WHERE i.status = 'pending'
       ORDER BY i.created_at ASC LIMIT 1`,
    )
    .first<XHarvestRow>();
  if (!harvest) return empty;
  try {
    const bot = await botUser();
    const thread = await fetchThreadByTweetId(harvest.root_tweet_id);
    await syncCandidates(harvest, thread, bot.id);
    await ensureHarvestReply(harvest, thread, harvest.mention_tweet_id);
    return drainHarvest(harvest, thread, bot.id, MAX_ITEMS_PER_TICK);
  } catch (err) {
    console.error(JSON.stringify({ event: "x_harvest_drain_failed", harvest_id: harvest.id, error: String(err) }));
    return empty;
  }
}

export { NO_HARVEST_JOBS };
