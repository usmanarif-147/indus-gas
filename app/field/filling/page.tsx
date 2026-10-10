"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

export default function PlantPurchasingPage() {
  const [standardRate, setStandardRate] = useState(4580);
  const [showRateForm, setShowRateForm] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [rateSaved, setRateSaved] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);
  const [planned45, setPlanned45] = useState(16);
  const [planned11, setPlanned11] = useState(0);
  const perKg = useMemo(() => standardRate / 11.8, [standardRate]);
  const rate45 = useMemo(() => perKg * 45.4, [perKg]);
  const purchaseValue = useMemo(() => planned45 * rate45 + planned11 * standardRate, [planned45, planned11, rate45, standardRate]);
  const amount = (value: number) => `PKR ${Math.round(value).toLocaleString("en-PK")}`;
  function saveRate(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setRateSaved(true); setShowRateForm(false); }
  function savePlan(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPlanSaved(true); setShowPlanForm(false); }

  return <main className="field-shell"><section className="field-page form-page">
    <Link href="/field/home" className="back">← Back to home</Link>
    <div className="plant-page-heading"><p className="eyebrow">ADMIN · DAILY PLANT OPERATIONS</p><h1>Plant &amp; Purchasing</h1><p className="muted">Dummy design data only. Nothing is saved yet.</p></div>
    <section className="daily-rate-card">
      <div><p className="eyebrow">DAILY LPG RATE · 09-10-2026</p><h2>{amount(standardRate)} <span>for 11.8 kg</span></h2><p>This rate is saved every day, even when there is no purchase.</p></div>
      <div className="rate-breakdown"><div><span>Per kg</span><strong>{amount(perKg)}</strong></div><div><span>45.4 kg rate</span><strong>{amount(rate45)}</strong></div></div>
      <button className="secondary-button" type="button" onClick={() => { setShowRateForm(!showRateForm); setRateSaved(false); }}>{showRateForm ? "Close rate form" : "Update daily rate"}</button>
      {rateSaved && <p className="plant-success">Daily rate saved for testing.</p>}
      {showRateForm && <form className="simple-form compact-form" onSubmit={saveRate}><label>11.8 kg plant rate<input type="number" min="0" inputMode="numeric" value={standardRate} onChange={(event) => setStandardRate(Number(event.target.value) || 0)} /></label><button className="button form-button" type="submit">Save daily rate</button></form>}
    </section>
    <section className="plant-section">
      <div className="section-heading"><div><p className="eyebrow">DRIVER PLAN</p><h2>Today’s filling plan</h2></div><span className="plan-status">Planned</span></div>
      <div className="filling-plan-summary"><div><span>45.4 kg cylinders</span><strong>{planned45}</strong></div><div><span>11.8 kg cylinders</span><strong>{planned11 || "Not planned"}</strong></div><div><span>Vehicle arrival</span><strong>9:00 AM</strong></div></div>
      <p className="muted">The driver will see this in Today’s Plan with customer deliveries.</p>
      <button className="button wide-action" type="button" onClick={() => { setShowPlanForm(!showPlanForm); setPlanSaved(false); }}>{showPlanForm ? "Close filling plan" : "Create filling plan"}</button>
      {planSaved && <p className="plant-success">Filling plan saved for testing.</p>}
      {showPlanForm && <form className="simple-form compact-form" onSubmit={savePlan}><label>Planned 45.4 kg cylinders<input type="number" min="0" inputMode="numeric" value={planned45} onChange={(event) => setPlanned45(Number(event.target.value) || 0)} /></label><label>Planned 11.8 kg cylinders <em>(optional)</em><input type="number" min="0" inputMode="numeric" value={planned11} onChange={(event) => setPlanned11(Number(event.target.value) || 0)} /></label><label>Vehicle arrival time<input type="time" defaultValue="09:00" /></label><button className="button form-button" type="submit">Save filling plan</button></form>}
    </section>
    <section className="plant-section purchase-card"><p className="eyebrow">TODAY’S PURCHASE · DUMMY PREVIEW</p><h2>{amount(purchaseValue)}</h2><p>{planned45} × 45.4 kg and {planned11} × 11.8 kg at today’s rate.</p><div className="purchase-status"><span>Payment status</span><strong>Awaiting plant rate confirmation</strong></div></section>
    <section className="plant-section report-preview"><p className="eyebrow">PURCHASING OVERVIEW · DUMMY PREVIEW</p><div><span>Today</span><strong>{amount(purchaseValue)}</strong></div><div><span>This week</span><strong>PKR 1,127,767</strong></div><div><span>This month</span><strong>PKR 4,816,900</strong></div><div><span>This year</span><strong>PKR 52,364,500</strong></div><p className="muted">Daily, weekly, monthly, and yearly reports will use actual data after the backend is added.</p></section>
  </section></main>;
}
