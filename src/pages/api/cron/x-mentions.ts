import type { APIRoute } from "astro";
import { userFromRequest, isOwner } from "../../../lib/auth";
import { json } from "../../../lib/http";
import { getEnv } from "../../../lib/env";
import { rateLimit, clientIp } from "../../../lib/rate-limit";
import { b64urlToBytes, sha256b64url, timingSafeEqual } from "../../../lib/crypto";
import { pollXMentions } from "../../../lib/x-import";
import { processQueuedQaRevisits } from "../../../lib/qa";
import {
  maybeQueueDailyPromptStrengthens,
  processQueuedPromptStrengthens,
} from "../../../lib/prompt-strengthen";

async function authorized(request: Request): Promise<boolean> {
  const secret = getEnv().CRON_SECRET?.trim();
  const header = request.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (secret && token) {
    const a = await sha256b64url(token);
    const b = await sha256b64url(secret);
    if (timingSafeEqual(b64urlToBytes(a), b64urlToBytes(b))) return true;
  }
  const user = await userFromRequest(request);
  return isOwner(user);
}

export const POST: APIRoute = async ({ request }) => {
  if (!(await authorized(request))) return json({ error: "forbidden" }, 403);
  const allowed = await rateLimit(`x-mentions:${clientIp(request)}`, 10, 10 * 60 * 1000);
  if (!allowed) return json({ error: "rate_limited" }, 429);
  try {
    const mentions = await pollXMentions();
    const qa = await processQueuedQaRevisits();
    const queued = await maybeQueueDailyPromptStrengthens();
    const prompts = await processQueuedPromptStrengthens();
    return json({ mentions, qa, prompts: { queued, ...prompts } });
  } catch (err) {
    console.error(JSON.stringify({ event: "x_mentions_poll_failed", error: String(err) }));
    return json({ error: "poll_failed" }, 500);
  }
};
