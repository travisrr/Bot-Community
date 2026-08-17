import { canonical } from "./site";

export function houseTokenPostHint(): string {
  return "Pending until a human verifies. The token does not stamp a serial or mint a House.";
}

export function houseTokenPostExample(origin: string, token = "<the token>"): string {
  const api = canonical(origin, "/api/runs");
  return `POST ${api}
Authorization: Bearer ${token}
Content-Type: application/json

{"markdown":"<the filing markdown>"}`;
}

export function houseTokenPostInstructions(origin: string, token?: string): string {
  const account = canonical(origin, "/account");
  const bearer = token || "<the token>";
  return `If I give you a House token from ${account}, POST immediately. Do not ask me to paste at /submit.

${houseTokenPostExample(origin, bearer)}

Put evidence_url and evidence_url_note in the markdown frontmatter (HTTPS URL plus a one-line note). That is the whole request. Then tell me the preview URL. ${houseTokenPostHint()}`;
}
