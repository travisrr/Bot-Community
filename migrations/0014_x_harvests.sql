CREATE TABLE x_harvests (
  id TEXT PRIMARY KEY,
  mention_tweet_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  root_tweet_id TEXT NOT NULL,
  tagger_x_user_id TEXT NOT NULL,
  tagger_x_handle TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'done', 'failed')),
  reply_tweet_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_x_harvests_conversation ON x_harvests(conversation_id);
CREATE INDEX idx_x_harvests_status ON x_harvests(status, updated_at);

CREATE TABLE x_harvest_items (
  id TEXT PRIMARY KEY,
  harvest_id TEXT NOT NULL REFERENCES x_harvests(id),
  source_tweet_id TEXT NOT NULL,
  item_index INTEGER NOT NULL DEFAULT 1,
  author_x_user_id TEXT NOT NULL,
  author_x_handle TEXT NOT NULL,
  source_text TEXT NOT NULL,
  run_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'imported', 'skipped', 'failed', 'duplicate')),
  skip_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(source_tweet_id, item_index)
);

CREATE INDEX idx_x_harvest_items_status ON x_harvest_items(status, created_at);
CREATE INDEX idx_x_harvest_items_run ON x_harvest_items(run_id);
CREATE INDEX idx_x_harvest_items_harvest ON x_harvest_items(harvest_id, status);

INSERT OR IGNORE INTO site_changelog (id, dated, body) VALUES (
  'site_2026-08-20-x-harvest',
  '2026-08-20',
  'Tag @tryreallybot on a thread collecting Grok bot use cases. The board reads the replies, files each job as its own serial under the commenter, and keeps draining the rest on the minute cron.'
);
