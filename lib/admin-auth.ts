import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_SESSION_COOKIE = "indus_gas_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

export type AdminSession = { userId: string; username: string; expiresAt: number };

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || "indus-gas-local-development-session-secret";
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function createAdminSession(userId: string, username: string) {
  const payload: AdminSession = { userId, username, expiresAt: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS };
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyAdminSession(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) return null;
  const expectedSignature = sign(encodedPayload);
  if (Buffer.byteLength(providedSignature) !== Buffer.byteLength(expectedSignature) || !timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))) return null;
  try {
    const session = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as AdminSession;
    if (!session.userId || !session.username || session.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export const adminSessionMaxAge = SESSION_DURATION_SECONDS;
