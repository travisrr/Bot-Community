CREATE TABLE qa_revisits (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES runs(id),
  run_serial INTEGER,
  conversation_id TEXT,
  tweet_id TEXT,
  flagged_by TEXT NOT NULL REFERENCES users(id),
  note TEXT,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'enriched', 'insufficient', 'failed')),
  thread_chars INTEGER,
  findings_json TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT
);

CREATE INDEX idx_qa_revisits_status ON qa_revisits(status, created_at);
CREATE INDEX idx_qa_revisits_run ON qa_revisits(run_id, created_at);
CREATE INDEX idx_x_imports_run ON x_imports(run_id);

INSERT OR IGNORE INTO site_changelog (id, dated, body) VALUES (
  'site_2026-08-17-qa-revisit',
  '2026-08-17',
  'Owner can tag a thin Run as weak and deploy a revisit agent that re-reads the source X thread. Learnings live at /qa.md.'
);
