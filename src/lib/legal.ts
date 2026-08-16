import { escapeHtml } from "./html";
import { organizationId } from "./jsonld";
import { canonical, LEGAL_EFFECTIVE, LEGAL_EFFECTIVE_ISO, LEGAL_EMAIL, SITE_NAME } from "./site";

export type LegalBlock = { type: "p"; text: string } | { type: "ul"; items: string[] };

export type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocument = {
  path: "/terms" | "/privacy";
  schemaType: "TermsOfService" | "PrivacyPolicy";
  title: string;
  kicker: string;
  description: string;
  effective: string;
  updatedIso: string;
  intro: string[];
  sections: LegalSection[];
};

export const TERMS_DOC: LegalDocument = {
  path: "/terms",
  schemaType: "TermsOfService",
  title: "Terms of Service",
  kicker: "Legal",
  description: `Terms for using ${SITE_NAME}: accounts, filings, public Runs, and what you may not post.`,
  effective: LEGAL_EFFECTIVE,
  updatedIso: LEGAL_EFFECTIVE_ISO,
  intro: [
    `${SITE_NAME} is a serialized public log of real bot jobs. These terms govern the site. By using it, creating an account, filing a Run, or posting a patch, you agree to them.`,
    `They pair with the [Privacy Policy](/privacy).`,
  ],
  sections: [
    {
      id: "service",
      title: "The service",
      blocks: [
        {
          type: "p",
          text: `${SITE_NAME} publishes verified records of jobs a bot already finished. A **Run** is that record. A **serial** (\`00001\`) is the job’s number. A **House** is one plate per account, minted on that account’s first verified Run. Serials and Houses are stamped by the server at verify, in verify order. Pending filings consume neither counter.`,
        },
        {
          type: "p",
          text: "The site is not a prompt pack, not a marketplace, and not affiliated with xAI, Cursor, or any model vendor. Grok is a use case, not the brand.",
        },
      ],
    },
    {
      id: "accounts",
      title: "Accounts",
      blocks: [
        {
          type: "p",
          text: "You may create an account with X, with email or username plus a password, or with a magic link. You are responsible for that account and for any House token issued to it. Rotate a leaked token from [Account](/account). Do not share Owner or staff access.",
        },
        {
          type: "p",
          text: "We may refuse, suspend, or close an account that breaks these terms.",
        },
      ],
    },
    {
      id: "filings",
      title: "What you file",
      blocks: [
        {
          type: "p",
          text: `You own your prompt and the rest of your filing. You grant ${SITE_NAME} a worldwide, non-exclusive, royalty-free license to host, display, reproduce, adapt (formatting, JSON and Markdown twins, indexes), and distribute that material on the site and in machine-readable feeds ([/runs.json](/runs.json), [/llms.txt](/llms.txt), [/llms-full.txt](/llms-full.txt), RSS, sitemaps) so other people and bots can read, cite, and patch it.`,
        },
        {
          type: "p",
          text: "Verified Runs are public on purpose. Do not file secrets you cannot live with on a public URL.",
        },
        {
          type: "p",
          text: "Redact personal data before you submit: names of uninvolved people, full street addresses, account numbers, unredacted IDs, medical record numbers, unpublished credentials. Evidence files are stored in object storage and served at a URL. Published Runs show those URLs on the public page.",
        },
      ],
    },
    {
      id: "review",
      title: "Review",
      blocks: [
        {
          type: "p",
          text: "Filing is not publishing. A human (the Owner) verifies or rejects. Verification is discretionary. Thin “hello world to get a House” is a reject. Rejected filings consume neither serial nor House.",
        },
        {
          type: "p",
          text: "Patches stay on the same serial as a revision (\`00047.r8\`). The House steward has a 24-hour veto window. The Owner may still refuse a merge.",
        },
      ],
    },
    {
      id: "rules",
      title: "Rules",
      blocks: [
        {
          type: "p",
          text: "Do not file or patch:",
        },
        {
          type: "ul",
          items: [
            "Jobs whose purpose is crime, fraud, malware, unauthorized access, or child sexual abuse material",
            "Doxxing, harassment, or someone else’s private data",
            "Content you do not have the right to publish",
            "Invented serials, fake Houses, or impersonation of another steward",
            "Scrapes of this library packaged as a prompt pack or competing dump of the catalog",
          ],
        },
        {
          type: "p",
          text: "Bots may fetch [/llms.txt](/llms.txt), [/llms-full.txt](/llms-full.txt), [/runs.json](/runs.json), and each Run as HTML, JSON, or Markdown. Cite the HTML URL. Do not invent serials. POST only with auth. POST creates a pending filing, not a Run.",
        },
      ],
    },
    {
      id: "advice",
      title: "Not advice",
      blocks: [
        {
          type: "p",
          text: "A Run is a log of one job that already happened. It is not legal, medical, or financial advice. Legal, medical, and financial Runs carry a disclaimer. Nobody here is your lawyer, doctor, or adviser. No outcome is guaranteed.",
        },
      ],
    },
    {
      id: "our-rights",
      title: "Our rights",
      blocks: [
        {
          type: "p",
          text: "We may edit formatting, add disclaimers, refuse a filing, unpublish a Run, or redact material that is unlawful, dangerous, or posted without rights. Serials already stamped are not reused. Unpublishing does not free the number.",
        },
        {
          type: "p",
          text: `The site, design, and software are ours. The name ${SITE_NAME} is the product.`,
        },
      ],
    },
    {
      id: "warranty",
      title: "Disclaimer of warranties",
      blocks: [
        {
          type: "p",
          text: "The site is provided as-is, as available, without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, and non-infringement. Public logs can be wrong. Evidence can be incomplete. We do not warrant that a job will work for you.",
        },
      ],
    },
    {
      id: "liability",
      title: "Limitation of liability",
      blocks: [
        {
          type: "p",
          text: "To the maximum extent permitted by law, the Operator is not liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, data, or goodwill, arising from the site or from any Run. Our total liability for a claim relating to the site will not exceed one hundred US dollars ($100).",
        },
        {
          type: "p",
          text: "Some places do not allow these limits. In those places, our liability is limited to the minimum the law requires.",
        },
      ],
    },
    {
      id: "indemnity",
      title: "Indemnity",
      blocks: [
        {
          type: "p",
          text: "You will defend and indemnify the Operator against claims arising from your filings, patches, account, or violation of these terms.",
        },
      ],
    },
    {
      id: "termination",
      title: "Termination",
      blocks: [
        {
          type: "p",
          text: `You may stop using the site at any time. We may suspend access or unpublish material that breaks these terms. Account deletion requests go to [${LEGAL_EMAIL}](mailto:${LEGAL_EMAIL}). Published Runs are a public record; we may keep, redact, or unpublish them as “Our rights” allows.`,
        },
      ],
    },
    {
      id: "changes",
      title: "Changes",
      blocks: [
        {
          type: "p",
          text: "We may update these terms. The date at the top is the current version. Continued use after a change is acceptance. Material changes will be noted on [/changelog](/changelog) when we can.",
        },
      ],
    },
    {
      id: "law",
      title: "Law",
      blocks: [
        {
          type: "p",
          text: "These terms are governed by the laws of the State of Tennessee, United States, without regard to conflict-of-law rules. Courts in Tennessee have exclusive venue, except that we may seek injunctive relief anywhere.",
        },
      ],
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [
        {
          type: "p",
          text: `${SITE_NAME} is operated by Travis (“Operator”). Legal and privacy mail: [${LEGAL_EMAIL}](mailto:${LEGAL_EMAIL}).`,
        },
      ],
    },
  ],
};

export const PRIVACY_DOC: LegalDocument = {
  path: "/privacy",
  schemaType: "PrivacyPolicy",
  title: "Privacy Policy",
  kicker: "Legal",
  description: `How ${SITE_NAME} handles account data, filings, cookies, and public Runs.`,
  effective: LEGAL_EFFECTIVE,
  updatedIso: LEGAL_EFFECTIVE_ISO,
  intro: [
    `This policy describes how ${SITE_NAME} (“we”, “Operator”) handles information. It pairs with the [Terms of Service](/terms).`,
  ],
  sections: [
    {
      id: "who",
      title: "Who we are",
      blocks: [
        {
          type: "p",
          text: `${SITE_NAME} is a public log of verified bot jobs, operated by Travis, at [https://really.bot](https://really.bot). Contact: [${LEGAL_EMAIL}](mailto:${LEGAL_EMAIL}).`,
        },
      ],
    },
    {
      id: "collect",
      title: "What we collect",
      blocks: [
        {
          type: "ul",
          items: [
            "**Account.** Email, username, display name, and a password hash (not the password). If you Continue with X: X user id, handle, and display name. We request `users.read` and `tweet.read`, read id/name/username, then revoke the access token. We do not keep your X access token.",
            "**Filings and patches.** Titles, job text, prompts, connectors, what happened, constraints, would-run-again, disclaimer kind, evidence files and URLs, and review notes. House number and serial once verified.",
            "**House token.** A bearer token (`brh_…`) hashed at rest. Shown once when rotated. Used to POST pending jobs. It does not stamp a serial.",
            "**Sessions.** An HttpOnly cookie `br_session` (30 days, SameSite=Lax, Secure on HTTPS). Session ids are stored hashed. A short-lived `br_flash` cookie carries a one-time status message.",
            "**Magic links.** Email and a hashed token, 30 minutes, then consumed.",
            "**Rate limits.** A key that may include your account id and IP (Cloudflare `CF-Connecting-IP`) plus a counter, to stop abuse.",
            "**Infrastructure.** The site runs on Cloudflare Workers, D1 (database), and R2 (evidence). Cloudflare may process standard request data (IP, user agent, URL, time) as any host does. Magic-link mail is sent through Resend. Fonts load from Google Fonts.",
            "**Monday Five.** The homepage email field is not wired to a list yet. Submitting it does not store your address with us.",
          ],
        },
        {
          type: "p",
          text: "We do not run third-party advertising pixels or analytics SDKs on the pages.",
        },
      ],
    },
    {
      id: "use",
      title: "Why we use it",
      blocks: [
        {
          type: "ul",
          items: [
            "Provide accounts, login, Houses, and the board",
            "Review, publish, and index Runs",
            "Send magic-link mail you asked for",
            "Rate-limit abuse",
            "Operate, secure, and debug the site",
            "Comply with law",
          ],
        },
        {
          type: "p",
          text: "Legal bases (where GDPR or similar applies): contract (the terms), legitimate interests (security, the public log, rate limits), and consent if we later collect newsletter addresses.",
        },
      ],
    },
    {
      id: "public",
      title: "What is public",
      blocks: [
        {
          type: "p",
          text: "Verified Runs, House pages, and machine indexes are public. Search engines and AI crawlers are invited to read them ([/robots.txt](/robots.txt) allows search, citations, grounding, and training on public pages). Do not put private data in a filing you want verified.",
        },
        {
          type: "p",
          text: "Unlisted filings (`/filing/…`) are visible to the filer and staff. Evidence objects live in R2 and are served at `/e/{key}`. The key is unguessable, but the URL is not password-gated. Once a Run is published, those URLs appear on the public page.",
        },
      ],
    },
    {
      id: "sharing",
      title: "Sharing",
      blocks: [
        {
          type: "p",
          text: "We do not sell personal information. We share:",
        },
        {
          type: "ul",
          items: [
            "Public Run content with anyone who fetches the site or feeds",
            "Processors who host or send mail: Cloudflare and Resend",
            "X, only during the login you start",
            "If required by law or to protect people from serious harm",
          ],
        },
      ],
    },
    {
      id: "retention",
      title: "Retention",
      blocks: [
        {
          type: "p",
          text: "Accounts and published Runs last until they are closed, unpublished, or the site shuts down. Session rows expire. Magic links expire in 30 minutes. Rate-limit rows are reused by key. We may keep security logs as long as needed to handle abuse.",
        },
      ],
    },
    {
      id: "choices",
      title: "Your choices",
      blocks: [
        {
          type: "ul",
          items: [
            "Log out from [Account](/account)",
            "Rotate your House token",
            `Request access, correction, or deletion at [${LEGAL_EMAIL}](mailto:${LEGAL_EMAIL})`,
            "Object to processing, or ask for a portable copy of account data you gave us",
          ],
        },
        {
          type: "p",
          text: "Published Runs are a public log. We can redact personal data or unpublish on a reasonable request. We do not reuse serials. We may refuse requests that would break the integrity of the board or that we cannot authenticate.",
        },
        {
          type: "p",
          text: "If you use Continue with X, you can disconnect that login by writing us. We will drop the stored X id and handle where we can without orphaning a House.",
        },
      ],
    },
    {
      id: "children",
      title: "Children",
      blocks: [
        {
          type: "p",
          text: "The site is not directed at children under 13, and we do not knowingly collect their data. If we learn we have, we will delete the account.",
        },
      ],
    },
    {
      id: "international",
      title: "International",
      blocks: [
        {
          type: "p",
          text: "We are in the United States. Cloudflare operates globally. If you use the site from elsewhere, your information is processed in the US and on Cloudflare’s network.",
        },
      ],
    },
    {
      id: "security",
      title: "Security",
      blocks: [
        {
          type: "p",
          text: "Passwords, session tokens, magic-link tokens, and House tokens are hashed. HTTPS in production. No method is perfect. Do not file credentials or live secrets.",
        },
      ],
    },
    {
      id: "changes",
      title: "Changes",
      blocks: [
        {
          type: "p",
          text: "We may update this policy. The date at the top is current. Material changes go on [/changelog](/changelog) when we can.",
        },
      ],
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [
        {
          type: "p",
          text: `[${LEGAL_EMAIL}](mailto:${LEGAL_EMAIL}). If you are in the EEA or UK and need an additional contact path, use that address and say so. We will respond.`,
        },
      ],
    },
  ],
};

export function legalInlineHtml(s: string): string {
  const parts: string[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(s))) {
    parts.push(escapeHtml(s.slice(last, match.index)));
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(`<strong>${escapeHtml(token.slice(2, -2))}</strong>`);
    } else if (token.startsWith("`")) {
      parts.push(`<code>${escapeHtml(token.slice(1, -1))}</code>`);
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        parts.push(`<a href="${escapeHtml(link[2])}">${escapeHtml(link[1])}</a>`);
      } else {
        parts.push(escapeHtml(token));
      }
    }
    last = match.index + token.length;
  }
  parts.push(escapeHtml(s.slice(last)));
  return parts.join("");
}

export function legalBlockHtml(block: LegalBlock): string {
  switch (block.type) {
    case "p":
      return `<p>${legalInlineHtml(block.text)}</p>`;
    case "ul":
      return `<ul>${block.items.map((item) => `<li>${legalInlineHtml(item)}</li>`).join("")}</ul>`;
    default: {
      const _never: never = block;
      return _never;
    }
  }
}

export function renderLegalMarkdown(doc: LegalDocument, origin: string): string {
  const abs = (href: string) => {
    if (href.startsWith("mailto:") || href.startsWith("https://") || href.startsWith("http://")) return href;
    return canonical(origin, href);
  };
  const inline = (s: string) =>
    s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, href: string) => `[${label}](${abs(href)})`);
  const lines = [
    `# ${doc.title}`,
    "",
    `> Effective ${doc.effective}. Last updated ${doc.effective}.`,
    "",
    ...doc.intro.map((p) => inline(p)),
    "",
    ...doc.sections.flatMap((section) => [
      `## ${section.title}`,
      "",
      ...section.blocks.flatMap((block) => {
        switch (block.type) {
          case "p":
            return [inline(block.text), ""];
          case "ul":
            return [...block.items.map((item) => `- ${inline(item)}`), ""];
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

export function jsonLdLegal(origin: string, doc: LegalDocument): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": doc.schemaType,
    name: doc.title,
    url: canonical(origin, doc.path),
    datePublished: doc.updatedIso,
    dateModified: doc.updatedIso,
    inLanguage: "en",
    isAccessibleForFree: true,
    publisher: { "@id": organizationId(origin) },
  };
}
