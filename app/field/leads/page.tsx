"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type Coordinates = { latitude: number; longitude: number };
type LocationDetails = Coordinates & { area: string; sector: string; address: string; mapsUrl: string };
type OptionalDetails = { ownerPurchaserName: string; ownerPurchaserContact: string; currentSupplier: string; currentRatePkr: string };
type SelectionKey = "weeklyAverage" | "valveSize" | "cylinderCompany" | "restaurantOpening" | "totalBranches" | "remarks";
type Selections = Record<SelectionKey, string>;

const choices: Record<SelectionKey, string[]> = {
  weeklyAverage: ["2", "2–4", "4–8", "More than 8", "Not confirmed"],
  valveSize: ["20", "21", "22", "Not confirmed"],
  cylinderCompany: ["Same company", "Different", "Not confirmed"],
  restaurantOpening: ["1–3 months", "3–6 months", "6–12 months", "More than 12 months"],
  totalBranches: ["1", "2", "2–5", "5–10", "More than 10"],
  remarks: ["Not interested", "Interested", "Will contact later"],
};

declare global { interface Window { google?: any } }
let mapsLoader: Promise<void> | null = null;

function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve();
  if (mapsLoader) return mapsLoader;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.reject(new Error("Google Maps is not configured."));
  mapsLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps could not load."));
    document.head.appendChild(script);
  });
  return mapsLoader;
}

function TagField({ label, selectionKey, selections, onSelect, showError }: { label: string; selectionKey: SelectionKey; selections: Selections; onSelect: (key: SelectionKey, value: string) => void; showError: boolean }) {
  return <fieldset className={`tag-field ${showError && !selections[selectionKey] ? "tag-field-error" : ""}`}><legend>{label} <span className="required-star" aria-label="required">*</span></legend><div className="tag-list">{choices[selectionKey].map((choice) => <button type="button" key={choice} className={`form-tag ${selections[selectionKey] === choice ? "selected" : ""}`} onClick={() => onSelect(selectionKey, choice)} aria-pressed={selections[selectionKey] === choice}>{choice}</button>)}</div></fieldset>;
}

export default function LeadsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [step, setStep] = useState(1);
  const [restaurantName, setRestaurantName] = useState("");
  const [optionalDetails, setOptionalDetails] = useState<OptionalDetails>({ ownerPurchaserName: "", ownerPurchaserContact: "", currentSupplier: "", currentRatePkr: "" });
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [location, setLocation] = useState<LocationDetails | null>(null);
  const [locationStatus, setLocationStatus] = useState("");
  const [formError, setFormError] = useState("");
  const [triedStepTwo, setTriedStepTwo] = useState(false);
  const [triedSave, setTriedSave] = useState(false);
  const [selections, setSelections] = useState<Selections>({ weeklyAverage: "", valveSize: "", cylinderCompany: "", restaurantOpening: "", totalBranches: "", remarks: "" });
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);

  const lookupLocation = useCallback(async ({ latitude, longitude }: Coordinates) => {
    setLocationStatus("Finding location details…"); setLocation(null);
    try {
      const response = await fetch(`/api/location/reverse-geocode?lat=${latitude}&lng=${longitude}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Location details could not be found.");
      setLocation(payload); setLocationStatus("Location pinned successfully.");
    } catch (error) { setLocationStatus(error instanceof Error ? error.message : "Location details could not be found."); }
  }, []);

  useEffect(() => {
    if (step !== 3) { map.current = null; marker.current = null; return; }
    if (!coordinates || !mapElement.current) return;
    const currentCoordinates = coordinates;
    let cancelled = false;
    async function showMap() {
      try {
        await loadGoogleMaps();
        if (cancelled || !mapElement.current) return;
        const position = { lat: currentCoordinates.latitude, lng: currentCoordinates.longitude };
        if (!map.current) {
          map.current = new window.google.maps.Map(mapElement.current, { center: position, zoom: 17, mapTypeControl: false, streetViewControl: false, fullscreenControl: false });
          marker.current = new window.google.maps.Marker({ map: map.current, position, draggable: true, title: "Restaurant location" });
          marker.current.addListener("dragend", () => { const draggedPosition = marker.current.getPosition(); if (draggedPosition) setCoordinates({ latitude: draggedPosition.lat(), longitude: draggedPosition.lng() }); });
        } else { map.current.setCenter(position); marker.current?.setPosition(position); }
      } catch (error) { setLocationStatus(error instanceof Error ? error.message : "Google Maps could not load."); }
    }
    void showMap(); void lookupLocation(currentCoordinates);
    return () => { cancelled = true; };
  }, [coordinates, lookupLocation, step]);

  function pinCurrentLocation() {
    if (!navigator.geolocation) { setLocationStatus("This phone does not support GPS location."); return; }
    setLocationStatus("Getting your current GPS location…");
    navigator.geolocation.getCurrentPosition(({ coords }) => setCoordinates({ latitude: coords.latitude, longitude: coords.longitude }), () => setLocationStatus("Location permission was not granted. Please allow location access and try again."), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }

  function selectTag(key: SelectionKey, value: string) { setSelections((current) => ({ ...current, [key]: value })); setFormError(""); }
  function nextFromDetails() { if (!restaurantName.trim()) { setFormError("Enter the restaurant name to continue."); return; } setFormError(""); setStep(2); }
  function nextFromTags() { setTriedStepTwo(true); if (Object.values(selections).some((value) => !value)) { setFormError("Select one option in every section to continue."); return; } setFormError(""); setStep(3); }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setTriedSave(true);
    if (!location || !coordinates) { setFormError("Pin the restaurant location before saving."); return; }
    console.info("Indus Gas lead payload (frontend test only)", {
      restaurantName, ownerPurchaserName: optionalDetails.ownerPurchaserName || null, ownerPurchaserContact: optionalDetails.ownerPurchaserContact || null, currentSupplier: optionalDetails.currentSupplier || null, currentRatePkr: optionalDetails.currentRatePkr || null,
      weeklyAverageCylinders: selections.weeklyAverage, valveSize: selections.valveSize, cylinderCompany: selections.cylinderCompany, restaurantOpening: selections.restaurantOpening, totalBranches: selections.totalBranches, meetingRemark: selections.remarks,
      location: { areaZone: location.area, sectorSocietyTown: location.sector, exactLocation: location.address, latitude: location.latitude, longitude: location.longitude, shareableGoogleMapsLink: location.mapsUrl },
    });
    setFormError(""); setSaved(true);
  }

  function resetForm() {
    setSaved(false); setFormOpen(false); setStep(1); setRestaurantName(""); setOptionalDetails({ ownerPurchaserName: "", ownerPurchaserContact: "", currentSupplier: "", currentRatePkr: "" }); setCoordinates(null); setLocation(null); setLocationStatus(""); setFormError(""); setTriedStepTwo(false); setTriedSave(false);
    setSelections({ weeklyAverage: "", valveSize: "", cylinderCompany: "", restaurantOpening: "", totalBranches: "", remarks: "" }); map.current = null; marker.current = null;
  }

  return <main className="field-shell"><section className="field-page form-page">
    <Link href="/field/home" className="back">← Back to home</Link><span className="page-icon">◌</span><p className="eyebrow">SALESMAN · LEADS</p><h1>Restaurant leads</h1><p className="muted">Add a restaurant after your meeting. It becomes a client after its first order.</p>
    {!formOpen && !saved && <button className="button wide-action" onClick={() => setFormOpen(true)}>+ Add new lead</button>}
    {saved ? <div className="success-card"><span>✓</span><h2>Lead ready for testing</h2><p>Form data was printed in your browser console. Nothing has been saved yet.</p><button className="button" onClick={resetForm}>Add another lead</button></div> : formOpen && <form className="simple-form" onSubmit={submit}>
      <div className="form-steps" aria-label={`Step ${step} of 3`}><span className={step >= 1 ? "active" : ""}>1</span><i /><span className={step >= 2 ? "active" : ""}>2</span><i /><span className={step >= 3 ? "active" : ""}>3</span></div><p className="step-label">Step {step} of 3</p>
      {formError && <p className="form-error">{formError}</p>}
      {step === 1 && <><h2 className="step-heading">Restaurant details</h2><label>Restaurant name <span className="required-star" aria-label="required">*</span><input name="restaurantName" required value={restaurantName} onChange={(event) => setRestaurantName(event.target.value)} placeholder="e.g. Khan Baba Shinwari" /></label><section className="optional-details"><p className="eyebrow">OPTIONAL DETAILS</p><label>Owner / purchaser name<input name="ownerPurchaserName" value={optionalDetails.ownerPurchaserName} onChange={(event) => setOptionalDetails((current) => ({ ...current, ownerPurchaserName: event.target.value }))} placeholder="e.g. Afzal Khan" /></label><label>Owner / purchaser contact number<input name="ownerPurchaserContact" type="tel" value={optionalDetails.ownerPurchaserContact} onChange={(event) => setOptionalDetails((current) => ({ ...current, ownerPurchaserContact: event.target.value }))} placeholder="e.g. 0300 1234567" /></label><label>Current supplier<input name="currentSupplier" value={optionalDetails.currentSupplier} onChange={(event) => setOptionalDetails((current) => ({ ...current, currentSupplier: event.target.value }))} placeholder="e.g. Akhtar Khan" /></label><label>Current rate (PKR)<input name="currentRatePkr" type="number" min="0" value={optionalDetails.currentRatePkr} onChange={(event) => setOptionalDetails((current) => ({ ...current, currentRatePkr: event.target.value }))} placeholder="e.g. 18500" /></label></section><button className="button form-button" type="button" onClick={nextFromDetails}>Next</button></>}
      {step === 2 && <><h2 className="step-heading">Quick meeting details</h2><TagField label="Weekly average cylinders" selectionKey="weeklyAverage" selections={selections} onSelect={selectTag} showError={triedStepTwo} /><TagField label="Valve size" selectionKey="valveSize" selections={selections} onSelect={selectTag} showError={triedStepTwo} /><TagField label="Cylinder company" selectionKey="cylinderCompany" selections={selections} onSelect={selectTag} showError={triedStepTwo} /><TagField label="Restaurant opening" selectionKey="restaurantOpening" selections={selections} onSelect={selectTag} showError={triedStepTwo} /><TagField label="Total branches" selectionKey="totalBranches" selections={selections} onSelect={selectTag} showError={triedStepTwo} /><TagField label="Meeting result" selectionKey="remarks" selections={selections} onSelect={selectTag} showError={triedStepTwo} /><div className="step-actions"><button className="secondary-button" type="button" onClick={() => { setFormError(""); setStep(1); }}>Previous</button><button className="button" type="button" onClick={nextFromTags}>Next</button></div></>}
      {step === 3 && <><h2 className="step-heading">Pin restaurant location</h2><section className={`location-capture ${triedSave && (!coordinates || !location) ? "location-error" : ""}`} aria-labelledby="location-title"><div><p className="eyebrow">LOCATION <span className="required-star" aria-label="required">*</span></p><h2 id="location-title">Pin current location</h2><p>Stand at the restaurant and press the button. Drag the pin if needed.</p></div><button className="button wide-action" type="button" onClick={pinCurrentLocation}>📍 Pin current location</button>{coordinates && <div ref={mapElement} className="google-map" aria-label="Restaurant location map" />}{locationStatus && <p className="pin-note">{locationStatus}</p>}</section><div className="step-actions"><button className="secondary-button" type="button" onClick={() => { setFormError(""); setStep(2); }}>Previous</button><button className="button" type="submit">Save lead</button></div></>}
    </form>}
  </section></main>;
}
