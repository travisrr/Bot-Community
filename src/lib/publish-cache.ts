import { waitUntil } from "cloudflare:workers";
import { inferCategory, catPath } from "./category";
import { cacheDelete, cachePut, cacheRequest } from "./edge-cache";
import { getEnv, siteOrigin } from "./env";
import { housePath, publishedRunPath } from "./format";
import { canonical } from "./site";
import type { RunRow } from "./types";

const INDEX_PATHS = [
  "/",
  "/runs",
  "/runs.json",
  "/llms.txt",
  "/llms-full.txt",
  "/sitemap.xml",
  "/rss.xml",
  "/houses",
];

function background(task: Promise<unknown>): void {
  try {
    waitUntil(task);
  } catch {
    void task.catch(() => {});
  }
}

async function deleteKeys(paths: string[]): Promise<void> {
  await Promise.all(paths.map((path) => cacheDelete(path)));
}

function indexNowKey(): string {
  return getEnv().INDEXNOW_KEY?.trim() ?? "";
}

export async function pingIndexNow(urls: string[]): Promise<void> {
  const list = urls.filter((url) => url.startsWith("https://"));
  if (!list.length) return;
  try {
    const key = indexNowKey();
    const body: Record<string, unknown> = {
      host: "really.bot",
      urlList: list,
    };
    if (key) {
      body.key = key;
      body.keyLocation = `https://really.bot/${key}.txt`;
    }
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
  } catch {
    // IndexNow is best-effort. Missing key or a 4xx must not block publish.
  }
}

async function warmUrl(url: string): Promise<void> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "text/html" },
      redirect: "follow",
    });
    if (!res.ok) {
      res.body?.cancel();
      return;
    }
    const stored = new Response(res.body, res);
    stored.headers.set("Cache-Control", "public, max-age=60");
    const path = new URL(url).pathname;
    await cachePut(cacheRequest(path), stored);
  } catch {
    // Warm is optional in local Node and on origin fetch failure.
  }
}

export async function purgePublishedRunCaches(run: RunRow): Promise<void> {
  const path = publishedRunPath(run);
  const paths = [...INDEX_PATHS];
  if (path) {
    paths.push(path, `${path}.json`, `${path}.md`, `${path}/og.png`);
  }
  if (run.house_number) paths.push(housePath(run.house_number));
  paths.push(catPath(inferCategory(run)));
  await Promise.all([deleteKeys(paths), cacheDelete("/__cache/market-v2")]);
}

export function announcePublishedRun(run: RunRow): void {
  const origin = siteOrigin();
  const path = publishedRunPath(run);
  const url = path ? canonical(origin, path) : null;
  background(
    (async () => {
      await purgePublishedRunCaches(run);
      if (!url) return;
      await pingIndexNow([url]);
      await warmUrl(url);
    })(),
  );
}
