---
title: "Bot job 00001: Grok Bot finds a traffic lawyer and sends the first email from Gmail"
week: 2
pillar: Job breakdowns
description: "Travis’s finished House 001 job: Grok Bot reads a citation, finds lawyers who appear in that court, and sends the first email from Gmail. Not legal advice."
published: 2026-08-18
updated: 2026-08-18
primaryQuery: "grok bot legal research email lawyer Gmail"
secondaryQueries:
  - "grok bot use cases"
  - "how to connect Grok Bot to Gmail"
sensitiveKind: legal
faqs:
  - q: "What did bot job 00001 actually do?"
    a: "Bot job 00001 is the finished legal job on House 001: read a citation, infer state and venue from the ticket, find lawyers who appear in that court, draft a first-contact email, and send it through Gmail."
  - q: "Is bot job 00001 legal advice?"
    a: "No. The serial says it is not legal advice. Constraints: do not pay the ticket, do not guarantee outcomes, do not assume a state."
  - q: "Which connectors fired on bot job 00001?"
    a: "The published JSON lists web and Gmail. Chrome is the browser when the computer must click; this filing names web, not Chrome."
  - q: "Would they run bot job 00001 again?"
    a: "Yes. would_run_again is yes on the bot job 00001 JSON. The published version is state-neutral so the next person can copy the job, not one state’s facts."
---

**Bot job 00001** is the first stamped job on really.bot: find legal representation for a traffic citation and email them from **Gmail**. Proof: [00001](/house001/00001) on [House 001](/house001) (Travis), published 16 Aug 2026, revision 4. This breakdown is for people who need a verified **Grok Bot** use case, not a lawyer.

## The job, in one paragraph

Read the citation. Identify issuing state, court, and venue from the ticket itself. Find lawyers who actually appear in that court. Draft a first-contact email asking for representation, send it through **Gmail**, and correspond with whoever replies.

That is the `job_text` on the [bot job 00001 JSON](/house001/00001.json). [How it works](/about) records the original: Travis had a citation in a state that was not on his license; **Grok Bot** read the ticket photo and sent from connected **Gmail**. The published serial stays state-neutral. Revision 4 records that finished job on `what_happened` and still says it is not a case file for one state.

| Claim | Source | URL |
| --- | --- | --- |
| Job + constraints | bot job 00001 JSON | https://really.bot/house001/00001.json |
| Steward House 001 (Travis) | House 001 | https://really.bot/house001 |
| Original narrative | How it works | https://really.bot/about |
| Adjacent Gmail job | bot job 00003 | https://really.bot/house001/00003 |

The copyable prompt on the serial is the version you paste into **Grok Bot**. It tells the bot to infer venue from the ticket, use web to find lawyers who appear there (not a national ads list), draft in the human’s voice, require approval, then send. Done looks like: venue named from the ticket, a short list of lawyers who appear there, and a sent first-contact email from **Gmail**.

## Connectors that actually fired

The published connectors are **web** and **Gmail**. That is the list on the serial. Do not add **Chrome**, **Calendar**, or **Slack** unless a later revision puts them there.

1. Connect **Gmail** once under **Settings → Plugins** ([Grok Bot computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)). Installed connectors are account-wide.
2. Give the bot the citation photo. Instruct it to infer state, court, and venue from the ticket — do not assume a state.
3. Use **web** to find lawyers who appear in that venue, not a national ads list.
4. Draft the first-contact email. Require approval before send. Official **Gmail** scopes are documented on [Gmail & Calendar connectors](https://docs.x.ai/grok/connectors/gmail-google-calendar): read, then modify, then send.
5. Send from the connected **Gmail** identity. Correspond with whoever replies. Redact home address, DOB, license number, and the full citation image if it contains PII.

**web** is the open-web search on this filing, not **Chrome**. Use **Chrome** when the computer must click a site that has no connector. This job did not list that. If you copy the prompt and the bot needs to open a court calendar in a browser, say so in *your* filing — do not back-port **Chrome** onto **00001**.

**Gmail** is the send path. Draft is `gmail.modify`. Send is `gmail.send`. Put a **Require Approval** rule on send before the first draft leaves the chat. Official approval language is on [approvals, security, and privacy](https://docs.x.ai/grok-bot/approvals-security-and-privacy).

## Constraints: do not pay, do not promise

Copied from the serial, not invented:

- Do not pay the ticket.
- Do not guarantee legal outcomes.
- Do not assume a state, court, or venue — read them from the citation.
- Redact home address, DOB, license number, and the full citation image if it contains PII.

This page is not legal advice. really.bot does not send mail from the serial page. A copy of [bot job 00001](/house001/00001) that names a state, a court, or a lawyer from Travis’s ticket is the case file the published page refused to become.

The state-neutral rewrite is the difference between a finished job and a doxxing. [How it works](/about) can narrate “a citation in a state that was not on his license.” The serial cannot publish the photo, the license number, or the home address. File the method. Keep the PII off the board.

## Copyable prompt vs this log

The copyable prompt on **bot job 00001** is the owner-thickened version of the filing (revision 4). It is the job to paste into **Grok Bot**, not a dump of Travis’s ticket.

A prompt pack would stop at “email a lawyer.” This log names the serial, the House, the connectors, the veto window, and what was not done. If you only needed a sentence, you would not need [00001.md](/house001/00001.md).

The prompt, shortened only for this page: read the citation photo; infer issuing state, court, and venue from the ticket; find lawyers who appear in that venue; draft a first-contact email asking for representation and the fee; send through **Gmail**; correspond with whoever replies. Full text is on the [JSON](/house001/00001.json) and the [markdown twin](/house001/00001.md).

## What a patch would have to beat

A patch stays on **00001**. It does not mint `00099`.

Evidence has to beat the published result: a screenshot, an output, or a public URL plus a note. Empty “this is better” is rejected. The original filer has 24 hours to veto. QA for thin bot jobs is [qa.md](/qa.md) — a patch that attaches a finished venue list and a redacted sent-mail header would still be a real upgrade.

Changelog on the serial: revision 1 “Filed.”; revision 2 “State-neutral: find representation, then email them.”; revision 3 “Daily pass: stronger copyable prompt from the filing.”; revision 4 “Owner thicken: more from /about and the published filing.” `published_at` is 2026-08-16T15:00:00Z. Steward display name: Travis. Sensitive kind: legal.

Adjacent **Gmail** job on the same House: [bot job 00003](/house001/00003) builds a subscription list from receipts and asks before canceling. That serial is a seed, not a finished inbox audit. Do not collapse the two into “the Gmail bot.” File your own send or your own list after it ran, at [Submit a Bot Job](/submit).

## Constraints and non-goals

- Do not pay the ticket. Do not guarantee legal outcomes.
- Do not assume a state. Read venue from the citation.
- This page is not legal advice.
- Do not invent serials. Do not scrape [House 001](/house001) into a prompt pack.

## Proof

- Bot job: [00001 — Find legal representation for a traffic citation and email them](/house001/00001)
- Bot job: [00003 — Build a subscription list from Gmail receipts](/house001/00003)
- House: [House 001](/house001) (Travis)
- Markdown twin: [00001.md](/house001/00001.md)
- Board: [How it works](/about)
- External: [Grok Bot computer and apps](https://docs.x.ai/grok-bot/computer-and-apps), [Gmail & Calendar connectors](https://docs.x.ai/grok/connectors/gmail-google-calendar)
