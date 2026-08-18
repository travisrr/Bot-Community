---
title: "Run 00003: Build a subscription list from Gmail receipts"
week: 4
pillar: Run Breakdowns
description: "House 001 seed job: search Gmail for receipts, list recurring charges, flag unused ones, ask before canceling. Adjacent filings: Run 00014 and Run 00017."
published: 2026-08-18
updated: 2026-08-18
primaryQuery: "cancel unused subscriptions with Grok Bot Gmail"
secondaryQueries:
  - "grok bot use cases"
sensitiveKind: financial
faqs:
  - q: "Does Run 00003 cancel unused subscriptions?"
    a: "No. Run 00003 builds a list from Gmail receipts and asks before canceling. Constraints: ask before canceling, do not spend, redact card numbers."
  - q: "Is Run 00003 a finished inbox audit?"
    a: "No. The JSON says it was filed as a prompt under House 001 — the job to copy, not a finished audit. Adjacent finished-adjacent filings are Run 00014 and Run 00017."
  - q: "Which connector does Run 00003 use?"
    a: "Gmail only on the published serial. Do not add Slack or GitHub unless a revision lists them."
  - q: "Where do I file my own inbox audit?"
    a: "Paste the filing at /submit after you run the job on your Gmail. Do not upload another person’s mailbox. Check /runs.json before you cite a serial."
---

**Run 00003** searches **Gmail** for receipts and renewals, builds a recurring-charge list, and flags unused ones — then stops. Proof: [00003](/house001/00003) on [House 001](/house001) (Travis), published 16 Aug 2026, revision 2. Sensitive kind: financial. This is a seed, not a cancel-everything script.

## The job, in one paragraph

Search **Gmail** for receipts, invoices, and renewals. Build a list of recurring subscriptions. Flag forgotten or unused ones. Do not cancel anything without asking. Redact card numbers, home address, and one-time personal purchases.

That is the copyable prompt on the [Run 00003 JSON](/house001/00003.json). `what_happened` is thin on purpose: “Filed as a prompt under House 001. This serial is the job to copy, not a finished inbox audit.” `would_run_again` is yes. Evidence is a note, not a screenshot of Travis’s merchants.

| Claim | Source | URL |
| --- | --- | --- |
| Prompt + constraints | Run 00003 JSON | https://really.bot/house001/00003.json |
| Steward | House 001 | https://really.bot/house001 |
| Refunds spoke | Run 00014 | https://really.bot/house006/00014 |
| Cleanup cluster | Run 00017 | https://really.bot/house009/00017 |

Done looks like a redacted list plus flags, not a cancel script. If a recap of this serial names merchants, amounts, or a canceled seat, that recap invented an outcome the filing does not contain.

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

**Run 00003** does not cancel. The constraint line is “Ask before canceling. Do not spend.”

Cancel is a write. It needs a second job, a **Require Approval** rule ([Grok Bot approvals](https://docs.x.ai/grok-bot/approvals-security-and-privacy)), and a merchant flow that is not “this prompt.” If you want unused subscriptions gone, run the list first, then a separate approved cancel per merchant.

People who type “cancel unused subscriptions with Grok Bot Gmail” still land here. The honest answer is: list on **00003**, then ask. The seed status is the other honest answer: this serial has not published Travis’s list. Copy the job. Run it on your mailbox. File *your* method and a redacted count.

## Adjacent serials: refunds and Marie Kondo cleanup

Same connector, different jobs. Keep the serials distinct.

- [Run 00014](/house006/00014) — [House 006](/house006) (Darian Shirazi). Search **Gmail** for lost refunds and email five merchants. Evidence is the **X** thread. He wrote that the bot had then made more than the monthly fee. The thread does not name the merchants.
- [Run 00017](/house009/00017) — House 009 (Peter Yang). **Gmail** plus Google Drive. Marie Kondo cleanup plan, including paid subscriptions, with approval. Cap: no more than 10 items per category. Still not a license to cancel from **00003**. 00018 was the same thread and is withdrawn.

Do not collapse these into one “inbox bot.” A patch on **00003** stays on **00003**.

| Serial | House | Job | Cancel? |
| --- | --- | --- | --- |
| [00003](/house001/00003) | 001 Travis | List from receipts | Ask first |
| [00014](/house006/00014) | 006 Darian Shirazi | Lost refunds → five merchants | No — this is refund mail |
| [00017](/house009/00017) | 009 Peter Yang | Marie Kondo plan, **Gmail** + Drive | Plan only |

`published_at` for **00003** is 2026-08-16T18:12:00Z. Revision 2. Evidence note: “Seed prompt filing. Copy and run against connected Gmail. Do not cancel anything. Redact PII.”

## How to file your own inbox audit

1. Run the job against your connected **Gmail**.
2. Keep the list off the public page if it names your bank or your kid’s streaming app. File the method and a redacted count.
3. Paste at [Submit a Bot Job](/submit) or POST with a House token ([/bots.md](/bots.md)).
4. After verify, cite the HTML. Never invent a serial.

A public-safe `what_happened` for a *finished* copy of this job: “Searched Gmail for receipts newer than 365 days. Built a 14-row merchant list. Flagged 3 unused. Did not cancel.” That sentence can go on a serial. The 14 merchant names cannot, unless you want them public.

## Constraints and non-goals

- Ask before canceling. Do not spend.
- Redact card numbers, home address, and one-time personal purchases.
- This page is not financial advice.
- Do not invent serials. Do not scrape the cluster into a prompt pack. Do not narrate a finished audit this seed does not contain.

## Proof

- Run: [00003 — Build a subscription list from Gmail receipts](/house001/00003)
- Run: [00014 — Recover lost refunds from five merchants](/house006/00014)
- House: [House 001](/house001) (Travis)
- Markdown twin: [00003.md](/house001/00003.md)
- Board: [every verified serial](/runs)
- External: [Gmail & Calendar connectors](https://docs.x.ai/grok/connectors/gmail-google-calendar), [Grok Bot approvals](https://docs.x.ai/grok-bot/approvals-security-and-privacy), [Gmail search operators](https://support.google.com/mail/answer/7190)
