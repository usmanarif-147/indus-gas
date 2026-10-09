"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type DemoUser = { name: string; role: "salesman" | "delivery_boy" | "admin" };

const homeContent = {
  salesman: {
    greeting: "Your work",
    options: [
      { href: "/field/leads", icon: "◌", title: "Leads", detail: "New restaurant meetings" },
      { href: "/field/plan", icon: "▤", title: "Plan", detail: "Today's planned visits", count: "0" },
      { href: "/field/expenses", icon: "₨", title: "Expense Tracker", detail: "Add daily expense" },
    ],
  },
  delivery_boy: {
    greeting: "Your work",
    options: [
      { href: "/field/deliveries", icon: "▣", title: "Deliveries", detail: "Today's deliveries", count: "5" },
      { href: "/field/expenses", icon: "₨", title: "Expense Tracker", detail: "Add daily expense" },
    ],
  },
  admin: {
    greeting: "Your work",
    options: [
      { href: "/field/report", icon: "▦", title: "Report", detail: "Coming soon" },
      { href: "/field/expenses", icon: "₨", title: "Expense Tracker", detail: "Add daily expense" },
      { href: "/field/clients", icon: "♙", title: "Clients", detail: "Coming soon" },
      { href: "/field/visits", icon: "◌", title: "Visits", detail: "Coming soon" },
      { href: "/field/filling", icon: "◒", title: "Filling", detail: "Coming soon" },
    ],
  },
} as const;

export default function FieldHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<DemoUser | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("indus-gas-demo-user");
    if (!stored) { router.replace("/field"); return; }
    setUser(JSON.parse(stored));
  }, [router]);

  if (!user) return <main className="field-shell" />;
  const content = homeContent[user.role];
  function logout() { sessionStorage.removeItem("indus-gas-demo-user"); router.replace("/field"); }

  return <main className="field-shell"><section className="field-page">
    <header className="field-home-header"><div><p className="field-brand">INDUS<span>GAS</span></p><h1>{content.greeting}</h1></div><button onClick={logout} aria-label="Log out">↗</button></header>
    <p className="muted">Hello {user.name}. Choose one option.</p>
    <div className="large-tile-grid">{content.options.map((item) => <Link key={item.href} className={`large-tile ${"count" in item ? "has-tile-count" : ""}`} href={item.href}>
      {"count" in item && <span className="home-tile-count"><b>{item.count}</b> {item.title === "Plan" ? "planned visits" : "total deliveries"}</span>}
      <span className="tile-icon text-icon">{item.icon}</span>
      <strong>{item.title}</strong>
      <small>{item.detail}</small>
    </Link>)}</div>
  </section></main>;
}
