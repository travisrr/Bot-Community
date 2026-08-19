import { getEnv } from "./env";
import { randomToken } from "./crypto";

export const DISCOVERY_SOURCES = [
  { id: "chatgpt", label: "ChatGPT" },
  { id: "claude", label: "Claude" },
  { id: "perplexity", label: "Perplexity" },
  { id: "grok", label: "Grok" },
  { id: "gemini", label: "Gemini" },
  { id: "x", label: "X" },
  { id: "blog", label: "The blog" },
  { id: "other", label: "Somewhere else" },
] as const;

export type DiscoverySource = (typeof DISCOVERY_SOURCES)[number]["id"];

const SOURCE_IDS = new Set<string>(DISCOVERY_SOURCES.map((s) => s.id));

export type DiscoveryRow = {
  id: string;
  user_id: string;
  run_id: string | null;
  source: string | null;
  prompt: string;
  created_at: string;
  display_name: string;
  run_title: string | null;
};

export function parseDiscoverySource(raw: string): DiscoverySource | null {
  const id = raw.trim().toLowerCase();
  if (!SOURCE_IDS.has(id)) return null;
  return id as DiscoverySource;
}

export function discoverySourceLabel(id: string | null): string {
  if (!id) return "Unspecified";
  const hit = DISCOVERY_SOURCES.find((s) => s.id === id);
  return hit?.label ?? id;
}

export async function saveDiscoveryPrompt(input: {
  userId: string;
  runId: string | null;
  source: string;
  prompt: string;
}): Promise<void> {
  const source = parseDiscoverySource(input.source);
  const prompt = input.prompt.trim().slice(0, 4000);
  if (!source && !prompt) return;
  const id = `disc_${randomToken(12)}`;
  const now = new Date().toISOString();
  try {
    await getEnv()
      .DB.prepare(
        `INSERT INTO discovery_prompts (id, user_id, run_id, source, prompt, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, input.userId, input.runId, source, prompt, now)
      .run();
  } catch {
    // Optional side channel. Never block a filing if the table is missing.
  }
}

export async function listDiscoveryPrompts(limit = 100): Promise<DiscoveryRow[]> {
  try {
    const { results } = await getEnv()
      .DB.prepare(
        `SELECT d.id, d.user_id, d.run_id, d.source, d.prompt, d.created_at,
                u.display_name, r.title AS run_title
         FROM discovery_prompts d
         JOIN users u ON u.id = d.user_id
         LEFT JOIN runs r ON r.id = d.run_id
         ORDER BY d.created_at DESC
         LIMIT ?`,
      )
      .bind(limit)
      .all<DiscoveryRow>();
    return results ?? [];
  } catch {
    return [];
  }
}

export async function countDiscoveryPrompts(): Promise<number> {
  try {
    const row = await getEnv()
      .DB.prepare("SELECT COUNT(*) AS n FROM discovery_prompts")
      .first<{ n: number }>();
    return row?.n ?? 0;
  } catch {
    return 0;
  }
}
