import AdminShell from "@/components/admin-shell";
import "../admin.css";
export default function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <AdminShell>{children}</AdminShell>; }
