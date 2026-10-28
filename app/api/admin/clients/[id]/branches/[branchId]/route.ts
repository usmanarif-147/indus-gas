import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

type Contact = { name: string; phone: string };
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function flag(value: unknown, fallback: 0 | 1) { return value === 0 || value === 1 ? value : fallback; }
function contacts(value: unknown): Contact[] { return Array.isArray(value) ? value.map((item) => ({ name: text(item?.name), phone: text(item?.phone) })).filter((item) => item.name || item.phone) : []; }
async function ids(params: Promise<{ id: string; branchId: string }>) { const value = await params; return [Number(value.id), Number(value.branchId)] as const; }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; branchId: string }> }) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const [clientId, branchId] = await ids(params); const body = await request.json().catch(() => null);
  const branchName = text(body?.branch_name);
  if (!Number.isInteger(clientId) || !Number.isInteger(branchId) || !branchName) return NextResponse.json({ error: "Branch name is required." }, { status: 400 });
  try {
    const result = await pool.query(`UPDATE branches SET branch_name = $1, area = $2, address = $3, contact_person = $4::jsonb, is_active = $5, updated_at = NOW() WHERE id = $6 AND client_id = $7 RETURNING *`, [branchName, text(body?.area) || null, text(body?.address) || null, JSON.stringify(contacts(body?.contact_person)), flag(body?.is_active, 1), branchId, clientId]);
    if (!result.rows[0]) return NextResponse.json({ error: "Branch not found." }, { status: 404 });
    return NextResponse.json({ branch: result.rows[0] });
  } catch (error) { return databaseErrorResponse(error); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; branchId: string }> }) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const [clientId, branchId] = await ids(params); if (!Number.isInteger(clientId) || !Number.isInteger(branchId)) return NextResponse.json({ error: "Branch not found." }, { status: 404 });
  try { const result = await pool.query("DELETE FROM branches WHERE id = $1 AND client_id = $2 RETURNING id", [branchId, clientId]); if (!result.rows[0]) return NextResponse.json({ error: "Branch not found." }, { status: 404 }); return NextResponse.json({ ok: true }); }
  catch (error) { return databaseErrorResponse(error); }
}
