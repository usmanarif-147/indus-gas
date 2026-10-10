import Link from "next/link";

export default function VisitsPage() {
  return <main className="field-shell"><section className="field-page"><Link href="/field/home" className="back">← Back to home</Link><div className="coming-card"><span>◌</span><p className="eyebrow">ADMIN</p><h1>Visits coming soon</h1><p className="muted">Visit management will be added after the mobile design is approved.</p></div></section></main>;
}
