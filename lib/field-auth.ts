import { createHmac, timingSafeEqual } from "crypto";

export const FIELD_SESSION_COOKIE = "indus_gas_field_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;
export type FieldRole = "admin" | "sales_manager" | "driver";
export type FieldSession = { userId: string; employeeId?: string; name: string; role: FieldRole; expiresAt: number };

function secret() { return process.env.ADMIN_SESSION_SECRET || "indus-gas-local-development-session-secret"; }
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }

export function createFieldSession(userId: string, name: string, role: FieldRole, employeeId?: string) {
  const encoded = Buffer.from(JSON.stringify({ userId, employeeId, name, role, expiresAt: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS } satisfies FieldSession)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyFieldSession(token: string | undefined): FieldSession | null {
  if (!token) return null; const [encoded, provided] = token.split("."); if (!encoded || !provided) return null;
  const expected = sign(encoded); if (Buffer.byteLength(provided) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return null;
  try { const session = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as FieldSession; if (!session.userId || !session.name || !["admin", "sales_manager", "driver"].includes(session.role) || session.expiresAt <= Math.floor(Date.now() / 1000)) return null; return session; } catch { return null; }
}

export const fieldSessionMaxAge = SESSION_DURATION_SECONDS;
