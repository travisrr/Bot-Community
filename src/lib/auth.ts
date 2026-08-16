import { SESSION_COOKIE, SESSION_DAYS, USERNAME_RE, MIN_PASSWORD, OWNER_X_HANDLE } from "./site";
import { hashPassword, verifyPassword, randomToken, sha256b64url, timingSafeEqual, b64urlToBytes } from "./crypto";
import { isoNow } from "./format";
import type { PublicUser, Role, UserRow } from "./types";
import { getEnv } from "./env";

const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

export function normalizeXHandle(raw: string | null | undefined): string {
  return (raw || "").replace(/^@/, "").trim();
}

export function isOwnerXHandle(raw: string | null | undefined): boolean {
  return normalizeXHandle(raw).toLowerCase() === OWNER_X_HANDLE;
}

export function isStaff(user: { role: Role } | null | undefined): boolean {
  if (!user) return false;
  switch (user.role) {
    case "owner":
    case "admin":
      return true;
    case "user":
      return false;
    default: {
      const _never: never = user.role;
      return _never;
    }
  }
}

export function isOwner(user: { role: Role } | null | undefined): boolean {
  return user?.role === "owner";
}

export function ownerForbidden(user: PublicUser | null): Response | null {
  if (isOwner(user)) return null;
  return new Response("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
}

export function homePathFor(user: { role: Role }, next?: string | null): string {
  const dest = (next || "").trim() || "/account";
  if (dest !== "/account" && dest !== "/") return dest;
  return isOwner(user) ? "/admin" : "/account";
}

export function loginFlash(user: { role: Role }, via: "x" | "password"): string {
  switch (user.role) {
    case "owner":
      return via === "x" ? "Logged in with X as Owner." : "Logged in as Owner.";
    case "admin":
    case "user":
      return via === "x" ? "Logged in with X." : "Logged in.";
    default: {
      const _never: never = user.role;
      return _never;
    }
  }
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    display_name: row.display_name,
    house_number: row.house_number,
    house_claimed_at: row.house_claimed_at,
    x_handle: row.x_handle,
    role: isOwnerXHandle(row.x_handle) ? "owner" : row.role,
  };
}

export async function findUserById(id: string): Promise<UserRow | null> {
  return getEnv()
    .DB.prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first<UserRow>();
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  return getEnv()
    .DB.prepare("SELECT * FROM users WHERE lower(email) = lower(?)")
    .bind(email.trim())
    .first<UserRow>();
}

export async function findUserByUsername(username: string): Promise<UserRow | null> {
  return getEnv()
    .DB.prepare("SELECT * FROM users WHERE lower(username) = lower(?)")
    .bind(username.trim())
    .first<UserRow>();
}

export async function findUserByLogin(identifier: string): Promise<UserRow | null> {
  const id = identifier.trim();
  if (id.includes("@")) return findUserByEmail(id);
  return findUserByUsername(id);
}

export async function findUserByX(xUserId: string): Promise<UserRow | null> {
  return getEnv()
    .DB.prepare("SELECT * FROM users WHERE x_user_id = ?")
    .bind(xUserId)
    .first<UserRow>();
}

export async function findUnclaimedOwnerSeat(): Promise<UserRow | null> {
  return getEnv()
    .DB.prepare(
      `SELECT * FROM users
       WHERE role IN ('owner', 'admin') AND x_user_id IS NULL
       ORDER BY CASE WHEN id = 'usr_travis_seed' THEN 0 ELSE 1 END, created_at ASC
       LIMIT 1`,
    )
    .first<UserRow>();
}

function persistRole(role: Role | undefined): "user" | "admin" {
  switch (role) {
    case "owner":
    case "admin":
      return "admin";
    case "user":
    case undefined:
      return "user";
    default: {
      const _never: never = role;
      return _never;
    }
  }
}

export async function loginOrCreateFromX(profile: {
  x_user_id: string;
  display_name: string;
  x_handle: string;
}): Promise<UserRow> {
  const handle = normalizeXHandle(profile.x_handle);
  let user = await findUserByX(profile.x_user_id);
  if (!user && isOwnerXHandle(handle)) {
    user = await findUnclaimedOwnerSeat();
  }
  if (!user) {
    let username = handle.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
    if (!USERNAME_RE.test(username)) username = `x_${profile.x_user_id.slice(-8)}`;
    if (await findUserByUsername(username)) {
      username = `${username}_${profile.x_user_id.slice(-4)}`.slice(0, 24);
    }
    return createUser({
      display_name: profile.display_name,
      username,
      x_user_id: profile.x_user_id,
      x_handle: handle,
      role: isOwnerXHandle(handle) ? "owner" : "user",
    });
  }

  await getEnv()
    .DB.prepare("UPDATE users SET x_user_id = ?, x_handle = ? WHERE id = ?")
    .bind(profile.x_user_id, handle, user.id)
    .run();
  const updated = await findUserById(user.id);
  if (!updated) throw new Error("Failed to update X login");
  return updated;
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(raw: string): string | null {
  const u = normalizeUsername(raw);
  if (!USERNAME_RE.test(u)) return "Username must be 3–24 characters: a–z, 0–9, underscore.";
  return null;
}

export function validatePassword(raw: string): string | null {
  if (raw.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters.`;
  return null;
}

export async function createUser(input: {
  email?: string | null;
  username?: string | null;
  display_name: string;
  password?: string;
  x_user_id?: string | null;
  x_handle?: string | null;
  role?: Role;
}): Promise<UserRow> {
  const id = `usr_${randomToken(12)}`;
  const password_hash = input.password ? await hashPassword(input.password) : null;
  const created_at = isoNow();
  const email = input.email?.trim().toLowerCase() || null;
  const username = input.username ? normalizeUsername(input.username) : null;
  await getEnv()
    .DB.prepare(
      `INSERT INTO users (id, email, username, display_name, password_hash, x_user_id, x_handle, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      email,
      username,
      input.display_name.trim(),
      password_hash,
      input.x_user_id ?? null,
      input.x_handle ?? null,
      persistRole(input.role),
      created_at,
    )
    .run();
  const row = await findUserById(id);
  if (!row) throw new Error("Failed to create user");
  return row;
}

export async function createSession(userId: string, origin: string): Promise<string> {
  const token = randomToken(32);
  const id = await sha256b64url(token);
  const created_at = isoNow();
  const expires_at = new Date(Date.now() + SESSION_MS).toISOString();
  await getEnv()
    .DB.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(id, userId, expires_at, created_at)
    .run();
  return token;
}

export function sessionCookie(token: string, origin: string): string {
  const secure = origin.startsWith("https:");
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie(origin: string): string {
  const secure = origin.startsWith("https:");
  const parts = [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export async function userFromRequest(request: Request): Promise<PublicUser | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const id = await sha256b64url(token);
  const row = await getEnv()
    .DB.prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > ?`,
    )
    .bind(id, isoNow())
    .first<UserRow>();
  return row ? toPublicUser(row) : null;
}

export async function destroySession(request: Request): Promise<void> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return;
  const id = await sha256b64url(token);
  await getEnv().DB.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
}

export async function loginWithPassword(identifier: string, password: string): Promise<UserRow | null> {
  const user = await findUserByLogin(identifier);
  if (!user?.password_hash) return null;
  const ok = await verifyPassword(password, user.password_hash);
  return ok ? user : null;
}

export async function setPassword(userId: string, password: string): Promise<void> {
  const hash = await hashPassword(password);
  await getEnv().DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(hash, userId).run();
}

export async function createMagicLink(email: string): Promise<string> {
  const token = randomToken(32);
  const id = await sha256b64url(token);
  const created_at = isoNow();
  const expires_at = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  await getEnv()
    .DB.prepare("INSERT INTO magic_links (id, email, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(id, email.trim().toLowerCase(), expires_at, created_at)
    .run();
  return token;
}

export async function consumeMagicLink(token: string): Promise<string | null> {
  const id = await sha256b64url(token);
  const row = await getEnv()
    .DB.prepare("SELECT email, expires_at, consumed_at FROM magic_links WHERE id = ?")
    .bind(id)
    .first<{ email: string; expires_at: string; consumed_at: string | null }>();
  if (!row || row.consumed_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  await getEnv()
    .DB.prepare("UPDATE magic_links SET consumed_at = ? WHERE id = ?")
    .bind(isoNow(), id)
    .run();
  return row.email;
}

export async function rotateHouseToken(userId: string): Promise<string> {
  const token = `brh_${randomToken(24)}`;
  const hash = await sha256b64url(token);
  await getEnv().DB.prepare("UPDATE users SET house_token_hash = ? WHERE id = ?").bind(hash, userId).run();
  return token;
}

export async function userFromHouseToken(token: string): Promise<UserRow | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const hash = await sha256b64url(trimmed);
  const row = await getEnv()
    .DB.prepare("SELECT * FROM users WHERE house_token_hash = ?")
    .bind(hash)
    .first<UserRow>();
  return row ?? null;
}

export async function userFromAuth(request: Request): Promise<PublicUser | null> {
  const header = request.headers.get("authorization") || request.headers.get("x-house-token");
  if (header) {
    const token = header.replace(/^Bearer\s+/i, "").trim();
    const row = await userFromHouseToken(token);
    if (row) return toPublicUser(row);
  }
  return userFromRequest(request);
}

export function readCookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

export async function verifyHouseToken(user: UserRow, presented: string): Promise<boolean> {
  if (!user.house_token_hash) return false;
  const hash = await sha256b64url(presented);
  return timingSafeEqual(b64urlToBytes(hash), b64urlToBytes(user.house_token_hash));
}
