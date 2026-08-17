import { getEnv } from "./env";
import { isoNow } from "./format";
import { BOT_X_HANDLE } from "./site";
import { normalizeXHandle } from "./auth";

const TOKEN_URL = "https://api.x.com/2/oauth2/token";
const API = "https://api.x.com/2";
const TWEET_FIELDS = "created_at,conversation_id,author_id,in_reply_to_user_id,referenced_tweets,note_tweet,text";
const USER_FIELDS = "id,name,username";

export type XUser = {
  id: string;
  name: string;
  username: string;
};

export type XTweet = {
  id: string;
  text: string;
  author_id: string;
  conversation_id: string;
  created_at: string;
  in_reply_to_user_id?: string;
  referenced_tweets?: { type: "replied_to" | "quoted" | "retweeted"; id: string }[];
  note_tweet?: { text?: string };
};

export type XThread = {
  tweets: XTweet[];
  users: Map<string, XUser>;
  mention: XTweet;
  mentionAuthor: XUser;
  root: XTweet;
  originalAuthor: XUser;
};

type TokenRow = {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  bot_user_id: string | null;
  last_mention_id: string | null;
};

export class XApiError extends Error {
  constructor(
    message: string,
    readonly status = 0,
  ) {
    super(message);
    this.name = "XApiError";
  }
}

export function tweetUrl(handle: string, tweetId: string): string {
  return `https://x.com/${normalizeXHandle(handle)}/status/${tweetId}`;
}

export function tweetBody(tweet: XTweet): string {
  const long = tweet.note_tweet?.text?.trim();
  return long || tweet.text || "";
}

function basicAuth(clientId: string, clientSecret: string): string {
  const bytes = new TextEncoder().encode(`${clientId}:${clientSecret}`);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return `Basic ${btoa(bin)}`;
}

async function loadAuth(): Promise<TokenRow | null> {
  return getEnv()
    .DB.prepare(
      "SELECT access_token, refresh_token, expires_at, bot_user_id, last_mention_id FROM x_bot_auth WHERE id = 'bot'",
    )
    .first<TokenRow>();
}

async function saveAuth(row: TokenRow): Promise<void> {
  await getEnv()
    .DB.prepare(
      `INSERT INTO x_bot_auth (id, access_token, refresh_token, expires_at, bot_user_id, last_mention_id, updated_at)
       VALUES ('bot', ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         access_token = excluded.access_token,
         refresh_token = excluded.refresh_token,
         expires_at = excluded.expires_at,
         bot_user_id = COALESCE(excluded.bot_user_id, x_bot_auth.bot_user_id),
         last_mention_id = COALESCE(excluded.last_mention_id, x_bot_auth.last_mention_id),
         updated_at = excluded.updated_at`,
    )
    .bind(row.access_token, row.refresh_token, row.expires_at, row.bot_user_id, row.last_mention_id, isoNow())
    .run();
}

export async function setLastMentionId(id: string): Promise<void> {
  await getEnv()
    .DB.prepare("UPDATE x_bot_auth SET last_mention_id = ?, updated_at = ? WHERE id = 'bot'")
    .bind(id, isoNow())
    .run();
}

export async function lastMentionId(): Promise<string | null> {
  const row = await loadAuth();
  return row?.last_mention_id ?? null;
}

async function refreshAccessToken(refreshToken: string): Promise<TokenRow> {
  const env = getEnv();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuth(env.X_CLIENT_ID, env.X_CLIENT_SECRET),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: env.X_CLIENT_ID,
    }),
  });
  const json = (await res.json().catch(() => null)) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
  } | null;
  if (!res.ok || !json?.access_token) {
    console.error(
      JSON.stringify({ event: "x_bot_refresh_failed", status: res.status, error: json?.error ?? "missing_token" }),
    );
    throw new XApiError("X bot token refresh failed.", res.status);
  }
  const prev = await loadAuth();
  const row: TokenRow = {
    access_token: json.access_token,
    refresh_token: json.refresh_token || refreshToken,
    expires_at: new Date(Date.now() + Math.max(60, (json.expires_in ?? 7200) - 60) * 1000).toISOString(),
    bot_user_id: prev?.bot_user_id ?? null,
    last_mention_id: prev?.last_mention_id ?? null,
  };
  await saveAuth(row);
  return row;
}

export async function installBotTokens(input: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  bot_user_id: string;
}): Promise<void> {
  const prev = await loadAuth();
  await saveAuth({
    access_token: input.access_token,
    refresh_token: input.refresh_token,
    expires_at: new Date(Date.now() + Math.max(60, input.expires_in - 60) * 1000).toISOString(),
    bot_user_id: input.bot_user_id,
    last_mention_id: prev?.last_mention_id ?? null,
  });
}

export async function xBotReady(): Promise<boolean> {
  if (!getEnv().X_CLIENT_ID?.trim() || !getEnv().X_CLIENT_SECRET?.trim()) return false;
  const stored = await loadAuth();
  return Boolean(stored?.refresh_token || getEnv().X_BOT_REFRESH_TOKEN?.trim());
}

async function botAuth(): Promise<TokenRow> {
  const env = getEnv();
  const stored = await loadAuth();
  const refresh = stored?.refresh_token || env.X_BOT_REFRESH_TOKEN?.trim();
  if (!refresh) throw new XApiError("X bot refresh token missing.");
  if (!stored || new Date(stored.expires_at).getTime() <= Date.now()) {
    return refreshAccessToken(refresh);
  }
  return stored;
}

type XList<T> = {
  data?: T;
  includes?: { users?: XUser[]; tweets?: XTweet[] };
  meta?: { next_token?: string; newest_id?: string; oldest_id?: string; result_count?: number };
  errors?: { message?: string; title?: string }[];
};

async function xFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<XList<T>> {
  const auth = await botAuth();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
      ...(init.headers || {}),
    },
  });
  if (res.status === 401 && retry) {
    await refreshAccessToken(auth.refresh_token);
    return xFetch<T>(path, init, false);
  }
  const json = (await res.json().catch(() => null)) as XList<T> | null;
  if (!res.ok) {
    const err = json?.errors?.[0];
    throw new XApiError(err?.message || err?.title || `X API ${res.status}`, res.status);
  }
  return json ?? {};
}

export async function botUser(): Promise<XUser> {
  const stored = await botAuth();
  if (stored.bot_user_id) {
    const looked = await lookupUsers([stored.bot_user_id]);
    const me = looked.get(stored.bot_user_id);
    if (me) return me;
  }
  const json = await xFetch<XUser>(`/users/me?user.fields=${USER_FIELDS}`);
  const me = json.data;
  if (!me?.id) throw new XApiError(`Could not read @${BOT_X_HANDLE} profile.`);
  await getEnv()
    .DB.prepare("UPDATE x_bot_auth SET bot_user_id = ?, updated_at = ? WHERE id = 'bot'")
    .bind(me.id, isoNow())
    .run();
  return me;
}

async function lookupUsers(ids: string[]): Promise<Map<string, XUser>> {
  const users = new Map<string, XUser>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return users;
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    const json = await xFetch<XUser[]>(`/users?ids=${chunk.join(",")}&user.fields=${USER_FIELDS}`);
    for (const user of json.data ?? []) users.set(user.id, user);
  }
  return users;
}

function mergeUsers(target: Map<string, XUser>, extra?: XUser[]): void {
  for (const user of extra ?? []) target.set(user.id, user);
}

function mergeTweets(target: Map<string, XTweet>, extra?: XTweet[]): void {
  for (const tweet of extra ?? []) {
    if (!tweet.id) continue;
    target.set(tweet.id, {
      ...tweet,
      conversation_id: tweet.conversation_id || tweet.id,
      text: tweet.text || "",
      created_at: tweet.created_at || "",
      author_id: tweet.author_id || "",
    });
  }
}

export async function listMentions(sinceId: string | null, max = 20): Promise<XTweet[]> {
  const me = await botUser();
  const params = new URLSearchParams({
    max_results: String(Math.min(100, Math.max(5, max))),
    "tweet.fields": TWEET_FIELDS,
    expansions: "author_id",
    "user.fields": USER_FIELDS,
  });
  if (sinceId) params.set("since_id", sinceId);
  const json = await xFetch<XTweet[]>(`/users/${me.id}/mentions?${params.toString()}`);
  return (json.data ?? []).slice().reverse();
}

export async function fetchThread(mention: XTweet): Promise<XThread> {
  const tweets = new Map<string, XTweet>();
  const users = new Map<string, XUser>();
  mergeTweets(tweets, [mention]);

  const conversationId = mention.conversation_id || mention.id;
  const ids = [...new Set([mention.id, conversationId])];
  const looked = await xFetch<XTweet | XTweet[]>(
    `/tweets?ids=${ids.join(",")}&tweet.fields=${TWEET_FIELDS}&expansions=author_id,referenced_tweets.id,referenced_tweets.id.author_id&user.fields=${USER_FIELDS}`,
  );
  mergeTweets(tweets, Array.isArray(looked.data) ? looked.data : looked.data ? [looked.data] : []);
  mergeTweets(tweets, looked.includes?.tweets);
  mergeUsers(users, looked.includes?.users);

  try {
    const params = new URLSearchParams({
      query: `conversation_id:${conversationId}`,
      max_results: "100",
      "tweet.fields": TWEET_FIELDS,
      expansions: "author_id,referenced_tweets.id",
      "user.fields": USER_FIELDS,
    });
    const search = await xFetch<XTweet[]>(`/tweets/search/recent?${params.toString()}`);
    mergeTweets(tweets, search.data);
    mergeTweets(tweets, search.includes?.tweets);
    mergeUsers(users, search.includes?.users);
  } catch (err) {
    console.error(JSON.stringify({ event: "x_thread_search_failed", conversation_id: conversationId, error: String(err) }));
  }

  const missingAuthors = [...tweets.values()].map((t) => t.author_id).filter((id) => id && !users.has(id));
  if (missingAuthors.length) {
    const extra = await lookupUsers(missingAuthors);
    for (const [id, user] of extra) users.set(id, user);
  }

  const ordered = [...tweets.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  const liveMention = tweets.get(mention.id) ?? mention;
  const root = tweets.get(conversationId) ?? ordered[0] ?? liveMention;
  const mentionAuthor = users.get(liveMention.author_id);
  if (!mentionAuthor) throw new XApiError("Mention author missing.");
  const bot = await botUser();
  const original =
    (root.author_id !== bot.id ? users.get(root.author_id) : null) ||
    ordered.map((t) => users.get(t.author_id)).find((u) => u && u.id !== bot.id) ||
    mentionAuthor;
  if (!original) throw new XApiError("Original author missing.");

  return {
    tweets: ordered,
    users,
    mention: liveMention,
    mentionAuthor,
    root,
    originalAuthor: original,
  };
}

export function formatThread(thread: XThread, botUserId: string): string {
  const lines: string[] = [];
  for (const tweet of thread.tweets) {
    if (tweet.author_id === botUserId) continue;
    const user = thread.users.get(tweet.author_id);
    const handle = user?.username || tweet.author_id;
    const name = user?.name || handle;
    const body = tweetBody(tweet).trim();
    if (!body) continue;
    lines.push(`@${handle} (${name}): ${body}`);
  }
  return lines.join("\n\n");
}

export async function replyToTweet(inReplyTo: string, text: string): Promise<string> {
  const json = await xFetch<{ id?: string }>(
    "/tweets",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, reply: { in_reply_to_tweet_id: inReplyTo } }),
    },
    true,
  );
  const id = json.data?.id;
  if (!id) throw new XApiError("X reply missing id.");
  return id;
}
