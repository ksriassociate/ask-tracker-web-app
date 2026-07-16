export async function saveLitigationTask({
  supabase,
  title,
  customerId,
  employeeId,
  deadline,
  caseNumber,
  court = "NCLT",
  bench,
  parties,
  summary,
  hearingDate,
  hearingTime,
  caseStatus = "Active Hearing",
}) {
  if (!title?.trim()) throw new Error("Task title is required.");
  if (!caseNumber?.trim()) throw new Error("Case number is required for a litigation task.");
  if (!parties?.trim()) throw new Error("Petitioner and respondent details are required.");

  const { data: legalCase, error: caseError } = await supabase
    .from("legal_cases")
    .upsert(
      {
        case_number: caseNumber.trim(),
        customer_id: customerId ? Number(customerId) : null,
        court_name: court.trim() || "NCLT",
        location: bench?.trim() || "[VERIFY BENCH]",
        petitioner_vs_respondent: parties.trim(),
        summary: summary?.trim() || title.trim(),
        status: caseStatus,
      },
      { onConflict: "case_number" },
    )
    .select("id")
    .single();
  if (caseError) throw caseError;

  // Existing databases can contain duplicate dates. Update the first matching
  // hearing instead of relying on upsert/onConflict with a non-existent unique key.
  if (hearingDate) {
    const { data: existing, error: findHearingError } = await supabase
      .from("legal_hearings")
      .select("id")
      .eq("legal_case_id", legalCase.id)
      .eq("hearing_date", hearingDate)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (findHearingError) throw findHearingError;

    const hearing = {
      legal_case_id: legalCase.id,
      hearing_date: hearingDate,
      hearing_time: hearingTime || null,
    };
    const { error: hearingError } = existing
      ? await supabase.from("legal_hearings").update(hearing).eq("id", existing.id)
      : await supabase.from("legal_hearings").insert(hearing);
    if (hearingError) throw hearingError;
  }

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      title: title.trim(),
      description: summary?.trim() || null,
      due_date: deadline || null,
      priority: "MEDIUM",
      status: employeeId ? "Assigned" : "Pending",
      workstream: "LITIGATION",
      assign_to_customer: customerId ? Number(customerId) : null,
      assign_to_employee: employeeId ? Number(employeeId) : null,
      legal_case_id: legalCase.id,
    })
    .select("id, legal_case_id")
    .single();
  if (taskError) throw taskError;

  return task;
}
