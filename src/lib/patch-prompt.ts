import { parseConnectors } from "./tools";
import { runIdWithRev, wouldLabel } from "./format";
import { canonical } from "./site";
import type { RunRow } from "./types";

export function buildPatchPrompt(
  run: RunRow,
  origin: string,
  path: string,
  changelog: { revision: number; one_liner: string }[],
): string {
  if (!run.serial || !run.house_number) {
    throw new Error("Cannot build a patch prompt without a published serial.");
  }
  const url = canonical(origin, path);
  const mdUrl = `${url}.md`;
  const serial = runIdWithRev(run.serial, run.revision);
  const connectors = parseConnectors(run.connectors).join(", ") || "None listed.";
  const parts = [
    `Write a patch for a verified Run on really.bot.`,
    ``,
    `A patch is the same job, done better, with evidence. It is not a new serial. Empty “this is better” text is rejected. Do not copy the original Run back as the proposal. Omit any section that is unchanged.`,
    ``,
    `Return ONLY the markdown in the Output format below — no preamble, no commentary — so it can be pasted back into really.bot.`,
    ``,
    `## This Run`,
    ``,
    `URL: ${url}`,
    `Markdown: ${mdUrl}`,
    `Serial: ${serial}`,
    `Title: ${run.title}`,
    ``,
    `### Job`,
    run.job_text.trim(),
    ``,
    `### Connectors`,
    connectors,
    ``,
    `### What happened`,
    run.what_happened.trim(),
  ];
  if (run.prompt_text?.trim()) {
    parts.push(``, `### Prompt`, run.prompt_text.trim());
  }
  if (run.constraints?.trim()) {
    parts.push(``, `### Constraints`, run.constraints.trim());
  }
  parts.push(``, `Would run again: ${wouldLabel(run.would_run_again)}`);
  if (changelog.length) {
    parts.push(``, `### Changelog`, ...changelog.map((c) => `- r${c.revision}: ${c.one_liner}`));
  }
  parts.push(
    ``,
    `## Questions to answer`,
    ``,
    `1. What is better? Required. One paragraph, tied to the evidence. What you ran that beats this published result.`,
    `2. Proposed title? Optional. Only if the current title is wrong or weaker.`,
    `3. Proposed job text? Optional. The sharper ask. Same job, not a different job.`,
    `4. Proposed prompt? Optional. The actual prompt to run, if it should replace the published prompt.`,
    `5. Proposed what happened? Optional. What your run actually did.`,
    `6. Evidence URL + note? Optional here. A public URL of proof, plus one sentence on what it proves. You can also attach files on the site.`,
    `7. Evidence note? Optional. If the screenshot stays private, describe what it showed. Redact PII.`,
    ``,
    `## Output format`,
    ``,
    `---`,
    `title: `,
    `evidence_url: `,
    `evidence_url_note: `,
    `---`,
    ``,
    `# What is better`,
    ``,
    `# Proposed job`,
    ``,
    `# Proposed prompt`,
    ``,
    `# Proposed what happened`,
    ``,
    `# Evidence note`,
    ``,
  );
  return parts.join("\n");
}
