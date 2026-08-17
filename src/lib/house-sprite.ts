export const SPRITE_W = 48;
export const SPRITE_H = 64;

export type SpriteRect = { x: number; y: number; w: number; h: number; c: string };

type RoofStyle = "gable" | "flat" | "barn" | "point" | "shed" | "hip";
type YardProp = "none" | "pine" | "bush" | "flower" | "lamp";
type ChimneySide = "none" | "left" | "right";
type DoorSide = "left" | "center" | "right";
type Win = { x: number; y: number; w: number; h: number };

export type DecoId =
  | "path"
  | "mailbox"
  | "blooms"
  | "wreath"
  | "window_box"
  | "lantern"
  | "cat"
  | "bird"
  | "pennant"
  | "smoke"
  | "ivy"
  | "picket"
  | "vane"
  | "mat"
  | "star"
  | "awning"
  | "bench"
  | "toadstool"
  | "birdbath"
  | "eave_lights"
  | "crest"
  | "pot"
  | "moss"
  | "antenna";

type PaintCtx = {
  rects: SpriteRect[];
  rand: () => number;
  wall: string;
  wallDark: string;
  wallLite: string;
  roof: string;
  roofDark: string;
  roofLite: string;
  door: string;
  grass: string;
  grassLite: string;
  accent: string;
  occupied: boolean;
  bodyX: number;
  bodyW: number;
  bodyTop: number;
  groundY: number;
  doorX: number;
  doorY: number;
  doorW: number;
  doorH: number;
  chimney: ChimneySide;
  doorSide: DoorSide;
  wins: Win[];
  peakX: number;
  peakY: number;
  chimneyX: number;
  chimneyTop: number;
};

const WALLS = [
  ["#4a5c78", "#2a3548", "#6a7c98"],
  ["#6b4a3a", "#3e2b22", "#8a6450"],
  ["#3d5c4a", "#2a3f34", "#5a7a64"],
  ["#6a445c", "#3e2a38", "#8a5c74"],
  ["#5a5a46", "#323228", "#7a7a62"],
  ["#3a4e66", "#1e2a3a", "#5a6e86"],
  ["#7a5c4a", "#4a3a30", "#9a7a64"],
  ["#4a4a5a", "#282834", "#6a6a7c"],
] as const;

const ROOFS = [
  ["#8b2e24", "#5c1e18", "#b04a3a"],
  ["#c9a44a", "#8a7030", "#e0c06a"],
  ["#3d4a3a", "#2a3328", "#5a6a54"],
  ["#5a4030", "#3c2c20", "#7a5844"],
  ["#2a3344", "#1c2430", "#4a5568"],
  ["#6b3030", "#4a2020", "#8a4848"],
  ["#5c5346", "#3e382f", "#7c7364"],
  ["#4a5568", "#323a48", "#6a7588"],
] as const;

const DOORS = ["#2a1c14", "#3a2a18", "#1a2430", "#4a3020", "#241810"] as const;
const GRASS = [
  ["#243428", "#2e4434"],
  ["#1e2e24", "#28382e"],
  ["#2a3828", "#344832"],
  ["#1a2820", "#24342a"],
] as const;
const TRUNK = "#3a2a18";
const PINE = ["#2d5a3a", "#1e3e28"] as const;
const FLOWER = ["#c9a44a", "#e07a5f", "#7dba9a"] as const;
const WIN_LIT = "#e8d08a";
const WIN_LIT_2 = "#f4e4b0";
const WIN_DARK = "#101820";
const WIN_PANE = "#0c141c";
const OUTLINE = "#0a1018";
const FRAME = "#1a2430";
const BRASS = "#c9a44a";
const CAT = "#c4b49a";
const BIRD = "#3a4558";
const POT = "#8a4a32";

const ROOF_STYLES: RoofStyle[] = ["gable", "flat", "barn", "point", "shed", "hip"];
const YARD_PROPS: YardProp[] = ["none", "none", "pine", "bush", "flower", "lamp"];
const CHIMNEYS: ChimneySide[] = ["none", "left", "right", "right"];
const DOORSIDES: DoorSide[] = ["left", "center", "right"];

const DECO_IDS: readonly DecoId[] = [
  "path",
  "mailbox",
  "blooms",
  "wreath",
  "window_box",
  "lantern",
  "cat",
  "bird",
  "pennant",
  "smoke",
  "ivy",
  "picket",
  "vane",
  "mat",
  "star",
  "awning",
  "bench",
  "toadstool",
  "birdbath",
  "eave_lights",
  "crest",
  "pot",
  "moss",
  "antenna",
] as const;

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
  roofLite: string,
  x: number,
  w: number,
  top: number,
): { bodyTop: number; peakX: number; peakY: number } {
  const peakX = x + Math.floor(w / 2);
  switch (style) {
    case "gable":
      push(rects, x + 8, top, w - 16, 2, roofLite);
      push(rects, x + 6, top + 2, w - 12, 2, roof);
      push(rects, x + 4, top + 4, w - 8, 2, roof);
      push(rects, x + 2, top + 6, w - 4, 2, roof);
      push(rects, x, top + 8, w, 2, roofDark);
      return { bodyTop: top + 10, peakX, peakY: top };
    case "point":
      push(rects, x + 10, top, w - 20, 2, roofLite);
      push(rects, x + 8, top + 2, w - 16, 2, roof);
      push(rects, x + 6, top + 4, w - 12, 2, roof);
      push(rects, x + 4, top + 6, w - 8, 2, roof);
      push(rects, x + 2, top + 8, w - 4, 2, roof);
      push(rects, x, top + 10, w, 2, roofDark);
      return { bodyTop: top + 12, peakX, peakY: top };
    case "hip":
      push(rects, x + 6, top, w - 12, 2, roofLite);
      push(rects, x + 3, top + 2, w - 6, 2, roof);
      push(rects, x, top + 4, w, 3, roof);
      push(rects, x, top + 7, w, 2, roofDark);
      return { bodyTop: top + 9, peakX, peakY: top };
    case "shed":
      push(rects, x, top, 6, 2, roofLite);
      push(rects, x, top + 2, 12, 2, roof);
      push(rects, x, top + 4, 18, 2, roof);
      push(rects, x, top + 6, w, 3, roofDark);
      return { bodyTop: top + 9, peakX: x + 2, peakY: top };
    case "flat":
      push(rects, x - 2, top + 2, w + 4, 2, roofDark);
      push(rects, x, top + 4, w, 4, roof);
      push(rects, x, top + 4, w, 1, roofLite);
      return { bodyTop: top + 8, peakX, peakY: top + 2 };
    case "barn":
      push(rects, x + 6, top, w - 12, 2, roofLite);
      push(rects, x + 3, top + 2, w - 6, 2, roof);
      push(rects, x, top + 4, w, 2, roof);
      push(rects, x, top + 6, w, 2, roofDark);
      return { bodyTop: top + 8, peakX, peakY: top };
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
      push(rects, x + 3, groundY - 14, 2, 2, PINE[0]);
      push(rects, x + 1, groundY - 12, 6, 4, PINE[0]);
      push(rects, x, groundY - 8, 8, 3, PINE[0]);
      push(rects, x, groundY - 5, 8, 2, PINE[1]);
      push(rects, x + 3, groundY - 3, 2, 3, TRUNK);
      return;
    case "bush":
      push(rects, x + 1, groundY - 4, 6, 4, PINE[1]);
      push(rects, x + 2, groundY - 6, 4, 2, PINE[0]);
      return;
    case "flower":
      push(rects, x + 2, groundY - 5, 2, 2, accent);
      push(rects, x + 2, groundY - 3, 2, 3, PINE[1]);
      push(rects, x + 5, groundY - 4, 2, 2, FLOWER[0]);
      push(rects, x + 5, groundY - 2, 2, 2, PINE[1]);
      return;
    case "lamp":
      push(rects, x + 3, groundY - 12, 2, 2, WIN_LIT);
      push(rects, x + 3, groundY - 10, 2, 10, "#3a4558");
      return;
    default: {
      const _never: never = prop;
      throw new Error(`Unhandled yard: ${_never}`);
    }
  }
}

function yardX(ctx: PaintCtx, side: "left" | "right"): number {
  return side === "left" ? 2 : ctx.bodyX + ctx.bodyW + 2;
}

function paintDeco(id: DecoId, ctx: PaintCtx): void {
  const { rects, groundY, bodyX, bodyW, bodyTop, doorX, doorY, doorW, doorH } = ctx;
  switch (id) {
    case "path": {
      const x = doorX + Math.floor(doorW / 2) - 1;
      for (let y = doorY + doorH; y < groundY + 4; y += 3) {
        push(rects, x - 1, y, 2, 2, "#4a5348");
        push(rects, x + 1, y + 1, 2, 2, "#3a4338");
      }
      return;
    }
    case "mailbox": {
      const x = yardX(ctx, ctx.doorSide === "right" ? "left" : "right");
      push(rects, x + 2, groundY - 6, 2, 6, "#3a4558");
      push(rects, x, groundY - 10, 6, 4, "#6a5344");
      push(rects, x + 5, groundY - 9, 2, 2, BRASS);
      return;
    }
    case "blooms": {
      const x = yardX(ctx, "left");
      push(rects, x + 1, groundY - 3, 2, 2, ctx.accent);
      push(rects, x + 4, groundY - 4, 2, 2, FLOWER[2]);
      push(rects, x + 2, groundY - 2, 2, 2, PINE[1]);
      const rx = yardX(ctx, "right");
      push(rects, rx + 2, groundY - 3, 2, 2, FLOWER[1]);
      push(rects, rx + 5, groundY - 4, 2, 2, ctx.accent);
      return;
    }
    case "wreath": {
      const x = doorX + Math.floor(doorW / 2) - 2;
      const y = doorY + 1;
      push(rects, x + 1, y, 3, 1, PINE[0]);
      push(rects, x, y + 1, 1, 3, PINE[0]);
      push(rects, x + 4, y + 1, 1, 3, PINE[0]);
      push(rects, x + 1, y + 4, 3, 1, PINE[0]);
      push(rects, x + 2, y + 2, 1, 1, ctx.accent);
      return;
    }
    case "window_box": {
      const win = ctx.wins[0];
      if (!win) return;
      push(rects, win.x - 1, win.y + win.h, win.w + 2, 2, TRUNK);
      push(rects, win.x, win.y + win.h - 1, 2, 2, ctx.accent);
      push(rects, win.x + win.w - 2, win.y + win.h - 1, 2, 2, FLOWER[2]);
      return;
    }
    case "lantern": {
      const x = ctx.doorSide === "left" ? doorX + doorW + 1 : doorX - 3;
      push(rects, x + 1, doorY - 2, 1, 3, "#3a4558");
      push(rects, x, doorY + 1, 3, 3, ctx.occupied ? WIN_LIT : FRAME);
      push(rects, x + 1, doorY + 2, 1, 1, ctx.occupied ? WIN_LIT_2 : WIN_DARK);
      return;
    }
    case "cat": {
      const x = yardX(ctx, ctx.doorSide === "left" ? "right" : "left");
      push(rects, x + 1, groundY - 4, 5, 3, CAT);
      push(rects, x, groundY - 6, 3, 3, CAT);
      push(rects, x + 1, groundY - 5, 1, 1, OUTLINE);
      push(rects, x + 5, groundY - 5, 1, 3, CAT);
      return;
    }
    case "bird": {
      push(rects, ctx.peakX - 1, ctx.peakY - 3, 3, 2, BIRD);
      push(rects, ctx.peakX + 2, ctx.peakY - 2, 2, 1, BIRD);
      push(rects, ctx.peakX, ctx.peakY - 4, 1, 1, BIRD);
      return;
    }
    case "pennant": {
      const x = bodyX + bodyW - 2;
      push(rects, x, bodyTop - 1, 1, 10, FRAME);
      push(rects, x + 1, bodyTop, 5, 3, ctx.accent);
      push(rects, x + 1, bodyTop + 3, 3, 1, ctx.accent);
      return;
    }
    case "smoke": {
      const x = ctx.chimney === "none" ? ctx.peakX : ctx.chimneyX;
      const y = ctx.chimney === "none" ? ctx.peakY - 2 : ctx.chimneyTop;
      push(rects, x, y - 3, 2, 2, "#6a7788");
      push(rects, x + 2, y - 6, 3, 2, "#7a8798");
      push(rects, x - 1, y - 9, 2, 2, "#8a97a8");
      return;
    }
    case "ivy": {
      const x = ctx.doorSide === "right" ? bodyX : bodyX + bodyW - 2;
      for (let y = bodyTop + 4; y < groundY - 4; y += 4) {
        push(rects, x, y, 2, 3, PINE[1]);
        push(rects, x + (x === bodyX ? 2 : -1), y + 1, 1, 1, PINE[0]);
      }
      return;
    }
    case "picket": {
      for (let x = bodyX - 2; x < bodyX + bodyW + 2; x += 3) {
        push(rects, x, groundY - 5, 1, 5, "#c4b89a");
        push(rects, x, groundY - 6, 1, 1, "#d4c8aa");
      }
      push(rects, bodyX - 2, groundY - 3, bodyW + 4, 1, "#c4b89a");
      return;
    }
    case "vane": {
      push(rects, ctx.peakX, ctx.peakY - 6, 1, 6, FRAME);
      push(rects, ctx.peakX - 3, ctx.peakY - 7, 7, 1, BRASS);
      push(rects, ctx.peakX - 1, ctx.peakY - 9, 3, 2, BRASS);
      return;
    }
    case "mat": {
      push(rects, doorX - 1, doorY + doorH, doorW + 2, 2, "#5c4030");
      push(rects, doorX, doorY + doorH, doorW, 1, "#6b5344");
      return;
    }
    case "star": {
      const win = ctx.wins[ctx.wins.length - 1];
      if (!win || !ctx.occupied) return;
      push(rects, win.x + 2, win.y + 2, 2, 2, BRASS);
      return;
    }
    case "awning": {
      const win = ctx.wins[0];
      if (!win) return;
      push(rects, win.x - 2, win.y - 3, win.w + 4, 3, ctx.accent);
      push(rects, win.x - 2, win.y, win.w + 4, 1, ctx.roofDark);
      return;
    }
    case "bench": {
      const x = yardX(ctx, ctx.doorSide === "left" ? "right" : "left");
      push(rects, x, groundY - 4, 8, 2, TRUNK);
      push(rects, x, groundY - 2, 2, 2, TRUNK);
      push(rects, x + 6, groundY - 2, 2, 2, TRUNK);
      return;
    }
    case "toadstool": {
      const x = yardX(ctx, "left") + 1;
      push(rects, x + 2, groundY - 4, 2, 4, "#e8d8c0");
      push(rects, x, groundY - 6, 6, 3, FLOWER[1]);
      push(rects, x + 1, groundY - 5, 1, 1, "#f4e8e0");
      return;
    }
    case "birdbath": {
      const x = yardX(ctx, "right");
      push(rects, x + 3, groundY - 5, 2, 5, "#6a7788");
      push(rects, x + 1, groundY - 7, 6, 2, "#8a97a8");
      push(rects, x + 2, groundY - 8, 4, 1, "#a0c4d8");
      return;
    }
    case "eave_lights": {
      for (let x = bodyX + 1; x < bodyX + bodyW - 1; x += 3) {
        push(rects, x, bodyTop, 2, 2, ctx.occupied ? WIN_LIT : FRAME);
      }
      return;
    }
    case "crest": {
      const x = doorX + Math.floor(doorW / 2) - 2;
      push(rects, x, doorY - 5, 5, 4, BRASS);
      push(rects, x + 1, doorY - 4, 3, 2, ctx.wallDark);
      return;
    }
    case "pot": {
      const x = ctx.doorSide === "right" ? doorX - 5 : doorX + doorW + 1;
      push(rects, x, groundY - 4, 4, 4, POT);
      push(rects, x + 1, groundY - 6, 2, 2, PINE[0]);
      return;
    }
    case "moss": {
      push(rects, bodyX + 2, bodyTop - 2, 5, 2, PINE[1]);
      push(rects, bodyX + 10, bodyTop - 1, 4, 1, PINE[0]);
      push(rects, bodyX + bodyW - 7, bodyTop - 2, 4, 2, PINE[1]);
      return;
    }
    case "antenna": {
      push(rects, ctx.peakX + 4, ctx.peakY - 8, 1, 10, "#6a7788");
      push(rects, ctx.peakX + 2, ctx.peakY - 8, 5, 1, "#6a7788");
      push(rects, ctx.peakX + 6, ctx.peakY - 6, 2, 1, "#6a7788");
      return;
    }
    default: {
      const _never: never = id;
      throw new Error(`Unhandled deco: ${_never}`);
    }
  }
}

function decoOrder(n: number): DecoId[] {
  const rand = mulberry32((n * 2246822519) ^ 0x9e3779b9);
  const order = DECO_IDS.slice();
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const a = order[i];
    const b = order[j];
    if (a === undefined || b === undefined) continue;
    order[i] = b;
    order[j] = a;
  }
  return order;
}

export function paintHouseSprite(n: number, occupied: boolean, runsFiled: number): SpriteRect[] {
  const rand = mulberry32(n * 2654435761);
  const [wall, wallDark, wallLite] = pick(rand, WALLS);
  const [roof, roofDark, roofLite] = pick(rand, ROOFS);
  const door = pick(rand, DOORS);
  const [grass, grassLite] = pick(rand, GRASS);
  const roofStyle = pick(rand, ROOF_STYLES);
  const chimney = pick(rand, CHIMNEYS);
  const doorSide = pick(rand, DOORSIDES);
  const leftYard = pick(rand, YARD_PROPS);
  const rightYard = pick(rand, YARD_PROPS);
  const tall = rand() > 0.62;
  const litA = rand() > 0.28;
  const litB = rand() > 0.45;
  const shutters = rand() > 0.55;
  const atticLit = rand() > 0.4;
  const accent = pick(rand, FLOWER);
  const bodyX = 12;
  const bodyW = 24;
  const groundY = 58;
  const rects: SpriteRect[] = [];

  push(rects, 2, groundY, 44, 6, grass);
  push(rects, 4, groundY, 40, 2, grassLite);

  const roofTop = tall ? 8 : 14;
  const { bodyTop, peakX, peakY } = paintRoof(
    rects,
    roofStyle,
    roof,
    roofDark,
    roofLite,
    bodyX,
    bodyW,
    roofTop,
  );
  const bodyH = groundY - bodyTop;

  let chimneyX = bodyX + bodyW - 6;
  let chimneyTop = Math.max(0, bodyTop - 8);
  switch (chimney) {
    case "left":
      chimneyX = bodyX + 3;
      chimneyTop = Math.max(0, bodyTop - 8);
      push(rects, chimneyX, chimneyTop, 4, 8, wallDark);
      push(rects, chimneyX, chimneyTop - 2, 4, 2, roofDark);
      push(rects, chimneyX + 1, chimneyTop - 3, 2, 1, wallLite);
      break;
    case "right":
      chimneyX = bodyX + bodyW - 7;
      chimneyTop = Math.max(0, bodyTop - 8);
      push(rects, chimneyX, chimneyTop, 4, 8, wallDark);
      push(rects, chimneyX, chimneyTop - 2, 4, 2, roofDark);
      push(rects, chimneyX + 1, chimneyTop - 3, 2, 1, wallLite);
      break;
    case "none":
      chimneyX = peakX;
      chimneyTop = peakY;
      break;
    default: {
      const _never: never = chimney;
      throw new Error(`Unhandled chimney: ${_never}`);
    }
  }

  push(rects, bodyX, bodyTop, bodyW, bodyH, wall);
  push(rects, bodyX, bodyTop, 1, bodyH, wallLite);
  push(rects, bodyX + bodyW - 1, bodyTop, 1, bodyH, wallDark);
  push(rects, bodyX, bodyTop, bodyW, 2, wallDark);
  push(rects, bodyX, groundY - 1, bodyW, 1, OUTLINE);

  const doorW = 6;
  const doorH = 12;
  const doorY = groundY - doorH;
  let doorX = bodyX + 9;
  switch (doorSide) {
    case "left":
      doorX = bodyX + 2;
      break;
    case "center":
      doorX = bodyX + 9;
      break;
    case "right":
      doorX = bodyX + bodyW - 8;
      break;
    default: {
      const _never: never = doorSide;
      throw new Error(`Unhandled door: ${_never}`);
    }
  }
  push(rects, doorX, doorY, doorW, doorH, door);
  push(rects, doorX, doorY, doorW, 1, wallDark);
  push(rects, doorX + doorW - 2, doorY + 6, 1, 1, BRASS);

  const winY = bodyTop + (tall ? 6 : 4);
  const glass = (lit: boolean) => (occupied && lit ? WIN_LIT : WIN_DARK);
  const pane = (lit: boolean) => (occupied && lit ? WIN_LIT_2 : WIN_PANE);
  const wins: Win[] = [];

  const addWin = (x: number, y: number, lit: boolean) => {
    wins.push({ x, y, w: 6, h: 6 });
    push(rects, x, y, 6, 6, FRAME);
    push(rects, x + 1, y + 1, 4, 4, glass(lit));
    push(rects, x + 1, y + 1, 2, 2, pane(lit));
  };

  switch (doorSide) {
    case "center":
      addWin(bodyX + 2, winY, litA);
      addWin(bodyX + bodyW - 8, winY, litB);
      if (shutters) {
        push(rects, bodyX, winY, 2, 6, wallDark);
        push(rects, bodyX + bodyW - 2, winY, 2, 6, wallDark);
      }
      break;
    case "left":
      addWin(bodyX + 10, winY, litA);
      addWin(bodyX + 18, winY, litB);
      break;
    case "right":
      addWin(bodyX + 2, winY, litA);
      addWin(bodyX + 10, winY, litB);
      break;
    default: {
      const _never: never = doorSide;
      throw new Error(`Unhandled door: ${_never}`);
    }
  }

  if (tall) {
    addWin(bodyX + 9, bodyTop + 2, atticLit);
  }

  paintYard(rects, leftYard, 1, groundY, accent);
  paintYard(rects, rightYard, 37, groundY, accent);

  const ctx: PaintCtx = {
    rects,
    rand,
    wall,
    wallDark,
    wallLite,
    roof,
    roofDark,
    roofLite,
    door,
    grass,
    grassLite,
    accent,
    occupied,
    bodyX,
    bodyW,
    bodyTop,
    groundY,
    doorX,
    doorY,
    doorW,
    doorH,
    chimney,
    doorSide,
    wins,
    peakX,
    peakY,
    chimneyX,
    chimneyTop,
  };

  const unlocked = occupied ? Math.max(0, runsFiled) : 0;
  const order = decoOrder(n);
  for (const id of order.slice(0, Math.min(unlocked, order.length))) {
    paintDeco(id, ctx);
  }

  return rects;
}
