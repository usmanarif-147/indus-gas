"use client";

import { useMemo, useState } from "react";
import { pakistanDate } from "@/lib/pakistan-time";
import styles from "./admin-daily-operations-v2.module.css";

const tasks = [{ no: "T-001", type: "Delivery", assigned: "Ali Raza" }, { no: "T-002", type: "Filling", assigned: "Ali Raza" }, { no: "T-003", type: "Delivery", assigned: "Bilal Ahmad" }, { no: "T-004", type: "Delivery", assigned: "Ali Raza" }];
const dateLabel = (value: string) => new Intl.DateTimeFormat("en-PK", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));

export default function AdminDailyOperationsV2() {
  const [selectedDate, setSelectedDate] = useState(pakistanDate());
  const [showComingSoon, setShowComingSoon] = useState(false);
  const today = pakistanDate(), mode = selectedDate < today ? "past" : selectedDate === today ? "today" : "future";
  const rows = useMemo(() => mode === "past" ? tasks.slice(0, 2) : tasks, [mode]);
  return <div className={styles.module}>
    <section className={styles.filterCard}><div><p className={styles.kicker}>DAILY TASK BOARD</p><h2>Choose a work date</h2><p>Review past work, monitor today, or prepare future plans.</p></div><label>Task date<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label></section>
    <section className={`${styles.dateBanner} ${styles[mode]}`}><span>{mode === "past" ? "◷" : mode === "today" ? "●" : "◌"}</span><div><b>{dateLabel(selectedDate)}</b><small>{mode === "past" ? "History view - task changes are locked." : mode === "today" ? "Today - manage and monitor today’s work." : "Future plan - prepare tasks before the workday begins."}</small></div><mark>{rows.length} task{rows.length === 1 ? "" : "s"}</mark></section>
    <div className={styles.toolbar}><div><h2>Tasks</h2><p>Design preview with sample tasks only.</p></div><button className="admin-button" onClick={() => setShowComingSoon(true)}>+ Add task</button></div>
    <div className={styles.tableWrap}><table><thead><tr><th>Task number</th><th>Type</th><th>Assigned to</th><th>Actions</th></tr></thead><tbody>{rows.map((task) => <tr key={task.no}><td><b>{task.no}</b></td><td><span className={task.type === "Delivery" ? styles.delivery : styles.filling}>{task.type === "Delivery" ? "▣" : "◌"} {task.type}</span></td><td>{task.assigned}</td><td><div className={styles.actions}><button onClick={() => setShowComingSoon(true)}>View</button><button onClick={() => setShowComingSoon(true)}>Manage</button></div></td></tr>)}</tbody></table></div>
    <p className={styles.footer}>Showing {rows.length} sample task{rows.length === 1 ? "" : "s"} for {dateLabel(selectedDate)}.</p>
    {showComingSoon && <div className={styles.backdrop}><section className={styles.modal} role="dialog" aria-modal="true"><button className={styles.close} onClick={() => setShowComingSoon(false)} aria-label="Close">×</button><span>◈</span><p className={styles.kicker}>COMING SOON</p><h2>Task creation is next</h2><p>This V2 screen is currently a UI prototype. Task creation and management will be added after the design is approved.</p><button className="admin-button" onClick={() => setShowComingSoon(false)}>Got it</button></section></div>}
  </div>;
}
