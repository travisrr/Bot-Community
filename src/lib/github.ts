import { cacheGetJson, cachePutJson, cacheRequest } from "./edge-cache";
import { GITHUB_REPO } from "./site";

const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}`;
const CACHE_KEY = cacheRequest("/__cache/github-stars");
const FRESH_MS = 60_000;
const STALE_MS = 60 * 60 * 1000;

type StarCache = { stars: number; fetchedAt: number };

let memory: StarCache | null = null;
let inflight: Promise<number | null> | null = null;

export async function getRepoStars(): Promise<number | null> {
  const now = Date.now();
  if (memory && now - memory.fetchedAt < FRESH_MS) return memory.stars;
  if (!inflight) {
    inflight = loadStars().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function loadStars(): Promise<number | null> {
  const cached = (await readCache()) ?? memory;
  if (cached && Date.now() - cached.fetchedAt < FRESH_MS) {
    memory = cached;
    return cached.stars;
  }

  const fresh = await fetchGithubStars();
  if (fresh != null) {
    memory = { stars: fresh, fetchedAt: Date.now() };
    await writeCache(memory);
    return fresh;
  }

  if (cached && Date.now() - cached.fetchedAt < STALE_MS) {
    memory = cached;
    return cached.stars;
  }
  return memory?.stars ?? null;
}

async function fetchGithubStars(): Promise<number | null> {
  try {
    const res = await fetch(GITHUB_API, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "really.bot",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cf: { cacheTtl: 60, cacheEverything: true },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { stargazers_count?: unknown };
    const n = body.stargazers_count;
    return typeof n === "number" && Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  } catch {
    return null;
  }
}

async function readCache(): Promise<StarCache | null> {
  const body = await cacheGetJson<StarCache>(CACHE_KEY);
  if (!body) return null;
  if (typeof body.stars !== "number" || typeof body.fetchedAt !== "number") return null;
  return body;
}

async function writeCache(value: StarCache): Promise<void> {
  await cachePutJson(CACHE_KEY, value, Math.floor(STALE_MS / 1000));
}
