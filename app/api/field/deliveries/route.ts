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
    const [deliveries, fillings] = await Promise.all([
      pool.query(`SELECT d.id::int, d.delivery_no AS "deliveryNo", d.delivery_count::int AS "deliveryCount", d.delivery_date::text AS "deliveryDate", d.requested_commercial_cylinders::int AS "requestedCommercialCylinders", d.requested_domestic_cylinders::int AS "requestedDomesticCylinders", d.commercial_cylinder_count::int AS "commercialCylinderCount", d.commercial_cylinder_collected::int AS "commercialCylinderCollected", d.commercial_cylinder_closing::int AS "commercialCylinderClosing", d.domestic_cylinder_count::int AS "domesticCylinderCount", d.domestic_cylinder_collected::int AS "domesticCylinderCollected", d.domestic_cylinder_closing::int AS "domesticCylinderClosing", d.receiver_details AS "receiverDetails", d.status, d.route_sequence::int AS "routeSequence", to_char(d.delivery_time, 'HH24:MI') AS "deliveryTime", c.client_name AS "clientName", b.branch_name AS "branchName", b.area, b.address, b.contact_person AS "contacts" FROM deliveries d JOIN clients c ON c.id=d.client_id JOIN branches b ON b.id=d.branch_id WHERE d.assigned_driver_id=$1 AND d.delivery_date=$2 ORDER BY d.route_sequence NULLS LAST,d.delivery_time NULLS LAST,d.id`, [Number(session.employeeId), deliveryDate]),
      pool.query(`SELECT p.id::int, p.commercial_cylinder_count::int AS "commercialCount", p.domestic_cylinder_count::int AS "domesticCount", p.task_sequence::int AS "taskSequence", to_char(p.planned_time, 'HH24:MI') AS "plannedTime", p.filling_status::int AS status, p.notes FROM plant_filling_plans p JOIN plant_daily_entries d ON d.id=p.plant_daily_entry_id WHERE p.assigned_driver_id=$1 AND d.entry_date=$2 ORDER BY p.task_sequence NULLS LAST,p.planned_time NULLS LAST,p.id`, [Number(session.employeeId), deliveryDate]),
    ]);
    return NextResponse.json({ deliveries: deliveries.rows, fillings: fillings.rows });
  } catch {
    return NextResponse.json({ error: "Unable to load today’s plan." }, { status: 500 });
  }
}
