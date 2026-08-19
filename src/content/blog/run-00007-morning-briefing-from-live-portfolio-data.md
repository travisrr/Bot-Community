---
title: "Morning briefing from live portfolio data"
week: 10
pillar: Job breakdowns
description: "Miles Deutscher’s personal-CFO job: pull live positions, brief overnight moves, flag rebalances. Aaron Makelky’s adjacent job prints the briefing. Not financial advice."
published: 2026-08-18
updated: 2026-08-19
primaryQuery: "grok 4.5 agentic workflows"
secondaryQueries:
  - "grok bot use cases"
sensitiveKind: financial
faqs:
  - q: "What did the morning portfolio briefing actually do?"
    a: "It pulled live portfolio data each morning, briefed overnight moves and upcoming events, and flagged positions worth rebalancing. Steward: Miles Deutscher. Connector: web."
  - q: "Is the morning portfolio briefing financial advice?"
    a: "No. The public log is a record of one bot job. It is not financial advice. Redact account numbers. Do not publish a named brokerage login."
  - q: "Why does live data matter?"
    a: "A screenshot of yesterday’s balances is stale. The prompt says verify the bot can see the logged-in session. The method is the live pull, not a PNG of a previous close."
  - q: "How does the printer briefing relate?"
    a: "Aaron Makelky prints a morning briefing to a home printer. Adjacent job, different steward. Do not merge them."
---

This job pulls live portfolio data every morning, briefs overnight moves, and flags rebalances. Proof: [the public log of this job](/house005/00007) (Miles Deutscher). Connector: **web**. Sensitive kind: financial. Adjacent printer job: [print the morning briefing to a home printer](/house007/00015). This page is not financial advice. Redact account numbers.

## The job, in one paragraph

Pull live portfolio data every morning. Brief overnight moves, upcoming market events, and flag anything worth rebalancing.

`what_happened` on the [published JSON](/house005/00007.json): Miles tested **Grok Bot** over a couple of days and posted a public use-case list. Personal CFO bot: pulls live portfolio data, briefs overnight moves and upcoming market events, and flags anything worth rebalancing. The attached screenshot showed a CFO bot in his roster. The thread does not name a brokerage, account, or position. Filed from that public list. “This is the job to copy, not a portfolio for a named account.” His bio on the same profile says tweets are not financial advice. Evidence is the **X** thread. `would_run_again`: yes.

| Claim | Source | URL |
| --- | --- | --- |
| Job + web connector | Published JSON | https://really.bot/house005/00007.json |
| Steward | Miles Deutscher | https://really.bot/house005 |
| Printer spoke | Print the morning briefing | https://really.bot/house007/00015 |
| Session / computer | Grok Bot computer | https://docs.x.ai/grok-bot/computer-and-apps |

Done looks like a morning brief with moves, events, and rebalance flags — not a screenshot of yesterday’s close. Flags are not orders. Do not place a trade.

## Live data vs a screenshot of yesterday

The copyable prompt says use **web** and verify the bot can see the logged-in session after logging in on the computer.

A PNG of yesterday’s close is not the job. The job is a pull against the session that is live this morning. If the session is dead, report the failure — same stale-data rule as a **Calendar** routine.

1. Log in on the **Grok Bot** computer. Prefer a connector if your broker has one; this filing lists **web**.
2. Confirm the session sees current positions. If not, stop.
3. Brief overnight moves and upcoming events. Flag rebalances as flags, not as orders.
4. Require approval before any trade. This filing does not list a broker send.
5. Redact account numbers, tax IDs, and exact share counts you do not want public.

**Grok 4.5 agentic workflows** still need that gate. The [model card](https://docs.x.ai/developers/models/grok-4.5) does not place a trade. [Grok Bot computer and apps](https://docs.x.ai/grok-bot/computer-and-apps) is the session page.

## Redact account numbers; keep the method

Publish: cadence (every morning), connector (**web**), output shape (moves, events, flags), would-run-again, a public evidence URL.

Do not publish: account numbers, login, named positions if they identify the steward, screenshots with balances.

The board already says this is not a portfolio for a named account. Keep it that way when you file your own. A public-safe `what_happened` after a real morning: “Pulled live positions on the computer session. Briefed overnight moves. Flagged two rebalances. Did not place a trade.” The ticker list stays off the page unless you want it public.

## Cluster: the printer briefing

[Print the morning briefing to a home printer](/house007/00015) is Aaron Makelky’s job, not Miles’s. Job: if **Grok Bot** or a VPS-hosted agent gets blocked from websites, connect it to an always-on home desktop via Tailscale, turn on run-as-exit-node and allow-local-network-access, and print the morning briefing to the home printer. Evidence is an **X** thread with those two Tailscale checkboxes and a printed Executive Daily Brief on a Brother printer. Names on the paper are redacted.

Same morning shape, different artifact (paper), different steward. A patch on the portfolio briefing does not become the printer job.

`published_at` for the portfolio briefing is 2026-08-18T00:07:51.954Z. Revision 3. Evidence note: “Personal CFO bot from Miles Deutscher's Grok Bot use-case thread.” Sensitive kind: financial. Connector list is only **web**.

The printer job lists **Tailscale** and **Grok Bot** — the connectors the thread actually named. That is Aaron’s printer bridge, not Miles’s portfolio pull. Cite [Aaron Makelky](/house007) when you cite the printer job.

## Would-run-again and what a patch must prove

`would_run_again` is yes. A patch must show a better live pull or a clearer brief with evidence — not a hotter ticker call. 24-hour veto. Same job page.

File your own at [Submit a Bot Job](/submit) after it ran. Check [runs.json](/runs.json). Do not invent a public job URL.

The prompt on the JSON: pull live portfolio data every morning; brief overnight moves and upcoming market events; flag positions worth rebalancing; use **web**; verify the bot can see the logged-in session; if the session cannot see live positions, say so and stop. Full text: [the markdown twin](/house005/00007.md).

Same steward, different morning job: [Morning Slack triage for urgent messages only](/house005/00010). Do not bolt the portfolio brief onto the **Slack** skill. Two routines. Two filings.

## Constraints and non-goals

- Redact account numbers. Keep the method.
- Do not treat flags as orders.
- This page is not financial advice.
- Do not invent a job that is not on the board. Do not scrape Miles’s jobs into a prompt pack.

## Proof

- Public log: [Morning briefing from live portfolio data](/house005/00007)
- Adjacent: [Configure Grok Bot to print morning briefing to home printer](/house007/00015)
- Steward: [Miles Deutscher](/house005)
- Markdown twin: [the public markdown of this job](/house005/00007.md)
- Board: [Submit a Bot Job](/submit)
- External: [Grok Bot computer and apps](https://docs.x.ai/grok-bot/computer-and-apps), [Grok 4.5 model card](https://docs.x.ai/developers/models/grok-4.5)
