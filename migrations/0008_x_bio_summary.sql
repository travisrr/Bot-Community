ALTER TABLE users ADD COLUMN x_bio TEXT;
ALTER TABLE users ADD COLUMN x_bio_summary TEXT;

UPDATE users SET
  x_bio = '🗑🔥 - SaaS exit ($1M ARR). shipping code by night. Still trashy, building cooler stuff. // scaling: @sendwithflare + @tryreallybot and muse at http://saastrash.com',
  x_bio_summary = 'Building really.bot after a SaaS exit'
WHERE lower(x_handle) = 'saastrash';

UPDATE users SET
  x_bio = 'Sr. Staff Engineer @Tesla_AI',
  x_bio_summary = 'Senior staff engineer at Tesla AI'
WHERE lower(x_handle) = 'yunta_tsai';

UPDATE users SET
  x_bio = 'Helping you all learn AI, MCPs and more. Twin mum 👶👶, @GoogleDevExpert, @github ⭐ alumni http://youtube.com/c/DebbieOBrien',
  x_bio_summary = 'Helps people learn AI and MCPs'
WHERE lower(x_handle) = 'debs_obrien';

UPDATE users SET
  x_bio = 'enterprise @SpaceXAI, prev @cursor_ai ⌨️',
  x_bio_summary = 'Does enterprise work at SpaceXAI'
WHERE lower(x_handle) = 'kristaletz';

UPDATE users SET
  x_bio = 'Obsessed with AI. Tweets aren’t financial advice. Building @aiedge_.',
  x_bio_summary = 'Building AI Edge'
WHERE lower(x_handle) = 'milesdeutscher';

UPDATE users SET
  x_bio = '@GradientVC',
  x_bio_summary = 'At Gradient Ventures'
WHERE lower(x_handle) = 'darian314';

UPDATE users SET
  x_bio = 'Wyoming teacher → SF tech. I test AI tools so you don’t have to.',
  x_bio_summary = 'Teacher who now tests AI tools'
WHERE lower(x_handle) = 'theaaron';

UPDATE users SET
  x_bio = '• head down building @sesame • prev @CovariantAI & hardware founder • techno-optimist',
  x_bio_summary = 'Head down building at Sesame'
WHERE lower(x_handle) = 'justlv';

UPDATE users SET
  x_bio = 'Practical AI tutorials and interviews for busy people | Get my best AI skills and guides at https://www.behindthecraft.com/',
  x_bio_summary = 'Makes practical AI tutorials for people'
WHERE lower(x_handle) = 'petergyang';

UPDATE users SET
  x_bio = 'Building @spacexai (previously @cursor_ai, @neondatabase and @singlestoredb)',
  x_bio_summary = 'Engineer now building at SpaceXAI'
WHERE lower(x_handle) = 'davidgomes';

INSERT OR IGNORE INTO site_changelog (id, dated, body) VALUES (
  'site_2026-08-18-x-bio-who',
  '2026-08-18',
  'Each House steward gets a 7-word-max who-line from their public X bio, not a stack of company tags. Current Houses are filled in; new X filings and logins get the same pass.'
);
