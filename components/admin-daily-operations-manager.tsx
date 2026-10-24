"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./admin-daily-operations-manager.module.css";
import roleStyles from "./admin-daily-operations-role-picker.module.css";
import AdminDriverTaskModal from "./admin-driver-task-modal";

type Role = "sales_manager" | "driver";
type Employee = { id: number; name: string; role: Role };
type Branch = { id: number; clientId: number; branchName: string; clientName: string };
type Task = { id: number; operationDate: string; assignedEmployeeId: number; taskCategory: string; title: string; branchId: number | null; scheduledTime: string | null; notes: string | null; status: number; employeeName: string; employeeRole: Role; branchName: string | null; clientName: string | null };
type Draft = { operationDate: string; assignedEmployeeId: number; taskCategory: string; title: string; branchId: number | null; scheduledTime: string; notes: string; status: number };
type PlanningRole = "driver" | "salesman" | "office_boy";

const categoryInfo = {
  filling_visit: ["Filling visit", "Driver"],
  cylinder_delivery: ["Cylinder delivery", "Driver"],
  vehicle_task: ["Vehicle task", "Driver"],
  new_client_meeting: ["New-client meeting", "Sales manager"],
  payment_collection: ["Payment collection", "Sales manager"],
  follow_up: ["Follow-up", "Sales manager"],
  cylinder_inspection: ["Cylinder inspection", "Sales manager"],
  other: ["Other task", "Any employee"],
} as const;

const statusText = ["Planned", "Completed", "Cancelled"];
const today = () => new Date().toISOString().slice(0, 10);
const dateLabel = (value: string) => new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value + "T12:00:00"));
const monthLabel = (value: string) => new Intl.DateTimeFormat("en-PK", { month: "long", year: "numeric" }).format(new Date(value + "-01T12:00:00"));
const monthValue = (date: Date) => date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");

function blank(operationDate: string): Draft { return { operationDate, assignedEmployeeId: 0, taskCategory: "", title: "", branchId: null, scheduledTime: "", notes: "", status: 0 }; }
function taskRole(category: string) { return ["filling_visit", "cylinder_delivery", "vehicle_task"].includes(category) ? "driver" : ["new_client_meeting", "payment_collection", "follow_up", "cylinder_inspection"].includes(category) ? "sales_manager" : null; }

export default function AdminDailyOperationsManager() {
  const [month, setMonth] = useState(monthValue(new Date()));
  const [selectedDate, setSelectedDate] = useState(today());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);
  const [preview, setPreview] = useState(false);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [rolePickerDate, setRolePickerDate] = useState<string | null>(null);
  const [planningRole, setPlanningRole] = useState<PlanningRole | null>(null);
  const [driverTaskDate, setDriverTaskDate] = useState<string | null>(null);

  async function load() {
    setLoading(true);
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
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [month]);

  const selectedTasks = useMemo(() => tasks.filter((task) => task.operationDate === selectedDate), [tasks, selectedDate]);
  const days = useMemo(() => {
    const year = Number(month.slice(0, 4)), monthIndex = Number(month.slice(5, 7)) - 1;
    const first = new Date(year, monthIndex, 1), offset = first.getDay(), total = new Date(year, monthIndex + 1, 0).getDate();
    return Array.from({ length: offset + total }, (_, index) => index < offset ? "" : month + "-" + String(index - offset + 1).padStart(2, "0"));
  }, [month]);

  function shiftMonth(delta: number) {
    const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + delta, 1);
    const next = monthValue(date);
    setMonth(next);
    if (!selectedDate.startsWith(next)) setSelectedDate(next + "-01");
  }
  function openAdd() { if (selectedDate >= today()) { setPlanningRole(null); setRolePickerDate(selectedDate); } }
  function selectDate(value: string) {
    setSelectedDate(value);
    if (value >= today()) {
      setPlanningRole(null);
      setRolePickerDate(value);
    }
  }
  function openEdit(task: Task) { setEditing(task); setPreview(false); setDraft({ operationDate: task.operationDate, assignedEmployeeId: task.assignedEmployeeId, taskCategory: task.taskCategory, title: task.title, branchId: task.branchId, scheduledTime: task.scheduledTime || "", notes: task.notes || "", status: task.status }); }
  function valid() { return Boolean(draft?.operationDate && draft.assignedEmployeeId && draft.taskCategory && draft.title.trim()); }

  async function save() {
    if (!draft || !valid()) { setError("Select an employee and category, then enter a task title."); return; }
    try {
      const response = await fetch(editing ? "/api/admin/daily-operations/" + editing.id : "/api/admin/daily-operations", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save task.");
      setNotice(editing ? "Task updated." : "Task created and assigned.");
      setDraft(null); setEditing(null); setPreview(false); await load();
    } catch (issue) { setError(issue instanceof Error ? issue.message : "Unable to save task."); }
  }
  async function removeTask() {
    if (!deleting) return;
    try {
      const response = await fetch("/api/admin/daily-operations/" + deleting.id, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to remove task.");
      setNotice("Task removed."); setDeleting(null); await load();
    } catch (issue) { setDeleting(null); setError(issue instanceof Error ? issue.message : "Unable to remove task."); }
  }
  function chooseCategory(value: string) {
    const role = taskRole(value);
    setDraft((current) => {
      if (!current) return current;
      const selectedEmployee = employees.find((employee) => employee.id === current.assignedEmployeeId);
      return { ...current, taskCategory: value, assignedEmployeeId: role && selectedEmployee?.role !== role ? 0 : current.assignedEmployeeId };
    });
  }

  return <div className={styles.module}>
    {notice && <p className={styles.notice}>{notice}</p>}{error && <p className={styles.error}>{error}</p>}
    <div className={styles.intro}><div><b>Plan the day</b><span>Create work for drivers and sales managers. Tasks will later appear in the employee Plan list.</span></div><button className="admin-button" onClick={openAdd} disabled={selectedDate < today()}>+ Add task</button></div>
    <section className={styles.calendarCard}>
      <header><button onClick={() => shiftMonth(-1)} aria-label="Previous month">←</button><h2>{monthLabel(month)}</h2><button onClick={() => shiftMonth(1)} aria-label="Next month">→</button></header>
      <div className={styles.weekdays}>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className={styles.grid}>{days.map((day, index) => day ? <button key={day} onClick={() => selectDate(day)} className={[styles.day, day === selectedDate ? styles.selected : "", day < today() ? styles.past : ""].join(" ")}><b>{Number(day.slice(-2))}</b>{tasks.filter((task) => task.operationDate === day).length > 0 && <span>{tasks.filter((task) => task.operationDate === day).length} plan{tasks.filter((task) => task.operationDate === day).length > 1 ? "s" : ""}</span>}</button> : <i key={index} />)}</div>
    </section>
    <section className={styles.dayPanel}>
      <div className={styles.dayHeading}><div><p>SELECTED DATE</p><h2>{dateLabel(selectedDate)}</h2></div>{selectedDate >= today() && <button onClick={openAdd}>+ Add task</button>}</div>
      {loading ? <p className={styles.empty}>Loading tasks…</p> : selectedTasks.length === 0 ? <p className={styles.empty}>{selectedDate < today() ? "No plans were recorded for this day." : "No tasks planned. Add a task for an employee."}</p> : <div className={styles.taskList}>{selectedTasks.map((task) => <article key={task.id} className={task.status === 2 ? styles.cancelled : ""}><div className={styles.taskTop}><span className={styles["category_" + task.taskCategory]}>{categoryInfo[task.taskCategory as keyof typeof categoryInfo]?.[0] || task.taskCategory}</span><em className={styles["status" + task.status]}>{statusText[task.status]}</em></div><h3>{task.title}</h3><p><b>{task.employeeName}</b> · {task.employeeRole === "driver" ? "Driver" : "Sales manager"}{task.scheduledTime ? " · " + task.scheduledTime : ""}</p>{task.clientName && <small>{task.clientName} · {task.branchName}</small>}{task.notes && <small>{task.notes}</small>}<div className={styles.taskActions}><button onClick={() => openEdit(task)}>Edit</button><button className={styles.delete} onClick={() => setDeleting(task)}>Delete</button></div></article>)}</div>}
    </section>
    {draft && <TaskModal draft={draft} setDraft={setDraft} editing={Boolean(editing)} employees={employees} branches={branches} preview={preview} close={() => { setDraft(null); setEditing(null); setPreview(false); }} back={() => setPreview(false)} chooseCategory={chooseCategory} review={() => { if (valid()) { setError(""); setPreview(true); } else setError("Select an employee and category, then enter a task title."); }} save={save} />}
    {rolePickerDate && <RolePicker date={rolePickerDate} role={planningRole} close={() => { setRolePickerDate(null); setPlanningRole(null); }} selectRole={setPlanningRole} openDriver={() => { setDriverTaskDate(rolePickerDate); setRolePickerDate(null); setPlanningRole(null); }} />}
    {driverTaskDate && <AdminDriverTaskModal date={driverTaskDate} employees={employees} branches={branches} close={() => setDriverTaskDate(null)} saved={async () => { setNotice("Driver task created."); setDriverTaskDate(null); await load(); }} />}
    {deleting && <div className={styles.backdrop}><section className={styles.confirm}><h2>Remove task?</h2><p>This will remove “{deleting.title}” from {dateLabel(deleting.operationDate)}.</p><div><button onClick={() => setDeleting(null)}>Cancel</button><button className={styles.deleteConfirm} onClick={removeTask}>Remove task</button></div></section></div>}
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

function TaskModal({ draft, setDraft, editing, employees, branches, preview, close, back, chooseCategory, review, save }: { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft | null>>; editing: boolean; employees: Employee[]; branches: Branch[]; preview: boolean; close: () => void; back: () => void; chooseCategory: (value: string) => void; review: () => void; save: () => Promise<void> }) {
  const allowed = employees.filter((employee) => !taskRole(draft.taskCategory) || employee.role === taskRole(draft.taskCategory));
  const set = (value: Partial<Draft>) => setDraft((current) => current ? { ...current, ...value } : current);
  return <div className={styles.backdrop}><section className={styles.modal} role="dialog" aria-modal="true"><button className={styles.close} onClick={close} aria-label="Close">×</button><p className={styles.kicker}>{preview ? "PREVIEW REQUIRED" : editing ? "EDIT TASK" : "NEW DAILY TASK"}</p><h2>{preview ? "Review task" : editing ? "Edit task" : "Create task"}</h2>{!preview ? <form className={styles.form} onSubmit={(event: FormEvent) => { event.preventDefault(); review(); }}><label>Date<input type="date" min={today()} value={draft.operationDate} onChange={(event) => set({ operationDate: event.target.value })} required /></label><label>Task category<select value={draft.taskCategory} onChange={(event) => chooseCategory(event.target.value)} required><option value="">Select category</option>{Object.entries(categoryInfo).map(([key, [label]]) => <option value={key} key={key}>{label}</option>)}</select></label><label>Assign to<select value={draft.assignedEmployeeId || ""} onChange={(event) => set({ assignedEmployeeId: Number(event.target.value) })} required><option value="">Select employee</option>{allowed.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} — {employee.role === "driver" ? "Driver" : "Sales manager"}</option>)}</select></label><label>Task title<input value={draft.title} onChange={(event) => set({ title: event.target.value })} placeholder="e.g. Collect payment from Khan Baba Shinwari" required /></label><label>Client branch <small>(optional)</small><select value={draft.branchId || ""} onChange={(event) => set({ branchId: event.target.value ? Number(event.target.value) : null })}><option value="">Not linked to a client</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.clientName} — {branch.branchName}</option>)}</select></label><label>Time <small>(optional)</small><input type="time" value={draft.scheduledTime} onChange={(event) => set({ scheduledTime: event.target.value })} /></label><label className={styles.full}>Instructions <small>(optional)</small><textarea value={draft.notes} onChange={(event) => set({ notes: event.target.value })} placeholder="Important instructions for the employee" /></label>{editing && <label>Status<select value={draft.status} onChange={(event) => set({ status: Number(event.target.value) })}><option value={0}>Planned</option><option value={1}>Completed</option><option value={2}>Cancelled</option></select></label>}<div className={styles.actions}><button type="button" onClick={close}>Cancel</button><button className="admin-button" type="submit">Review task</button></div></form> : <div className={styles.preview}><div><span>Date</span><b>{dateLabel(draft.operationDate)}</b></div><div><span>Category</span><b>{categoryInfo[draft.taskCategory as keyof typeof categoryInfo]?.[0]}</b></div><div><span>Assigned to</span><b>{employees.find((employee) => employee.id === draft.assignedEmployeeId)?.name}</b></div><div><span>Task</span><b>{draft.title}</b></div>{draft.scheduledTime && <div><span>Time</span><b>{draft.scheduledTime}</b></div>}{draft.branchId && <div><span>Client branch</span><b>{branches.find((branch) => branch.id === draft.branchId)?.clientName} — {branches.find((branch) => branch.id === draft.branchId)?.branchName}</b></div>}{draft.notes && <div className={styles.full}><span>Instructions</span><b>{draft.notes}</b></div>}<div className={styles.actions}><button onClick={back}>Back to edit</button><button className="admin-button" onClick={save}>{editing ? "Update task" : "Create task"}</button></div></div>}</section></div>;
}
