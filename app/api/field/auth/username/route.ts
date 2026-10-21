import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  if (!username) return NextResponse.json({ error: "Enter your username." }, { status: 400 });

  const result = await pool.query(
    `SELECT u.id
     FROM users u
     JOIN employees e ON e.user_id = u.id
     WHERE u.username = $1
       AND u.account_type = 'employee'
       AND u.is_active = 1
       AND e.status = 1
       AND e.is_authenticated = 1
       AND e.role IN ('sales_manager', 'driver')
     LIMIT 1`,
    [username],
  );

  if (!result.rows[0]) return NextResponse.json({ error: "Username not found or Employee App access is disabled." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
