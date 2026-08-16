import { defineMiddleware } from "astro:middleware";
import { userFromRequest } from "./lib/auth";
import { siteOrigin } from "./lib/env";
import { parseSerialParam, parseHouseParam, housePath, houseSlug, runPath } from "./lib/format";
import { getRunBySerial } from "./lib/runs";
import { readFlash, clearFlashCookie } from "./lib/flash";

export const onRequest = defineMiddleware(async (context, next) => {
  const origin = siteOrigin(context.request);
  context.locals.origin = origin;
  context.locals.user = await userFromRequest(context.request);
  const flash = readFlash(context.request);
  context.locals.flash = flash;

  const url = new URL(context.request.url);
  const hostRedirect = canonicalHostRedirect(url);
  if (hostRedirect) {
    return Response.redirect(hostRedirect, 301);
  }
  const redirected = await pathRedirect(url);
  if (redirected) {
    return context.redirect(redirected, 301);
  }

  const response = await next();
  if (flash) {
    response.headers.append("Set-Cookie", clearFlashCookie(origin));
  }
  const path = url.pathname;
  if (
    path.startsWith("/admin") ||
    path.startsWith("/account") ||
    path.startsWith("/api/") ||
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/filing") ||
    path.startsWith("/claim")
  ) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  } else if (!path.startsWith("/api")) {
    const accept = context.request.headers.get("Accept") ?? "";
    if (accept.includes("text/html") || path.endsWith(".xml") || path.endsWith(".txt") || path.endsWith(".md")) {
      response.headers.append("Link", `<${origin}/llms.txt>; rel="alternate"; type="text/plain"; title="llms.txt"`);
      response.headers.append("Link", `<${origin}/sitemap.xml>; rel="sitemap"; type="application/xml"`);
    }
  }
  return response;
});

function canonicalHostRedirect(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) return null;
  const next = new URL(url.toString());
  let changed = false;
  if (next.protocol === "http:") {
    next.protocol = "https:";
    changed = true;
  }
  if (host === "www.really.bot") {
    next.hostname = "really.bot";
    next.protocol = "https:";
    changed = true;
  }
  return changed ? next.toString() : null;
}

async function pathRedirect(url: URL): Promise<string | null> {
  if (url.pathname === "/claim" || url.pathname === "/claim/") {
    return "/account";
  }
  if (url.pathname === "/tos" || url.pathname === "/tos/") {
    return "/terms";
  }
  if (url.pathname === "/privacy-policy" || url.pathname === "/privacy-policy/") {
    return "/privacy";
  }

  const slashHouse = url.pathname.match(/^\/house\/(\d+)(?:\/(\d+))?(\.(?:json|md))?$/i);
  if (slashHouse) {
    const house = parseSerialParam(slashHouse[1]);
    if (!house) return null;
    const ext = slashHouse[3] ?? "";
    if (slashHouse[2]) {
      const serial = parseSerialParam(slashHouse[2]);
      if (!serial) return null;
      return `${runPath(house, serial)}${ext}${url.search}`;
    }
    return `${housePath(house)}${ext}${url.search}`;
  }

  const legacy = url.pathname.match(/^\/(?:br|r)\/(?:BR-)?(\d+)(\.(?:json|md))?$/i);
  if (legacy) {
    return serialToRunPath(legacy[1], legacy[2], url.search);
  }

  const bare = url.pathname.match(/^\/(\d+)(\.(?:json|md))?$/);
  if (bare) {
    return serialToRunPath(bare[1], bare[2], url.search);
  }

  const houseBare = url.pathname.match(/^\/(house\d+)$/i);
  if (houseBare) {
    const n = parseHouseParam(houseBare[1]);
    if (!n) return null;
    const canonicalHouse = houseSlug(n);
    if (houseBare[1] !== canonicalHouse) {
      return `${housePath(n)}${url.search}`;
    }
  }

  return null;
}

async function serialToRunPath(
  serialRaw: string,
  ext: string | undefined,
  search: string,
): Promise<string | null> {
  const serial = parseSerialParam(serialRaw);
  if (!serial) return null;
  const run = await getRunBySerial(serial);
  if (!run?.house_number) return null;
  return `${runPath(run.house_number, serial)}${ext ?? ""}${search}`;
}
