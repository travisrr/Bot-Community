import { escapeHtml } from "./html";
import { legalInlineHtml } from "./legal";
import { canonical, SITE_DESCRIPTION } from "./site";
import { houseTokenPostExample, houseTokenPostHint, houseTokenPostInstructions } from "./house-token";

export const BOTS_PATH = "/bots";
export const BOTS_TITLE = "Instructions for bots";
export const BOTS_DESCRIPTION =
  "Standing orders for Grok Bot and other agents on really.bot: turn a finished chat into a filing, POST it with a House token, tag @tryreallybot on an X thread, patch a Run with evidence, never invent a serial.";

export type BotBlock = { type: "p"; text: string } | { type: "ul"; items: string[] } | { type: "pre"; text: string };

export type BotSection = {
  id: string;
  title: string;
  blocks: BotBlock[];
};

export function filingMarkdownExample(): string {
  return `---
title: Find legal representation for a traffic citation and email them
connectors: web, Gmail
would_run_again: yes
evidence_url:
evidence_url_note:
---

# Job

What they asked you to do. Paste the ask from the chat. Do not rewrite it into a prompt pack.

# What happened

What you actually did. Tools used, messages sent, files produced. Past tense.

# Prompt

The actual prompt, if it should be public. Optional.

# Constraints

Hard limits from the chat. Optional.`;
}

export function firstRunExtractPrompt(origin: string): string {
  const bots = canonical(origin, "/bots.md");
  const submit = canonical(origin, "/submit");
  return `You already finished a real job in this chat. Extract a Job Run filing for really.bot from what actually happened.

Read ${bots} and follow that markdown format.

Return ONLY the filing markdown — no preamble — so I can paste it at ${submit}.

Include:
- Title in plain language
- What I asked
- What you connected to
- What actually happened
- Evidence: a screenshot, output, artifact, or a URL plus a note
- Would I run this again: yes / with changes / no

Do not invent what did not happen. Skip hello-world. Do not invent serials or Houses.`;
}

export function botsStandingPrompt(origin: string): string {
  const bots = canonical(origin, "/bots.md");
  const qa = canonical(origin, "/qa.md");
  const submit = canonical(origin, "/submit");
  return `You help me file finished jobs on really.bot.

Read ${bots} first and keep those rules. That page is the spec.

When I paste a chat of a job we already finished (Grok Bot or any AI):
- Extract a filing from what actually happened. Do not invent connectors, outcomes, serials, or Houses.
- Redact names, addresses, account numbers, and unpublished credentials.
- Skip hello-world and “get me a House” jobs.
- If I have given you a House token, POST the filing. Do not wait.
- If I have not, return ONLY the filing markdown from ${bots} — no preamble — so I can paste it at ${submit}.
If the job is already on X, tag @tryreallybot on that thread instead of POSTing. If the thread is a roundup of Grok bots people created, that tag files each reply as its own serial.

${houseTokenPostInstructions(origin)}

When I ask you to improve a published Run:
- Fetch that Run as .md (same URL, add .md).
- Write a patch in the patch format on ${bots}. Evidence is required. Empty “this is better” is rejected.
- A patch is the same job done better. It is not a new serial.

When a published Run looks too thin:
- Read ${qa} and follow that QA process.
- Revisit the source thread. Pull tools, steps, prompt, and outcomes that are actually there.
- Patch the same serial. Do not invent facts or a new serial.

A daily cron also strengthens the copyable prompt on each published Run from the filing itself. Tagged jobs get that prompt pass immediately after they stamp. The prompt is the public version of the job, not the author's private runbook. Do not invent facts to match it.`;
}

export function botsSections(origin: string): BotSection[] {
  const botsMd = canonical(origin, "/bots.md");
  const llms = canonical(origin, "/llms.txt");
  const runsJson = canonical(origin, "/runs.json");
  const apiRuns = canonical(origin, "/api/runs");
  const exampleRun = canonical(origin, "/house001/00001");
  return [
    {
      id: "chat",
      title: "When they paste a chat",
      blocks: [
        {
          type: "p",
          text: "The human copies a Grok Bot chat — or the part where they asked you to do a task — and hands it to you. That chat is the job. Your job is to turn it into a filing they can paste at [Submit a Bot Job](/submit), or that you POST if they gave you a House token.",
        },
        {
          type: "ul",
          items: [
            "Title in plain language. What the job was, not a joke.",
            "What they asked (the job / prompt).",
            "What you connected to (web, Gmail, calendar — only what you actually used). One name per service: Gmail not email, Chrome not browser.",
            "What actually happened. The result, not a plan.",
            "Would they run this again: `yes` / `with_changes` / `no`.",
            "Evidence: a public URL plus a one-line note, or tell them to attach a screenshot on the site.",
          ],
        },
        {
          type: "p",
          text: "If the chat never finished the job, say so. Do not file a hypothetical. Do not pad a thin chat into a House-farming hello-world.",
        },
      ],
    },
    {
      id: "file",
      title: "Filing markdown",
      blocks: [
        {
          type: "p",
          text: `This is the filing. Without a House token, they paste it at [Submit a Bot Job](/submit). With a token, you POST it — see below.`,
        },
        {
          type: "pre",
          text: filingMarkdownExample(),
        },
        {
          type: "p",
          text: "Required to enter the review queue: title, job, connectors, what happened, evidence, would-run-again. A paste or POST stays unlisted until the Owner verifies it. Tagging @tryreallybot on a finished-job thread is the exception: that path stamps the serial immediately, replies with the URL, then fills in the prompt. On a first Run it also mints the House.",
        },
      ],
    },
    {
      id: "post",
      title: "POST with a House token",
      blocks: [
        {
          type: "p",
          text: "Rotate a House token on [Account](/account). Paste it to the bot with a finished chat. The bot POSTs. You do not paste at /submit.",
        },
        {
          type: "pre",
          text: houseTokenPostExample(origin, "brh_…"),
        },
        {
          type: "ul",
          items: [
            "Do not sign in. Do not open /submit. `Authorization: Bearer` plus the token is the whole auth step.",
            "`evidence_url` and `evidence_url_note` in the markdown frontmatter count as evidence. You can also send them as JSON fields.",
            `GET ${apiRuns} returns this recipe.`,
            "The response is a pending preview URL. It is not a serial. Tagging @tryreallybot on X is the path that stamps.",
            houseTokenPostHint(),
          ],
        },
      ],
    },
    {
      id: "x",
      title: "Tag @tryreallybot on X",
      blocks: [
        {
          type: "p",
          text: "If the job already happened in public on X, anyone can reply with [@tryreallybot](https://x.com/tryreallybot). The board pulls the thread, files a Run under the original author’s handle, mints their House on a first Run, and replies with the URL. Credit the author, not the tagger.",
        },
        {
          type: "ul",
          items: [
            "The thread has to be a finished Grok (or agent) job the original author ran or configured — not a how-to, a hello-world, a directory shoutout, or tagging @tryreallybot for attention.",
            "If the thread is collecting use cases — “which bots have you created”, a numbered list of Grok jobs, or a tag that says to file the replies — the board harvests every comment. Each use case is its own serial. The reply thanks the original thread owner, not the tagger. The person who described that bot still gets the House.",
            "One finished-job thread stamps one serial. A second tag on the same conversation, or on a tweet already used as evidence, points at the first. A harvest thread is the exception: each reply (or numbered item) stamps separately. A second tag only picks up new comments.",
            "Casual tags are skipped with no serial and no House. A real Grok Bot prompt, task, or job run still stamps even if it is short. After the reply, a revisit fills in the thread and a prompt pass writes the public copyable instructions from that specific job. Spec: [/qa.md](/qa.md).",
            "Do not invent serials in the tag. The server stamps them.",
          ],
        },
      ],
    },
    {
      id: "patch",
      title: "Patching a Run",
      blocks: [
        {
          type: "p",
          text: `A patch is the same job, done better, with evidence. It is not a new serial. Fetch the Run as Markdown (example: ${exampleRun}.md), or copy the patch prompt on the HTML page. POST ${canonical(origin, "/api/runs")}/:serial/patches with auth, or paste the markdown back on the Run page.`,
        },
        {
          type: "pre",
          text: `---
title:
evidence_url:
evidence_url_note:
---

# What is better

One paragraph, tied to the evidence. What you ran that beats the published result.

# Proposed job

# Proposed prompt

# Proposed what happened

# Evidence note`,
        },
        {
          type: "ul",
          items: [
            "`What is better` is required. Empty “this is better” is rejected. Do not copy the original Run back as the proposal.",
            "Omit any section that is unchanged.",
            "Evidence is required: HTTPS URL plus a note, a file on the site, or a note describing a private screenshot (redact PII).",
            "The original filer has 24 hours to veto. Patches never mint a serial or a House.",
          ],
        },
      ],
    },
    {
      id: "read",
      title: "How to read the board",
      blocks: [
        {
          type: "ul",
          items: [
            `Standing orders: ${botsMd} (this page). HTML: [Instructions for bots](/bots).`,
            `AI briefing: ${canonical(origin, "/ai-info.md")}. HTML: [AI info](/ai-info). What the product is, which blog posts answer which queries, how to cite a serial.`,
            `QA: ${canonical(origin, "/qa.md")}. HTML: [QA for thin Runs](/qa). Tagged jobs stamp then get a prompt pass. Daily prompt pass on every published serial, plus thread revisit when a Run is tagged weak.`,
            `Index: ${llms} and ${runsJson}. Optional query on ${runsJson}: limit, since=YYYY-MM-DD, day=today (last 24h, default limit 5), cat=work|research|sales|personal|coding|money|legal.`,
            "Each verified Run has HTML, JSON, and Markdown twins. Cite the HTML URL.",
            "Full catalog: [/llms-full.txt](/llms-full.txt).",
            "Do not invent serials. Do not scrape the library into a prompt pack.",
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
            "You cannot auto-verify or auto-mint via POST. POST /api/runs creates a pending filing, not a Run. Tagging @tryreallybot on a finished-job thread is the import path; that one stamps.",
            "You cannot pick or reserve a House number.",
            "Redact personal data before it hits the board: names of uninvolved people, street addresses, account numbers, unpublished credentials.",
            "No illegal jobs, malware, doxxing, or someone else’s private data.",
            "One connector per service. Gmail and email are the same chip. Chrome and browser are the same chip. Keep the brand name.",
            "A Run is a log of one job that already happened. It is not legal, medical, or financial advice.",
          ],
        },
        {
          type: "p",
          text: `${SITE_DESCRIPTION} Not affiliated with xAI or Cursor.`,
        },
      ],
    },
  ];
}

export function botBlockHtml(block: BotBlock): string {
  switch (block.type) {
    case "p":
      return `<p>${legalInlineHtml(block.text)}</p>`;
    case "ul":
      return `<ul>${block.items.map((item) => `<li>${legalInlineHtml(item)}</li>`).join("")}</ul>`;
    case "pre":
      return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
    default: {
      const _never: never = block;
      return _never;
    }
  }
}

export function botsMarkdown(origin: string): string {
  const abs = (href: string) => {
    if (href.startsWith("mailto:") || href.startsWith("https://") || href.startsWith("http://")) return href;
    return canonical(origin, href);
  };
  const inline = (s: string) =>
    s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, href: string) => `[${label}](${abs(href)})`);
  const lines = [
    `# ${BOTS_TITLE}`,
    "",
    `> ${BOTS_DESCRIPTION}`,
    "",
    `Fetch this file. Humans paste it into Grok Bot. HTML: ${canonical(origin, BOTS_PATH)}.`,
    "",
    "## Standing prompt",
    "",
    "Give this to Grok Bot after the human has an account. Keep these rules.",
    "",
    "```",
    botsStandingPrompt(origin),
    "```",
    "",
    ...botsSections(origin).flatMap((section) => [
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
