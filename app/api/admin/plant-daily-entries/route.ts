import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

const selectEntries = `
  SELECT id, entry_date, domestic_lpg_rate, commercial_filled_count, domestic_filled_count,
    domestic_cylinder_bought, domestic_cylinder_purchase_count, domestic_cylinder_unit_cost,
    commercial_filling_charge_rate, domestic_filling_charge_rate,
    lpg_payment_status, filling_payment_status, created_at, updated_at
  FROM plant_daily_entries`;

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
  const commercialCount = count(body?.commercialCount);
  const domesticCount = count(body?.domesticCount);
  const domesticCylinderBought = body?.domesticCylinderBought === true;
  const domesticCylinderPurchaseCount = domesticCylinderBought ? count(body?.domesticCylinderPurchaseCount) : 0;
  const domesticCylinderUnitCost = domesticCylinderBought ? amount(body?.domesticCylinderUnitCost) : 0;
  if (!entryDate || domesticRate === null || domesticRate <= 0 || commercialCount === null || domesticCount === null || domesticCylinderPurchaseCount === null || domesticCylinderUnitCost === null || (domesticCylinderBought && (domesticCylinderPurchaseCount <= 0 || domesticCylinderUnitCost <= 0))) return null;
  const paid = body?.paid === true ? 1 : 0;
  return { entryDate, domesticRate, commercialCount, domesticCount, domesticCylinderBought, domesticCylinderPurchaseCount, domesticCylinderUnitCost, paid };
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
    const result = await pool.query(`INSERT INTO plant_daily_entries (entry_date, domestic_lpg_rate, commercial_filled_count, domestic_filled_count, domestic_cylinder_bought, domestic_cylinder_purchase_count, domestic_cylinder_unit_cost, lpg_payment_status, filling_payment_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8) RETURNING *`, [value.entryDate, value.domesticRate, value.commercialCount, value.domesticCount, value.domesticCylinderBought, value.domesticCylinderPurchaseCount, value.domesticCylinderUnitCost, value.paid]);
    return NextResponse.json({ entry: entry(result.rows[0]) }, { status: 201 });
  } catch (error) { return entryDatabaseError(error); }
}
