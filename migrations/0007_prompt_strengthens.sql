CREATE TABLE prompt_strengthens (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES runs(id),
  run_serial INTEGER,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'strengthened', 'unchanged', 'failed')),
  thread_chars INTEGER,
  findings_json TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT
);

CREATE INDEX idx_prompt_strengthens_status ON prompt_strengthens(status, created_at);
CREATE INDEX idx_prompt_strengthens_run ON prompt_strengthens(run_id, created_at);

INSERT OR IGNORE INTO site_changelog (id, dated, body) VALUES (
  'site_2026-08-18-prompt-strengthen',
  '2026-08-18',
  'Daily cron writes a stronger copyable prompt onto each published Run from the filing itself, even when the source thread was thin.'
);
