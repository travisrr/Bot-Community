INSERT INTO users (
  id, email, username, display_name, password_hash, house_number, house_claimed_at,
  house_token_hash, role, created_at
) VALUES (
  'usr_travis_seed',
  'travis@botruns.com',
  'travis',
  'Travis',
  'pbkdf2$sha256$100000$JYHU8rgiEy7V_jkvS9aFeA$FK5LuEZ3muwuhv8bOcBbeeFTR1ATfNg6XlX4MCiPlW0',
  1,
  '2026-08-16T15:00:00Z',
  'qdwuY151zgH1mN5jwGRGi7gxPzBrEm0u_t5KLTRJ-Ds',
  'admin',
  '2026-08-16T15:00:00Z'
);

INSERT INTO runs (
  id, serial, title, job_text, connectors, what_happened, would_run_again, evidence_json,
  prompt_text, constraints, house_number, user_id, revision, status, sensitive_kind,
  published_at, created_at, updated_at
) VALUES (
  'run_seed_00001',
  1,
  'Plead down a Georgia speeding ticket from a Tennessee license',
  'Research how a Georgia speeding ticket hits a Tennessee license. Read the citation photo. Find Bartow County Probate lawyers. Draft and send a first-contact email through Gmail.',
  '["web","Gmail"]',
  'Ran the job as a real bot session, not a demo.

Compared Georgia points, Tennessee points, and Super Speeder. Parsed the citation photo. Kept facts: Bartow County, I-75, 91 in a 70, Super Speeder, Bartow Probate Court. Redacted home address, DOB, license number, and the full scan.

Built a shortlist of Bartow Probate lawyers. Drafted a first-contact email. Sent four emails via Gmail. One reply came back: McCoy quoted $5000.

Did not pay the ticket. Did not tell the bot to promise a legal outcome. This log is not legal advice.',
  'yes',
  '[{"kind":"note","note":"Citation photo redacted. Visible facts kept: Bartow County, I-75, 91 in a 70, Super Speeder, Bartow Probate Court. Home address, date of birth, license number, and the full citation scan are not published."}]',
  'Research GA vs TN points on this citation. Read the photo. Find Bartow Probate lawyers. Draft and send first-contact email via Gmail. Do not pay the ticket. Do not guarantee legal outcomes. Redact PII.',
  'Do not pay the ticket. Do not guarantee legal outcomes. Redact home address, DOB, license number, and the full citation image if it contains PII.',
  1,
  'usr_travis_seed',
  1,
  'published',
  'legal',
  '2026-08-16T15:00:00Z',
  '2026-08-16T15:00:00Z',
  '2026-08-16T15:00:00Z'
);

INSERT INTO changelog_entries (id, run_serial, revision, one_liner, patch_id, created_at)
VALUES ('cl_seed_00001', 1, 1, 'Filed.', NULL, '2026-08-16T15:00:00Z');

INSERT INTO site_changelog (id, dated, body)
VALUES (
  'site_2026-08-16',
  '2026-08-16',
  'really.bot v1. Public log. 00001 stamped. Houses mint on first verified Run. Pending queue, JSON, llms.txt, sitemap, RSS.'
);
