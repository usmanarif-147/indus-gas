"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminClientFormModal, { ClientRecord } from "./admin-client-form-modal";
import AdminConfirmModal from "./admin-confirm-modal";
import styles from "./admin-clients-manager.module.css";

export default function AdminClientProfile({ clientId }: { clientId: number }) {
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  async function load() { try { const response = await fetch(`/api/admin/clients/${clientId}`); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load client."); setClient(data.client); } catch (issue) { setError(issue instanceof Error ? issue.message : "Unable to load client."); } }
  useEffect(() => { void load(); }, [clientId]);
  async function remove() { const response = await fetch(`/api/admin/clients/${clientId}`, { method: "DELETE" }); const data = await response.json(); if (!response.ok) { setDeleting(false); setError(data.error || "Remove branches before deleting this client."); return; } window.location.href = "/admin/clients"; }
  if (!client) return <p className={styles.loading}>{error || "Loading client details…"}</p>;
  return <div className={styles.module}>
    {error && <p className={styles.error}>{error}</p>}
    <div className={styles.detailHeader}><Link href="/admin/clients" className={styles.back}>← All clients</Link><div className={styles.rowActions}><button onClick={() => setEditing(true)}>Edit client</button><button className={styles.dangerText} onClick={() => setDeleting(true)}>Delete client</button></div></div>
    <section className={styles.detailCard}><div><p className={styles.modalKicker}>{client.client_code}</p><h2>{client.client_name}</h2><p className={styles.detailMeta}>Parent business profile</p></div><div className={styles.detailMeta}><span>Client type <b>{client.client_type ? "GST" : "Non-GST"}</b></span><span>Payment <b>{client.payment_method ? "On-spot cash" : "Bill to bill"}</b></span><span>NTN <b>{client.ntn || "Not provided"}</b></span></div></section>
    {editing && <AdminClientFormModal client={client} onClose={() => setEditing(false)} onSaved={async () => { setEditing(false); await load(); }} />}
    {deleting && <AdminConfirmModal title="Delete client?" text={`Delete ${client.client_name}? Remove its outlets and related records first.`} onCancel={() => setDeleting(false)} onConfirm={remove} />}
  </div>;
}
