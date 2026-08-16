-- Seat the Owner account as @saastrash. Role stays admin in SQLite (CHECK);
-- the app maps that handle to Owner.

UPDATE users
SET
  username = 'saastrash',
  x_handle = 'saastrash'
WHERE id = 'usr_travis_seed'
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE lower(username) = 'saastrash' AND id != 'usr_travis_seed'
  );

UPDATE users
SET x_handle = COALESCE(x_handle, 'saastrash')
WHERE id = 'usr_travis_seed';

INSERT OR IGNORE INTO site_changelog (id, dated, body) VALUES (
  'site_2026-08-16-owner',
  '2026-08-16',
  'Owner seat is @saastrash. Admin has a patch moderation queue. Serials still stamp only at verify.'
);
