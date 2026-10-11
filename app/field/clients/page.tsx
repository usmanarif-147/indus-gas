import Link from "next/link";

const clients = [
  { id: 1, title: "Khan Baba Shinwari", deliveredOn: "08-10-2026", cylinders: [{ size: "45.4 kg", count: 5 }] },
  { id: 2, title: "ETEN Restaurant", deliveredOn: "07-10-2026", cylinders: [{ size: "45.4 kg", count: 4 }, { size: "11.8 kg", count: 2 }] },
  { id: 3, title: "Food Street Grill", deliveredOn: "06-10-2026", cylinders: [{ size: "11.8 kg", count: 6 }] },
  { id: 4, title: "Lahori BBQ", deliveredOn: "05-10-2026", cylinders: [{ size: "45.4 kg", count: 8 }] },
  { id: 5, title: "City Bites", deliveredOn: "03-10-2026", cylinders: [{ size: "45.4 kg", count: 3 }] },
];

export default function ClientsPage() {
  return <main className="field-shell"><section className="field-page">
    <Link href="/field/home" className="back">← Back to home</Link>
    <p className="eyebrow">ADMIN · CLIENTS</p>
    <div className="clients-header"><h1>Clients</h1><div className="client-actions"><Link href="/field/clients/add" className="button add-client-button">+ Add client</Link></div></div>
    <p className="muted">Closing balance shows how many company cylinders are currently with each client.</p>
    <div className="client-list">{clients.map((client) => <article key={client.id} className="client-card">
      <span className="client-number">{client.id}</span>
      <div className="client-main"><strong>{client.title}</strong><span>Last delivery: {client.deliveredOn}</span></div>
      <div className="client-balance"><span>With client</span><div>{client.cylinders.map((cylinder) => <strong key={cylinder.size}>{cylinder.count} <small>{cylinder.size}</small></strong>)}</div></div>
    </article>)}</div>
  </section></main>;
}
