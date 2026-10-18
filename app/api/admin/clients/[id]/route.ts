import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function flag(value: unknown, fallback: 0 | 1) { return value === 0 || value === 1 ? value : fallback; }
async function idFrom(params: Promise<{ id: string }>) { const { id } = await params; return Number(id); }

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const id = await idFrom(params); if (!Number.isInteger(id)) return NextResponse.json({ error: "Client not found." }, { status: 404 });
  const client = await pool.query("SELECT * FROM clients WHERE id = $1", [id]);
  if (!client.rows[0]) return NextResponse.json({ error: "Client not found." }, { status: 404 });
  const branches = await pool.query("SELECT * FROM branches WHERE client_id = $1 ORDER BY branch_name", [id]);
  return NextResponse.json({ client: client.rows[0], branches: branches.rows });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const id = await idFrom(params); const body = await request.json().catch(() => null);
  const clientCode = text(body?.client_code); const clientName = text(body?.client_name);
  if (!Number.isInteger(id) || !clientCode || !clientName) return NextResponse.json({ error: "Client code and client name are required." }, { status: 400 });
  try {
    const result = await pool.query(`UPDATE clients SET client_code = $1, client_name = $2, is_active = $3, ntn = $4, client_type = $5, payment_method = $6, updated_at = NOW() WHERE id = $7 RETURNING *`, [clientCode, clientName, flag(body?.is_active, 0), text(body?.ntn) || null, flag(body?.client_type, 0), flag(body?.payment_method, 1), id]);
    if (!result.rows[0]) return NextResponse.json({ error: "Client not found." }, { status: 404 });
    return NextResponse.json({ client: result.rows[0] });
  } catch (error) { return databaseErrorResponse(error); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const id = await idFrom(params); if (!Number.isInteger(id)) return NextResponse.json({ error: "Client not found." }, { status: 404 });
  try { const result = await pool.query("DELETE FROM clients WHERE id = $1 RETURNING id", [id]); if (!result.rows[0]) return NextResponse.json({ error: "Client not found." }, { status: 404 }); return NextResponse.json({ ok: true }); }
  catch (error) { return databaseErrorResponse(error); }
}
