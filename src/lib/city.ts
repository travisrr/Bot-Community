import { housePath } from "./format";
import { paintHouseSprite, type SpriteRect } from "./house-sprite";

export type { SpriteRect };
export { DECO_COUNT, SPRITE_H, SPRITE_W } from "./house-sprite";

export type ClaimedHouse = {
  house_number: number;
  display_name: string;
  username: string | null;
  x_handle: string | null;
  x_bio_summary: string | null;
  house_claimed_at: string | null;
  runs_filed: number;
};

export type LotKind = "minted" | "next" | "empty";

export type LotView = {
  n: number;
  kind: LotKind;
  house: ClaimedHouse | null;
  sprite: SpriteRect[];
};

const ROW = 12;
const EMPTY_AHEAD = 100;

export function spriteForLot(n: number, kind: LotKind, runsFiled = 0): SpriteRect[] {
  switch (kind) {
    case "minted":
      return paintHouseSprite(n, true, runsFiled);
    case "next":
    case "empty":
      return paintHouseSprite(n, false, 0);
    default: {
      const _never: never = kind;
      throw new Error(`Unhandled lot kind: ${_never}`);
    }
  }
}

export function lotHref(lot: LotView): string {
  switch (lot.kind) {
    case "minted":
      return housePath(lot.n);
    case "next":
    case "empty":
      return "/submit";
    default: {
      const _never: never = lot.kind;
      throw new Error(`Unhandled lot kind: ${_never}`);
    }
  }
}

export function lotHandle(lot: LotView): string {
  switch (lot.kind) {
    case "minted": {
      if (!lot.house) return "";
      const handle = lot.house.x_handle || lot.house.username;
      return handle ? `@${handle}` : lot.house.display_name;
    }
    case "next":
      return "next";
    case "empty":
      return "rent";
    default: {
      const _never: never = lot.kind;
      throw new Error(`Unhandled lot kind: ${_never}`);
    }
  }
}

export function claimedMap(houses: ClaimedHouse[]): Map<number, ClaimedHouse> {
  return new Map(houses.map((h) => [h.house_number, h]));
}

export function houseGrid(houses: ClaimedHouse[], nextHouse: number): LotView[] {
  const claimed = claimedMap(houses);
  const next = Math.max(nextHouse, 1);
  const last = next + EMPTY_AHEAD - 1;
  const end = Math.ceil(last / ROW) * ROW;
  return Array.from({ length: end }, (_, i) => {
    const n = i + 1;
    const house = claimed.get(n) ?? null;
    const kind: LotKind = house ? "minted" : n === next ? "next" : "empty";
    return { n, kind, house, sprite: spriteForLot(n, kind, house?.runs_filed ?? 0) };
  });
}

export const HOUSE_CARD_WINDOW = 16;

export type HouseCardCellKind = "taken" | "open" | "empty";

export type HouseCardCell = {
  n: number;
  kind: HouseCardCellKind;
};

export function houseCardCells(nextHouse: number, size = HOUSE_CARD_WINDOW): HouseCardCell[] {
  const next = Math.max(1, nextHouse);
  const count = Math.max(1, size);
  const start = Math.max(1, next - (count - 1));
  return Array.from({ length: count }, (_, i) => {
    const n = start + i;
    const kind: HouseCardCellKind = n < next ? "taken" : n === next ? "open" : "empty";
    return { n, kind };
  });
}
