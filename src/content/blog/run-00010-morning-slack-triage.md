---
title: "Bot job 00010: Morning Slack triage for urgent messages only"
week: 6
pillar: Job breakdowns
description: "A recurring Grok Bot on House 005 that surfaces only urgent Slack. Miles Deutscher’s public use-case thread is the evidence, not a workspace dump."
published: 2026-08-18
updated: 2026-08-18
primaryQuery: "how to triage Slack with Grok Bot"
secondaryQueries:
  - "grok bot use cases"
faqs:
  - q: "How do I triage Slack with Grok Bot?"
    a: "Connect Slack once, write an urgent-vs-noisy rule, and schedule a morning routine after a test run. Copy the job from bot job 00010 — do not file someone else’s workspace."
  - q: "What is urgent on bot job 00010?"
    a: "The published prompt says surface only urgent Slack messages every morning. The serial does not ship a private keyword list. You must write the rule for your workspace."
  - q: "Is bot job 00010 a log of Miles’s Slack?"
    a: "No. The JSON says this serial is the job to copy, not a log of someone else’s workspace. Evidence is the public X use-case thread."
  - q: "Would they run bot job 00010 again?"
    a: "Yes. would_run_again is yes. House 005 also holds bot job 00007 (portfolio briefing) and bot job 00012 (overnight coding)."
---

**Bot job 00010** is a recurring **Grok Bot** that triages **Slack** each morning and surfaces only what is urgent. Proof: [00010](/house005/00010) on [House 005](/house005) (Miles Deutscher), published 18 Aug 2026, revision 3. Evidence URL: the public use-case thread. This is not a dump of that workspace.

## The job, in one paragraph

Triage **Slack** every morning so the inbox is not a dump at wake-up. Surface only what is actually urgent.

`job_text` and `what_happened` on the [bot job 00010 JSON](/house005/00010.json) match that sentence. Miles ran this as an executive assistant on his public **Grok Bot** use-case list. The thread does not publish his workspace, channels, or messages. Connector: **Slack**. `would_run_again`: yes. Constraints: urgent only; do not publish someone else’s **Slack**; write the urgent rule before scheduling; output permalinks, not a channel dump.

| Claim | Source | URL |
| --- | --- | --- |
| Job + connector | bot job 00010 JSON | https://really.bot/house005/00010.json |
| Steward | House 005 | https://really.bot/house005 |
| Evidence thread | X (on the job page) | https://x.com/milesdeutscher/status/2089419747544944714 |
| Adjacent briefing | bot job 00007 | https://really.bot/house005/00007 |

Done looks like this morning’s urgent list, or an honest empty scan. “Nothing matched the rule” is a valid result. Yesterday’s brief reused as today’s is not.

## Urgent vs noisy: the rule the bot needs

“Urgent” is not a default. Write the rule or the Bot will summarize the channel.

A rule that survives a Monday:

1. Connect **Slack** under **Settings → Plugins** ([Grok Bot computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)).
2. Name the workspaces and channels in scope. Exclude social channels by default.
3. Define urgent: direct page, production down, customer-blocking, time-boxed ask before noon. Define noisy: FYI, emoji threads, launch chatter.
4. Output: a short list with permalink, requester, and why it matched. No workspace export.
5. Test once. Then put it on a routine ([skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations)).

Do not file the messages. File the rule and a redacted count.

A useful default, written so a Bot can execute it: DMs from humans that contain a deadline today, @-channel pages, and anything the steward labeled `urgent` in **Slack**. Exclude social channels and bot noise. Output permalinks, not message bodies, if you will file the job. The published prompt on [bot job 00010](/house005/00010) already says this. It does not ship Miles’s private keyword list.

## Slack plugin vs Cursor event triggers

**Slack** the connector is the **Grok Bot** plugin. A Cursor hook or a Slack Events API worker is a different product.

Use the plugin when the Bot should read **Slack** and write a morning brief in the Bot conversation. Use a trigger only if you have documented the event and an approval boundary. xAI: a **skill** is how; a **routine** is when ([skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations)). Test the skill on a one-time task before you schedule it.

This serial does not claim a Cursor trigger. Do not add one in a recap. If you later file a job that used Events API, name that stack on *that* serial. [Routines that survive overnight](/blog/routines-that-survive-overnight) is the architecture page for skill vs routine vs trigger.

## House 005 as an ops cluster

[House 005](/house005) is the Miles ops cluster on the board:

- [bot job 00007](/house005/00007) — morning briefing from live portfolio data (**web**)
- [bot job 00010](/house005/00010) — this **Slack** triage
- [bot job 00012](/house005/00012) — overnight coding through Fable 5
- [bot job 00013](/house005/00013) — turn a recorded demonstration into a reusable skill

Same steward, different connectors. A patch on **00010** stays on **00010**.

`published_at` is 2026-08-18T00:07:51.954Z — the same stamp batch as **00007**–**00013**. Revision 3 is the QA revisit from the source thread. Evidence note on the JSON: “Executive assistant Slack triage from Miles Deutscher's Grok Bot use-case thread.” The thread URL is the evidence; it is not a workspace export.

## File the next morning’s run

1. Run the triage once on your **Slack**.
2. Extract filing markdown ([/bots.md](/bots.md)). Connectors: `Slack`.
3. Evidence: a redacted screenshot or a public URL plus a note — not the channel export.
4. Paste at [Submit a Bot Job](/submit) or POST with a House token.
5. After verify, cite `/houseNNN/NNNNN`. Check [runs.json](/runs.json). Do not invent a serial.

A public-safe `what_happened` after a real morning: “Triaged Slack at 07:30. Three permalinks matched the urgent rule. Did not export the workspace.” That sentence can go on a serial. The three message bodies cannot.

## Constraints and non-goals

- Do not publish someone else’s **Slack**.
- Do not treat “urgent” as undefined.
- This page is not employment or legal advice.
- Do not invent serials. Do not scrape [House 005](/house005) into a prompt pack.

## Proof

- Bot job: [00010 — Morning Slack triage for urgent messages only](/house005/00010)
- Bot job: [00007 — Morning briefing from live portfolio data](/house005/00007)
- House: [House 005](/house005) (Miles Deutscher)
- Markdown twin: [00010.md](/house005/00010.md)
- Board: [Submit a Bot Job](/submit)
- External: [Grok Bot skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations), [Grok Bot computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)
