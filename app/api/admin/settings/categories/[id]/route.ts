import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

function title(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const { id } = await params; const categoryId = Number(id); const body = await request.json().catch(() => null); const value = title(body?.title);
  if (!Number.isInteger(categoryId) || !value) return NextResponse.json({ error: "Valid category details are required." }, { status: 400 });
  try { const result = await pool.query("UPDATE expense_categories SET title = $1, updated_at = NOW() WHERE id = $2 RETURNING id, title", [value, categoryId]); if (!result.rows[0]) return NextResponse.json({ error: "Category not found." }, { status: 404 }); return NextResponse.json({ category: { id: Number(result.rows[0].id), title: result.rows[0].title } }); }
  catch (error) { return databaseErrorResponse(error); }
}
