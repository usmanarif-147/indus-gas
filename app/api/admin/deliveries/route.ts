import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const date = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(text(value)) ? text(value) : "";
const time = (value: unknown) => /^\d{2}:\d{2}$/.test(text(value)) ? text(value) : null;
const quantity = (value: unknown) => Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : -1;

export async function GET(request: Request) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const deliveryDate = date(new URL(request.url).searchParams.get("date"));
  if (!deliveryDate) return NextResponse.json({ error: "Choose a valid date." }, { status: 400 });
  try {
    const result = await pool.query(`SELECT d.id::int, d.delivery_no AS "deliveryNo", d.branch_id::int AS "branchId", d.assigned_driver_id::int AS "assignedDriverId", d.delivery_date::text AS "deliveryDate", d.requested_commercial_cylinders::int AS "commercialCylinders", d.requested_domestic_cylinders::int AS "domesticCylinders", d.route_sequence::int AS "routeSequence", to_char(d.delivery_time, 'HH24:MI') AS "deliveryTime", d.status, d.created_at AS "createdAt", b.branch_name AS "branchName", c.client_name AS "clientName", e.full_name AS "driverName", COALESCE(json_agg(json_build_object('id', i.id, 'type', i.instruction_type, 'cashAmount', i.cash_amount, 'note', i.note) ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]') AS instructions FROM deliveries d JOIN branches b ON b.id=d.branch_id JOIN clients c ON c.id=b.client_id LEFT JOIN employees e ON e.id=d.assigned_driver_id LEFT JOIN delivery_instructions i ON i.delivery_id=d.id WHERE d.delivery_date=$1 GROUP BY d.id,b.branch_name,c.client_name,e.full_name ORDER BY d.route_sequence NULLS LAST,d.delivery_time NULLS LAST,d.id`, [deliveryDate]);
    return NextResponse.json({ deliveries: result.rows });
  } catch (error) { return databaseErrorResponse(error); }
}

export async function POST(request: Request) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const body = await request.json().catch(() => null);
  const deliveryDate = date(body?.deliveryDate);
  const branchId = Number(body?.branchId);
  const assignedDriverId = Number(body?.assignedDriverId);
  const commercial = quantity(body?.commercialCylinders);
  const domestic = quantity(body?.domesticCylinders);
  const routeSequence = body?.routeSequence === "" || body?.routeSequence === null ? null : quantity(body?.routeSequence);
  const deliveryTime = time(body?.deliveryTime);
  const instructions = Array.isArray(body?.instructions) ? body.instructions : [];
  if (!deliveryDate || !Number.isInteger(branchId) || !Number.isInteger(assignedDriverId) || commercial < 0 || domestic < 0 || commercial + domestic === 0 || routeSequence === -1) return NextResponse.json({ error: "Complete the required delivery details." }, { status: 400 });
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const driver = await client.query("SELECT id FROM employees WHERE id=$1 AND role='driver' AND status=1", [assignedDriverId]);
      const branch = await client.query("SELECT b.id FROM branches b JOIN clients c ON c.id=b.client_id WHERE b.id=$1 AND b.is_active=1 AND c.is_active=1", [branchId]);
      if (!driver.rows[0] || !branch.rows[0]) { await client.query("ROLLBACK"); return NextResponse.json({ error: "Choose an active driver and branch." }, { status: 400 }); }
      const number = `DLV-${deliveryDate.replaceAll("-", "")}-${String(Date.now()).slice(-6)}`;
      const created = await client.query(`INSERT INTO deliveries (delivery_no,branch_id,assigned_driver_id,delivery_date,requested_commercial_cylinders,requested_domestic_cylinders,route_sequence,delivery_time) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, [number, branchId, assignedDriverId, deliveryDate, commercial, domestic, routeSequence, deliveryTime]);
      for (const item of instructions) {
        const type = text(item?.type);
        const cashAmount = type === "collect_cash" && Number(item?.cashAmount) > 0 ? Number(item.cashAmount) : null;
        const note = text(item?.note) || null;
        if (["cylinder_inspection", "collect_cash", "call_after_delivery", "cash_before_unloading", "other_note"].includes(type) && (type !== "collect_cash" || cashAmount)) await client.query("INSERT INTO delivery_instructions (delivery_id,instruction_type,cash_amount,note) VALUES ($1,$2,$3,$4)", [created.rows[0].id, type, cashAmount, note]);
      }
      await client.query("COMMIT");
      return NextResponse.json({ id: created.rows[0].id }, { status: 201 });
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  } catch (error) { return databaseErrorResponse(error); }
}
