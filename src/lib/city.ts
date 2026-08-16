import { housePath, padHouse } from "./format";

export const HOUSES_PER_STREET = 8;
export const STREETS_PER_BLOCK = 2;
export const BLOCKS_PER_NEIGHBORHOOD = 4;
export const HOUSES_PER_BLOCK = HOUSES_PER_STREET * STREETS_PER_BLOCK;
export const HOUSES_PER_NEIGHBORHOOD = HOUSES_PER_BLOCK * BLOCKS_PER_NEIGHBORHOOD;

export type ClaimedHouse = {
  house_number: number;
  display_name: string;
  username: string | null;
  house_claimed_at: string | null;
  runs_filed: number;
};

export type LotKind = "minted" | "next" | "empty" | "unplatted";
export type RoofKind = "gable" | "hip" | "shed" | "cornice" | "gambrel";

export type HouseLook = {
  variant: number;
  roof: RoofKind;
  chimney: boolean;
  stories: number;
  lit: number;
  founder: boolean;
};

export type LotView = {
  n: number;
  kind: LotKind;
  house: ClaimedHouse | null;
  look: HouseLook;
};

export type StreetView = {
  index: number;
  name: string;
  rangeLabel: string;
  lots: LotView[];
};

export type BlockView = {
  index: number;
  letter: string;
  streets: StreetView[];
};

export type NeighborhoodView = {
  index: number;
  name: string;
  rangeLabel: string;
  platted: boolean;
  blocks: BlockView[];
};

const ROOFS: RoofKind[] = ["gable", "hip", "shed", "cornice", "gambrel"];

const NEIGHBORHOODS = [
  "The First Plate",
  "Revision Heights",
  "Verified Commons",
  "Evidence Park",
  "Steward Hill",
  "Patchwork",
  "Filing Gardens",
  "Brass District",
  "Serial Green",
  "Canonical Row",
  "Promptless",
  "Merge Meadows",
];

const STREETS = [
  "Serial Street",
  "Mint Row",
  "Plate Avenue",
  "Evidence Way",
  "Patch Lane",
  "Filing Court",
  "Steward Place",
  "Brass Boulevard",
  "Badge Drive",
  "Run Alley",
  "Veto Walk",
  "Merge Street",
  "Queue Road",
  "Stamp Terrace",
  "Ledger Lane",
  "Canonical Way",
  "Garage Close",
  "Rivets Road",
  "Night Watch",
  "Proof Passage",
  "Delta Drive",
  "Revision Road",
  "Sidelot Street",
  "Kicker Court",
  "Mono Mile",
  "Tabular Terrace",
  "Open Lot Lane",
  "Next Number",
  "First Verify",
  "Public Record",
  "Living Library",
  "Boardwalk",
];

export function neighborhoodIndexFor(houseNumber: number): number {
  return Math.floor((Math.max(houseNumber, 1) - 1) / HOUSES_PER_NEIGHBORHOOD);
}

export function neighborhoodName(index: number): string {
  if (index < NEIGHBORHOODS.length) return NEIGHBORHOODS[index] ?? `Ward ${padHouse(index + 1)}`;
  return `Ward ${padHouse(index + 1)}`;
}

export function streetName(index: number): string {
  const base = STREETS[index % STREETS.length] ?? `Street ${index + 1}`;
  if (index < STREETS.length) return base;
  const gen = Math.floor(index / STREETS.length) + 1;
  return `${base} ${gen}`;
}

export function houseRangeLabel(start: number, count: number): string {
  const end = start + count - 1;
  return `${padHouse(start)}–${padHouse(end)}`;
}

export function storiesForRuns(runsFiled: number): number {
  if (runsFiled >= 12) return 4;
  if (runsFiled >= 5) return 3;
  if (runsFiled >= 2) return 2;
  return 1;
}

export function houseLook(n: number, runsFiled: number): HouseLook {
  const stories = storiesForRuns(runsFiled);
  const roof = ROOFS[n % ROOFS.length] ?? "gable";
  return {
    variant: n % 5,
    roof,
    chimney: n % 3 !== 1,
    stories,
    lit: Math.min(Math.max(runsFiled, n === 1 ? 1 : 0), stories * 2),
    founder: n === 1,
  };
}

export function lotKind(n: number, claimed: ReadonlyMap<number, ClaimedHouse>, nextHouse: number, platted: boolean): LotKind {
  if (claimed.has(n)) return "minted";
  if (!platted) return "unplatted";
  if (n === nextHouse) return "next";
  return "empty";
}

export function lotHref(lot: LotView): string | null {
  switch (lot.kind) {
    case "minted":
      return housePath(lot.n);
    case "next":
      return "/submit";
    case "empty":
    case "unplatted":
      return null;
    default: {
      const _never: never = lot.kind;
      throw new Error(`Unhandled lot kind: ${_never}`);
    }
  }
}

export function lotMeta(lot: LotView): string {
  switch (lot.kind) {
    case "minted":
      if (!lot.house) return "";
      return lot.house.username ? `@${lot.house.username}` : lot.house.display_name;
    case "next":
      return "Next to mint";
    case "empty":
    case "unplatted":
      return "";
    default: {
      const _never: never = lot.kind;
      throw new Error(`Unhandled lot kind: ${_never}`);
    }
  }
}

function lotsForStreet(
  streetIndex: number,
  claimed: ReadonlyMap<number, ClaimedHouse>,
  nextHouse: number,
  platted: boolean,
): LotView[] {
  const start = streetIndex * HOUSES_PER_STREET + 1;
  return Array.from({ length: HOUSES_PER_STREET }, (_, i) => {
    const n = start + i;
    const house = claimed.get(n) ?? null;
    const kind = lotKind(n, claimed, nextHouse, platted);
    const runs = house?.runs_filed ?? 0;
    return { n, kind, house, look: houseLook(n, runs) };
  });
}

function streetAt(
  streetIndex: number,
  claimed: ReadonlyMap<number, ClaimedHouse>,
  nextHouse: number,
  platted: boolean,
): StreetView {
  const start = streetIndex * HOUSES_PER_STREET + 1;
  return {
    index: streetIndex,
    name: streetName(streetIndex),
    rangeLabel: houseRangeLabel(start, HOUSES_PER_STREET),
    lots: lotsForStreet(streetIndex, claimed, nextHouse, platted),
  };
}

function blockAt(
  blockIndex: number,
  claimed: ReadonlyMap<number, ClaimedHouse>,
  nextHouse: number,
  platted: boolean,
): BlockView {
  const firstStreet = blockIndex * STREETS_PER_BLOCK;
  return {
    index: blockIndex,
    letter: String.fromCharCode(65 + (blockIndex % BLOCKS_PER_NEIGHBORHOOD)),
    streets: Array.from({ length: STREETS_PER_BLOCK }, (_, i) =>
      streetAt(firstStreet + i, claimed, nextHouse, platted),
    ),
  };
}

export function neighborhoodAt(
  index: number,
  claimed: ReadonlyMap<number, ClaimedHouse>,
  nextHouse: number,
  platted: boolean,
): NeighborhoodView {
  const start = index * HOUSES_PER_NEIGHBORHOOD + 1;
  const firstBlock = index * BLOCKS_PER_NEIGHBORHOOD;
  return {
    index,
    name: neighborhoodName(index),
    rangeLabel: houseRangeLabel(start, HOUSES_PER_NEIGHBORHOOD),
    platted,
    blocks: Array.from({ length: BLOCKS_PER_NEIGHBORHOOD }, (_, i) =>
      blockAt(firstBlock + i, claimed, nextHouse, platted),
    ),
  };
}

export function claimedMap(houses: ClaimedHouse[]): Map<number, ClaimedHouse> {
  return new Map(houses.map((h) => [h.house_number, h]));
}

export function plattedNeighborhoods(
  houses: ClaimedHouse[],
  nextHouse: number,
): NeighborhoodView[] {
  const claimed = claimedMap(houses);
  const lastIndex = neighborhoodIndexFor(Math.max(nextHouse, 1));
  return Array.from({ length: lastIndex + 1 }, (_, i) => neighborhoodAt(i, claimed, nextHouse, true));
}
