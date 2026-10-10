"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type SelectionKey = "weeklyAverage" | "cylinderRequirement" | "paymentMethod";
type Selections = Record<SelectionKey, string>;

const choices: Record<SelectionKey, string[]> = {
  weeklyAverage: ["2", "2–4", "4–8", "More than 8", "Not confirmed"],
  cylinderRequirement: ["45 kg", "11.8 kg", "Both"],
  paymentMethod: ["On-spot cash", "Bill to bill", "Specific balance"],
};

function TagField({ label, selectionKey, selections, onSelect, showError }: { label: string; selectionKey: SelectionKey; selections: Selections; onSelect: (key: SelectionKey, value: string) => void; showError: boolean }) {
  return <fieldset className={`tag-field ${showError && !selections[selectionKey] ? "tag-field-error" : ""}`}><legend>{label}<span className="required-star" aria-label="required">*</span></legend><div className="tag-list">{choices[selectionKey].map((choice) => <button type="button" key={choice} className={`form-tag ${selections[selectionKey] === choice ? "selected" : ""}`} onClick={() => onSelect(selectionKey, choice)} aria-pressed={selections[selectionKey] === choice}>{choice}</button>)}</div></fieldset>;
}

export default function AddClientPage() {
  const [step, setStep] = useState(1);
  const [restaurantName, setRestaurantName] = useState("");
  const [selections, setSelections] = useState<Selections>({ weeklyAverage: "", cylinderRequirement: "", paymentMethod: "" });
  const [error, setError] = useState("");
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [saved, setSaved] = useState(false);
  function next() { if (!restaurantName.trim()) { setError("Enter the restaurant name to continue."); return; } setError(""); setStep(2); }
  function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setTriedSubmit(true); if (Object.values(selections).some((value) => !value)) { setError("Select one option in every required section."); return; } setError(""); setSaved(true); }
  function selectTag(key: SelectionKey, value: string) { setSelections((current) => ({ ...current, [key]: value })); setError(""); }

  return <main className="field-shell"><section className="field-page form-page">
    <Link href="/field/clients" className="back">← Back to clients</Link>
    <p className="eyebrow">ADMIN · CLIENTS</p><h1>Add client</h1>
    {saved ? <div className="success-card"><span>✓</span><h2>Client added for testing</h2><p>This is UI-only. The client has not been saved to the database yet.</p><Link className="button" href="/field/clients">Back to clients</Link></div> : <form className="simple-form client-form" onSubmit={save}>
      <div className="form-steps" aria-label={`Step ${step} of 2`}><span className="active">1</span><i /><span className={step === 2 ? "active" : ""}>2</span></div><p className="step-label">Step {step} of 2</p>{error && <p className="form-error">{error}</p>}
      {step === 1 && <><h2 className="step-heading">Client details</h2><label><span className="input-label">Restaurant name<span className="required-star" aria-label="required">*</span></span><input required value={restaurantName} onChange={(event) => setRestaurantName(event.target.value)} placeholder="e.g. Khan Baba Shinwari" /></label><section className="optional-details"><p className="eyebrow">OPTIONAL DETAILS</p><label>Owner name<input placeholder="e.g. Afzal Khan" /></label><label>Owner contact number<input type="tel" placeholder="e.g. 0300 1234567" /></label><label>Purchaser name<input placeholder="e.g. Mohsin" /></label><label>Purchaser contact number<input type="tel" placeholder="e.g. 0321 4567890" /></label></section><button className="button form-button" type="button" onClick={next}>Next</button></>}
      {step === 2 && <><h2 className="step-heading">Requirements and payment</h2><TagField label="Weekly average cylinders" selectionKey="weeklyAverage" selections={selections} onSelect={selectTag} showError={triedSubmit} /><TagField label="Cylinder requirement" selectionKey="cylinderRequirement" selections={selections} onSelect={selectTag} showError={triedSubmit} /><TagField label="Payment method" selectionKey="paymentMethod" selections={selections} onSelect={selectTag} showError={triedSubmit} /><label>Google Maps location link <em>(optional)</em><input type="url" placeholder="Paste Google Maps link" /></label><div className="step-actions"><button className="secondary-button" type="button" onClick={() => { setError(""); setStep(1); }}>Previous</button><button className="button" type="submit">Add client</button></div></>}
    </form>}
  </section></main>;
}
