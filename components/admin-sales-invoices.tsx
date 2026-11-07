"use client";

import { useEffect, useState } from "react";
import { pakistanDate } from "@/lib/pakistan-time";
import styles from "./admin-sales-invoices.module.css";

type Delivery = {
  id: number;
  deliveryNo: string;
  clientName: string;
  branchName: string;
  commercialCylinderCount: number;
  domesticCylinderCount: number;
  status: number;
  invoiceId: number | null;
};

const formatDate = (value: string) => new Intl.DateTimeFormat("en-PK", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));

export default function AdminSalesInvoices() {
  const [selectedDate, setSelectedDate] = useState(pakistanDate());
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetch(`/api/admin/deliveries?date=${selectedDate}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load supplied branches.");
        return payload.deliveries as Delivery[];
      })
      .then((rows) => { if (active) setDeliveries(rows.filter((delivery) => delivery.status === 1)); })
      .catch((reason: Error) => { if (active) { setDeliveries([]); setError(reason.message); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedDate]);

  return <section className={styles.module}>
    <div className={styles.toolbar}>
      <div><p className={styles.kicker}>COMPLETED SUPPLIES</p><h2>Supplied branches</h2><span>Only branches with a completed delivery appear here.</span></div>
      <label>Supply date<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>
    </div>
    <div className={styles.summary}><b>{loading ? "…" : deliveries.length}</b><span>completed supply {deliveries.length === 1 ? "record" : "records"} on {formatDate(selectedDate)}</span></div>
    <div className={styles.tableWrap}>
      <table><thead><tr><th>Delivery no.</th><th>Client</th><th>Branch</th><th>Commercial</th><th>Domestic</th><th>Invoice</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className={styles.message}>Loading supplied branches…</td></tr> : error ? <tr><td colSpan={6} className={styles.message}>{error}</td></tr> : deliveries.length === 0 ? <tr><td colSpan={6} className={styles.message}>No completed supplies for this date.</td></tr> : deliveries.map((delivery) => <tr key={delivery.id}><td><b>{delivery.deliveryNo}</b></td><td>{delivery.clientName}</td><td>{delivery.branchName}</td><td>{delivery.commercialCylinderCount}</td><td>{delivery.domesticCylinderCount}</td><td><span className={delivery.invoiceId ? styles.created : styles.pending}>{delivery.invoiceId ? "Invoice created" : "Ready for invoice"}</span></td></tr>)}</tbody></table>
    </div>
  </section>;
}
