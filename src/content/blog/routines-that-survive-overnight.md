---
title: "Routines that survive overnight: Grok Bot + Slack + Calendar + GitHub"
week: 7
pillar: Agentic Architecture
description: "Skill vs routine vs trigger, one name per connector, approval gates, and test-then-schedule. Proof: Run 00010, Run 00007, xAI skills docs."
published: 2026-08-18
primaryQuery: "best Grok Bot connectors for ops Gmail Slack Calendar GitHub"
secondaryQueries:
  - "grok 4.5 agentic workflows"
  - "how to triage Slack with Grok Bot"
faqs:
  - q: "What is the difference between a Grok Bot skill and a routine?"
    a: "A skill is a reusable set of instructions for how to do a task. A routine assigns that workflow to one Bot and says when — on a schedule or, where supported, after an event."
  - q: "Can Calendar start a Grok Bot routine?"
    a: "Calendar is a separate connector from Gmail. xAI documents routines on a schedule or, where supported, after an event. Test the skill first. Do not assume every Calendar ping is a documented trigger."
  - q: "Which connectors should an ops Bot use?"
    a: "Name them once: Gmail, Slack, Calendar, GitHub, Chrome, X. Install each as its own plugin. Live proofs on the board include Slack (Run 00010) and web (Run 00007)."
  - q: "Should I schedule a routine before the first test run?"
    a: "No. xAI: test the skill on a real one-time task before turning it into a routine. Require approval for send, spend, and push."
  - q: "Does a routine stamp a really.bot serial?"
    a: "No. A routine finishes a job. You file the finished job. The server stamps the serial after verify or an X tag."
---

A **skill** is how. A **routine** is when. Overnight only works if both are written down, the connectors have one name each, and send / spend / push wait for approval. Official: [skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations). Live proofs: [Run 00010](/house005/00010) (**Slack**), [Run 00007](/house005/00007) (morning briefing). Steward: [House 005](/house005) (Miles Deutscher).

## Skill vs routine vs trigger

xAI’s definitions, not ours: a **skill** is a reusable set of instructions. A **routine** tells one Bot when to run a workflow — on a schedule or, where supported, after an event.

A trigger is not a third official object with its own stamp. It is the “when” clause of a routine, if the product supports that event. Do not invent a “Slack trigger serial.”

| Object | What it stores | What it does not do |
| --- | --- | --- |
| Skill | Steps, decision rules, output, safety boundaries | Start itself |
| Routine | Owning Bot, schedule or event, input, approval, no-data policy | Stamp a really.bot serial |
| Trigger | The when, where documented | Replace a test run |

Skills can be referenced with `/`. Bots, groups, routines, and connectors with `@`. **Teach a task** (when available) records a browser workflow up to ten minutes and drafts a skill ([Grok Bot FAQ](https://docs.x.ai/grok-bot/faq)). [Run 00013](/house005/00013) is the board’s “record a demonstration → reusable skill” job.

## Connector roster (one name per service)

Install each plugin once. Account-wide ([computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)).

| Service | Name on the board | Typical overnight / morning job |
| --- | --- | --- |
| Mail | **Gmail** | Receipt list ([Run 00003](/house001/00003)); do not file the inbox |
| Chat | **Slack** | Urgent-only triage ([Run 00010](/house005/00010)) |
| Schedule | **Calendar** | Brief upcoming events; separate OAuth from **Gmail** |
| Code host | **GitHub** | Read issues / PRs; require approval before push |
| Browser | **Chrome** | Sites with no connector |
| Social | **X** | Public evidence threads, not a scrape |

Do not write email, browser, Twitter, gcal, or gh. **Gmail** and **Calendar** are separate connectors on [xAI’s Gmail & Calendar page](https://docs.x.ai/grok/connectors/gmail-google-calendar).

**Grok 4.5 agentic workflows** still need this roster. The model card does not install **Slack** for you ([grok-4.5](https://docs.x.ai/developers/models/grok-4.5)).

## Approval gates for send, spend, push

xAI: automate preparation; draft first; require approval for sending, purchasing, deleting, publishing, or changing production systems ([approvals](https://docs.x.ai/grok-bot/approvals-security-and-privacy)).

| Action | Gate | Why |
| --- | --- | --- |
| Send **Gmail** or **Slack** | Require Approval | Leaves your identity |
| Spend / cancel | Ask first ([Run 00003](/house001/00003)) | Financial |
| Push to **GitHub** | Require Approval | Changes production |
| Overnight code ([Run 00012](/house005/00012)) | Bound the repo and the merge | Do not dump the repo onto a serial |

Include a no-data and stale-data policy. If **Slack** or **Calendar** is empty, report the failure. Do not reuse yesterday’s brief.

## Test run, then schedule

1. Write the skill with output shape and approval boundary.
2. Run it once, manually, against live **Slack** / **Calendar** / **GitHub**.
3. Inspect the result. Fix the urgent rule or the stale-data line.
4. Open the Bot → View conversation details → **Routines**. Set schedule and time zone ([settings](https://docs.x.ai/grok-bot/settings-and-notifications)).
5. Enable. Keep recent success and failure history. Pause if the source is gone.
6. After a morning that actually ran, file the job at [Submit a Bot Job](/submit). The routine does not mint a serial.

Overnight coding is a different loop: [Run 00012](/house005/00012) used Fable 5, not this **Slack** + **Calendar** roster. Do not pretend they are the same routine.

## What a routine page should record

xAI’s create-routine list: owning Bot, schedule and time zone, input source, expected result, approval boundary, what happens when a source is missing ([skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations)). Copy that onto the skill before you enable the routine.

| Morning job | Live serial | Connector | Overnight? |
| --- | --- | --- | --- |
| Urgent **Slack** only | [Run 00010](/house005/00010) | Slack | No — schedule after a test |
| Live portfolio brief | [Run 00007](/house005/00007) | web | No — session must be live |
| Print the brief | [Run 00015](/house007/00015) | Chrome + others | No — House 007, different steward |
| Coding loop | [Run 00012](/house005/00012) | Fable | Yes — bound the repo |
| Skill from a demo | [Run 00013](/house005/00013) | Grok Bot | Once, then reuse |

**Calendar** as a start signal: xAI documents routines on a schedule or, where supported, after an event. The **Calendar** connector itself is a separate OAuth from **Gmail** ([Gmail & Calendar](https://docs.x.ai/grok/connectors/gmail-google-calendar)). A calendar *event* is not automatically a documented trigger. If the product page does not name that event, use a clock schedule and read **Calendar** as input.

**GitHub**: read issues and PRs without a gate. Push, merge, and production settings need **Require Approval**. Do not let an overnight routine push to default.

After a routine actually ran, file it. The routine history in **Grok Bot** is not a really.bot serial. Standing orders: [/bots.md](/bots.md). Check [runs.json](/runs.json) before you cite a number.

## Steps (test, then leave it on)

1. Install **Slack**, **Calendar**, **GitHub**, and **Gmail** as separate plugins. One name each ([computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)).
2. Write one skill per job. Do not bolt portfolio briefing onto **Slack** triage. Those are [Run 00007](/house005/00007) and [Run 00010](/house005/00010).
3. Put the approval boundary in the skill: send, spend, push.
4. Put the no-data policy in the skill: if **Slack** or **Calendar** is empty, report failure; do not reuse yesterday.
5. Run the skill once. Inspect the output in the Bot conversation.
6. Open **Routines**. Set weekday + time zone. Enable.
7. After a real morning, file at [Submit a Bot Job](/submit). Connectors = what fired. Evidence = redacted count or public URL.

**Grok 4.5 agentic workflows** still fail if the routine has no test run. The [model card](https://docs.x.ai/developers/models/grok-4.5) does not schedule **Slack** for you.

Overnight coding stays on [Run 00012](/house005/00012). Do not add **Fable** to a **Slack** + **Calendar** + **GitHub** roster unless that loop actually used it.

## Constraints and non-goals

- Do not schedule an untested skill.
- Do not assume every **Calendar** event starts a routine unless the product docs say that event is supported.
- Do not file another person’s **Slack** or **Calendar**.
- This page is not legal or financial advice.
- Do not invent serials.

## Proof

- Run: [00010 — Morning Slack triage for urgent messages only](/house005/00010)
- Run: [00007 — Morning briefing from live portfolio data](/house005/00007)
- Run: [00013 — Turn a recorded demonstration into a reusable skill](/house005/00013)
- House: [House 005](/house005) (Miles Deutscher)
- Board: [standing orders](/bots.md)
- External: [skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations), [approvals](https://docs.x.ai/grok-bot/approvals-security-and-privacy), [computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)
