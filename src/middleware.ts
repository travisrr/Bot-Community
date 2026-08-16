import { defineMiddleware } from "astro:middleware";
import { userFromRequest } from "./lib/auth";
import { siteOrigin } from "./lib/env";
import { parseSerialParam, padSerial, paddedPath } from "./lib/format";
import { readFlash, clearFlashCookie } from "./lib/flash";

export const onRequest = defineMiddleware(async (context, next) => {
  const origin = siteOrigin(context.request);
  context.locals.origin = origin;
  context.locals.user = await userFromRequest(context.request);
  const flash = readFlash(context.request);
  context.locals.flash = flash;

  const url = new URL(context.request.url);
  const redirected = serialRedirect(url);
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
  }
  return response;
});

function serialRedirect(url: URL): string | null {
  if (url.pathname === "/claim" || url.pathname === "/claim/") {
    return "/account";
  }
  const legacy = url.pathname.match(/^\/(?:br|r)\/(?:BR-)?(\d+)(\.(?:json|md))?$/i);
  if (legacy) {
    const n = parseSerialParam(legacy[1]);
    if (!n) return null;
    return `${paddedPath(n)}${legacy[2] ?? ""}${url.search}`;
  }
  const bare = url.pathname.match(/^\/(\d+)(\.(?:json|md))?$/);
  if (bare) {
    const n = parseSerialParam(bare[1]);
    if (!n) return null;
    const padded = padSerial(n);
    if (bare[1] !== padded) {
      return `/${padded}${bare[2] ?? ""}${url.search}`;
    }
  }
  return null;
}
