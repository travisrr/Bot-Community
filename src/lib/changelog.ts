import { getEnv } from "./env";
import { canonical, SITE_NAME, SITE_VERSION } from "./site";

export const CHANGELOG_DESCRIPTION =
  "Every really.bot update in plain English. Serials, Houses, patches, and what each release actually does for the board.";

export type ChangelogTag =
  | "Admin"
  | "App"
  | "Auth"
  | "Board"
  | "Bots"
  | "Brand"
  | "Foundation"
  | "Legal"
  | "Patches"
  | "Runs"
  | "Update";

export type ChangelogEntry = {
  id: string;
  date: string;
  tag: ChangelogTag;
  title: string;
  summary: string;
  points: string[];
};

export type ChangelogGroup = {
  date: string;
  entries: ChangelogEntry[];
};

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function monthIndex(month: number): number {
  if (month < 1 || month > 12) return 0;
  return month - 1;
}

function partsOf(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("-").map(Number);
  return { year: year || 0, month: month || 1, day: day || 1 };
}

export function changelogShortDate(iso: string): string {
  const { month, day } = partsOf(iso);
  return `${MONTHS_SHORT[monthIndex(month)]} ${day}`;
}

export function changelogLongDate(iso: string): string {
  const { year, month, day } = partsOf(iso);
  return `${MONTHS_LONG[monthIndex(month)]} ${day}, ${year}`;
}

export const SITE_UPDATES: ChangelogEntry[] = [
    {
      id: "site_2026-08-20-x-harvest",
      date: "2026-08-20",
      tag: "Runs",
      title: "A use-case thread files every Grok bot separately",
      summary:
        "Tag @tryreallybot on a roundup like “which bots have you created?” The board reads the thread and the comments, extracts each Grok job, and stamps it as its own serial under the person who described that bot.",
      points: [
        "The ask itself is not a job. Replies (and numbered lists) are.",
        "A second tag on the same roundup only picks up new comments. Finished-job threads still stamp once.",
        "Harvested filings get the public prompt pass. They do not re-read the whole roundup as if it were one job.",
      ],
    },
    {
      id: "site_2026-08-20-house-card-window",
      date: "2026-08-20",
      tag: "Board",
      title: "The House chips follow the mint line",
      summary:
        "The next-House card no longer freezes on 001–016. The sixteen chips slide forward so the last one is always the next number.",
      points: [
        "Once more than sixteen Houses exist, the grid shows the newest built numbers plus the open one.",
      ],
    },
    {
      id: "site_2026-08-20-job-card-align",
      date: "2026-08-20",
      tag: "Board",
      title: "Job cards line up across a row",
      summary:
        "Titles, job text, integration pills, and the steward line share a row so a long title no longer shoves the rest of the card out of alignment.",
      points: [
        "Each slot is the height of the tallest card in that row.",
        "The job blurb stays a fixed height and fades out instead of stretching the card.",
      ],
    },
    {
      id: "site_2026-08-20-board-table-persist",
      date: "2026-08-20",
      tag: "Board",
      title: "Table view stays on the board",
      summary:
        "Choosing Table hides the job cards and keeps that layout after you open a serial and come back.",
      points: [
        "Cards no longer sit under the table when Table is selected.",
        "The choice is remembered on this browser.",
      ],
    },
    {
      id: "site_2026-08-20-who-line-pack",
      date: "2026-08-20",
      tag: "Board",
      title: "Who-lines stay on one line next to the handle",
      summary:
        "Job cards pack the steward line so it does not wrap under the @handle. Two roles join with a comma. A newsletter becomes a mail mark.",
      points: [
        "Crypto researcher, DeFi expert — not Crypto researcher and DeFi expert.",
        "X employee, kettlebell founder — not X employee and kettlebell founder.",
        "Pragmatic Engineer plus a mail icon — not Pragmatic Engineer newsletter.",
        "Existing House who-lines were packed in place.",
      ],
    },
    {
      id: "site_2026-08-19-companies-does",
      date: "2026-08-19",
      tag: "Board",
      title: "Company rows say what the product does",
      summary:
        "/companies now has a What they do column. Known brands get a one-line product note. A name the board does not recognize stays listed as a connector on a verified Run.",
      points: [
        "The same line appears on each company page.",
        "No invented companies. The column describes names that already have a serial.",
      ],
    },
    {
      id: "site_2026-08-19-companies",
      date: "2026-08-19",
      tag: "Board",
      title: "A company directory from live connectors",
      summary:
        "/companies lists every company or service that already appeared on a verified Run. Each name links to the jobs that listed it. No serial means it is not on the board.",
      points: [
        "Synonyms collapse to one brand. Gmail and email are one row. Grok Bot and Claude are not companies.",
        "Machine filter: /runs.json?tool=gmail. Sitemap includes each company page.",
      ],
    },
    {
      id: "site_2026-08-19-catalog-listings",
      date: "2026-08-19",
      tag: "Runs",
      title: "Competing catalog listings are off the board",
      summary:
        "Jobs that were only directory listings, not filed runs, are withdrawn. Serials stay reserved. New filings cannot cite that catalog as evidence or copy.",
      points: [
        "House 013 is unclaimed. Those fifteen serials stay reserved and 404.",
        "Remaining public runs keep the steward’s job. Evidence that pointed at the catalog now points at the steward’s X profile.",
        "Tagged imports skip that catalog’s authors. Submit and House-token POST reject filings that cite it.",
      ],
    },
    {
      id: "site_2026-08-19-public-prompt",
      date: "2026-08-19",
      tag: "Runs",
      title: "Copyable prompts stay public, not private runbooks",
      summary:
        "The prompt pass now extracts the reusable job from a specific filing — watch a feed and text a colleague, not one show and one nickname — and writes that as the title, job, connectors, and pasteable prompt.",
      points: [
        "What happened can keep this person's story. Title, job, connectors, and prompt are the version a stranger can run.",
        "A complete but too-specific prompt is rewritten. If the prompt is already public, title and job still get the public pattern.",
        "Changelog line on a public rewrite: `Public job and prompt from the specific filing.`",
      ],
    },
    {
      id: "site_2026-08-19-ai-info",
      date: "2026-08-19",
      tag: "Bots",
      title: "A briefing page for ChatGPT, Claude, Gemini, and Perplexity",
      summary:
        "/ai-info tells assistants what really.bot is, which blog posts already answer the comparison queries, and how to cite a live serial. llms.txt now lists those posts by query. Submit a Bot Job can optionally capture the prompt that sent someone here.",
      points: [
        "Machine copy is /ai-info.md. The twelve blog URLs stay canonical — this is an index, not a second hub.",
        "Optional source + prompt on submit is not published. It lands in the admin Prompts tab.",
      ],
    },
    {
      id: "site_2026-08-19-x-job-gate",
      date: "2026-08-19",
      tag: "Runs",
      title: "A tag only files a finished Grok Bot job",
      summary:
        "Replying @tryreallybot is not enough. The thread has to be a job someone already ran or configured. Casual tags, directory shoutouts, and “share your bot” posts are skipped — no serial, no House, no reply. 00020 and 00021 are withdrawn. Those serials stay reserved.",
      points: [
        "The import path checks the thread before it stamps. A Grok Bot prompt, task, or job run still files even if it is short.",
        "00020 (@elonmusk) and 00021 (House 001) were not jobs. They are off the board. Elon’s House 011 mint was reversed so a real first Run could take that number.",
      ],
    },
    {
      id: "site_2026-08-19-blog-no-serials",
      date: "2026-08-19",
      tag: "App",
      title: "Blog posts describe the job in English",
      summary:
        "Titles and body copy no longer show padded job numbers. Posts still link the public log. The board keeps its own numbering.",
      points: [
        "The five job-breakdown titles drop the number and keep the approved job name.",
        "Anchor text uses the job in plain language. The proof URL can still point at the live page.",
      ],
    },
    {
      id: "site_2026-08-18-dup-00018",
      date: "2026-08-18",
      tag: "Runs",
      title: "One thread stays one serial",
      summary:
        "00018 was the same Peter Yang Marie Kondo thread as 00017. 00018 is withdrawn; that URL goes to 00017. A tagged import now records the serial before the X reply, so a slow stamp cannot mint a second one.",
      points: [
        "Serial 00018 stays reserved. It is not reused.",
        "A second tag on a thread that is already evidence on the board points at the first serial.",
      ],
    },
    {
      id: "site_2026-08-18-blog-articles",
      date: "2026-08-18",
      tag: "App",
      title: "The blog is finished articles, not a calendar",
      summary:
        "The twelve posts are rewritten as magazine pieces that cite live bot jobs. Index cards no longer say Week 1.",
      points: [
        "Job breakdowns unpack one finished job. Architecture and State of Grok are long-form with tables and BLUF answers.",
        "Cards show the desk — Breakdowns, Architecture, or Grok — not a schedule label.",
      ],
    },
    {
      id: "site_2026-08-18-x-bio-who",
      date: "2026-08-18",
      tag: "Board",
      title: "A House says who the steward is",
      summary:
        "Each steward gets a 7-word-max line from their public X bio: who they are, not a stack of company tags. Current Houses are filled in. New X filings and logins get the same pass.",
      points: [
        "The line sits under the name on the House page, on the reply stamp, and next to Steward on a serial.",
        "Past employers stay out. One current role or workplace is enough.",
      ],
    },
    {
      id: "site_2026-08-18-dream-team-lede",
      date: "2026-08-18",
      tag: "Board",
      title: "The dream-team column says what the board is for",
      summary:
        "The sentence under the title is gone. Next to the four bots, a line now says to look at proved jobs, reuse them, or file one of your own.",
      points: [
        "Assemble your dream bot team still sits next to the crew.",
        "The old pick-a-proved-job line no longer sits under the H1.",
      ],
    },
    {
      id: "site_2026-08-18-no-splash",
      date: "2026-08-18",
      tag: "App",
      title: "The guest splash is gone",
      summary:
        "Logged-out visitors land on the board. The copy-paste overlay no longer covers the homepage.",
      points: [
        "File from /submit. How to file a Bot Job is still on /bots.",
        "A paste saved before login still fills the submit box.",
      ],
    },
    {
      id: "site_2026-08-18-bot-mark",
      date: "2026-08-18",
      tag: "Brand",
      title: "The Grok Bot is the site mark",
      summary:
        "The tab icon and the really.bot lockup in the header, splash, and footer use the orange Grok Bot on a cream tile. The leftover Astro rocket is gone.",
      points: [
        "Favicon, Apple home-screen icon, and the schema.org logo are the bot tile.",
        "Header, guest splash, and footer show the same mark next to the name.",
      ],
    },
    {
      id: "site_2026-08-18-sponsor-strip-top",
      date: "2026-08-18",
      tag: "Runs",
      title: "Sponsors sit under the job title",
      summary:
        "The labeled sponsored strip moved from the bottom of each serial to just under the H1. The cards are shorter so they do not push the prompt down.",
      points: [
        "Sponsored, Advertise, and three cards still sit together. More Runs stays at the end of the page.",
        "Each card is a compact row: mark, name, one line, and a link.",
      ],
    },
    {
      id: "site_2026-08-18-connector-pills",
      date: "2026-08-18",
      tag: "Board",
      title: "Connector pills keep their marks",
      summary:
        "GitHub, X, and Notion marks were drawn in near-white, so they vanished on the cream chips. They now use the dark brand fills.",
      points: [
        "Octocat, X, and Notion read on the job-card pills and the board table.",
        "Job-card connectors are full pills so the chip matches the mark.",
      ],
    },
    {
      id: "site_2026-08-18-blog-landing",
      date: "2026-08-18",
      tag: "App",
      title: "A blog landing you can browse",
      summary:
        "/blog is desks, not a stack of identical cards. Start here, jump by pillar, then file the job you just read about.",
      points: [
        "Index groups the twelve posts into Breakdowns, Architecture, and State of Grok, with a three-post first-read path.",
        "Sticky desk chips, bot art, and a Submit a Bot Job closer. Posts still cite live bot jobs. Post pages link more from the same desk.",
      ],
    },
    {
      id: "site_2026-08-18-submit-a-bot-job",
      date: "2026-08-18",
      tag: "Brand",
      title: "Submit a Bot Job",
      summary:
        "The filing CTA is Submit a Bot Job everywhere it used to say File a Run — header, footer, Houses, /submit, bots docs, and the blog.",
      points: [
        "Header, footer, House card, empty lots, About, Changelog, and /submit all use Submit a Bot Job.",
        "Standing orders, llms.txt, and blog posts that linked the paste box now use the same name.",
      ],
    },
    {
      id: "site_2026-08-18-house-card-prompt",
      date: "2026-08-18",
      tag: "Board",
      title: "Every bot needs a home",
      summary:
        "The next-House card now says Every bot needs a home. Submit a first job, we verify it, then the House gets built.",
      points: [
        "Headline is Every bot needs a home. Body walks first job, verify, then bots move in.",
        "Status reads built, not minted. You cannot buy a House, choose one, or skip the line.",
      ],
    },
    {
      id: "site_2026-08-18-blog",
      date: "2026-08-18",
      tag: "App",
      title: "A blog that cites finished jobs, not prompt packs",
      summary:
        "/blog is live with twelve posts. Each one points at a verified bot job and official docs. The homepage is still the board.",
      points: [
        "Index at /blog. Posts at /blog/<slug>. FAQ JSON-LD on every post, same pattern as /about.",
        "Sitemap, llms.txt, footer, and /blog/rss.xml list the cluster. Primary nav and the homepage stay the board.",
        "Breakdowns name thin filings when the job is a seed prompt or an imported X thread. No invented jobs.",
      ],
    },
    {
      id: "site_2026-08-18-lighthouse",
      date: "2026-08-18",
      tag: "App",
      title: "Pages paint faster and pass contrast",
      summary:
        "Lighthouse on the live site failed contrast on coral buttons, served oversized art, and loaded PostHog during first paint. Those are fixed. Login still is not indexed on purpose.",
      points: [
        "Coral and muted text now meet WCAG AA against the cream background. The Submit a Bot Job button stays readable when it is the current page.",
        "About art, the dream-team bots, and the footer field are smaller files. The hero image is preloaded. CSS inlines so it does not block first paint.",
        "PostHog waits for a click, key, or scroll and does not load surveys. Static art caches for a year. /account signs you in on the same URL instead of bouncing to /login.",
      ],
    },
    {
      id: "site_2026-08-18-tag-then-polish",
      date: "2026-08-18",
      tag: "Runs",
      title: "Tagged jobs post, then the prompt gets sharper",
      summary:
        "Tag @tryreallybot and the Run stamps and replies right away. A follow-up pass then pulls missing context from the thread and writes a real copyable prompt — so a one-liner like “Ask @bot to set up images” does not stay the public prompt.",
      points: [
        "The tag path still files, stamps, and replies first so submit feels instant.",
        "Right after that, a revisit fills in tools and steps from the thread, then a prompt pass crystallizes the pasteable instructions.",
        "The 5:00 AM Central cron still sweeps every published Run. Paste and POST still wait for Owner verify, then get the same prompt pass.",
      ],
    },
    {
      id: "site_2026-08-18-dream-team-only",
      date: "2026-08-18",
      tag: "Board",
      title: "The crew stands alone under search",
      summary:
        "The homepage banner is the four bots and the dream-team headline. Filing a first Run is no longer in that card.",
      points: [
        "Inbox, Cancel, Research, and Ticket labels are gone. Search chips under the bar still do those jobs.",
        "How to submit a Bot Job stays on the guest splash, /submit, and /bots.",
      ],
    },
    {
      id: "site_2026-08-18-run-more",
      date: "2026-08-18",
      tag: "Runs",
      title: "More Runs and a sponsored row sit under each serial",
      summary:
        "Every job page now ends with three nearby Runs and a labeled sponsored strip. Advertise still goes to /sponsor.",
      points: [
        "Nearby Runs prefer shared connectors, then the same House, then newer serials.",
        "The sponsored row is three cards: mark, one-liner, and a link. Open slots still say they are open.",
      ],
    },
    {
      id: "site_2026-08-18-thicken-runs",
      date: "2026-08-18",
      tag: "Runs",
      title: "Thin published Runs got a source pass",
      summary:
        "Owner QA thickened every published serial from the filing, /about, or the source X thread. Same serials. No invented Houses.",
      points: [
        "00001 now records the finished Travis citation job and stays state-neutral. 00002 and 00003 stay honest seeds with copyable prompts.",
        "X-imports pulled tools, steps, and constraints that were actually on the thread or its photos. Invented connectors and leaked prompt-pass text came off.",
      ],
    },
    {
      id: "site_2026-08-18-dream-team",
      date: "2026-08-18",
      tag: "Board",
      title: "Assemble a dream bot team from the hero",
      summary:
        "The homepage leads with the four-bot crew and expert tasks. Filing a first Run is still there, tucked under the banner.",
      points: [
        "Each bot searches the board: inbox, cancel subscriptions, sales research, speeding ticket.",
        "How to submit a Bot Job stays in the same card, collapsed until you open it.",
        "Guest splash and the hero lede say the same thing: pick a proved job, then file the ones you finish.",
      ],
    },
    {
      id: "site_2026-08-18-board-sort-chrome",
      date: "2026-08-18",
      tag: "Board",
      title: "The board sorts from a text menu",
      summary:
        "Category, integration, and sort sit in one row of text menus above the jobs. A–Z is in the list with newest and most-patched. A divider sits before Table and Cards.",
      points: [
        "A–Z sorts by job title. Newest and most-patched still work from the menu and the tabs.",
        "The menus are labels with chevrons, not boxed selects.",
      ],
    },
    {
      id: "site_2026-08-18-first-run-up",
      date: "2026-08-18",
      tag: "Board",
      title: "Start here sits under search",
      summary:
        "The first-Run walkthrough moved up into the hero. The field under search is gone, so the three steps are the next thing you see.",
      points: [
        "Search, then Start here, then the board.",
        "The next House card stays on the right.",
      ],
    },
    {
      id: "site_2026-08-18-sponsor-rail-seven",
      date: "2026-08-18",
      tag: "Board",
      title: "The sponsor rail holds seven tiles",
      summary:
        "The right rail next to the job runs now has seven slots: the buy card, Linear, Notion, Slack, and three open spots waiting to be booked.",
      points: [
        "Open slots still use the labeled stand-in cards. A booked card replaces one.",
        "The first tile stays Buy a sponsor spot. Price is still $100 a month, two-month minimum.",
      ],
    },
    {
      id: "site_2026-08-18-prompt-strengthen",
      date: "2026-08-18",
      tag: "Runs",
      title: "Daily cron strengthens every Run prompt",
      summary:
        "Whether a job is thin or the source thread had little to pull, a daily pass writes a stronger copyable prompt onto each published serial from the filing itself.",
      points: [
        "5:00 AM Central (10:00 UTC) queues every published Run and writes the stronger prompts in that pass.",
        "The prompt on the job page is the thing that gets stronger: ask, tools, constraints, what done looks like.",
        "If the published prompt is already a complete instruction set, the Run is left alone. No invented tools or outcomes.",
      ],
    },
    {
      id: "site_2026-08-18-run-prompt-callout",
      date: "2026-08-18",
      tag: "Runs",
      title: "Copy the prompt off every Run",
    summary:
      "Each job page puts the prompt in a callout under the title, with a copy icon, so a visitor can take it without digging through the filing.",
    points: [
      "If the Run has no separate public prompt, the callout uses the job text.",
      "One tap copies the full prompt.",
    ],
  },
  {
    id: "site_2026-08-18-connector-synonyms",
    date: "2026-08-18",
    tag: "Board",
    title: "Gmail and email are one connector",
    summary:
      "Two labels that share a brand mark — Gmail and email, Chrome and browser — collapse to one chip. QA flags the duplicate on thin Runs.",
    points: [
      "Filings keep the brand name when both a synonym and the product were listed.",
      "Admin QA calls out the double listing so a patch can clean the serial.",
    ],
  },
  {
    id: "site_2026-08-17-qa-revisit",
    date: "2026-08-17",
    tag: "Admin",
    title: "Tag a thin Run and revisit the thread",
    summary:
      "Owner can mark a published Run as weak and deploy a revisit agent. It re-reads the source X thread and writes missing facts onto the same serial. The process lives at /qa.md.",
    points: [
      "Admin QA sits on the Run page. Tag as weak, optional tweet URL, deploy the agent.",
      "Queue is /admin/qa. Enriched Runs bump revision; still-thin threads are left alone.",
      "Future bots read /qa.md (and /bots.md) to run the same QA without inventing a serial.",
    ],
  },
  {
    id: "site_2026-08-17-house-stamp-cta",
    date: "2026-08-17",
    tag: "Runs",
    title: "House stamp cards ask you to open the house",
    summary:
      "The reply image on a tagged thread now carries a tagline and a gold CTA to that author’s House page, so a casual scroller has a reason to click through.",
    points: [
      "The stamp still shows House, serial, and job. The footer is the invite: the site line, then See this house → really.bot/house00N.",
    ],
  },
  {
    id: "site_2026-08-17-prompt-fade-sponsors",
    date: "2026-08-17",
    tag: "Board",
    title: "Job cards fade the prompt; the rail has real tools",
    summary:
      "Each card shows the job prompt in a clipped box that dissolves at the bottom. The sponsor rail currently shows Linear, Notion, and Slack, plus the buy spot.",
    points: [
      "The prompt is the filing’s job text, not a one-line summary, so the fade actually has something to hide.",
      "Booked cards still replace a stand-in. The first tile stays Buy a sponsor spot.",
    ],
  },
  {
    id: "site_2026-08-17-sponsor-rail",
    date: "2026-08-17",
    tag: "Board",
    title: "Sponsor cards sit next to the job runs",
    summary:
      "The board has a right rail again. Labeled sponsor tiles, plus a card to buy a spot at $100 a month with a two-month minimum.",
    points: [
      "Open slots and the buy card live beside On the board. Paid cards replace an open slot.",
      "Price, specs, and the mail-to live at /sponsor. It is advertising, not a serial.",
    ],
  },
  {
    id: "site_2026-08-17-house-stamp-reply",
    date: "2026-08-17",
    tag: "Runs",
    title: "Tagged X replies attach the House stamp",
    summary:
      "When @tryreallybot records a job, the reply image is that author’s House and the serial that just stamped — not the generic share card.",
    points: [
      "The tweet links the House page. The picture is generated for that House and that stamp each time.",
      "Reconnect @tryreallybot in Admin if image replies fail; the bot needs media.write.",
    ],
  },
  {
    id: "site_2026-08-17-connector-marks",
    date: "2026-08-17",
    tag: "Board",
    title: "Connectors use brand marks",
    summary:
      "Integrations on the board show each company’s color logo. The How it works strip under the table is gone.",
    points: [
      "Gmail, Slack, GitHub, Calendar, Chrome, Lighthouse, and the rest use their marks instead of gray line icons.",
      "How it works still lives at /about.",
    ],
  },
  {
    id: "site_2026-08-17-activity-tab",
    date: "2026-08-17",
    tag: "Board",
    title: "Live activity is a tab on the board",
    summary:
      "The homepage is one column. Newest and most-patched still sort the table. Live activity is the third tab. The Daily Run Log signup is off the board.",
    points: [
      "Header Activity still jumps to #activity and opens that tab.",
      "How it works stays under the board.",
    ],
  },
  {
    id: "site_2026-08-17-runs-table",
    date: "2026-08-17",
    tag: "Board",
    title: "The board is a job table",
    summary:
      "Verified Runs sit in a four-column table: job, category, integrations, and the House that filed them.",
    points: [
      "Category is a pill. Connectors show as icon plus name. Source is the steward handle.",
      "Newest and most-patched sorts still work. Click a job name to open the Run.",
    ],
  },
  {
    id: "site_2026-08-17-x-import",
    date: "2026-08-17",
    tag: "Runs",
    title: "Tag @tryreallybot to file a job from X",
    summary:
      "Reply with @tryreallybot on a thread where someone already ran a Grok job. The board reads the thread, files it under the original author, mints their House on a first Run, and replies with the URL.",
    points: [
      "Anyone can tag. Credit stays with the original author, not the person who mentioned the bot.",
      "Paste at /submit and POST /api/runs still wait for Owner verify. The tag path is the exception that stamps.",
    ],
  },
  {
    id: "site_2026-08-17-guest-splash",
    date: "2026-08-17",
    tag: "Board",
    title: "Logged-out visitors get a copy-paste splash",
    summary:
      "If you are not already signed in, a modal sits over the board: log in, copy a Grok Bot prompt, paste the filing back.",
    points: [
      "Continue with X or email/password sits at the top. The paste is saved until you land on Submit a Bot Job.",
      "Step one copies extract instructions. Step two sends you to Grok. Step three is the paste box for your first Job Run.",
      "Close with the X, the dimmed board, or Escape. The choice lasts for this tab. Signed-in people never see it.",
    ],
  },
  {
    id: "site_2026-08-17-submit-paste",
    date: "2026-08-17",
    tag: "Runs",
    title: "Submit a Bot Job is a paste box",
    summary:
      "/submit is one box: paste the filing Grok Bot returned. The page picks up the job. No more field pile.",
    points: [
      "Paste the markdown from /bots.md. Title, job, connectors, what happened, and evidence come from that filing.",
      "If you gave the bot a House token, it still POSTs. You do not paste.",
    ],
  },
  {
    id: "site_2026-08-17-lighthouse",
    date: "2026-08-17",
    tag: "App",
    title: "Faster first paint, same board",
    summary:
      "IBM Plex is served from this site, PostHog waits until the page is idle, and the hero field image is fetched first.",
    points: [
      "The Google Fonts stylesheet is gone, so first paint no longer waits on fonts.googleapis.com.",
      "PostHog still loads from us.i.posthog.com after idle, a click/key/scroll, or four seconds.",
    ],
  },
  {
    id: "site_2026-08-16-house-card-sprite",
    date: "2026-08-16",
    tag: "Board",
    title: "The mint card shows a house, not a plate",
    summary:
      "The next-House card on the homepage wears a decorated 16-bit sprite instead of a stamped number plate.",
    points: [
      "Same house as the next number. Lights on, details unlocked, so you can see what a lived-in House looks like.",
    ],
  },
  {
    id: "site_2026-08-16-house-rent",
    date: "2026-08-16",
    tag: "Board",
    title: "Vacant lots put out a for-rent sign",
    summary: "Every unclaimed House on the plate has a yard sign in the grass. Submit a Bot Job and it comes down.",
    points: [
      "The next number still says next. The rest of the empty row says rent.",
    ],
  },
  {
    id: "site_2026-08-16-house-detail",
    date: "2026-08-16",
    tag: "Board",
    title: "Houses grow with every Run",
    summary: "House sprites are 48×64 now — 16-bit scale, not the chunky 16×20 lots. Each verified Run under a House unlocks another small detail: a cat, a wreath, smoke, a mailbox, and so on.",
    points: [
      "The look of the house stays seeded from the number. The extras are seeded too, so 001’s third Run does not match 002’s.",
      "Unclaimed lots stay dark. Lights and details arrive when a steward mints and files.",
    ],
  },
  {
    id: "site_2026-08-16-bots-token-post",
    date: "2026-08-16",
    tag: "Bots",
    title: "The bot page leads with the House token POST",
    summary: "/bots now tells the bot to POST when it has a token, and shows that recipe as the copyable prompt.",
    points: [
      "The page header points at Account and POST /api/runs, not /submit.",
      "/bot redirects to /bots.",
    ],
  },
  {
    id: "site_2026-08-16-house-token-post",
    date: "2026-08-16",
    tag: "Bots",
    title: "A House token is enough to POST",
    summary: "Give Grok Bot the token from Account and a finished chat. It POSTs. You do not paste at /submit.",
    points: [
      "Account copies a ready Grok instruction with the token and the exact POST.",
      "POST /api/runs accepts the filing markdown alone. evidence_url in the frontmatter counts.",
    ],
  },
  {
    id: "site_2026-08-16-house-plate",
    date: "2026-08-16",
    tag: "Board",
    title: "A hundred houses waiting on the plate",
    summary: "/houses shows the next hundred unclaimed lots as real pixel houses, lights off, so the next mint is sitting in a neighborhood instead of a single empty row.",
    points: [
      "Empty lots use the same seeded sprite they will keep when claimed. Windows stay dark until a steward mints them.",
      "The plate rolls forward with the next number, always about a hundred open houses ahead.",
    ],
  },
  {
    id: "site_2026-08-16-daily-run-log-beehiiv",
    date: "2026-08-16",
    tag: "App",
    title: "The Daily Run Log takes emails",
    summary: "The homepage signup is live. Addresses go to Beehiiv, not a toast that stored nothing.",
    points: [
      "The Daily Run Log is the site’s email row again. Beehiiv holds the list behind it.",
      "Privacy says Beehiiv stores the address, and you leave it from those emails.",
    ],
  },
  {
    id: "site_2026-08-16-bots",
    date: "2026-08-16",
    tag: "Bots",
    title: "Standing orders for Grok Bot",
    summary: "A page the bot can fetch, and a human can paste, so a finished chat becomes a filing instead of a blank form.",
    points: [
      "/bots and /bots.md: turn a pasted chat into filing markdown, patch a Run, never invent a serial.",
      "llms.txt, the nav, submit, and the first-Run prompt point at those orders first.",
    ],
  },
  {
    id: "site_2026-08-16-posthog",
    date: "2026-08-16",
    tag: "App",
    title: "Product analytics via PostHog",
    summary: "Pages load PostHog so we can see how the board is used. The privacy policy says so.",
    points: [
      "PostHog loads when POSTHOG_PROJECT_API_KEY is set on the Worker.",
      "Privacy no longer claims we run no analytics SDK.",
    ],
  },
  {
    id: "site_2026-08-16-beep",
    date: "2026-08-16",
    tag: "App",
    title: "Mail goes to beep@really.bot",
    summary: "The public contact address is beep@really.bot. Outgoing mail, including magic links, sends from that address and replies land there.",
    points: [
      "Footer, terms, privacy, and machine indexes list beep@really.bot.",
      "Resend From and Reply-To are really.bot <beep@really.bot>.",
    ],
  },
  {
    id: "site_2026-08-16-honest-board",
    date: "2026-08-16",
    tag: "Board",
    title: "The board only shows what exists",
    summary: "Fake subscriber counts, seed Runs, and a subscribe toast that stored nothing are gone. Filings wait for the Owner. The homepage caches the live board so a spike does not hammer D1.",
    points: [
      "The Daily Run Log says the list is not open yet, and points at the changelog.",
      "Magic-link login hides until a mailer is configured.",
      "Public market reads go through a 30-second cache and D1 read replicas. Rate limits no longer write D1 rows.",
    ],
  },
  {
    id: "site_2026-08-16-first-run-collapse",
    date: "2026-08-16",
    tag: "Board",
    title: "The first-Run walkthrough folds up",
    summary: "A chevron on the homepage onboarding banner collapses the three steps so the board sits closer to the top.",
    points: [
      "The header stays: Start here, the title, and the next House number.",
      "The open or collapsed choice sticks in this browser.",
    ],
  },
  {
    id: "site_2026-08-16-nav",
    date: "2026-08-16",
    tag: "App",
    title: "One nav on every page",
    summary: "The top bar is the same on the board and the inner pages: Explore, Houses, Activity, How it works, the next House, Sign in, and Submit a Bot Job.",
    points: [
      "Inner pages no longer swap in a different set of links or drop the BETA mark.",
      "Activity from any page jumps to the live feed on the board.",
    ],
  },
  {
    id: "site_2026-08-16-house-atlas",
    date: "2026-08-16",
    tag: "Board",
    title: "Houses are tiny 16-bit sprites",
    summary: "/houses is a grid of small pixel houses. Each minted House gets its own look. The X handle sits underneath.",
    points: [
      "Roofs, colors, chimneys, and yard bits are seeded from the House number, so 001 never looks like 002.",
      "The next number is an empty lot. Submit a Bot Job to claim it.",
    ],
  },
  {
    id: "site_2026-08-16-first-run-nums",
    date: "2026-08-16",
    tag: "Board",
    title: "Step numbers sit under the copy",
    summary: "01 02 03 on the first-Run walkthrough are huge brass plates behind the text, so the sequence is obvious.",
    points: [
      "Each step box has a large number as a layer under the heading and body, not a tiny kicker.",
    ],
  },
  {
    id: "site_2026-08-16-first-run",
    date: "2026-08-16",
    tag: "Board",
    title: "A numbered first Run, not a stats strip",
    summary: "The homepage now walks a visitor through filing their first Grok Bot job, then handing the next ones to the bot.",
    points: [
      "Three numbered steps sit where the verified-runs strip was: create an account and paste a Grok Bot chat, file it, instruct Grok Bot.",
      "Step three copies a prompt that tells the bot to keep adding finished jobs under the visitor’s House.",
    ],
  },
  {
    id: "site_2026-08-16-changelog",
    date: "2026-08-16",
    tag: "App",
    title: "A changelog you can scan",
    summary: "Site updates now read as product notes, not a dump of dated one-liners.",
    points: [
      "Date groups, tags, and expandable rows — the same shape as a product changelog.",
      "A Markdown twin at /changelog.md for bots and anyone who wants the notes as text.",
    ],
  },
  {
    id: "site_2026-08-16-mobile",
    date: "2026-08-16",
    tag: "App",
    title: "The board fits in a pocket",
    summary: "Inner pages wrap on phones, and the nav shows a live GitHub star count.",
    points: [
      "The site wraps and tap targets work on a phone instead of overflowing the viewport.",
      "A live GitHub star count sits in the top nav and updates without a reload.",
    ],
  },
  {
    id: "site_2026-08-16-digest",
    date: "2026-08-16",
    tag: "Board",
    title: "The Daily Run Log",
    summary: "The newsletter is a dated log of serials, not a Monday digest with a leftover name.",
    points: [
      "The signup is now The Daily Run Log. The Monday Five name is gone.",
    ],
  },
  {
    id: "site_2026-08-16-marks",
    date: "2026-08-16",
    tag: "Brand",
    title: "Grok Bots on the chrome",
    summary: "The mark is on the hero, on every prompt, and hopping in the footer.",
    points: [
      "The Grok Bot mark sits in front of the homepage hero heading.",
      "Prompt callouts are labeled Grok Bot Prompt, with the mark on the heading, so the job source is obvious.",
      "A full-site footer sits over a dithered field of hopping Grok Bots.",
    ],
  },
  {
    id: "site_2026-08-16-stamper",
    date: "2026-08-16",
    tag: "Foundation",
    title: "Open the stamper. Keep the counters closed.",
    summary: "Anyone can run the Worker that stamps numbers. They cannot spin up this board.",
    points: [
      "The stamper is public. The grab is the record, not the repo.",
      "00001, House 001, and the board people already file on stay here.",
    ],
  },
  {
    id: "site_2026-08-16-00001",
    date: "2026-08-16",
    tag: "Runs",
    title: "00001 works in any state",
    summary: "The first Run is no longer one state's citation facts.",
    points: [
      "Find representation, then email that office. Any citation, any state.",
      "House 001 is seeded with two copyable prompt Runs so the next person is not stuck rewriting from a tweet.",
    ],
  },
  {
    id: "site_2026-08-16-legal",
    date: "2026-08-16",
    tag: "Legal",
    title: "Terms and privacy, in public",
    summary: "The rules for filing, evidence, and crawlers are pages you can read.",
    points: [
      "Public Terms of Service and Privacy Policy, with Markdown twins.",
      "Material changes land on this changelog when we can.",
    ],
  },
  {
    id: "site_2026-08-16-x-login",
    date: "2026-08-16",
    tag: "Auth",
    title: "Sign in with X",
    summary: "Continue with X is the login path. Password and magic link still work.",
    points: [
      "Continue with X is the primary login. Password and magic link are still there.",
      "A duplicate X callback that broke the Worker build is gone.",
    ],
  },
  {
    id: "site_2026-08-16-owner",
    date: "2026-08-16",
    tag: "Admin",
    title: "Owner seat and a patch queue",
    summary: "Someone has to verify filings. That seat is named, and patches have a queue.",
    points: [
      "The Owner seat is @saastrash.",
      "Admin shows in the top nav for Owner only.",
      "Patches go through a moderation queue. Evidence or they do not land.",
    ],
  },
  {
    id: "site_2026-08-16-patch-prompt",
    date: "2026-08-16",
    tag: "Patches",
    title: "Patch with a prompt, not a form",
    summary: "Other bots improve a Run by copying a prompt and pasting the result back.",
    points: [
      "The patch form is a copyable AI prompt and a paste-back, not a pile of fields.",
      "Fork is gone as a marketplace action and metric. The loop is file, verify, patch.",
    ],
  },
  {
    id: "site_2026-08-16-navy",
    date: "2026-08-16",
    tag: "App",
    title: "Navy, not brass",
    summary: "The palette is GPO Navy. Inner pages use the same radius as the homepage.",
    points: [
      "The site palette switched from warm brass to GPO Navy.",
      "Inner-page boxes match the homepage radius tokens.",
    ],
  },
  {
    id: "site_2026-08-16-prompt",
    date: "2026-08-16",
    tag: "Runs",
    title: "Copy the prompt off the Run",
    summary: "The job text sits in a callout under the title so you can take it with you.",
    points: [
      "The prompt is a copyable callout under the Run title, not buried in the body.",
    ],
  },
  {
    id: "site_2026-08-16-urls",
    date: "2026-08-16",
    tag: "Board",
    title: "The URL carries the House",
    summary: "A Run lives under its House. The badge on the page is still the serial.",
    points: [
      "Verified Runs live at /house001/00001. JSON and Markdown twins sit next to the HTML.",
      "How it works in the top nav points at the existing About walkthrough.",
    ],
  },
  {
    id: "site_2026-08-16-crawlers",
    date: "2026-08-16",
    tag: "Bots",
    title: "Crawlers and bots are welcome",
    summary: "Search engines and AI agents can read the board without inventing serials.",
    points: [
      "Public pages are open to search and AI crawlers.",
      "llms.txt, llms-full.txt, runs.json, sitemap, and RSS index the board.",
    ],
  },
  {
    id: "site_2026-08-16",
    date: "2026-08-16",
    tag: "Board",
    title: "A marketplace for real jobs",
    summary: "The homepage is a board: serials, Houses, activity, and the next House to mint.",
    points: [
      "A marketplace homepage with really bold in the site name.",
      "The hero names the Grok bot repository and the first-Run, House, and bot-connect loop.",
      "A house illustration sits in the claim card. The next House number is visible.",
    ],
  },
  {
    id: "site_2026-08-16-verify",
    date: "2026-08-16",
    tag: "Foundation",
    title: "The first really.bot",
    summary: "Serials and Houses stamp only at verify. Pending filings stay unlisted.",
    points: [
      "A serialized public log of real bot jobs — not a prompt pack.",
      "Serials and Houses stamp only when a human verifies. Pending filings are unlisted.",
      "No BR- prefix. Houses mint on that account's first verified Run. You cannot pick a number.",
      "JSON twins, llms.txt, sitemap, and RSS shipped with 00001.",
    ],
  },
];

export function groupChangelog(entries: ChangelogEntry[]): ChangelogGroup[] {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const groups: ChangelogGroup[] = [];
  for (const entry of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.date === entry.date) {
      last.entries.push(entry);
    } else {
      groups.push({ date: entry.date, entries: [entry] });
    }
  }
  return groups;
}

export function extraChangelogEntries(
  rows: { id: string; dated: string; body: string }[],
  knownIds: Iterable<string>,
): ChangelogEntry[] {
  const seen = new Set(knownIds);
  const extras: ChangelogEntry[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    const title = row.body.split(/[.!?]/)[0]?.trim() || row.body;
    extras.push({
      id: row.id,
      date: row.dated,
      tag: "Update",
      title,
      summary: row.body,
      points: [row.body],
    });
  }
  return extras;
}

export async function loadChangelogEntries(): Promise<ChangelogEntry[]> {
  const { results } = await getEnv()
    .DB.prepare("SELECT id, dated, body FROM site_changelog ORDER BY dated DESC")
    .all<{ id: string; dated: string; body: string }>();
  const extras = extraChangelogEntries(
    results ?? [],
    SITE_UPDATES.map((entry) => entry.id),
  );
  return [...SITE_UPDATES, ...extras];
}

export function changelogMarkdown(entries: ChangelogEntry[]): string {
  const groups = groupChangelog(entries);
  const lines = [
    "# Changelog",
    "",
    `Every ${SITE_NAME} update in plain English. Current version: v${SITE_VERSION} (${entries.length} updates).`,
    "",
  ];
  for (const group of groups) {
    lines.push(`## ${changelogLongDate(group.date)}`, "");
    for (const entry of group.entries) {
      lines.push(`### ${entry.title}`, "", entry.summary, "");
      for (const point of entry.points) {
        lines.push(`- ${point}`);
      }
      lines.push("");
    }
  }
  return lines.join("\n");
}

export function jsonLdChangelog(origin: string, entries: ChangelogEntry[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} updates`,
    description: CHANGELOG_DESCRIPTION,
    url: canonical(origin, "/changelog"),
    itemListElement: entries.map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "CreativeWork",
        headline: entry.title,
        datePublished: entry.date,
        abstract: entry.summary,
      },
    })),
  };
}
