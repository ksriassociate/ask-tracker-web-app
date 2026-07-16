import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";

const CLOSED = new Set(["Completed", "Closed", "Cancelled", "Filed", "Disposed"]);
const MODULES = ["All", "COMPLIANCE", "LITIGATION", "TAX"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ReminderCenter() {
  const [reminders, setReminders] = useState([]);
  const [acknowledgements, setAcknowledgements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [module, setModule] = useState("All");
  const [range, setRange] = useState("14");
  const [view, setView] = useState("queue");
  const [month, setMonth] = useState(firstDayOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(today());

  const load = async () => {
    setLoading(true); setError("");
    const [tasks, hearings, cases, filings, customers, acks] = await Promise.all([
      supabase.from("tasks").select("id,title,due_date,priority,status,workstream,assign_to_customer").not("due_date", "is", null),
      supabase.from("legal_hearings").select("id,hearing_date,legal_case_id").not("hearing_date", "is", null),
      supabase.from("legal_cases").select("id,case_number,status,customer_id"),
      supabase.from("tax_filings").select("id,customer_id,tax_type,form_code,tax_period,due_date,status,risk_level").not("due_date", "is", null),
      supabase.from("customers").select("id,company_name"),
      supabase.from("reminder_acknowledgements").select("reminder_key,acknowledged_at,snoozed_until,updated_at,action_type"),
    ]);
    const failures = [tasks.error, hearings.error, cases.error, filings.error, customers.error].filter(Boolean);
    if (failures.length) setError(failures.map((failure) => failure.message).join(" · "));
    if (acks.error) setNotice("Acknowledge/snooze storage is unavailable. Run reminder-system-v2.sql."); else setNotice("");
    const customerName = new Map((customers.data || []).map((row) => [row.id, row.company_name]));
    const legalCases = new Map((cases.data || []).map((row) => [row.id, row]));
    const taskReminders = (tasks.data || []).filter((row) => !CLOSED.has(row.status) && upper(row.workstream || "COMPLIANCE") !== "TAX").map((row) => makeReminder({ key: `task-${row.id}`, module: upper(row.workstream) === "LITIGATION" ? "LITIGATION" : "COMPLIANCE", title: row.title || "Untitled task", clientName: customerName.get(row.assign_to_customer) || "No client", dueDate: row.due_date, priority: row.priority || "MEDIUM", status: row.status || "Pending", sourceType: "TASK" }));
    const hearingReminders = (hearings.data || []).map((hearing) => ({ hearing, legalCase: legalCases.get(hearing.legal_case_id) })).filter(({ legalCase }) => legalCase && !CLOSED.has(legalCase.status)).map(({ hearing, legalCase }) => makeReminder({ key: `hearing-${hearing.id}`, module: "LITIGATION", title: `Hearing: ${legalCase.case_number}`, clientName: customerName.get(legalCase.customer_id) || "No client", dueDate: hearing.hearing_date, priority: "HIGH", status: legalCase.status || "Active hearing", sourceType: "HEARING" }));
    const taxReminders = (filings.data || []).filter((row) => !CLOSED.has(row.status)).map((row) => makeReminder({ key: `tax-${row.id}`, module: "TAX", title: [row.tax_type, row.form_code, row.tax_period].filter(Boolean).join(" · ") || "Tax filing", clientName: customerName.get(row.customer_id) || "No client", dueDate: row.due_date, priority: ["High", "Critical"].includes(row.risk_level) ? "HIGH" : "MEDIUM", status: row.status || "Pending", sourceType: "TAX FILING" }));
    setReminders([...taskReminders, ...hearingReminders, ...taxReminders]);
    setAcknowledgements(acks.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const displayReminders = useMemo(() => {
    const ackMap = new Map(acknowledgements.map((row) => [row.reminder_key, row]));
    return reminders.map((row) => {
      const acknowledgement = ackMap.get(row.key);
      const snoozed = acknowledgement?.snoozed_until ? datePart(acknowledgement.snoozed_until) : null;
      return { ...row, acknowledgement, effectiveDate: snoozed || row.originalDueDate, isAcknowledged: Boolean(acknowledgement?.acknowledged_at), isSnoozed: Boolean(snoozed && !acknowledgement?.acknowledged_at) };
    });
  }, [reminders, acknowledgements]);
  const activeReminders = useMemo(() => displayReminders.filter((row) => !row.isAcknowledged && (module === "All" || row.module === module)), [displayReminders, module]);
  const queue = useMemo(() => activeReminders.filter((row) => row.effectiveDate <= addDays(today(), Number(range))).sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate)), [activeReminders, range]);
  const selected = useMemo(() => activeReminders.filter((row) => row.effectiveDate === selectedDate), [activeReminders, selectedDate]);
  const counters = useMemo(() => ({ overdue: queue.filter((row) => row.effectiveDate < today()).length, today: queue.filter((row) => row.effectiveDate === today()).length, upcoming: queue.filter((row) => row.effectiveDate > today()).length }), [queue]);
  const eventsByDate = useMemo(() => activeReminders.reduce((map, row) => { (map[row.effectiveDate] ||= []).push(row); return map; }, {}), [activeReminders]);

  const recordAction = async (reminder, type) => {
    setSavingKey(`${reminder.key}:${type}`); setError("");
    const now = new Date();
    const snoozedUntil = type === "snoozed" ? new Date(now.getTime() + 86400000) : null;
    const acknowledgement = { reminder_key: reminder.key, acknowledged_at: type === "acknowledged" ? now.toISOString() : null, snoozed_until: snoozedUntil?.toISOString() || null, action_type: type, updated_at: now.toISOString() };
    const { error: acknowledgementError } = await supabase.from("reminder_acknowledgements").upsert(acknowledgement, { onConflict: "reminder_key" });
    if (acknowledgementError) { setError(acknowledgementError.message); setSavingKey(""); return; }
    const { error: auditError } = await supabase.from("reminder_action_logs").insert({ reminder_key: reminder.key, action_type: type, module: reminder.module, title: reminder.title, client_name: reminder.clientName, source_type: reminder.sourceType, original_due_date: reminder.originalDueDate, effective_due_date: snoozedUntil ? datePart(snoozedUntil) : reminder.originalDueDate, snoozed_until: snoozedUntil?.toISOString() || null });
    if (auditError) setNotice(`Reminder action was saved, but its dashboard audit entry was not saved: ${auditError.message}. Run reminder-system-v2.sql.`);
    window.dispatchEvent(new CustomEvent("firmaxis:reminder-action"));
    await load();
    setSavingKey("");
  };

  const days = calendarDays(month);
  return <div className="min-h-screen bg-slate-950 p-6 text-slate-100"><style>{css}</style>
    <header className="panel mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><span className="tag">Firm-wide statutory control</span><h1 className="mt-2 text-2xl font-black">Reminders & Deadline Calendar</h1><p className="mt-1 text-xs text-slate-400">Acknowledge closes the live reminder; snooze moves it to tomorrow and records the action in Today’s Work Progress.</p></div><button className="button" onClick={load}>{loading ? "Refreshing…" : "Refresh reminders"}</button></header>
    {error && <div className="alert">{error}</div>}{notice && <div className="notice">{notice}</div>}
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3"><Metric label="Overdue" value={counters.overdue} tone="rose" /><Metric label="Due today" value={counters.today} tone="amber" /><Metric label={`Next ${range} days`} value={counters.upcoming} tone="indigo" /></div>
    <section className="panel"><div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row"><div className="tabs"><button className={view === "queue" ? "tab active" : "tab"} onClick={() => setView("queue")}>Action queue</button><button className={view === "calendar" ? "tab active" : "tab"} onClick={() => setView("calendar")}>Calendar</button></div><div className="flex gap-2"><select className="field" value={module} onChange={(event) => setModule(event.target.value)}>{MODULES.map((item) => <option key={item}>{item}</option>)}</select>{view === "queue" && <select className="field" value={range} onChange={(event) => setRange(event.target.value)}><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select>}</div></div>
      {loading ? <Empty text="Loading reminders…" /> : view === "queue" ? <ReminderList items={queue} savingKey={savingKey} onAction={recordAction} empty="No open reminders in this period." /> : <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><div><div className="mb-3 flex items-center justify-between"><button className="small" onClick={() => setMonth(addMonths(month, -1))}>← Previous</button><h2 className="text-sm font-black">{month.toLocaleString("en-IN", { month: "long", year: "numeric" })}</h2><button className="small" onClick={() => setMonth(addMonths(month, 1))}>Next →</button></div><div className="calendar">{WEEKDAYS.map((day) => <div className="weekday" key={day}>{day}</div>)}{days.map((day) => { const iso = datePart(day); const events = eventsByDate[iso] || []; return <button className={`day ${day.getMonth() !== month.getMonth() ? "muted" : ""} ${iso === selectedDate ? "selected" : ""} ${iso === today() ? "today" : ""}`} key={iso} onClick={() => setSelectedDate(iso)}><span>{day.getDate()}</span><div>{events.slice(0, 3).map((event) => <i key={event.key} className={`dot ${event.module.toLowerCase()}`} title={event.title} />)}{events.length > 3 && <b>+{events.length - 3}</b>}</div></button>; })}</div><div className="legend"><span><i className="dot compliance" /> Compliance</span><span><i className="dot litigation" /> Litigation</span><span><i className="dot tax" /> Tax</span><span className="snooze-mark">Snoozed items move to their new date</span></div></div><aside className="day-panel"><span className="tag">Selected date</span><h2 className="mt-2 text-sm font-black">{formatDate(selectedDate)}</h2><div className="mt-4"><ReminderList items={selected} savingKey={savingKey} onAction={recordAction} compact empty="No open reminders for this date." /></div></aside></div>}</section>
  </div>;
}

function makeReminder(value) { return { ...value, originalDueDate: value.dueDate }; }
function ReminderList({ items, savingKey, onAction, empty, compact = false }) { if (!items.length) return <Empty text={empty} />; return <div className="space-y-2">{items.map((item) => <article className={`item ${compact ? "compact" : ""}`} key={item.key}><div><div className="flex items-center gap-2"><Badge value={item.module} />{item.isSnoozed && <span className="snoozed">SNOOZED</span>}<b className="text-sm">{item.title}</b></div><p className="hint mt-1">{item.clientName} · {item.status} · {item.sourceType}</p>{item.isSnoozed && <p className="hint mt-1 text-violet-300">Rescheduled from {item.originalDueDate} to {item.effectiveDate}</p>}</div><div className="text-right"><p className={item.effectiveDate < today() ? "due late" : "due"}>{item.effectiveDate}</p><div className="mt-2 flex justify-end gap-2"><button className="small" disabled={Boolean(savingKey)} onClick={() => onAction(item, "acknowledged")}>{savingKey === `${item.key}:acknowledged` ? "Saving…" : "Acknowledge"}</button><button className="small" disabled={Boolean(savingKey)} onClick={() => onAction(item, "snoozed")}>{savingKey === `${item.key}:snoozed` ? "Saving…" : "Snooze 1 day"}</button></div></div></article>)}</div>; }
function today() { return datePart(new Date()); } function datePart(value) { const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; } function addDays(from, days) { const date = new Date(`${from}T12:00:00`); date.setDate(date.getDate() + days); return datePart(date); } function upper(value) { return String(value || "").toUpperCase(); } function firstDayOfMonth(value) { return new Date(value.getFullYear(), value.getMonth(), 1); } function addMonths(value, amount) { return new Date(value.getFullYear(), value.getMonth() + amount, 1); } function calendarDays(month) { const first = firstDayOfMonth(month); first.setDate(first.getDate() - first.getDay()); return Array.from({ length: 42 }, (_, index) => { const day = new Date(first); day.setDate(first.getDate() + index); return day; }); } function formatDate(value) { return new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
function Metric({ label, value, tone }) { return <div className={`metric ${tone}`}><p>{label}</p><strong>{value}</strong></div>; } function Badge({ value }) { return <span className={`badge ${value.toLowerCase()}`}>{value}</span>; } function Empty({ text }) { return <div className="empty">{text}</div>; }
const css = `.panel{background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px}.tag{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#a5b4fc}.button,.small,.tab{background:#1e293b;border:1px solid #334155;border-radius:7px;padding:9px 12px;font-size:11px;font-weight:800;color:#e2e8f0}.button,.tab.active{background:#4f46e5;border-color:#6366f1;color:#fff}.small:disabled{opacity:.55}.field{background:#020617;border:1px solid #334155;border-radius:7px;padding:9px;color:#e2e8f0;font-size:12px}.tabs{display:flex;gap:8px}.metric{background:#0f172a;border:1px solid #1e293b;border-left:4px solid #6366f1;border-radius:10px;padding:16px}.metric p,.hint{font-size:10px;color:#94a3b8}.metric strong{font-size:26px;display:block;margin-top:4px}.metric.rose{border-left-color:#f43f5e}.metric.amber{border-left-color:#f59e0b}.item{background:#020617;border:1px solid #1e293b;border-radius:8px;padding:13px;display:flex;justify-content:space-between;gap:14px}.item.compact{display:block}.badge,.snoozed{font-size:9px;font-weight:800;padding:3px 6px;border-radius:4px}.compliance{background:#172554;color:#bfdbfe}.litigation{background:#451a03;color:#fde68a}.tax{background:#064e3b;color:#a7f3d0}.snoozed{background:#312e81;color:#ddd6fe}.due{font-family:monospace;color:#cbd5e1;font-size:12px}.late{color:#fda4af}.empty{border:1px dashed #334155;border-radius:8px;padding:35px;text-align:center;color:#64748b;font-size:12px}.alert{margin-bottom:14px;background:#4c0519;border:1px solid #881337;color:#fecdd3;border-radius:7px;padding:11px;font-size:12px}.notice{margin-bottom:14px;background:#172554;border:1px solid #1e3a8a;color:#bfdbfe;border-radius:7px;padding:11px;font-size:12px}.calendar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border:1px solid #1e293b;border-radius:9px;overflow:hidden}.weekday{padding:8px;text-align:center;background:#111c32;color:#94a3b8;font-size:10px;font-weight:800;text-transform:uppercase}.day{min-height:88px;background:#020617;border:0;border-right:1px solid #1e293b;border-top:1px solid #1e293b;padding:8px;text-align:left;color:#e2e8f0;font-size:12px}.day:hover,.day.selected{background:#172554}.day.today span{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#4f46e5;color:#fff}.day.muted{color:#475569}.day b{font-size:9px;color:#94a3b8;margin-left:3px}.dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin:8px 3px 0 0;background:#60a5fa}.dot.litigation{background:#f59e0b}.dot.tax{background:#34d399}.legend{display:flex;flex-wrap:wrap;gap:16px;margin-top:12px;font-size:10px;color:#94a3b8}.legend .dot{margin:0 4px 0 0}.snooze-mark{color:#c4b5fd}.day-panel{border:1px solid #1e293b;border-radius:9px;background:#020617;padding:14px}`;