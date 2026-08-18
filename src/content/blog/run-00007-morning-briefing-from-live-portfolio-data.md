---
title: "Run 00007: Morning briefing from live portfolio data"
week: 10
pillar: Run Breakdowns
description: "Pull live positions, brief overnight moves, flag rebalances. House 005. Adjacent 00015 prints the briefing. Redact account numbers. Not financial advice."
published: 2026-08-18
primaryQuery: "grok 4.5 agentic workflows"
secondaryQueries:
  - "grok bot use cases"
sensitiveKind: financial
faqs:
  - q: "What did Run 00007 actually do?"
    a: "Run 00007 pulled live portfolio data each morning, briefed overnight moves and upcoming events, and flagged positions worth rebalancing. House 005. Connector: web."
  - q: "Is Run 00007 financial advice?"
    a: "No. The serial is a log of one bot job. It is not financial advice. Redact account numbers. Do not publish a named brokerage login."
  - q: "Why does live data matter?"
    a: "A screenshot of yesterday’s balances is stale. The prompt says verify the bot can see the logged-in session. The method is the live pull, not a PNG of a previous close."
  - q: "How does Run 00015 relate?"
    a: "Run 00015 (House 007, Aaron Makelky) prints a morning briefing to a home printer. Adjacent job, different House, different serial. Do not merge them."
---

**Run 00007** pulls live portfolio data every morning, briefs overnight moves, and flags rebalances. Proof: [00007](/house005/00007) on [House 005](/house005) (Miles Deutscher). Connector: **web**. Sensitive kind: financial. Adjacent printer job: [Run 00015](/house007/00015). This page is not financial advice. Redact account numbers.

## The job, in one paragraph

Pull live portfolio data every morning. Brief overnight moves, upcoming market events, and flag anything worth rebalancing.

`what_happened` on the [Run 00007 JSON](/house005/00007.json): Miles ran this as a recurring **Grok Bot** after testing over a couple of days. Filed from his public use-case list. “This serial is the job to copy, not a portfolio for a named account.” Evidence is the X thread. `would_run_again`: yes.

| Claim | Source | URL |
| --- | --- | --- |
| Job + web connector | Run 00007 JSON | https://really.bot/house005/00007.json |
| Steward | House 005 | https://really.bot/house005 |
| Printer spoke | Run 00015 | https://really.bot/house007/00015 |
| Session / computer | Grok Bot computer | https://docs.x.ai/grok-bot/computer-and-apps |

## Live data vs a screenshot of yesterday

The copyable prompt says use **web** and verify the bot can see the logged-in session after logging in on the computer.

A PNG of yesterday’s close is not the job. The job is a pull against the session that is live this morning. If the session is dead, report the failure — same stale-data rule as a **Calendar** routine.

1. Log in on the **Grok Bot** computer. Prefer a connector if your broker has one; this serial lists **web**.
2. Confirm the session sees current positions. If not, stop.
3. Brief overnight moves and upcoming events. Flag rebalances as flags, not as orders.
4. Require approval before any trade. This serial does not list a broker send.
5. Redact account numbers, tax IDs, and exact share counts you do not want public.

**Grok 4.5 agentic workflows** still need that gate. The [model card](https://docs.x.ai/developers/models/grok-4.5) does not place a trade.

## Redact account numbers; keep the method

Publish: cadence (every morning), connector (**web**), output shape (moves, events, flags), would-run-again, a public evidence URL.

Do not publish: account numbers, login, named positions if they identify the steward, screenshots with balances.

The board already says this serial is not a portfolio for a named account. Keep it that way when you file your own.

## Cluster: 00015 prints the briefing

[Run 00015](/house007/00015) is House 007 (Aaron Makelky), not House 005. Job: configure **Grok Bot** to print the morning briefing to a home printer (Tailscale, **Chrome**, **Gmail**, **GitHub**, **Slack**, and others on that filing). Evidence is an X thread.

Same morning shape, different artifact (paper), different steward, different serial. A patch on **00007** does not become **00015**.

`published_at` for **00007** is 2026-08-18T00:07:51.954Z. Revision 2. Evidence note: “Personal CFO bot from Miles Deutscher's Grok Bot use-case thread.” Sensitive kind: financial. Connector list is only **web**.

**00015** lists Tailscale, **Grok Bot**, Hermes, Hostinger, OpenRouter, **X**, **Chrome**, Mac Studio, **Gmail**, **GitHub**, **Slack**. That is Aaron’s printer bridge, not Miles’s portfolio pull. Cite [House 007](/house007) when you cite **00015**.

Redact before filing: account numbers, routing numbers, named brokerage logins, exact share counts if they identify the steward. Keep: cadence, connector, output shape, would-run-again.

## Would-run-again and what a patch must prove

`would_run_again` is yes. A patch must show a better live pull or a clearer brief with evidence — not a hotter ticker call. 24-hour veto. Same serial.

File your own at [File a Run](/submit) after it ran. Check [runs.json](/runs.json). Do not invent `/house005/00099`.

The prompt on the JSON: pull live portfolio data every morning; brief overnight moves and upcoming market events; flag positions worth rebalancing; use **web**; verify the bot can see the logged-in session. Full text: [00007.md](/house005/00007.md).

## Constraints and non-goals

- Redact account numbers. Keep the method.
- Do not treat flags as orders.
- This page is not financial advice.
- Do not invent serials. Do not scrape House 005 into a prompt pack.

## Proof

- Run: [00007 — Morning briefing from live portfolio data](/house005/00007)
- Run: [00015 — Configure Grok Bot to print morning briefing to home printer](/house007/00015)
- House: [House 005](/house005) (Miles Deutscher)
- Markdown twin: [00007.md](/house005/00007.md)
- Board: [File a Run](/submit)
- External: [Grok Bot computer and apps](https://docs.x.ai/grok-bot/computer-and-apps), [Grok 4.5 model card](https://docs.x.ai/developers/models/grok-4.5)
