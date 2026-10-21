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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const id = Number((await params).id);
  const value = payload(await request.json().catch(() => null));
  if (!Number.isInteger(id) || !value) return NextResponse.json({ error: "Complete the required task details." }, { status: 400 });
  try {
    const employee = await pool.query(`SELECT role FROM employees WHERE id=$1 AND status=1`, [value.assignedEmployeeId]);
    if (!employee.rows[0] || !["sales_manager", "driver"].includes(employee.rows[0].role)) return NextResponse.json({ error: "Choose an active driver or sales manager." }, { status: 400 });
    const result = await pool.query(`UPDATE daily_operations SET operation_date=$1, assigned_employee_id=$2, task_category=$3, title=$4, branch_id=$5, scheduled_time=$6, notes=$7, status=$8, updated_at=NOW() WHERE id=$9`, [value.operationDate, value.assignedEmployeeId, value.taskCategory, value.title, value.branchId, value.scheduledTime, value.notes, value.status, id]);
    if (!result.rowCount) return NextResponse.json({ error: "Task not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid task." }, { status: 400 });
  try {
    const result = await pool.query(`DELETE FROM daily_operations WHERE id=$1`, [id]);
    if (!result.rowCount) return NextResponse.json({ error: "Task not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
