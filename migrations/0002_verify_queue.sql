-- Pending filings have no serial. Status check must allow pending/rejected.
-- SQLite cannot ALTER a CHECK constraint in place.

PRAGMA foreign_keys=OFF;

CREATE TABLE runs_new (
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
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'withdrawn')),
  sensitive_kind TEXT CHECK (sensitive_kind IN ('legal', 'medical', 'financial') OR sensitive_kind IS NULL),
  published_at TEXT,
  reviewer_note TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO runs_new (
  id, serial, slug, title, job_text, connectors, what_happened, would_run_again,
  evidence_json, prompt_text, constraints, house_number, user_id, revision,
  status, sensitive_kind, published_at, reviewer_note, reviewed_at, created_at, updated_at
)
SELECT
  id, serial, slug, title, job_text, connectors, what_happened, would_run_again,
  evidence_json, prompt_text, constraints, house_number, user_id, revision,
  status, sensitive_kind, published_at, NULL, NULL, created_at, updated_at
FROM runs;

DROP TABLE runs;
ALTER TABLE runs_new RENAME TO runs;

CREATE INDEX idx_runs_published ON runs(status, serial);
CREATE INDEX idx_runs_house ON runs(house_number);
CREATE INDEX idx_runs_user_status ON runs(user_id, status);

PRAGMA foreign_keys=ON;

INSERT OR IGNORE INTO site_changelog (id, dated, body) VALUES (
  'site_2026-08-16-verify',
  '2026-08-16',
  'Serials and Houses stamp only at verify. Pending filings are unlisted. No BR- prefix. Houses auto-assigned on first verified Run.'
);
