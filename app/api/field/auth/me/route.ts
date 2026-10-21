import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { FIELD_SESSION_COOKIE, verifyFieldSession } from "@/lib/field-auth";

export async function GET() { const session = verifyFieldSession((await cookies()).get(FIELD_SESSION_COOKIE)?.value); if (!session) return NextResponse.json({ error: "You must sign in again." }, { status: 401 }); return NextResponse.json({ user: { name: session.name, role: session.role } }); }
