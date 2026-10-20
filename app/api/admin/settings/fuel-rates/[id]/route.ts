import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

function date(value: unknown) { const text = typeof value === "string" ? value : ""; return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : ""; }
function payload(body: any) { const rateDate = date(body?.date); const fuelType = body?.type === "Petrol" || body?.type === "High-speed diesel" ? body.type : ""; const rate = Number(body?.rate); return rateDate && fuelType && Number.isFinite(rate) && rate > 0 ? { rateDate, fuelType, rate } : null; }
function output(row: Record<string, unknown>) { return { id: Number(row.id), date: row.rate_date instanceof Date ? row.rate_date.toISOString().slice(0, 10) : String(row.rate_date).slice(0, 10), type: row.fuel_type, rate: Number(row.rate_per_litre).toFixed(2) }; }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const { id } = await params; const fuelRateId = Number(id); const body = await request.json().catch(() => null); const value = payload(body); if (!Number.isInteger(fuelRateId) || !value) return NextResponse.json({ error: "Enter a valid date, fuel type, and rate." }, { status: 400 });
  try { const result = await pool.query("UPDATE fuel_rates SET rate_date = $1, fuel_type = $2, rate_per_litre = $3, updated_at = NOW() WHERE id = $4 RETURNING *", [value.rateDate, value.fuelType, value.rate, fuelRateId]); if (!result.rows[0]) return NextResponse.json({ error: "Fuel rate not found." }, { status: 404 }); return NextResponse.json({ fuelRate: output(result.rows[0]) }); }
  catch (error) { return databaseErrorResponse(error); }
}
