import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { FIELD_SESSION_COOKIE, FieldRole, createFieldSession, fieldSessionMaxAge } from "@/lib/field-auth";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null); const username = typeof body?.username === "string" ? body.username.trim() : ""; const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password) return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });
  const result = await pool.query<{ id: string; username: string; password: string; account_type: string; full_name: string | null; employee_id: string | null; employee_role: string | null; employee_status: number | null }>(`SELECT u.id, u.username, u.password, u.account_type, e.id AS employee_id, e.full_name, e.role AS employee_role, e.status AS employee_status FROM users u LEFT JOIN employees e ON e.user_id = u.id WHERE u.username = $1 AND u.is_active = 1 LIMIT 1`, [username]);
  const user = result.rows[0]; if (!user || !await bcrypt.compare(password, user.password)) return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  let role: FieldRole; let name: string; let employeeId: string | undefined;
  if (user.account_type === "admin") { role = "admin"; name = user.username; }
  else if (user.account_type === "employee" && user.employee_status === 1 && (user.employee_role === "sales_manager" || user.employee_role === "driver")) { role = user.employee_role; name = user.full_name || user.username; employeeId = user.employee_id || undefined; }
  else return NextResponse.json({ error: "This account does not have Employee App access." }, { status: 403 });
  const response = NextResponse.json({ user: { name, role } }); response.cookies.set(FIELD_SESSION_COOKIE, createFieldSession(user.id, name, role, employeeId), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: fieldSessionMaxAge, path: "/" }); return response;
}
