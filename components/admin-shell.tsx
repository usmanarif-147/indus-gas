"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

const menu = [
  ["/admin/dashboard", "▦", "Dashboard"],
  ["/admin/working", "◌", "Working"],
  ["/admin/clients", "♙", "Clients"],
  ["/admin/employees", "♧", "Employees"],
  ["/admin/purchasing", "▣", "Purchasing"],
  ["/admin/reminder", "◷", "Reminder"],
  ["/admin/expenses", "₨", "Expenses"]
] as const;

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <div className="admin-app"><aside className={`admin-sidebar ${open ? "is-open" : ""}`}><Link href="/admin/dashboard" className="admin-logo">INDUS<span>GAS</span><small>PARTNER PANEL</small></Link><nav>{menu.map(([href, icon, label]) => <Link key={href} href={href} className={pathname === href ? "admin-nav active" : "admin-nav"} onClick={() => setOpen(false)}><span>{icon}</span>{label}</Link>)}</nav><div className="admin-user"><span>U</span><div><strong>Partner</strong><small>Indus Gas</small></div><Link href="/admin" title="Log out">↗</Link></div></aside><main className="admin-main"><header className="admin-mobile-header"><button onClick={() => setOpen(true)} aria-label="Open menu">☰</button><strong>INDUS<span>GAS</span></strong></header>{children}</main></div>;
}
