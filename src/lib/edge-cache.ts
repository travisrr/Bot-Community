const CACHE_ORIGIN = "https://really.bot";

export function cacheRequest(path: string): Request {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return new Request(`${CACHE_ORIGIN}${suffix}`);
}

export async function edgeCache(): Promise<Cache | null> {
  try {
    if (typeof caches === "undefined") return null;
    return caches.default;
  } catch {
    return null;
  }
}

export async function cacheGetJson<T>(key: Request): Promise<T | null> {
  const cache = await edgeCache();
  if (!cache) return null;
  try {
    const hit = await cache.match(key);
    if (!hit) return null;
    return (await hit.json()) as T;
  } catch {
    return null;
  }
}

export async function cachePutJson(key: Request, value: unknown, maxAgeSec: number): Promise<void> {
  const cache = await edgeCache();
  if (!cache) return;
  try {
    await cache.put(
      key,
      new Response(JSON.stringify(value), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `public, max-age=${Math.max(1, Math.floor(maxAgeSec))}`,
        },
      }),
    );
  } catch {
    // Cache API is optional in local Node.
  }
}
