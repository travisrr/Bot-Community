CREATE TABLE discovery_prompts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  run_id TEXT REFERENCES runs(id) ON DELETE SET NULL,
  source TEXT,
  prompt TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX discovery_prompts_created ON discovery_prompts (created_at DESC);
