import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const body = await request.json().catch(() => null), deliveryId = Number(body?.deliveryId), margin = Number(body?.profitMarginPerKg);
  if (!Number.isInteger(deliveryId) || !Number.isFinite(margin) || margin < 0) return NextResponse.json({ error: "Enter a valid profit margin." }, { status: 400 });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const delivery = await client.query(`SELECT d.id,d.delivery_date,d.commercial_cylinder_count,d.domestic_cylinder_count,p.domestic_lpg_rate
      FROM deliveries d JOIN plant_daily_entries p ON p.entry_date=d.delivery_date
      WHERE d.id=$1 AND d.status=1 AND p.domestic_lpg_rate IS NOT NULL FOR UPDATE`, [deliveryId]);
    if (!delivery.rows[0]) { await client.query("ROLLBACK"); return NextResponse.json({ error: "A completed delivery and its daily plant rate are required." }, { status: 400 }); }
    const row = delivery.rows[0], perKg = Number(row.domestic_lpg_rate) / 11.8, commercialCount = Number(row.commercial_cylinder_count), domesticCount = Number(row.domestic_cylinder_count), commercialRate = (perKg + margin) * 45, domesticRate = (perKg + margin) * 11.8, commercialSubtotal = commercialRate * commercialCount, domesticSubtotal = domesticRate * domesticCount, total = commercialSubtotal + domesticSubtotal;
    const number = `INV-${String(row.delivery_date).replaceAll("-", "")}-${String(deliveryId).padStart(4, "0")}`;
    const created = await client.query(`INSERT INTO invoices (invoice_no,delivery_id,purchase_rate_per_kg,profit_margin_per_kg,commercial_cylinder_count,commercial_rate,commercial_subtotal,domestic_cylinder_count,domestic_rate,domestic_subtotal,total_amount,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,1) RETURNING id,invoice_no AS "invoiceNo"`, [number, deliveryId, perKg, margin, commercialCount, commercialRate, commercialSubtotal, domesticCount, domesticRate, domesticSubtotal, total]);
    await client.query("COMMIT");
    return NextResponse.json({ invoice: created.rows[0] }, { status: 201 });
  } catch (error) { await client.query("ROLLBACK"); const code = typeof error === "object" && error && "code" in error ? String(error.code) : ""; if (code === "23505") return NextResponse.json({ error: "An invoice already exists for this delivery." }, { status: 409 }); return databaseErrorResponse(error); } finally { client.release(); }
}
