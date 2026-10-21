import { NextResponse } from "next/server";
import { FIELD_SESSION_COOKIE } from "@/lib/field-auth";

export async function POST() { const response = NextResponse.json({ ok: true }); response.cookies.set(FIELD_SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 0, path: "/" }); return response; }
