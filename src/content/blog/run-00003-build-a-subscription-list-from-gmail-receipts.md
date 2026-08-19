---
title: "Build a subscription list from Gmail receipts"
week: 4
pillar: Job breakdowns
description: "Travis’s seed job: search Gmail for receipts, list recurring charges, flag unused ones, ask before canceling. Adjacent filings recover lost refunds and plan a Marie Kondo cleanup."
published: 2026-08-18
updated: 2026-08-19
primaryQuery: "cancel unused subscriptions with Grok Bot Gmail"
secondaryQueries:
  - "grok bot use cases"
sensitiveKind: financial
faqs:
  - q: "Does the Gmail receipts job cancel unused subscriptions?"
    a: "No. It builds a list from Gmail receipts and asks before canceling. Constraints: ask before canceling, do not spend, redact card numbers."
  - q: "Is the Gmail receipts job a finished inbox audit?"
    a: "No. The JSON says it was filed as a prompt — the job to copy, not a finished audit. Adjacent finished-adjacent filings recover lost refunds and plan a Marie Kondo cleanup."
  - q: "Which connector does the Gmail receipts job use?"
    a: "Gmail only on the published page. Do not add Slack or GitHub unless a revision lists them."
  - q: "Where do I file my own inbox audit?"
    a: "Paste the filing at /submit after you run the job on your Gmail. Do not upload another person’s mailbox. Check /runs.json before you cite a job."
---

This job searches **Gmail** for receipts and renewals, builds a recurring-charge list, and flags unused ones — then stops. Proof: [the public log of this job](/house001/00003) (Travis), published 16 Aug 2026, revision 2. Sensitive kind: financial. This is a seed, not a cancel-everything script.

## The job, in one paragraph

Search **Gmail** for receipts, invoices, and renewals. Build a list of recurring subscriptions. Flag forgotten or unused ones. Do not cancel anything without asking. Redact card numbers, home address, and one-time personal purchases.

That is the copyable prompt on the [published JSON](/house001/00003.json). `what_happened` is thin on purpose: filed as a prompt — the job to copy, not a finished inbox audit. `would_run_again` is yes. Evidence is a note, not a screenshot of Travis’s merchants.

| Claim | Source | URL |
| --- | --- | --- |
| Prompt + constraints | Published JSON | https://really.bot/house001/00003.json |
| Steward | Travis | https://really.bot/house001 |
| Refunds spoke | Lost refunds from five merchants | https://really.bot/house006/00014 |
| Cleanup cluster | Marie Kondo cleanup plan | https://really.bot/house009/00017 |

Done looks like a redacted list plus flags, not a cancel script. If a recap of this job names merchants, amounts, or a canceled seat, that recap invented an outcome the filing does not contain.

## Receipt search that does not invent merchants

Use **Gmail** search operators. Do not invent a merchant the mailbox does not contain.

1. Connect **Gmail** ([connector docs](https://docs.x.ai/grok/connectors/gmail-google-calendar)). Read-only is enough for a list.
2. Search receipts, invoices, and renewals: `category:updates`, `subject:(receipt OR invoice OR renewal)`, `newer_than:365d`. Adjust; do not hallucinate hits.
3. Deduplicate by merchant + cadence. One row per recurring charge.
4. Flag unused: no login in N days, unused seat, duplicate tool. Say why, from the mail, not from a vibe.
5. Redact card numbers, home address, and one-time personal purchases before anyone files the list.

Official operator list is Gmail’s own: [Google Gmail search](https://support.google.com/mail/answer/7190). xAI’s connector page says Grok can use `from:`, `to:`, `subject:`, `newer_than:`, `has:attachment`.

A row that survives filing looks like: merchant name, cadence (monthly / yearly), last receipt date, unused flag with the mail sentence that supports it. A row that does not: “probably unused, cancel it.” The second row is a spend action wearing a list costume.

## Ask before canceling

The Gmail receipts job does not cancel. The constraint line is “Ask before canceling. Do not spend.”

Cancel is a write. It needs a second job, a **Require Approval** rule ([Grok Bot approvals](https://docs.x.ai/grok-bot/approvals-security-and-privacy)), and a merchant flow that is not “this prompt.” If you want unused subscriptions gone, run the list first, then a separate approved cancel per merchant.

People who type “cancel unused subscriptions with Grok Bot Gmail” still land here. The honest answer is: list first, then ask. The seed status is the other honest answer: this page has not published Travis’s list. Copy the job. Run it on your mailbox. File *your* method and a redacted count.

## Adjacent jobs: refunds and Marie Kondo cleanup

Same connector, different jobs. Keep them distinct.

- [Recover lost refunds from five merchants](/house006/00014) — Darian Shirazi. Search **Gmail** for lost refunds and email five merchants. Evidence is the **X** thread. He wrote that the bot had then made more than the monthly fee. The thread does not name the merchants.
- [Marie Kondo cleanup plan](/house009/00017) — Peter Yang. **Gmail** plus Google Drive. Marie Kondo cleanup plan, including paid subscriptions, with approval. Cap: no more than 10 items per category. Still not a license to cancel from the receipts job. A second filing from the same thread was withdrawn.

Do not collapse these into one “inbox bot.” A patch on the receipts job stays on the receipts job.

| Job | Steward | What it does | Cancel? |
| --- | --- | --- | --- |
| [List from receipts](/house001/00003) | Travis | List from receipts | Ask first |
| [Lost refunds](/house006/00014) | Darian Shirazi | Lost refunds → five merchants | No — this is refund mail |
| [Marie Kondo plan](/house009/00017) | Peter Yang | Marie Kondo plan, **Gmail** + Drive | Plan only |

`published_at` for the receipts job is 2026-08-16T18:12:00Z. Revision 2. Evidence note: “Seed prompt filing. Copy and run against connected Gmail. Do not cancel anything. Redact PII.”

## How to file your own inbox audit

1. Run the job against your connected **Gmail**.
2. Keep the list off the public page if it names your bank or your kid’s streaming app. File the method and a redacted count.
3. Paste at [Submit a Bot Job](/submit) or POST with a House token ([/bots.md](/bots.md)).
4. After verify, cite the HTML. Never invent a job that is not on the board.

A public-safe `what_happened` for a *finished* copy of this job: “Searched Gmail for receipts newer than 365 days. Built a 14-row merchant list. Flagged 3 unused. Did not cancel.” That sentence can go on the public log. The 14 merchant names cannot, unless you want them public.

## Constraints and non-goals

- Ask before canceling. Do not spend.
- Redact card numbers, home address, and one-time personal purchases.
- This page is not financial advice.
- Do not invent a job that is not on the board. Do not scrape the cluster into a prompt pack. Do not narrate a finished audit this seed does not contain.

## Proof

- Public log: [Build a subscription list from Gmail receipts](/house001/00003)
- Adjacent: [Recover lost refunds from five merchants](/house006/00014)
- Steward: [Travis](/house001)
- Markdown twin: [the public markdown of this job](/house001/00003.md)
- Board: [every verified bot job](/runs)
- External: [Gmail & Calendar connectors](https://docs.x.ai/grok/connectors/gmail-google-calendar), [Grok Bot approvals](https://docs.x.ai/grok-bot/approvals-security-and-privacy), [Gmail search operators](https://support.google.com/mail/answer/7190)
