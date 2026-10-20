import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

function title(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const { id } = await params; const subcategoryId = Number(id); const body = await request.json().catch(() => null); const categoryId = Number(body?.categoryId); const value = title(body?.title);
  if (!Number.isInteger(subcategoryId) || !Number.isInteger(categoryId) || !value) return NextResponse.json({ error: "Valid subcategory details are required." }, { status: 400 });
  try { const result = await pool.query("UPDATE expense_subcategories SET expense_category_id = $1, title = $2, updated_at = NOW() WHERE id = $3 RETURNING id, expense_category_id, title", [categoryId, value, subcategoryId]); if (!result.rows[0]) return NextResponse.json({ error: "Subcategory not found." }, { status: 404 }); const row = result.rows[0]; return NextResponse.json({ subcategory: { id: Number(row.id), categoryId: Number(row.expense_category_id), title: row.title } }); }
  catch (error) { return databaseErrorResponse(error); }
}
