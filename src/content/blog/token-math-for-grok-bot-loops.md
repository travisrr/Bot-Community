---
title: "Token math for Grok Bot loops: prompt caching, reasoning_effort, staying under 200k"
week: 9
pillar: State of Grok
description: "Worked cost examples for a morning Slack triage versus an overnight coding loop, using published xAI Grok 4.5 / 4.6 rates only."
published: 2026-08-18
primaryQuery: "grok 4.5 token pricing 200k threshold"
secondaryQueries:
  - "grok 4.5 vs grok 4.6"
faqs:
  - q: "What does a morning Slack triage cost?"
    a: "If the prompt stays under 200k, official Grok 4.5 / 4.6 input is $2 per 1M tokens and output is $6 per 1M. A small morning Slack job is usually a fraction of a cent unless you paste the workspace."
  - q: "What happens if a Grok Bot loop crosses 200k prompt tokens?"
    a: "The whole request bills at 2× on Grok 4.5 and Grok 4.6: $4 / $12 per 1M input/output. Cached input doubles too. That is a price cliff, not a context upgrade. Context is still 500k."
  - q: "Should I rewrite the system prompt every step?"
    a: "No. Cached input is $0.30 per 1M on Grok 4.5 and $0.50 per 1M on Grok 4.6 under 200k. Rewriting the system prompt every turn throws away the cheap row."
  - q: "When should reasoning_effort be high?"
    a: "Default is high. Use high (or xhigh on Grok 4.6) for the plan. Use low for latency-sensitive tool steps. Reasoning tokens bill as consumption and cannot be disabled."
---

Official **Grok 4.5** and **Grok 4.6** rates only. The 200k line doubles the request. Cache the system prompt. Turn `reasoning_effort` down on the steps. Worked shapes: [Run 00010](/house005/00010) (morning **Slack**) vs [Run 00012](/house005/00012) (overnight coding). Steward: [House 005](/house005). Cards: [grok-4.5](https://docs.x.ai/developers/models/grok-4.5), [grok-4.6](https://docs.x.ai/developers/models/grok-4.6).

## The published rates

Per 1M tokens, from the [models index](https://docs.x.ai/developers/models) and [pricing](https://docs.x.ai/developers/pricing):

| Model | Prompt size | Input | Cached input | Output |
| --- | --- | --- | --- | --- |
| `grok-4.5` | &lt; 200k | $2.00 | $0.30 | $6.00 |
| `grok-4.5` | ≥ 200k | $4.00 | $0.60 | $12.00 |
| `grok-4.6` | &lt; 200k | $2.00 | $0.50 | $6.00 |
| `grok-4.6` | ≥ 200k | $4.00 | $1.00 | $12.00 |

If the prompt reaches 200k, the higher rate applies to **all** tokens on that request. Context remains 500k on both cards. News posts that only quote $2 / $6 are the headline row, not the cliff.

These are API rates. **Grok Bot** the product may bundle usage. Do not invent a Bot subscription price here.

## Why agent loops cross 200k

Loops add: system prompt + skills + thread + tool payloads + screenshots-as-text. Overnight coding ([Run 00012](/house005/00012)) is the shape that crosses. Morning **Slack** triage ([Run 00010](/house005/00010)) should not — unless you paste the workspace.

1. Keep the system prompt stable so cached input applies.
2. Cap tool output. Summarize **Slack** permalinks; do not ingest the channel.
3. Reset or summarize the thread before the next scheduled run. Do not append every morning to one 400k conversation.
4. Bound the overnight repo. Do not feed `node_modules`.
5. Watch the prompt token count the API returns. 199k and 200k are different bills.

**Grok 4.6** long-running positioning ([news](https://x.ai/news/grok-4-6)) does not waive the cliff.

## Cached input vs rewriting the system prompt

Cached input is the cheap row: $0.30 vs $2.00 on **Grok 4.5** under 200k; $0.50 vs $2.00 on **Grok 4.6**. Above 200k it is still cheaper than raw input, and still 2× the under-200k cache rate.

Rewriting the system prompt every step (new date stamp in the first line, shuffled skills, pasted “you are”) misses the cache. Put the date in the user turn. Keep standing orders identical.

## reasoning_effort: high for plan, lower for steps

From the [reasoning page](https://docs.x.ai/developers/model-capabilities/text/reasoning):

| Effort | Official use | Loop use |
| --- | --- | --- |
| `low` | Latency-sensitive agentic use and simple tool calling | Each **Slack** fetch / file edit |
| `medium` | Complex data analysis, long-context reasoning | Mid-loop synthesis |
| `high` (default) | Hard problems, multi-step logic | The plan, the morning brief |
| `xhigh` (**Grok 4.6** only) | Hardest problems; higher latency | Overnight architecture pass |

Reasoning cannot be disabled. `xhigh` on **Grok 4.5** is treated as `high`. Reasoning tokens bill.

Worked illustration — not a measured bill, because the serials do not publish token counts:

**Morning Slack ([Run 00010](/house005/00010)), stay under 200k, `grok-4.5`.** 8k prompt (4k cached) + 1k output ≈ 4k × $0.30/1M + 4k × $2/1M + 1k × $6/1M. That is well under a cent. Paste a 250k-token export and the same morning is a $4 / $12 request.

**Overnight coding ([Run 00012](/house005/00012)), `grok-4.6`.** One 210k-token prompt step bills the whole step at $4 / $12 per 1M. Ten such steps dominate the night. Stay under 200k per request or accept the cliff.

## Worked requests (illustrative, not a bill from the serials)

The filings do not include token counts. These are arithmetic on the published rates so a crawler can extract the cliff, not a claim that Miles spent this.

**Stay under — morning Slack, `grok-4.5`, cached system prompt.**

| Line | Tokens | Rate | Cost |
| --- | --- | --- | --- |
| Cached system / skill | 4,000 | $0.30 / 1M | $0.0012 |
| Uncached user + Slack summary | 3,000 | $2.00 / 1M | $0.0060 |
| Output brief | 800 | $6.00 / 1M | $0.0048 |
| **Request total** | | | **~$0.012** |

**Cross the cliff — same job after you paste a 200k-token export, `grok-4.5`.**

| Line | Tokens | Rate | Cost |
| --- | --- | --- | --- |
| Prompt (entire request now ≥ 200k) | 200,000 | $4.00 / 1M | $0.80 |
| Output | 800 | $12.00 / 1M | $0.0096 |
| **Request total** | | | **~$0.81** |

That is ~70× the morning for one request, because the cliff applies to all tokens. **Grok 4.6** is the same $2 / $6 vs $4 / $12 on raw input/output; only cached input differs ($0.50 / $1.00).

**Overnight, ten `grok-4.6` steps at 180k prompt + 4k output each (still under the cliff):** 10 × (180k × $2 + 4k × $6) / 1M ≈ $3.84. The same ten steps at 210k prompt: 10 × (210k × $4 + 4k × $12) / 1M ≈ $8.88. The extra 30k tokens more than doubled the night because every step crossed 200k.

Keep the standing orders identical so cached input applies. Put the date in the user turn. Summarize **Slack** and **GitHub** tool output. Reset the thread between scheduled mornings.

## Steps that keep a loop under 200k

1. Measure the prompt tokens the API returns on a dry run. If you cannot see tokens, you cannot manage the cliff.
2. Freeze the system prompt and the skill text. That is the cached-input prefix.
3. Put today’s date, the **Slack** permalink list, and the **GitHub** issue list in the user turn, then drop them on the next morning.
4. Cap tool payloads. A channel export is how [Run 00010](/house005/00010) becomes a $0.80 request.
5. For overnight jobs like [Run 00012](/house005/00012), bound the repo and summarize diffs. Do not feed the tree every step.
6. Use `reasoning_effort: "low"` on tool steps. Save `high` / `xhigh` for the plan ([reasoning](https://docs.x.ai/developers/model-capabilities/text/reasoning)).
7. File the job with the method, not the token bill, unless you have a public invoice. These serials do not include one.

Rates change when xAI updates the [pricing table](https://docs.x.ai/developers/pricing). Re-read that page; do not cache this blog as the rate card.

## Constraints and non-goals

- Official xAI rates only. No third-party price blogs.
- No invented token counts on [Run 00010](/house005/00010) or [Run 00012](/house005/00012). Those filings do not include a bill.
- This page is not financial advice.
- Do not invent serials.

## Proof

- Run: [00010 — Morning Slack triage for urgent messages only](/house005/00010)
- Run: [00012 — Overnight coding loop through Fable 5](/house005/00012)
- House: [House 005](/house005) (Miles Deutscher)
- Board: [every verified serial](/runs)
- External: [pricing](https://docs.x.ai/developers/pricing), [reasoning_effort](https://docs.x.ai/developers/model-capabilities/text/reasoning), [Grok 4.5 card](https://docs.x.ai/developers/models/grok-4.5), [Grok 4.6 card](https://docs.x.ai/developers/models/grok-4.6)
