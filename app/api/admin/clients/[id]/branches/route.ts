import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

type Contact = { name: string; phone: string };
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function flag(value: unknown, fallback: 0 | 1) { return value === 0 || value === 1 ? value : fallback; }
function contacts(value: unknown): Contact[] { return Array.isArray(value) ? value.map((item) => ({ name: text(item?.name), phone: text(item?.phone) })).filter((item) => item.name || item.phone) : []; }

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const { id } = await params; const clientId = Number(id); const body = await request.json().catch(() => null);
  const branchCode = text(body?.branch_code); const branchName = text(body?.branch_name);
  if (!Number.isInteger(clientId) || !branchCode || !branchName) return NextResponse.json({ error: "Branch code and branch name are required." }, { status: 400 });
  try {
    const result = await pool.query(`INSERT INTO branches (client_id, branch_name, branch_code, area, address, contact_person, is_active) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7) RETURNING *`, [clientId, branchName, branchCode, text(body?.area) || null, text(body?.address) || null, JSON.stringify(contacts(body?.contact_person)), flag(body?.is_active, 1)]);
    return NextResponse.json({ branch: result.rows[0] }, { status: 201 });
  } catch (error) { return databaseErrorResponse(error); }
}
