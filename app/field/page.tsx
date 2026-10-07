import Link from "next/link";

export default function FieldPage() {
  return <main className="field"><Link href="/" className="back">← Indus Gas</Link><p className="eyebrow">EMPLOYEE APP</p><h1>Choose your role</h1><p className="muted">This MVP lets each employee open their work area.</p><div className="role-grid"><Link className="role" href="/field/driver"><strong>Driver</strong><span>Continue to options</span></Link><Link className="role" href="/field/helper"><strong>Helper</strong><span>Continue to options</span></Link><Link className="role" href="/field/salesman"><strong>Salesman</strong><span>Continue to options</span></Link></div></main>;
}
