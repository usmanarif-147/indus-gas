import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";

export async function requireAdminApiSession() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSession(token);
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "You must sign in again." }, { status: 401 });
}

export function databaseErrorResponse(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code === "23505") return NextResponse.json({ error: "This code is already in use." }, { status: 409 });
  if (code === "23503") return NextResponse.json({ error: "This record cannot be deleted because it is being used elsewhere." }, { status: 409 });
  return NextResponse.json({ error: "Unable to save changes. Please try again." }, { status: 500 });
}
