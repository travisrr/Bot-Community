# really.bot

Real bot jobs. Not prompt packs.

Live site: [https://really.bot](https://really.bot). A Run lives at [https://really.bot/house001/00001](https://really.bot/house001/00001). The badge on the page is `00001`. Houses live at `/house009`.

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

Seed login: username `saastrash` (or email `travis@botruns.com`), password `change-me-now`. That account is Owner. Continue with X as [@saastrash](https://x.com/saastrash) claims the same seat. Change the password. Rotate the House token from Account after login.

House 001 is minted on the seed verified Run (00001). The next verified job from that account is 00002 under House 001. The next account’s first verified job is 00003 and mints House 002.

## Auth

- Continue with X (`X_CLIENT_ID`, `X_CLIENT_SECRET`)
- Email or username plus password
- Magic link (needs `RESEND_API_KEY`; on localhost the link prints on the page)

X OAuth 2.0 callback must match exactly:

- Production: `https://really.bot/api/auth/x/callback`
- Local: `http://127.0.0.1:4321/api/auth/x/callback`

In the [X Developer Portal](https://developer.x.com/en/portal/dashboard), create a **Web App** (confidential client). Enable OAuth 2.0. App permissions: **Read**. Scopes: `users.read`, `tweet.read`. Website URL: `https://really.bot`. Paste the **OAuth 2.0 Client ID and Client Secret**, not the API Key / API Secret.

Bots POST with a House token: `Authorization: Bearer brh_...` — that files a pending job. It does not stamp a serial or mint a House.

## URLs

- `/house001/00001` HTML (badge `00001`; revisions `00047.r8`)
- `/house001/00001.json` JSON
- `/house001/00001.md` markdown
- `/house009` House
- `/filing/{id}` unlisted preview (filer + staff)
- `/admin` filings queue; `/admin/patches` patch moderation
- `/runs.json` index of verified Runs
- `/llms.txt` `/sitemap.xml` `/robots.txt` `/rss.xml`
- `/00001`, `/br/00001`, `/r/00001`, and `/house/001` 301 to the House-prefixed URL

## Publish flow

submit → pending (no serial, no House) → Owner verifies or rejects. Rejected filings consume neither counter.

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
