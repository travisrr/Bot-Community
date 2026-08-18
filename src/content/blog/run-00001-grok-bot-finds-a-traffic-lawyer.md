---
title: "Grok Bot finds a traffic lawyer and sends the first email from Gmail"
week: 2
pillar: Run Breakdowns
description: "Live seed job: read a citation, infer venue, find lawyers who appear in that court, send from Gmail. House 001. Not legal advice."
published: 2026-08-18
primaryQuery: "grok bot legal research email lawyer Gmail"
secondaryQueries:
  - "grok bot use cases"
  - "how to connect Grok Bot to Gmail"
sensitiveKind: legal
faqs:
  - q: "What did Run 00001 actually do?"
    a: "Run 00001 is the seed legal job on House 001: read a citation, infer state and venue from the ticket, find lawyers who appear in that court, draft a first-contact email, and send it through Gmail."
  - q: "Is Run 00001 legal advice?"
    a: "No. The serial says it is not legal advice. Constraints: do not pay the ticket, do not guarantee outcomes, do not assume a state."
  - q: "Which connectors fired on Run 00001?"
    a: "The published JSON lists web and Gmail. Chrome is the browser when the computer must click; this filing names web, not Chrome."
  - q: "Would they run Run 00001 again?"
    a: "Yes. would_run_again is yes on the Run 00001 JSON. The published version is state-neutral so the next person can copy the job, not one state’s facts."
---

**Run 00001** is the first stamped job on really.bot: find legal representation for a traffic citation and email them from **Gmail**. Proof: [00001](/house001/00001) on [House 001](/house001) (Travis), published 16 Aug 2026. This breakdown is for people who need a verified Grok Bot use case, not a lawyer.

## The job, in one paragraph

Read the citation. Identify issuing state, court, and venue from the ticket itself. Find lawyers who actually appear in that court. Draft a first-contact email asking for representation, send it through **Gmail**, and correspond with whoever replies.

That is the `job_text` on the [Run 00001 JSON](/house001/00001.json). [How it works](/about) records the original: Travis had a citation in a state that was not on his license; **Grok Bot** read the ticket photo and sent from connected **Gmail**. The published serial stays state-neutral. Revision 4 records that finished job on `what_happened` and still says it is not a case file for one state.

| Claim | Source | URL |
| --- | --- | --- |
| Job + constraints | Run 00001 JSON | https://really.bot/house001/00001.json |
| Steward House 001 (Travis) | House 001 | https://really.bot/house001 |
| Original narrative | How it works | https://really.bot/about |
| Adjacent Gmail job | Run 00003 | https://really.bot/house001/00003 |

## Connectors that actually fired

The published connectors are **web** and **Gmail**. That is the list on the serial. Do not add **Chrome**, **Calendar**, or **Slack** unless a later revision puts them there.

1. Connect **Gmail** once under **Settings → Plugins** ([Grok Bot computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)). Installed connectors are account-wide.
2. Give the bot the citation photo. Instruct it to infer state, court, and venue from the ticket — do not assume a state.
3. Use **web** to find lawyers who appear in that venue, not a national ads list.
4. Draft the first-contact email. Require approval before send. Official Gmail scopes are documented on [Gmail & Calendar connectors](https://docs.x.ai/grok/connectors/gmail-google-calendar): read, then modify, then send.
5. Send from the connected **Gmail** identity. Correspond with whoever replies. Redact home address, DOB, license number, and the full citation image if it contains PII.

## Constraints: do not pay, do not promise

Copied from the serial, not invented:

- Do not pay the ticket.
- Do not guarantee legal outcomes.
- Do not assume a state, court, or venue — read them from the citation.
- Redact home address, DOB, license number, and the full citation image if it contains PII.

This page is not legal advice. really.bot does not send mail from the serial page.

## Copyable prompt vs this log

The copyable prompt on **Run 00001** is the owner-thickened version of the filing (revision 4). It is the job to paste into **Grok Bot**, not a dump of Travis’s ticket.

A prompt pack would stop at “email a lawyer.” This log names the serial, the House, the connectors, the veto window, and what was not done. If you only needed a sentence, you would not need [00001.md](/house001/00001.md).

## What a patch would have to beat

A patch stays on **00001**. It does not mint `00099`.

Evidence has to beat the published result: a screenshot, an output, or a public URL plus a note. Empty “this is better” is rejected. The original filer has 24 hours to veto. QA for thin Runs is [qa.md](/qa.md) — a patch that attaches a finished venue list and a redacted sent-mail header would still be a real upgrade.

Changelog on the serial: revision 1 “Filed.”; revision 2 “State-neutral: find representation, then email them.”; revision 3 “Daily pass: stronger copyable prompt from the filing.”; revision 4 “Owner thicken: more from /about and the published filing.” `published_at` is 2026-08-16T15:00:00Z. Steward display name: Travis. Sensitive kind: legal.

The copyable prompt, shortened only for this page: read the citation photo; infer issuing state, court, and venue from the ticket; find lawyers who appear in that venue; draft a first-contact email asking for representation and the fee; send through **Gmail**; correspond with whoever replies. Full text is on the [JSON](/house001/00001.json) and the [markdown twin](/house001/00001.md).

## Proof

- Run: [00001 — Find legal representation for a traffic citation and email them](/house001/00001)
- Run: [00003 — Build a subscription list from Gmail receipts](/house001/00003)
- House: [House 001](/house001) (Travis)
- Markdown twin: [00001.md](/house001/00001.md)
- Board: [How it works](/about)
- External: [Grok Bot computer and apps](https://docs.x.ai/grok-bot/computer-and-apps), [Gmail & Calendar connectors](https://docs.x.ai/grok/connectors/gmail-google-calendar)
