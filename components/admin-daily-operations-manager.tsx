"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./admin-daily-operations-manager.module.css";
import roleStyles from "./admin-daily-operations-role-picker.module.css";
import AdminDriverPlansModal from "./admin-driver-plans-modal";
import { pakistanDate } from "@/lib/pakistan-time";

type Role = "sales_manager" | "driver";
type Employee = { id: number; name: string; role: Role };
type Branch = { id: number; clientId: number; branchName: string; clientName: string };
type Task = { id: number; operationDate: string; assignedEmployeeId: number; taskCategory: string; title: string; planOrder: number; branchId: number | null; scheduledTime: string | null; notes: string | null; status: number; createdAt: string; employeeName: string; employeeRole: Role; branchName: string | null; clientName: string | null };
type PlanningRole = "driver" | "salesman" | "office_boy";

const today = () => pakistanDate();
const dateLabel = (value: string) => new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value + "T12:00:00"));
const monthLabel = (value: string) => new Intl.DateTimeFormat("en-PK", { month: "long", year: "numeric" }).format(new Date(value + "-01T12:00:00"));
const monthValue = (date: Date) => date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");

export default function AdminDailyOperationsManager() {
  const [month, setMonth] = useState(() => pakistanDate().slice(0, 7));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState("");
  const [rolePickerDate, setRolePickerDate] = useState<string | null>(null);
  const [planningRole, setPlanningRole] = useState<PlanningRole | null>(null);
  const [driverTaskDate, setDriverTaskDate] = useState<string | null>(null);

  async function load() {
    const from = month + "-01";
    const end = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0);
    const to = end.getFullYear() + "-" + String(end.getMonth() + 1).padStart(2, "0") + "-" + String(end.getDate()).padStart(2, "0");
    try {
      const response = await fetch("/api/admin/daily-operations?from=" + from + "&to=" + to, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load daily operations.");
      setTasks(data.tasks); setEmployees(data.employees); setBranches(data.branches);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Unable to load daily operations.");
    }
  }
  useEffect(() => { void load(); }, [month]);

  const days = useMemo(() => {
    const year = Number(month.slice(0, 4)), monthIndex = Number(month.slice(5, 7)) - 1;
    const first = new Date(year, monthIndex, 1), offset = first.getDay(), total = new Date(year, monthIndex + 1, 0).getDate();
    return Array.from({ length: offset + total }, (_, index) => index < offset ? "" : month + "-" + String(index - offset + 1).padStart(2, "0"));
  }, [month]);

  function shiftMonth(delta: number) {
    const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + delta, 1);
    const next = monthValue(date);
    setMonth(next);
  }

  return <div className={styles.module}>
    {error && <p className={styles.error}>{error}</p>}
    <section className={styles.calendarCard}>
      <header><button onClick={() => shiftMonth(-1)} aria-label="Previous month">←</button><h2>{monthLabel(month)}</h2><button onClick={() => shiftMonth(1)} aria-label="Next month">→</button></header>
      <div className={styles.weekdays}>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className={styles.grid}>{days.map((day, index) => day ? <button key={day} onClick={() => { if (day >= today()) { setPlanningRole(null); setRolePickerDate(day); } }} className={[styles.day, day < today() ? styles.past : ""].join(" ")}><b>{Number(day.slice(-2))}</b>{tasks.filter((task) => task.operationDate === day).length > 0 && <span>{tasks.filter((task) => task.operationDate === day).length} plan{tasks.filter((task) => task.operationDate === day).length > 1 ? "s" : ""}</span>}</button> : <i key={index} />)}</div>
    </section>
    {rolePickerDate && <RolePicker date={rolePickerDate} role={planningRole} close={() => { setRolePickerDate(null); setPlanningRole(null); }} selectRole={setPlanningRole} openDriver={() => { setDriverTaskDate(rolePickerDate); setRolePickerDate(null); setPlanningRole(null); }} />}
    {driverTaskDate && <AdminDriverPlansModal date={driverTaskDate} employees={employees} branches={branches} tasks={tasks.filter((task) => task.operationDate === driverTaskDate && task.employeeRole === "driver")} close={() => setDriverTaskDate(null)} reload={load} />}
  </div>;
}
function RolePicker({ date, role, close, selectRole, openDriver }: { date: string; role: PlanningRole | null; close: () => void; selectRole: (role: PlanningRole | null) => void; openDriver: () => void }) {
  const choices: { id: PlanningRole; title: string; detail: string; icon: string }[] = [
    { id: "driver", title: "Driver", detail: "Filling, deliveries and vehicle work", icon: "▣" },
    { id: "salesman", title: "Salesman", detail: "Leads, collection, follow-up and inspection", icon: "◌" },
    { id: "office_boy", title: "Office Boy", detail: "Office and warehouse work", icon: "♧" },
  ];
  const selected = choices.find((choice) => choice.id === role);
  return <div className={styles.backdrop}><section className={roleStyles.roleModal} role="dialog" aria-modal="true"><button className={styles.close} onClick={close} aria-label="Close">×</button>{!selected ? <><p className={styles.kicker}>{dateLabel(date)}</p><h2>Choose employee role</h2><p className={roleStyles.roleHint}>Select who this daily operation is for.</p><div className={roleStyles.roleCards}>{choices.map((choice) => <button key={choice.id} onClick={() => choice.id === "driver" ? openDriver() : selectRole(choice.id)}><b>{choice.icon}</b><span><strong>{choice.title}</strong><small>{choice.detail}</small></span><i>→</i></button>)}</div></> : <><p className={styles.kicker}>{dateLabel(date)} · {selected.title.toUpperCase()}</p><h2>{selected.title} task</h2><div className={roleStyles.comingSoon}><b>{selected.icon}</b><h3>Coming soon</h3><p>The {selected.title.toLowerCase()} task form will be added in the next step.</p></div><div className={styles.actions}><button onClick={() => selectRole(null)}>Back</button><button onClick={close}>Close</button></div></>}</section></div>;
}
