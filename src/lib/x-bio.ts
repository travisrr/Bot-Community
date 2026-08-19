import { getEnv } from "./env";
import { summarizeWhoFromBio } from "./x-summarize";
import { lookupXUsers, lookupXUsersByUsername, xBotReady } from "./x-api";

const MAX_PER_TICK = 4;

export async function rememberXBio(userId: string, bio: string | null | undefined): Promise<void> {
  const raw = (bio || "").trim();
  if (!raw) return;
  const summary = await summarizeWhoFromBio(raw);
  await getEnv()
    .DB.prepare("UPDATE users SET x_bio = ?, x_bio_summary = ? WHERE id = ?")
    .bind(raw, summary || null, userId)
    .run();
}

export type XBioFillResult = {
  ok: true;
  configured: boolean;
  scanned: number;
  filled: number;
};

export async function fillMissingXBios(): Promise<XBioFillResult> {
  if (!(await xBotReady())) return { ok: true, configured: false, scanned: 0, filled: 0 };
  const { results } = await getEnv()
    .DB.prepare(
      `SELECT id, x_user_id, x_handle, display_name FROM users
       WHERE (x_bio_summary IS NULL OR trim(x_bio_summary) = '')
         AND x_handle IS NOT NULL AND trim(x_handle) != ''
       ORDER BY house_number IS NULL, house_number ASC
       LIMIT ?`,
    )
    .bind(MAX_PER_TICK)
    .all<{ id: string; x_user_id: string | null; x_handle: string; display_name: string }>();
  const rows = results ?? [];
  if (!rows.length) return { ok: true, configured: true, scanned: 0, filled: 0 };

  const byId = await lookupXUsers(rows.map((row) => row.x_user_id || "").filter(Boolean));
  const missingUsernames = rows
    .filter((row) => !row.x_user_id || !byId.has(row.x_user_id))
    .map((row) => row.x_handle);
  const byHandle = await lookupXUsersByUsername(missingUsernames);

  let filled = 0;
  for (const row of rows) {
    const profile =
      (row.x_user_id ? byId.get(row.x_user_id) : undefined) ||
      byHandle.get(row.x_handle.toLowerCase());
    if (!profile) continue;
    try {
      if (!row.x_user_id && profile.id) {
        await getEnv()
          .DB.prepare("UPDATE users SET x_user_id = ? WHERE id = ? AND x_user_id IS NULL")
          .bind(profile.id, row.id)
          .run();
      }
      const liveName = (profile.name || "").trim();
      const handleName = row.x_handle.toLowerCase();
      if (liveName && row.display_name.trim().toLowerCase() === handleName) {
        await getEnv().DB.prepare("UPDATE users SET display_name = ? WHERE id = ?").bind(liveName, row.id).run();
      }
      const bio = profile.description?.trim() || "";
      if (!bio) continue;
      await rememberXBio(row.id, bio);
      filled += 1;
    } catch (err) {
      console.error(JSON.stringify({ event: "x_bio_fill_failed", user_id: row.id, error: String(err) }));
    }
  }
  return { ok: true, configured: true, scanned: rows.length, filled };
}
