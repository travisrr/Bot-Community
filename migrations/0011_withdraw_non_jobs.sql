-- 00020 minted House 011 for @elonmusk from a “share your Grok bot” thread.
-- 00021 filed a directory shoutout under House 001. Neither was a finished Grok Bot job.
-- Serials stay reserved. House 011 is unminted so the next real first Run can take it.

UPDATE runs
SET
  status = 'withdrawn',
  reviewer_note = 'Withdrawn: the @tryreallybot tag was not a finished Grok Bot job. Serial reserved.',
  reviewed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE serial IN (20, 21) AND status = 'published';

INSERT INTO changelog_entries (id, run_serial, revision, one_liner, patch_id, created_at)
SELECT 'cl_wd00020', 20, revision + 1, 'Withdrawn: tag was not a finished Grok Bot job.', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM runs WHERE serial = 20;

INSERT INTO changelog_entries (id, run_serial, revision, one_liner, patch_id, created_at)
SELECT 'cl_wd00021', 21, revision + 1, 'Withdrawn: tag was not a finished Grok Bot job.', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM runs WHERE serial = 21;

UPDATE runs
SET revision = revision + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE serial IN (20, 21);

UPDATE users
SET house_number = NULL, house_claimed_at = NULL, house_token_hash = NULL
WHERE house_number = 11
  AND NOT EXISTS (SELECT 1 FROM runs WHERE house_number = 11 AND status = 'published');

UPDATE x_imports
SET
  status = 'skipped',
  skip_reason = 'This thread does not look like a finished Grok Bot job.',
  run_id = NULL
WHERE run_id IN (SELECT id FROM runs WHERE serial IN (20, 21))
   OR mention_tweet_id IN ('2090094908610662712', '2090095255307579607');

INSERT OR IGNORE INTO site_changelog (id, dated, body) VALUES (
  'site_2026-08-19-x-job-gate',
  '2026-08-19',
  'Tagging @tryreallybot only files a finished Grok Bot job. Casual tags, directory shoutouts, and “share your bot” threads are skipped. 00020 and 00021 are withdrawn; House 011 is unminted. Serials stay reserved.'
);
