INSERT INTO users (
  id, email, username, display_name, password_hash, x_handle, house_number, house_claimed_at,
  house_token_hash, role, created_at
) VALUES (
  'usr_travis_seed',
  NULL,
  'saastrash',
  'Travis',
  'pbkdf2$sha256$100000$JYHU8rgiEy7V_jkvS9aFeA$FK5LuEZ3muwuhv8bOcBbeeFTR1ATfNg6XlX4MCiPlW0',
  'saastrash',
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
  'Find legal representation for a traffic citation and email them',
  'Read the citation. Identify the issuing state, court, and venue from the ticket itself. Find lawyers who actually appear in that court. Draft a first-contact email asking for representation, send it through Gmail, and correspond with whoever replies.',
  '["web","Gmail"]',
  'Travis had a citation in a state that was not on his license. Grok Bot read the ticket photo, found lawyers who actually appear in that court, wrote a first-contact email in his voice, and sent it from connected Gmail.

The published version is written so the next person can use it for any citation in any state, instead of guessing from one person''s facts. It is not a case file for one state.

Did not pay the ticket. Did not tell the bot to promise a legal outcome. This log is not legal advice.',
  'yes',
  '[{"kind":"note","note":"Finished House 001 job as recorded on /about: Travis had a citation in a state not on his license; Grok Bot read the photo, found venue lawyers, and sent from connected Gmail. Published copy stays state-neutral. Do not pay. Do not guarantee outcomes. Redact PII."},{"kind":"url","href":"https://really.bot/about","note":"Public site copy of the finished 00001 job, then the state-neutral rewrite."}]',
  'You are helping with one finished traffic-citation job. Read the citation photo. Infer the issuing state, court, and venue from the ticket — do not assume a state. Use web to find lawyers who actually appear in that venue, not a national ads list. Draft a first-contact email in the human''s voice asking for representation and the fee. Require approval, then send it through connected Gmail. Correspond with whoever replies. Do not pay the ticket. Do not guarantee legal outcomes. Redact home address, DOB, license number, and the full citation image if it contains PII. Done looks like: venue named from the ticket, a short list of lawyers who appear there, and a sent first-contact email from Gmail.',
  'Do not pay the ticket. Do not guarantee legal outcomes. Do not assume a state, court, or venue — read them from the citation. Redact home address, DOB, license number, and the full citation image if it contains PII.',
  1,
  'usr_travis_seed',
  4,
  'published',
  'legal',
  '2026-08-16T15:00:00Z',
  '2026-08-16T15:00:00Z',
  '2026-08-16T15:00:00Z'
);

INSERT INTO changelog_entries (id, run_serial, revision, one_liner, patch_id, created_at)
VALUES ('cl_seed_00001', 1, 1, 'Filed.', NULL, '2026-08-16T15:00:00Z');
INSERT INTO changelog_entries (id, run_serial, revision, one_liner, patch_id, created_at)
VALUES ('cl_seed_00001_r2', 1, 2, 'State-neutral: find representation, then email them.', NULL, '2026-08-16T18:00:00Z');
INSERT INTO changelog_entries (id, run_serial, revision, one_liner, patch_id, created_at)
VALUES ('cl_seed_00001_r3', 1, 3, 'Daily pass: stronger copyable prompt from the filing.', NULL, '2026-08-18T10:00:00Z');
INSERT INTO changelog_entries (id, run_serial, revision, one_liner, patch_id, created_at)
VALUES ('cl_thicken_00001', 1, 4, 'Owner thicken: more from /about and the published filing.', NULL, '2026-08-18T18:37:00Z');

INSERT INTO runs (
  id, serial, title, job_text, connectors, what_happened, would_run_again, evidence_json,
  prompt_text, constraints, house_number, user_id, revision, status, sensitive_kind,
  published_at, created_at, updated_at
) VALUES (
  'run_seed_00002',
  2,
  'Run Lighthouse on a live site and report the actual Core Web Vitals failures',
  'Run Lighthouse on a live site. Report FCP, LCP, INP or TBT, CLS, and Speed Index on mobile and desktop. List only the audits that actually fail Core Web Vitals thresholds.',
  '["Lighthouse","web"]',
  'Filed as a prompt under House 001. This serial is the job to copy, not a finished Lighthouse audit of a named production URL.',
  'yes',
  '[{"kind":"note","note":"Seed prompt filing. Copy and run against a live URL. Not an executed Lighthouse audit."}]',
  'Run Lighthouse on a live site the human names. Use the Lighthouse connector and web. Collect mobile and desktop. Report FCP, LCP, INP or TBT, CLS, and Speed Index. List only the audits that actually fail Core Web Vitals thresholds. Do not invent scores. Do not change production. Done looks like a short failure list with the real numbers from this run, not a generic checklist.',
  'Do not invent scores. Do not change production. Report failures that actually failed, not a generic checklist.',
  1,
  'usr_travis_seed',
  3,
  'published',
  NULL,
  '2026-08-16T18:10:00Z',
  '2026-08-16T18:10:00Z',
  '2026-08-16T18:10:00Z'
);

INSERT INTO changelog_entries (id, run_serial, revision, one_liner, patch_id, created_at)
VALUES ('cl_seed_00002', 2, 1, 'Filed.', NULL, '2026-08-16T18:10:00Z');
INSERT INTO changelog_entries (id, run_serial, revision, one_liner, patch_id, created_at)
VALUES ('cl_seed_00002_r2', 2, 2, 'Daily pass: stronger copyable prompt from the filing.', NULL, '2026-08-18T10:00:00Z');
INSERT INTO changelog_entries (id, run_serial, revision, one_liner, patch_id, created_at)
VALUES ('cl_thicken_00002', 2, 3, 'Owner thicken: stronger copyable prompt from the seed filing.', NULL, '2026-08-18T18:37:00Z');

INSERT INTO runs (
  id, serial, title, job_text, connectors, what_happened, would_run_again, evidence_json,
  prompt_text, constraints, house_number, user_id, revision, status, sensitive_kind,
  published_at, created_at, updated_at
) VALUES (
  'run_seed_00003',
  3,
  'Build a subscription list from Gmail receipts',
  'Search Gmail for receipts, invoices, and renewals. Build a list of recurring subscriptions. Flag forgotten or unused ones. Do not cancel anything without asking.',
  '["Gmail"]',
  'Filed as a prompt under House 001. This serial is the job to copy, not a finished inbox audit.',
  'yes',
  '[{"kind":"note","note":"Seed prompt filing. Copy and run against connected Gmail. Do not cancel anything. Redact PII."}]',
  'Search connected Gmail for receipts, invoices, and renewals. Build a list of recurring subscriptions, one row per merchant and cadence. Flag forgotten or unused ones and say why from the mail. Do not cancel, unsubscribe, or spend without asking. Redact card numbers, home address, and one-time personal purchases. Done looks like a redacted list plus flags, not a cancel script.',
  'Ask before canceling. Do not spend. Redact card numbers, home address, and one-time personal purchases.',
  1,
  'usr_travis_seed',
  2,
  'published',
  'financial',
  '2026-08-16T18:12:00Z',
  '2026-08-16T18:12:00Z',
  '2026-08-16T18:12:00Z'
);

INSERT INTO changelog_entries (id, run_serial, revision, one_liner, patch_id, created_at)
VALUES ('cl_seed_00003', 3, 1, 'Filed.', NULL, '2026-08-16T18:12:00Z');
INSERT INTO changelog_entries (id, run_serial, revision, one_liner, patch_id, created_at)
VALUES ('cl_thicken_00003', 3, 2, 'Owner thicken: stronger copyable prompt from the seed filing.', NULL, '2026-08-18T18:37:00Z');

INSERT INTO site_changelog (id, dated, body)
VALUES (
  'site_2026-08-16',
  '2026-08-16',
  'really.bot v1. Public log. 00001 stamped. Houses mint on first verified Run. Pending queue, JSON, llms.txt, sitemap, RSS.'
);
