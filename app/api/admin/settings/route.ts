import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

export async function GET() {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  try {
    const [categories, subcategories, fuelRates] = await Promise.all([
      pool.query("SELECT id, title FROM expense_categories ORDER BY title"),
      pool.query("SELECT id, expense_category_id, title FROM expense_subcategories ORDER BY title"),
      pool.query("SELECT id, rate_date, fuel_type, rate_per_litre FROM fuel_rates ORDER BY rate_date DESC, fuel_type"),
    ]);
    return NextResponse.json({
      categories: categories.rows.map((row) => ({ id: Number(row.id), title: row.title })),
      subcategories: subcategories.rows.map((row) => ({ id: Number(row.id), categoryId: Number(row.expense_category_id), title: row.title })),
      fuelRates: fuelRates.rows.map((row) => ({ id: Number(row.id), date: row.rate_date instanceof Date ? row.rate_date.toISOString().slice(0, 10) : String(row.rate_date).slice(0, 10), type: row.fuel_type, rate: Number(row.rate_per_litre).toFixed(2) })),
    });
  } catch (error) { return databaseErrorResponse(error); }
}
