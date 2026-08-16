import type { APIRoute } from "astro";
import { getEvidenceObject } from "../../lib/evidence";

export const GET: APIRoute = async ({ params }) => {
  const key = params.key;
  if (!key || key.includes("..") || key.includes("/")) {
    return new Response("Not found", { status: 404 });
  }
  const obj = await getEvidenceObject(key);
  if (!obj) return new Response("Not found", { status: 404 });
  const type = obj.httpMetadata?.contentType || "application/octet-stream";
  return new Response(obj.body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
