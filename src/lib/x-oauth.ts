import { getEnv } from "./env";
import { randomToken, pkceVerifier } from "./crypto";
import { safeNextPath } from "./http";

const AUTH_URL = "https://x.com/i/oauth2/authorize";
const TOKEN_URL = "https://api.x.com/2/oauth2/token";
const ME_URL = "https://api.x.com/2/users/me";
const REVOKE_URL = "https://api.x.com/2/oauth2/revoke";
const SCOPES = ["users.read", "tweet.read"] as const;

export function xConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.X_CLIENT_ID?.trim() && env.X_CLIENT_SECRET?.trim());
}

export function xLoginPath(next = "/account"): string {
  return `/api/auth/x?next=${encodeURIComponent(safeNextPath(next))}`;
}

function basicAuthHeader(clientId: string, clientSecret: string): string {
  const bytes = new TextEncoder().encode(`${clientId}:${clientSecret}`);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return `Basic ${btoa(bin)}`;
}

function authorizeUrl(clientId: string, redirectUri: string, state: string, challenge: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES.join(" "),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  // X expects RFC 3986 spaces (%20), not form-urlencoded pluses.
  return `${AUTH_URL}?${params.toString().replaceAll("+", "%20")}`;
}

export async function startXLogin(origin: string, redirectTo = "/account"): Promise<string> {
  const env = getEnv();
  const { verifier, challenge } = await pkceVerifier();
  const state = randomToken(16);
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const next = safeNextPath(redirectTo);
  await env.DB.prepare(
    "INSERT INTO oauth_states (id, provider, code_verifier, redirect_to, expires_at) VALUES (?, 'x', ?, ?, ?)",
  )
    .bind(state, verifier, next, expires_at)
    .run();
  return authorizeUrl(env.X_CLIENT_ID, `${origin}/api/auth/x/callback`, state, challenge);
}

async function revokeAccessToken(accessToken: string): Promise<void> {
  const env = getEnv();
  try {
    await fetch(REVOKE_URL, {
      method: "POST",
      headers: {
        Authorization: basicAuthHeader(env.X_CLIENT_ID, env.X_CLIENT_SECRET),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        token: accessToken,
        token_type_hint: "access_token",
        client_id: env.X_CLIENT_ID,
      }),
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "x_oauth_revoke_failed", error: String(error) }));
  }
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
      Authorization: basicAuthHeader(env.X_CLIENT_ID, env.X_CLIENT_SECRET),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const tokenJson = (await tokenRes.json().catch(() => null)) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  } | null;
  if (!tokenRes.ok || !tokenJson?.access_token) {
    console.error(
      JSON.stringify({
        event: "x_oauth_token_failed",
        status: tokenRes.status,
        error: tokenJson?.error ?? "missing_token",
      }),
    );
    throw new Error("X token exchange failed.");
  }
  const meRes = await fetch(`${ME_URL}?user.fields=id,name,username`, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const me = (await meRes.json().catch(() => null)) as {
    data?: { id: string; name: string; username: string };
  } | null;
  await revokeAccessToken(tokenJson.access_token);
  if (!meRes.ok || !me?.data?.id) {
    console.error(JSON.stringify({ event: "x_oauth_profile_failed", status: meRes.status }));
    throw new Error("Could not read X profile.");
  }
  return {
    x_user_id: me.data.id,
    display_name: me.data.name || me.data.username,
    x_handle: me.data.username,
    redirect_to: safeNextPath(row.redirect_to),
  };
}
