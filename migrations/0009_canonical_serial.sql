ALTER TABLE runs ADD COLUMN canonical_serial INTEGER;

-- 00017 and 00018 were the same Peter Yang thread. Keep 00017; reserve 00018.
UPDATE runs
SET
  status = 'withdrawn',
  canonical_serial = 17,
  reviewer_note = 'Duplicate of 00017. Same source thread. Serial reserved.',
  reviewed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE serial = 18 AND status = 'published';

UPDATE x_imports
SET run_id = (SELECT id FROM runs WHERE serial = 17)
WHERE run_id = (SELECT id FROM runs WHERE serial = 18);

UPDATE runs
SET
  revision = revision + 1,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE serial = 17 AND status = 'published';

INSERT INTO changelog_entries (id, run_serial, revision, one_liner, patch_id, created_at)
SELECT 'cl_dup00018', 17, revision, 'Withdrew duplicate 00018 (same source thread).', NULL, updated_at
FROM runs
WHERE serial = 17 AND status = 'published';

INSERT OR IGNORE INTO site_changelog (id, dated, body) VALUES (
  'site_2026-08-18-dup-00018',
  '2026-08-18',
  '00018 was the same Peter Yang cleanup thread as 00017. 00018 is withdrawn; that URL goes to 00017. A tagged import now records the serial before the X reply, so a slow stamp cannot mint a second one.'
);
