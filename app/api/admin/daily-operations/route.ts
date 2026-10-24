import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

const categories = ["filling_visit", "cylinder_delivery", "vehicle_task", "new_client_meeting", "payment_collection", "follow_up", "cylinder_inspection", "other"] as const;
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const date = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(text(value)) ? text(value) : "";
const time = (value: unknown) => /^\d{2}:\d{2}$/.test(text(value)) ? text(value) : "";

function payload(body: unknown) {
  const value = body as Record<string, unknown> | null;
  const operationDate = date(value?.operationDate);
  const assignedEmployeeId = Number(value?.assignedEmployeeId);
  const taskCategory = text(value?.taskCategory);
  const title = text(value?.title);
  const branchId = value?.branchId ? Number(value.branchId) : null;
  const scheduledTime = time(value?.scheduledTime) || null;
  const notes = text(value?.notes) || null;
  const status = Number(value?.status ?? 0);
  if (!operationDate || !Number.isInteger(assignedEmployeeId) || !categories.includes(taskCategory as typeof categories[number]) || !title || (branchId !== null && !Number.isInteger(branchId)) || ![0, 1, 2].includes(status)) return null;
  return { operationDate, assignedEmployeeId, taskCategory, title, branchId, scheduledTime, notes, status };
}

export async function GET(request: Request) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const { searchParams } = new URL(request.url);
  const from = date(searchParams.get("from")) || new Date().toISOString().slice(0, 8) + "01";
  const to = date(searchParams.get("to")) || new Date().toISOString().slice(0, 10);
  try {
    const [tasks, employees, branches] = await Promise.all([
      pool.query(`SELECT o.id, o.operation_date::text AS "operationDate", o.assigned_employee_id::int AS "assignedEmployeeId",
        o.task_category AS "taskCategory", o.title, o.plan_order::int AS "planOrder", o.branch_id::int AS "branchId",
        to_char(o.scheduled_time, 'HH24:MI') AS "scheduledTime", o.notes, o.status,
        e.full_name AS "employeeName", e.role AS "employeeRole",
        b.branch_name AS "branchName", c.client_name AS "clientName"
        FROM daily_operations o
        JOIN employees e ON e.id = o.assigned_employee_id
        LEFT JOIN branches b ON b.id = o.branch_id
        LEFT JOIN clients c ON c.id = b.client_id
        WHERE o.operation_date BETWEEN $1 AND $2
        ORDER BY o.operation_date, o.plan_order, o.scheduled_time NULLS LAST, o.id`, [from, to]),
      pool.query(`SELECT id::int, full_name AS name, role FROM employees WHERE status = 1 AND role IN ('sales_manager', 'driver') ORDER BY full_name`),
      pool.query(`SELECT b.id::int, b.client_id::int AS "clientId", b.branch_name AS "branchName", c.client_name AS "clientName" FROM branches b JOIN clients c ON c.id=b.client_id WHERE b.is_active=1 AND c.is_active=1 ORDER BY c.client_name,b.branch_name`),
    ]);
    return NextResponse.json({ tasks: tasks.rows, employees: employees.rows, branches: branches.rows });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const value = payload(await request.json().catch(() => null));
  if (!value) return NextResponse.json({ error: "Complete the required task details." }, { status: 400 });
  if (value.operationDate < new Date().toISOString().slice(0, 10)) return NextResponse.json({ error: "A task cannot be created for a past date." }, { status: 400 });
  try {
    const employee = await pool.query(`SELECT role FROM employees WHERE id=$1 AND status=1`, [value.assignedEmployeeId]);
    if (!employee.rows[0] || !["sales_manager", "driver"].includes(employee.rows[0].role)) return NextResponse.json({ error: "Choose an active driver or sales manager." }, { status: 400 });
    const result = await pool.query(`INSERT INTO daily_operations (operation_date, assigned_employee_id, task_category, title, branch_id, scheduled_time, notes, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, [value.operationDate, value.assignedEmployeeId, value.taskCategory, value.title, value.branchId, value.scheduledTime, value.notes, value.status]);
    return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
