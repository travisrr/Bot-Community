import { env } from "cloudflare:workers";

export type QueryDb = Pick<D1Database, "prepare">;

export function getEnv(): Env {
  return env;
}

export function getReadDb(): QueryDb {
  const db = getEnv().DB;
  try {
    return db.withSession("first-unconstrained");
  } catch {
    return db;
  }
}

export function siteOrigin(request?: Request): string {
  const fromEnv = getEnv().SITE_ORIGIN?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (request) return new URL(request.url).origin;
  return "https://really.bot";
}
