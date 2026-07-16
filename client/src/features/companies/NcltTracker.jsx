import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient"; // Adjust path only if needed.

function dateLabel(date) {
  if (!date) return "Not scheduled";
  const [year, month, day] = date.split("-");
  return `${day}-${month}-${year}`;
}

function nextHearing(hearings = []) {
  const today = new Date().toISOString().slice(0, 10);
  return [...hearings].sort((a, b) => a.hearing_date.localeCompare(b.hearing_date)).find((item) => item.hearing_date >= today);
}

export default function NcltCaseWorkspace() {
  const [cases, setCases] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCases = async () => {
    setLoading(true); setError("");
    const { data, error: loadError } = await supabase
      .from("legal_cases")
      .select(`
        id, case_number, court_name, location, petitioner_vs_respondent, summary, status,
        customer:customers(company_name),
        legal_hearings(id, hearing_date, hearing_time, pdf_path),
        tasks(id, title, due_date, status, employee:employees!tasks_assign_to_employee_fkey(full_name))
      `)
      .order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else { setCases(data || []); setSelectedId((current) => current || data?.[0]?.id || null); }
    setLoading(false);
  };

  useEffect(() => { loadCases(); }, []);
  const visibleCases = useMemo(() => {
    const term = search.toLowerCase().trim();
    return !term ? cases : cases.filter((item) => [item.case_number, item.petitioner_vs_respondent, item.customer?.company_name, item.location].join(" ").toLowerCase().includes(term));
  }, [cases, search]);
  const selectedCase = cases.find((item) => item.id === selectedId);
  const hearing = selectedCase && nextHearing(selectedCase.legal_hearings);

  return <div className="p-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
    <div className="mb-6 border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
      <div><span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/40 px-3 py-1 rounded-full border border-amber-900/60">Judicial docket workspace</span><h1 className="text-2xl font-black mt-2">Litigation & NCLT Board</h1><p className="text-xs text-slate-400 mt-1">Read-only case, hearing, and assigned-task view.</p></div>
      <button onClick={loadCases} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold hover:bg-slate-700">Refresh docket</button>
    </div>
    {error && <div className="mb-4 p-3 text-xs bg-rose-950/50 border border-rose-900 text-rose-300 rounded">{error}</div>}
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <aside className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search case or party..." className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs mb-3" />
        <div className="space-y-2 max-h-[620px] overflow-y-auto">{loading ? <p className="p-4 text-xs text-slate-500">Loading cases...</p> : visibleCases.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full text-left p-3 rounded-lg border transition ${selectedId === item.id ? "bg-amber-950/30 border-amber-700" : "bg-slate-950/40 border-slate-800 hover:border-slate-700"}`}><p className="font-mono text-[10px] text-amber-400">{item.case_number}</p><p className="text-xs font-bold mt-1">{item.customer?.company_name || item.petitioner_vs_respondent}</p><p className="text-[10px] text-slate-500 mt-1">{item.location} · {item.status}</p></button>)}</div>
      </aside>
      <main className="xl:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5">{!selectedCase ? <div className="h-[520px] flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">Select a case to review its dossier.</div> : <>
        <div className="flex justify-between gap-4 border-b border-slate-800 pb-4"><div><p className="font-mono text-xs text-amber-400">{selectedCase.case_number}</p><h2 className="text-lg font-bold mt-1">{selectedCase.customer?.company_name || "Case dossier"}</h2><p className="text-xs text-slate-400 mt-1">{selectedCase.petitioner_vs_respondent}</p></div><span className="h-fit text-[10px] font-bold px-2 py-1 rounded bg-amber-950 text-amber-400 border border-amber-900">{selectedCase.status}</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5 text-xs"><div className="bg-slate-950 border border-slate-800 rounded p-3"><span className="text-slate-500">Court</span><p className="font-bold mt-1">{selectedCase.court_name}</p></div><div className="bg-slate-950 border border-slate-800 rounded p-3"><span className="text-slate-500">Bench / location</span><p className="font-bold mt-1">{selectedCase.location}</p></div><div className="bg-slate-950 border border-slate-800 rounded p-3"><span className="text-slate-500">Next hearing</span><p className="font-bold text-amber-400 mt-1">{hearing ? `${dateLabel(hearing.hearing_date)}${hearing.hearing_time ? ` · ${hearing.hearing_time}` : ""}` : "Not scheduled"}</p></div></div>
        <section className="mb-5"><h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">Case summary</h3><div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">{selectedCase.summary || "No summary recorded."}</div></section>
        <section><h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">Assigned litigation tasks ({selectedCase.tasks?.length || 0})</h3><div className="space-y-2">{selectedCase.tasks?.length ? selectedCase.tasks.map((task) => <div key={task.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex justify-between gap-3 text-xs"><div><p className="font-bold">{task.title}</p><p className="text-slate-500 mt-1">Assigned: {task.employee?.full_name || "Unassigned"}</p></div><div className="text-right"><p className="text-amber-400">{task.due_date || "No deadline"}</p><p className="text-slate-500 mt-1">{task.status}</p></div></div>) : <p className="text-xs text-slate-500 p-3 border border-dashed border-slate-800 rounded">No tasks are linked to this case.</p>}</div></section>
      </>}</main>
    </div>
  </div>;
}
