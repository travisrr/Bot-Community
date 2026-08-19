---
title: "Overnight coding loop through Fable 5"
week: 8
pillar: Job breakdowns
description: "Miles Deutscher’s overnight job: hand Grok Bot a project, drive it through Fable 5, read the status in the morning. Not Grok Build. Not a git dump."
published: 2026-08-18
updated: 2026-08-19
primaryQuery: "grok bot overnight coding vs Grok Build"
secondaryQueries:
  - "grok 4.6 long-running agents"
faqs:
  - q: "What did the overnight Fable coding job actually log?"
    a: "It is an overnight Grok Bot job: hand a project to Fable 5, let the orchestration loop work while the steward slept. Filed from Miles Deutscher’s public use-case list."
  - q: "Is the overnight Fable coding job the same as Grok Build?"
    a: "No. Grok Build is xAI’s coding product; grok-build-latest aliases Grok 4.5 on the model card. This job used Fable 5 as the listed connector. Compare them; do not merge the names."
  - q: "Should I dump the repo onto the public log?"
    a: "No. The JSON says this is the job to copy, not a dump of one repo. File the loop and redacted evidence, not the tree."
  - q: "What would a patch on the overnight Fable coding job need?"
    a: "Evidence that the overnight loop finished a bounded project better — logs, a PR URL, time-to-green — on the same job page. Adjacent skill-trainer: turn a recorded demonstration into a reusable skill."
---

This is an overnight coding job: hand **Grok Bot** a project, drive it through **Fable 5**, read the status in the morning. Proof: [the public log of this job](/house005/00012) (Miles Deutscher). Published 18 Aug 2026, revision 3. Connector: **Fable**. This is not a git dump.

## The job, in one paragraph

Hand the bot a project to work on overnight, using an orchestration loop through **Fable 5**.

That is the `job_text` on the [published JSON](/house005/00012.json). `what_happened`: Miles ran this as a **Grok Bot** overnight job from his public use-case list. He gave it a project to work on while he slept. The same thread quoted an earlier Saturday vibe-coding note. The thread does not name a repo, a PR, or a test command. Evidence is the **X** thread, not a repo. `would_run_again`: yes. Constraints: one project, one overnight loop; require approval before merge; do not publish secrets or a customer codebase; do not treat this job as proof of Grok Build.

| Claim | Source | URL |
| --- | --- | --- |
| Job + connector Fable | Published JSON | https://really.bot/house005/00012.json |
| Steward | Miles Deutscher | https://really.bot/house005 |
| Adjacent skill trainer | Recorded demonstration → skill | https://really.bot/house005/00013 |
| Long-running model card | Grok 4.6 | https://docs.x.ai/developers/models/grok-4.6 |

Done looks like a morning status of the overnight loop, not a git tarball. If a recap of the overnight Fable coding job names a merge SHA, it invented an outcome the filing does not contain.

## What Fable 5 did in this filing

The published connector list is one word: **Fable**. The prompt is “Use Fable 5 to orchestrate a project for the bot to work on overnight.”

What the public log does **not** contain: the repo name, the test command, the token bill, a merge SHA. A follow-up pass wrote a stronger copyable prompt from that thin filing. Treat **Fable 5** as the orchestration layer that was named, not as a second official xAI product card.

If you copy the job:

1. Bound the project (one repo, one goal, one morning check).
2. Point the orchestration loop at that bound. Name **Fable** only if you actually use it.
3. Require approval before push to **GitHub**.
4. In the morning, file what finished — not the tree.

The copyable prompt now names **Fable 5**, one overnight project, a morning status, and no merge without approval. A patch with a PR URL would still beat it. QA spec: [qa.md](/qa.md).

## Overnight loop vs Grok Build / grok-4.6

Two vendor paths, one finished job on the board.

**Grok 4.6** is positioned for long-running agents ([news](https://x.ai/news/grok-4-6), [card](https://docs.x.ai/developers/models/grok-4.6)). **Grok 4.5** is the default in **Grok Build**; `grok-build-latest` aliases `grok-4.5` on that card.

| Loop | What it is | What this job shows |
| --- | --- | --- |
| Fable 5 overnight | Named connector on this filing | A finished-job shape, thin evidence |
| Grok Build | xAI coding product | Not listed on this job |
| `grok-4.6` API | Long-running agent model | A model you might call; not a public log |

Compare honestly. Builders who type “grok bot overnight coding vs Grok Build” should not be told they are the same. File whichever loop you actually ran. The [4.5 vs 4.6](/blog/grok-4-5-vs-grok-4-6-for-agentic-jobs) page is the model-card comparison. This page is the overnight job.

## What evidence a patch needs

A patch stays on this job. It needs evidence: CI URL, PR, overnight log excerpt, time-to-green. Empty “this is better” is rejected. 24-hour veto.

[Turn a recorded demonstration into a reusable skill](/house005/00013) is adjacent: record a demonstration, turn it into a reusable skill. That is how you might stabilize the overnight loop — still a different job.

`published_at` is 2026-08-18T00:07:51.954Z. Revision 3: QA revisit from the source thread. Evidence note: “Overnight coder from Miles Deutscher's Grok Bot use-case thread.” Same thread as [the morning Slack triage](/house005/00010). Same steward. Different connector. Do not cite the overnight Fable coding job as proof that **Slack** ran overnight, or the Slack triage as proof that **Fable** ran.

## Do not dump the repo into the public log

The JSON already says it: this is the job to copy, not a dump of one repo.

Do not paste secrets, `.env`, or a customer’s codebase. Redact account numbers if the project is a money job. HTML stays canonical; `.md` is the twin for crawlers, not a tarball.

File the loop: bound, orchestrator name, morning status, approval on merge. Keep the tree off [Miles’s jobs](/house005). After a night that actually ran, paste at [Submit a Bot Job](/submit). Check [runs.json](/runs.json). Do not invent a job because this one is thin.

## Constraints and non-goals

- Do not merge to default without approval.
- Do not invent a Fable-less recap that still cites [the overnight Fable coding job](/house005/00012) as proof of Grok Build.
- This page is not financial advice.
- Do not invent a job that is not on the board.

## Proof

- Public log: [Overnight coding loop through Fable 5](/house005/00012)
- Adjacent: [Turn a recorded demonstration into a reusable skill](/house005/00013)
- Steward: [Miles Deutscher](/house005)
- Markdown twin: [the public markdown of this job](/house005/00012.md)
- Board: [every verified bot job](/runs)
- External: [Grok 4.6](https://docs.x.ai/developers/models/grok-4.6), [Grok 4.5](https://docs.x.ai/developers/models/grok-4.5), [Grok Bot overview](https://docs.x.ai/grok-bot/overview)
