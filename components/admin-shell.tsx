"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";

const menu = [
  ["/admin/dashboard", "▦", "Dashboard"],
  ["/admin/working", "◌", "Daily Operations"],
  ["/admin/working-v2", "◈", "Daily Operations V2"],
  ["/admin/clients", "♙", "Clients"],
  ["/admin/employees", "♧", "Employees"],
  ["/admin/purchasing", "▣", "Purchasing"],
  ["/admin/reminder", "◷", "Reminder"],
  ["/admin/expenses", "₨", "Expenses"],
  ["/admin/settings", "⚙", "Settings"]
] as const;

const salesLinks = [
  ["/admin/sales/invoices", "Sales Invoice"],
  ["/admin/sales/returns", "Sales Return"],
] as const;

export default function AdminShell({ children, username }: { children: ReactNode; username: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(pathname.startsWith("/admin/sales"));
  const salesActive = pathname.startsWith("/admin/sales");
  async function logout() { await fetch("/api/admin/auth/logout", { method: "POST" }); router.replace("/admin"); router.refresh(); }
  return <div className="admin-app"><aside className={`admin-sidebar ${open ? "is-open" : ""}`}><Link href="/admin/dashboard" className="admin-logo">INDUS<span>GAS</span><small>PARTNER PANEL</small></Link><nav>{menu.map(([href, icon, label]) => <Link key={href} href={href} className={pathname === href ? "admin-nav active" : "admin-nav"} onClick={() => setOpen(false)}><span>{icon}</span>{label}</Link>)}<div className="admin-nav-group"><button type="button" className={`admin-nav admin-nav-toggle ${salesActive ? "active" : ""}`} onClick={() => setSalesOpen((value) => !value)} aria-expanded={salesOpen}><span>₨</span>Sales<i>{salesOpen ? "⌃" : "⌄"}</i></button>{salesOpen && <div className="admin-subnav">{salesLinks.map(([href, label]) => <Link key={href} href={href} className={pathname === href ? "admin-subnav-link active" : "admin-subnav-link"} onClick={() => setOpen(false)}>{label}</Link>)}</div>}</div></nav><div className="admin-user"><span>{username.slice(0, 1).toUpperCase()}</span><div><strong>{username}</strong><small>Partner</small></div><button type="button" onClick={logout} title="Log out" aria-label="Log out">↗</button></div></aside><main className="admin-main"><header className="admin-mobile-header"><button onClick={() => setOpen(true)} aria-label="Open menu">☰</button><strong>INDUS<span>GAS</span></strong></header>{children}</main></div>;
}
