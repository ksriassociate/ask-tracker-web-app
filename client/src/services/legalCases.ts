import { supabase } from "../supabaseClient";

/* =========================
   Create Legal Case
========================= */
export async function createLegalCase(data: {
  caseNumber: string;
  courtName: string;
  location: string;
  petitionerVsRespondent: string;
  summary?: string;
}) {
  const { data: result, error } = await supabase
    .from("legal_cases")
    .insert({
      case_number: data.caseNumber,
      court_name: data.courtName,
      location: data.location,
      petitioner_vs_respondent: data.petitionerVsRespondent,
      summary: data.summary ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}

/* =========================
   Fetch Cases with Hearings
========================= */
export async function fetchLegalCases() {
  const { data, error } = await supabase
    .from("legal_cases")
    .select(`
      id,
      case_number,
      court_name,
      location,
      petitioner_vs_respondent,
      summary,
      legal_hearings (
        id,
        hearing_date,
        pdf_path
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/* =========================
   Delete Legal Case
========================= */
export async function deleteLegalCase(caseId: number) {
  const { error } = await supabase
    .from("legal_cases")
    .delete()
    .eq("id", caseId);

  if (error) throw error;
}
