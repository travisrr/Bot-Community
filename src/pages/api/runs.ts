import type { APIRoute } from "astro";
import { userFromAuth } from "../../lib/auth";
import { json } from "../../lib/http";
import { parseRunMarkdown } from "../../lib/markdown";
import { createRun, hasEvidence, parseEvidence, previewLocation } from "../../lib/runs";
import { rateLimit, clientIp } from "../../lib/rate-limit";
import type { EvidenceItem, SensitiveKind, WouldRunAgain } from "../../lib/types";
import { siteOrigin } from "../../lib/env";

const WOULD = new Set(["yes", "with_changes", "no"]);

export const POST: APIRoute = async ({ request }) => {
  const user = await userFromAuth(request);
  if (!user) return json({ error: "auth_required" }, 401);
  const allowed = await rateLimit(`api-run:${user.id}:${clientIp(request)}`, 20, 60 * 60 * 1000);
  if (!allowed) return json({ error: "rate_limited" }, 429);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  let title = String(body.title || "");
  let job_text = String(body.job_text || "");
  let what_happened = String(body.what_happened || "");
  let connectors = Array.isArray(body.connectors) ? body.connectors.map(String) : [];
  let would = String(body.would_run_again || "yes");
  let prompt_text = String(body.prompt_text || "");
  let constraints = String(body.constraints || "");
  let sensitive = (body.sensitive_kind as SensitiveKind) ?? null;
  if (typeof body.markdown === "string" && body.markdown.trim()) {
    const parsed = parseRunMarkdown(body.markdown);
    title ||= parsed.title;
    job_text ||= parsed.job_text;
    what_happened ||= parsed.what_happened;
    if (!connectors.length) connectors = parsed.connectors;
    would ||= parsed.would_run_again;
    prompt_text ||= parsed.prompt_text;
    constraints ||= parsed.constraints;
    sensitive ||= parsed.sensitive_kind;
  }
  const would_run_again = (WOULD.has(would) ? would : "yes") as WouldRunAgain;
  const evidence = Array.isArray(body.evidence)
    ? (body.evidence as EvidenceItem[])
    : parseEvidence(JSON.stringify(body.evidence_urls ?? []));
  const queue = body.status !== "draft";
  if (title.trim().length < 8 || job_text.trim().length < 20 || what_happened.trim().length < 20) {
    return json({ error: "incomplete_run" }, 400);
  }
  if (queue && connectors.length === 0) {
    return json({ error: "connectors_required" }, 400);
  }
  if (queue && !hasEvidence(evidence)) {
    return json({ error: "evidence_required" }, 400);
  }
  try {
    const run = await createRun({
      user,
      title,
      job_text,
      connectors,
      what_happened,
      would_run_again,
      evidence,
      prompt_text,
      constraints,
      sensitive_kind: sensitive,
      queue,
    });
    const origin = siteOrigin(request);
    return json({
      ok: true,
      id: run.id,
      serial: null,
      status: run.status,
      preview: previewLocation(run, origin),
      note: "Pending until a human verifies. Bots cannot stamp serials or mint Houses.",
    }, 201);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "failed" }, 400);
  }
};
