import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

function date(value: unknown) { const text = typeof value === "string" ? value : ""; return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : ""; }
function payload(body: any) { const rateDate = date(body?.date); const fuelType = body?.type === "Petrol" || body?.type === "High-speed diesel" ? body.type : ""; const rate = Number(body?.rate); return rateDate && fuelType && Number.isFinite(rate) && rate > 0 ? { rateDate, fuelType, rate } : null; }
function output(row: Record<string, unknown>) { return { id: Number(row.id), date: row.rate_date instanceof Date ? row.rate_date.toISOString().slice(0, 10) : String(row.rate_date).slice(0, 10), type: row.fuel_type, rate: Number(row.rate_per_litre).toFixed(2) }; }
export async function POST(request: Request) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const body = await request.json().catch(() => null); const value = payload(body); if (!value) return NextResponse.json({ error: "Enter a valid date, fuel type, and rate." }, { status: 400 });
  try { const result = await pool.query("INSERT INTO fuel_rates (rate_date, fuel_type, rate_per_litre) VALUES ($1, $2, $3) RETURNING *", [value.rateDate, value.fuelType, value.rate]); return NextResponse.json({ fuelRate: output(result.rows[0]) }, { status: 201 }); }
  catch (error) { return databaseErrorResponse(error); }
}
