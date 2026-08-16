import type { APIRoute } from "astro";
import { userFromAuth } from "../../../../lib/auth";
import { json } from "../../../../lib/http";
import { getPublishedRun, hasEvidence, parseEvidence } from "../../../../lib/runs";
import { submitPatch, PatchError } from "../../../../lib/patches";
import { parseSerialParam } from "../../../../lib/format";
import { rateLimit, clientIp } from "../../../../lib/rate-limit";
import { collectEvidence } from "../../../../lib/evidence";
import { parsePatchFields } from "../../../../lib/forms";
import { parsePatchMarkdown } from "../../../../lib/markdown";
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
    const fields = parsePatchFields(form);
    claim = fields.claim;
    proposed_title = fields.proposed_title;
    proposed_job_text = fields.proposed_job_text;
    proposed_prompt = fields.proposed_prompt;
    proposed_what_happened = fields.proposed_what_happened;
    try {
      evidence = await collectEvidence(form);
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : "evidence" }, 400);
    }
  } else {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return json({ error: "invalid_json" }, 400);
    }
    const parsed = parsePatchMarkdown(String(body.markdown || body.patch || ""));
    claim = String(body.claim || parsed.claim || "");
    proposed_title = body.proposed_title ? String(body.proposed_title) : parsed.proposed_title || null;
    proposed_job_text = body.proposed_job_text
      ? String(body.proposed_job_text)
      : parsed.proposed_job_text || null;
    proposed_prompt = body.proposed_prompt ? String(body.proposed_prompt) : parsed.proposed_prompt || null;
    proposed_what_happened = body.proposed_what_happened
      ? String(body.proposed_what_happened)
      : parsed.proposed_what_happened || null;
    evidence = Array.isArray(body.evidence)
      ? (body.evidence as EvidenceItem[])
      : parseEvidence(JSON.stringify(body.evidence_urls ?? []));
    if (parsed.evidence_url || parsed.evidence_url_note) {
      if (!parsed.evidence_url || !parsed.evidence_url_note) {
        return json({ error: "URL evidence needs both a URL and a note." }, 400);
      }
      try {
        const parsedUrl = new URL(parsed.evidence_url);
        if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
          throw new Error("bad");
        }
      } catch {
        return json({ error: "Evidence URL is not valid." }, 400);
      }
      if (!evidence.some((item) => item.kind === "url")) {
        evidence.push({ kind: "url", href: parsed.evidence_url, note: parsed.evidence_url_note });
      }
    }
    if (parsed.evidence_note && !evidence.some((item) => item.kind === "note" && !item.key)) {
      evidence.push({ kind: "note", note: parsed.evidence_note });
    }
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
