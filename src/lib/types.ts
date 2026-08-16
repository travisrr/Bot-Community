export type Role = "user" | "admin";
export type RunStatus = "draft" | "pending" | "published" | "rejected" | "withdrawn";
export type WouldRunAgain = "yes" | "with_changes" | "no";
export type PatchStatus = "queued" | "awaiting_veto" | "vetoed" | "merged" | "rejected";
export type SensitiveKind = "legal" | "medical" | "financial" | null;
export type EvidenceKind = "image" | "url" | "note";

export type EvidenceItem = {
  kind: EvidenceKind;
  alt?: string;
  note?: string;
  href?: string;
  key?: string;
  url?: string;
  content_type?: string;
};

export type PublicUser = {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string;
  house_number: number | null;
  house_claimed_at: string | null;
  x_handle: string | null;
  role: Role;
};

export type UserRow = PublicUser & {
  password_hash: string | null;
  x_user_id: string | null;
  house_token_hash: string | null;
  created_at: string;
};

export type RunRow = {
  id: string;
  serial: number | null;
  slug: string | null;
  title: string;
  job_text: string;
  connectors: string;
  what_happened: string;
  would_run_again: WouldRunAgain;
  evidence_json: string;
  prompt_text: string | null;
  constraints: string | null;
  house_number: number | null;
  user_id: string;
  revision: number;
  status: RunStatus;
  sensitive_kind: SensitiveKind;
  published_at: string | null;
  reviewer_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PatchRow = {
  id: string;
  run_serial: number;
  user_id: string;
  proposed_title: string | null;
  proposed_job_text: string | null;
  proposed_prompt: string | null;
  proposed_what_happened: string | null;
  evidence_json: string;
  claim: string;
  status: PatchStatus;
  veto_deadline: string | null;
  reviewed_at: string | null;
  merged_revision: number | null;
  reviewer_note: string | null;
  created_at: string;
};

export type ChangelogRow = {
  id: string;
  run_serial: number;
  revision: number;
  one_liner: string;
  patch_id: string | null;
  created_at: string;
};

export type Steward = {
  display_name: string;
  username: string | null;
  house_number: number | null;
};
