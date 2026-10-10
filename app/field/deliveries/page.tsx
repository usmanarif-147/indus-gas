import Link from "next/link";

const deliveries = [
  { id: 1, title: "Khan Baba Shinwari", area: "Johar Town", receiver: "Afzal Khan", contact: "0300 1234567", cylinders: [{ count: 4, size: "45.4 kg" }] },
  { id: 2, title: "ETEN Restaurant", area: "Canal Road", receiver: "Mohsin Ali", contact: "0321 4567890", cylinders: [{ count: 3, size: "45.4 kg" }] },
  { id: 3, title: "Food Street Grill", area: "Gulberg", receiver: "Bilal Ahmed", contact: "0301 1122334", cylinders: [{ count: 2, size: "11.8 kg" }] },
  { id: 4, title: "Lahori BBQ", area: "Model Town", receiver: "Adeel Hussain", contact: "0333 9876543", cylinders: [{ count: 3, size: "45.4 kg" }, { count: 2, size: "11.8 kg" }] },
  { id: 5, title: "City Bites", area: "Wapda Town", receiver: "Usman Raza", contact: "0308 7654321", cylinders: [{ count: 2, size: "45.4 kg" }] },
];

type DeliveryTask = { type: "delivery"; delivery: typeof deliveries[number] };
type FillingTask = { type: "filling"; planned45: number; planned11: number; arrival: string };
const tasks: Array<DeliveryTask | FillingTask> = [
  { type: "filling", planned45: 16, planned11: 0, arrival: "9:00 AM" },
  ...deliveries.map((delivery) => ({ type: "delivery" as const, delivery })),
];

export default function DeliveriesPage() {
  const pendingTasks = tasks.length;
  return <main className="field-shell"><section className="field-page">
    <Link href="/field/home" className="back">← Back to home</Link>
    <div className="date-pill">09-10-2026</div>
    <h1>Today’s Plan</h1>
    <div className="delivery-stats" aria-label="Today’s task summary">
      <div className="stat-total"><span>Total tasks</span><strong>{tasks.length}</strong></div>
      <div className="stat-completed"><span>Completed</span><strong>0</strong></div>
      <div className="stat-pending"><span>Pending</span><strong>{pendingTasks}</strong></div>
    </div>
    <div className="delivery-list plan-task-list">{tasks.map((task, index) => task.type === "filling" ? <article key="plant-filling" className="driver-filling-card plan-task-card">
      <div className="section-heading"><div><p className="eyebrow">TASK {index + 1} · LPG PLANT FILLING</p><h2>Filling plan</h2></div><span className="plan-status">{task.arrival}</span></div>
      <p>Load empty cylinders and go to the LPG plant.</p>
      <div className="driver-filling-quantities"><div><strong>{task.planned45}</strong><span>45.4 kg cylinders</span></div><div><strong>{task.planned11 || "—"}</strong><span>11.8 kg cylinders</span></div></div>
    </article> : <article key={task.delivery.id} className="delivery-card">
      <Link className="delivery-main" href={`/field/deliveries/${task.delivery.id}`}>
        <span className="delivery-number">{index + 1}</span>
        <div className="delivery-info"><div className="delivery-title"><strong>{task.delivery.title}</strong><span className="area-tag">📍 {task.delivery.area}</span></div><div className="cylinder-tags">{task.delivery.cylinders.map((cylinder) => <span key={cylinder.size} className={`cylinder-tag ${cylinder.size === "45.4 kg" ? "cylinder-45" : "cylinder-11"}`}><b>{cylinder.count} cylinders</b><small>{cylinder.size}</small></span>)}</div><span className="receiver">☎ <b>{task.delivery.receiver}</b> · {task.delivery.contact}</span></div>
        <span className="record-button">Record delivery <span>→</span></span>
      </Link>
      <a className="map-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.delivery.area)}`} target="_blank" rel="noreferrer">Open map <span>↗</span></a>
    </article>)}</div>
  </section></main>;
}
