CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT,
  x_user_id TEXT UNIQUE,
  x_handle TEXT,
  house_number INTEGER UNIQUE,
  house_claimed_at TEXT,
  house_token_hash TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE magic_links (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE oauth_states (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  code_verifier TEXT NOT NULL,
  redirect_to TEXT,
  expires_at TEXT NOT NULL
);

CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  serial INTEGER UNIQUE,
  slug TEXT,
  title TEXT NOT NULL,
  job_text TEXT NOT NULL,
  connectors TEXT NOT NULL DEFAULT '[]',
  what_happened TEXT NOT NULL DEFAULT '',
  would_run_again TEXT NOT NULL CHECK (would_run_again IN ('yes', 'with_changes', 'no')),
  evidence_json TEXT NOT NULL DEFAULT '[]',
  prompt_text TEXT,
  constraints TEXT,
  house_number INTEGER,
  user_id TEXT NOT NULL REFERENCES users(id),
  revision INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'withdrawn')),
  sensitive_kind TEXT CHECK (sensitive_kind IN ('legal', 'medical', 'financial') OR sensitive_kind IS NULL),
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE patches (
  id TEXT PRIMARY KEY,
  run_serial INTEGER NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  proposed_title TEXT,
  proposed_job_text TEXT,
  proposed_prompt TEXT,
  proposed_what_happened TEXT,
  evidence_json TEXT NOT NULL DEFAULT '[]',
  claim TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'awaiting_veto', 'vetoed', 'merged', 'rejected')),
  veto_deadline TEXT,
  reviewed_at TEXT,
  merged_revision INTEGER,
  reviewer_note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE changelog_entries (
  id TEXT PRIMARY KEY,
  run_serial INTEGER NOT NULL,
  revision INTEGER NOT NULL,
  one_liner TEXT NOT NULL,
  patch_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
);

CREATE TABLE site_changelog (
  id TEXT PRIMARY KEY,
  dated TEXT NOT NULL,
  body TEXT NOT NULL
);

CREATE INDEX idx_runs_published ON runs(status, serial);
CREATE INDEX idx_runs_house ON runs(house_number);
CREATE INDEX idx_patches_run ON patches(run_serial, status);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_changelog_run ON changelog_entries(run_serial, revision);
