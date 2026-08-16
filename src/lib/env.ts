import { env } from "cloudflare:workers";

export function getEnv(): Env {
  return env;
}

export function siteOrigin(request?: Request): string {
  const fromEnv = getEnv().SITE_ORIGIN?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (request) return new URL(request.url).origin;
  return "https://really.bot";
}
