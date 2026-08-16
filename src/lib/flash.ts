import { FLASH_COOKIE } from "./site";

export function flashCookie(message: string, origin: string): string {
  const secure = origin.startsWith("https:");
  const value = encodeURIComponent(message).slice(0, 800);
  const parts = [`${FLASH_COOKIE}=${value}`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=120"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearFlashCookie(origin: string): string {
  const secure = origin.startsWith("https:");
  const parts = [`${FLASH_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function readFlash(request: Request): string | null {
  const raw = request.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === FLASH_COOKIE) {
      try {
        return decodeURIComponent(rest.join("="));
      } catch {
        return rest.join("=");
      }
    }
  }
  return null;
}
