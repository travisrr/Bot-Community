import { initWasm, Resvg } from "@resvg/resvg-wasm";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm?module";
import { getEnv, siteOrigin } from "./env";
import { spriteForLot, SPRITE_H, type SpriteRect } from "./city";
import { formatDate, houseSlug, padHouse, padSerial } from "./format";
import { getHouseSteward, houseStats } from "./houses";
import { escapeHtml } from "./html";
import { parseConnectors } from "./tools";
import { listRunsForHouse } from "./runs";
import { SITE_TAGLINE } from "./site";
import type { RunRow } from "./types";

const WIDTH = 1200;
const HEIGHT = 628;
const SCALE = 7;

let wasmReady: Promise<void> | null = null;
let fontCache: Uint8Array[] | null = null;

async function loadAsset(path: string): Promise<Uint8Array> {
  const env = getEnv() as Env & { ASSETS?: { fetch: typeof fetch } };
  const url = `${siteOrigin()}${path}`;
  const res = env.ASSETS ? await env.ASSETS.fetch(new Request(url)) : await fetch(url);
  if (!res.ok) throw new Error(`Missing ${path} (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

async function ensureRenderer(): Promise<Uint8Array[]> {
  wasmReady ??= initWasm(resvgWasm);
  await wasmReady;
  fontCache ??= await Promise.all([
    loadAsset("/fonts/IBMPlexSans-Regular.ttf"),
    loadAsset("/fonts/IBMPlexSans-Bold.ttf"),
    loadAsset("/fonts/IBMPlexMono-SemiBold.ttf"),
  ]);
  return fontCache;
}

function clip(s: string, n: number): string {
  const t = s.trim();
  if (t.length <= n) return t;
  return `${t.slice(0, Math.max(0, n - 1)).trimEnd()}…`;
}

function spriteSvg(rects: SpriteRect[], ox: number, oy: number): string {
  return rects
    .map(
      (p) =>
        `<rect x="${ox + p.x * SCALE}" y="${oy + p.y * SCALE}" width="${p.w * SCALE}" height="${p.h * SCALE}" fill="${p.c}"/>`,
    )
    .join("");
}

export type HouseStampCard = {
  house: number;
  name: string;
  handle: string | null;
  mintedAt: string | null;
  serial: number;
  title: string;
  connectors: string[];
  publishedAt: string | null;
  sprite: SpriteRect[];
};

export async function houseStampForRun(run: RunRow): Promise<HouseStampCard | null> {
  if (!run.house_number || !run.serial) return null;
  const steward = await getHouseSteward(run.house_number);
  if (!steward) return null;
  const stats = await houseStats(run.house_number);
  const handle = steward.x_handle || steward.username;
  return {
    house: run.house_number,
    name: steward.display_name,
    handle,
    mintedAt: steward.house_claimed_at,
    serial: run.serial,
    title: run.title,
    connectors: parseConnectors(run.connectors),
    publishedAt: run.published_at,
    sprite: spriteForLot(run.house_number, "minted", stats.runs_filed),
  };
}

export async function houseStampForHouse(house: number, serial?: number | null): Promise<HouseStampCard | null> {
  const runs = await listRunsForHouse(house);
  const run = serial ? (runs.find((row) => row.serial === serial) ?? null) : (runs.at(-1) ?? null);
  if (!run) return null;
  return houseStampForRun(run);
}

export function houseStampSvg(card: HouseStampCard): string {
  const house = `HOUSE ${padHouse(card.house)}`;
  const stamp = padSerial(card.serial);
  const name = clip(card.name, 28);
  const handle = card.handle ? `@${card.handle.replace(/^@/, "")}` : "";
  const ofLine = clip(handle ? `The House of ${handle}` : `The House of ${name}`, 32);
  const minted = card.mintedAt ? `Minted ${formatDate(card.mintedAt)}` : "";
  const meta = [handle ? name : "", minted].filter(Boolean).join(" · ");
  const title = clip(card.title, 54);
  const tools = clip(card.connectors.join(", "), 64);
  const when = formatDate(card.publishedAt);
  const detail = [when, tools].filter(Boolean).join(" · ");
  const cta = `See this house → really.bot/${houseSlug(card.house)}`;
  const ctaW = Math.min(710, Math.round(cta.length * 11.2 + 44));
  const spriteX = 56;
  const spriteY = Math.round((HEIGHT - SPRITE_H * SCALE) / 2);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#0a1018"/>
  <g shape-rendering="crispEdges">${spriteSvg(card.sprite, spriteX, spriteY)}</g>
  <g font-family="IBM Plex Sans" fill="#eef2f7">
    <rect x="430" y="100" width="168" height="36" rx="4" fill="none" stroke="#c9a44a" stroke-width="2"/>
    <text x="444" y="124" font-family="IBM Plex Mono" font-size="16" font-weight="600" fill="#eef2f7" letter-spacing="2">${escapeHtml(house)}</text>
    <text x="430" y="186" font-size="36" font-weight="700">${escapeHtml(ofLine)}</text>
    <text x="430" y="222" font-size="20" fill="#9aa8b8">${escapeHtml(meta)}</text>
    <text x="430" y="348" font-family="IBM Plex Mono" font-size="92" font-weight="600" fill="#c9a44a">${escapeHtml(stamp)}</text>
    <text x="430" y="422" font-size="26" font-weight="700">${escapeHtml(title)}</text>
    <text x="430" y="458" font-size="18" fill="#9aa8b8">${escapeHtml(detail)}</text>
  </g>
  <rect x="0" y="548" width="${WIDTH}" height="80" fill="#101820"/>
  <rect x="0" y="548" width="${WIDTH}" height="2" fill="#c9a44a"/>
  <g font-family="IBM Plex Sans">
    <text x="56" y="596" font-size="18" fill="#9aa8b8">${escapeHtml(SITE_TAGLINE)}</text>
    <rect x="430" y="566" width="${ctaW}" height="44" rx="4" fill="#c9a44a"/>
    <text x="452" y="595" font-size="18" font-weight="700" fill="#0a1018">${escapeHtml(cta)}</text>
  </g>
  <rect x="0" y="0" width="8" height="${HEIGHT}" fill="#c9a44a"/>
</svg>`;
}

export async function renderHouseStampPng(card: HouseStampCard): Promise<Uint8Array> {
  const fonts = await ensureRenderer();
  const resvg = new Resvg(houseStampSvg(card), {
    fitTo: { mode: "width", value: WIDTH },
    font: {
      fontBuffers: fonts,
      defaultFontFamily: "IBM Plex Sans",
      sansSerifFamily: "IBM Plex Sans",
      monospaceFamily: "IBM Plex Mono",
    },
    shapeRendering: 1,
    background: "#0a1018",
  });
  return resvg.render().asPng();
}
