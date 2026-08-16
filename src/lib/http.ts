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

export function crawlable(body: string, type: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=300, must-revalidate",
    },
  });
}

export function noindex(): HeadersInit {
  return { "X-Robots-Tag": "noindex, nofollow" };
}
