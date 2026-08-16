# really.bot

Real bot jobs. Not prompt packs.

Live site: [https://really.bot](https://really.bot). A Run lives at [https://really.bot/house001/00001](https://really.bot/house001/00001). The badge on the page is `00001`. Houses live at `/house009`.

Two counters, never mixed: the serial is the job; the House is the person. Serials stamp at verify. Houses mint once, on that account’s first verified Run.

The stamper is public. The counters are not. Anyone can run a Worker that stamps numbers. They cannot spin up `00001`, House 001, or a board people already file on. The grab is the record, not the repo.

PRs welcome. Travis reviews. Same as the board: evidence or it does not merge. A PR is not a patch on `00047`. File jobs on really.bot.

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

Seed login: username `saastrash`, password `change-me-now`. That account is Owner. Continue with X as [@saastrash](https://x.com/saastrash) claims the same seat. Change the password. Rotate the House token from Account after login.

House 001 is minted on the seed verified Run (00001). The next verified job from that account is 00002 under House 001. The next account’s first verified job is 00003 and mints House 002. Those numbers are local. They are not the board.

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

## Your own Worker

Create your own D1 and R2. Put those names and the new `database_id` in `wrangler.jsonc`. Do not point a personal Worker at the production bindings in this file. Secrets stay in Wrangler, never in a PR.

```bash
npx wrangler d1 create your-board
npx wrangler r2 bucket create your-board-evidence
# put your database_id into wrangler.jsonc
npx wrangler d1 migrations apply your-board --remote
npx wrangler d1 execute your-board --remote --file=./seed/seed.sql
npx wrangler secret put SESSION_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put X_CLIENT_ID
npx wrangler secret put X_CLIENT_SECRET
npm run deploy
```

You get a stamper. You get your own counters. You do not get this board.

The live board is Worker `botruns` at `really.bot`. That deploy is Travis’s.

Not affiliated with xAI or Cursor. Grok is a use case, not the brand.
