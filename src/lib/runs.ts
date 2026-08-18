import { getEnv, type QueryDb } from "./env";
import { filingPath, isoNow, publishedRunPath, runId, runIdWithRev } from "./format";
import { randomToken } from "./crypto";
import { parseConnectors, dedupeConnectors } from "./tools";
import type { EvidenceItem, PublicUser, RunRow, RunStatus, SensitiveKind, Steward, WouldRunAgain } from "./types";
import { canonical } from "./site";
import { isStaff } from "./auth";

export function parseEvidence(raw: string | null | undefined): EvidenceItem[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v as EvidenceItem[];
  } catch {
    return [];
  }
}

export function hasEvidence(items: EvidenceItem[]): boolean {
  return items.some((item) => {
    if (item.kind === "image" && item.key) return true;
    if (item.kind === "url" && item.href && (item.note || "").trim()) return true;
    if (item.kind === "note" && (item.note || "").trim().length >= 20) return true;
    return false;
  });
}

export async function getRunById(id: string): Promise<RunRow | null> {
  return getEnv().DB.prepare("SELECT * FROM runs WHERE id = ?").bind(id).first<RunRow>();
}

export async function getRunBySerial(serial: number): Promise<RunRow | null> {
  return getEnv()
    .DB.prepare("SELECT * FROM runs WHERE serial = ?")
    .bind(serial)
    .first<RunRow>();
}

export async function getPublishedRun(serial: number): Promise<RunRow | null> {
  return getEnv()
    .DB.prepare("SELECT * FROM runs WHERE serial = ? AND status = 'published'")
    .bind(serial)
    .first<RunRow>();
}

export async function listPublishedRuns(limit = 50, db: QueryDb = getEnv().DB): Promise<RunRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM runs WHERE status = 'published' ORDER BY serial DESC LIMIT ?")
    .bind(limit)
    .all<RunRow>();
  return results ?? [];
}

const RELATED_POOL = 200;
const RELATED_COUNT = 3;

/** Nearby published Runs for the serial page footer. Shared connectors first, then House, then newer serials. */
export async function relatedPublishedRuns(run: RunRow, limit = RELATED_COUNT): Promise<RunRow[]> {
  const mine = new Set(parseConnectors(run.connectors).map((c) => c.toLowerCase()));
  const pool = await listPublishedRuns(RELATED_POOL);
  return pool
    .filter((other) => other.serial != null && other.serial !== run.serial && publishedRunPath(other))
    .map((other) => {
      const theirs = parseConnectors(other.connectors);
      let overlap = 0;
      for (const tool of theirs) {
        if (mine.has(tool.toLowerCase())) overlap += 1;
      }
      const sameHouse = other.house_number && other.house_number === run.house_number ? 1 : 0;
      return { other, overlap, sameHouse, serial: other.serial ?? 0 };
    })
    .sort((a, b) => b.overlap - a.overlap || b.sameHouse - a.sameHouse || b.serial - a.serial)
    .slice(0, limit)
    .map((row) => row.other);
}

export async function listPendingRuns(): Promise<RunRow[]> {
  const { results } = await getEnv()
    .DB.prepare("SELECT * FROM runs WHERE status = 'pending' ORDER BY created_at ASC")
    .all<RunRow>();
  return results ?? [];
}

export async function countPendingRuns(): Promise<number> {
  const row = await getEnv()
    .DB.prepare("SELECT COUNT(*) AS n FROM runs WHERE status = 'pending'")
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function listRunsForHouse(house: number): Promise<RunRow[]> {
  const { results } = await getEnv()
    .DB.prepare(
      "SELECT * FROM runs WHERE status = 'published' AND house_number = ? ORDER BY serial ASC",
    )
    .bind(house)
    .all<RunRow>();
  return results ?? [];
}

export async function countPublished(db: QueryDb = getEnv().DB): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM runs WHERE status = 'published'")
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function getSteward(userId: string): Promise<Steward | null> {
  const row = await getEnv()
    .DB.prepare("SELECT display_name, username, house_number FROM users WHERE id = ?")
    .bind(userId)
    .first<Steward>();
  return row ?? null;
}

/** Next serial among stamped Runs. Pending/rejected never consume this. */
export async function nextSerial(): Promise<number> {
  const row = await getEnv()
    .DB.prepare("SELECT COALESCE(MAX(serial), 0) AS n FROM runs")
    .first<{ n: number }>();
  return (row?.n ?? 0) + 1;
}

export function canSeeFiling(run: RunRow, user: PublicUser | null): boolean {
  if (run.status === "published") return true;
  if (!user) return false;
  return user.id === run.user_id || isStaff(user);
}

export async function createRun(input: {
  user: PublicUser;
  title: string;
  job_text: string;
  connectors: string[];
  what_happened: string;
  would_run_again: WouldRunAgain;
  evidence: EvidenceItem[];
  prompt_text?: string | null;
  constraints?: string | null;
  sensitive_kind?: SensitiveKind;
  queue: boolean;
}): Promise<RunRow> {
  const status: RunStatus = input.queue ? "pending" : "draft";
  if (input.queue && !hasEvidence(input.evidence)) {
    throw new Error("Evidence required to enter the review queue. Screenshot, output, artifact, or a URL plus a note.");
  }

  const id = `run_${randomToken(12)}`;
  const now = isoNow();
  await getEnv()
    .DB.prepare(
      `INSERT INTO runs (
        id, serial, title, job_text, connectors, what_happened, would_run_again,
        evidence_json, prompt_text, constraints, house_number, user_id, revision,
        status, sensitive_kind, published_at, created_at, updated_at
      ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 1, ?, ?, NULL, ?, ?)`,
    )
    .bind(
      id,
      input.title.trim(),
      input.job_text.trim(),
      JSON.stringify(dedupeConnectors(input.connectors)),
      input.what_happened.trim(),
      input.would_run_again,
      JSON.stringify(input.evidence),
      input.prompt_text?.trim() || null,
      input.constraints?.trim() || null,
      input.user.id,
      status,
      input.sensitive_kind ?? null,
      now,
      now,
    )
    .run();

  const row = await getRunById(id);
  if (!row) throw new Error("Failed to create filing");
  return row;
}

export async function queueDraft(run: RunRow, user: PublicUser): Promise<RunRow> {
  if (run.user_id !== user.id && !isStaff(user)) {
    throw new Error("Not your filing.");
  }
  if (run.status !== "draft" && run.status !== "rejected") {
    throw new Error("Only a draft or rejected filing can enter the queue.");
  }
  if (run.serial != null) throw new Error("This already has a serial.");
  if (!hasEvidence(parseEvidence(run.evidence_json))) {
    throw new Error("Evidence required to enter the review queue.");
  }
  const now = isoNow();
  await getEnv()
    .DB.prepare(
      "UPDATE runs SET status = 'pending', reviewer_note = NULL, reviewed_at = NULL, updated_at = ? WHERE id = ? AND serial IS NULL",
    )
    .bind(now, run.id)
    .run();
  const updated = await getRunById(run.id);
  if (!updated || updated.status !== "pending") throw new Error("Could not queue filing.");
  return updated;
}

export async function openPatchCount(serial: number): Promise<number> {
  const row = await getEnv()
    .DB.prepare(
      "SELECT COUNT(*) AS n FROM patches WHERE run_serial = ? AND status IN ('queued', 'awaiting_veto')",
    )
    .bind(serial)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function changelogFor(serial: number): Promise<
  { revision: number; one_liner: string; created_at: string; patch_id: string | null }[]
> {
  const { results } = await getEnv()
    .DB.prepare(
      "SELECT revision, one_liner, created_at, patch_id FROM changelog_entries WHERE run_serial = ? ORDER BY revision ASC, created_at ASC",
    )
    .bind(serial)
    .all<{ revision: number; one_liner: string; created_at: string; patch_id: string | null }>();
  return results ?? [];
}

export function runToJson(
  run: RunRow,
  origin: string,
  extra: {
    steward: Steward | null;
    changelog: Awaited<ReturnType<typeof changelogFor>>;
    open_patch_count: number;
  },
) {
  if (!run.serial || run.status !== "published") throw new Error("Unverified filings do not have public JSON");
  const path = publishedRunPath(run);
  if (!path) throw new Error("Verified Runs need a House and serial");
  const serial = run.serial;
  return {
    serial,
    id: runId(serial),
    revision: run.revision,
    title: run.title,
    url: canonical(origin, path),
    json: canonical(origin, `${path}.json`),
    markdown: canonical(origin, `${path}.md`),
    house: run.house_number,
    published_at: run.published_at,
    job_text: run.job_text,
    connectors: parseConnectors(run.connectors),
    what_happened: run.what_happened,
    would_run_again: run.would_run_again,
    evidence: parseEvidence(run.evidence_json),
    prompt_text: run.prompt_text,
    constraints: run.constraints,
    sensitive_kind: run.sensitive_kind,
    steward: extra.steward
      ? {
          display_name: extra.steward.display_name,
          house: extra.steward.house_number,
        }
      : null,
    changelog: extra.changelog,
    open_patch_count: extra.open_patch_count,
  };
}

export function runToMarkdown(
  run: RunRow,
  extra: { steward: Steward | null; changelog: Awaited<ReturnType<typeof changelogFor>> },
): string {
  const serial = run.serial ? runIdWithRev(run.serial, run.revision) : "PENDING";
  const lines = [
    `# ${serial} — ${run.title}`,
    "",
    `Revision: r${run.revision}`,
    extra.steward ? `Steward: ${extra.steward.display_name}` : "",
    extra.steward?.house_number ? `House: ${String(extra.steward.house_number).padStart(3, "0")}` : "",
    run.house_number ? `House: ${String(run.house_number).padStart(3, "0")}` : "",
    run.published_at ? `Verified: ${run.published_at}` : "",
    "",
    "## Job",
    run.job_text,
    "",
    "## Connectors",
    parseConnectors(run.connectors).join(", ") || "(none)",
    "",
    "## What happened",
    run.what_happened,
    "",
    run.constraints ? "## Constraints\n" + run.constraints : "",
    "",
    `Would run again: ${run.would_run_again}`,
    "",
    "## Changelog",
    ...extra.changelog.map((c) => `- r${c.revision}: ${c.one_liner}`),
    "",
  ];
  return lines.filter((l) => l !== "").join("\n");
}

export function indexJson(runs: RunRow[], origin: string) {
  return {
    updated_at: isoNow(),
    runs: runs.flatMap((r) => {
      const path = publishedRunPath(r);
      if (!path || r.status !== "published" || r.serial == null) return [];
      return [
        {
          serial: r.serial,
          id: runId(r.serial),
          revision: r.revision,
          title: r.title,
          url: canonical(origin, path),
          json: canonical(origin, `${path}.json`),
          markdown: canonical(origin, `${path}.md`),
          house: r.house_number,
          published_at: r.published_at,
        },
      ];
    }),
  };
}

export function previewLocation(run: RunRow, origin: string): string {
  const path = publishedRunPath(run);
  if (path && run.status === "published") return canonical(origin, path);
  return canonical(origin, filingPath(run.id));
}
