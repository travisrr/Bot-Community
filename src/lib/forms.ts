import type { SensitiveKind, WouldRunAgain } from "./types";
import { parsePatchMarkdown, parseRunMarkdown } from "./markdown";
import { splitList } from "./html";

const WOULD = new Set<WouldRunAgain>(["yes", "with_changes", "no"]);
const SENSITIVE = new Set(["legal", "medical", "financial"]);

export function parseRunFields(form: FormData) {
  const md = String(form.get("markdown") || "").trim();
  const parsed = md ? parseRunMarkdown(md) : null;
  const title = String(form.get("title") || parsed?.title || "").trim();
  const job_text = String(form.get("job_text") || parsed?.job_text || "").trim();
  const what_happened = String(form.get("what_happened") || parsed?.what_happened || "").trim();
  const fromForm = splitList(String(form.get("connectors") || ""));
  const connectors = fromForm.length ? fromForm : parsed?.connectors || [];
  const wouldRaw = String(form.get("would_run_again") || parsed?.would_run_again || "yes");
  const would_run_again: WouldRunAgain = WOULD.has(wouldRaw as WouldRunAgain)
    ? (wouldRaw as WouldRunAgain)
    : "yes";
  const prompt_text = String(form.get("prompt_text") || parsed?.prompt_text || "").trim();
  const constraints = String(form.get("constraints") || parsed?.constraints || "").trim();
  const sensitiveRaw = String(form.get("sensitive_kind") || parsed?.sensitive_kind || "");
  const sensitive_kind: SensitiveKind = SENSITIVE.has(sensitiveRaw)
    ? (sensitiveRaw as Exclude<SensitiveKind, null>)
    : null;
  const intent = String(form.get("intent") || "");
  const queue = intent === "submit" || intent === "publish" || form.get("queue") === "true";
  return {
    title,
    job_text,
    what_happened,
    connectors: connectors.length ? connectors : parsed?.connectors || [],
    would_run_again,
    prompt_text,
    constraints,
    sensitive_kind,
    queue,
  };
}

export function validateRunFields(f: ReturnType<typeof parseRunFields>): string | null {
  if (f.title.length < 8) return "Title is too short.";
  if (f.job_text.length < 20) return "Job text is too short. Say what you asked.";
  if (f.what_happened.length < 20) return "Say what happened.";
  if (f.queue && f.connectors.length === 0) return "Say what it connected to.";
  return null;
}

export function parsePatchFields(form: FormData) {
  const parsed = parsePatchMarkdown(String(form.get("markdown") || ""));
  applyParsedPatchToForm(form, parsed);
  return {
    claim: String(form.get("claim") || parsed.claim || "").trim(),
    proposed_title: String(form.get("proposed_title") || parsed.proposed_title || "").trim() || null,
    proposed_job_text: String(form.get("proposed_job_text") || parsed.proposed_job_text || "").trim() || null,
    proposed_prompt: String(form.get("proposed_prompt") || parsed.proposed_prompt || "").trim() || null,
    proposed_what_happened:
      String(form.get("proposed_what_happened") || parsed.proposed_what_happened || "").trim() || null,
  };
}

export function applyParsedPatchToForm(
  form: FormData,
  parsed: ReturnType<typeof parsePatchMarkdown>,
) {
  if (!String(form.get("evidence_url") || "").trim() && parsed.evidence_url) {
    form.set("evidence_url", parsed.evidence_url);
  }
  if (!String(form.get("evidence_url_note") || "").trim() && parsed.evidence_url_note) {
    form.set("evidence_url_note", parsed.evidence_url_note);
  }
  if (!String(form.get("evidence_note") || "").trim() && parsed.evidence_note) {
    form.set("evidence_note", parsed.evidence_note);
  }
}
