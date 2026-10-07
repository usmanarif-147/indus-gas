import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

const roles = ["driver", "helper", "salesman"] as const;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !roles.includes(body.role) || typeof body.action !== "string" || body.action.length > 100) return NextResponse.json({ error: "Invalid activity" }, { status: 400 });
  await pool.query("INSERT INTO activity_log (role, action) VALUES ($1, $2)", [body.role, body.action]);
  return NextResponse.json({ ok: true }, { status: 201 });
}
