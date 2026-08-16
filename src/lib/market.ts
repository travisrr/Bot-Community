import { getEnv } from "./env";
import { firstSentence } from "./jsonld";
import { housePath, padHouse, padSerial } from "./format";
import { parseJsonArray } from "./html";
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
  rev: number;
  cat: Exclude<CatId, "all">;
  catLabel: string;
  house: string;
  delta: number;
  forks: number;
  patches: number;
  mins: number | null;
  age: number;
  title: string;
  desc: string;
  tools: string[];
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
  nextHouse: string;
};

export type MarketPage = {
  runs: MarketRun[];
  cats: MarketCat[];
  feed: FeedItem[];
  stats: {
    verified: number;
    forks: number;
    patches: number;
    nextHouse: string;
  };
  mintedCount: number;
  nextHouse: number;
  usingSeed: boolean;
  /** Things not backed by a real table or endpoint. */
  stubs: string[];
};

export const INITIAL_SHOWN = 8;

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

/** Fallback marketplace rows so the homepage never renders empty. */
export const SEED_RUNS: MarketRun[] = [
  {
    serial: "00047",
    rev: 8,
    cat: "work",
    catLabel: "Work & ops",
    house: "IN",
    delta: 42,
    forks: 186,
    patches: 8,
    mins: 12,
    age: 5,
    title: "Turn a messy inbox into a prioritized Monday action plan",
    desc: "Connects Gmail + Calendar, finds commitments, then drafts a realistic week with evidence links.",
    tools: ["Gmail", "Calendar"],
  },
  {
    serial: "00012",
    rev: 4,
    cat: "sales",
    catLabel: "Sales",
    house: "CO",
    delta: 31,
    forks: 143,
    patches: 4,
    mins: 8,
    age: 12,
    title: "Research a company before the first sales call",
    desc: "Builds a sourced brief from the website, LinkedIn, recent news and public filings.",
    tools: ["Browser", "LinkedIn"],
  },
  {
    serial: "00001",
    rev: 6,
    cat: "legal",
    catLabel: "Legal",
    house: "GA",
    delta: 28,
    forks: 121,
    patches: 6,
    mins: 18,
    age: 1,
    title: "Plead down a GA speeding ticket from a TN license",
    desc: "Reads the citations, checks points exposure and builds a court-ready call sheet. No guaranteed outcomes.",
    tools: ["Browser", "PDF"],
  },
  {
    serial: "00083",
    rev: 3,
    cat: "money",
    catLabel: "Money",
    house: "$",
    delta: 19,
    forks: 97,
    patches: 3,
    mins: 14,
    age: 9,
    title: "Cancel subscriptions hiding across three cards",
    desc: "Finds recurring charges, identifies cancellation paths and queues approvals before acting.",
    tools: ["Email", "Browser"],
  },
  {
    serial: "00104",
    rev: 2,
    cat: "coding",
    catLabel: "Coding",
    house: "{}",
    delta: 17,
    forks: 84,
    patches: 2,
    mins: 9,
    age: 3,
    title: "Reproduce a customer bug from a support thread",
    desc: "Turns a vague report into reproducible steps, expected behavior and a clean Linear issue.",
    tools: ["Gmail", "Linear"],
  },
  {
    serial: "00068",
    rev: 5,
    cat: "personal",
    catLabel: "Personal admin",
    house: "PH",
    delta: 13,
    forks: 76,
    patches: 5,
    mins: 16,
    age: 7,
    title: "Compare insurance estimates from damage photos",
    desc: "Extracts line items, flags gaps and creates a documented question list for the adjuster.",
    tools: ["Photos", "PDF"],
  },
  {
    serial: "00119",
    rev: 1,
    cat: "research",
    catLabel: "Research",
    house: "RS",
    delta: 11,
    forks: 64,
    patches: 1,
    mins: 22,
    age: 2,
    title: "Build a sourced competitor teardown from public signals",
    desc: "Pulls pricing pages, changelogs and job posts into a dated brief with every claim linked.",
    tools: ["Browser", "Sheets"],
  },
  {
    serial: "00092",
    rev: 3,
    cat: "work",
    catLabel: "Work & ops",
    house: "OP",
    delta: 9,
    forks: 58,
    patches: 3,
    mins: 11,
    age: 14,
    title: "Turn a shift schedule into a coverage-gap report",
    desc: "Reads the posted schedule, checks it against forecasted covers and flags the holes before Friday.",
    tools: ["Sheets", "Calendar"],
  },
  {
    serial: "00033",
    rev: 7,
    cat: "sales",
    catLabel: "Sales",
    house: "PP",
    delta: 8,
    forks: 51,
    patches: 7,
    mins: 6,
    age: 21,
    title: "Draft follow-ups for a stalled pipeline without sounding like a bot",
    desc: "Reads the thread history, scores intent and writes three send-ready options per account.",
    tools: ["Gmail", "CRM"],
  },
  {
    serial: "00127",
    rev: 2,
    cat: "personal",
    catLabel: "Personal admin",
    house: "DM",
    delta: 6,
    forks: 43,
    patches: 2,
    mins: 13,
    age: 4,
    title: "Dispute a wrong medical bill with the itemized codes",
    desc: "Matches CPT codes to the EOB, flags duplicates and drafts the appeal letter with citations.",
    tools: ["PDF", "Email"],
  },
  {
    serial: "00058",
    rev: 4,
    cat: "coding",
    catLabel: "Coding",
    house: "CI",
    delta: 5,
    forks: 38,
    patches: 4,
    mins: 19,
    age: 16,
    title: "Triage a red CI build down to the one failing commit",
    desc: "Reads the logs, bisects the range and posts a summary with the suspect diff attached.",
    tools: ["GitHub", "Browser"],
  },
  {
    serial: "00071",
    rev: 1,
    cat: "money",
    catLabel: "Money",
    house: "TX",
    delta: 4,
    forks: 29,
    patches: 1,
    mins: 25,
    age: 6,
    title: "Sort a year of business receipts into deductible categories",
    desc: "Reads receipt images, categorizes by schedule line and flags anything that needs a human call.",
    tools: ["Photos", "Sheets"],
  },
];

export const SEED_CATS: MarketCat[] = [
  { id: "all", glyph: "⌘", name: "All runs", n: 248 },
  { id: "work", glyph: "▦", name: "Work & ops", n: 64 },
  { id: "research", glyph: "⌕", name: "Research", n: 43 },
  { id: "sales", glyph: "↗", name: "Sales", n: 38 },
  { id: "personal", glyph: "✓", name: "Personal admin", n: 31 },
  { id: "coding", glyph: "</>", name: "Coding", n: 29 },
  { id: "money", glyph: "$", name: "Money", n: 24 },
  { id: "legal", glyph: "§", name: "Legal", n: 19 },
];

export const SEED_FEED: FeedItem[] = [
  { i: "✓", b: "House 012 forked 00047.r8", s: "Gmail → Outlook adaptation", t: "2m", href: "/00047" },
  { i: "↗", b: "Patch merged on 00012", s: "Added SEC filing check", t: "11m", href: "/00012" },
  { i: "⌂", b: "House 013 minted", s: "First Run verified", t: "38m", href: "/houses" },
  { i: "＋", b: "New Run 00118", s: "Voice notes into a client brief", t: "1h" },
  { i: "↗", b: "Patch merged on 00083", s: "Amex cancellation path added", t: "2h", href: "/00083" },
];

const PLACEHOLDER_FORKS = 1842;
const PLACEHOLDER_VERIFIED = 248;
const PLACEHOLDER_PATCHES = 63;

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

  const text = `${run.title} ${run.job_text} ${run.what_happened} ${parseJsonArray(run.connectors).join(" ")}`.toLowerCase();
  if (/\b(ticket|court|lawyer|citation|plead|probate|legal)\b/.test(text)) return "legal";
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

export function runToMarket(run: RunRow, patchCount = 0): MarketRun | null {
  if (run.serial == null || run.status !== "published") return null;
  const cat = inferCategory(run);
  const tools = parseJsonArray(run.connectors);
  return {
    serial: padSerial(run.serial),
    rev: run.revision,
    cat,
    catLabel: CAT_LABEL[cat],
    house: houseChip(run.house_number),
    delta: 0,
    forks: 0,
    patches: patchCount,
    mins: null,
    age: ageDays(run.published_at),
    title: run.title,
    desc: firstSentence(run.job_text || run.what_happened),
    tools,
  };
}

function catsFromRuns(runs: MarketRun[]): MarketCat[] {
  return MARKET_CAT_DEFS.map((def) => ({
    ...def,
    n: def.id === "all" ? runs.length : runs.filter((run) => run.cat === def.id).length,
  }));
}

type RawEvent = { at: string; item: FeedItem };

async function realFeed(runs: RunRow[]): Promise<FeedItem[]> {
  const events: RawEvent[] = [];
  const { results: logs } = await getEnv()
    .DB.prepare(
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

  for (const row of logs ?? []) {
    const serial = padSerial(row.run_serial);
    const href = `/${serial}`;
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

  const houses = await listClaimedHouses();
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

export async function loadMarket(): Promise<MarketPage> {
  const stubs: string[] = [];
  try {
    const [published, verified, mergedPatches, patchCounts, claimed, next] = await Promise.all([
      listPublishedRuns(500),
      countPublished(),
      countMergedPatches(),
      mergedPatchCountsBySerial(),
      listClaimedHouses(),
      nextHouse(),
    ]);

    const usingSeed = published.length === 0;
    const runs = usingSeed
      ? SEED_RUNS
      : published
          .map((run) => runToMarket(run, run.serial != null ? (patchCounts.get(run.serial) ?? 0) : 0))
          .filter((row): row is MarketRun => row != null);

    if (usingSeed) {
      stubs.push("Run list is seed data; no published Runs in the database yet.");
    } else {
      stubs.push("Trending delta, fork counts, and time-to-complete are placeholders; those fields are not stored yet.");
    }

    stubs.push("Fork total is a placeholder; the database does not track forks yet.");

    const cats = usingSeed ? SEED_CATS : catsFromRuns(runs);
    let feed: FeedItem[] = SEED_FEED;
    if (usingSeed) {
      stubs.push("Activity feed is placeholder copy until Runs, patches, and Houses exist.");
    } else {
      try {
        const live = await realFeed(published);
        if (live.length) feed = live;
        else stubs.push("Activity feed fell back to seed items; changelog/house events were empty.");
      } catch {
        stubs.push("Activity feed fell back to seed items because the live query failed.");
      }
    }

    stubs.push("Monday Five subscriber count and email capture are not wired to a list yet.");
    stubs.push("House claim form is a waitlist toast; Houses mint on first verified Run, not by email.");

    const nextLabel = padHouse(next);
    return {
      runs,
      cats,
      feed,
      stats: {
        verified: usingSeed ? PLACEHOLDER_VERIFIED : verified,
        forks: PLACEHOLDER_FORKS,
        patches: usingSeed ? PLACEHOLDER_PATCHES : mergedPatches,
        nextHouse: nextLabel,
      },
      mintedCount: claimed.length,
      nextHouse: next,
      usingSeed,
      stubs,
    };
  } catch {
    stubs.push("Marketplace data fell back to seed because live queries failed.");
    return {
      runs: SEED_RUNS,
      cats: SEED_CATS,
      feed: SEED_FEED,
      stats: {
        verified: PLACEHOLDER_VERIFIED,
        forks: PLACEHOLDER_FORKS,
        patches: PLACEHOLDER_PATCHES,
        nextHouse: "014",
      },
      mintedCount: 13,
      nextHouse: 14,
      usingSeed: true,
      stubs,
    };
  }
}

export function sortMarketRuns(runs: MarketRun[], sort: "trending" | "forks" | "newest"): MarketRun[] {
  const copy = [...runs];
  switch (sort) {
    case "trending":
      return copy.sort((a, b) => b.delta - a.delta || b.forks - a.forks || a.age - b.age);
    case "forks":
      return copy.sort((a, b) => b.forks - a.forks || b.delta - a.delta);
    case "newest":
      return copy.sort((a, b) => a.age - b.age || b.delta - a.delta);
    default: {
      const _never: never = sort;
      return _never;
    }
  }
}
