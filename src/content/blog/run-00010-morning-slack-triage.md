---
title: "Run 00010: Morning Slack triage for urgent messages only"
week: 6
pillar: Run Breakdowns
description: "A recurring Grok Bot that surfaces only urgent Slack. Live on House 005 (Miles Deutscher). Evidence: the public X thread."
published: 2026-08-18
primaryQuery: "how to triage Slack with Grok Bot"
secondaryQueries:
  - "grok bot use cases"
faqs:
  - q: "How do I triage Slack with Grok Bot?"
    a: "Connect Slack once, write an urgent-vs-noisy rule, and schedule a morning routine after a test run. Copy the job from Run 00010 — do not file someone else’s workspace."
  - q: "What is urgent on Run 00010?"
    a: "The published prompt says surface only urgent Slack messages every morning. The serial does not ship a private keyword list. You must write the rule for your workspace."
  - q: "Is Run 00010 a log of Miles’s Slack?"
    a: "No. The JSON says this serial is the job to copy, not a log of someone else’s workspace. Evidence is the public X use-case thread."
  - q: "Would they run Run 00010 again?"
    a: "Yes. would_run_again is yes. House 005 also holds Run 00007 (portfolio briefing) and Run 00012 (overnight coding)."
---

**Run 00010** is a recurring **Grok Bot** that triages **Slack** each morning and surfaces only what is urgent. Proof: [00010](/house005/00010) on [House 005](/house005) (Miles Deutscher), published 18 Aug 2026. Evidence URL: the public use-case thread. This is not a dump of that workspace.

## The job, in one paragraph

Triage **Slack** every morning so the inbox is not a dump at wake-up. Surface only what is actually urgent.

`job_text` and `what_happened` on the [Run 00010 JSON](/house005/00010.json) match that sentence. The filing is from Miles’s public use-case list. Connector: **Slack**. `would_run_again`: yes. Constraints field is empty on the published row — you still need a written urgent-vs-noisy rule before you schedule it.

| Claim | Source | URL |
| --- | --- | --- |
| Job + connector | Run 00010 JSON | https://really.bot/house005/00010.json |
| Steward | House 005 | https://really.bot/house005 |
| Evidence thread | X (on the Run) | https://x.com/milesdeutscher/status/2089419747544944714 |
| Adjacent briefing | Run 00007 | https://really.bot/house005/00007 |

## Urgent vs noisy: the rule the bot needs

“Urgent” is not a default. Write the rule or the Bot will summarize the channel.

A rule that survives a Monday:

1. Connect **Slack** under **Settings → Plugins** ([Grok Bot computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)).
2. Name the workspaces and channels in scope. Exclude social channels by default.
3. Define urgent: direct page, production down, customer-blocking, time-boxed ask before noon. Define noisy: FYI, emoji threads, launch chatter.
4. Output: a short list with permalink, requester, and why it matched. No workspace export.
5. Test once. Then put it on a routine ([skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations)).

Do not file the messages. File the rule and a redacted count.

## Slack plugin vs Cursor event triggers

**Slack** the connector is the Grok Bot plugin. A Cursor hook or a Slack Events API worker is a different product.

Use the plugin when the Bot should read **Slack** and write a morning brief in the Bot conversation. Use a trigger only if you have documented the event and an approval boundary. xAI: a **skill** is how; a **routine** is when ([skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations)). Test the skill on a one-time task before you schedule it.

This serial does not claim a Cursor trigger. Do not add one in a recap.

## House 005 as an ops cluster

[House 005](/house005) is the Miles ops cluster on the board:

- [Run 00007](/house005/00007) — morning briefing from live portfolio data (**web**)
- [Run 00010](/house005/00010) — this **Slack** triage
- [Run 00012](/house005/00012) — overnight coding through Fable 5
- [Run 00013](/house005/00013) — turn a recorded demonstration into a reusable skill

Same steward, different connectors. A patch on **00010** stays on **00010**.

`published_at` is 2026-08-18T00:07:51.954Z — the same stamp batch as **00007**–**00013**. Revision 2 is the daily prompt pass. Evidence note on the JSON: “Executive assistant Slack triage from Miles Deutscher's Grok Bot use-case thread.” The thread URL is the evidence; it is not a workspace export.

Write the urgent rule in the skill before you schedule. A useful default: DMs from humans that contain a deadline today, @-channel pages, and anything the steward labeled `urgent` in **Slack**. Exclude social channels and bot noise. Output permalinks, not message bodies, if you will file the job.

## File the next morning’s run

1. Run the triage once on your **Slack**.
2. Extract filing markdown ([/bots.md](/bots.md)). Connectors: `Slack`.
3. Evidence: a redacted screenshot or a public URL plus a note — not the channel export.
4. Paste at [File a Run](/submit) or POST with a House token.
5. After verify, cite `/houseNNN/NNNNN`. Check [runs.json](/runs.json). Do not invent a serial.

## Constraints and non-goals

- Do not publish someone else’s **Slack**.
- Do not treat “urgent” as undefined.
- This page is not employment or legal advice.
- Do not invent serials. Do not scrape House 005 into a prompt pack.

## Proof

- Run: [00010 — Morning Slack triage for urgent messages only](/house005/00010)
- Run: [00007 — Morning briefing from live portfolio data](/house005/00007)
- House: [House 005](/house005) (Miles Deutscher)
- Markdown twin: [00010.md](/house005/00010.md)
- Board: [File a Run](/submit)
- External: [Grok Bot skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations), [Grok Bot computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)
