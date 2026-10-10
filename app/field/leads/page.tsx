"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type Coordinates = { latitude: number; longitude: number };
type LocationDetails = Coordinates & { area: string; sector: string; address: string; mapsUrl: string };
type OptionalDetails = { ownerPurchaserName: string; ownerPurchaserContact: string; currentSupplier: string; currentRatePkr: string; specificBalancePkr: string };
type SelectionKey = "weeklyAverage" | "cylinderSize" | "valveSize" | "cylinderCompany" | "vaporizerMachine" | "paymentTerms" | "remarks";
type Selections = Record<SelectionKey, string>;
type LeadPayload = OptionalDetails & { restaurantName: string; weeklyAverageCylinders: string; cylinderSize: string; valveSize: string; cylinderCompany: string; vaporizerMachine: string; paymentTerms: string; meetingRemark: string; location: { areaZone: string; sectorSocietyTown: string; exactLocation: string; latitude: number; longitude: number; shareableGoogleMapsLink: string } | null };

const choices: Record<SelectionKey, string[]> = {
  weeklyAverage: ["2", "2–4", "4–8", "More than 8", "Not confirmed"],
  cylinderSize: ["45.4 kg", "11.8 kg", "Both", "Not confirmed"],
  valveSize: ["20", "21", "22", "Not confirmed"],
  cylinderCompany: ["Same company", "Different", "Not confirmed"],
  vaporizerMachine: ["Available", "Not available", "Not confirmed"],
  paymentTerms: ["On-spot cash", "Bill to bill", "Specific balance", "Not confirmed"],
  remarks: ["Not interested", "Interested", "Will contact later"],
};
const equipmentKeys: SelectionKey[] = ["weeklyAverage", "cylinderSize", "valveSize", "cylinderCompany", "vaporizerMachine"];

declare global { interface Window { google?: any } }
let mapsLoader: Promise<void> | null = null;

function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve();
  if (mapsLoader) return mapsLoader;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.reject(new Error("Google Maps is not configured."));
  mapsLoader = new Promise((resolve, reject) => { const script = document.createElement("script"); script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`; script.async = true; script.onload = () => resolve(); script.onerror = () => reject(new Error("Google Maps could not load.")); document.head.appendChild(script); });
  return mapsLoader;
}

function TagField({ label, selectionKey, selections, onSelect, showError }: { label: string; selectionKey: SelectionKey; selections: Selections; onSelect: (key: SelectionKey, value: string) => void; showError: boolean }) {
  return <fieldset className={`tag-field ${showError && !selections[selectionKey] ? "tag-field-error" : ""}`}><legend>{label}<span className="required-star" aria-label="required">*</span></legend><div className="tag-list">{choices[selectionKey].map((choice) => <button type="button" key={choice} className={`form-tag ${selections[selectionKey] === choice ? "selected" : ""}`} onClick={() => onSelect(selectionKey, choice)} aria-pressed={selections[selectionKey] === choice}>{choice}</button>)}</div></fieldset>;
}

function Steps({ step }: { step: number }) { return <><div className="form-steps" aria-label={`Step ${step} of 3`}><span className={step >= 1 ? "active" : ""}>1</span><i /><span className={step >= 2 ? "active" : ""}>2</span><i /><span className={step >= 3 ? "active" : ""}>3</span></div><p className="step-label">Step {step} of 3</p></>; }

export default function LeadsPage() {
  const [formOpen, setFormOpen] = useState(false); const [saved, setSaved] = useState(false); const [preview, setPreview] = useState<LeadPayload | null>(null); const [step, setStep] = useState(1); const [restaurantName, setRestaurantName] = useState("");
  const [optionalDetails, setOptionalDetails] = useState<OptionalDetails>({ ownerPurchaserName: "", ownerPurchaserContact: "", currentSupplier: "", currentRatePkr: "", specificBalancePkr: "" });
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null); const [location, setLocation] = useState<LocationDetails | null>(null); const [locationStatus, setLocationStatus] = useState(""); const [formError, setFormError] = useState(""); const [triedEquipment, setTriedEquipment] = useState(false); const [triedCommercial, setTriedCommercial] = useState(false); const [triedSave, setTriedSave] = useState(false);
  const [selections, setSelections] = useState<Selections>({ weeklyAverage: "", cylinderSize: "", valveSize: "", cylinderCompany: "", vaporizerMachine: "", paymentTerms: "", remarks: "" });
  const mapElement = useRef<HTMLDivElement>(null); const map = useRef<any>(null); const marker = useRef<any>(null);
  const needsLocation = selections.remarks === "Interested" || selections.remarks === "Will contact later";

  const lookupLocation = useCallback(async ({ latitude, longitude }: Coordinates) => { setLocationStatus("Finding location details…"); setLocation(null); try { const response = await fetch(`/api/location/reverse-geocode?lat=${latitude}&lng=${longitude}`); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Location details could not be found."); setLocation(payload); setLocationStatus("Location pinned successfully."); } catch (error) { setLocationStatus(error instanceof Error ? error.message : "Location details could not be found."); } }, []);

  useEffect(() => {
    if (step !== 3 || !needsLocation) { map.current = null; marker.current = null; return; }
    if (!coordinates || !mapElement.current) return;
    const currentCoordinates = coordinates; let cancelled = false;
    async function showMap() { try { await loadGoogleMaps(); if (cancelled || !mapElement.current) return; const position = { lat: currentCoordinates.latitude, lng: currentCoordinates.longitude }; if (!map.current) { map.current = new window.google.maps.Map(mapElement.current, { center: position, zoom: 17, mapTypeControl: false, streetViewControl: false, fullscreenControl: false }); marker.current = new window.google.maps.Marker({ map: map.current, position, draggable: true, title: "Restaurant location" }); marker.current.addListener("dragend", () => { const draggedPosition = marker.current.getPosition(); if (draggedPosition) setCoordinates({ latitude: draggedPosition.lat(), longitude: draggedPosition.lng() }); }); } else { map.current.setCenter(position); marker.current?.setPosition(position); } } catch (error) { setLocationStatus(error instanceof Error ? error.message : "Google Maps could not load."); } }
    void showMap(); void lookupLocation(currentCoordinates); return () => { cancelled = true; };
  }, [coordinates, lookupLocation, needsLocation, step]);

  function pinCurrentLocation() { if (!navigator.geolocation) { setLocationStatus("This phone does not support GPS location."); return; } setLocationStatus("Getting your current GPS location…"); navigator.geolocation.getCurrentPosition(({ coords }) => setCoordinates({ latitude: coords.latitude, longitude: coords.longitude }), () => setLocationStatus("Location permission was not granted. Please allow location access and try again."), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }); }
  function selectTag(key: SelectionKey, value: string) { setSelections((current) => ({ ...current, [key]: value })); setFormError(""); }
  function nextFromDetails() { if (!restaurantName.trim()) { setFormError("Enter the restaurant name to continue."); return; } setFormError(""); setStep(2); }
  function nextFromEquipment() { setTriedEquipment(true); if (equipmentKeys.some((key) => !selections[key])) { setFormError("Select one option in every section to continue."); return; } setFormError(""); setStep(3); }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setTriedSave(true); setTriedCommercial(true);
    if (!selections.paymentTerms || !selections.remarks) { setFormError("Select payment terms and meeting result before saving."); return; }
    if (selections.paymentTerms === "Specific balance" && !optionalDetails.specificBalancePkr.trim()) { setFormError("Enter the specific balance amount before saving."); return; }
    if (needsLocation && (!location || !coordinates)) { setFormError("Pin the restaurant location before saving."); return; }
    const payload: LeadPayload = { restaurantName, ...optionalDetails, weeklyAverageCylinders: selections.weeklyAverage, cylinderSize: selections.cylinderSize, valveSize: selections.valveSize, cylinderCompany: selections.cylinderCompany, vaporizerMachine: selections.vaporizerMachine, paymentTerms: selections.paymentTerms, meetingRemark: selections.remarks, location: needsLocation && location ? { areaZone: location.area, sectorSocietyTown: location.sector, exactLocation: location.address, latitude: location.latitude, longitude: location.longitude, shareableGoogleMapsLink: location.mapsUrl } : null };
    console.info("Indus Gas lead preview (frontend test only)", payload); setFormError(""); setPreview(payload);
  }
  function confirmSubmission() { if (!preview) return; console.info("Indus Gas lead confirmed (frontend test only)", preview); setPreview(null); setSaved(true); }
  function resetForm() { setSaved(false); setFormOpen(false); setPreview(null); setStep(1); setRestaurantName(""); setOptionalDetails({ ownerPurchaserName: "", ownerPurchaserContact: "", currentSupplier: "", currentRatePkr: "", specificBalancePkr: "" }); setCoordinates(null); setLocation(null); setLocationStatus(""); setFormError(""); setTriedEquipment(false); setTriedCommercial(false); setTriedSave(false); setSelections({ weeklyAverage: "", cylinderSize: "", valveSize: "", cylinderCompany: "", vaporizerMachine: "", paymentTerms: "", remarks: "" }); map.current = null; marker.current = null; }

  return <main className="field-shell"><section className="field-page form-page"><Link href="/field/home" className="back lead-back">← Back to home</Link><h1 className="lead-title">Restaurant leads</h1>
    {!formOpen && !saved && <button className="button wide-action" onClick={() => setFormOpen(true)}>+ Add new lead</button>}
    {saved ? <div className="success-card"><span>✓</span><h2>Lead confirmed for testing</h2><p>The final data was printed in your browser console. Nothing has been saved yet.</p><button className="button" onClick={resetForm}>Add another lead</button></div> : preview ? <section className="lead-preview"><p className="eyebrow">CHECK BEFORE CONFIRMING</p><h2>Lead preview</h2><div className="preview-group"><span>Restaurant</span><strong>{preview.restaurantName}</strong></div><div className="preview-grid"><div><span>Weekly average</span><strong>{preview.weeklyAverageCylinders}</strong></div><div><span>Cylinder size</span><strong>{preview.cylinderSize}</strong></div><div><span>Valve size</span><strong>{preview.valveSize}</strong></div><div><span>Cylinder company</span><strong>{preview.cylinderCompany}</strong></div><div><span>Vaporizer machine</span><strong>{preview.vaporizerMachine}</strong></div><div><span>Payment terms</span><strong>{preview.paymentTerms}</strong></div><div><span>Meeting result</span><strong>{preview.meetingRemark}</strong></div>{preview.specificBalancePkr && <div><span>Specific balance</span><strong>PKR {preview.specificBalancePkr}</strong></div>}</div>{(preview.ownerPurchaserName || preview.ownerPurchaserContact || preview.currentSupplier || preview.currentRatePkr) && <div className="preview-grid"><div><span>Owner / purchaser</span><strong>{preview.ownerPurchaserName || "—"}</strong></div><div><span>Contact</span><strong>{preview.ownerPurchaserContact || "—"}</strong></div><div><span>Current supplier</span><strong>{preview.currentSupplier || "—"}</strong></div><div><span>Current rate</span><strong>{preview.currentRatePkr ? `PKR ${preview.currentRatePkr}` : "—"}</strong></div></div>}{preview.location && <div className="preview-group"><span>Location</span><strong>{preview.location.exactLocation}</strong><a href={preview.location.shareableGoogleMapsLink} target="_blank" rel="noreferrer">Open Google Maps ↗</a></div>}<div className="step-actions"><button className="secondary-button" type="button" onClick={() => setPreview(null)}>Back and edit</button><button className="button" type="button" onClick={confirmSubmission}>Confirm submission</button></div></section> : formOpen && <form className="simple-form lead-form" onSubmit={submit}>
      <Steps step={step} />{formError && <p className="form-error">{formError}</p>}
      {step === 1 && <><h2 className="step-heading">Restaurant details</h2><label><span className="input-label">Restaurant name<span className="required-star" aria-label="required">*</span></span><input required value={restaurantName} onChange={(event) => setRestaurantName(event.target.value)} placeholder="e.g. Khan Baba Shinwari" /></label><section className="optional-details"><p className="eyebrow">OPTIONAL DETAILS</p><label>Owner / purchaser name<input value={optionalDetails.ownerPurchaserName} onChange={(event) => setOptionalDetails((current) => ({ ...current, ownerPurchaserName: event.target.value }))} placeholder="e.g. Afzal Khan" /></label><label>Owner / purchaser contact number<input type="tel" value={optionalDetails.ownerPurchaserContact} onChange={(event) => setOptionalDetails((current) => ({ ...current, ownerPurchaserContact: event.target.value }))} placeholder="e.g. 0300 1234567" /></label><label>Current supplier<input value={optionalDetails.currentSupplier} onChange={(event) => setOptionalDetails((current) => ({ ...current, currentSupplier: event.target.value }))} placeholder="e.g. Akhtar Khan" /></label><label>Current rate (PKR)<input type="number" min="0" value={optionalDetails.currentRatePkr} onChange={(event) => setOptionalDetails((current) => ({ ...current, currentRatePkr: event.target.value }))} placeholder="e.g. 18500" /></label></section><button className="button form-button" type="button" onClick={nextFromDetails}>Next</button></>}
      {step === 2 && <><h2 className="step-heading">Cylinders and equipment</h2><TagField label="Weekly average cylinders" selectionKey="weeklyAverage" selections={selections} onSelect={selectTag} showError={triedEquipment} /><TagField label="Cylinder size" selectionKey="cylinderSize" selections={selections} onSelect={selectTag} showError={triedEquipment} /><TagField label="Valve size" selectionKey="valveSize" selections={selections} onSelect={selectTag} showError={triedEquipment} /><TagField label="Cylinder company" selectionKey="cylinderCompany" selections={selections} onSelect={selectTag} showError={triedEquipment} /><TagField label="Vaporizer machine" selectionKey="vaporizerMachine" selections={selections} onSelect={selectTag} showError={triedEquipment} /><div className="step-actions"><button className="secondary-button" type="button" onClick={() => { setFormError(""); setStep(1); }}>Previous</button><button className="button" type="button" onClick={nextFromEquipment}>Next</button></div></>}
      {step === 3 && <><h2 className="step-heading">Payment, meeting and location</h2><TagField label="Payment terms" selectionKey="paymentTerms" selections={selections} onSelect={selectTag} showError={triedCommercial} />{selections.paymentTerms === "Specific balance" && <label><span className="input-label">Specific balance amount (PKR)<span className="required-star" aria-label="required">*</span></span><input type="number" min="0" value={optionalDetails.specificBalancePkr} onChange={(event) => setOptionalDetails((current) => ({ ...current, specificBalancePkr: event.target.value }))} placeholder="e.g. 100000" /></label>}<TagField label="Meeting result" selectionKey="remarks" selections={selections} onSelect={selectTag} showError={triedCommercial} />{needsLocation && <section className={`location-capture ${triedSave && (!coordinates || !location) ? "location-error" : ""}`} aria-labelledby="location-title"><div><p className="eyebrow">LOCATION<span className="required-star" aria-label="required">*</span></p><h2 id="location-title">Pin current location</h2><p>Stand at the restaurant and press the button. Drag the pin if needed.</p></div><button className="button wide-action" type="button" onClick={pinCurrentLocation}>📍 Pin current location</button>{coordinates && <div ref={mapElement} className="google-map" aria-label="Restaurant location map" />}{locationStatus && <p className="pin-note">{locationStatus}</p>}</section>}{selections.remarks === "Not interested" && <p className="skip-location-note">Location is not needed for a restaurant that is not interested.</p>}<div className="step-actions"><button className="secondary-button" type="button" onClick={() => { setFormError(""); setStep(2); }}>Previous</button><button className="button" type="submit">Save lead</button></div></>}
    </form>}
  </section></main>;
}
