import { getEnv } from "./env";
import { isoNow } from "./format";
import { randomToken } from "./crypto";
import { hasEvidence, getRunById, nextSerial, parseEvidence } from "./runs";
import { mintHouseIfNeeded } from "./houses";
import { parseJsonArray } from "./html";
import type { RunRow } from "./types";

export class ReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReviewError";
  }
}

function evidenceReady(run: RunRow): string | null {
  if (run.job_text.trim().length < 20) return "What they asked is too thin.";
  if (!parseJsonArray(run.connectors).length) return "What it connected to is missing.";
  if (run.what_happened.trim().length < 20) return "What it actually did is too thin.";
  if (!hasEvidence(parseEvidence(run.evidence_json))) {
    return "Evidence required: screenshot, output, artifact, or a URL plus a note. No vibes.";
  }
  if (!run.would_run_again) return "Would-run-again is required.";
  return null;
}

export async function verifyRun(run: RunRow): Promise<{ run: RunRow; minted_house: boolean }> {
  if (run.status !== "pending") throw new ReviewError("Only pending filings can be verified.");
  if (run.serial != null) throw new ReviewError("This filing already has a serial.");
  const blocked = evidenceReady(run);
  if (blocked) throw new ReviewError(blocked);

  const { house, minted } = await mintHouseIfNeeded(run.user_id);
  const db = getEnv().DB;
  const now = isoNow();

  for (let attempt = 0; attempt < 8; attempt++) {
    const serial = await nextSerial();
    try {
      const stamped = await db
        .prepare(
          `UPDATE runs SET
            serial = ?,
            house_number = ?,
            status = 'published',
            published_at = ?,
            updated_at = ?,
            reviewed_at = ?,
            reviewer_note = NULL
           WHERE id = ? AND status = 'pending' AND serial IS NULL`,
        )
        .bind(serial, house, now, now, now, run.id)
        .run();
      if (!stamped.meta.changes) {
        const already = await getRunById(run.id);
        if (already?.status === "published" && already.serial) {
          return { run: already, minted_house: minted };
        }
        continue;
      }
      await db
        .prepare(
          "INSERT INTO changelog_entries (id, run_serial, revision, one_liner, patch_id, created_at) VALUES (?, ?, 1, ?, NULL, ?)",
        )
        .bind(`cl_${randomToken(10)}`, serial, "Filed.", now)
        .run();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes("unique")) throw err;
      continue;
    }

    const updated = await getRunById(run.id);
    if (updated?.status === "published" && updated.serial) {
      return { run: updated, minted_house: minted };
    }
  }
  throw new ReviewError("Could not stamp a serial.");
}

export async function rejectRun(run: RunRow, note: string): Promise<RunRow> {
  if (run.status !== "pending") throw new ReviewError("Only pending filings can be rejected.");
  if (run.serial != null) throw new ReviewError("A stamped Run cannot be rejected this way.");
  const now = isoNow();
  await getEnv()
    .DB.prepare(
      `UPDATE runs SET
        status = 'rejected',
        reviewer_note = ?,
        reviewed_at = ?,
        updated_at = ?
       WHERE id = ? AND status = 'pending' AND serial IS NULL`,
    )
    .bind(note.trim() || "Rejected. No serial consumed. No House minted.", now, now, run.id)
    .run();
  const updated = await getRunById(run.id);
  if (!updated || updated.status !== "rejected") throw new ReviewError("Could not reject filing.");
  return updated;
}
