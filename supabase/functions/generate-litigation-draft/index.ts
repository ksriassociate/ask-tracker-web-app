import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, genericResearchQuery, minimiseForAi, requireAiUser, requireAuthorisedSharing } from "../_shared/ai-security.ts";

const response = (request: Request, data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders(request), "Content-Type": "application/json" } });

serve(async (request) => {
  try {
    if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
    if (request.method !== "POST") return response(request, { error: "Method not allowed" }, 405);

    const { customerId, legalCaseId, matterType, matterName, forum, fields = {}, rawNotes, attachmentName = "", attachmentText = "", dataProcessingConsent } = await request.json();
    requireAuthorisedSharing(dataProcessingConsent);
    if ((!customerId && !legalCaseId) || !matterType || !String(rawNotes || "").trim()) throw new Error("A client or litigation case, matter type and factual instructions are required.");
    const supabase = await requireAiUser(request, "litigation_drafts");

    const [customerResult, caseResult, taskResult] = await Promise.all([
      customerId ? supabase.from("customers").select("id,company_name,status").eq("id", customerId).maybeSingle() : Promise.resolve({ data: null, error: null }),
      legalCaseId ? supabase.from("legal_cases").select("id,case_number,court_name,location,petitioner_vs_respondent,summary").eq("id", legalCaseId).maybeSingle() : Promise.resolve({ data: null, error: null }),
      customerId ? supabase.from("tasks").select("title,due_date,priority,status").eq("assign_to_customer", customerId).order("created_at", { ascending: false }).limit(10) : Promise.resolve({ data: [], error: null }),
    ]);
    if (customerResult.error || caseResult.error || taskResult.error) throw customerResult.error || caseResult.error || taskResult.error;
    if (customerId && !customerResult.data) throw new Error("The selected client was not found.");
    if (legalCaseId && !caseResult.data) throw new Error("The selected litigation case was not found.");

    const selectedForum = ["NCLT", "NCLAT", "NCLT / Regional Director", "NCLT / NCLAT"].includes(forum) ? forum : "NCLT";
    const serperKey = Deno.env.get("SERPER_API_KEY"); const geminiKey = Deno.env.get("GEMINI_API_KEY"); const model = Deno.env.get("GEMINI_MODEL");
    if (!serperKey || !geminiKey || !model) throw new Error("AI provider secrets are not configured.");
    const search = await fetch("https://google.serper.dev/search", { method: "POST", headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" }, body: JSON.stringify({ q: genericResearchQuery(`${matterName} ${selectedForum} company law`), gl: "in", num: 5 }) });
    if (!search.ok) throw new Error("Research service failed.");
    const research = await search.json();
    const sources = (research.organic || []).slice(0, 5).map((item: any) => ({ title: item.title || "Source", link: item.link || "", snippet: item.snippet || "" }));
    const isOrderSubmission = matterType === "ORDER_COPY_SUBMISSION";
    const isCustomDocument = matterType === "OTHER_CUSTOM_DOCUMENT";
    const outputInstruction = isOrderSubmission
      ? `Return JSON only with {"documents":[{"title":"Covering Letter — Submission of Order Copy","content":"..."},{"title":"Submission Checklist","content":"..."},{"title":"Acknowledgement Sheet","content":"..."}]}. The covering letter must state that the original order copy and exactly ${String(fields.copyCount || "2")} additional copy/copies are being submitted, ask for acknowledgement, and use [VERIFY] where recipient, date, reference or enclosures are missing.`
      : isCustomDocument
        ? `Return JSON only with {"documents":[{"title":"${String(fields.documentTitle || "Custom litigation document").replace(/"/g, "'")}","content":"..."},{"title":"Supporting-document checklist","content":"..."}]}. Create only the document requested in the professional fields and fact matrix. Use the case information as context. Do not force an NCLT/NCLAT petition format. Use [VERIFY] for every missing fact.`
      : `Return JSON only with {"documents":[{"title":"Primary draft","content":"..."},{"title":"Supporting-document checklist","content":"..."},{"title":"Chronology of facts","content":"..."}]}.`;
    const prompt = `You create Indian legal working drafts for review, not legal advice. Do not invent facts, citations, authorities, signatures, filing dates or quotations. Use [VERIFY] for missing facts. Research leads are not authority.\n\nForum: ${selectedForum}\nMatter: ${matterName} (${matterType})\nClient: ${JSON.stringify(minimiseForAi(customerResult.data))}\nExisting litigation case: ${JSON.stringify(minimiseForAi(caseResult.data))}\nRelated work: ${JSON.stringify(minimiseForAi(taskResult.data || []))}\nProfessional fields: ${JSON.stringify(minimiseForAi(fields))}\nFact matrix: ${minimiseForAi(rawNotes)}\nTemporary attachment name: ${String(attachmentName).slice(0, 200)}\nTemporary attachment text: ${minimiseForAi(String(attachmentText).slice(0, 30000))}\nResearch leads: ${JSON.stringify(sources)}\n\nUse attachment text only as unverified factual context; it is not legal authority. ${outputInstruction}`;
    const generated = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiKey)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }) });
    const result = await generated.json();
    if (!generated.ok || result.error) throw new Error(result.error?.message || "Litigation drafting service failed.");
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No draft returned.");
    const payload = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
    return response(request, { documents: payload.documents || [], sources });
  } catch (error) {
    return response(request, { error: error instanceof Error ? error.message : "Unexpected error" }, 400);
  }
});
