import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const date = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(text(value)) ? text(value) : "";
const time = (value: unknown) => /^\d{2}:\d{2}$/.test(text(value)) ? text(value) : "";
const number = (value: unknown) => Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
const flag = (value: unknown) => value === true || value === 1 ? 1 : 0;

export async function POST(request: Request) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const body = await request.json().catch(() => null);
  const operationDate = date(body?.operationDate);
  const assignedEmployeeId = Number(body?.assignedEmployeeId);
  const taskCategory = text(body?.taskCategory);
  const planOrder = number(body?.planOrder);
  const branchId = body?.branchId ? Number(body.branchId) : null;
  const scheduledTime = time(body?.scheduledTime) || null;
  const notes = text(body?.notes) || null;
  const plantName = text(body?.plantName) || null;
  const commercialFilled = number(body?.commercialFilled);
  const domesticFilled = number(body?.domesticFilled);
  const commercialEmpty = number(body?.commercialEmpty);
  const domesticEmpty = number(body?.domesticEmpty);
  const cashCollectionRequired = flag(body?.cashCollectionRequired);
  const cashAmount = cashCollectionRequired ? Number(body?.cashAmount) : null;
  const cashBeforeDelivery = flag(body?.cashBeforeDelivery);
  const inspectionRequired = flag(body?.inspectionRequired);
  const inspectionNote = inspectionRequired ? text(body?.inspectionNote) || null : null;
  const validCategory = ["filling_visit", "cylinder_delivery", "cylinder_collection", "vehicle_task"].includes(taskCategory);
  if (!operationDate || !Number.isInteger(assignedEmployeeId) || !validCategory || !planOrder || (branchId !== null && !Number.isInteger(branchId)) || (cashCollectionRequired && (cashAmount === null || !Number.isFinite(cashAmount) || cashAmount <= 0))) return NextResponse.json({ error: "Complete the required driver task details." }, { status: 400 });
  if (operationDate < new Date().toISOString().slice(0, 10)) return NextResponse.json({ error: "A driver task cannot be created for a past date." }, { status: 400 });
  if (taskCategory === "filling_visit" && !plantName) return NextResponse.json({ error: "Enter the LPG plant name." }, { status: 400 });
  if (["cylinder_delivery", "cylinder_collection"].includes(taskCategory) && !branchId) return NextResponse.json({ error: "Choose the client branch." }, { status: 400 });
  if (taskCategory === "cylinder_delivery" && commercialFilled + domesticFilled <= 0) return NextResponse.json({ error: "Enter at least one cylinder to deliver." }, { status: 400 });

  try {
    const driver = await pool.query(`SELECT id FROM employees WHERE id=$1 AND role='driver' AND status=1`, [assignedEmployeeId]);
    if (!driver.rows[0]) return NextResponse.json({ error: "Choose an active driver." }, { status: 400 });
    const title = taskCategory === "filling_visit" ? "Filling at " + plantName : taskCategory === "cylinder_delivery" ? "Cylinder delivery" : taskCategory === "cylinder_collection" ? "Collect empty cylinders" : "Vehicle task";
    const result = await pool.query(`INSERT INTO daily_operations (
      operation_date, assigned_employee_id, task_category, title, branch_id, scheduled_time, notes, plan_order,
      plant_name, commercial_filled_count, domestic_filled_count, commercial_empty_expected, domestic_empty_expected,
      cash_collection_required, cash_amount, cash_before_delivery, inspection_required, inspection_note
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id`, [
      operationDate, assignedEmployeeId, taskCategory, title, branchId, scheduledTime, notes, planOrder,
      plantName, commercialFilled, domesticFilled, commercialEmpty, domesticEmpty,
      cashCollectionRequired, cashAmount, cashBeforeDelivery, inspectionRequired, inspectionNote,
    ]);
    return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
