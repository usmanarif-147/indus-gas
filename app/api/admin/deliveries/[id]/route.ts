import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

const quantity = (value: unknown) => Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : -1;
const time = (value: unknown) => typeof value === "string" && /^\d{2}:\d{2}$/.test(value) ? value : null;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const id = Number((await params).id); const body = await request.json().catch(() => null);
  const branchId = Number(body?.branchId); const driverId = Number(body?.assignedDriverId); const commercial = quantity(body?.commercialCylinders); const domestic = quantity(body?.domesticCylinders); const deliveryTime = time(body?.deliveryTime);
  if (!Number.isInteger(id) || !Number.isInteger(branchId) || !Number.isInteger(driverId) || commercial < 0 || domestic < 0 || commercial + domestic < 1) return NextResponse.json({ error: "Complete valid delivery details." }, { status: 400 });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const current = await client.query("SELECT branch_id,delivery_count FROM deliveries WHERE id=$1 AND status=0 FOR UPDATE", [id]);
    if (!current.rows[0]) { await client.query("ROLLBACK"); return NextResponse.json({ error: "Only pending deliveries can be edited." }, { status: 400 }); }
    const driver = await client.query("SELECT id FROM employees WHERE id=$1 AND role='driver' AND status=1", [driverId]);
    const branch = await client.query("SELECT b.client_id FROM branches b JOIN clients c ON c.id=b.client_id WHERE b.id=$1 AND b.is_active=1 AND c.is_active=1", [branchId]);
    if (!driver.rows[0] || !branch.rows[0]) { await client.query("ROLLBACK"); return NextResponse.json({ error: "Choose an active driver and branch." }, { status: 400 }); }
    let deliveryCount = Number(current.rows[0].delivery_count);
    if (Number(current.rows[0].branch_id) !== branchId) { await client.query("SELECT pg_advisory_xact_lock($1)", [branchId]); const next = await client.query("SELECT COALESCE(MAX(delivery_count),0)+1 AS next_count FROM deliveries WHERE branch_id=$1", [branchId]); deliveryCount = Number(next.rows[0].next_count); }
    await client.query("UPDATE deliveries SET client_id=$1,branch_id=$2,assigned_driver_id=$3,requested_commercial_cylinders=$4,requested_domestic_cylinders=$5,delivery_count=$6,delivery_time=$7,updated_at=NOW() WHERE id=$8", [branch.rows[0].client_id, branchId, driverId, commercial, domestic, deliveryCount, deliveryTime, id]);
    await client.query("COMMIT"); return NextResponse.json({ ok: true });
  } catch (error) { await client.query("ROLLBACK"); return databaseErrorResponse(error); } finally { client.release(); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid delivery." }, { status: 400 });
  try { const result = await pool.query("DELETE FROM deliveries WHERE id=$1 AND status=0", [id]); if (!result.rowCount) return NextResponse.json({ error: "Only pending deliveries can be removed." }, { status: 400 }); return NextResponse.json({ ok: true }); } catch (error) { return databaseErrorResponse(error); }
}
