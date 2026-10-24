import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid delivery." }, { status: 400 });
  try { const result = await pool.query("DELETE FROM deliveries WHERE id=$1 AND status=0", [id]); if (!result.rowCount) return NextResponse.json({ error: "Only pending deliveries can be removed." }, { status: 400 }); return NextResponse.json({ ok: true }); } catch (error) { return databaseErrorResponse(error); }
}
