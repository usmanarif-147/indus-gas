import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

type Contact = { name: string; phone: string };
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function flag(value: unknown, fallback: 0 | 1) { return value === 0 || value === 1 ? value : fallback; }
function contacts(value: unknown): Contact[] { return Array.isArray(value) ? value.map((item) => ({ name: text(item?.name), phone: text(item?.phone) })).filter((item) => item.name || item.phone) : []; }

export async function GET() {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const result = await pool.query(`SELECT c.*, COUNT(b.id)::int AS branch_count,
    COUNT(b.id) FILTER (WHERE b.is_active = 1)::int AS active_branch_count,
    COUNT(b.id) FILTER (WHERE b.is_active = 0)::int AS inactive_branch_count
    FROM clients c LEFT JOIN branches b ON b.client_id = c.id
    GROUP BY c.id ORDER BY c.is_active DESC, c.client_name ASC`);
  return NextResponse.json({ clients: result.rows });
}

export async function POST(request: Request) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const body = await request.json().catch(() => null);
  const clientCode = text(body?.client_code); const clientName = text(body?.client_name);
  if (!clientCode || !clientName) return NextResponse.json({ error: "Client code and client name are required." }, { status: 400 });
  const branch = body?.branch;
  if (branch && (!text(branch.branch_code) || !text(branch.branch_name))) return NextResponse.json({ error: "Branch code and branch name are required when adding a branch." }, { status: 400 });
  const connection = await pool.connect();
  try {
    await connection.query("BEGIN");
    const created = await connection.query(`INSERT INTO clients (client_code, client_name, is_active, ntn, client_type, payment_method) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [clientCode, clientName, flag(body?.is_active, 0), text(body?.ntn) || null, flag(body?.client_type, 0), flag(body?.payment_method, 1)]);
    if (branch) await connection.query(`INSERT INTO branches (client_id, branch_name, branch_code, area, address, contact_person, is_active) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`, [created.rows[0].id, text(branch.branch_name), text(branch.branch_code), text(branch.area) || null, text(branch.address) || null, JSON.stringify(contacts(branch.contact_person)), flag(branch.is_active, 1)]);
    await connection.query("COMMIT");
    return NextResponse.json({ client: created.rows[0] }, { status: 201 });
  } catch (error) { await connection.query("ROLLBACK"); return databaseErrorResponse(error); }
  finally { connection.release(); }
}
