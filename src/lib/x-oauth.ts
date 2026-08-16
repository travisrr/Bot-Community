import { getEnv } from "./env";
import { randomToken, pkceVerifier } from "./crypto";

const AUTH_URL = "https://x.com/i/oauth2/authorize";
const TOKEN_URL = "https://api.x.com/2/oauth2/token";
const ME_URL = "https://api.x.com/2/users/me";

export function xConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.X_CLIENT_ID?.trim() && env.X_CLIENT_SECRET?.trim());
}

export async function startXLogin(origin: string, redirectTo = "/account"): Promise<string> {
  const env = getEnv();
  const { verifier, challenge } = await pkceVerifier();
  const state = randomToken(16);
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await env.DB.prepare(
    "INSERT INTO oauth_states (id, provider, code_verifier, redirect_to, expires_at) VALUES (?, 'x', ?, ?, ?)",
  )
    .bind(state, verifier, redirectTo, expires_at)
    .run();
  const redirectUri = `${origin}/api/auth/x/callback`;
  const url = new URL(AUTH_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", env.X_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "users.read tweet.read offline.access");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export async function finishXLogin(origin: string, code: string, state: string) {
  const env = getEnv();
  const row = await env.DB.prepare(
    "SELECT code_verifier, redirect_to, expires_at FROM oauth_states WHERE id = ? AND provider = 'x'",
  )
    .bind(state)
    .first<{ code_verifier: string; redirect_to: string | null; expires_at: string }>();
  if (!row) throw new Error("Unknown X login state.");
  await env.DB.prepare("DELETE FROM oauth_states WHERE id = ?").bind(state).run();
  if (new Date(row.expires_at).getTime() < Date.now()) throw new Error("X login expired. Try again.");
  const redirectUri = `${origin}/api/auth/x/callback`;
  const basic = btoa(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: row.code_verifier,
    client_id: env.X_CLIENT_ID,
  });
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!tokenRes.ok) throw new Error("X token exchange failed.");
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) throw new Error("X token missing.");
  const meRes = await fetch(`${ME_URL}?user.fields=id,name,username`, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!meRes.ok) throw new Error("Could not read X profile.");
  const me = (await meRes.json()) as {
    data?: { id: string; name: string; username: string };
  };
  if (!me.data?.id) throw new Error("X profile missing.");
  return {
    x_user_id: me.data.id,
    display_name: me.data.name || me.data.username,
    x_handle: me.data.username,
    redirect_to: row.redirect_to || "/account",
  };
}
