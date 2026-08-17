CREATE TABLE x_imports (
  mention_tweet_id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  author_x_user_id TEXT NOT NULL,
  author_x_handle TEXT NOT NULL,
  tagger_x_user_id TEXT NOT NULL,
  tagger_x_handle TEXT NOT NULL,
  run_id TEXT REFERENCES runs(id),
  reply_tweet_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('imported', 'skipped', 'failed', 'duplicate')),
  skip_reason TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_x_imports_conversation ON x_imports(conversation_id, status);
CREATE INDEX idx_x_imports_author ON x_imports(author_x_user_id, created_at);

CREATE TABLE x_bot_auth (
  id TEXT PRIMARY KEY CHECK (id = 'bot'),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  bot_user_id TEXT,
  last_mention_id TEXT,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO site_changelog (id, dated, body) VALUES (
  'site_2026-08-17-x-import',
  '2026-08-17',
  'Tag @tryreallybot on an X thread of a finished Grok job. The board files it under the original author, mints their House on a first Run, and replies with the URL.'
);
