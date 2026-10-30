import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";
import { pakistanDate } from "@/lib/pakistan-time";

const date = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";

export async function GET(request: Request) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const { searchParams } = new URL(request.url), today = pakistanDate();
  const from = date(searchParams.get("from")) || today.slice(0, 8) + "01", to = date(searchParams.get("to")) || today;
  try {
    const [employees, branches, summaries] = await Promise.all([
      pool.query(`SELECT id::int, full_name AS name, role FROM employees WHERE status=1 AND role='driver' ORDER BY full_name`),
      pool.query(`SELECT b.id::int, b.client_id::int AS "clientId", b.branch_name AS "branchName", c.client_name AS "clientName" FROM branches b JOIN clients c ON c.id=b.client_id WHERE b.is_active=1 AND c.is_active=1 ORDER BY c.client_name,b.branch_name`),
      pool.query(`WITH delivery_counts AS (SELECT delivery_date AS operation_date, COUNT(*)::int AS driver_count FROM deliveries WHERE delivery_date BETWEEN $1 AND $2 AND status<>2 GROUP BY delivery_date), filling_counts AS (SELECT d.entry_date AS operation_date, COUNT(*)::int AS driver_count FROM plant_filling_plans p JOIN plant_daily_entries d ON d.id=p.plant_daily_entry_id WHERE d.entry_date BETWEEN $1 AND $2 AND p.filling_status<>2 GROUP BY d.entry_date), combined AS (SELECT operation_date,driver_count FROM delivery_counts UNION ALL SELECT operation_date,driver_count FROM filling_counts) SELECT operation_date::text AS "operationDate",COALESCE(SUM(driver_count),0)::int AS "driverCount",0::int AS "salesmanCount",0::int AS "officeBoyCount",COALESCE(SUM(driver_count),0)::int AS "totalCount" FROM combined GROUP BY operation_date ORDER BY operation_date`, [from, to]),
    ]);
    return NextResponse.json({ tasks: [], employees: employees.rows, branches: branches.rows, summaries: summaries.rows });
  } catch (error) { return databaseErrorResponse(error); }
}
