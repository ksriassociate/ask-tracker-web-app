import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";

const STATUS_OPTIONS = ["All", "Pending", "Assigned", "In Progress", "Auto-Routed", "Completed", "On Hold", "Closed"];
// Auto-Routed is a router-only state. Delivery users can move it into Assigned/In Progress,
// but must not manually route or re-route a completed item.
const EDITABLE_STATUSES = STATUS_OPTIONS.filter((status) => !["All", "Auto-Routed", "Closed"].includes(status));

const TASK_SELECT = "id,title,description,due_date,priority,status,workstream,billing_amount,paid_amount,assign_to_employee,customer:customers!tasks_customer_assign_fkey(company_name),employee:employees!tasks_assign_to_employee_fkey(full_name),legal_case:legal_cases(case_number,location)";

export default function TaskExecutionPipeline({ userRole = "Associate" }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTask, setActiveTask] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [saving, setSaving] = useState(false);
  const [executionNote, setExecutionNote] = useState("");
  const [history, setHistory] = useState([]);

  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase
      .from("tasks")
      .select(TASK_SELECT)
      .order("due_date", { ascending: true, nullsFirst: false });
    if (loadError) setError(loadError.message);
    else setTasks((data || []).filter((task) => task.title?.trim()));
    setLoading(false);
  };

  const openTask = async (task) => {
    setActiveTask(task);
    setExecutionNote("");
    const { data, error: historyError } = await supabase
      .from("task_execution_logs")
      .select("id, previous_status, next_status, note, changed_by, created_at")
      .eq("task_id", task.id)
      .order("created_at", { ascending: false })
      .limit(12);
    if (historyError) {
      // The page still works before the migration is run; the save action explains it.
      setHistory([]);
    } else {
      setHistory(data || []);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const visibleTasks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesStatus = filter === "All" || task.status === filter;
      const haystack = [task.title, task.customer?.company_name, task.employee?.full_name, task.legal_case?.case_number].join(" ").toLowerCase();
      return matchesStatus && (!term || haystack.includes(term));
    });
  }, [tasks, filter, search]);

  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const isClosed = (task) => ["Completed", "Closed", "Cancelled"].includes(task.status);
    return {
      open: tasks.filter((task) => !isClosed(task)).length,
      progress: tasks.filter((task) => task.status === "In Progress").length,
      unassigned: tasks.filter((task) => !task.assign_to_employee && !isClosed(task)).length,
      overdue: tasks.filter((task) => task.due_date && task.due_date < today && !isClosed(task)).length,
    };
  }, [tasks]);

  const saveTask = async (event) => {
    event.preventDefault();
    if (!activeTask) return;
    setSaving(true);
    setError("");

    const previous = tasks.find((task) => task.id === activeTask.id);
    const { data: updatedTask, error: saveError } = await supabase
      .from("tasks")
      .update({
        status: activeTask.status || "Pending",
        description: activeTask.description?.trim() || null,
        due_date: activeTask.due_date || null,
      })
      .eq("id", activeTask.id)
      .select(TASK_SELECT)
      .single();

    if (saveError) {
      setSaving(false);
      return setError(saveError.message);
    }

    const changed = previous?.status !== updatedTask.status || executionNote.trim();
    if (changed) {
      const { data: newLog, error: logError } = await supabase
        .from("task_execution_logs")
        .insert({
          task_id: updatedTask.id,
          previous_status: previous?.status || null,
          next_status: updatedTask.status,
          note: executionNote.trim() || null,
          changed_by: userRole,
        })
        .select("id, previous_status, next_status, note, changed_by, created_at")
        .single();
      if (logError) setError(`Task saved, but the audit log was not saved: ${logError.message}. Run firm-workflow-safety-migration.sql.`);
      else setHistory((items) => [newLog, ...items]);
    }

    setTasks((items) => items.map((item) => item.id === updatedTask.id ? updatedTask : item));
    setActiveTask(updatedTask);
    setExecutionNote("");
    setSaving(false);
  };

  if (activeTask) {
    return <div className="p-6 bg-slate-950 min-h-screen text-slate-100 font-sans"><style>{css}</style>
      <button onClick={() => setActiveTask(null)} className="back">← Back to execution pipeline</button>
      {error && <Alert text={error} />}
      <section className="panel max-w-5xl">
        <div className="flex flex-col md:flex-row md:justify-between gap-4 border-b border-slate-800 pb-4">
          <div><span className={activeTask.workstream === "LITIGATION" ? "badge amber" : "badge blue"}>{activeTask.workstream || "COMPLIANCE"}</span><h1 className="text-xl font-black mt-3">{activeTask.title}</h1><p className="text-xs text-slate-400 mt-1">{activeTask.customer?.company_name || "No client assigned"} · {activeTask.employee?.full_name || "Unassigned"}</p></div>
          <div className="text-right text-xs text-slate-400"><p>Due date</p><p className="font-mono text-amber-400 mt-1">{activeTask.due_date || "Not set"}</p></div>
        </div>
        <form onSubmit={saveTask} className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label">Execution status</label><select value={activeTask.status === "Auto-Routed" ? "Assigned" : activeTask.status || "Pending"} onChange={(event) => setActiveTask({ ...activeTask, status: event.target.value })} className="field">{EDITABLE_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></div>
          <div><label className="label">Target deadline</label><input type="date" value={activeTask.due_date || ""} onChange={(event) => setActiveTask({ ...activeTask, due_date: event.target.value })} className="field" /></div>
          <div className="md:col-span-2"><label className="label">Task brief</label><textarea value={activeTask.description || ""} onChange={(event) => setActiveTask({ ...activeTask, description: event.target.value })} className="field h-28" placeholder="Scope, filing details, or instructions..." /></div>
          <div className="md:col-span-2"><label className="label">Progress note for audit history</label><textarea value={executionNote} onChange={(event) => setExecutionNote(event.target.value)} className="field h-24" placeholder="Record progress, blocker, filing reference, or client follow-up..." /></div>
          {activeTask.legal_case && <div className="md:col-span-2 card text-xs text-amber-300">Linked case: {activeTask.legal_case.case_number} · {activeTask.legal_case.location}</div>}
          <button disabled={saving} className="md:col-span-2 primary">{saving ? "Saving..." : "Save execution update"}</button>
        </form>
        <div className="mt-7 border-t border-slate-800 pt-5"><p className="label">Execution audit trail</p>{history.length ? <div className="space-y-2">{history.map((item) => <div key={item.id} className="card text-xs"><p className="text-slate-300 font-bold">{item.previous_status || "Created"} → {item.next_status || "Updated"}</p>{item.note && <p className="text-slate-400 mt-1 whitespace-pre-wrap">{item.note}</p>}<p className="text-[10px] text-slate-500 mt-2">{item.changed_by || "Firm user"} · {formatDateTime(item.created_at)}</p></div>)}</div> : <Empty text="No execution updates recorded yet." />}</div>
      </section>
    </div>;
  }

  return <div className="p-6 bg-slate-950 min-h-screen text-slate-100 font-sans"><style>{css}</style>
    <header className="panel mb-6 flex flex-col md:flex-row md:justify-between gap-4"><div><span className="badge blue">Delivery operations</span><h1 className="text-2xl font-black mt-3">Service Execution Pipeline</h1><p className="text-xs text-slate-400 mt-1">Work assigned by Smart Router, managed through to completion.</p></div><button onClick={fetchTasks} className="button">Refresh pipeline</button></header>
    {error && <Alert text={error} />}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6"><Metric label="Open work items" value={metrics.open} tone="indigo" /><Metric label="In progress" value={metrics.progress} tone="emerald" /><Metric label="Unassigned" value={metrics.unassigned} tone="amber" /><Metric label="Overdue" value={metrics.overdue} tone="rose" /></div>
    <section className="panel"><div className="flex flex-col lg:flex-row lg:justify-between gap-3 mb-4"><div><h2 className="label">Execution workboard</h2><p className="text-[11px] text-slate-500 mt-1">Open an item to update status, notes, and its audit history.</p></div><div className="flex gap-2"><input value={search} onChange={(event) => setSearch(event.target.value)} className="field sm:w-64" placeholder="Search task, client, staff, case..." /><select value={filter} onChange={(event) => setFilter(event.target.value)} className="field sm:w-36">{STATUS_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></div></div>
      {loading ? <Empty text="Loading live execution data..." /> : visibleTasks.length ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{visibleTasks.map((task) => <button key={task.id} onClick={() => openTask(task)} className="card text-left hover:border-indigo-500 transition"><div className="flex justify-between gap-2"><span className={task.workstream === "LITIGATION" ? "badge amber" : "badge blue"}>{task.workstream || "COMPLIANCE"}</span><Status value={task.status} /></div><h3 className="font-bold text-sm mt-3">{task.title}</h3><p className="text-xs text-indigo-300 mt-2">{task.customer?.company_name || "No client assigned"}</p><div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-[11px] text-slate-500"><span>{task.employee?.full_name || "Unassigned"}</span><span>{task.due_date || "No deadline"}</span></div>{task.legal_case && <p className="text-[10px] text-amber-400 mt-2">{task.legal_case.case_number}</p>}</button>)}</div> : <Empty text="No execution work items match the current filter." />}
    </section>
  </div>;
}

function formatDateTime(value) { const date = value ? new Date(value) : null; return date && !Number.isNaN(date.getTime()) ? date.toLocaleString("en-IN") : "Date unavailable"; }
function Metric({ label, value, tone }) { const colors = { indigo: "border-l-indigo-500", emerald: "border-l-emerald-500", amber: "border-l-amber-500", rose: "border-l-rose-500" }; return <div className={`bg-slate-900 border border-slate-800 border-l-4 rounded-xl p-4 ${colors[tone]}`}><p className="label">{label}</p><p className="text-2xl font-black">{value}</p></div>; }
function Status({ value }) { const colors = value === "Completed" || value === "Closed" ? "bg-emerald-950 text-emerald-300" : value === "In Progress" ? "bg-indigo-950 text-indigo-300" : "bg-slate-800 text-slate-400"; return <span className={`text-[10px] font-bold px-2 py-1 rounded ${colors}`}>{value || "Pending"}</span>; }
function Empty({ text }) { return <div className="p-10 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">{text}</div>; }
function Alert({ text }) { return <div className="mb-5 p-3 bg-rose-950 border border-rose-900 text-rose-300 rounded text-xs">{text}</div>; }
const css = `.panel{background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px}.card{background:#020617;border:1px solid #1e293b;border-radius:9px;padding:15px}.field{width:100%;background:#020617;border:1px solid #1e293b;border-radius:6px;padding:9px 10px;font-size:12px;color:#e2e8f0;outline:none}.field:focus{border-color:#6366f1}.label{display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:6px}.button,.primary{padding:10px 14px;background:#1e293b;border:1px solid #334155;border-radius:7px;color:#fff;font-size:11px;font-weight:800;text-transform:uppercase}.primary{background:#4f46e5;border-color:#6366f1}.primary:disabled{opacity:.55}.back{margin-bottom:20px;font-size:12px;font-weight:700;color:#a5b4fc}.badge{font-size:10px;font-weight:800;padding:4px 7px;border-radius:4px}.blue{background:#172554;color:#93c5fd;border:1px solid #1e3a8a}.amber{background:#451a03;color:#fcd34d;border:1px solid #78350f}`;
