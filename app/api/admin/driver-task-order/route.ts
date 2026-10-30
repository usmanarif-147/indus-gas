import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

type Item = { type?: unknown; id?: unknown };
export async function POST(request: Request) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const body = await request.json().catch(() => null);
  const items: Item[] = Array.isArray(body?.tasks) ? body.tasks : [];
  if (!items.length || items.some((item) => !["filling", "delivery"].includes(String(item.type)) || !Number.isInteger(Number(item.id)))) return NextResponse.json({ error: "Invalid task order." }, { status: 400 });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [index, item] of items.entries()) {
      const sequence = index + 1;
      if (item.type === "filling") await client.query("UPDATE plant_filling_plans SET task_sequence=$1,published_at=NULL,updated_at=NOW() WHERE id=$2", [sequence, Number(item.id)]);
    }
    for (const [index, item] of items.entries()) if (item.type === "delivery") await client.query("UPDATE deliveries SET route_sequence=$1,published_at=NULL,updated_at=NOW() WHERE id=$2", [10000 + index + 1, Number(item.id)]);
    for (const [index, item] of items.entries()) if (item.type === "delivery") await client.query("UPDATE deliveries SET route_sequence=$1,published_at=NULL,updated_at=NOW() WHERE id=$2", [index + 1, Number(item.id)]);
    await client.query("COMMIT"); return NextResponse.json({ ok: true });
  } catch (error) { await client.query("ROLLBACK"); return databaseErrorResponse(error); } finally { client.release(); }
}
