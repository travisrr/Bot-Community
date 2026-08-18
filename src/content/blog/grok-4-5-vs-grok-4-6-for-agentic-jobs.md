---
title: "Grok 4.5 vs Grok 4.6 for agentic jobs: context, reasoning effort, the 200k cliff"
week: 5
pillar: State of Grok
description: "Official xAI model cards for people who loop a bot overnight: 500k context, reasoning_effort, and the 200k prompt-token price cliff. Internal example: Run 00012."
published: 2026-08-18
primaryQuery: "grok 4.5 vs grok 4.6"
secondaryQueries:
  - "grok 4.5 token pricing 200k threshold"
  - "grok 4.6 long-running agents"
faqs:
  - q: "What is the difference between Grok 4.5 and Grok 4.6?"
    a: "Both ship 500k context, function calling, structured outputs, and reasoning. Grok 4.6 adds reasoning_effort xhigh and is positioned for long-running agents. Cached input is cheaper on Grok 4.5 ($0.30 vs $0.50 per 1M under 200k)."
  - q: "What is the 200k prompt-token price cliff?"
    a: "On Grok 4.5 and Grok 4.6, a request whose prompt reaches 200k tokens is billed at 2× for all tokens in that request: $4 / $12 per 1M input/output instead of $2 / $6."
  - q: "Which model should a Grok Bot routine use?"
    a: "Use Grok 4.6 when the job is a long-running agent or needs xhigh reasoning. Use Grok 4.5 when cached-input price matters and high is enough. Run 00012 is the overnight example, not a benchmark."
  - q: "Does Grok 4.6 have a larger context window than Grok 4.5?"
    a: "No. Both model cards list a 500,000 token context window. The 200k line is a price threshold, not the context cap."
  - q: "Where are the official numbers?"
    a: "xAI model cards for grok-4.5 and grok-4.6, the models index, pricing, and the reasoning_effort page. Do not use scraped blogs as the rate card."
---

**Grok 4.5** and **Grok 4.6** share a 500k context window and a 200k prompt-token price cliff. **Grok 4.6** is the long-running-agent card. Official numbers only: [grok-4.5](https://docs.x.ai/developers/models/grok-4.5), [grok-4.6](https://docs.x.ai/developers/models/grok-4.6). Internal example, not a scoreboard: [Run 00012](/house005/00012) on [House 005](/house005) (Miles Deutscher).

## What shipped (4.5 then 4.6)

**Grok 4.5** launched 16 Jul 2026 as xAI’s model for coding, agentic tasks, and knowledge work ([news](https://x.ai/news/grok-4-5)). **Grok 4.6** launched 12 Aug 2026 with a stated focus on long-running agents and more ambitious interactive and visual work ([news](https://x.ai/news/grok-4-6)).

API names: `grok-4.5` (aliases `grok-4.5-latest`, `grok-build-latest`) and `grok-4.6`. Both cards list text + image → text, function calling, structured outputs, and reasoning. Both list 500,000 token context. Headline API price in the news posts is $2 / $6 per 1M input/output — the cards add the 200k cliff and cached-input rows.

**Grok Bot** the product is not the same object as the API model string. A Bot on a cloud computer can call these models; a Next.js app can too. Filing a serial is a later step.

## Comparison table: context, modalities, reasoning_effort

| Field | Grok 4.5 | Grok 4.6 |
| --- | --- | --- |
| Model name | `grok-4.5` | `grok-4.6` |
| Context | 500,000 tokens | 500,000 tokens |
| Modalities | text, image → text | text, image → text |
| Function calling | Yes | Yes |
| Structured outputs | Yes | Yes |
| Reasoning | Yes; cannot disable | Yes; cannot disable |
| `reasoning_effort` | `low` / `medium` / `high` (default) | `low` / `medium` / `high` (default) / `xhigh` |
| Input / 1M &lt; 200k prompt | $2.00 | $2.00 |
| Input / 1M ≥ 200k prompt | $4.00 | $4.00 |
| Cached input / 1M &lt; 200k | $0.30 | $0.50 |
| Cached input / 1M ≥ 200k | $0.60 | $1.00 |
| Output / 1M &lt; 200k | $6.00 | $6.00 |
| Output / 1M ≥ 200k | $12.00 | $12.00 |
| Positioning | Coding, agents, knowledge work | Long-running agents; interactive / visual work |

Sources: the two [model cards](https://docs.x.ai/developers/models), [pricing](https://docs.x.ai/developers/pricing), [reasoning](https://docs.x.ai/developers/model-capabilities/text/reasoning). On models that lack `xhigh`, xAI treats that value as `high`. Default `reasoning_effort` is `high`. Reasoning tokens bill as consumption.

## The 200k prompt-token price cliff

If the prompt reaches 200k tokens, the **entire request** bills at the higher rate — all tokens, not only the overflow. That is the sentence on both cards.

A 199k-token prompt on **Grok 4.6** is $2 / $6 per 1M. A 200k-token prompt is $4 / $12 per 1M for input and output on that request. Cached input doubles the same way ($0.50 → $1.00 on 4.6; $0.30 → $0.60 on 4.5).

Agent loops die here: system prompt + skills + thread + tool dumps. Crossing 200k is a price event, not a capability unlock. The context cap is still 500k. Worked examples sit in [Token math for Grok Bot loops](/blog/token-math-for-grok-bot-loops).

## When 4.6’s long-running focus matters

Use **Grok 4.6** when the job is supposed to stay with a codebase or a research trail overnight — the vendor’s own sentence. [Run 00012](/house005/00012) is the board’s overnight coding loop (Fable 5, House 005). The filing is an imported use-case thread, not a token bill. It is the job shape, not a benchmark.

Use **Grok 4.5** when you want the cheaper cached-input row and `high` is enough: morning **Slack** triage ([Run 00010](/house005/00010)), a short **Gmail** list ([Run 00003](/house001/00003)).

**Grok Build** / `grok-build-latest` currently aliases **Grok 4.5** on the 4.5 card. Do not assume an overnight **Grok Bot** job is the same loop as Grok Build. Compare those paths in the [00012 breakdown](/blog/run-00012-overnight-coding-loop-through-fable-5).

## What actually ran (model card vs a serial)

[Run 00012](/house005/00012) does not name `grok-4.5` or `grok-4.6`. The connector is **Fable**. The steward is [House 005](/house005) (Miles Deutscher). Published 18 Aug 2026. Evidence is the public use-case thread. Use it as the overnight *job shape*, not as a latency score.

[Run 00010](/house005/00010) is the short morning job: **Slack** triage, same House, same publish batch. If you only needed a routine that stays under 200k, that is the shape.

Rate limits on both cards, as of the docs fetch: 150 requests per second, 50,000,000 tokens per minute. Regions listed: `us-east-1`, `us-west-2`. Those are API limits, not **Grok Bot** product limits.

| When to pick | Model | Why |
| --- | --- | --- |
| Overnight coding, long agent trail, need `xhigh` | `grok-4.6` | Vendor positioning + extra effort level |
| Cached-input price, `high` is enough, morning ops | `grok-4.5` | $0.30 vs $0.50 cached input under 200k |
| Grok Build in the product | Follow the alias on the card | `grok-build-latest` → `grok-4.5` today |
| Filing a serial | Neither | The API does not stamp [Run 00001](/house001/00001) |

News dates so a crawler can extract them: **Grok 4.5** on 16 Jul 2026 ([x.ai/news/grok-4-5](https://x.ai/news/grok-4-5)); **Grok 4.6** on 12 Aug 2026 ([x.ai/news/grok-4-6](https://x.ai/news/grok-4-6)). Copilot notes exist for both; they are distribution, not a third model card.

Do not mix the 200k *price* line with the 500k *context* line. A 300k prompt fits in context and still bills at the cliff.

## Steps for picking a model on a Grok Bot routine

1. Write the job and the connector list first. [Run 00010](/house005/00010) is **Slack**. [Run 00012](/house005/00012) is **Fable**. The model string does not appear on those filings.
2. If the loop is a morning brief and the prompt stays small, pick **Grok 4.5** for the cheaper cached-input row.
3. If the loop is overnight or needs `xhigh`, pick **Grok 4.6**. Read the [4.6 news](https://x.ai/news/grok-4-6) sentence on long-running agents.
4. Set `reasoning_effort` to `high` for the plan and `low` for tool steps ([reasoning](https://docs.x.ai/developers/model-capabilities/text/reasoning)).
5. Keep the system prompt stable. Crossing 200k doubles the request. Details: [token math](/blog/token-math-for-grok-bot-loops).
6. File the finished job. The model name can go in the filing as a note. It does not become the serial.

Function calling and structured outputs are yes on both cards. They are not a reason to pick 4.6 over 4.5. The reasons are `xhigh`, long-running positioning, and the cached-input price gap.

## Constraints and non-goals

- Official xAI rates only. No scraped blogs as the rate card.
- No invented latency or SWE-bench theater.
- [Run 00012](/house005/00012) is an example of an overnight job, not a score.
- This page is not financial advice.
- Do not invent serials.

## Proof

- Run: [00012 — Overnight coding loop through Fable 5](/house005/00012)
- Run: [00010 — Morning Slack triage for urgent messages only](/house005/00010)
- House: [House 005](/house005) (Miles Deutscher)
- Board: [every verified serial](/runs)
- External: [Grok 4.5 card](https://docs.x.ai/developers/models/grok-4.5), [Grok 4.6 card](https://docs.x.ai/developers/models/grok-4.6), [reasoning_effort](https://docs.x.ai/developers/model-capabilities/text/reasoning), [Grok 4.6 news](https://x.ai/news/grok-4-6)
