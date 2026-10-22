"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminClientFormModal, { ClientRecord } from "./admin-client-form-modal";
import AdminConfirmModal from "./admin-confirm-modal";
import styles from "./admin-clients-manager.module.css";
import branchStatusStyles from "./admin-client-branch-status.module.css";
import branchPopupStyles from "./admin-client-branch-popup.module.css";

type ClientRow = ClientRecord & { branch_count: number; active_branch_count: number; inactive_branch_count: number };
type Branch = { id: number; branch_code: string; branch_name: string; area: string | null; address: string | null; is_active: number; contact_person: { name: string; phone: string }[] };
const PAGE_SIZE = 8;

export default function AdminClientsManager() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formClient, setFormClient] = useState<ClientRecord | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<ClientRow | null>(null);
  const [branchClient, setBranchClient] = useState<ClientRow | null>(null);
  async function load() { setLoading(true); try { const response = await fetch("/api/admin/clients"); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load clients."); setClients(data.clients); } catch (issue) { setError(issue instanceof Error ? issue.message : "Unable to load clients."); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => clients.filter((client) => `${client.client_code} ${client.client_name}`.toLowerCase().includes(search.toLowerCase())), [clients, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)), currentPage = Math.min(page, pages), rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  async function deleteClient() { if (!deleting) return; const response = await fetch(`/api/admin/clients/${deleting.id}`, { method: "DELETE" }); const data = await response.json(); if (!response.ok) { setDeleting(null); setError(data.error || "Unable to delete client."); return; } setDeleting(null); setNotice("Client deleted."); await load(); }
  return <div className={styles.module}>
    {notice && <p className={styles.notice}>{notice}</p>}{error && <p className={styles.error}>{error}</p>}
    <div className={styles.toolbar}><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search parent business name or code" /><button className="admin-button" onClick={() => setFormClient(null)}>+ Add client</button></div>
    <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Client code</th><th>Parent business</th><th>Type</th><th>Payment</th><th>Branches</th><th>Branch status</th><th>Actions</th></tr></thead><tbody>
      {loading ? <tr><td colSpan={7} className={styles.tableEmpty}>Loading clients…</td></tr> : rows.length === 0 ? <tr><td colSpan={7} className={styles.tableEmpty}>No clients found. Create your first confirmed client.</td></tr> : rows.map((client) => <tr key={client.id}><td>{client.client_code}</td><td><b>{client.client_name}</b>{client.ntn && <small>NTN: {client.ntn}</small>}</td><td>{client.client_type ? "GST" : "Non-GST"}</td><td>{client.payment_method ? "On-spot cash" : "Bill to bill"}</td><td>{client.branch_count}</td><td><button className={branchStatusStyles.button} onClick={() => setBranchClient(client)}>Active: {client.active_branch_count} · Inactive: {client.inactive_branch_count}</button></td><td><div className={styles.rowActions}><Link href={`/admin/clients/${client.id}`}>View</Link><button onClick={() => setFormClient(client)}>Edit</button><button className={styles.dangerText} onClick={() => setDeleting(client)}>Delete</button></div></td></tr>)}
    </tbody></table></div>
    <div className={styles.pagination}><span>Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}</span><div><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><b>Page {currentPage} of {pages}</b><button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Next</button></div></div>
    {formClient !== undefined && <AdminClientFormModal client={formClient ?? undefined} onClose={() => setFormClient(undefined)} onSaved={async () => { setNotice(formClient ? "Client updated." : "Client created."); setPage(1); await load(); }} />}
    {branchClient && <ClientBranchesModal client={branchClient} close={() => setBranchClient(null)} />}
    {deleting && <AdminConfirmModal title="Delete client?" text={`This will delete ${deleting.client_name}. Remove its branches and related records first.`} onCancel={() => setDeleting(null)} onConfirm={deleteClient} />}
  </div>;
}

function ClientBranchesModal({ client, close }: { client: ClientRow; close: () => void }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  useEffect(() => { fetch(`/api/admin/clients/${client.id}/branches`).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load branches."); setBranches(data.branches); }).catch((issue) => setError(issue instanceof Error ? issue.message : "Unable to load branches.")); }, [client.id]);
  const filtered = useMemo(() => branches.filter((branch) => {
    const matchesStatus = status === "all" || (status === "active" ? branch.is_active === 1 : branch.is_active === 0);
    const haystack = `${branch.branch_name} ${branch.area || ""} ${branch.address || ""}`.toLowerCase();
    return matchesStatus && haystack.includes(search.toLowerCase());
  }), [branches, search, status]);
  return <div className={styles.modalBackdrop}><section className={styles.formModal} role="dialog" aria-modal="true"><button className={styles.close} onClick={close} aria-label="Close">×</button><p className={styles.modalKicker}>{client.client_code}</p><h2>{client.client_name} outlets</h2><p className={styles.helper}>Active and inactive outlets linked with this parent business.</p>{error && <p className={styles.error}>{error}</p>}<div className={branchPopupStyles.filters}><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search outlet, area, or address" /><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">All statuses</option><option value="active">Active only</option><option value="inactive">Inactive only</option></select></div>{!error && branches.length === 0 ? <p className={styles.emptyInline}>Loading outlets…</p> : filtered.length === 0 ? <p className={styles.emptyInline}>No outlets match these filters.</p> : <div className={styles.branchList}>{filtered.map((branch) => <article key={branch.id}><div><strong>{branch.branch_name}</strong><span>{branch.branch_code}{branch.area ? ` · ${branch.area}` : ""}</span><small>{branch.contact_person?.map((contact) => `${contact.name} ${contact.phone}`).join(" · ") || "No contact person"}</small></div><span className={branch.is_active ? styles.active : styles.inactive}>{branch.is_active ? "Active" : "Inactive"}</span></article>)}</div>}<div className={styles.modalActions}><button onClick={close}>Close</button></div></section></div>;
}
