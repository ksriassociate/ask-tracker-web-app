import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";

const COURT_MATTERS = [
  {
    id: "OM_REJOINDER",
    matterName: "Oppression & Mismanagement (Sections 241–242)",
    forum: "NCLT",
    fields: [
      ["petitionNo", "Company Petition (CP) No."],
      ["petitionerName", "Petitioner name"],
      ["respondentName", "Respondent name"],
      ["bench", "NCLT Bench"],
    ],
  },
  {
    id: "COMP_EXT_TIME",
    matterName: "Condonation of Delay / Extension of Time", 
    forum: "NCLT / Regional Director",
    fields: [
      ["formDelayed", "Delayed MCA form"],
      ["delayPeriod", "Delay period (days)"],
      ["reasonForDelay", "Reason for delay"],
      ["bench", "Forum / Bench"],
    ],
  },
  {
    id: "NCLT_SCHEME_APPLICATION",
    matterName: "Scheme / Merger / Arrangement Application",
    forum: "NCLT",
    fields: [["applicationNo", "Application / CA number (if allotted)"], ["transferorCompany", "Transferor company"], ["transfereeCompany", "Transferee company"], ["bench", "NCLT Bench"]],
  },
  {
    id: "NCLAT_COMPANY_APPEAL",
    matterName: "Company Appeal before NCLAT",
    forum: "NCLAT",
    fields: [["appealNo", "Company Appeal (AT) number"], ["impugnedOrder", "Impugned NCLT order date / reference"], ["appellantName", "Appellant name"], ["respondentName", "Respondent name"], ["bench", "NCLAT Bench"]],
  },
  {
    id: "NCLAT_IBC_APPEAL",
    matterName: "Insolvency Appeal before NCLAT",
    forum: "NCLAT",
    fields: [["appealNo", "Company Appeal (AT) (Insolvency) number"], ["impugnedOrder", "Impugned NCLT / AA order date"], ["appellantName", "Appellant name"], ["respondentName", "Respondent name"], ["bench", "NCLAT Bench"]],
  },
];

export default function LitigationDraftGenerator() {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [selectedMatterId, setSelectedMatterId] = useState(COURT_MATTERS[0].id);
  const [fieldInputs, setFieldInputs] = useState({});
  const [rawNotes, setRawNotes] = useState("");
  const [documents, setDocuments] = useState([]);
  const [sources, setSources] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [confidentialityConfirmed, setConfidentialityConfirmed] = useState(false);

  const selectedMatter = useMemo(
    () => COURT_MATTERS.find((matter) => matter.id === selectedMatterId),
    [selectedMatterId]
  );

  useEffect(() => {
    const loadCustomers = async () => {
      const { data, error: loadError } = await supabase
        .from("customers")
        .select("id, company_name, cin, status")
        .eq("status", "Active")
        .order("company_name");

      if (loadError) return setError(loadError.message);
      setCustomers(data || []);
      if (data?.[0]) selectCustomer(data[0]);
    };
    loadCustomers();
  }, []);

  const selectCustomer = (customer) => {
    setCustomerId(String(customer.id));
    setFieldInputs((previous) => ({
      ...previous,
      companyName: customer.company_name || "",
      companyCIN: customer.cin || "",
    }));
  };

  const updateField = (key, value) =>
    setFieldInputs((previous) => ({ ...previous, [key]: value }));

  const generate = async (event) => {
    event.preventDefault();
    if (!customerId) return setError("Select a customer before generating a draft.");
    if (!rawNotes.trim()) return setError("Add the factual instructions before generating a draft.");
    if (!confidentialityConfirmed) return setError("Confirm that sharing these instructions with the configured research and drafting providers is authorised.");

    setIsDrafting(true);
    setError("");
    setDocuments([]);
    setSources([]);

    const { data, error: functionError } = await supabase.functions.invoke(
      "generate-litigation-draft",
      {
        body: {
          customerId: Number(customerId),
          matterType: selectedMatter.id,
          matterName: selectedMatter.matterName,
          forum: selectedMatter.forum,
          fields: fieldInputs,
          rawNotes,
          dataProcessingConsent: true,
        },
      }
    );

    setIsDrafting(false);
    if (functionError) return setError(functionError.message);
    if (data?.error) return setError(data.error);

    setDocuments(data?.documents || []);
    setSources(data?.sources || []);
    setActiveDocument(data?.documents?.[0] || null);
  };

  const copy = async () => {
    if (!activeDocument) return;
    await navigator.clipboard.writeText(activeDocument.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const updateActiveDocument = (content) => {
    setActiveDocument((current) => ({ ...current, content }));
    setDocuments((items) => items.map((item) => item.title === activeDocument.title ? { ...item, content } : item));
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      <div className="mb-6 border-b border-slate-800 pb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/40 px-3 py-1 rounded-full border border-amber-900/60">
          Judicial draft workspace
        </span>
        <h1 className="text-2xl font-black mt-2 tracking-tight">AI Litigation & Court Drafting Console</h1>
        <p className="text-xs text-slate-400 mt-1">Drafts are not saved. Review every output and source before use or filing.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <form onSubmit={generate} className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Customer context from Supabase</label>
            <select value={customerId} onChange={(e) => selectCustomer(customers.find((item) => item.id === Number(e.target.value)))} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-amber-400 font-bold">
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.company_name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Case action framework</label>
            <select value={selectedMatterId} onChange={(e) => { setSelectedMatterId(e.target.value); setDocuments([]); setSources([]); }} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-amber-400 font-bold">
              {COURT_MATTERS.map((matter) => <option key={matter.id} value={matter.id}>[{matter.forum}] {matter.matterName}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
            <input value={fieldInputs.companyName || ""} onChange={(e) => updateField("companyName", e.target.value)} placeholder="Company name" className="w-full bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded" />
            {selectedMatter.fields.map(([key, label]) => <input key={key} value={fieldInputs[key] || ""} onChange={(e) => updateField(key, e.target.value)} placeholder={label} className="w-full bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded" />)}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fact matrix / dictation notes</label>
            <textarea value={rawNotes} onChange={(e) => setRawNotes(e.target.value)} required className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 resize-none" placeholder="Add dates, allegations, responses, documents available, and the relief sought." />
          </div>
          <label className="flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed cursor-pointer">
            <input type="checkbox" checked={confidentialityConfirmed} onChange={(e) => setConfidentialityConfirmed(e.target.checked)} className="mt-0.5" />
            <span>I am authorised to share these instructions with the configured research and drafting providers. I will verify every fact, authority, citation and draft before use.</span>
          </label>
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <button disabled={isDrafting} type="submit" className="w-full bg-gradient-to-r from-amber-600 to-amber-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg text-xs tracking-wider uppercase">
            {isDrafting ? "Researching and drafting..." : "Generate draft and supporting documents"}
          </button>
        </form>

        <section className="xl:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5">
          {activeDocument ? <>
            <div className="flex gap-2 mb-4 overflow-x-auto">{documents.map((document) => <button key={document.title} onClick={() => setActiveDocument(document)} className={`px-3 py-2 text-xs rounded font-bold ${activeDocument.title === document.title ? "bg-amber-600" : "bg-slate-800"}`}>{document.title}</button>)}</div>
            <textarea value={activeDocument.content} onChange={(e) => updateActiveDocument(e.target.value)} className="w-full h-[420px] bg-slate-950 border border-slate-800 rounded-xl p-5 text-xs font-mono leading-relaxed" />
            <button onClick={copy} className="mt-3 w-full bg-emerald-700 py-2 rounded text-xs font-bold uppercase">{copied ? "Copied" : "Copy current document"}</button>
          </> : <div className="h-[520px] flex items-center justify-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">Choose a customer, add facts, then generate.</div>}
          {sources.length > 0 && <div className="mt-5 border-t border-slate-800 pt-4"><h2 className="text-xs font-bold uppercase text-slate-400 mb-2">Research sources — verify before relying on them</h2>{sources.filter((source) => /^https?:\/\//i.test(source.link || "")).map((source) => <a key={source.link} href={source.link} target="_blank" rel="noreferrer" className="block text-xs text-amber-400 hover:underline py-1">{source.title || source.link}</a>)}</div>}
        </section>
      </div>
    </div>
  );
}
