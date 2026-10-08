import Link from "next/link";

const deliveries = [
  { id: 1, title: "Khan Baba Shinwari", area: "Johar Town", receiver: "Afzal Khan", contact: "0300 1234567", cylinders: [{ count: 4, size: "45.4 kg" }] },
  { id: 2, title: "ETEN Restaurant", area: "Canal Road", receiver: "Mohsin Ali", contact: "0321 4567890", cylinders: [{ count: 3, size: "45.4 kg" }] },
  { id: 3, title: "Food Street Grill", area: "Gulberg", receiver: "Bilal Ahmed", contact: "0301 1122334", cylinders: [{ count: 2, size: "11.8 kg" }] },
  { id: 4, title: "Lahori BBQ", area: "Model Town", receiver: "Adeel Hussain", contact: "0333 9876543", cylinders: [{ count: 3, size: "45.4 kg" }, { count: 2, size: "11.8 kg" }] },
  { id: 5, title: "City Bites", area: "Wapda Town", receiver: "Usman Raza", contact: "0308 7654321", cylinders: [{ count: 2, size: "45.4 kg" }] },
];

export default function DeliveriesPage() {
  return <main className="field-shell"><section className="field-page">
    <Link href="/field/home" className="back">← Back to home</Link>
    <div className="date-pill">09-10-2026</div>
    <h1>Deliveries</h1>
    <div className="delivery-stats" aria-label="Delivery status summary">
      <div className="stat-total"><span>Total</span><strong>5</strong></div>
      <div className="stat-completed"><span>Completed</span><strong>0</strong></div>
      <div className="stat-pending"><span>Pending</span><strong>5</strong></div>
    </div>
    <div className="delivery-list">{deliveries.map((item) => <article key={item.id} className="delivery-card">
      <Link className="delivery-main" href={`/field/deliveries/${item.id}`}>
        <span className="delivery-number">{item.id}</span>
        <div className="delivery-info">
          <div className="delivery-title"><strong>{item.title}</strong><span className="area-tag">📍 {item.area}</span></div>
          <div className="cylinder-tags">{item.cylinders.map((cylinder) => <span key={cylinder.size} className={`cylinder-tag ${cylinder.size === "45.4 kg" ? "cylinder-45" : "cylinder-11"}`}><b>{cylinder.count} cylinders</b><small>{cylinder.size}</small></span>)}</div>
          <span className="receiver">☎ <b>{item.receiver}</b> · {item.contact}</span>
        </div>
        <span className="record-button">Record delivery <span>→</span></span>
      </Link>
      <a className="map-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.area)}`} target="_blank" rel="noreferrer">Open map <span>↗</span></a>
    </article>)}</div>
  </section></main>;
}
