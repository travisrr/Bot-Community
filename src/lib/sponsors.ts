export const SPONSOR_PRICE_USD = 100;
export const SPONSOR_MIN_MONTHS = 2;
export const SPONSOR_PATH = "/sponsor";
export const SPONSOR_RAIL_SLOTS = 7;
export const SPONSOR_STRIP_SLOTS = 3;

export const SPONSOR_TITLE = "Sponsor the board";
export const SPONSOR_DESCRIPTION =
  "A labeled card on the homepage rail and under every serial on really.bot. $100 a month, two-month minimum. Not a serial. Not a House.";

export type SponsorTone = "mint" | "lavender" | "sky" | "peach" | "brass";
export type SponsorKind = "paid" | "cta" | "open";
export type SponsorIcon = "plus" | "grid" | "lens" | "mark" | "linear" | "notion" | "slack";

export type Sponsor = {
  id: string;
  name: string;
  blurb: string;
  href: string;
  tone: SponsorTone;
  kind: SponsorKind;
  icon: SponsorIcon;
  logoSrc?: string;
  cta?: string;
};

export const SPONSOR_CTA: Sponsor = {
  id: "buy",
  name: "Buy a sponsor spot",
  blurb: "$100/mo · two-month minimum. Your card sits next to the job runs and under every serial.",
  href: SPONSOR_PATH,
  tone: "brass",
  kind: "cta",
  icon: "plus",
  cta: "Buy a spot",
};

/** Live rail. Stand-ins until a booked card replaces a slot. */
export const PAID_SPONSORS: Sponsor[] = [
  {
    id: "linear",
    name: "Linear",
    blurb: "The product development system for teams and agents.",
    href: "https://linear.app",
    tone: "lavender",
    kind: "paid",
    icon: "linear",
    cta: "See Linear",
  },
  {
    id: "notion",
    name: "Notion",
    blurb: "The AI workspace that works the way you do.",
    href: "https://www.notion.com",
    tone: "sky",
    kind: "paid",
    icon: "notion",
    cta: "Open Notion",
  },
  {
    id: "slack",
    name: "Slack",
    blurb: "Where the work happens — channels, huddles, and agents.",
    href: "https://slack.com",
    tone: "peach",
    kind: "paid",
    icon: "slack",
    cta: "Open Slack",
  },
];

const OPEN_TEMPLATES: Omit<Sponsor, "id">[] = [
  {
    name: "This spot is open",
    blurb: "A labeled card next to every Job Run on the board.",
    href: SPONSOR_PATH,
    tone: "mint",
    kind: "open",
    icon: "grid",
    cta: "Advertise here",
  },
  {
    name: "Your tool here",
    blurb: "Operators reading real jobs — not a prompt-pack list.",
    href: SPONSOR_PATH,
    tone: "lavender",
    kind: "open",
    icon: "lens",
    cta: "Advertise here",
  },
  {
    name: "Reach the board",
    blurb: "Logo, name, one line. Never a fake serial.",
    href: SPONSOR_PATH,
    tone: "sky",
    kind: "open",
    icon: "mark",
    cta: "Advertise here",
  },
];

export function sponsorStartUsd(): number {
  return SPONSOR_PRICE_USD * SPONSOR_MIN_MONTHS;
}

export function sponsorRail(): Sponsor[] {
  const paid = PAID_SPONSORS.filter((s) => s.kind === "paid").slice(0, SPONSOR_RAIL_SLOTS - 1);
  const opens: Sponsor[] = [];
  let i = 0;
  while (paid.length + opens.length < SPONSOR_RAIL_SLOTS - 1) {
    const template = OPEN_TEMPLATES[i % OPEN_TEMPLATES.length];
    opens.push({ ...template, id: `open-${i}` });
    i += 1;
  }
  return [SPONSOR_CTA, ...paid, ...opens];
}

/** Three cards under a serial. Paid first, then the buy tile and open slots. */
export function sponsorStrip(limit = SPONSOR_STRIP_SLOTS): Sponsor[] {
  const rail = sponsorRail();
  const paid = rail.filter((s) => s.kind === "paid");
  if (paid.length >= limit) return paid.slice(0, limit);
  const filler = rail.filter((s) => s.kind !== "paid");
  return [...paid, ...filler].slice(0, limit);
}

export function sponsorMailto(email: string): string {
  const subject = "Sponsor spot";
  const body = `I want a sidebar sponsor card on really.bot.

Name:
URL:
One-liner (about 80 characters):
Preferred start:
`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function sponsorMarkdown(origin: string, email: string): string {
  const start = sponsorStartUsd();
  return `# ${SPONSOR_TITLE}

> ${SPONSOR_DESCRIPTION}

A paid card in the right rail next to the Job Runs on ${origin}/, and in the sponsored row under every serial. Labeled as a sponsor. It is not a Run, a serial, or a House.

## Price

- $${SPONSOR_PRICE_USD} per month
- ${SPONSOR_MIN_MONTHS}-month minimum ($${start} to start)
- Month-to-month after that until you cancel

## What you get

- One card on the homepage rail and in the sponsored row under every serial: logo, name, one line, link
- Labeled advertising, not a fake filing
- We can refuse or take down a card that does not fit the board

## How to buy

Email [${email}](mailto:${email}?subject=${encodeURIComponent("Sponsor spot")}) with the name, URL, one-liner, and a square logo.

HTML: ${origin}${SPONSOR_PATH}
`;
}
