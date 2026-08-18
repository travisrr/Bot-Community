import type { PatchStatus, Role, RunStatus } from "./types";

export function padSerial(n: number): string {
  return String(n).padStart(5, "0");
}

export function padHouse(n: number): string {
  return String(n).padStart(3, "0");
}

export function runId(serial: number): string {
  return padSerial(serial);
}

export function runIdWithRev(serial: number, revision: number): string {
  const id = runId(serial);
  return revision > 1 ? `${id}.r${revision}` : id;
}

export function houseLabel(n: number): string {
  return `House ${padHouse(n)}`;
}

export function houseSlug(n: number): string {
  return `house${padHouse(n)}`;
}

export function housePath(n: number): string {
  return `/${houseSlug(n)}`;
}

export function houseXPath(n: number): string {
  return `${housePath(n)}/x`;
}

export function runPath(house: number, serial: number): string {
  return `${housePath(house)}/${padSerial(serial)}`;
}

export function publishedRunPath(run: {
  house_number: number | null;
  serial: number | null;
}): string | null {
  if (!run.serial || !run.house_number) return null;
  return runPath(run.house_number, run.serial);
}

export function filingPath(id: string): string {
  return `/filing/${id}`;
}

export function parseSerialParam(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^BR-/i, "").replace(/^0+/, "") || "0";
  const n = Number.parseInt(raw.replace(/^BR-/i, ""), 10);
  if (!Number.isInteger(n) || n < 1) return null;
  if (cleaned === "0") return null;
  return n;
}

export function parseHouseParam(raw: string | undefined): number | null {
  if (!raw) return null;
  const m = raw.trim().match(/^house(\d+)$/i);
  if (!m) return null;
  return parseSerialParam(m[1]);
}

export function compactCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
}

export function isoNow(): string {
  return new Date().toISOString();
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
}

export function wouldLabel(value: string): string {
  if (value === "yes") return "Yes";
  if (value === "with_changes") return "With changes";
  if (value === "no") return "No";
  return value;
}

export function statusLabel(status: RunStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "pending":
      return "Pending review";
    case "published":
      return "Verified";
    case "rejected":
      return "Rejected";
    case "withdrawn":
      return "Withdrawn";
    default: {
      const _never: never = status;
      return _never;
    }
  }
}

export function patchStatusLabel(status: PatchStatus): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "awaiting_veto":
      return "Steward accepted";
    case "vetoed":
      return "Vetoed";
    case "merged":
      return "Merged";
    case "rejected":
      return "Rejected";
    default: {
      const _never: never = status;
      return _never;
    }
  }
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "user":
      return "User";
    default: {
      const _never: never = role;
      return _never;
    }
  }
}
