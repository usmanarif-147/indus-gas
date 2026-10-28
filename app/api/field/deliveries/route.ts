import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { FIELD_SESSION_COOKIE, verifyFieldSession } from "@/lib/field-auth";

const date = (value: string | null) => /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? value! : new Date().toISOString().slice(0, 10);

export async function GET(request: Request) {
  const session = verifyFieldSession((await cookies()).get(FIELD_SESSION_COOKIE)?.value);
  if (!session || session.role !== "driver" || !session.employeeId) return NextResponse.json({ error: "Driver access is required." }, { status: 401 });

  try {
    const deliveryDate = date(new URL(request.url).searchParams.get("date"));
    const result = await pool.query(`SELECT d.id::int, d.delivery_no AS "deliveryNo", d.delivery_count::int AS "deliveryCount", d.delivery_date::text AS "deliveryDate", d.requested_commercial_cylinders::int AS "requestedCommercialCylinders", d.requested_domestic_cylinders::int AS "requestedDomesticCylinders", d.commercial_cylinder_count::int AS "commercialCylinderCount", d.commercial_cylinder_collected::int AS "commercialCylinderCollected", d.commercial_cylinder_closing::int AS "commercialCylinderClosing", d.domestic_cylinder_count::int AS "domesticCylinderCount", d.domestic_cylinder_collected::int AS "domesticCylinderCollected", d.domestic_cylinder_closing::int AS "domesticCylinderClosing", d.receiver_details AS "receiverDetails", d.status, d.route_sequence::int AS "routeSequence", to_char(d.delivery_time, 'HH24:MI') AS "deliveryTime", c.client_name AS "clientName", b.branch_name AS "branchName", b.area, b.address, b.contact_person AS "contacts" FROM deliveries d JOIN clients c ON c.id=d.client_id JOIN branches b ON b.id=d.branch_id WHERE d.assigned_driver_id=$1 AND d.delivery_date=$2 ORDER BY d.route_sequence NULLS LAST,d.delivery_time NULLS LAST,d.id`, [Number(session.employeeId), deliveryDate]);
    return NextResponse.json({ deliveries: result.rows });
  } catch {
    return NextResponse.json({ error: "Unable to load deliveries." }, { status: 500 });
  }
}
