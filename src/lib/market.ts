import { cacheGetJson, cachePutJson, cacheRequest } from "./edge-cache";
import { getReadDb, type QueryDb } from "./env";
import { houseLabel, housePath, padHouse, padSerial, runPath } from "./format";
import { parseConnectors } from "./tools";
import { listClaimedHouses, nextHouse } from "./houses";
import { countMergedPatches, mergedPatchCountsBySerial } from "./patches";
import { countPublished, listPublishedRuns } from "./runs";
import type { RunRow, SensitiveKind } from "./types";

export type CatId = "all" | "work" | "research" | "sales" | "personal" | "coding" | "money" | "legal";

export type MarketCat = {
  id: CatId;
  glyph: string;
  name: string;
  n: number;
};

export type MarketRun = {
  serial: string;
  href: string;
  rev: number;
  cat: Exclude<CatId, "all">;
  catLabel: string;
  house: string;
  patches: number;
  age: number;
  title: string;
  desc: string;
  tools: string[];
  source: string;
  sourceHref: string | null;
};

type SourceSteward = {
  display_name: string;
  username: string | null;
  x_handle: string | null;
};

export type FeedItem = {
  i: string;
  b: string;
  s: string;
  t: string;
  href?: string;
};

export type MarketPayload = {
  runs: MarketRun[];
  cats: MarketCat[];
};

export type MarketPage = {
  runs: MarketRun[];
  cats: MarketCat[];
  feed: FeedItem[];
  stats: {
    verified: number;
    patches: number;
    nextHouse: string;
  };
  mintedCount: number;
  nextHouse: number;
};

export const INITIAL_SHOWN = 8;
const CARD_PROMPT_CHARS = 800;

function cardPrompt(text: string): string {
  const t = text.replace(/\r\n/g, "\n").trim();
  if (t.length <= CARD_PROMPT_CHARS) return t;
  return t.slice(0, CARD_PROMPT_CHARS).trimEnd();
}

export const MARKET_CAT_DEFS: Omit<MarketCat, "n">[] = [
  { id: "all", glyph: "⌘", name: "All runs" },
  { id: "work", glyph: "▦", name: "Work & ops" },
  { id: "research", glyph: "⌕", name: "Research" },
  { id: "sales", glyph: "↗", name: "Sales" },
  { id: "personal", glyph: "✓", name: "Personal admin" },
  { id: "coding", glyph: "</>", name: "Coding" },
  { id: "money", glyph: "$", name: "Money" },
  { id: "legal", glyph: "§", name: "Legal" },
];

const CAT_LABEL: Record<Exclude<CatId, "all">, string> = {
  work: "Work & ops",
  research: "Research",
  sales: "Sales",
  personal: "Personal admin",
  coding: "Coding",
  money: "Money",
  legal: "Legal",
};

function catFromSensitive(kind: SensitiveKind): Exclude<CatId, "all"> | null {
  switch (kind) {
    case "legal":
      return "legal";
    case "medical":
      return "personal";
    case "financial":
      return "money";
    case null:
      return null;
    default: {
      const _never: never = kind;
      return _never;
    }
  }
}

export function inferCategory(run: RunRow): Exclude<CatId, "all"> {
  const fromKind = catFromSensitive(run.sensitive_kind);
  if (fromKind) return fromKind;

  const text = `${run.title} ${run.job_text} ${run.what_happened} ${parseConnectors(run.connectors).join(" ")}`.toLowerCase();
  if (/\b(ticket|court|lawyer|attorney|representation|citation|plead|probate|legal)\b/.test(text)) return "legal";
  if (/\b(sales|crm|pipeline|outbound|linkedin)\b/.test(text)) return "sales";
  if (/\b(bug|github|linear|commit|reproduc|ci build|failing commit)\b/.test(text)) return "coding";
  if (/\b(research|competitor|sourced|teardown|filings)\b/.test(text)) return "research";
  if (/\b(subscription|receipt|invoice|tax|deductible)\b/.test(text)) return "money";
  if (/\b(insurance|medical bill|dispute|personal)\b/.test(text)) return "personal";
  if (/\b(inbox|gmail|calendar|schedule|shift|ops)\b/.test(text)) return "work";
  return "work";
}

function ageDays(iso: string | null | undefined): number {
  if (!iso) return 999;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return 999;
  return Math.max(0, Math.round(ms / 86_400_000));
}

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "";
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function houseChip(house: number | null): string {
  if (!house) return "—";
  return padHouse(house);
}

function sourceLabel(steward: SourceSteward | undefined, house: number | null): string {
  if (steward) {
    const handle = steward.x_handle || steward.username;
    if (handle) return `@${handle}`;
    if (steward.display_name) return steward.display_name;
  }
  if (house) return houseLabel(house);
  return "—";
}

export function runToMarket(
  run: RunRow,
  patchCount = 0,
  steward?: SourceSteward | null,
): MarketRun | null {
  if (run.serial == null || run.status !== "published") return null;
  const cat = inferCategory(run);
  const tools = parseConnectors(run.connectors);
  return {
    serial: padSerial(run.serial),
    href: run.house_number ? runPath(run.house_number, run.serial) : `/${padSerial(run.serial)}`,
    rev: run.revision,
    cat,
    catLabel: CAT_LABEL[cat],
    house: houseChip(run.house_number),
    patches: patchCount,
    age: ageDays(run.published_at),
    title: run.title,
    desc: cardPrompt(run.prompt_text || run.job_text || run.what_happened),
    tools,
    source: sourceLabel(steward ?? undefined, run.house_number),
    sourceHref: run.house_number ? housePath(run.house_number) : null,
  };
}

function catsFromRuns(runs: MarketRun[]): MarketCat[] {
  return MARKET_CAT_DEFS.map((def) => ({
    ...def,
    n: def.id === "all" ? runs.length : runs.filter((run) => run.cat === def.id).length,
  }));
}

type RawEvent = { at: string; item: FeedItem };

type ClaimedHouse = Awaited<ReturnType<typeof listClaimedHouses>>[number];

async function realFeed(runs: RunRow[], houses: ClaimedHouse[], db: QueryDb): Promise<FeedItem[]> {
  const events: RawEvent[] = [];
  const { results: logs } = await db
    .prepare(
      `SELECT revision, one_liner, created_at, run_serial, patch_id
       FROM changelog_entries
       ORDER BY created_at DESC
       LIMIT 12`,
    )
    .all<{
      revision: number;
      one_liner: string;
      created_at: string;
      run_serial: number;
      patch_id: string | null;
    }>();

  const titles = new Map(runs.filter((r) => r.serial != null).map((r) => [r.serial as number, r.title]));
  const houseBySerial = new Map(
    runs
      .filter((r) => r.serial != null && r.house_number != null)
      .map((r) => [r.serial as number, r.house_number as number]),
  );

  for (const row of logs ?? []) {
    const serial = padSerial(row.run_serial);
    const house = houseBySerial.get(row.run_serial);
    const href = house ? runPath(house, row.run_serial) : `/${serial}`;
    if (row.patch_id) {
      events.push({
        at: row.created_at,
        item: {
          i: "↗",
          b: `Patch merged on ${serial}`,
          s: row.one_liner,
          t: relTime(row.created_at),
          href,
        },
      });
      continue;
    }
    events.push({
      at: row.created_at,
      item: {
        i: "＋",
        b: `New Run ${serial}`,
        s: titles.get(row.run_serial) || row.one_liner,
        t: relTime(row.created_at),
        href,
      },
    });
  }

  for (const house of houses) {
    if (!house.house_claimed_at) continue;
    events.push({
      at: house.house_claimed_at,
      item: {
        i: "⌂",
        b: `House ${padHouse(house.house_number)} minted`,
        s: house.display_name ? `${house.display_name} · First Run verified` : "First Run verified",
        t: relTime(house.house_claimed_at),
        href: housePath(house.house_number),
      },
    });
  }

  events.sort((a, b) => (a.at < b.at ? 1 : -1));
  const seen = new Set<string>();
  const out: FeedItem[] = [];
  for (const event of events) {
    const key = `${event.item.i}:${event.item.b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(event.item);
    if (out.length >= 5) break;
  }
  return out;
}

const MARKET_CACHE_KEY = cacheRequest("/__cache/market-v2");
const MARKET_FRESH_MS = 30_000;
const MARKET_STALE_MS = 5 * 60 * 1000;

type MarketCache = { page: MarketPage; fetchedAt: number };

let memory: MarketCache | null = null;
let inflight: Promise<MarketPage> | null = null;

function emptyMarket(): MarketPage {
  return {
    runs: [],
    cats: catsFromRuns([]),
    feed: [],
    stats: { verified: 0, patches: 0, nextHouse: padHouse(1) },
    mintedCount: 0,
    nextHouse: 1,
  };
}

export async function loadMarket(): Promise<MarketPage> {
  const now = Date.now();
  if (memory && now - memory.fetchedAt < MARKET_FRESH_MS) return memory.page;
  if (!inflight) {
    inflight = loadMarketFresh().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function loadMarketFresh(): Promise<MarketPage> {
  const cached = (await cacheGetJson<MarketCache>(MARKET_CACHE_KEY)) ?? memory;
  if (cached && Date.now() - cached.fetchedAt < MARKET_FRESH_MS) {
    memory = cached;
    return cached.page;
  }

  try {
    const db = getReadDb();
    const [published, verified, mergedPatches, patchCounts, claimed, next] = await Promise.all([
      listPublishedRuns(500, db),
      countPublished(db),
      countMergedPatches(db),
      mergedPatchCountsBySerial(db),
      listClaimedHouses(db),
      nextHouse(db),
    ]);

    const stewardByHouse = new Map(claimed.map((house) => [house.house_number, house]));
    const runs = published
      .map((run) =>
        runToMarket(
          run,
          run.serial != null ? (patchCounts.get(run.serial) ?? 0) : 0,
          run.house_number != null ? stewardByHouse.get(run.house_number) : undefined,
        ),
      )
      .filter((row): row is MarketRun => row != null);

    let feed: FeedItem[] = [];
    try {
      feed = await realFeed(published, claimed, db);
    } catch {
      feed = [];
    }

    const page: MarketPage = {
      runs,
      cats: catsFromRuns(runs),
      feed,
      stats: {
        verified,
        patches: mergedPatches,
        nextHouse: padHouse(next),
      },
      mintedCount: claimed.length,
      nextHouse: next,
    };
    memory = { page, fetchedAt: Date.now() };
    await cachePutJson(MARKET_CACHE_KEY, memory, Math.floor(MARKET_STALE_MS / 1000));
    return page;
  } catch {
    if (cached && Date.now() - cached.fetchedAt < MARKET_STALE_MS) {
      memory = cached;
      return cached.page;
    }
    return memory?.page ?? emptyMarket();
  }
}

export type SortKey = "az" | "newest" | "patches";

export const MARKET_SORT_DEFS: { id: SortKey; label: string }[] = [
  { id: "az", label: "A–Z" },
  { id: "newest", label: "Newest" },
  { id: "patches", label: "Most patched" },
];

export function sortMarketRuns(runs: MarketRun[], sort: SortKey): MarketRun[] {
  const copy = [...runs];
  switch (sort) {
    case "az":
      return copy.sort((a, b) => a.title.localeCompare(b.title, "en", { sensitivity: "base" }) || a.age - b.age);
    case "newest":
      return copy.sort((a, b) => a.age - b.age || b.patches - a.patches);
    case "patches":
      return copy.sort((a, b) => b.patches - a.patches || a.age - b.age);
    default: {
      const _never: never = sort;
      return _never;
    }
  }
}
