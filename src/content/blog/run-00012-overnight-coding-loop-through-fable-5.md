---
title: "Run 00012: Overnight coding loop through Fable 5"
week: 8
pillar: Run Breakdowns
description: "House 005 overnight job: hand Grok Bot a project, drive it through Fable 5, read the status in the morning. Not Grok Build. Not a git dump."
published: 2026-08-18
updated: 2026-08-18
primaryQuery: "grok bot overnight coding vs Grok Build"
secondaryQueries:
  - "grok 4.6 long-running agents"
faqs:
  - q: "What did Run 00012 actually log?"
    a: "Run 00012 is an overnight Grok Bot job: hand a project to Fable 5, let the orchestration loop work while the steward slept. Filed from Miles Deutscher’s public use-case list on House 005."
  - q: "Is Run 00012 the same as Grok Build?"
    a: "No. Grok Build is xAI’s coding product; grok-build-latest aliases Grok 4.5 on the model card. Run 00012 used Fable 5 as the listed connector. Compare them; do not merge the names."
  - q: "Should I dump the repo onto the serial?"
    a: "No. The JSON says this serial is the job to copy, not a dump of one repo. File the loop and redacted evidence, not the tree."
  - q: "What would a patch on Run 00012 need?"
    a: "Evidence that the overnight loop finished a bounded project better — logs, a PR URL, time-to-green — on the same serial. Adjacent skill-trainer: Run 00013."
---

**Run 00012** is an overnight coding job: hand **Grok Bot** a project, drive it through **Fable 5**, read the serial in the morning. Proof: [00012](/house005/00012) on [House 005](/house005) (Miles Deutscher). Published 18 Aug 2026, revision 3. Connector: **Fable**. This is not a git dump.

## The job, in one paragraph

Hand the bot a project to work on overnight, using an orchestration loop through **Fable 5**.

That is the `job_text` on the [Run 00012 JSON](/house005/00012.json). `what_happened`: Miles ran this as a **Grok Bot** overnight job from his public use-case list. He gave it a project to work on while he slept. The same thread quoted an earlier Saturday vibe-coding note. The thread does not name a repo, a PR, or a test command. Evidence is the **X** thread, not a repo. `would_run_again`: yes. Constraints: one project, one overnight loop; require approval before merge; do not publish secrets or a customer codebase; do not treat this serial as proof of Grok Build.

| Claim | Source | URL |
| --- | --- | --- |
| Job + connector Fable | Run 00012 JSON | https://really.bot/house005/00012.json |
| Steward | House 005 | https://really.bot/house005 |
| Adjacent skill trainer | Run 00013 | https://really.bot/house005/00013 |
| Long-running model card | Grok 4.6 | https://docs.x.ai/developers/models/grok-4.6 |

Done looks like a morning status of the overnight loop, not a git tarball. If a recap of **00012** names a merge SHA, it invented an outcome the filing does not contain.

## What Fable 5 did in this filing

The published connector list is one word: **Fable**. The prompt is “Use Fable 5 to orchestrate a project for the bot to work on overnight.”

What the serial does **not** contain: the repo name, the test command, the token bill, a merge SHA. A follow-up pass wrote a stronger copyable prompt from that thin filing. Treat **Fable 5** as the orchestration layer that was named, not as a second official xAI product card.

If you copy the job:

1. Bound the project (one repo, one goal, one morning check).
2. Point the orchestration loop at that bound. Name **Fable** only if you actually use it.
3. Require approval before push to **GitHub**.
4. In the morning, file what finished — not the tree.

The copyable prompt now names **Fable 5**, one overnight project, a morning status, and no merge without approval. A patch with a PR URL would still beat it. QA spec: [qa.md](/qa.md).

## Overnight loop vs Grok Build / grok-4.6

Two vendor paths, one board serial.

**Grok 4.6** is positioned for long-running agents ([news](https://x.ai/news/grok-4-6), [card](https://docs.x.ai/developers/models/grok-4.6)). **Grok 4.5** is the default in **Grok Build**; `grok-build-latest` aliases `grok-4.5` on that card.

| Loop | What it is | What Run 00012 shows |
| --- | --- | --- |
| Fable 5 overnight | Named connector on this serial | A finished-job shape, thin evidence |
| Grok Build | xAI coding product | Not listed on 00012 |
| `grok-4.6` API | Long-running agent model | A model you might call; not a serial |

Compare honestly. Builders who type “grok bot overnight coding vs Grok Build” should not be told they are the same. File whichever loop you actually ran. The [4.5 vs 4.6](/blog/grok-4-5-vs-grok-4-6-for-agentic-jobs) page is the model-card comparison. This page is the serial.

## What evidence a patch needs

A patch stays on **00012**. It needs evidence: CI URL, PR, overnight log excerpt, time-to-green. Empty “this is better” is rejected. 24-hour veto.

[Run 00013](/house005/00013) is adjacent: record a demonstration, turn it into a reusable skill. That is how you might stabilize the overnight loop — still a different serial.

`published_at` is 2026-08-18T00:07:51.954Z. Revision 3: QA revisit from the source thread. Evidence note: “Overnight coder from Miles Deutscher's Grok Bot use-case thread.” Same thread as [Run 00010](/house005/00010). Same House. Different connector. Do not cite **00012** as proof that **Slack** ran overnight, or **00010** as proof that **Fable** ran.

## Do not dump the repo into the serial

The JSON already says it: this serial is the job to copy, not a dump of one repo.

Do not paste secrets, `.env`, or a customer’s codebase. Redact account numbers if the project is a money job. HTML stays canonical; `.md` is the twin for crawlers, not a tarball.

File the loop: bound, orchestrator name, morning status, approval on merge. Keep the tree off [House 005](/house005). After a night that actually ran, paste at [Submit a Bot Job](/submit). Check [runs.json](/runs.json). Do not invent a serial because this one is thin.

## Constraints and non-goals

- Do not merge to default without approval.
- Do not invent a Fable-less recap that still cites **00012** as proof of Grok Build.
- This page is not financial advice.
- Do not invent serials.

## Proof

- Run: [00012 — Overnight coding loop through Fable 5](/house005/00012)
- Run: [00013 — Turn a recorded demonstration into a reusable skill](/house005/00013)
- House: [House 005](/house005) (Miles Deutscher)
- Markdown twin: [00012.md](/house005/00012.md)
- Board: [every verified serial](/runs)
- External: [Grok 4.6](https://docs.x.ai/developers/models/grok-4.6), [Grok 4.5](https://docs.x.ai/developers/models/grok-4.5), [Grok Bot overview](https://docs.x.ai/grok-bot/overview)
