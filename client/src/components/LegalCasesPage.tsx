import { useState, useEffect } from "react";
import { HearingModal } from "./HearingModal";
import { supabase } from "../supabaseClient";

interface Hearing {
  id?: number;
  hearing_date: string;
  pdf_path?: string;
}

interface LegalCase {
  id: number;
  case_number: string;
  court_name: string;
  location: string;
  petitioner_vs_respondent: string;
  summary: string;
  legal_hearings?: Hearing[];
}

export function LegalCasesPage() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);

  const [newCase, setNewCase] = useState({
    case_number: "",
    court_name: "",
    location: "",
    petitioner_vs_respondent: "",
    summary: "",
  });

  const [editingCaseId, setEditingCaseId] = useState<number | null>(null);
  const [activeCaseId, setActiveCaseId] = useState<number | null>(null);
  const [hearingDate, setHearingDate] = useState("");
  const [summaryModal, setSummaryModal] = useState<{open: boolean, content: string}>({open: false, content: ""});
  const [pdfModal, setPdfModal] = useState<{open: boolean, url?: string}>({open: false});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("legal_cases")
      .select(`*, legal_hearings (*)`)
      .order("created_at", { ascending: false });

    if (!error) setCases(data || []);
    setLoading(false);
  };

  /* =======================
     Actions
  ======================= */
  const saveCase = async () => {
    if (!newCase.case_number.trim()) return;
    if (editingCaseId === null) {
      await supabase.from("legal_cases").insert([newCase]);
    } else {
      await supabase.from("legal_cases").update(newCase).eq("id", editingCaseId);
    }
    setEditingCaseId(null);
    setNewCase({ case_number: "", court_name: "", location: "", petitioner_vs_respondent: "", summary: "" });
    fetchData();
  };

  const deleteCase = async (id: number) => {
    if (!confirm("Are you sure you want to delete this case and all its hearings?")) return;
    const { error } = await supabase.from("legal_cases").delete().eq("id", id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const deleteHearing = async (hearing: Hearing) => {
    if (!confirm("Delete this hearing and its attached PDF permanently?")) return;

    // 1. Delete the physical PDF file from Storage if it exists
    if (hearing.pdf_path) {
      // Extracts the relative path after 'case-documents/'
      const filePath = hearing.pdf_path.split("case-documents/")[1];
      if (filePath) {
        await supabase.storage.from("case-documents").remove([filePath]);
      }
    }

    // 2. Delete the record from the legal_hearings table
    const { error: dbError } = await supabase
      .from("legal_hearings")
      .delete()
      .eq("id", hearing.id);

    if (dbError) alert("Error: " + dbError.message);
    else fetchData();
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, hearingId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("case-documents").upload(`hearings/${cleanName}`, file);

    if (error) return alert("Upload failed: " + error.message);

    const { data: urlData } = supabase.storage.from("case-documents").getPublicUrl(`hearings/${cleanName}`);
    await supabase.from("legal_hearings").update({ pdf_path: urlData.publicUrl }).eq("id", hearingId);
    fetchData();
  };

  const todayStr = new Date().toISOString().split("T")[0];
  if (loading) return <div className="p-10 text-center">Loading Database...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Legal Cases</h1>

      {/* Case Entry Form */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-semibold mb-3">{editingCaseId ? "Edit Case" : "Add Case"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          <input className="border p-2 w-full" placeholder="Case Number" value={newCase.case_number} onChange={e => setNewCase({...newCase, case_number: e.target.value})} />
          <input className="border p-2 w-full" placeholder="Court Name" value={newCase.court_name} onChange={e => setNewCase({...newCase, court_name: e.target.value})} />
          <input className="border p-2 w-full" placeholder="Location" value={newCase.location} onChange={e => setNewCase({...newCase, location: e.target.value})} />
          <input className="border p-2 w-full" placeholder="Petitioner Vs Respondent" value={newCase.petitioner_vs_respondent} onChange={e => setNewCase({...newCase, petitioner_vs_respondent: e.target.value})} />
        </div>
        <textarea className="border p-2 w-full mt-2" placeholder="Case Summary" value={newCase.summary} onChange={e => setNewCase({...newCase, summary: e.target.value})} />
        <div className="flex gap-2">
          <button onClick={saveCase} className="bg-green-600 text-white px-4 py-2 rounded mt-2">
            {editingCaseId ? "Update Case" : "Save Case"}
          </button>
          {editingCaseId && (
            <button onClick={() => {setEditingCaseId(null); setNewCase({case_number:"", court_name:"", location:"", petitioner_vs_respondent:"", summary:""})}} className="bg-gray-400 text-white px-4 py-2 rounded mt-2">
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">S.No</th>
              <th className="p-2 border">Case Number</th>
              <th className="p-2 border">Court Name</th>
              <th className="p-2 border">Location</th>
              <th className="p-2 border">Petitioner Vs Respondent</th>
              <th className="p-2 border">Upcoming Hearings</th>
              <th className="p-2 border">Past Hearings</th>
              <th className="p-2 border">Summary</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c, index) => {
              const hearings = c.legal_hearings || []; 
              const future = hearings.filter(h => h.hearing_date >= todayStr);
              const past = hearings.filter(h => h.hearing_date < todayStr);

              return (
                <tr key={c.id} className="hover:bg-gray-50 text-sm">
                  <td className="p-2 border">{index + 1}</td>
                  <td className="p-2 border font-bold">{c.case_number}</td>
                  <td className="p-2 border">{c.court_name}</td>
                  <td className="p-2 border">{c.location}</td>
                  <td className="p-2 border">{c.petitioner_vs_respondent}</td>
                  <td className="p-2 border text-green-600">
                    {future.map(h => (
                      <div key={h.id} className="flex justify-between items-center group mb-1">
                        <span>• {h.hearing_date}</span>
                        <button onClick={() => deleteHearing(h)} className="text-red-400 opacity-0 group-hover:opacity-100 px-1">×</button>
                      </div>
                    ))}
                  </td>
                  <td className="p-2 border">
                    {past.map(h => (
                      <div key={h.id} className="flex justify-between items-center mb-2 gap-2 border-b last:border-0 pb-1">
                        <span>{h.hearing_date}</span>
                        <div className="flex gap-2">
                           {h.pdf_path ? (
                             <button onClick={() => setPdfModal({open: true, url: h.pdf_path})} className="text-blue-600 underline">PDF</button>
                           ) : (
                             <input type="file" className="w-16 text-[8px]" onChange={e => handlePdfUpload(e, h.id!)} />
                           )}
                           <button onClick={() => deleteHearing(h)} className="text-red-500 font-bold">×</button>
                        </div>
                      </div>
                    ))}
                  </td>
                  <td className="p-2 border text-center">
                    <button onClick={() => setSummaryModal({open: true, content: c.summary})} className="text-blue-600 underline">View</button>
                  </td>
                  <td className="p-2 border">
                    <div className="flex flex-col gap-1 text-[10px] font-bold">
                      <button onClick={() => {setEditingCaseId(c.id); setNewCase(c);}} className="text-blue-600 text-left hover:underline uppercase">Edit</button>
                      <button onClick={() => deleteCase(c.id)} className="text-red-600 text-left hover:underline uppercase">Delete</button>
                      <button onClick={() => setActiveCaseId(c.id)} className="text-green-600 text-left hover:underline uppercase">+ Hearing</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Hearing Modal */}
      {activeCaseId && (
        <HearingModal onClose={() => setActiveCaseId(null)} onSave={async () => {
          await supabase.from("legal_hearings").insert([{ legal_case_id: activeCaseId, hearing_date: hearingDate }]);
          setActiveCaseId(null);
          setHearingDate("");
          fetchData();
        }} date={hearingDate} setDate={setHearingDate} />
      )}

      {/* PDF View Modal */}
      {pdfModal.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded flex flex-col">
            <div className="p-3 border-b flex justify-between items-center bg-gray-50">
              <span className="font-bold">Hearing Document</span>
              <button onClick={() => setPdfModal({open: false})} className="text-2xl hover:text-red-600">&times;</button>
            </div>
            <iframe src={pdfModal.url} className="flex-1 w-full" />
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {summaryModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded shadow-xl max-w-2xl w-full">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Case Summary</h2>
            <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{summaryModal.content || "No summary provided."}</p>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setSummaryModal({open: false, content: ""})} className="bg-gray-800 text-white px-6 py-2 rounded">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}