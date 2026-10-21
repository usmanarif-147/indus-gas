import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

const roles = ["warehouse_manager", "sales_manager", "driver"] as const;
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function date(value: unknown) { const valueText = text(value); return /^\d{4}-\d{2}-\d{2}$/.test(valueText) ? valueText : ""; }
function flag(value: unknown, fallback = 1) { return value === 0 || value === 1 ? value : fallback; }
function values(body: any) { const fullName = text(body?.fullName); const fatherName = text(body?.fatherName); const address = text(body?.address); const startDate = date(body?.startDate); const endDate = date(body?.endDate) || null; const salary = Number(body?.monthlySalary); const status = flag(body?.status); const role = roles.includes(body?.role) ? body.role : ""; const loginEnabled = body?.loginEnabled === true; const username = text(body?.username); const password = typeof body?.password === "string" ? body.password : ""; if (!fullName || !fatherName || !address || !startDate || !role || !Number.isFinite(salary) || salary < 0 || (endDate && endDate < startDate) || (loginEnabled && !username)) return null; return { fullName, fatherName, address, startDate, endDate, salary, status, role, loginEnabled, username, password }; }
function output(row: Record<string, unknown>) { return { id: Number(row.id), userId: row.user_id ? Number(row.user_id) : null, fullName: row.full_name, fatherName: row.father_name, address: row.address, startDate: row.start_date instanceof Date ? row.start_date.toISOString().slice(0, 10) : String(row.start_date).slice(0, 10), endDate: row.end_date ? (row.end_date instanceof Date ? row.end_date.toISOString().slice(0, 10) : String(row.end_date).slice(0, 10)) : "", monthlySalary: Number(row.monthly_salary), status: Number(row.status), role: row.role, username: row.username || "", loginEnabled: row.user_id ? Number(row.user_is_active) === 1 : false }; }
const select = `SELECT e.*, u.username, u.is_active AS user_is_active FROM employees e LEFT JOIN users u ON u.id = e.user_id`;

export async function GET() { if (!await requireAdminApiSession()) return unauthorizedResponse(); try { const result = await pool.query(`${select} ORDER BY e.status DESC, e.full_name`); return NextResponse.json({ employees: result.rows.map(output) }); } catch (error) { return databaseErrorResponse(error); } }

export async function POST(request: Request) {
  if (!await requireAdminApiSession()) return unauthorizedResponse(); const body = await request.json().catch(() => null); const value = values(body); if (!value || (value.loginEnabled && value.password.length < 8)) return NextResponse.json({ error: "Complete all employee details. A new login password must contain at least 8 characters." }, { status: 400 });
  const connection = await pool.connect();
  try { await connection.query("BEGIN"); let userId: string | null = null; if (value.loginEnabled) { const password = await bcrypt.hash(value.password, 12); const user = await connection.query("INSERT INTO users (username, password, account_type, is_active) VALUES ($1, $2, 'employee', $3) RETURNING id", [value.username, password, value.status]); userId = user.rows[0].id; } const employee = await connection.query(`INSERT INTO employees (user_id, full_name, father_name, address, start_date, end_date, monthly_salary, status, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`, [userId, value.fullName, value.fatherName, value.address, value.startDate, value.endDate, value.salary, value.status, value.role]); const result = await connection.query(`${select} WHERE e.id = $1`, [employee.rows[0].id]); await connection.query("COMMIT"); return NextResponse.json({ employee: output(result.rows[0]) }, { status: 201 }); }
  catch (error) { await connection.query("ROLLBACK"); return databaseErrorResponse(error); } finally { connection.release(); }
}
