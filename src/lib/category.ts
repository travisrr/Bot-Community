import { parseConnectors } from "./tools";
import type { RunRow, SensitiveKind } from "./types";

export const RUN_CAT_IDS = ["work", "research", "sales", "personal", "coding", "money", "legal"] as const;
export type RunCatId = (typeof RUN_CAT_IDS)[number];

export const CAT_LABEL: Record<RunCatId, string> = {
  work: "Work & ops",
  research: "Research",
  sales: "Sales",
  personal: "Personal admin",
  coding: "Coding",
  money: "Money",
  legal: "Legal",
};

export function catPath(id: RunCatId): string {
  return `/${id}`;
}

export function parseCatParam(raw: string | null | undefined): RunCatId | null {
  const id = (raw || "").trim().toLowerCase();
  for (const cat of RUN_CAT_IDS) {
    if (cat === id) return cat;
  }
  return null;
}

function catFromSensitive(kind: SensitiveKind): RunCatId | null {
  switch (kind) {
    case "legal":
      return "legal";
    case "medical":
      return "personal";
    case "financial":
      return "money";
    case null:
      return null;
    default: {
      const _never: never = kind;
      return _never;
    }
  }
}

export function inferCategory(run: RunRow): RunCatId {
  const fromKind = catFromSensitive(run.sensitive_kind);
  if (fromKind) return fromKind;

  const text = `${run.title} ${run.job_text} ${run.what_happened} ${parseConnectors(run.connectors).join(" ")}`.toLowerCase();
  if (/\b(ticket|court|lawyer|attorney|representation|citation|plead|probate|legal)\b/.test(text)) return "legal";
  if (/\b(sales|crm|pipeline|outbound|linkedin)\b/.test(text)) return "sales";
  if (/\b(bug|github|linear|commit|reproduc|ci build|failing commit)\b/.test(text)) return "coding";
  if (/\b(research|competitor|sourced|teardown|filings)\b/.test(text)) return "research";
  if (/\b(subscription|receipt|invoice|tax|deductible)\b/.test(text)) return "money";
  if (/\b(insurance|medical bill|dispute|personal)\b/.test(text)) return "personal";
  if (/\b(inbox|gmail|calendar|schedule|shift|ops)\b/.test(text)) return "work";
  return "work";
}
