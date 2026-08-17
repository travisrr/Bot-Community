export const SPONSOR_PRICE_USD = 100;
export const SPONSOR_MIN_MONTHS = 2;
export const SPONSOR_PATH = "/sponsor";
export const SPONSOR_RAIL_SLOTS = 4;

export const SPONSOR_TITLE = "Sponsor the board";
export const SPONSOR_DESCRIPTION =
  "A labeled card next to the Job Runs on really.bot. $100 a month, two-month minimum. Not a serial. Not a House.";

export type SponsorTone = "mint" | "lavender" | "sky" | "peach" | "brass";
export type SponsorKind = "paid" | "cta" | "open";
export type SponsorIcon = "plus" | "grid" | "lens" | "mark";

export type Sponsor = {
  id: string;
  name: string;
  blurb: string;
  href: string;
  tone: SponsorTone;
  kind: SponsorKind;
  icon: SponsorIcon;
  logoSrc?: string;
};

export const SPONSOR_CTA: Sponsor = {
  id: "buy",
  name: "Buy a sponsor spot",
  blurb: "$100/mo · two-month minimum. Your card sits next to the job runs.",
  href: SPONSOR_PATH,
  tone: "brass",
  kind: "cta",
  icon: "plus",
};

/** Booked inventory. Empty until a card is paid and live. */
export const PAID_SPONSORS: Sponsor[] = [];

const OPEN_TEMPLATES: Omit<Sponsor, "id">[] = [
  {
    name: "This spot is open",
    blurb: "A labeled card next to every Job Run on the board.",
    href: SPONSOR_PATH,
    tone: "mint",
    kind: "open",
    icon: "grid",
  },
  {
    name: "Your tool here",
    blurb: "Operators reading real jobs — not a prompt-pack list.",
    href: SPONSOR_PATH,
    tone: "lavender",
    kind: "open",
    icon: "lens",
  },
  {
    name: "Reach the board",
    blurb: "Logo, name, one line. Never a fake serial.",
    href: SPONSOR_PATH,
    tone: "sky",
    kind: "open",
    icon: "mark",
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
  return [...paid, ...opens, SPONSOR_CTA];
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

A paid card in the right rail next to the Job Runs on ${origin}/. Labeled as a sponsor. It is not a Run, a serial, or a House.

## Price

- $${SPONSOR_PRICE_USD} per month
- ${SPONSOR_MIN_MONTHS}-month minimum ($${start} to start)
- Month-to-month after that until you cancel

## What you get

- One card on the homepage rail: logo, name, one line, link
- Labeled advertising, not a fake filing
- We can refuse or take down a card that does not fit the board

## How to buy

Email [${email}](mailto:${email}?subject=${encodeURIComponent("Sponsor spot")}) with the name, URL, one-liner, and a square logo.

HTML: ${origin}${SPONSOR_PATH}
`;
}
