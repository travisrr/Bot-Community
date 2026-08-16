import { housePath } from "./format";

export type ClaimedHouse = {
  house_number: number;
  display_name: string;
  username: string | null;
  x_handle: string | null;
  house_claimed_at: string | null;
  runs_filed: number;
};

export type LotKind = "minted" | "next" | "empty";

export type SpriteRect = { x: number; y: number; w: number; h: number; c: string };

export type LotView = {
  n: number;
  kind: LotKind;
  house: ClaimedHouse | null;
  sprite: SpriteRect[];
};

type RoofStyle = "gable" | "flat" | "barn" | "point" | "shed" | "hip";
type YardProp = "none" | "pine" | "bush" | "flower" | "lamp";
type ChimneySide = "none" | "left" | "right";
type DoorSide = "left" | "center" | "right";

const WALLS = [
  ["#3a4a62", "#2a3548"],
  ["#5c4033", "#3e2b22"],
  ["#3d5c4a", "#2a3f34"],
  ["#5a3d52", "#3e2a38"],
  ["#4a4a3a", "#323228"],
  ["#2c3d52", "#1e2a3a"],
  ["#6b5344", "#4a3a30"],
  ["#3a3a48", "#282834"],
] as const;

const ROOFS = [
  ["#8b2e24", "#5c1e18"],
  ["#c9a44a", "#8a7030"],
  ["#3d4a3a", "#2a3328"],
  ["#5a4030", "#3c2c20"],
  ["#2a3344", "#1c2430"],
  ["#6b3030", "#4a2020"],
  ["#5c5346", "#3e382f"],
  ["#4a5568", "#323a48"],
] as const;

const DOORS = ["#2a1c14", "#3a2a18", "#1a2430", "#4a3020", "#241810"] as const;
const GRASS = ["#243428", "#1e2e24", "#2a3828", "#1a2820"] as const;
const TRUNK = "#3a2a18";
const PINE = ["#2d5a3a", "#1e3e28"] as const;
const FLOWER = ["#c9a44a", "#e07a5f", "#7dba9a"] as const;
const WIN_LIT = "#e8d08a";
const WIN_DARK = "#101820";
const OUTLINE = "#0a1018";
const BRASS = "#c9a44a";
const ROW = 12;

const ROOF_STYLES: RoofStyle[] = ["gable", "flat", "barn", "point", "shed", "hip"];
const YARD_PROPS: YardProp[] = ["none", "none", "pine", "bush", "flower", "lamp"];
const CHIMNEYS: ChimneySide[] = ["none", "left", "right", "right"];
const DOORSIDES: DoorSide[] = ["left", "center", "right"];

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, items: readonly T[]): T {
  const item = items[Math.floor(rand() * items.length)];
  if (item === undefined) throw new Error("empty pick");
  return item;
}

function push(rects: SpriteRect[], x: number, y: number, w: number, h: number, c: string) {
  if (w <= 0 || h <= 0) return;
  rects.push({ x, y, w, h, c });
}

function paintRoof(
  rects: SpriteRect[],
  style: RoofStyle,
  roof: string,
  roofDark: string,
  x: number,
  w: number,
  top: number,
): number {
  switch (style) {
    case "gable":
      push(rects, x + 4, top, w - 8, 1, roof);
      push(rects, x + 2, top + 1, w - 4, 1, roof);
      push(rects, x + 1, top + 2, w - 2, 1, roof);
      push(rects, x, top + 3, w, 1, roofDark);
      return top + 4;
    case "point":
      push(rects, x + 4, top, w - 8, 1, roof);
      push(rects, x + 3, top + 1, w - 6, 1, roof);
      push(rects, x + 2, top + 2, w - 4, 1, roof);
      push(rects, x + 1, top + 3, w - 2, 1, roof);
      push(rects, x, top + 4, w, 1, roofDark);
      return top + 5;
    case "hip":
      push(rects, x + 2, top, w - 4, 1, roof);
      push(rects, x + 1, top + 1, w - 2, 1, roof);
      push(rects, x, top + 2, w, 2, roofDark);
      return top + 4;
    case "shed":
      push(rects, x, top, 3, 1, roof);
      push(rects, x, top + 1, 6, 1, roof);
      push(rects, x, top + 2, 9, 1, roof);
      push(rects, x, top + 3, w, 1, roofDark);
      return top + 4;
    case "flat":
      push(rects, x - 1, top + 1, w + 2, 1, roofDark);
      push(rects, x, top + 2, w, 2, roof);
      return top + 4;
    case "barn":
      push(rects, x + 2, top, w - 4, 1, roof);
      push(rects, x + 1, top + 1, w - 2, 1, roof);
      push(rects, x, top + 2, w, 1, roof);
      push(rects, x, top + 3, w, 1, roofDark);
      return top + 4;
    default: {
      const _never: never = style;
      throw new Error(`Unhandled roof: ${_never}`);
    }
  }
}

function paintYard(rects: SpriteRect[], prop: YardProp, x: number, groundY: number, accent: string) {
  switch (prop) {
    case "none":
      return;
    case "pine":
      push(rects, x + 1, groundY - 6, 1, 1, PINE[0]);
      push(rects, x, groundY - 5, 3, 2, PINE[0]);
      push(rects, x, groundY - 3, 3, 1, PINE[1]);
      push(rects, x + 1, groundY - 2, 1, 2, TRUNK);
      return;
    case "bush":
      push(rects, x, groundY - 2, 3, 2, PINE[1]);
      push(rects, x + 1, groundY - 3, 1, 1, PINE[0]);
      return;
    case "flower":
      push(rects, x + 1, groundY - 3, 1, 1, accent);
      push(rects, x + 1, groundY - 2, 1, 2, PINE[1]);
      return;
    case "lamp":
      push(rects, x + 1, groundY - 6, 1, 1, WIN_LIT);
      push(rects, x + 1, groundY - 5, 1, 5, "#3a4558");
      return;
    default: {
      const _never: never = prop;
      throw new Error(`Unhandled yard: ${_never}`);
    }
  }
}

function spriteMinted(n: number): SpriteRect[] {
  const rand = mulberry32(n * 2654435761);
  const [wall, wallDark] = pick(rand, WALLS);
  const [roof, roofDark] = pick(rand, ROOFS);
  const door = pick(rand, DOORS);
  const grass = pick(rand, GRASS);
  const roofStyle = pick(rand, ROOF_STYLES);
  const chimney = pick(rand, CHIMNEYS);
  const doorSide = pick(rand, DOORSIDES);
  const leftYard = pick(rand, YARD_PROPS);
  const rightYard = pick(rand, YARD_PROPS);
  const tall = rand() > 0.62;
  const litA = rand() > 0.28;
  const litB = rand() > 0.45;
  const shutters = rand() > 0.55;
  const bodyX = 3;
  const bodyW = 10;
  const groundY = 18;
  const rects: SpriteRect[] = [];

  push(rects, 1, groundY, 14, 2, grass);

  const bodyTop = paintRoof(rects, roofStyle, roof, roofDark, bodyX, bodyW, tall ? 1 : 2);
  const bodyH = groundY - 1 - bodyTop;

  switch (chimney) {
    case "left":
      push(rects, bodyX + 1, Math.max(0, bodyTop - 4), 2, 4, wallDark);
      push(rects, bodyX + 1, Math.max(0, bodyTop - 5), 2, 1, roofDark);
      break;
    case "right":
      push(rects, bodyX + bodyW - 3, Math.max(0, bodyTop - 4), 2, 4, wallDark);
      push(rects, bodyX + bodyW - 3, Math.max(0, bodyTop - 5), 2, 1, roofDark);
      break;
    case "none":
      break;
    default: {
      const _never: never = chimney;
      throw new Error(`Unhandled chimney: ${_never}`);
    }
  }

  push(rects, bodyX, bodyTop, bodyW, bodyH, wall);
  push(rects, bodyX, bodyTop, bodyW, 1, wallDark);
  push(rects, bodyX, groundY - 1, bodyW, 1, OUTLINE);

  const doorW = 2;
  const doorH = 3;
  const doorY = groundY - 1 - doorH;
  let doorX = bodyX + 4;
  switch (doorSide) {
    case "left":
      doorX = bodyX + 1;
      break;
    case "center":
      doorX = bodyX + 4;
      break;
    case "right":
      doorX = bodyX + bodyW - 3;
      break;
    default: {
      const _never: never = doorSide;
      throw new Error(`Unhandled door: ${_never}`);
    }
  }
  push(rects, doorX, doorY, doorW, doorH, door);

  const winY = bodyTop + (tall ? 2 : 1);
  const winC = (lit: boolean) => (lit ? WIN_LIT : WIN_DARK);
  switch (doorSide) {
    case "center":
      push(rects, bodyX + 1, winY, 2, 2, winC(litA));
      push(rects, bodyX + 7, winY, 2, 2, winC(litB));
      if (shutters) {
        push(rects, bodyX, winY, 1, 2, wallDark);
        push(rects, bodyX + 9, winY, 1, 2, wallDark);
      }
      break;
    case "left":
      push(rects, bodyX + 5, winY, 2, 2, winC(litA));
      push(rects, bodyX + 8, winY, 1, 2, winC(litB));
      break;
    case "right":
      push(rects, bodyX + 1, winY, 2, 2, winC(litA));
      push(rects, bodyX + 4, winY, 2, 2, winC(litB));
      break;
    default: {
      const _never: never = doorSide;
      throw new Error(`Unhandled door: ${_never}`);
    }
  }

  if (tall) {
    push(rects, bodyX + 4, bodyTop + 1, 2, 1, winC(rand() > 0.4));
  }

  const bloom = pick(rand, FLOWER);
  paintYard(rects, leftYard, 0, groundY, bloom);
  paintYard(rects, rightYard, 13, groundY, bloom);
  return rects;
}

function spriteVacant(kind: "next" | "empty"): SpriteRect[] {
  const rects: SpriteRect[] = [];
  const grass = kind === "next" ? "#243428" : "#1a2430";
  const mark = kind === "next" ? BRASS : "#2a3648";
  push(rects, 1, 18, 14, 2, grass);
  push(rects, 4, 10, 8, 1, mark);
  push(rects, 4, 10, 1, 8, mark);
  push(rects, 11, 10, 1, 8, mark);
  push(rects, 4, 17, 8, 1, mark);
  if (kind === "next") {
    push(rects, 7, 13, 2, 3, BRASS);
  }
  return rects;
}

export function spriteForLot(n: number, kind: LotKind): SpriteRect[] {
  switch (kind) {
    case "minted":
      return spriteMinted(n);
    case "next":
      return spriteVacant("next");
    case "empty":
      return spriteVacant("empty");
    default: {
      const _never: never = kind;
      throw new Error(`Unhandled lot kind: ${_never}`);
    }
  }
}

export function lotHref(lot: LotView): string | null {
  switch (lot.kind) {
    case "minted":
      return housePath(lot.n);
    case "next":
      return "/submit";
    case "empty":
      return null;
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
      return "";
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
  const last = Math.max(nextHouse, 1);
  const end = Math.max(ROW, Math.ceil(last / ROW) * ROW);
  return Array.from({ length: end }, (_, i) => {
    const n = i + 1;
    const house = claimed.get(n) ?? null;
    const kind: LotKind = house ? "minted" : n === nextHouse ? "next" : "empty";
    return { n, kind, house, sprite: spriteForLot(n, kind) };
  });
}
