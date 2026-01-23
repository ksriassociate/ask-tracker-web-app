import { supabase } from "../supabaseClient";

/* =========================
   Create Hearing
========================= */
export async function createHearing(
  legalCaseId: number,
  hearingDate: string
) {
  const { data, error } = await supabase
    .from("legal_hearings")
    .insert({
      legal_case_id: legalCaseId,
      hearing_date: hearingDate,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* =========================
   Delete Hearing
========================= */
export async function deleteHearing(hearingId: number) {
  const { error } = await supabase
    .from("legal_hearings")
    .delete()
    .eq("id", hearingId);

  if (error) throw error;
}

/* =========================
   Upload Hearing PDF
========================= */
export async function uploadHearingPdf(
  file: File,
  hearingId: number
) {
  const filePath = `${hearingId}/${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("hearing-pdfs")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase
    .from("legal_hearings")
    .update({ pdf_path: filePath })
    .eq("id", hearingId);

  if (updateError) throw updateError;

  return filePath;
}

/* =========================
   Get Public PDF URL
========================= */
export function getPdfUrl(path: string) {
  return supabase.storage
    .from("hearing-pdfs")
    .getPublicUrl(path).data.publicUrl;
}
