import { getEnv } from "./env";
import { MAIL_FROM_DEFAULT, SITE_EMAIL, SITE_NAME } from "./site";

export function mailerConfigured(): boolean {
  return Boolean(getEnv().RESEND_API_KEY?.trim());
}

export function mailFrom(): string {
  return getEnv().MAIL_FROM?.trim() || MAIL_FROM_DEFAULT;
}

export async function sendEmail(input: { to: string; subject: string; text: string }): Promise<{ sent: boolean; error?: string }> {
  const env = getEnv();
  const key = env.RESEND_API_KEY?.trim();
  const from = mailFrom();
  if (!key) return { sent: false, error: "no_mailer" };
  const text = `${input.text.trim()}\n\n— ${SITE_NAME}\n${SITE_EMAIL}`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      reply_to: SITE_EMAIL,
      subject: input.subject,
      text,
    }),
  });
  if (!res.ok) {
    return { sent: false, error: `mailer_${res.status}` };
  }
  return { sent: true };
}
