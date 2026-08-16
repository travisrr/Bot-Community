import { getEnv } from "./env";
import { isoNow } from "./format";
import { randomToken } from "./crypto";
import { hasEvidence, parseEvidence } from "./runs";
import { VETO_HOURS } from "./site";
import type { EvidenceItem, PatchRow, PublicUser, RunRow } from "./types";

export class PatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PatchError";
  }
}

export async function submitPatch(input: {
  run: RunRow;
  user: PublicUser;
  claim: string;
  evidence: EvidenceItem[];
  proposed_title?: string | null;
  proposed_job_text?: string | null;
  proposed_prompt?: string | null;
  proposed_what_happened?: string | null;
}): Promise<PatchRow> {
  const claim = input.claim.trim();
  if (claim.length < 20) {
    throw new PatchError("Say what is better, in one paragraph. Empty vibes get rejected.");
  }
  if (!hasEvidence(input.evidence)) {
    throw new PatchError("Patches need evidence. Upload a file or give a URL plus a note.");
  }
  if (!input.run.serial) {
    throw new PatchError("Cannot patch an unverified filing.");
  }
  const id = `pat_${randomToken(12)}`;
  const now = isoNow();
  const veto_deadline = new Date(Date.now() + VETO_HOURS * 60 * 60 * 1000).toISOString();
  await getEnv()
    .DB.prepare(
      `INSERT INTO patches (
        id, run_serial, user_id, proposed_title, proposed_job_text, proposed_prompt,
        proposed_what_happened, evidence_json, claim, status, veto_deadline, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', ?, ?)`,
    )
    .bind(
      id,
      input.run.serial,
      input.user.id,
      input.proposed_title?.trim() || null,
      input.proposed_job_text?.trim() || null,
      input.proposed_prompt?.trim() || null,
      input.proposed_what_happened?.trim() || null,
      JSON.stringify(input.evidence),
      claim,
      veto_deadline,
      now,
    )
    .run();
  const row = await getEnv().DB.prepare("SELECT * FROM patches WHERE id = ?").bind(id).first<PatchRow>();
  if (!row) throw new Error("Failed to create patch");
  return row;
}

export async function getPatch(id: string): Promise<PatchRow | null> {
  return getEnv().DB.prepare("SELECT * FROM patches WHERE id = ?").bind(id).first<PatchRow>();
}

export async function countMergedPatches(): Promise<number> {
  const row = await getEnv()
    .DB.prepare("SELECT COUNT(*) AS n FROM patches WHERE status = 'merged'")
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function mergedPatchCountsBySerial(): Promise<Map<number, number>> {
  const { results } = await getEnv()
    .DB.prepare("SELECT run_serial, COUNT(*) AS n FROM patches WHERE status = 'merged' GROUP BY run_serial")
    .all<{ run_serial: number; n: number }>();
  return new Map((results ?? []).map((row) => [row.run_serial, row.n]));
}

export async function listPatchesForRun(serial: number): Promise<PatchRow[]> {
  const { results } = await getEnv()
    .DB.prepare("SELECT * FROM patches WHERE run_serial = ? ORDER BY created_at DESC")
    .bind(serial)
    .all<PatchRow>();
  return results ?? [];
}

export async function listOpenPatches(): Promise<PatchRow[]> {
  const { results } = await getEnv()
    .DB.prepare(
      "SELECT * FROM patches WHERE status IN ('queued', 'awaiting_veto') ORDER BY created_at ASC",
    )
    .all<PatchRow>();
  return results ?? [];
}

export async function listPatchesForSteward(userId: string): Promise<PatchRow[]> {
  const { results } = await getEnv()
    .DB.prepare(
      `SELECT p.* FROM patches p
       JOIN runs r ON r.serial = p.run_serial
       WHERE r.user_id = ? AND p.status IN ('queued', 'awaiting_veto')
       ORDER BY p.created_at ASC`,
    )
    .bind(userId)
    .all<PatchRow>();
  return results ?? [];
}

export function vetoOpen(patch: PatchRow): boolean {
  if (patch.status !== "queued" && patch.status !== "awaiting_veto") return false;
  if (!patch.veto_deadline) return false;
  return new Date(patch.veto_deadline).getTime() > Date.now();
}

export function canMerge(patch: PatchRow, stewardAccepted = false): boolean {
  if (patch.status === "vetoed" || patch.status === "merged" || patch.status === "rejected") return false;
  if (stewardAccepted) return true;
  if (!patch.veto_deadline) return false;
  return new Date(patch.veto_deadline).getTime() <= Date.now();
}

export async function vetoPatch(patch: PatchRow, stewardId: string): Promise<void> {
  const run = await getEnv()
    .DB.prepare("SELECT user_id FROM runs WHERE serial = ?")
    .bind(patch.run_serial)
    .first<{ user_id: string }>();
  if (!run || run.user_id !== stewardId) throw new PatchError("Only the original filer can veto.");
  if (!vetoOpen(patch)) throw new PatchError("Veto window is closed.");
  await getEnv()
    .DB.prepare("UPDATE patches SET status = 'vetoed', reviewed_at = ? WHERE id = ?")
    .bind(isoNow(), patch.id)
    .run();
}

export async function acceptPatch(patch: PatchRow, stewardId: string): Promise<void> {
  const run = await getEnv()
    .DB.prepare("SELECT user_id FROM runs WHERE serial = ?")
    .bind(patch.run_serial)
    .first<{ user_id: string }>();
  if (!run || run.user_id !== stewardId) throw new PatchError("Only the original filer can accept.");
  if (patch.status !== "queued" && patch.status !== "awaiting_veto") {
    throw new PatchError("This patch is not waiting.");
  }
  await getEnv()
    .DB.prepare("UPDATE patches SET status = 'awaiting_veto', veto_deadline = ? WHERE id = ?")
    .bind(isoNow(), patch.id)
    .run();
}

export async function rejectPatch(patch: PatchRow, note: string): Promise<void> {
  await getEnv()
    .DB.prepare("UPDATE patches SET status = 'rejected', reviewed_at = ?, reviewer_note = ? WHERE id = ?")
    .bind(isoNow(), note.trim() || "Rejected.", patch.id)
    .run();
}

export async function mergePatch(patch: PatchRow, oneLiner: string, stewardAccepted = false): Promise<number> {
  if (patch.status === "vetoed" || patch.status === "merged" || patch.status === "rejected") {
    throw new PatchError("This patch is closed.");
  }
  if (vetoOpen(patch) && !stewardAccepted) {
    throw new PatchError("Veto window still open.");
  }

  const db = getEnv().DB;
  const run = await db.prepare("SELECT * FROM runs WHERE serial = ?").bind(patch.run_serial).first<RunRow>();
  if (!run || !run.serial) throw new PatchError("Run missing.");
  const revision = run.revision + 1;
  const now = isoNow();
  const evidence = parseEvidence(patch.evidence_json);
  const runEvidence = parseEvidence(run.evidence_json);
  const mergedEvidence = evidence.length ? [...runEvidence, ...evidence] : runEvidence;

  await db.batch([
    db
      .prepare(
        `UPDATE runs SET
          title = COALESCE(?, title),
          job_text = COALESCE(?, job_text),
          prompt_text = COALESCE(?, prompt_text),
          what_happened = COALESCE(?, what_happened),
          evidence_json = ?,
          revision = ?,
          updated_at = ?
         WHERE serial = ?`,
      )
      .bind(
        patch.proposed_title,
        patch.proposed_job_text,
        patch.proposed_prompt,
        patch.proposed_what_happened,
        JSON.stringify(mergedEvidence),
        revision,
        now,
        run.serial,
      ),
    db
      .prepare(
        "UPDATE patches SET status = 'merged', reviewed_at = ?, merged_revision = ? WHERE id = ?",
      )
      .bind(now, revision, patch.id),
    db
      .prepare(
        "INSERT INTO changelog_entries (id, run_serial, revision, one_liner, patch_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(`cl_${randomToken(10)}`, run.serial, revision, oneLiner.trim() || "Patch merged.", patch.id, now),
  ]);
  return revision;
}

export { parseEvidence };
