import type { APIRoute } from "astro";
import { userFromAuth } from "../../../../lib/auth";
import { json } from "../../../../lib/http";
import { getPublishedRun, hasEvidence, parseEvidence } from "../../../../lib/runs";
import { submitPatch, PatchError } from "../../../../lib/patches";
import { parseSerialParam } from "../../../../lib/format";
import { rateLimit, clientIp } from "../../../../lib/rate-limit";
import type { EvidenceItem } from "../../../../lib/types";

export const POST: APIRoute = async ({ params, request }) => {
  const user = await userFromAuth(request);
  if (!user) return json({ error: "auth_required" }, 401);
  const serial = parseSerialParam(params.serial);
  if (!serial) return json({ error: "not_found" }, 404);
  const run = await getPublishedRun(serial);
  if (!run) return json({ error: "not_found" }, 404);
  const allowed = await rateLimit(`api-patch:${user.id}:${clientIp(request)}`, 12, 60 * 60 * 1000);
  if (!allowed) return json({ error: "rate_limited" }, 429);

  const contentType = request.headers.get("content-type") || "";
  let claim = "";
  let evidence: EvidenceItem[] = [];
  let proposed_title: string | null = null;
  let proposed_job_text: string | null = null;
  let proposed_prompt: string | null = null;
  let proposed_what_happened: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    claim = String(form.get("claim") || "");
    const { collectEvidence } = await import("../../../../lib/evidence");
    try {
      evidence = await collectEvidence(form);
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : "evidence" }, 400);
    }
    proposed_title = String(form.get("proposed_title") || "") || null;
    proposed_job_text = String(form.get("proposed_job_text") || "") || null;
    proposed_prompt = String(form.get("proposed_prompt") || "") || null;
    proposed_what_happened = String(form.get("proposed_what_happened") || "") || null;
  } else {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return json({ error: "invalid_json" }, 400);
    }
    claim = String(body.claim || "");
    evidence = Array.isArray(body.evidence) ? (body.evidence as EvidenceItem[]) : parseEvidence(JSON.stringify(body.evidence_urls ?? []));
    proposed_title = body.proposed_title ? String(body.proposed_title) : null;
    proposed_job_text = body.proposed_job_text ? String(body.proposed_job_text) : null;
    proposed_prompt = body.proposed_prompt ? String(body.proposed_prompt) : null;
    proposed_what_happened = body.proposed_what_happened ? String(body.proposed_what_happened) : null;
  }

  if (!hasEvidence(evidence)) {
    return json({ error: "evidence_required" }, 400);
  }
  try {
    const patch = await submitPatch({
      run,
      user,
      claim,
      evidence,
      proposed_title,
      proposed_job_text,
      proposed_prompt,
      proposed_what_happened,
    });
    return json({ ok: true, patch_id: patch.id, status: patch.status, veto_deadline: patch.veto_deadline }, 201);
  } catch (err) {
    const status = err instanceof PatchError ? 400 : 500;
    return json({ error: err instanceof Error ? err.message : "failed" }, status);
  }
};
