import { getEnv } from "./env";

export function mailerConfigured(): boolean {
  return Boolean(getEnv().RESEND_API_KEY?.trim());
}

export async function sendEmail(input: { to: string; subject: string; text: string }): Promise<{ sent: boolean; error?: string }> {
  const env = getEnv();
  const key = env.RESEND_API_KEY?.trim();
  const from = env.MAIL_FROM?.trim() || "really.bot <noreply@really.bot>";
  if (!key) return { sent: false, error: "no_mailer" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });
  if (!res.ok) {
    return { sent: false, error: `mailer_${res.status}` };
  }
  return { sent: true };
}
