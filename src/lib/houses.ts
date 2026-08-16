import { getEnv, type QueryDb } from "./env";
import { isoNow } from "./format";
import { rotateHouseToken } from "./auth";

export class HouseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HouseError";
  }
}

export async function nextHouse(db: QueryDb = getEnv().DB): Promise<number> {
  const row = await db
    .prepare("SELECT COALESCE(MAX(house_number), 0) AS n FROM users")
    .first<{ n: number }>();
  return (row?.n ?? 0) + 1;
}

export async function getHouseSteward(n: number) {
  return getEnv()
    .DB.prepare(
      "SELECT id, display_name, username, house_number, house_claimed_at, created_at FROM users WHERE house_number = ?",
    )
    .bind(n)
    .first<{
      id: string;
      display_name: string;
      username: string | null;
      house_number: number;
      house_claimed_at: string | null;
      created_at: string;
    }>();
}

export async function houseStats(n: number) {
  const filed = await getEnv()
    .DB.prepare("SELECT COUNT(*) AS n FROM runs WHERE house_number = ? AND status = 'published'")
    .bind(n)
    .first<{ n: number }>();
  const merged = await getEnv()
    .DB.prepare(
      `SELECT COUNT(*) AS n FROM patches p
       JOIN runs r ON r.serial = p.run_serial
       WHERE r.house_number = ? AND p.status = 'merged'`,
    )
    .bind(n)
    .first<{ n: number }>();
  return {
    runs_filed: filed?.n ?? 0,
    patches_merged: merged?.n ?? 0,
  };
}

export async function listClaimedHouses(db: QueryDb = getEnv().DB) {
  const { results } = await db
    .prepare(
      `SELECT u.house_number, u.display_name, u.username, u.x_handle, u.house_claimed_at,
              COALESCE(r.n, 0) AS runs_filed
       FROM users u
       LEFT JOIN (
         SELECT house_number, COUNT(*) AS n
         FROM runs
         WHERE status = 'published'
         GROUP BY house_number
       ) r ON r.house_number = u.house_number
       WHERE u.house_number IS NOT NULL
       ORDER BY u.house_number ASC`,
    )
    .all<{
      house_number: number;
      display_name: string;
      username: string | null;
      x_handle: string | null;
      house_claimed_at: string | null;
      runs_filed: number;
    }>();
  return (results ?? []).map((row) => ({
    ...row,
    runs_filed: Number(row.runs_filed) || 0,
  }));
}

/** Stamp the next House on first verified Run. Never pickable. Never reserved. */
export async function mintHouseIfNeeded(userId: string): Promise<{ house: number; minted: boolean }> {
  const existing = await getEnv()
    .DB.prepare("SELECT house_number FROM users WHERE id = ?")
    .bind(userId)
    .first<{ house_number: number | null }>();
  if (!existing) throw new HouseError("Filer missing.");
  if (existing.house_number) return { house: existing.house_number, minted: false };

  for (let attempt = 0; attempt < 8; attempt++) {
    const n = await nextHouse();
    try {
      await getEnv()
        .DB.prepare(
          "UPDATE users SET house_number = ?, house_claimed_at = ? WHERE id = ? AND house_number IS NULL",
        )
        .bind(n, isoNow(), userId)
        .run();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes("unique")) throw err;
    }
    const row = await getEnv()
      .DB.prepare("SELECT house_number FROM users WHERE id = ?")
      .bind(userId)
      .first<{ house_number: number | null }>();
    if (row?.house_number) {
      const minted = row.house_number === n;
      if (minted) await rotateHouseToken(userId);
      return { house: row.house_number, minted };
    }
  }
  throw new HouseError("Could not mint House.");
}
