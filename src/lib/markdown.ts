import type { SensitiveKind, WouldRunAgain } from "./types";

export type ParsedRunMarkdown = {
  title: string;
  job_text: string;
  connectors: string[];
  what_happened: string;
  would_run_again: WouldRunAgain;
  prompt_text: string;
  constraints: string;
  sensitive_kind: SensitiveKind;
  evidence_url: string;
  evidence_url_note: string;
  evidence_note: string;
};

export type ParsedPatchMarkdown = {
  claim: string;
  proposed_title: string;
  proposed_job_text: string;
  proposed_prompt: string;
  proposed_what_happened: string;
  evidence_url: string;
  evidence_url_note: string;
  evidence_note: string;
};

const WOULD = new Set<WouldRunAgain>(["yes", "with_changes", "no"]);
const UNSET = /^(unchanged|n\/?a|omit|none|same|optional|null|\(unchanged\)|\(optional\)|\(omit\))\.?$/i;

export function parseRunMarkdown(raw: string): ParsedRunMarkdown {
  const { fm, sections } = splitMarkdown(unwrapMarkdownFence(raw));

  const title =
    fm.title ||
    sections.body.split("\n")[0]?.replace(/^#\s+/, "").trim() ||
    pick(sections, ["title"]) ||
    "";
  const job_text = fm.job || pick(sections, ["job", "job / prompt", "prompt job"]) || sections.body;
  const what = fm.what_happened || pick(sections, ["what happened", "what_happened", "result"]);
  const connectorsRaw = fm.connectors || pick(sections, ["connectors", "tools"]);
  const wouldRaw = (fm.would_run_again || pick(sections, ["would run again", "would_run_again"]) || "yes")
    .toLowerCase()
    .replaceAll(" ", "_");
  const would_run_again: WouldRunAgain = WOULD.has(wouldRaw as WouldRunAgain)
    ? (wouldRaw as WouldRunAgain)
    : "yes";
  const sensitive = (fm.sensitive_kind || fm.disclaimer || "").toLowerCase();
  const sensitive_kind: SensitiveKind =
    sensitive === "legal" || sensitive === "medical" || sensitive === "financial" ? sensitive : null;

  return {
    title: title.replace(/^(?:BR-)?\d{1,5}(?:\.r\d+)?\s+[—-]\s+/i, "").trim(),
    job_text: job_text.trim(),
    connectors: connectorsRaw
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean),
    what_happened: what.trim(),
    would_run_again,
    prompt_text: fm.prompt || pick(sections, ["prompt", "prompt text"]),
    constraints: fm.constraints || pick(sections, ["constraints"]),
    sensitive_kind,
    evidence_url: meaningful(fm.evidence_url || pick(sections, ["evidence url", "evidence_url"])),
    evidence_url_note: meaningful(
      fm.evidence_url_note || pick(sections, ["evidence url note", "evidence_url_note"]),
    ),
    evidence_note: meaningful(fm.evidence_note || pick(sections, ["evidence note"])),
  };
}

export function parsePatchMarkdown(raw: string): ParsedPatchMarkdown {
  const { fm, sections } = splitMarkdown(unwrapMarkdownFence(raw));
  const headedClaim = pick(sections, ["what is better", "claim", "why this is better"]);
  const claim = meaningful(fm.claim || headedClaim || (plainPatchBody(sections) ? sections.body : ""));
  return {
    claim,
    proposed_title: meaningful(fm.title || pick(sections, ["proposed title"])),
    proposed_job_text: meaningful(
      fm.job || fm.proposed_job_text || pick(sections, ["proposed job", "proposed job text"]),
    ),
    proposed_prompt: meaningful(fm.prompt || fm.proposed_prompt || pick(sections, ["proposed prompt"])),
    proposed_what_happened: meaningful(
      fm.what_happened || fm.proposed_what_happened || pick(sections, ["proposed what happened"]),
    ),
    evidence_url: meaningful(fm.evidence_url || pick(sections, ["evidence url", "evidence_url"])),
    evidence_url_note: meaningful(
      fm.evidence_url_note || pick(sections, ["evidence url note", "evidence_url_note"]),
    ),
    evidence_note: meaningful(fm.evidence_note || pick(sections, ["evidence note"])),
  };
}

function unwrapMarkdownFence(raw: string): string {
  const text = raw.replaceAll("\r\n", "\n").trim();
  const fenced = text.match(/```(?:markdown|md)?\n([\s\S]*?)\n```/);
  return fenced ? fenced[1].trim() : text;
}

function splitMarkdown(raw: string): { fm: Record<string, string>; sections: Record<string, string> } {
  const text = raw.replaceAll("\r\n", "\n").trim();
  let body = text;
  const fm: Record<string, string> = {};
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end !== -1) {
      const yaml = text.slice(4, end).trim();
      body = text.slice(end + 4).trim();
      for (const line of yaml.split("\n")) {
        const i = line.indexOf(":");
        if (i === -1) continue;
        fm[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
      }
    }
  }

  const sections: Record<string, string> = {};
  let current = "body";
  const buf: string[] = [];
  const flush = () => {
    sections[current] = buf.join("\n").trim();
    buf.length = 0;
  };
  for (const line of body.split("\n")) {
    const h = line.match(/^#{1,3}\s+(.*)$/);
    if (h) {
      flush();
      current = h[1].trim().toLowerCase();
      continue;
    }
    buf.push(line);
  }
  flush();
  return { fm, sections };
}

function plainPatchBody(sections: Record<string, string>): boolean {
  return Object.entries(sections).every(([key, value]) => key === "body" || !value);
}

function meaningful(s: string): string {
  const t = s.trim();
  if (!t || UNSET.test(t)) return "";
  return t;
}

function pick(sections: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    if (sections[k]) return sections[k];
  }
  return "";
}
