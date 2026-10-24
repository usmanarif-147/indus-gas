import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

const selectEntries = `
  SELECT d.id, d.entry_date, d.domestic_lpg_rate,
    COALESCE(SUM(p.commercial_cylinder_count), 0) AS commercial_filled_count,
    COALESCE(SUM(p.domestic_cylinder_count), 0) AS domestic_filled_count,
    (COALESCE(SUM(p.new_domestic_cylinder_count), 0) > 0) AS domestic_cylinder_bought,
    COALESCE(SUM(p.new_domestic_cylinder_count), 0) AS domestic_cylinder_purchase_count,
    COALESCE(MAX(p.new_domestic_cylinder_unit_cost), 0) AS domestic_cylinder_unit_cost,
    d.commercial_filling_charge_rate, d.domestic_filling_charge_rate,
    d.lpg_payment_status, d.filling_payment_status, d.created_at, d.updated_at
  FROM plant_daily_entries d
  LEFT JOIN plant_filling_plans p ON p.plant_daily_entry_id=d.id AND p.filling_status <> 2
  GROUP BY d.id`;

function date(value: unknown) {
  const text = typeof value === "string" ? value : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}
function amount(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}
function count(value: unknown) {
  const number = amount(value);
  return number !== null && Number.isInteger(number) ? number : null;
}
function payload(body: any) {
  const entryDate = date(body?.date);
  const domesticRate = amount(body?.domesticRate);
  if (!entryDate || domesticRate === null || domesticRate <= 0) return null;
  const paid = body?.paid === true ? 1 : 0;
  return { entryDate, domesticRate, paid };
}
function entry(row: Record<string, unknown>) {
  return {
    id: Number(row.id), date: row.entry_date instanceof Date ? row.entry_date.toISOString().slice(0, 10) : String(row.entry_date).slice(0, 10),
    domesticRate: Number(row.domestic_lpg_rate), commercialCount: Number(row.commercial_filled_count), domesticCount: Number(row.domestic_filled_count),
    domesticCylinderBought: row.domestic_cylinder_bought === true, domesticCylinderPurchaseCount: Number(row.domestic_cylinder_purchase_count), domesticCylinderUnitCost: Number(row.domestic_cylinder_unit_cost),
    paid: Number(row.lpg_payment_status) === 1 && Number(row.filling_payment_status) === 1,
  };
}
function entryDatabaseError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code === "23505") return NextResponse.json({ error: "A daily entry already exists for this date. Please use Edit to update it." }, { status: 409 });
  return databaseErrorResponse(error);
}

export async function GET() {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  try {
    const result = await pool.query(`${selectEntries} ORDER BY entry_date DESC`);
    return NextResponse.json({ entries: result.rows.map(entry) });
  } catch (error) { return entryDatabaseError(error); }
}

export async function POST(request: Request) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const body = await request.json().catch(() => null); const value = payload(body);
  if (!value) return NextResponse.json({ error: "Please enter a valid date, LPG rate, and cylinder quantities." }, { status: 400 });
  try {
    const result = await pool.query(`INSERT INTO plant_daily_entries (entry_date, domestic_lpg_rate, lpg_payment_status, filling_payment_status) VALUES ($1, $2, $3, $3) RETURNING *`, [value.entryDate, value.domesticRate, value.paid]);
    const created = await pool.query(`${selectEntries} HAVING d.id=$1`, [result.rows[0].id]);
    return NextResponse.json({ entry: entry(created.rows[0]) }, { status: 201 });
  } catch (error) { return entryDatabaseError(error); }
}
