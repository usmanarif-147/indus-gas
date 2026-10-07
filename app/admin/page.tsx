import Link from "next/link";
import { pool } from "@/lib/db";

type Activity = { id: number; role: string; action: string; created_at: Date };

export default async function AdminPage() {
  let activities: Activity[] = [];
  try { activities = (await pool.query<Activity>("SELECT id, role, action, created_at FROM activity_log ORDER BY created_at DESC LIMIT 20")).rows; } catch { /* Database may be starting. */ }
  return <main className="admin"><header className="admin-header"><Link href="/" className="brand">INDUS<span>GAS</span></Link><span>Partner dashboard · MVP</span></header><p className="eyebrow">OVERVIEW</p><h1>Business control center</h1><div className="cards"><article><h3>Public website</h3><p>Company information and services are live on the home page.</p></article><article><h3>Employee app</h3><p>Role and section selections are recorded below.</p></article><article><h3>Next step</h3><p>Add customer and expense forms with real data fields.</p></article></div><section className="activity"><h2>Latest employee activity</h2>{activities.length ? <table><thead><tr><th>Role</th><th>Action</th><th>Time</th></tr></thead><tbody>{activities.map((item) => <tr key={item.id}><td>{item.role.replace("_", " ")}</td><td>{item.action}</td><td>{new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(item.created_at)}</td></tr>)}</tbody></table> : <p className="muted">No activity yet. Open the employee app and select a role.</p>}</section></main>;
}
