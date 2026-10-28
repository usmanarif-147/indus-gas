"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pakistanDate } from "@/lib/pakistan-time";

type Delivery = { id: number; clientName: string; branchName: string; area: string | null; address: string | null; requestedCommercialCylinders: number; requestedDomesticCylinders: number; status: number; routeSequence: number | null; contacts: { name?: string; phone?: string }[] | null };
type Filling = { id: number; commercialCount: number; domesticCount: number; taskSequence: number | null; plannedTime: string | null; status: number; notes: string | null };
type PlanTask = { type: "delivery"; task: Delivery; sequence: number | null } | { type: "filling"; task: Filling; sequence: number | null };
const date = pakistanDate();

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [fillings, setFillings] = useState<Filling[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkingForUpdates, setCheckingForUpdates] = useState(false);
  const [secondsUntilCheck, setSecondsUntilCheck] = useState(30);
  const revision = useRef<string | null>(null);
  const checking = useRef(false);
  const loadPlan = useCallback(async (initial = false) => { try { const response = await fetch(`/api/field/deliveries?date=${date}`, { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load today’s plan."); setDeliveries(data.deliveries); setFillings(data.fillings); setError(""); } catch (issue) { if (initial) setError(issue instanceof Error ? issue.message : "Unable to load today’s plan."); } finally { if (initial) setLoading(false); } }, []);
  const checkForPlanUpdate = useCallback(async () => { if (document.visibilityState !== "visible" || !navigator.onLine || checking.current) return; checking.current = true; setCheckingForUpdates(true); try { const response = await fetch(`/api/field/deliveries/revision?date=${date}`, { cache: "no-store" }); const data = await response.json(); if (!response.ok) return; if (revision.current !== null && revision.current !== data.revision) await loadPlan(); revision.current = data.revision; } catch { /* A later check will retry without interrupting the driver. */ } finally { checking.current = false; setCheckingForUpdates(false); setSecondsUntilCheck(30); } }, [loadPlan]);
  useEffect(() => { void (async () => { await loadPlan(true); await checkForPlanUpdate(); })(); const timer = window.setInterval(() => { if (document.visibilityState !== "visible" || !navigator.onLine) return; setSecondsUntilCheck((seconds) => { if (seconds <= 1) { void checkForPlanUpdate(); return 30; } return seconds - 1; }); }, 1_000); return () => window.clearInterval(timer); }, [checkForPlanUpdate, loadPlan]);
  const tasks = useMemo<PlanTask[]>(() => [...deliveries.map((task) => ({ type: "delivery" as const, task, sequence: task.routeSequence })), ...fillings.map((task) => ({ type: "filling" as const, task, sequence: task.taskSequence }))].sort((a, b) => (a.sequence ?? Number.MAX_SAFE_INTEGER) - (b.sequence ?? Number.MAX_SAFE_INTEGER)), [deliveries, fillings]);
  const completed = tasks.filter((item) => item.task.status === 1).length;
  const pending = tasks.length - completed;
  return <main className="field-shell"><section className="field-page">
    <Link href="/field/home" className="back">← Back to home</Link>
    <div className="date-pill">{date}</div><h1>Today’s Plan</h1>
    <div className="plan-sync-status" aria-live="polite"><span className={checkingForUpdates ? "plan-sync-spinner" : "plan-sync-dot"} />{checkingForUpdates ? "Checking for plan updates…" : `Next automatic update check in ${secondsUntilCheck}s`}</div>
    <div className="delivery-stats" aria-label="Today’s task summary"><div className="stat-total"><span>Total tasks</span><strong>{tasks.length}</strong></div><div className="stat-completed"><span>Completed</span><strong>{completed}</strong></div><div className="stat-pending"><span>Pending</span><strong>{pending}</strong></div></div>
    {error && <p className="form-error">{error}</p>}
    {loading ? <p className="muted">Loading today’s plan…</p> : !tasks.length ? <p className="muted">No tasks are assigned to you today.</p> : <div className="delivery-list plan-task-list">{tasks.map((item, index) => {
      if (item.type === "filling") return <article key={`filling-${item.task.id}`} className="driver-filling-card plan-task-card"><div className="section-heading"><div><p className="eyebrow">TASK {index + 1} · LPG PLANT FILLING</p><h2>Filling plan</h2></div><span className="plan-status">{item.task.status === 1 ? "Completed" : item.task.plannedTime || "Planned"}</span></div><p>Go to the LPG plant for cylinder filling.</p><div className="driver-filling-quantities"><div><strong>{item.task.commercialCount || "—"}</strong><span>45.4 kg cylinders</span></div><div><strong>{item.task.domesticCount || "—"}</strong><span>11.8 kg cylinders</span></div></div>{item.task.notes && <p className="muted">{item.task.notes}</p>}</article>;
      const delivery = item.task; const contact = delivery.contacts?.[0]; const mapUrl = delivery.address?.startsWith("https://") ? delivery.address : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.address || delivery.area || delivery.branchName)}`;
      return <article key={`delivery-${delivery.id}`} className="delivery-card"><Link className="delivery-main" href={`/field/deliveries/${delivery.id}`}><span className="delivery-number">{item.sequence || index + 1}</span><div className="delivery-info"><div className="delivery-title"><strong>{delivery.clientName}</strong><span className="area-tag">📍 {delivery.branchName}{delivery.area ? ` · ${delivery.area}` : ""}</span></div><div className="cylinder-tags">{delivery.requestedCommercialCylinders > 0 && <span className="cylinder-tag cylinder-45"><b>{delivery.requestedCommercialCylinders} cylinders</b><small>45.4 kg requested</small></span>}{delivery.requestedDomesticCylinders > 0 && <span className="cylinder-tag cylinder-11"><b>{delivery.requestedDomesticCylinders} cylinders</b><small>11.8 kg requested</small></span>}</div>{contact?.phone && <span className="receiver">☎ <b>{contact.name || "Branch contact"}</b> · {contact.phone}</span>}</div><span className="record-button">{delivery.status === 1 ? "Completed" : "Record delivery"} <span>→</span></span></Link><a className="map-link" href={mapUrl} target="_blank" rel="noreferrer">Open map <span>↗</span></a></article>;
    })}</div>}
  </section></main>;
}
