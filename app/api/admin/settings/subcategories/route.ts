import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

function title(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
export async function POST(request: Request) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const body = await request.json().catch(() => null); const categoryId = Number(body?.categoryId); const value = title(body?.title);
  if (!Number.isInteger(categoryId) || !value) return NextResponse.json({ error: "Category and subcategory name are required." }, { status: 400 });
  try { const result = await pool.query("INSERT INTO expense_subcategories (expense_category_id, title) VALUES ($1, $2) RETURNING id, expense_category_id, title", [categoryId, value]); const row = result.rows[0]; return NextResponse.json({ subcategory: { id: Number(row.id), categoryId: Number(row.expense_category_id), title: row.title } }, { status: 201 }); }
  catch (error) { return databaseErrorResponse(error); }
}
