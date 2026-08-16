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
  'Filed as a prompt under House 001. This serial is the job to copy, not a case file for one state.

Read any citation. Infer issuing state, court, and venue from the ticket. Find lawyers who actually appear in that court. Draft a first-contact email asking for representation. Send it through Gmail and correspond with whoever replies.

Did not pay the ticket. Did not tell the bot to promise a legal outcome. This log is not legal advice.',
  'yes',
  '[{"kind":"note","note":"Seed prompt filing. Copy and run against a citation photo. Infer state and venue from the ticket. Do not pay. Do not guarantee outcomes. Redact PII."}]',
  'Read the citation photo. Infer the issuing state, court, and venue from the ticket — do not assume a state. Find lawyers who actually appear in that venue. Draft a first-contact email asking for representation and the fee. Send it through Gmail. Correspond with whoever replies. Do not pay the ticket. Do not guarantee legal outcomes. Redact PII.',
  'Do not pay the ticket. Do not guarantee legal outcomes. Do not assume a state, court, or venue — read them from the citation. Redact home address, DOB, license number, and the full citation image if it contains PII.',
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

INSERT INTO runs (
  id, serial, title, job_text, connectors, what_happened, would_run_again, evidence_json,
  prompt_text, constraints, house_number, user_id, revision, status, sensitive_kind,
  published_at, created_at, updated_at
) VALUES (
  'run_seed_00002',
  2,
  'Run Lighthouse on a live site and report the actual Core Web Vitals failures',
  'Run Lighthouse on a live site and report the actual Core Web Vitals failures.',
  '["Lighthouse","web"]',
  'Filed as a prompt under House 001. This serial is the job to copy, not a finished Lighthouse audit.',
  'yes',
  '[{"kind":"note","note":"Seed prompt filing. Copy and run against a live URL. Not an executed Lighthouse audit."}]',
  'Run Lighthouse on a live site. Mobile and desktop. Report FCP, LCP, INP or TBT, CLS, and Speed Index. List only the audits that actually fail Core Web Vitals thresholds. Do not invent scores. Do not change production.',
  'Do not invent scores. Do not change production. Report failures that actually failed, not a generic checklist.',
  1,
  'usr_travis_seed',
  1,
  'published',
  NULL,
  '2026-08-16T18:10:00Z',
  '2026-08-16T18:10:00Z',
  '2026-08-16T18:10:00Z'
);

INSERT INTO changelog_entries (id, run_serial, revision, one_liner, patch_id, created_at)
VALUES ('cl_seed_00002', 2, 1, 'Filed.', NULL, '2026-08-16T18:10:00Z');

INSERT INTO runs (
  id, serial, title, job_text, connectors, what_happened, would_run_again, evidence_json,
  prompt_text, constraints, house_number, user_id, revision, status, sensitive_kind,
  published_at, created_at, updated_at
) VALUES (
  'run_seed_00003',
  3,
  'Build a subscription list from Gmail receipts',
  'Build a subscription list from Gmail receipts.',
  '["Gmail"]',
  'Filed as a prompt under House 001. This serial is the job to copy, not a finished inbox audit.',
  'yes',
  '[{"kind":"note","note":"Seed prompt filing. Copy and run against connected Gmail. Do not cancel anything. Redact PII."}]',
  'Search Gmail for receipts, invoices, and renewals. Build a list of recurring subscriptions. Flag forgotten or unused ones. Do not cancel anything without asking. Redact card numbers, home address, and one-time personal purchases.',
  'Ask before canceling. Do not spend. Redact card numbers, home address, and one-time personal purchases.',
  1,
  'usr_travis_seed',
  1,
  'published',
  'financial',
  '2026-08-16T18:12:00Z',
  '2026-08-16T18:12:00Z',
  '2026-08-16T18:12:00Z'
);

INSERT INTO changelog_entries (id, run_serial, revision, one_liner, patch_id, created_at)
VALUES ('cl_seed_00003', 3, 1, 'Filed.', NULL, '2026-08-16T18:12:00Z');

INSERT INTO site_changelog (id, dated, body)
VALUES (
  'site_2026-08-16',
  '2026-08-16',
  'really.bot v1. Public log. 00001 stamped. Houses mint on first verified Run. Pending queue, JSON, llms.txt, sitemap, RSS.'
);
