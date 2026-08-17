import { env } from "cloudflare:workers";

export type QueryDb = Pick<D1Database, "prepare">;

let handlerEnv: Env | null = null;

export function setEnv(next: Env): void {
  handlerEnv = next;
}

export function getEnv(): Env {
  return handlerEnv ?? env;
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

export function posthogProjectApiKey(): string {
  return getEnv().POSTHOG_PROJECT_API_KEY?.trim() ?? "";
}
