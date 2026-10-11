"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const clients = ["Khan Baba Shinwari", "ETEN Restaurant", "Food Street Grill", "Lahori BBQ", "City Bites"];
const timeOptions = ["Morning", "Before 11:00 AM", "Before 12:00 PM", "By 8:00 PM", "Any time"];

export default function AddDeliveryOrderPage() {
  const [client, setClient] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [commercialCylinders, setCommercialCylinders] = useState("");
  const [domesticCylinders, setDomesticCylinders] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hasCylinders = Number(commercialCylinders) > 0 || Number(domesticCylinders) > 0;
    if (!client || !deliveryDate || !deliveryTime || !hasCylinders) {
      setError("Choose the client, delivery date, preferred time, and at least one cylinder quantity.");
      return;
    }
    setError("");
    setSaved(true);
  }

  return <main className="field-shell"><section className="field-page form-page">
    <Link href="/field/clients" className="back">← Back to clients</Link>
    <p className="eyebrow">ADMIN · DELIVERY ORDER</p><h1>Add delivery order</h1>
    {saved ? <div className="success-card"><span>✓</span><h2>Delivery order planned</h2><p>This is UI-only. The delivery order has not been saved or sent to the driver yet.</p><Link className="button" href="/field/clients">Back to clients</Link></div> : <form className="simple-form delivery-order-form" onSubmit={submit}>
      <p className="form-intro">Choose who needs cylinders, when they need them, and what to deliver.</p>
      {error && <p className="form-error">{error}</p>}
      <label><span className="input-label">Client<span className="required-star" aria-label="required">*</span></span><select value={client} onChange={(event) => { setClient(event.target.value); setError(""); }} required><option value="">Select client</option>{clients.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
      <section className="order-section"><h2>Delivery schedule</h2><label><span className="input-label">Delivery date<span className="required-star" aria-label="required">*</span></span><input type="date" value={deliveryDate} onChange={(event) => { setDeliveryDate(event.target.value); setError(""); }} required /></label><fieldset className="tag-field"><legend>Preferred delivery time<span className="required-star" aria-label="required">*</span></legend><div className="tag-list">{timeOptions.map((option) => <button type="button" key={option} className={`form-tag ${deliveryTime === option ? "selected" : ""}`} onClick={() => { setDeliveryTime(option); setError(""); }} aria-pressed={deliveryTime === option}>{option}</button>)}</div></fieldset></section>
      <section className="order-section"><h2>Cylinders to deliver</h2><p className="muted">Enter at least one quantity.</p><div className="cylinder-quantity-grid"><label>Commercial cylinders <span>(45.4 kg)</span><input type="number" inputMode="numeric" min="0" value={commercialCylinders} onChange={(event) => { setCommercialCylinders(event.target.value); setError(""); }} placeholder="0" /></label><label>Domestic cylinders <span>(11.8 kg)</span><input type="number" inputMode="numeric" min="0" value={domesticCylinders} onChange={(event) => { setDomesticCylinders(event.target.value); setError(""); }} placeholder="0" /></label></div></section>
      <button className="button form-button" type="submit">Plan delivery order</button>
    </form>}
  </section></main>;
}
