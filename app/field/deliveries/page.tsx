"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Delivery = { id: number; clientName: string; branchName: string; area: string | null; address: string | null; requestedCommercialCylinders: number; requestedDomesticCylinders: number; status: number; routeSequence: number | null; contacts: { name?: string; phone?: string }[] | null };
const date = new Date().toISOString().slice(0, 10);

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { void (async () => { try { const response = await fetch(`/api/field/deliveries?date=${date}`, { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load today’s plan."); setDeliveries(data.deliveries); } catch (issue) { setError(issue instanceof Error ? issue.message : "Unable to load today’s plan."); } finally { setLoading(false); } })(); }, []);
  const completed = deliveries.filter((delivery) => delivery.status === 1).length;
  const pending = deliveries.length - completed;
  return <main className="field-shell"><section className="field-page">
    <Link href="/field/home" className="back">← Back to home</Link>
    <div className="date-pill">{date}</div><h1>Today’s Plan</h1>
    <div className="delivery-stats" aria-label="Today’s task summary"><div className="stat-total"><span>Total deliveries</span><strong>{deliveries.length}</strong></div><div className="stat-completed"><span>Completed</span><strong>{completed}</strong></div><div className="stat-pending"><span>Pending</span><strong>{pending}</strong></div></div>
    {error && <p className="form-error">{error}</p>}
    {loading ? <p className="muted">Loading deliveries…</p> : !deliveries.length ? <p className="muted">No deliveries are assigned to you today.</p> : <div className="delivery-list plan-task-list">{deliveries.map((delivery, index) => { const contact = delivery.contacts?.[0]; const mapUrl = delivery.address?.startsWith("https://") ? delivery.address : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.address || delivery.area || delivery.branchName)}`; return <article key={delivery.id} className="delivery-card"><Link className="delivery-main" href={`/field/deliveries/${delivery.id}`}><span className="delivery-number">{delivery.routeSequence || index + 1}</span><div className="delivery-info"><div className="delivery-title"><strong>{delivery.clientName}</strong><span className="area-tag">📍 {delivery.branchName}{delivery.area ? ` · ${delivery.area}` : ""}</span></div><div className="cylinder-tags">{delivery.requestedCommercialCylinders > 0 && <span className="cylinder-tag cylinder-45"><b>{delivery.requestedCommercialCylinders} cylinders</b><small>45.4 kg requested</small></span>}{delivery.requestedDomesticCylinders > 0 && <span className="cylinder-tag cylinder-11"><b>{delivery.requestedDomesticCylinders} cylinders</b><small>11.8 kg requested</small></span>}</div>{contact?.phone && <span className="receiver">☎ <b>{contact.name || "Branch contact"}</b> · {contact.phone}</span>}</div><span className="record-button">{delivery.status === 1 ? "Completed" : "Record delivery"} <span>→</span></span></Link><a className="map-link" href={mapUrl} target="_blank" rel="noreferrer">Open map <span>↗</span></a></article>; })}</div>}
  </section></main>;
}
