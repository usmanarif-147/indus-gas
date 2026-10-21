import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, adminSessionMaxAge, createAdminSession } from "@/lib/admin-auth";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password) return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });

  const result = await pool.query<{ id: string; username: string; password: string }>("SELECT id, username, password FROM users WHERE username = $1 AND account_type = 'admin' AND is_active = 1 LIMIT 1", [username]);
  const user = result.rows[0];
  const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;
  if (!user || !passwordMatches) return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSession(user.id, user.username), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: adminSessionMaxAge, path: "/" });
  return response;
}
