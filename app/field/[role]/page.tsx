import Link from "next/link";
import { notFound } from "next/navigation";

const labels = { driver: "Driver", helper: "Helper", salesman: "Salesman" } as const;

export default async function RoleOptions({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (!(role in labels)) notFound();
  const label = labels[role as keyof typeof labels];
  return <main className="field"><Link href="/field" className="back">← Change role</Link><p className="eyebrow">{label.toUpperCase()} AREA</p><h1>What would you like to manage?</h1><div className="role-grid"><Link className="role" href={`/field/${role}/customer`}><strong>Customer</strong><span>Customer-related work</span></Link><Link className="role" href={`/field/${role}/expenses`}><strong>Expenses</strong><span>Daily expense work</span></Link></div></main>;
}
