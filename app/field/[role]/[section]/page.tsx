import Link from "next/link";
import { notFound } from "next/navigation";

const roles = ["driver", "helper", "salesman"];
const sections = ["customer", "expenses"];

export default async function ComingSoon({ params }: { params: Promise<{ role: string; section: string }> }) {
  const { role, section } = await params;
  if (!roles.includes(role) || !sections.includes(section)) notFound();
  const title = section === "customer" ? "Customer" : "Expense";
  return <main className="field"><Link href={`/field/${role}`} className="back">← Back to options</Link><p className="eyebrow">{role.toUpperCase()} · {section.toUpperCase()}</p><h1>{title} section coming soon</h1><p className="muted">This area will contain the data-entry form in the next MVP stage.</p></main>;
}
