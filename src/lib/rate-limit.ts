import { cacheGetJson, cachePutJson, cacheRequest } from "./edge-cache";

type LimitRow = { count: number; exp: number };

const memory = new Map<string, LimitRow>();

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const cacheKey = cacheRequest(`/__ratelimit/${encodeURIComponent(key)}`);
  const cached = (await cacheGetJson<LimitRow>(cacheKey)) ?? memory.get(key);
  const live = cached && cached.exp > now ? cached : null;
  const count = live?.count ?? 0;
  if (count >= limit) return false;

  const next: LimitRow = {
    count: count + 1,
    exp: live?.exp ?? now + windowMs,
  };
  memory.set(key, next);
  const ttlSec = Math.max(1, Math.ceil((next.exp - now) / 1000));
  await cachePutJson(cacheKey, next, ttlSec);
  return true;
}

export function clientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "local";
}