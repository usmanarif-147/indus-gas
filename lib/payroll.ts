import { PoolClient } from "pg";

type EmployeePayrollSource = { id: string | number; start_date: Date | string; end_date: Date | string | null; monthly_salary: string | number };
const iso = (value: Date | string) => value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
const firstOfMonth = (date: string) => `${date.slice(0, 7)}-01`;
function addMonths(month: string, amount: number) { const [year, value] = month.slice(0, 7).split("-").map(Number); return `${year + Math.floor((value - 1 + amount) / 12)}-${String(((value - 1 + amount) % 12 + 12) % 12 + 1).padStart(2, "0")}-01`; }
function monthEnd(month: string) { const [year, value] = month.slice(0, 7).split("-").map(Number); return new Date(Date.UTC(year, value, 0)).toISOString().slice(0, 10); }
function daysInclusive(from: string, to: string) { return Math.floor((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000) + 1; }
export function payrollMonth(date: string) { return firstOfMonth(date); }
export function dueDate(month: string) { return `${addMonths(month, 1).slice(0, 7)}-10`; }
export async function ensurePayrollEntry(client: PoolClient, employee: EmployeePayrollSource, month: string) {
  const start = iso(employee.start_date); const end = employee.end_date ? iso(employee.end_date) : null; const periodEnd = monthEnd(month);
  if (start > periodEnd || (end && end < month)) return null;
  const period = await client.query("INSERT INTO payroll_periods (period_month, payment_due_date) VALUES ($1, $2) ON CONFLICT (period_month) DO UPDATE SET updated_at = NOW() RETURNING id", [month, dueDate(month)]);
  const existing = await client.query("SELECT id FROM payroll_entries WHERE payroll_period_id = $1 AND employee_id = $2", [period.rows[0].id, employee.id]); if (existing.rows[0]) return Number(existing.rows[0].id);
  const overlapStart = start > month ? start : month; const overlapEnd = end && end < periodEnd ? end : periodEnd; const calendarDays = daysInclusive(overlapStart, overlapEnd); const payableDays = overlapStart === month && overlapEnd === periodEnd ? 30 : Math.min(calendarDays, 30); const salary = Number(employee.monthly_salary); const dailyRate = salary / 30; const gross = dailyRate * payableDays;
  const result = await client.query("INSERT INTO payroll_entries (payroll_period_id, employee_id, monthly_salary, payable_days, daily_rate, gross_salary) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id", [period.rows[0].id, employee.id, salary, payableDays, dailyRate, gross]); return Number(result.rows[0].id);
}
export async function payrollHistory(client: PoolClient, employee: EmployeePayrollSource) {
  const startMonth = firstOfMonth(iso(employee.start_date)); const finalDate = employee.end_date ? iso(employee.end_date) : new Date().toISOString().slice(0, 10); const finalMonth = firstOfMonth(finalDate); for (let month = startMonth; month <= finalMonth; month = addMonths(month, 1)) await ensurePayrollEntry(client, employee, month);
  const result = await client.query(`SELECT pe.id, pp.period_month, pp.payment_due_date, pe.monthly_salary, pe.payable_days, pe.daily_rate, pe.gross_salary, pe.manual_deduction, pe.notes, COALESCE(a.total, 0) AS advance_total, COALESCE(p.total, 0) AS paid_total FROM payroll_entries pe JOIN payroll_periods pp ON pp.id = pe.payroll_period_id LEFT JOIN (SELECT payroll_period_id, SUM(amount) AS total FROM employee_advances WHERE employee_id = $1 GROUP BY payroll_period_id) a ON a.payroll_period_id = pp.id LEFT JOIN (SELECT payroll_entry_id, SUM(amount) AS total FROM payroll_payments GROUP BY payroll_entry_id) p ON p.payroll_entry_id = pe.id WHERE pe.employee_id = $1 ORDER BY pp.period_month DESC`, [employee.id]);
  return result.rows.map((row) => { const gross = Number(row.gross_salary); const advances = Number(row.advance_total); const deductions = Number(row.manual_deduction); const net = Math.max(0, gross - advances - deductions); const paid = Number(row.paid_total); return { id: Number(row.id), month: iso(row.period_month), dueDate: iso(row.payment_due_date), monthlySalary: Number(row.monthly_salary), payableDays: Number(row.payable_days), dailyRate: Number(row.daily_rate), grossSalary: gross, advances, deductions, netSalary: net, paid, balance: Math.max(0, net - paid), status: paid >= net ? "paid" : paid > 0 ? "partial" : "pending" }; });
}
