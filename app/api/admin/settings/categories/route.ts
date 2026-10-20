import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

function title(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
export async function POST(request: Request) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const body = await request.json().catch(() => null); const value = title(body?.title);
  if (!value) return NextResponse.json({ error: "Category name is required." }, { status: 400 });
  try { const result = await pool.query("INSERT INTO expense_categories (title) VALUES ($1) RETURNING id, title", [value]); return NextResponse.json({ category: { id: Number(result.rows[0].id), title: result.rows[0].title } }, { status: 201 }); }
  catch (error) { return databaseErrorResponse(error); }
}
