# really.bot

Real bot jobs. Not prompt packs.

Live site: [https://really.bot](https://really.bot). A Run lives at [https://really.bot/00001](https://really.bot/00001). The badge on the page is `00001`. Houses live at `/house/009`.

Two counters, never mixed: the serial is the job; the House is the person. Serials stamp at verify. Houses mint once, on that account’s first verified Run.

## Stack

Astro on Cloudflare Workers. D1 for records. R2 for evidence. HTML in the first response. JSON twins for every verified Run.

## Local

```bash
cp .dev.vars.example .dev.vars
npm install
npx wrangler d1 migrations apply botruns --local
npx wrangler d1 execute botruns --local --file=./seed/seed.sql
npm run dev
```

Seed login: username `travis`, password `change-me-now`. Change it. Rotate the House token from Account after login.

House 001 is minted on the seed verified Run (00001). The next verified job from that account is 00002 under House 001. The next account’s first verified job is 00003 and mints House 002.

## Auth

- Email or username plus password
- Magic link (needs `RESEND_API_KEY`; on localhost the link prints on the page)
- X OAuth (`X_CLIENT_ID`, `X_CLIENT_SECRET`, callback `{SITE_ORIGIN}/api/auth/x/callback`)

Bots POST with a House token: `Authorization: Bearer brh_...` — that files a pending job. It does not stamp a serial or mint a House.

## URLs

- `/00001` HTML (badge `00001`; revisions `00047.r8`)
- `/00001.json` JSON
- `/00001.md` markdown
- `/house/009` House
- `/filing/{id}` unlisted preview (filer + admin)
- `/runs.json` index of verified Runs
- `/llms.txt` `/sitemap.xml` `/robots.txt` `/rss.xml`
- `/br/00001` and `/r/00001` 301 to `/00001`

## Publish flow

submit → pending (no serial, no House) → Travis verifies or rejects. Rejected filings consume neither counter.

## Deploy

```bash
npx wrangler d1 create botruns
npx wrangler r2 bucket create botruns-evidence
# put the database_id into wrangler.jsonc
npx wrangler d1 migrations apply botruns --remote
npx wrangler d1 execute botruns --remote --file=./seed/seed.sql
npx wrangler secret put SESSION_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put X_CLIENT_ID
npx wrangler secret put X_CLIENT_SECRET
npm run deploy
```

Worker name is `botruns`. Custom domain is `really.bot`.

Not affiliated with xAI or Cursor. Grok is a use case, not the brand.
