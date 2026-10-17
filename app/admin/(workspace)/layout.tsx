import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin-shell";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import "../admin.css";
export default async function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  const session = verifyAdminSession(token);
  if (!session) redirect("/admin");
  return <AdminShell username={session.username}>{children}</AdminShell>;
}
