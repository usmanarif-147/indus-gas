import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";
import { payrollHistory } from "@/lib/payroll";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApiSession()) return unauthorizedResponse(); const { id } = await params; const employeeId = Number(id); if (!Number.isInteger(employeeId)) return NextResponse.json({ error: "Employee not found." }, { status: 404 }); const client = await pool.connect();
  try { await client.query("BEGIN"); const employee = await client.query("SELECT id, start_date, end_date, monthly_salary FROM employees WHERE id = $1", [employeeId]); if (!employee.rows[0]) { await client.query("ROLLBACK"); return NextResponse.json({ error: "Employee not found." }, { status: 404 }); } const entries = await payrollHistory(client, employee.rows[0]); const advances = await client.query("SELECT id, advance_date, amount, notes FROM employee_advances WHERE employee_id = $1 ORDER BY advance_date DESC, id DESC", [employeeId]); await client.query("COMMIT"); return NextResponse.json({ entries, advances: advances.rows.map((row) => ({ id: Number(row.id), date: row.advance_date instanceof Date ? row.advance_date.toISOString().slice(0, 10) : String(row.advance_date).slice(0, 10), amount: Number(row.amount), notes: row.notes || "" })) }); }
  catch (error) { await client.query("ROLLBACK"); return databaseErrorResponse(error); } finally { client.release(); }
}
