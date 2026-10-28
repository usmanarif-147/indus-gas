import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";
import { pakistanDate } from "@/lib/pakistan-time";

const date = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
const time = (value: unknown) => typeof value === "string" && /^\d{2}:\d{2}$/.test(value) ? value : null;
const count = (value: unknown) => Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : -1;
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

export async function GET(request: Request) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const entryDate = date(new URL(request.url).searchParams.get("date"));
  if (!entryDate) return NextResponse.json({ error: "Choose a valid date." }, { status: 400 });
  try {
    const result = await pool.query(`SELECT p.id::int, p.assigned_driver_id::int AS "assignedDriverId", p.commercial_cylinder_count::int AS "commercialCount", p.domestic_cylinder_count::int AS "domesticCount", p.new_domestic_cylinder_count::int AS "newDomesticCount", COALESCE(p.new_domestic_cylinder_unit_cost,0)::float AS "newDomesticUnitCost", p.task_sequence::int AS "taskSequence", p.planned_time::text AS "plannedTime", p.filling_status::int AS status, p.notes, p.created_at AS "createdAt", e.full_name AS "driverName" FROM plant_filling_plans p LEFT JOIN employees e ON e.id=p.assigned_driver_id JOIN plant_daily_entries d ON d.id=p.plant_daily_entry_id WHERE d.entry_date=$1 ORDER BY p.task_sequence NULLS LAST,p.created_at`, [entryDate]);
    return NextResponse.json({ plans: result.rows });
  } catch (error) { return databaseErrorResponse(error); }
}

export async function POST(request: Request) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const body = await request.json().catch(() => null);
  const entryDate = date(body?.date), driverId = Number(body?.driverId), commercial = count(body?.commercialCount), domestic = count(body?.domesticCount), newDomesticCount = count(body?.newDomesticCount ?? 0), newDomesticUnitCost = Number(body?.newDomesticUnitCost || 0), plannedTime = time(body?.plannedTime), notes = text(body?.notes) || null;
  if (!entryDate || !Number.isInteger(driverId) || commercial < 0 || domestic < 0 || commercial + domestic < 1 || newDomesticCount < 0 || (newDomesticCount > 0 && (!Number.isFinite(newDomesticUnitCost) || newDomesticUnitCost <= 0))) return NextResponse.json({ error: "Select a driver and enter valid filling details." }, { status: 400 });
  if (entryDate < pakistanDate()) return NextResponse.json({ error: "A filling plan cannot be created for a past date." }, { status: 400 });
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const driver = await client.query("SELECT id FROM employees WHERE id=$1 AND role='driver' AND status=1", [driverId]);
      if (!driver.rows[0]) { await client.query("ROLLBACK"); return NextResponse.json({ error: "Choose an active driver." }, { status: 400 }); }
      const daily = await client.query(`INSERT INTO plant_daily_entries (entry_date, domestic_lpg_rate) VALUES ($1, NULL) ON CONFLICT (entry_date) DO UPDATE SET updated_at=NOW() RETURNING id`, [entryDate]);
      const created = await client.query(`INSERT INTO plant_filling_plans (plant_daily_entry_id,assigned_driver_id,commercial_cylinder_count,domestic_cylinder_count,new_domestic_cylinder_count,new_domestic_cylinder_unit_cost,planned_time,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, [daily.rows[0].id, driverId, commercial, domestic, newDomesticCount, newDomesticCount ? newDomesticUnitCost : null, plannedTime, notes]);
      await client.query("COMMIT");
      return NextResponse.json({ id: created.rows[0].id }, { status: 201 });
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  } catch (error) { return databaseErrorResponse(error); }
}
