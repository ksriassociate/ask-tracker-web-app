import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import { extractLocalDocumentText } from "./extractLocalDocumentText";

const FULL_COMPLIANCE_DATABASE = [
  { form_code: "SPICe+ (INC-32)", form_name: "Company Incorporation", fields: [["companyName", "Company Name"], ["authorizedCapital", "Authorized Capital"]], supported_docs: ["MoA", "AoA", "INC-9"] },
  { form_code: "INC-20A", form_name: "Commencement of Business", fields: [["companyName", "Company Name"], ["dateOfDeclaration", "Date of Declaration"]], supported_docs: ["Bank statement"] },
  { form_code: "INC-22", form_name: "Change of Registered Office", fields: [["companyName", "Company Name"], ["newAddress", "New Address"]], supported_docs: ["Utility bill", "NOC"] },
  { form_code: "DIR-12", form_name: "Director Appointment/Resignation", fields: [["companyName", "Company Name"], ["directorName", "Director Name"], ["eventDate", "Event Date"]], supported_docs: ["Board resolution", "Resignation letter"] },
  { form_code: "DIR-3 KYC", form_name: "Director KYC", fields: [["directorName", "Director Name"], ["din", "DIN"]], supported_docs: ["PAN card", "Aadhaar (redacted)"] },
  { form_code: "ADT-1", form_name: "Appointment of Auditor", fields: [["companyCIN", "Company CIN"], ["auditorName", "Auditor Firm Name"], ["auditorFirmPAN", "Auditor PAN"]], supported_docs: ["Board resolution", "Consent letter"] },
  { form_code: "AOC-4", form_name: "Filing of Financial Statements", fields: [["companyName", "Company Name"], ["financialYear", "Financial Year"]], supported_docs: ["Balance sheet", "Directors' report"] },
  { form_code: "MGT-7", form_name: "Annual Return", fields: [["companyName", "Company Name"], ["agmDate", "AGM Date"]], supported_docs: ["Shareholding pattern"] },
  { form_code: "MGT-14", form_name: "Filing of Resolutions", fields: [["companyName", "Company Name"], ["resolutionDate", "Resolution Date"]], supported_docs: ["Certified resolution copy"] },
  { form_code: "PAS-3", form_name: "Return of Allotment", fields: [["companyName", "Company Name"], ["allotmentDate", "Allotment Date"]], supported_docs: ["Allottees list"] },
  { form_code: "SH-7", form_name: "Alteration of Share Capital", fields: [["companyName", "Company Name"], ["newCapital", "New Authorized Capital"]], supported_docs: ["Board resolution"] },
  { form_code: "CHG-1", form_name: "Creation/Modification of Charge", fields: [["companyName", "Company Name"], ["chargeAmount", "Charge Amount"]], supported_docs: ["Charge instrument"] },
];

export default function CompanyProfileWorkspace({ companyData }) {
  const [activeFormCode, setActiveFormCode] = useState(FULL_COMPLIANCE_DATABASE[0].form_code);
  const [company, setCompany] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [editableFields, setEditableFields] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState([]);
  const [sources, setSources] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [sharingConfirmed, setSharingConfirmed] = useState(false);
  const [extractingFile, setExtractingFile] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const activeForm = useMemo(
    () => FULL_COMPLIANCE_DATABASE.find((form) => form.form_code === activeFormCode),
    [activeFormCode]
  );

  useEffect(() => {
    const loadCompany = async () => {
      if (!companyData?.id) {
        setError("Select a company with a valid customer ID first.");
        return;
      }
      const { data, error: loadError } = await supabase
        .from("customers")
        .select("id, company_name, cin, gst_number, contact_person, email, phone_number, status")
        .eq("id", companyData.id)
        .single();
      if (loadError) return setError(loadError.message);
      setCompany(data);
      setEditableFields((previous) => ({
        ...previous,
        companyName: data.company_name || "",
        companyCIN: data.cin || "",
        companyGST: data.gst_number || "",
      }));
    };
    loadCompany();
  }, [companyData?.id]);

  useEffect(() => {
    setEditableFields((previous) => {
      const next = { ...previous };
      activeForm.fields.forEach(([key]) => { if (next[key] === undefined) next[key] = ""; });
      return next;
    });
  }, [activeForm]);

  const handleProcessAndMerge = async () => {
    if (!company) return setError("Company data has not loaded yet.");
    if (!sharingConfirmed) return setError("Confirm that you are authorised to share the minimum necessary facts with the configured research and drafting providers.");
    setIsLoading(true);
    setError("");
    setCopyMessage("");
    try {
      setExtractingFile(Boolean(uploadedFile));
      const attachmentText = uploadedFile ? await extractLocalDocumentText(uploadedFile) : "";
      const { data, error: functionError } = await supabase.functions.invoke("generate-compliance-documents", {
        body: {
          companyId: company.id,
          formCode: activeForm.form_code,
          formName: activeForm.form_name,
          fields: editableFields,
          notes: `${textInput}\n\n${attachmentText ? `Temporary local file extract (${uploadedFile.name}):\n${attachmentText}` : ""}`.trim(),
          requiredSupportingDocuments: activeForm.supported_docs,
          dataProcessingConsent: true,
        },
      });
      if (functionError) throw functionError;
      if (data?.error) throw new Error(data.error);

      const extractedData = data?.extractedData || {};
      setEditableFields((previous) => ({ ...previous, ...Object.fromEntries(Object.entries(extractedData).filter(([, value]) => value != null)) }));
      setGeneratedDocs(data?.documents || []);
      setSources(data?.sources || []);
      setActiveDoc(data?.documents?.[0] || null);
    } catch (processingError) {
      setError(processingError.message || "Failed to generate documents.");
    } finally {
      setIsLoading(false);
      setExtractingFile(false);
    }
  };

  const copyActiveDocument = async () => {
    if (!activeDoc) return;
    await navigator.clipboard.writeText(activeDoc.content);
    setCopyMessage("Copied to clipboard.");
    setTimeout(() => setCopyMessage(""), 2500);
  };

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen">
      <h1 className="text-xl font-bold mb-1">Workspace: {company?.company_name || "No Company Selected"}</h1>
      <p className="text-xs text-slate-400 mb-4">Generated content is shown for review and copying only; it is not stored as a document record.</p>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {FULL_COMPLIANCE_DATABASE.map((form) => <button key={form.form_code} onClick={() => { setActiveFormCode(form.form_code); setGeneratedDocs([]); setSources([]); setActiveDoc(null); }} className={`px-4 py-2 rounded text-xs font-bold whitespace-nowrap ${activeForm.form_code === form.form_code ? "bg-blue-600" : "bg-slate-800"}`}>{form.form_code}</button>)}
      </div>
      {error && <div className="mb-4 p-3 bg-rose-950 border border-rose-900 text-rose-300 rounded text-xs">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-5 rounded-xl">
          <label className="block text-xs font-bold mb-2">Instructions / fact notes</label>
          <textarea value={textInput} onChange={(event) => setTextInput(event.target.value)} className="w-full h-32 bg-slate-950 p-3 rounded text-xs" placeholder="Describe the filing, dates, facts, and specific document requirements..." />
          <label className="block text-xs font-bold mt-4 mb-2">Optional supporting file — temporary only</label>
          <input key={fileInputKey} type="file" accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.xls,.txt,.csv" onChange={(event) => setUploadedFile(event.target.files?.[0] || null)} className="text-xs" />
          {uploadedFile && <div className="mt-2 flex items-center justify-between gap-3"><p className="text-[11px] text-slate-400">Selected: {uploadedFile.name}. It will be read locally for this draft only and will not be uploaded or stored.</p><button type="button" onClick={() => { setUploadedFile(null); setFileInputKey((value) => value + 1); }} className="shrink-0 rounded border border-slate-600 px-2 py-1 text-[10px] font-bold text-slate-300 hover:bg-slate-800">Remove file</button></div>}
          <p className="text-[11px] leading-relaxed text-slate-500 mt-2">For scanned PDFs, FirmAxis processes only the first 10 pages using browser-based OCR. For images, the selected image is processed locally. Files are not uploaded or stored. Review extracted text before generating a draft.</p>
          <p className="text-[11px] text-slate-500 mt-4">Expected supporting documents: {activeForm.supported_docs.join(", ")}</p>
          <label className="flex gap-2 text-[11px] text-slate-400 mt-3"><input type="checkbox" checked={sharingConfirmed} onChange={(event) => setSharingConfirmed(event.target.checked)} /> I am authorised to share the minimum necessary facts with the configured research and drafting providers. I will not enter passwords, OTPs, bank details, or unredacted identity documents.</label>
          <button disabled={isLoading || !company} onClick={handleProcessAndMerge} className="w-full mt-4 bg-blue-600 disabled:opacity-50 py-2 rounded font-bold text-xs uppercase">{extractingFile ? "Reading file locally..." : isLoading ? "Processing..." : "Process & Generate"}</button>
        </div>
        <div className="bg-slate-900 p-5 rounded-xl">
          <h2 className="text-sm font-bold mb-4">{activeForm.form_name} Fields</h2>
          {activeForm.fields.map(([key, label]) => <input key={key} value={editableFields[key] || ""} onChange={(event) => setEditableFields((previous) => ({ ...previous, [key]: event.target.value }))} placeholder={label} className="w-full bg-slate-950 p-2 mb-2 rounded text-xs" />)}
        </div>
      </div>
      {generatedDocs.length > 0 && <div className="bg-slate-900 p-5 rounded-xl mt-6">
        <h2 className="text-sm font-bold mb-4">Generated document content</h2>
        <div className="flex gap-2 mb-4 overflow-x-auto">{generatedDocs.map((document, index) => <button key={`${document.title}-${index}`} onClick={() => setActiveDoc(document)} className={`px-3 py-1 text-xs rounded uppercase font-bold ${activeDoc?.title === document.title ? "bg-blue-600" : "bg-slate-800"}`}>{document.title}</button>)}</div>
        {activeDoc && <><textarea value={activeDoc.content} onChange={(event) => setActiveDoc({ ...activeDoc, content: event.target.value })} className="w-full h-64 bg-slate-950 p-4 rounded text-xs font-mono text-slate-300" /><button onClick={copyActiveDocument} className="mt-2 w-full bg-green-700 py-2 rounded text-xs font-bold uppercase">Copy {activeDoc.title}</button>{copyMessage && <p className="text-xs text-emerald-400 mt-2">{copyMessage}</p>}</>}
        {sources.length > 0 && <div className="mt-5 pt-4 border-t border-slate-800"><h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Sources to verify</h3>{sources.map((source) => <a key={source.link} href={source.link} target="_blank" rel="noreferrer" className="block text-xs text-blue-400 hover:underline py-1">{source.title}</a>)}</div>}
      </div>}
    </div>
  );
}
