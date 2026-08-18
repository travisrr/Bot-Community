export function safeNextPath(raw: string | null | undefined, fallback = "/account"): string {
  const dest = (raw || "").trim();
  if (!dest.startsWith("/") || dest.startsWith("//") || dest.includes("\\") || dest.includes("://")) {
    return fallback;
  }
  return dest;
}

export function redirectTo(path: string, cookies: string[] = []): Response {
  const headers = new Headers({ Location: path });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers });
}

export function json(data: unknown, status = 200, extra: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extra },
  });
}

export function text(body: string, status = 200, type = "text/plain; charset=utf-8"): Response {
  return new Response(body, { status, headers: { "Content-Type": type } });
}

export const CRAWL_CACHE = "public, max-age=60, s-maxage=60, stale-while-revalidate=300";
export const HTML_CACHE = "public, s-maxage=60, stale-while-revalidate=600, stale-if-error=86400";
export const HTML_CDN_CACHE = "public, s-maxage=60, stale-while-revalidate=600";
export const PRIVATE_CACHE = "private, no-store";

const RUN_HTML_RE = /^\/house\d+\/\d+\/?$/i;
const HOUSE_X_RE = /^\/house\d+\/x\/?$/i;

export function isRunHtmlPath(path: string): boolean {
  return RUN_HTML_RE.test(path);
}

export function isPrivateCachePath(path: string): boolean {
  return (
    path.startsWith("/admin") ||
    path.startsWith("/account") ||
    path.startsWith("/api/") ||
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/claim") ||
    path.startsWith("/filing") ||
    HOUSE_X_RE.test(path)
  );
}

export function crawlable(body: string, type: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": CRAWL_CACHE,
    },
  });
}

export function noindex(): HeadersInit {
  return { "X-Robots-Tag": "noindex, nofollow" };
}
