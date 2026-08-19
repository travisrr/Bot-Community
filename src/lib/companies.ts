import { publishedRunPath, runId } from "./format";
import { isGlueConnector } from "./public-filing";
import { parseConnectors, toolKey, type ToolKey } from "./tools";
import type { RunRow } from "./types";

export const COMPANIES_PATH = "/companies";
export const COMPANIES_TITLE = "Companies";
export const COMPANIES_DESCRIPTION =
  "Companies and services that already appeared on a verified Run. No serial = not on the board.";

export type CompanyJob = {
  title: string;
  serial: number;
  path: string;
  serialLabel: string;
};

export type CompanyEntry = {
  slug: string;
  name: string;
  does: string;
  jobs: CompanyJob[];
};

const DOES_BY_SLUG: Record<string, string> = {
  ahrefs: "SEO crawler and backlink index.",
  "apple-watch": "Wrist notifications and health sensors.",
  blender: "3D modeling and rendering.",
  calendar: "Google Calendar. Events and schedules.",
  chrome: "Browser on the Grok Bot computer.",
  clickup: "Tasks and project tracking.",
  cursor: "Code editor with an agent.",
  exiftool: "Read and write file metadata.",
  fable: "Overnight coding orchestration.",
  figma: "Interface design files.",
  github: "Git host. Issues, PRs, and repos.",
  glean: "Company search across connected apps.",
  gmail: "Google mail. Search and send.",
  godot: "Open-source game engine.",
  gong: "Call recording and deal review.",
  "google-ads": "Paid search and display ads.",
  "google-analytics": "Website traffic stats.",
  "google-docs": "Shared documents.",
  "google-drive": "File storage.",
  "google-photos": "Photo library.",
  "google-search": "Web search.",
  "google-sheets": "Spreadsheets.",
  "google-slides": "Slide decks.",
  "google-trends": "Search-interest charts.",
  granola: "Meeting notes from a live conversation.",
  hubspot: "CRM and inbound marketing.",
  hyperliquid: "Perpetual futures exchange.",
  lighthouse: "Page-speed audit.",
  linear: "Issue tracker.",
  luma: "Community events and updates.",
  matic: "Home cleaning robot.",
  notion: "Docs and databases.",
  quickbooks: "Bookkeeping.",
  reddit: "Public forums.",
  salesforce: "CRM.",
  "search-console": "Google index and query reports.",
  slack: "Team chat.",
  sms: "Text messages.",
  squarespace: "Hosted websites.",
  tailscale: "Private mesh network.",
  unity: "Game engine.",
  web: "Open web. No vendor plugin.",
  webflow: "Hosted websites with a visual editor.",
  x: "Public posts.",
  youtube: "Hosted video.",
  zendesk: "Support tickets.",
};

export function companyDoes(slug: string, name: string): string {
  const known = DOES_BY_SLUG[slug];
  if (known) return known;
  if (/\b(app|service|system|platform|storage)\b/i.test(name)) return name;
  return "Connector listed on a verified Run.";
}

export function companyPath(slug: string): string {
  return `${COMPANIES_PATH}/${slug}`;
}

export function parseCompanySlug(raw: string | undefined): string | null {
  const slug = (raw || "").trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return slug;
}

export function companySlug(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed || isGlueConnector(trimmed)) return null;
  const key = toolKey(trimmed);
  switch (key) {
    case "gmail":
    case "slack":
    case "github":
    case "calendar":
    case "web":
    case "x":
    case "notion":
    case "linear":
    case "lighthouse":
      return key;
    case "browser":
      return "chrome";
    case "generic": {
      const slug = trimmed
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return slug || null;
    }
    default: {
      const _never: never = key;
      return _never;
    }
  }
}

function directoryLabel(names: string[], key: ToolKey): string {
  switch (key) {
    case "gmail":
      return "Gmail";
    case "slack":
      return "Slack";
    case "github":
      return "GitHub";
    case "calendar":
      return "Calendar";
    case "web":
      return "web";
    case "x":
      return "X";
    case "notion":
      return "Notion";
    case "linear":
      return "Linear";
    case "lighthouse":
      return "Lighthouse";
    case "browser":
      return names.find((n) => /chrome/i.test(n))?.trim() || "Chrome";
    case "generic": {
      const counts = new Map<string, { label: string; n: number }>();
      for (const name of names) {
        const k = name.trim().toLowerCase();
        const cur = counts.get(k);
        if (!cur) counts.set(k, { label: name.trim(), n: 1 });
        else cur.n += 1;
      }
      return [...counts.values()].sort((a, b) => b.n - a.n || a.label.localeCompare(b.label))[0]?.label ?? names[0] ?? "";
    }
    default: {
      const _never: never = key;
      return _never;
    }
  }
}

export function companiesFromRuns(runs: RunRow[]): CompanyEntry[] {
  const groups = new Map<string, { names: string[]; keys: ToolKey[]; jobs: Map<number, CompanyJob> }>();
  for (const run of runs) {
    if (run.status !== "published" || run.serial == null) continue;
    const path = publishedRunPath(run);
    if (!path) continue;
    const job: CompanyJob = {
      title: run.title,
      serial: run.serial,
      path,
      serialLabel: runId(run.serial),
    };
    for (const raw of parseConnectors(run.connectors)) {
      const slug = companySlug(raw);
      if (!slug) continue;
      const group = groups.get(slug) ?? { names: [], keys: [], jobs: new Map() };
      group.names.push(raw);
      group.keys.push(toolKey(raw));
      group.jobs.set(run.serial, job);
      groups.set(slug, group);
    }
  }
  return [...groups.entries()]
    .map(([slug, group]) => {
      const known = group.keys.find((key) => key !== "generic") ?? "generic";
      const name = directoryLabel(group.names, known);
      return {
        slug,
        name,
        does: companyDoes(slug, name),
        jobs: [...group.jobs.values()].sort((a, b) => b.serial - a.serial),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

export function runHasCompany(run: RunRow, slug: string): boolean {
  return parseConnectors(run.connectors).some((name) => companySlug(name) === slug);
}
