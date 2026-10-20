import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

export async function PATCH(request: Request) {
  const session = await requireAdminApiSession(); if (!session) return unauthorizedResponse();
  const body = await request.json().catch(() => null); const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : ""; const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  if (!currentPassword || newPassword.length < 8) return NextResponse.json({ error: "Enter your current password and a new password of at least 8 characters." }, { status: 400 });
  try { const result = await pool.query<{ password: string }>("SELECT password FROM users WHERE id = $1", [session.userId]); const user = result.rows[0]; if (!user || !await bcrypt.compare(currentPassword, user.password)) return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 }); const password = await bcrypt.hash(newPassword, 12); await pool.query("UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2", [password, session.userId]); return NextResponse.json({ ok: true }); }
  catch (error) { return databaseErrorResponse(error); }
}
