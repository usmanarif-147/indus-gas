import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

const validDate = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
const whole = (value: unknown) => Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : -1;
const amount = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : null;
type ClientEntry = { id: number; balance: number | null; notes: string };
type BranchEntry = { id: number; commercial: number; domestic: number; notes: string };

export async function GET(request: Request) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const openingDate = validDate(new URL(request.url).searchParams.get("date"));
  if (!openingDate) return NextResponse.json({ error: "Choose a valid opening date." }, { status: 400 });
  try {
    const [inventory, clients, branches] = await Promise.all([
      pool.query(`SELECT opening_date::text AS "openingDate",total_commercial_cylinders::int AS "totalCommercial",total_domestic_cylinders::int AS "totalDomestic",commercial_cylinders_in_company::int AS "commercialInCompany",domestic_cylinders_in_company::int AS "domesticInCompany",COALESCE(notes,'') AS notes FROM inventory_opening_balances WHERE opening_date=$1`, [openingDate]),
      pool.query(`SELECT c.id::int,c.client_name AS "clientName",COALESCE(o.opening_receivable_amount,0)::text AS "openingBalance",COALESCE(o.notes,'') AS notes FROM clients c LEFT JOIN client_opening_balances o ON o.client_id=c.id AND o.opening_date=$1 ORDER BY c.client_name`, [openingDate]),
      pool.query(`SELECT b.id::int,b.client_id::int AS "clientId",c.client_name AS "clientName",b.branch_name AS "branchName",COALESCE(o.commercial_cylinders_at_branch,0)::int AS commercial,COALESCE(o.domestic_cylinders_at_branch,0)::int AS domestic,COALESCE(o.notes,'') AS notes FROM branches b JOIN clients c ON c.id=b.client_id LEFT JOIN branch_opening_cylinder_balances o ON o.branch_id=b.id AND o.opening_date=$1 ORDER BY c.client_name,b.branch_name`, [openingDate]),
    ]);
    return NextResponse.json({ inventory: inventory.rows[0] || null, clients: clients.rows, branches: branches.rows });
  } catch (error) { return databaseErrorResponse(error); }
}

export async function PUT(request: Request) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const body = await request.json().catch(() => null), openingDate = validDate(body?.openingDate);
  const totalCommercial = whole(body?.inventory?.totalCommercial), totalDomestic = whole(body?.inventory?.totalDomestic), commercialInCompany = whole(body?.inventory?.commercialInCompany), domesticInCompany = whole(body?.inventory?.domesticInCompany);
  const clients: unknown[] = Array.isArray(body?.clients) ? body.clients : [], branches: unknown[] = Array.isArray(body?.branches) ? body.branches : [];
  if (!openingDate || totalCommercial < 0 || totalDomestic < 0 || commercialInCompany < 0 || domesticInCompany < 0 || commercialInCompany > totalCommercial || domesticInCompany > totalDomestic) return NextResponse.json({ error: "Enter valid opening inventory figures." }, { status: 400 });
  const parsedClients: ClientEntry[] = clients.map((item: unknown) => { const row = item as Record<string, unknown>; return { id: Number(row.id), balance: amount(row.openingBalance), notes: typeof row.notes === "string" ? row.notes.trim() : "" }; });
  const parsedBranches: BranchEntry[] = branches.map((item: unknown) => { const row = item as Record<string, unknown>; return { id: Number(row.id), commercial: whole(row.commercial), domestic: whole(row.domestic), notes: typeof row.notes === "string" ? row.notes.trim() : "" }; });
  if (parsedClients.some((item) => !Number.isInteger(item.id) || item.balance === null) || parsedBranches.some((item) => !Number.isInteger(item.id) || item.commercial < 0 || item.domestic < 0)) return NextResponse.json({ error: "Review the client balances and branch cylinder quantities." }, { status: 400 });
  const branchCommercial = parsedBranches.reduce((sum: number, item: BranchEntry) => sum + item.commercial, 0), branchDomestic = parsedBranches.reduce((sum: number, item: BranchEntry) => sum + item.domestic, 0);
  if (commercialInCompany + branchCommercial !== totalCommercial || domesticInCompany + branchDomestic !== totalDomestic) return NextResponse.json({ error: "Company-held and branch cylinders must exactly match the company totals." }, { status: 400 });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const knownClients = await client.query("SELECT id FROM clients WHERE id=ANY($1::bigint[])", [parsedClients.map((item) => item.id)]);
    const knownBranches = await client.query("SELECT id FROM branches WHERE id=ANY($1::bigint[])", [parsedBranches.map((item) => item.id)]);
    if (knownClients.rowCount !== parsedClients.length || knownBranches.rowCount !== parsedBranches.length) { await client.query("ROLLBACK"); return NextResponse.json({ error: "A client or branch no longer exists." }, { status: 400 }); }
    await client.query(`INSERT INTO inventory_opening_balances (opening_date,total_commercial_cylinders,total_domestic_cylinders,commercial_cylinders_in_company,domestic_cylinders_in_company,notes) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (opening_date) DO UPDATE SET total_commercial_cylinders=EXCLUDED.total_commercial_cylinders,total_domestic_cylinders=EXCLUDED.total_domestic_cylinders,commercial_cylinders_in_company=EXCLUDED.commercial_cylinders_in_company,domestic_cylinders_in_company=EXCLUDED.domestic_cylinders_in_company,notes=EXCLUDED.notes,updated_at=NOW()`, [openingDate,totalCommercial,totalDomestic,commercialInCompany,domesticInCompany,typeof body?.inventory?.notes === "string" ? body.inventory.notes.trim() : null]);
    for (const item of parsedClients) await client.query(`INSERT INTO client_opening_balances (client_id,opening_date,opening_receivable_amount,notes) VALUES ($1,$2,$3,$4) ON CONFLICT (client_id,opening_date) DO UPDATE SET opening_receivable_amount=EXCLUDED.opening_receivable_amount,notes=EXCLUDED.notes,updated_at=NOW()`, [item.id,openingDate,item.balance,item.notes || null]);
    for (const item of parsedBranches) await client.query(`INSERT INTO branch_opening_cylinder_balances (branch_id,opening_date,commercial_cylinders_at_branch,domestic_cylinders_at_branch,notes) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (branch_id,opening_date) DO UPDATE SET commercial_cylinders_at_branch=EXCLUDED.commercial_cylinders_at_branch,domestic_cylinders_at_branch=EXCLUDED.domestic_cylinders_at_branch,notes=EXCLUDED.notes,updated_at=NOW()`, [item.id,openingDate,item.commercial,item.domestic,item.notes || null]);
    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (error) { await client.query("ROLLBACK"); return databaseErrorResponse(error); } finally { client.release(); }
}
