import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";

const MCA_FORMS = ["DIR-12", "AOC-4", "MGT-7", "MGT-14", "INC-22", "SPICe+ (INC-32)", "INC-20A", "DIR-3 KYC", "ADT-1", "PAS-3", "SH-7", "CHG-1", "OTHERS"];
const BENCHES = ["NCLT Chennai Bench", "NCLT Mumbai Bench", "NCLT New Delhi Bench", "NCLT Bengaluru Bench"];
const CLOSED_STATUSES = new Set(["Completed", "Closed", "Cancelled"]);

export default function SmartTaskManagerV2() {
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [directory, setDirectory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [routing, setRouting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [routingLog, setRoutingLog] = useState([]);

  const [newName, setNewName] = useState("");
  const [newPracticeAreas, setNewPracticeAreas] = useState(["COMPLIANCE"]);
  const [newCapacity, setNewCapacity] = useState(10);
  const [category, setCategory] = useState("COMPLIANCE");
  const [assignmentMode, setAssignmentMode] = useState("MANUAL");
  const [title, setTitle] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [mcaForm, setMcaForm] = useState(MCA_FORMS[0]);
  const [caseNumber, setCaseNumber] = useState("");
  const [parties, setParties] = useState("");
  const [court, setCourt] = useState("NCLT");
  const [bench, setBench] = useState(BENCHES[0]);
  const [caseSummary, setCaseSummary] = useState("");
  const [caseStatus, setCaseStatus] = useState("Active Hearing");
  const [hearingDate, setHearingDate] = useState("");
  const [hearingTime, setHearingTime] = useState("");

  const loadData = async () => {
    setLoading(true); setError("");
    const [employeeResult, customerResult, taskResult, leaveResult] = await Promise.all([
      supabase.from("employees").select("id,full_name,email,expertise,practice_areas,speed_rating,active_tasks,max_capacity,employment_status,exit_date").order("full_name"),
      supabase.from("customers").select("id,company_name").eq("status", "Active").order("company_name"),
      supabase.from("tasks").select("id,title,description,due_date,priority,status,workstream,assign_to_employee,assign_to_customer,legal_case_id,created_at,employee:employees!tasks_assign_to_employee_fkey(full_name),customer:customers!tasks_customer_assign_fkey(company_name),legal_case:legal_cases(case_number,location)").order("created_at", { ascending: true }),
      supabase.from("employee_leaves").select("id,employee_id,start_date,end_date,reason").order("start_date", { ascending: true }),
    ]);
    const loadError = employeeResult.error || customerResult.error || taskResult.error || leaveResult.error;
    if (loadError) setError(loadError.message);
    else {
      setEmployees(employeeResult.data || []);
      setLeaves(leaveResult.data || []);
      setCustomers(customerResult.data || []);
      setTasks((taskResult.data || []).filter((task) => task.title?.trim()));
      setCustomerId((current) => current || String(customerResult.data?.[0]?.id || ""));
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const queue = useMemo(
    () => tasks.filter((task) => !task.assign_to_employee && !CLOSED_STATUSES.has(task.status)),
    [tasks],
  );
  const today = new Date().toISOString().slice(0, 10);
  const employeeOnLeave = (employeeId, date = today) => leaves.some((leave) => Number(leave.employee_id) === Number(employeeId) && leave.start_date <= date && leave.end_date >= date);
  const availableEmployees = useMemo(() => employees.filter((employee) => employee.employment_status !== "INACTIVE" && !employeeOnLeave(employee.id)), [employees, leaves]);
  const tracked = useMemo(() => tasks.filter((task) => task.assign_to_employee), [tasks]);
  const totalCapacity = employees.reduce((sum, employee) => sum + Number(employee.max_capacity || 0), 0);
  const activeLoad = employees.reduce((sum, employee) => sum + Number(employee.active_tasks || 0), 0);

  const addEmployee = async (event) => {
    event.preventDefault();
    if (!newName.trim()) return setError("Employee name is required.");
    const { error: insertError } = await supabase.from("employees").insert({ full_name: newName.trim(), expertise: newPracticeAreas[0] || "COMPLIANCE", practice_areas: newPracticeAreas, employment_status: "ACTIVE", max_capacity: Number(newCapacity) || 10, active_tasks: 0, speed_rating: "8.0/10" });
    if (insertError) return setError(insertError.message);
    setNewName(""); setNewPracticeAreas(["COMPLIANCE"]); setNotice("Professional saved to Supabase."); await loadData();
  };

  const createTask = async (event) => {
    event.preventDefault();
    if (!title.trim() || !customerId) return setError("Task title and customer are required.");
    if (assignmentMode === "MANUAL" && !employeeId) return setError("Choose an employee for a manual assignment.");
    if (assignmentMode === "MANUAL" && employeeOnLeave(employeeId)) return setError("This employee is currently on leave. Choose another employee or use auto-routing.");
    setError("");
    try {
      let legalCaseId = null;
      const description = category === "COMPLIANCE" ? `MCA form: ${mcaForm}` : caseSummary;
      if (category === "LITIGATION") {
        if (!caseNumber.trim() || !parties.trim()) throw new Error("Case number and petitioner/respondent are required.");
        const { data: legalCase, error: caseError } = await supabase.from("legal_cases").upsert({ case_number: caseNumber.trim(), customer_id: Number(customerId), court_name: court || "NCLT", location: bench, petitioner_vs_respondent: parties.trim(), summary: caseSummary.trim() || title.trim(), status: caseStatus }, { onConflict: "case_number" }).select("id").single();
        if (caseError) throw caseError;
        legalCaseId = legalCase.id;
        if (hearingDate) {
          const { data: existing, error: hearingFindError } = await supabase.from("legal_hearings").select("id").eq("legal_case_id", legalCaseId).eq("hearing_date", hearingDate).order("created_at").limit(1).maybeSingle();
          if (hearingFindError) throw hearingFindError;
          const payload = { legal_case_id: legalCaseId, hearing_date: hearingDate, hearing_time: hearingTime || null };
          const result = existing ? await supabase.from("legal_hearings").update(payload).eq("id", existing.id) : await supabase.from("legal_hearings").insert(payload);
          if (result.error) throw result.error;
        }
      }
      const isManual = assignmentMode === "MANUAL";
      const status = isManual ? "Assigned" : assignmentMode === "AUTO" ? "Queued for Auto-Route" : "Pending";
      const { error: taskError } = await supabase.from("tasks").insert({
        title: title.trim(), description: description || null, due_date: dueDate || null, priority, status,
        workstream: category, assign_to_customer: Number(customerId), assign_to_employee: isManual ? Number(employeeId) : null, legal_case_id: legalCaseId,
      });
      if (taskError) throw taskError;
      setNotice(isManual ? "Task manually assigned." : assignmentMode === "AUTO" ? "Task added to the auto-route queue." : "Task saved as unassigned.");
      setTitle(""); setCaseNumber(""); setParties(""); setCaseSummary(""); setHearingDate(""); setHearingTime(""); setEmployeeId("");
      await loadData();
    } catch (saveError) { setError(saveError.message || "Could not create task."); }
  };

  const getSpeed = (employee) => Math.min(10, Math.max(0, Number.parseFloat(String(employee.speed_rating || "0")) || 0));
  const handlesWorkstream = (employee, workstream) => {
    const areas = Array.isArray(employee.practice_areas) && employee.practice_areas.length ? employee.practice_areas : [employee.expertise || "COMPLIANCE"];
    return areas.map((area) => String(area).toUpperCase()).includes(String(workstream || "COMPLIANCE").toUpperCase());
  };
  const priorityRank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const compareQueue = (a, b) => (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1) || String(a.due_date || "9999-12-31").localeCompare(String(b.due_date || "9999-12-31"));

  // This is rule-based routing. It does not call Gemini, Serper, or any other AI API.
  const autoRoute = async () => {
    const routeable = queue.filter((task) => task.status === "Queued for Auto-Route").sort(compareQueue);
    if (!routeable.length) return setNotice("No tasks are marked for auto-routing. Choose ‘Send to auto-route queue’ when creating a task.");
    setRouting(true); setError("");
    const virtualLoad = new Map(employees.map((employee) => [employee.id, Number(employee.active_tasks || 0)]));
    const newLog = []; const failures = [];
    for (const task of routeable) {
      const candidates = availableEmployees.filter((employee) => virtualLoad.get(employee.id) < Number(employee.max_capacity || 10));
      if (!candidates.length) { failures.push(task.title); continue; }
      const ranked = candidates.map((employee) => {
        const capacity = Math.max(1, Number(employee.max_capacity || 10));
        const load = virtualLoad.get(employee.id) || 0;
        const expertiseScore = handlesWorkstream(employee, task.workstream) ? 60 : 0;
        const availabilityScore = (1 - load / capacity) * 25;
        const speedScore = getSpeed(employee);
        return { employee, score: expertiseScore + availabilityScore + speedScore, expertiseScore, availabilityScore, speedScore, load, capacity };
      }).sort((a, b) => b.score - a.score);
      const winner = ranked[0];
      const { error: routeError } = await supabase.from("tasks").update({ assign_to_employee: winner.employee.id, status: "Auto-Routed" }).eq("id", task.id);
      if (routeError) { failures.push(task.title); continue; }
      await supabase.from("task_execution_logs").insert({ task_id: task.id, previous_status: task.status, next_status: "Auto-Routed", note: "Assigned by rule-based Smart Router.", changed_by: "Smart Router" });
      virtualLoad.set(winner.employee.id, winner.load + 1);
      newLog.push({ task: task.title, assigned: winner.employee.full_name, score: Math.round(winner.score), reason: `${handlesWorkstream(winner.employee, task.workstream) ? "specialist match" : "general capacity"}; ${winner.load}/${winner.capacity} load; speed ${getSpeed(winner.employee).toFixed(1)}/10` });
    }
    setRoutingLog((old) => [...newLog, ...old].slice(0, 12));
    setRouting(false);
    setNotice(newLog.length ? `${newLog.length} task(s) auto-routed.${failures.length ? ` ${failures.length} kept in queue because no capacity is available.` : ""}` : "No task could be routed because all staff are at capacity.");
    await loadData();
  };

  const manuallyAssignQueuedTask = async (taskId, selectedEmployeeId) => {
    if (!selectedEmployeeId) return;
    const employee = employees.find((item) => item.id === Number(selectedEmployeeId));
    if (!employee) return;
    if (Number(employee.active_tasks || 0) >= Number(employee.max_capacity || 10)) return setError(`${employee.full_name} is already at capacity.`);
    const { error: assignError } = await supabase.from("tasks").update({ assign_to_employee: Number(selectedEmployeeId), status: "Assigned" }).eq("id", taskId);
    if (assignError) return setError(assignError.message);
    setNotice("Queued task manually assigned."); await loadData();
  };

  const startEmployeeLeave = async ({ employeeId: leaveEmployeeId, startDate, endDate, reason }) => {
    if (!leaveEmployeeId || !startDate || !endDate) return setError("Employee, leave start date, and end date are required.");
    if (endDate < startDate) return setError("Leave end date cannot be before the start date.");
    setError("");
    const { error: leaveError } = await supabase.from("employee_leaves").insert({ employee_id: Number(leaveEmployeeId), start_date: startDate, end_date: endDate, reason: reason?.trim() || null });
    if (leaveError) return setError(leaveError.message);

    // Reassign only work for a leave that starts today or has already started.
    if (startDate > today) { setNotice("Future leave saved. Current work remains assigned until the leave starts."); return loadData(); }
    const absentEmployee = employees.find((employee) => employee.id === Number(leaveEmployeeId));
    const { data: assignedTasks, error: tasksError } = await supabase.from("tasks").select("id,title,workstream,status").eq("assign_to_employee", Number(leaveEmployeeId));
    if (tasksError) return setError(`Leave saved, but tasks could not be read: ${tasksError.message}`);
    const activeTasks = (assignedTasks || []).filter((task) => !CLOSED_STATUSES.has(task.status));
    const virtualLoad = new Map(employees.map((employee) => [employee.id, Number(employee.active_tasks || 0)]));
    let reassigned = 0; let queued = 0;
    for (const task of activeTasks) {
      const candidates = employees.filter((employee) => employee.id !== Number(leaveEmployeeId) && !employeeOnLeave(employee.id) && (virtualLoad.get(employee.id) || 0) < Number(employee.max_capacity || 10));
      const ranked = candidates.map((employee) => {
        const capacity = Math.max(1, Number(employee.max_capacity || 10)); const load = virtualLoad.get(employee.id) || 0;
        const expertise = handlesWorkstream(employee, task.workstream) ? 60 : 0;
        return { employee, load, score: expertise + (1 - load / capacity) * 25 + getSpeed(employee) };
      }).sort((a, b) => b.score - a.score);
      const winner = ranked[0];
      const update = winner ? { assign_to_employee: winner.employee.id, status: "Auto-Routed" } : { assign_to_employee: null, status: "Queued for Auto-Route" };
      const { error: updateError } = await supabase.from("tasks").update(update).eq("id", task.id);
      if (updateError) return setError(`Leave saved, but ${task.title} could not be reassigned: ${updateError.message}`);
      if (winner) { virtualLoad.set(winner.employee.id, winner.load + 1); reassigned += 1; } else queued += 1;
    }
    setNotice(`${absentEmployee?.full_name || "Employee"} is on leave. ${reassigned} open task(s) reassigned automatically${queued ? `; ${queued} task(s) remain queued because no capacity is available` : ""}.`);
    await loadData();
  };

  const offboardEmployee = async ({ employeeId: leavingEmployeeId, exitDate, note }) => {
    if (!leavingEmployeeId || !exitDate) return setError("Choose an employee and final working date.");
    const employee = employees.find((item) => item.id === Number(leavingEmployeeId));
    if (!employee || employee.employment_status === "INACTIVE") return setError("Choose an active employee.");
    setError("");
    const { data: taskCount, error: offboardError } = await supabase.rpc("offboard_employee", { p_employee_id: Number(leavingEmployeeId), p_exit_date: exitDate, p_note: note || null });
    if (offboardError) return setError(offboardError.message);
    setNotice(`${employee.full_name} was marked inactive. ${taskCount || 0} open task(s) were returned to the auto-route queue; run the auto-route cycle to distribute them.`);
    await loadData();
  };

  if (directory) return <Shell><Header onDirectory={() => setDirectory(false)} directory routing={routing} queue={queue} onRoute={autoRoute} />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><section className="panel h-fit"><h2 className="label mb-4">Onboard new professional</h2><form onSubmit={addEmployee} className="space-y-3"><Input value={newName} onChange={setNewName} placeholder="Full legal name" /><PracticeAreaPicker value={newPracticeAreas} onChange={setNewPracticeAreas} /><Input type="number" value={newCapacity} onChange={setNewCapacity} placeholder="Capacity" /><button className="btn w-full">Save and sync member</button></form></section><section className="panel lg:col-span-2"><h2 className="label mb-4">Firm core directory</h2><div className="space-y-3">{employees.map((employee) => <div key={employee.id} className="card flex justify-between"><div><p className="font-bold">{employee.full_name}{employee.employment_status === "INACTIVE" && <span className="ml-2 text-[10px] text-slate-500">INACTIVE</span>}{employeeOnLeave(employee.id) && employee.employment_status !== "INACTIVE" && <span className="ml-2 text-[10px] text-rose-300">ON LEAVE</span>}</p><p className="text-xs text-slate-500 mt-1">{(employee.practice_areas || [employee.expertise]).join(", ")} · {employee.email || "No email"}</p></div><p className="text-xs font-mono">{employee.active_tasks || 0}/{employee.max_capacity || 10} open tasks</p></div>)}</div></section></div><LeaveManager employees={employees.filter((employee) => employee.employment_status !== "INACTIVE")} leaves={leaves} onSave={startEmployeeLeave} /><OffboardingManager employees={employees.filter((employee) => employee.employment_status !== "INACTIVE")} onSave={offboardEmployee} />
  </Shell>;

  return <Shell><Header onDirectory={() => setDirectory(true)} routing={routing} queue={queue} onRoute={autoRoute} />
    {error && <Alert color="rose" text={error} />}{notice && <Alert color="emerald" text={notice} />}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"><Metric label="Total valid tasks" value={tasks.length} /><Metric label="Incoming queue" value={queue.length} color="emerald" /><Metric label="Active team load" value={`${activeLoad}/${totalCapacity || 0}`} color="amber" /><Metric label="Litigation matters" value={tasks.filter((task) => task.workstream === "LITIGATION" && !CLOSED_STATUSES.has(task.status)).length} color="rose" /></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"><section className="panel"><h2 className="label mb-1">Incoming queue stream</h2><p className="help mb-3">Unassigned open tasks. Only ‘Queued for Auto-Route’ tasks are handled by the route cycle.</p><div className="max-h-[420px] overflow-y-auto pr-1">{queue.length ? queue.map((task) => <QueueRow key={task.id} task={task} employees={availableEmployees} onAssign={manuallyAssignQueuedTask} />) : <Empty text="No unassigned open tasks." />}</div></section><section className="panel"><h2 className="label mb-1">Staff dynamic bandwidth</h2><p className="help mb-3">Open assigned tasks ÷ individual capacity. Completed/closed tasks do not count.</p><div className="max-h-[420px] overflow-y-auto pr-1">{employees.map((employee) => { const percent = Math.min(100, ((employee.active_tasks || 0) / (employee.max_capacity || 10)) * 100); return <div key={employee.id} className="mb-4"><div className="flex justify-between text-xs"><b>{employee.full_name}{employeeOnLeave(employee.id) && " (on leave)"}</b><span>{employee.active_tasks || 0}/{employee.max_capacity || 10}</span></div><div className="h-1.5 bg-slate-800 rounded mt-2"><div className={percent >= 80 ? "h-full bg-rose-500" : "h-full bg-emerald-500"} style={{ width: `${percent}%` }} /></div><p className="text-[10px] text-slate-500 mt-1">{(employee.practice_areas || [employee.expertise]).join(", ")} · speed {employee.speed_rating || "8.0/10"}</p></div>; })}</div></section><section className="panel"><h2 className="label mb-1">Routing decision matrix</h2><p className="help mb-3">Local rule calculation — no external AI/API call.</p>{routingLog.length ? routingLog.map((log, index) => <div key={`${log.task}-${index}`} className="card text-xs mb-2"><p className="text-indigo-400 font-bold">DEPLOYED: {log.task}</p><p className="mt-1">Assigned: {log.assigned} · score {log.score}</p><p className="text-[10px] text-slate-500 mt-1">{log.reason}</p></div>) : <Empty text="Run an auto-route cycle to see decisions." />}</section></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><section className="panel h-fit"><h2 className="label mb-4">Task customizer blueprint</h2><form onSubmit={createTask} className="space-y-3"><div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded"><button type="button" onClick={() => setCategory("COMPLIANCE")} className={category === "COMPLIANCE" ? "tab active-blue" : "tab"}>MCA Compliance</button><button type="button" onClick={() => setCategory("LITIGATION")} className={category === "LITIGATION" ? "tab active-amber" : "tab"}>NCLT Litigation</button></div><Input value={title} onChange={setTitle} placeholder="Task target objective" required /><Select value={customerId} onChange={setCustomerId} options={customers.map((customer) => ({ value: customer.id, label: customer.company_name }))} /><div className="grid grid-cols-2 gap-2"><Select value={priority} onChange={setPriority} options={["HIGH", "MEDIUM", "LOW"]} /><Input type="date" value={dueDate} onChange={setDueDate} /></div><div><label className="label block mb-1">Assignment method</label><Select value={assignmentMode} onChange={(value) => { setAssignmentMode(value); if (value !== "MANUAL") setEmployeeId(""); }} options={[{ value: "MANUAL", label: "Assign manually" }, { value: "AUTO", label: "Send to auto-route queue" }, { value: "UNASSIGNED", label: "Keep unassigned" }]} /></div>{assignmentMode === "MANUAL" && <Select value={employeeId} onChange={setEmployeeId} options={[{ value: "", label: "Choose an available employee" }, ...availableEmployees.map((employee) => ({ value: employee.id, label: `${employee.full_name} (${employee.active_tasks || 0}/${employee.max_capacity || 10})` }))]} />}{category === "COMPLIANCE" ? <Select value={mcaForm} onChange={setMcaForm} options={MCA_FORMS} /> : <><Input value={caseNumber} onChange={setCaseNumber} placeholder="Case number" required /><Input value={parties} onChange={setParties} placeholder="Petitioner vs respondent" required /><div className="grid grid-cols-2 gap-2"><Input value={court} onChange={setCourt} placeholder="Court" /><Select value={bench} onChange={setBench} options={BENCHES} /></div><textarea value={caseSummary} onChange={(event) => setCaseSummary(event.target.value)} placeholder="Case summary" className="field h-20" /><div className="grid grid-cols-2 gap-2"><Input type="date" value={hearingDate} onChange={setHearingDate} /><Input type="time" value={hearingTime} onChange={setHearingTime} /></div><Select value={caseStatus} onChange={setCaseStatus} options={["Active Hearing", "Adjourned", "Disposed", "Stayed"]} /></>}<button className="btn w-full">Create task and sync</button></form></section><section className="lg:col-span-2"><div className="panel"><h2 className="label mb-3">Assigned work tracker ({tracked.length})</h2>{loading ? <Empty text="Loading Supabase data..." /> : tracked.length ? <div className="space-y-3 max-h-[580px] overflow-y-auto">{tracked.map((task) => <TaskRow key={task.id} task={task} />)}</div> : <Empty text="No assigned tasks yet." />}</div></section></div>
  </Shell>;
}

function QueueRow({ task, employees, onAssign }) { return <div className="card mb-2"><div className="flex justify-between gap-3"><p className="font-bold text-xs">{task.title}</p><span className="text-blue-400 text-[10px] font-bold">{task.status}</span></div><p className="text-[10px] text-slate-500 mt-1">{task.workstream || "COMPLIANCE"} · {task.priority || "MEDIUM"} · due {task.due_date || "not set"}</p><select defaultValue="" onChange={(event) => onAssign(task.id, event.target.value)} className="field mt-2"><option value="">Assign manually from queue…</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name} ({employee.active_tasks || 0}/{employee.max_capacity || 10})</option>)}</select></div>; }
function PracticeAreaPicker({ value, onChange }) { const options = ["COMPLIANCE", "LEGAL", "LITIGATION", "TAX", "CA", "OTHERS"]; const toggle = (area) => onChange(value.includes(area) ? value.filter((item) => item !== area) : [...value, area]); return <div><p className="label mb-2">Practice background (select all that apply)</p><div className="grid grid-cols-2 gap-2">{options.map((area) => <label key={area} className="text-[10px] text-slate-300 flex items-center gap-1"><input type="checkbox" checked={value.includes(area)} onChange={() => toggle(area)} /> {area}</label>)}</div></div>; }
function LeaveManager({ employees, leaves, onSave }) { const [employeeId, setEmployeeId] = useState(""); const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState(""); const [reason, setReason] = useState(""); const submit = async (event) => { event.preventDefault(); await onSave({ employeeId, startDate, endDate, reason }); setEmployeeId(""); setStartDate(""); setEndDate(""); setReason(""); }; return <section className="panel mt-6"><h2 className="label mb-1">Leave and automatic reallocation</h2><p className="help mb-4">For leave starting today, open work is reassigned immediately to available staff using the same specialty, capacity, and speed rules.</p><form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-3"><Select value={employeeId} onChange={setEmployeeId} options={[{ value: "", label: "Choose employee" }, ...employees.map((employee) => ({ value: employee.id, label: employee.full_name }))]} /><Input type="date" value={startDate} onChange={setStartDate} required /><Input type="date" value={endDate} onChange={setEndDate} required /><Input value={reason} onChange={setReason} placeholder="Reason (optional)" /><button className="btn md:col-span-4">Record leave and reallocate work</button></form>{leaves.length > 0 && <div className="mt-4 text-[10px] text-slate-500">Scheduled leave records: {leaves.slice(0, 5).map((leave) => `${employees.find((employee) => employee.id === leave.employee_id)?.full_name || "Employee"} (${leave.start_date} to ${leave.end_date})`).join(" · ")}</div>}</section>; }
function OffboardingManager({ employees, onSave }) { const [employeeId, setEmployeeId] = useState(""); const [exitDate, setExitDate] = useState(""); const [note, setNote] = useState(""); const submit = async (event) => { event.preventDefault(); if (!window.confirm("Mark this employee inactive and return all open work to the auto-route queue? Historical records will be kept.")) return; await onSave({ employeeId, exitDate, note }); setEmployeeId(""); setExitDate(""); setNote(""); }; return <section className="panel mt-6 border border-rose-900"><h2 className="label mb-1 text-rose-300">Employee offboarding</h2><p className="help mb-4">The employee is retained for audit history but becomes unavailable everywhere. Open tasks and unfiled tax work are unassigned and returned to the auto-route queue.</p><form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-3"><Select value={employeeId} onChange={setEmployeeId} options={[{ value: "", label: "Choose active employee" }, ...employees.map((employee) => ({ value: employee.id, label: employee.full_name }))]} /><Input type="date" value={exitDate} onChange={setExitDate} required /><Input value={note} onChange={setNote} placeholder="Offboarding note (optional)" /><button className="btn md:col-span-3 bg-rose-900 hover:bg-rose-800">Offboard and requeue open work</button></form></section>; }
function Shell({ children }) { return <div className="p-6 bg-slate-950 min-h-screen text-slate-100 font-sans"><style>{`.panel{background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px}.label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8}.help{font-size:10px;color:#64748b}.card{background:#020617;border:1px solid #1e293b;border-radius:8px;padding:12px}.field{width:100%;background:#020617;border:1px solid #1e293b;border-radius:6px;padding:9px 10px;font-size:12px;color:#e2e8f0;outline:none}.field:focus{border-color:#6366f1}.btn{padding:10px 14px;border-radius:7px;border:1px solid #334155;background:#1e293b;color:#fff;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}.btn:hover{background:#334155}.tab{padding:7px 5px;border-radius:5px;font-size:12px;font-weight:800;color:#94a3b8}.active-blue{background:#2563eb;color:#fff}.active-amber{background:#d97706;color:#fff}`}</style>{children}</div>; }
function Header({ onDirectory, directory, routing, queue, onRoute }) { const autoCount = queue.filter((task) => task.status === "Queued for Auto-Route").length; return <header className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 flex flex-col md:flex-row md:justify-between gap-4"><div><span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Unit command center active</span><h1 className="text-xl font-black mt-2">Smart Task Router V2</h1><p className="text-xs text-slate-400 mt-1">Manual assignment where judgement is needed; rule-based routing for the queued work.</p></div><div className="flex gap-2"><button onClick={onDirectory} className="btn">{directory ? "Back to router dashboard" : "Manage team directory"}</button><button onClick={onRoute} disabled={!autoCount || routing || directory} className="btn bg-indigo-600 disabled:opacity-40">{routing ? "Calculating..." : `Run auto-route (${autoCount})`}</button></div></header>; }
function Metric({ label, value, color = "indigo" }) { const colors = { indigo: "border-l-indigo-500", emerald: "border-l-emerald-500", amber: "border-l-amber-500", rose: "border-l-rose-500" }; return <div className={`bg-slate-900 border border-slate-800 border-l-4 rounded-xl p-4 ${colors[color] || colors.indigo}`}><p className="label">{label}</p><p className="text-2xl font-black mt-1">{value}</p></div>; }
function Alert({ color, text }) { const colors = { rose: "bg-rose-950 border-rose-900 text-rose-300", emerald: "bg-emerald-950 border-emerald-900 text-emerald-300" }; return <p className={`mb-4 p-3 text-xs border rounded ${colors[color] || colors.rose}`}>{text}</p>; }
function Empty({ text }) { return <div className="p-7 border border-dashed border-slate-800 rounded text-xs text-center text-slate-500">{text}</div>; }
function TaskRow({ task }) { return <div className="card mb-2"><div className="flex justify-between gap-3"><p className="font-bold text-xs">{task.title}</p><span className={task.workstream === "LITIGATION" ? "text-amber-400 text-[10px] font-bold" : "text-blue-400 text-[10px] font-bold"}>{task.workstream}</span></div><div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-slate-400 mt-3"><span>Client: {task.customer?.company_name || "—"}</span><span>Staff: {task.employee?.full_name || "Unassigned"}</span><span>Due: {task.due_date || "—"}</span><span>{task.status}</span></div>{task.legal_case && <p className="text-[10px] text-amber-400 mt-2">{task.legal_case.case_number} · {task.legal_case.location}</p>}</div>; }
function Input({ value, onChange, ...props }) { return <input value={value} onChange={(event) => onChange(event.target.value)} className="field" {...props} />; }
function Select({ value, onChange, options }) { return <select value={value} onChange={(event) => onChange(event.target.value)} className="field">{options.map((option, index) => typeof option === "string" ? <option key={`${option}-${index}`} value={option}>{option}</option> : <option key={`${option.value}-${index}`} value={option.value}>{option.label}</option>)}</select>; }
