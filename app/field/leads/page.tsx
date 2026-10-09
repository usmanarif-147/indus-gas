"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type Coordinates = { latitude: number; longitude: number };
type LocationDetails = Coordinates & { area: string; sector: string; address: string; mapsUrl: string };

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

export default function LeadsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [location, setLocation] = useState<LocationDetails | null>(null);
  const [locationStatus, setLocationStatus] = useState("");
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);

  const lookupLocation = useCallback(async ({ latitude, longitude }: Coordinates) => {
    setLocationStatus("Finding area and society…");
    setLocation(null);
    try {
      const response = await fetch(`/api/location/reverse-geocode?lat=${latitude}&lng=${longitude}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Location details could not be found.");
      setLocation(payload);
      setLocationStatus("Location details found.");
    } catch (error) {
      setLocationStatus(error instanceof Error ? error.message : "Location details could not be found.");
    }
  }, []);

  useEffect(() => {
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
          marker.current.addListener("dragend", () => {
            const positionAfterDrag = marker.current.getPosition();
            if (positionAfterDrag) setCoordinates({ latitude: positionAfterDrag.lat(), longitude: positionAfterDrag.lng() });
          });
        } else {
          map.current.setCenter(position);
          marker.current?.setPosition(position);
        }
      } catch (error) {
        setLocationStatus(error instanceof Error ? error.message : "Google Maps could not load.");
      }
    }

    void showMap();
    void lookupLocation(currentCoordinates);
    return () => { cancelled = true; };
  }, [coordinates, lookupLocation]);

  function pinCurrentLocation() {
    if (!navigator.geolocation) { setLocationStatus("This phone does not support GPS location."); return; }
    setLocationStatus("Getting your current GPS location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setCoordinates({ latitude: coords.latitude, longitude: coords.longitude }),
      () => setLocationStatus("Location permission was not granted. Please allow location access and try again."),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaved(true); }
  function resetForm() { setSaved(false); setFormOpen(false); setCoordinates(null); setLocation(null); setLocationStatus(""); map.current = null; marker.current = null; }

  return <main className="field-shell"><section className="field-page form-page">
    <Link href="/field/home" className="back">← Back to home</Link>
    <span className="page-icon">◌</span>
    <p className="eyebrow">SALESMAN · LEADS</p>
    <h1>Restaurant leads</h1>
    <p className="muted">Add restaurants you meet. They become clients only after their first order.</p>
    {!formOpen && !saved && <button className="button wide-action" onClick={() => setFormOpen(true)}>+ Add new lead</button>}
    {saved ? <div className="success-card"><span>✓</span><h2>Lead saved for testing</h2><p>This is a design-only screen. Data is not stored yet.</p><button className="button" onClick={resetForm}>Add another lead</button></div> : formOpen && <form className="simple-form" onSubmit={submit}>
      <label>Restaurant name<input required placeholder="e.g. Khan Baba Shinwari" /></label>
      <label>Owner name<input placeholder="e.g. Afzal Khan" /></label>
      <label>Purchaser name<input placeholder="e.g. Mohsin" /></label>
      <label>Purchaser contact<input type="tel" placeholder="Optional phone number" /></label>
      <label>Current supplier<input placeholder="e.g. Akhtar Khan" /></label>
      <label>Current rate (PKR)<input type="number" min="0" placeholder="e.g. 18500" /></label>
      <label>Weekly average cylinders<input type="number" min="0" placeholder="e.g. 10" /></label>
      <label>Restaurant opening year<input type="number" min="1900" max="2100" placeholder="e.g. 1999" /></label>
      <label>Total branches<input type="number" min="1" defaultValue="1" /></label>
      <section className="location-capture" aria-labelledby="location-title">
        <div><p className="eyebrow">RESTAURANT LOCATION</p><h2 id="location-title">Pin location</h2><p>Stand at the restaurant, then press the button. You can drag the pin to correct it.</p></div>
        <button className="button wide-action" type="button" onClick={pinCurrentLocation}>📍 Pin current location</button>
        {coordinates && <div ref={mapElement} className="google-map" aria-label="Restaurant location map" />}
        <div className="location-values">
          <div><span>Area / zone</span><strong>{location?.area ?? "Will fill automatically"}</strong></div>
          <div><span>Sector / society / town</span><strong>{location?.sector ?? "Will fill automatically"}</strong></div>
          <div><span>Exact location</span><strong>{location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : "Latitude and longitude"}</strong>{location && <a href={location.mapsUrl} target="_blank" rel="noreferrer">Open in Google Maps ↗</a>}</div>
        </div>
        {locationStatus && <p className="pin-note">{locationStatus}</p>}
      </section>
      <button className="button form-button" type="submit">Save lead</button>
    </form>}
  </section></main>;
}
