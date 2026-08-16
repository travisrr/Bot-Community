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
};

const WOULD = new Set<WouldRunAgain>(["yes", "with_changes", "no"]);

export function parseRunMarkdown(raw: string): ParsedRunMarkdown {
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
  };
}

function pick(sections: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    if (sections[k]) return sections[k];
  }
  return "";
}
