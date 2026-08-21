import { getEnv } from "./env";

export const BEEHIIV_FORM_ID = "d63ecb38-3a14-4087-86b7-32c94d842505";
export const BEEHIIV_PUBLICATION_ID = "pub_cc1c9492-0700-40eb-9999-c5fab502ca25";
export const BEEHIIV_SLIM_SRC = `https://subscribe-forms.beehiiv.com/v3/forms/${BEEHIIV_FORM_ID}?layout=slim`;

/** Existing /takes form. Do not mint a second publication or popup. */
export const TAKES_FORM_ID = "03452523-be03-46ba-ae30-20087b218072";
export const TAKES_URL = "https://takes.beehiiv.com/";
export const TAKES_EMBED_SRC = `https://embeds.beehiiv.com/${TAKES_FORM_ID}`;

export function beehiivApiKey(): string {
  return getEnv().BEEHIIV_API_KEY?.trim() ?? "";
}

export function validNewsletterEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at < 1 || at !== trimmed.lastIndexOf("@")) return false;
  const host = trimmed.slice(at + 1);
  return host.includes(".") && !trimmed.includes(" ") && trimmed.length < 200;
}

export async function subscribeDailyRunLog(
  email: string,
  referrer: string,
): Promise<{ ok: true } | { ok: false; status: number }> {
  const key = beehiivApiKey();
  if (!key) return { ok: false, status: 503 };

  const res = await fetch(
    `https://api.beehiiv.com/v2/publications/${BEEHIIV_PUBLICATION_ID}/subscriptions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        reactivate_existing: true,
        send_welcome_email: true,
        utm_source: "really.bot",
        utm_medium: "homepage",
        utm_content: BEEHIIV_FORM_ID,
        referring_site: referrer,
      }),
    },
  );

  if (res.ok) return { ok: true };
  return { ok: false, status: res.status };
}
