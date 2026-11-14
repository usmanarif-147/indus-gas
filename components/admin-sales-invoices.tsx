"use client";

import { useEffect, useState } from "react";
import { pakistanDate } from "@/lib/pakistan-time";
import styles from "./admin-sales-invoices.module.css";

type Delivery = { id: number; deliveryNo: string; clientName: string; branchName: string; commercialCylinderCount: number; domesticCylinderCount: number; status: number; dailyPlantRate: number | null; invoiceId: number | null };
const formatDate = (value: string) => new Intl.DateTimeFormat("en-PK", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));

export default function AdminSalesInvoices() {
  const [selectedDate, setSelectedDate] = useState(pakistanDate());
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoiceDelivery, setInvoiceDelivery] = useState<Delivery | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    fetch(`/api/admin/deliveries?date=${selectedDate}`)
      .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Unable to load supplied branches."); return payload.deliveries as Delivery[]; })
      .then((rows) => { if (active) setDeliveries(rows.filter((delivery) => delivery.status === 1)); })
      .catch((reason: Error) => { if (active) { setDeliveries([]); setError(reason.message); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedDate]);

  return <section className={styles.module}>
    <div className={styles.toolbar}><div><p className={styles.kicker}>COMPLETED SUPPLIES</p><h2>Supplied branches</h2><span>Only branches with a completed delivery appear here.</span></div><label>Supply date<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label></div>
    <div className={styles.summary}><b>{loading ? "…" : deliveries.length}</b><span>completed supply {deliveries.length === 1 ? "record" : "records"} on {formatDate(selectedDate)}</span></div>
    <div className={styles.tableWrap}><table><thead><tr><th>Delivery no.</th><th>Client</th><th>Branch</th><th>Commercial</th><th>Domestic</th><th>Invoice</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan={7} className={styles.message}>Loading supplied branches…</td></tr> : error ? <tr><td colSpan={7} className={styles.message}>{error}</td></tr> : deliveries.length === 0 ? <tr><td colSpan={7} className={styles.message}>No completed supplies for this date.</td></tr> : deliveries.map((delivery) => <tr key={delivery.id}><td><b>{delivery.deliveryNo}</b></td><td>{delivery.clientName}</td><td>{delivery.branchName}</td><td>{delivery.commercialCylinderCount}</td><td>{delivery.domesticCylinderCount}</td><td><span className={delivery.invoiceId ? styles.created : styles.pending}>{delivery.invoiceId ? "Invoice created" : "Ready for invoice"}</span></td><td>{delivery.invoiceId ? <button className={styles.action} onClick={() => window.open(`/api/admin/invoices/${delivery.invoiceId}/pdf`, "_blank")}>Download PDF</button> : delivery.dailyPlantRate ? <button className={styles.action} onClick={() => setInvoiceDelivery(delivery)}>Generate invoice</button> : <span className={styles.rateRequired}>Plant rate required</span>}</td></tr>)}</tbody></table></div>
    {invoiceDelivery && <InvoiceModal delivery={invoiceDelivery} close={() => setInvoiceDelivery(null)} generated={(invoiceId) => { setDeliveries((rows) => rows.map((item) => item.id === invoiceDelivery.id ? { ...item, invoiceId } : item)); setInvoiceDelivery(null); }} />}
  </section>;
}

function InvoiceModal({ delivery, close, generated }: { delivery: Delivery; close: () => void; generated: (invoiceId: number) => void }) {
  const [margin, setMargin] = useState(""), [error, setError] = useState(""), [saving, setSaving] = useState(false);
  async function generate() { setSaving(true); setError(""); try { const response = await fetch("/api/admin/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deliveryId: delivery.id, profitMarginPerKg: Number(margin) }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to generate invoice."); window.open(`/api/admin/invoices/${data.invoice.id}/pdf`, "_blank"); generated(data.invoice.id); } catch (issue) { setError(issue instanceof Error ? issue.message : "Unable to generate invoice."); } finally { setSaving(false); } }
  return <div className={styles.backdrop}><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="sales-invoice-modal-title"><button className={styles.close} onClick={close} aria-label="Close">×</button><p className={styles.kicker}>GENERATE INVOICE</p><h2 id="sales-invoice-modal-title">{delivery.clientName}</h2><p>{delivery.branchName}</p><p>Plant rate: <b>PKR {Number(delivery.dailyPlantRate).toLocaleString("en-PK")}</b> per 11.8 kg cylinder.</p><label>Profit margin per kg<input type="number" min="0" step="0.01" value={margin} onChange={(event) => setMargin(event.target.value)} placeholder="e.g. 25" autoFocus /></label>{error && <p className={styles.error}>{error}</p>}<div className={styles.modalActions}><button onClick={close} disabled={saving}>Cancel</button><button className="admin-button" disabled={saving || margin === ""} onClick={() => void generate()}>{saving ? "Generating…" : "Generate & download PDF"}</button></div></section></div>;
}
