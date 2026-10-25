import { NextResponse } from "next/server";
import { databaseErrorResponse, requireAdminApiSession, unauthorizedResponse } from "@/lib/admin-api";
import { pool } from "@/lib/db";

const quantity=(v:unknown)=>Number.isInteger(Number(v))&&Number(v)>=0?Number(v):-1;
const time=(v:unknown)=>typeof v==="string"&&/^\d{2}:\d{2}$/.test(v)?v:null;
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}) { if(!await requireAdminApiSession())return unauthorizedResponse();const id=Number((await params).id),body=await request.json().catch(()=>null),branchId=Number(body?.branchId),driverId=Number(body?.assignedDriverId),commercial=quantity(body?.commercialCylinders),domestic=quantity(body?.domesticCylinders),deliveryTime=time(body?.deliveryTime);if(!Number.isInteger(id)||!Number.isInteger(branchId)||!Number.isInteger(driverId)||commercial<0||domestic<0||commercial+domestic<1)return NextResponse.json({error:"Complete valid delivery details."},{status:400});try{const result=await pool.query("UPDATE deliveries SET branch_id=$1,assigned_driver_id=$2,requested_commercial_cylinders=$3,requested_domestic_cylinders=$4,delivery_time=$5,updated_at=NOW() WHERE id=$6 AND status=0 RETURNING id",[branchId,driverId,commercial,domestic,deliveryTime,id]);if(!result.rowCount)return NextResponse.json({error:"Only pending deliveries can be edited."},{status:400});return NextResponse.json({ok:true});}catch(error){return databaseErrorResponse(error);} }

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApiSession()) return unauthorizedResponse();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid delivery." }, { status: 400 });
  try { const result = await pool.query("DELETE FROM deliveries WHERE id=$1 AND status=0", [id]); if (!result.rowCount) return NextResponse.json({ error: "Only pending deliveries can be removed." }, { status: 400 }); return NextResponse.json({ ok: true }); } catch (error) { return databaseErrorResponse(error); }
}
