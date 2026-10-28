import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { FIELD_SESSION_COOKIE, verifyFieldSession } from "@/lib/field-auth";
import { pakistanDate } from "@/lib/pakistan-time";

const date = (value: string | null) => /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? value! : pakistanDate();

export async function GET(request: Request) {
  const session = verifyFieldSession((await cookies()).get(FIELD_SESSION_COOKIE)?.value);
  if (!session || session.role !== "driver" || !session.employeeId) return NextResponse.json({ error: "Driver access is required." }, { status: 401 });

  try {
    const deliveryDate = date(new URL(request.url).searchParams.get("date"));
    const result = await pool.query(`WITH visible_task_updates AS (
      SELECT updated_at FROM deliveries
      WHERE assigned_driver_id=$1 AND delivery_date=$2 AND published_at IS NOT NULL
      UNION ALL
      SELECT p.updated_at FROM plant_filling_plans p
      JOIN plant_daily_entries d ON d.id=p.plant_daily_entry_id
      WHERE p.assigned_driver_id=$1 AND d.entry_date=$2 AND p.published_at IS NOT NULL
    ) SELECT COUNT(*)::int AS count, COALESCE(MAX(updated_at)::text, '') AS latest FROM visible_task_updates`, [Number(session.employeeId), deliveryDate]);
    const row = result.rows[0];
    return NextResponse.json({ revision: `${row.count}:${row.latest}` });
  } catch {
    return NextResponse.json({ error: "Unable to check for plan updates." }, { status: 500 });
  }
}
