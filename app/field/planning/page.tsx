"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { pakistanDate } from "@/lib/pakistan-time";

type PlanType = "delivery" | "filling" | "task";
type PlanCounts = Record<string, Record<PlanType, number>>;

const clients = ["Khan Baba Shinwari", "ETEN Restaurant", "Food Street Grill", "Lahori BBQ", "City Bites"];
const timeOptions = ["Morning", "Before 11:00 AM", "Before 12:00 PM", "By 8:00 PM", "Any time"];
const planLabels: Record<PlanType, string> = { delivery: "Delivery plan", filling: "Filling plan", task: "My task plan" };

function readableDate(value: string) {
  return new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}
function localDate(value: Date) {
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}

export default function PlanningPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [activePlan, setActivePlan] = useState<PlanType | null>(null);
  const [notice, setNotice] = useState("");
  const [counts, setCounts] = useState<PlanCounts>({ "2026-10-13": { delivery: 5, filling: 2, task: 6 } });
  const [client, setClient] = useState("");
  const [time, setTime] = useState("");
  const [commercial, setCommercial] = useState("");
  const [domestic, setDomestic] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [error, setError] = useState("");
  const today = pakistanDate();

  const events = useMemo(() => Object.entries(counts).flatMap(([date, day]) => (Object.entries(day) as [PlanType, number][]).filter(([, count]) => count > 0).map(([type, count]) => ({ id: `${date}-${type}`, start: date, title: `${count} ${type === "delivery" ? "delivery" : type === "filling" ? "filling" : "task"}${count === 1 ? "" : "s"}`, classNames: [`calendar-${type}`] }))), [counts]);

  function openPlans(date: string) { setSelectedDate(date); setActivePlan(null); setNotice(""); setError(""); }
  function dateClick(arg: DateClickArg) { if (arg.dateStr >= today) openPlans(arg.dateStr); }
  function closeModal() { setSelectedDate(""); setActivePlan(null); setError(""); }
  function removePlan(type: PlanType) {
    setCounts((current) => {
      const currentDay = current[selectedDate];
      if (!currentDay || currentDay[type] === 0) return current;
      const nextDay = { ...currentDay, [type]: currentDay[type] - 1 };
      return { ...current, [selectedDate]: nextDay };
    });
    setNotice(`One ${planLabels[type].toLowerCase()} removed from ${readableDate(selectedDate)}. This is a UI-only preview.`);
  }
  function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const needsCylinders = activePlan === "delivery" || activePlan === "filling";
    const hasCylinders = Number(commercial) > 0 || Number(domestic) > 0;
    if ((activePlan === "delivery" && (!client || !time || !hasCylinders)) || (activePlan === "filling" && (!time || !hasCylinders)) || (activePlan === "task" && !taskTitle.trim())) {
      setError(needsCylinders ? "Complete the required details and enter at least one cylinder quantity." : "Enter a task title to continue.");
      return;
    }
    if (!activePlan) return;
    setCounts((current) => {
      const currentDay = current[selectedDate] ?? { delivery: 0, filling: 0, task: 0 };
      return { ...current, [selectedDate]: { ...currentDay, [activePlan]: currentDay[activePlan] + 1 } };
    });
    setNotice(`${planLabels[activePlan]} added for ${readableDate(selectedDate)}. This is a UI-only preview.`);
    setActivePlan(null); setError(""); setClient(""); setTime(""); setCommercial(""); setDomestic(""); setTaskTitle("");
  }

  return <main className="field-shell"><section className="field-page planning-page">
    <Link href="/field/home" className="back">← Back to home</Link>
    <p className="eyebrow">ADMIN · PLANNING</p><h1>Planning calendar</h1>
    <p className="muted">Tap a date to add a delivery, filling, or personal task plan.</p>
    {notice && <p className="planning-notice">{notice}</p>}
    <div className="calendar-legend"><span className="legend-delivery">Delivery</span><span className="legend-filling">Filling</span><span className="legend-task">My task</span></div>
    <div className="planning-calendar"><FullCalendar plugins={[dayGridPlugin, interactionPlugin]} initialView="dayGridMonth" initialDate="2026-10-01" fixedWeekCount={false} headerToolbar={{ left: "prev,next", center: "title", right: "" }} dayMaxEvents={3} events={events} dateClick={dateClick} dayCellClassNames={(arg) => localDate(arg.date) < today ? ["calendar-past-day"] : []} /></div>
    {selectedDate && <div className="planning-modal-backdrop" role="presentation" onMouseDown={closeModal}><section className="planning-modal" role="dialog" aria-modal="true" aria-labelledby="planning-modal-title" onMouseDown={(event) => event.stopPropagation()}>
      <button type="button" className="modal-close" onClick={closeModal} aria-label="Close">×</button>
      <p className="eyebrow">{readableDate(selectedDate)}</p>
      {!activePlan ? <><h2 id="planning-modal-title">Plans for this date</h2>{counts[selectedDate] && <section className="planned-counts" aria-label="Plans already added">{(Object.keys(planLabels) as PlanType[]).filter((type) => counts[selectedDate][type] > 0).map((type) => <div key={type}><span>{counts[selectedDate][type]} {planLabels[type]}{counts[selectedDate][type] === 1 ? "" : "s"}</span><button type="button" onClick={() => removePlan(type)}>Remove 1</button></div>)}</section>}<p className="muted">Choose another plan to add for this date.</p><div className="plan-type-options">{(Object.keys(planLabels) as PlanType[]).map((type) => <button type="button" key={type} onClick={() => { setActivePlan(type); setError(""); }}><strong>{planLabels[type]}</strong><span>{type === "delivery" ? "Client cylinder order" : type === "filling" ? "LPG plant visit" : "Your own reminder"}</span></button>)}</div></> : <form className="simple-form planning-form" onSubmit={savePlan}><button type="button" className="back-form-button" onClick={() => { setActivePlan(null); setError(""); }}>← Change plan type</button><h2 id="planning-modal-title">{planLabels[activePlan]}</h2>{error && <p className="form-error">{error}</p>}
        {activePlan === "delivery" && <label>Client<span className="required-star" aria-label="required">*</span><select value={client} onChange={(event) => setClient(event.target.value)}><option value="">Select client</option>{clients.map((name) => <option value={name} key={name}>{name}</option>)}</select></label>}
        {activePlan !== "task" && <><fieldset className="tag-field"><legend>Preferred time<span className="required-star" aria-label="required">*</span></legend><div className="tag-list">{timeOptions.map((option) => <button type="button" key={option} className={`form-tag ${time === option ? "selected" : ""}`} onClick={() => setTime(option)}>{option}</button>)}</div></fieldset><div className="cylinder-quantity-grid"><label>Commercial <span>(45.4 kg)</span><input type="number" min="0" inputMode="numeric" value={commercial} onChange={(event) => setCommercial(event.target.value)} placeholder="0" /></label><label>Domestic <span>(11.8 kg)</span><input type="number" min="0" inputMode="numeric" value={domestic} onChange={(event) => setDomestic(event.target.value)} placeholder="0" /></label></div></>}
        {activePlan === "task" && <label>Task title<span className="required-star" aria-label="required">*</span><input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="e.g. Call plant manager" /></label>}
        <button className="button form-button" type="submit">Add {planLabels[activePlan].toLowerCase()}</button>
      </form>}
    </section></div>}
  </section></main>;
}
