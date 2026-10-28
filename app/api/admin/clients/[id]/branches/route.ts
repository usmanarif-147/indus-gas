import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { nextBranchCode } from "@/lib/client-codes";
import { pool } from "@/lib/db";

type Contact = { name: string; phone: string };
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function flag(value: unknown, fallback: 0 | 1) { return value === 0 || value === 1 ? value : fallback; }
function contacts(value: unknown): Contact[] { return Array.isArray(value) ? value.map((item) => ({ name: text(item?.name), phone: text(item?.phone) })).filter((item) => item.name || item.phone) : []; }

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const { id } = await params;
  const clientId = Number(id);
  if (!Number.isInteger(clientId)) return NextResponse.json({ error: "Client not found." }, { status: 404 });
  try {
    const result = await pool.query(`SELECT id, branch_code, branch_name, area, address, contact_person, is_active
      FROM branches WHERE client_id=$1 ORDER BY is_active DESC, branch_name`, [clientId]);
    return NextResponse.json({ branches: result.rows });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const { id } = await params; const clientId = Number(id); const body = await request.json().catch(() => null);
  const branchName = text(body?.branch_name);
  if (!Number.isInteger(clientId) || !branchName) return NextResponse.json({ error: "Branch name is required." }, { status: 400 });
  try {
    const connection = await pool.connect();
    try { await connection.query("BEGIN"); const branchCode = await nextBranchCode(connection, clientId); const result = await connection.query(`INSERT INTO branches (client_id, branch_name, branch_code, area, address, contact_person, is_active) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7) RETURNING *`, [clientId, branchName, branchCode, text(body?.area) || null, text(body?.address) || null, JSON.stringify(contacts(body?.contact_person)), flag(body?.is_active, 1)]); await connection.query("COMMIT"); return NextResponse.json({ branch: result.rows[0] }, { status: 201 }); } catch (error) { await connection.query("ROLLBACK"); throw error; } finally { connection.release(); }
  } catch (error) { return databaseErrorResponse(error); }
}
