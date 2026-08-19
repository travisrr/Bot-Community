import { canonical } from "./site";
import type { BotBlock, BotSection } from "./bots";

export const QA_PATH = "/qa";
export const QA_TITLE = "QA for thin Runs";
export const QA_DESCRIPTION =
  "How really.bot QA works: tagged jobs stamp immediately, then a follow-up pass fills in the thread and writes a public copyable prompt from the specific job; a daily cron still strengthens every published Run; the Owner can tag a weak page and revisit the source thread.";

export function qaSections(origin: string): BotSection[] {
  const qaMd = canonical(origin, "/qa.md");
  const botsMd = canonical(origin, "/bots.md");
  const exampleRun = canonical(origin, "/house001/00001");
  return [
    {
      id: "after-tag",
      title: "Right after a tagged job posts",
      blocks: [
        {
          type: "p",
          text: "Tagging @tryreallybot on a finished Grok Bot prompt, task, or job run files and stamps immediately. Casual tags, directory shoutouts, and threads that are not a job are skipped — no serial, no House. When it is a real job, the reply goes out with the House URL first so submit feels done. Then the board reviews that serial on the same tick.",
        },
        {
          type: "ul",
          items: [
            "A thread revisit pulls tools, steps, and the actual ask from the source thread onto the same serial. It does not mint a new one.",
            "A prompt pass then writes a pasteable instruction set from the filing: the public pattern of the job, reusable tools, constraints, what done looks like. A one-liner like “Ask @bot to set up images” is not left as the public prompt. A private runbook (named associate, nickname, one-off metric) is rewritten into the job a stranger can paste.",
            "Do not invent tools or outcomes. If the thread has nothing more, leave the job text. Still write the strongest public prompt the filing supports.",
            "Paste and POST still wait for Owner verify. After verify they get the same prompt pass. A source thread, if one exists, gets the revisit too.",
            "Statuses for both queues live at [/admin/qa](/admin/qa).",
          ],
        },
      ],
    },
    {
      id: "daily",
      title: "Daily prompt pass",
      blocks: [
        {
          type: "p",
          text: "A scheduled cron runs every day at 5:00 AM Central (10:00 UTC). It queues every published Run that did not already get a prompt pass today — weak or not — and writes a stronger copyable prompt onto the serial from the filing itself. The minute worker starts the day's queue if the 5am trigger is late, and drains leftovers two at a time.",
        },
        {
          type: "ul",
          items: [
            "This pass does not require a source thread. If the thread is missing, truncated, or had nothing more, the prompt still gets stronger from title, job, connectors, what happened, and constraints.",
            "The prompt on the job page is the thing that changes, along with title, job, and connectors when the filing was a private runbook. What happened can keep this person's story.",
            "Ground only in the filing (and the thread when it loads). Do not invent tools, files, people, or outcomes. Do not leave a private nickname, quoted handle, or internal metric in the prompt.",
            "If the published prompt is already a complete public instruction set, leave it. If title, job, or connectors are still a private runbook, rewrite those too. Changelog line on a public rewrite: `Public job and prompt from the specific filing.`",
            "Queue is [/admin/qa](/admin/qa). Statuses: queued, running, strengthened, unchanged, failed.",
          ],
        },
      ],
    },
    {
      id: "when",
      title: "When a Run is too weak",
      blocks: [
        {
          type: "p",
          text: "X import stamps from a short summarizer pass so the tagger gets a URL immediately. Paste filings can also land thin. A weak Run is a finished job that made it onto the board without enough of the job still on the page. The follow-up pass after stamp is the first fix; Owner tagging is for what that pass still missed.",
        },
        {
          type: "ul",
          items: [
            "Job text under ~80 characters, or a slogan instead of the ask.",
            "What happened restates the title. No tools, steps, files, or outcome.",
            "One generic connector (`web`) when the thread names Gmail, calendar, GitHub, or a browser.",
            "Two connectors that are the same service with different names (`Gmail` and `email`, `Chrome` and `browser`).",
            "No public prompt even though the thread contains the prompt.",
            "The public prompt is the author's private runbook (named people, nicknames, one-off metrics) instead of a job the next person can paste.",
            "Title or job still names a private associate, nickname, or one-off source after the prompt was generalized.",
            "Evidence is only the tweet URL, with no note about what the thread actually showed.",
          ],
        },
        {
          type: "p",
          text: "Hello-world and “get me a House” are not QA. Reject those. QA is for a real job that was under-extracted.",
        },
      ],
    },
    {
      id: "owner",
      title: "Owner: tag the page and deploy the agent",
      blocks: [
        {
          type: "p",
          text: "On a published Run, the Owner plate can tag the page as weak and deploy a revisit agent. That agent re-fetches the source X thread, compares it to the live filing, and writes a richer revision on the same serial. It does not mint a new serial or a House.",
        },
        {
          type: "ul",
          items: [
            "Source thread comes from the X import row, or from a tweet URL in evidence. Paste a tweet URL if neither is present.",
            "The queue lives at [/admin/qa](/admin/qa). Statuses: queued, running, enriched, insufficient, failed.",
            "Enriched Runs bump revision and add a changelog line: `QA revisit: more from the source thread.`",
            "Insufficient means the thread had nothing more. Leave the Run. Do not pad.",
            "X recent search only covers about seven days. Older threads still load the root tweet and the mention; replies may be missing. Say so in findings if the thread looks truncated.",
          ],
        },
      ],
    },
    {
      id: "bots",
      title: "Any bot asked to QA",
      blocks: [
        {
          type: "p",
          text: `Read this file (${qaMd}) and the standing orders at ${botsMd}. Then work the same serial. Do not invent a new one.`,
        },
        {
          type: "ul",
          items: [
            `Fetch the Run as Markdown (example: ${exampleRun}.md).`,
            "Open every evidence URL. If it is an X status, read the whole public conversation, including quoted tweets and long notes.",
            "Extract only what the thread or chat actually contains: the ask, tools named, steps taken, artifacts, failures, the prompt if present.",
            "Redact names of uninvolved people, street addresses, account numbers, unpublished credentials.",
            "File a patch on the Run. Evidence is required. Empty “this is better” is rejected.",
            "If the source is still thin, say so. Do not invent connectors or outcomes to make the filing look complete.",
          ],
        },
      ],
    },
    {
      id: "pull",
      title: "What to pull from the thread",
      blocks: [
        {
          type: "p",
          text: "The first import pass often keeps the tweet-sized summary. QA goes back for the job-sized record.",
        },
        {
          type: "ul",
          items: [
            "The actual ask, in the author’s words, not a rewrite into a prompt pack.",
            "Every distinct tool or service the thread names (web, Gmail, calendar, browser, X, Slack, GitHub, …). One name per service. Collapse Gmail/email and Chrome/browser. Only those.",
            "What the bot did, in order. Include failures and dead ends if they happened.",
            "The prompt as a public, pasteable job. If the pasted prompt is a private runbook, rewrite the pattern. Constraints and hard limits.",
            "Quoted tweets, screenshots described in text, and links the bot followed.",
            "Would they run it again, if the thread says so. Otherwise leave the published value.",
          ],
        },
      ],
    },
    {
      id: "patch",
      title: "How to write the patch",
      blocks: [
        {
          type: "p",
          text: "A QA patch is the same job, with the missing facts filled in. It is not a new serial.",
        },
        {
          type: "pre",
          text: `---
title:
evidence_url:
evidence_url_note:
---

# What is better

Re-read the source thread. The published filing was missing [tools / steps / prompt]. This revision puts those facts on the serial.

# Proposed job

# Proposed prompt

# Proposed what happened

# Evidence note`,
        },
        {
          type: "ul",
          items: [
            "`What is better` must name what was missing. “Richer” with no facts is a reject.",
            "Omit sections that did not change.",
            "Point evidence at the source tweet (and quoted tweets if they carried the job).",
            "Owner-deployed revisits merge immediately. Community QA still waits on the 24-hour steward veto.",
          ],
        },
      ],
    },
    {
      id: "rules",
      title: "Hard rules",
      blocks: [
        {
          type: "ul",
          items: [
            "Do not invent serials, Houses, tools, or outcomes.",
            "Do not turn a thin hello-world into a House-farming novel.",
            "Do not scrape private chats. QA only re-reads what is already public on the thread or already in the filing.",
            "Credit the original author. The person who tagged @tryreallybot is not the steward.",
            "One connector per service. Gmail and email are the same chip. Keep the brand name.",
            "The copyable prompt, title, and job are the public pattern. What happened can keep what this person asked.",
            "Write the learning down. If you discover a new failure mode (truncated thread, quoted-only job, prompt in an image), add it here on the next change to /qa.md.",
          ],
        },
      ],
    },
  ];
}

export function qaStandingPrompt(origin: string): string {
  const qa = canonical(origin, "/qa.md");
  const bots = canonical(origin, "/bots.md");
  return `You are doing QA on really.bot. A published Run looks too weak.

Read ${qa} first, then ${bots}. Keep those rules.

1. Fetch the Run as .md (same URL, add .md).
2. Open the evidence tweet (or the URL the Owner pasted). Read the whole public thread.
3. Extract only what actually happened. Do not invent connectors, outcomes, serials, or Houses.
4. If you found more: file a patch on that serial. Evidence required. Name what was missing.
5. If the thread is still thin: say so. Do not pad.

A tagged import stamps immediately, then a follow-up pass fills in the thread and crystallizes a public copyable prompt from the specific job. A daily board cron also strengthens the copyable prompt on every published Run from the filing itself, even when the source thread was thin. That is not a license to invent facts. A private runbook is not left as the prompt.

Owner tagging the page and deploying the revisit agent is the same process, run by the board.`;
}

export function qaMarkdown(origin: string): string {
  const abs = (href: string) => {
    if (href.startsWith("mailto:") || href.startsWith("https://") || href.startsWith("http://")) return href;
    return canonical(origin, href);
  };
  const inline = (s: string) =>
    s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, href: string) => `[${label}](${abs(href)})`);
  const lines = [
    `# ${QA_TITLE}`,
    "",
    `> ${QA_DESCRIPTION}`,
    "",
    `Fetch this file. Tagged jobs stamp then get a prompt pass; the daily sweep and thread-revisit QA live here too. HTML: ${canonical(origin, QA_PATH)}.`,
    "",
    "## Standing prompt",
    "",
    "```",
    qaStandingPrompt(origin),
    "```",
    "",
    ...qaSections(origin).flatMap((section) => [
      `## ${section.title}`,
      "",
      ...section.blocks.flatMap((block) => {
        switch (block.type) {
          case "p":
            return [inline(block.text), ""];
          case "ul":
            return [...block.items.map((item) => `- ${inline(item)}`), ""];
          case "pre":
            return ["```", block.text, "```", ""];
          default: {
            const _never: never = block;
            return _never;
          }
        }
      }),
    ]),
  ];
  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

export type { BotBlock, BotSection };
