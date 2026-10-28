import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

const taskTypes = ["delivery", "filling", "task"] as const;

export async function PATCH(request: Request) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  const type = body?.type;
  const publish = body?.publish;
  if (!Number.isInteger(id) || !taskTypes.includes(type) || typeof publish !== "boolean") return NextResponse.json({ error: "Choose a valid task and publication state." }, { status: 400 });

  try {
    const publishedAt = publish ? "NOW()" : "NULL";
    const query = type === "delivery"
      ? `UPDATE deliveries SET published_at=${publishedAt}, updated_at=NOW() WHERE id=$1 AND status=0`
      : type === "filling"
        ? `UPDATE plant_filling_plans SET published_at=${publishedAt}, updated_at=NOW() WHERE id=$1 AND filling_status=0`
        : `UPDATE daily_operations SET published_at=${publishedAt}, updated_at=NOW() WHERE id=$1 AND status=0`;
    const result = await pool.query(query, [id]);
    if (!result.rowCount) return NextResponse.json({ error: "Only an active planned task can be published or unpublished." }, { status: 400 });
    return NextResponse.json({ ok: true, published: publish });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
