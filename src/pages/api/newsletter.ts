import type { APIRoute } from "astro";
import { subscribeDailyRunLog, validNewsletterEmail } from "../../lib/beehiiv";
import { siteOrigin } from "../../lib/env";
import { flashCookie } from "../../lib/flash";
import { json, redirectTo } from "../../lib/http";
import { clientIp, rateLimit } from "../../lib/rate-limit";

function wantsJson(request: Request): boolean {
  return (request.headers.get("accept") || "").includes("application/json");
}

async function readEmail(request: Request): Promise<string> {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    const body = (await request.json()) as { email?: unknown };
    return String(body.email || "").trim().toLowerCase();
  }
  const form = await request.formData();
  return String(form.get("email") || "").trim().toLowerCase();
}

export const POST: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  const allowed = await rateLimit(`news:${clientIp(request)}`, 10, 60 * 60 * 1000);
  if (!allowed) {
    if (wantsJson(request)) return json({ error: "rate_limited" }, 429);
    return redirectTo("/", [flashCookie("Slow down. Rate limit.", origin)]);
  }

  let email: string;
  try {
    email = await readEmail(request);
  } catch {
    if (wantsJson(request)) return json({ error: "invalid" }, 400);
    return redirectTo("/", [flashCookie("That email looks wrong.", origin)]);
  }

  if (!validNewsletterEmail(email)) {
    if (wantsJson(request)) return json({ error: "invalid" }, 400);
    return redirectTo("/", [flashCookie("That email looks wrong.", origin)]);
  }

  const result = await subscribeDailyRunLog(email, origin);
  if (!result.ok) {
    const message =
      result.status === 503
        ? "The list is not taking signups from this server yet."
        : "Beehiiv did not take that address. Try again.";
    if (wantsJson(request)) return json({ error: "subscribe_failed" }, result.status === 503 ? 503 : 502);
    return redirectTo("/", [flashCookie(message, origin)]);
  }

  if (wantsJson(request)) return json({ ok: true });
  return redirectTo("/", [flashCookie("Check your inbox to confirm The Daily Run Log.", origin)]);
};
