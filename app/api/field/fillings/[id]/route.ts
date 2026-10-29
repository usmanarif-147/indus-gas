import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { FIELD_SESSION_COOKIE, verifyFieldSession } from "@/lib/field-auth";

async function driver() {
  const session = verifyFieldSession((await cookies()).get(FIELD_SESSION_COOKIE)?.value);
  return session?.role === "driver" && session.employeeId ? session : null;
}

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await driver();
  const id = Number((await params).id);
  if (!session || !Number.isInteger(id)) return NextResponse.json({ error: "Filling plan not found." }, { status: 404 });
  try {
    const result = await pool.query(`UPDATE plant_filling_plans
      SET filling_status=1, completed_at=NOW(), updated_at=NOW()
      WHERE id=$1 AND assigned_driver_id=$2 AND filling_status=0 AND published_at IS NOT NULL
      RETURNING id`, [id, Number(session.employeeId)]);
    if (!result.rowCount) return NextResponse.json({ error: "Only your published planned filling task can be completed." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to complete filling task." }, { status: 500 });
  }
}
