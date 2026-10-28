import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { FIELD_SESSION_COOKIE, verifyFieldSession } from "@/lib/field-auth";

const count = (value: unknown) => Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : -1;
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

async function driver() {
  const session = verifyFieldSession((await cookies()).get(FIELD_SESSION_COOKIE)?.value);
  return session?.role === "driver" && session.employeeId ? session : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await driver();
  const id = Number((await params).id);
  if (!session || !Number.isInteger(id)) return NextResponse.json({ error: "Delivery not found." }, { status: 404 });
  try {
    const result = await pool.query(`SELECT d.id::int, d.delivery_no AS "deliveryNo", d.delivery_count::int AS "deliveryCount", d.delivery_date::text AS "deliveryDate", d.requested_commercial_cylinders::int AS "requestedCommercialCylinders", d.requested_domestic_cylinders::int AS "requestedDomesticCylinders", d.commercial_cylinder_count::int AS "commercialCylinderCount", d.commercial_cylinder_collected::int AS "commercialCylinderCollected", d.commercial_cylinder_closing::int AS "commercialCylinderClosing", d.domestic_cylinder_count::int AS "domesticCylinderCount", d.domestic_cylinder_collected::int AS "domesticCylinderCollected", d.domestic_cylinder_closing::int AS "domesticCylinderClosing", COALESCE((SELECT previous.commercial_cylinder_closing FROM deliveries previous WHERE previous.branch_id=d.branch_id AND previous.status=1 AND previous.delivery_count<d.delivery_count ORDER BY previous.delivery_count DESC LIMIT 1),0)::int AS "previousCommercialClosing", COALESCE((SELECT previous.domestic_cylinder_closing FROM deliveries previous WHERE previous.branch_id=d.branch_id AND previous.status=1 AND previous.delivery_count<d.delivery_count ORDER BY previous.delivery_count DESC LIMIT 1),0)::int AS "previousDomesticClosing", d.receiver_details AS "receiverDetails", d.status, c.client_name AS "clientName", b.branch_name AS "branchName", b.area, b.address, b.contact_person AS contacts FROM deliveries d JOIN clients c ON c.id=d.client_id JOIN branches b ON b.id=d.branch_id WHERE d.id=$1 AND d.assigned_driver_id=$2 AND d.published_at IS NOT NULL`, [id, Number(session.employeeId)]);
    if (!result.rows[0]) return NextResponse.json({ error: "Delivery not found." }, { status: 404 });
    return NextResponse.json({ delivery: result.rows[0] });
  } catch { return NextResponse.json({ error: "Unable to load delivery." }, { status: 500 }); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await driver();
  const id = Number((await params).id);
  const body = await request.json().catch(() => null);
  const commercialDelivered = count(body?.commercialCylinderCount);
  const commercialCollected = count(body?.commercialCylinderCollected);
  const domesticDelivered = count(body?.domesticCylinderCount);
  const domesticCollected = count(body?.domesticCylinderCollected);
  const receiver = { name: text(body?.receiver?.name), phone_number: text(body?.receiver?.phoneNumber), cnic_number: text(body?.receiver?.cnicNumber) };
  if (!session || !Number.isInteger(id) || [commercialDelivered, commercialCollected, domesticDelivered, domesticCollected].some((value) => value < 0)) return NextResponse.json({ error: "Enter valid delivery quantities." }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const delivery = await client.query("SELECT id,branch_id,delivery_count FROM deliveries WHERE id=$1 AND assigned_driver_id=$2 AND status=0 AND published_at IS NOT NULL FOR UPDATE", [id, Number(session.employeeId)]);
    if (!delivery.rows[0]) { await client.query("ROLLBACK"); return NextResponse.json({ error: "Only your pending delivery can be completed." }, { status: 400 }); }
    const branchId = Number(delivery.rows[0].branch_id);
    await client.query("SELECT pg_advisory_xact_lock($1)", [branchId]);
    const earlierPending = await client.query("SELECT id FROM deliveries WHERE branch_id=$1 AND delivery_count<$2 AND status=0 LIMIT 1", [branchId, Number(delivery.rows[0].delivery_count)]);
    if (earlierPending.rows[0]) { await client.query("ROLLBACK"); return NextResponse.json({ error: "Complete the earlier delivery for this branch first." }, { status: 400 }); }
    const previous = await client.query(`SELECT commercial_cylinder_closing,domestic_cylinder_closing FROM deliveries WHERE branch_id=$1 AND status=1 AND delivery_count<$2 ORDER BY delivery_count DESC LIMIT 1`, [branchId, Number(delivery.rows[0].delivery_count)]);
    const commercialPrevious = Number(previous.rows[0]?.commercial_cylinder_closing || 0);
    const domesticPrevious = Number(previous.rows[0]?.domestic_cylinder_closing || 0);
    const commercialClosing = commercialPrevious + commercialDelivered - commercialCollected;
    const domesticClosing = domesticPrevious + domesticDelivered - domesticCollected;
    if (commercialClosing < 0 || domesticClosing < 0) { await client.query("ROLLBACK"); return NextResponse.json({ error: "Collected empty cylinders cannot exceed the branch closing balance." }, { status: 400 }); }
    await client.query(`UPDATE deliveries SET commercial_cylinder_count=$1,commercial_cylinder_collected=$2,commercial_cylinder_closing=$3,domestic_cylinder_count=$4,domestic_cylinder_collected=$5,domestic_cylinder_closing=$6,receiver_details=$7,status=1,updated_at=NOW() WHERE id=$8`, [commercialDelivered, commercialCollected, commercialClosing, domesticDelivered, domesticCollected, domesticClosing, receiver.name || receiver.phone_number || receiver.cnic_number ? JSON.stringify(receiver) : null, id]);
    await client.query("COMMIT");
    return NextResponse.json({ ok: true, commercialClosing, domesticClosing });
  } catch {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "Unable to complete delivery." }, { status: 500 });
  } finally { client.release(); }
}
