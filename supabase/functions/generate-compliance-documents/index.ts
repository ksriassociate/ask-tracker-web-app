import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, genericResearchQuery, minimiseForAi, requireAiUser, requireAuthorisedSharing } from "../_shared/ai-security.ts";

const REQUIREMENTS: Record<string, string[]> = { "ADT-1": ["Board Resolution", "Intimation Letter", "Auditor Consent"], "INC-22": ["Board Resolution", "NOC", "Utility Bill Authorisation"], "DIR-12": ["Board Resolution", "Resignation / DIR-2"], "MGT-14": ["Certified Resolution", "Explanatory Statement"], "PAS-3": ["Board Resolution", "List of Allottees"], "SH-7": ["Board Resolution", "EGM Notice"], "CHG-1": ["Charge Instrument", "Board Resolution"], "AOC-4": ["Board Resolution", "Director's Report"] };
const respond = (request: Request, data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders(request), "Content-Type": "application/json" } });

serve(async (request) => {
  try {
    const headers = corsHeaders(request);
    if (request.method === "OPTIONS") return new Response("ok", { headers });
    if (request.method !== "POST") return respond(request, { error: "Method not allowed" }, 405);
    const body = await request.json();
    requireAuthorisedSharing(body.dataProcessingConsent);
    const { companyId, formCode, formName, fields = {}, notes = "", requiredSupportingDocuments = [] } = body;
    if (!companyId || !formCode) throw new Error("companyId and formCode are required.");
    const supabase = await requireAiUser(request, "compliance_documents");
    const [{ data: company, error: companyError }, { data: tasks, error: tasksError }] = await Promise.all([
      supabase.from("customers").select("id,company_name,status").eq("id", companyId).single(),
      supabase.from("tasks").select("title,due_date,priority,status").eq("assign_to_customer", companyId).order("created_at", { ascending: false }).limit(10),
    ]);
    if (companyError || tasksError) throw companyError || tasksError;
    const serperKey = Deno.env.get("SERPER_API_KEY"); const geminiKey = Deno.env.get("GEMINI_API_KEY"); const model = Deno.env.get("GEMINI_MODEL");
    if (!serperKey || !geminiKey || !model) throw new Error("AI provider secrets are not configured.");
    // Search has no company name or client facts.
    const search = await fetch("https://google.serper.dev/search", { method: "POST", headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" }, body: JSON.stringify({ q: genericResearchQuery(`${formCode} ${formName || ""} Companies Act`), gl: "in", num: 5 }) });
    if (!search.ok) throw new Error("Research service failed.");
    const searchData = await search.json(); const sources = (searchData.organic || []).slice(0, 5).map((item: any) => ({ title: item.title || "Source", link: item.link || "", snippet: item.snippet || "" }));
    const documents = requiredSupportingDocuments.length ? requiredSupportingDocuments : REQUIREMENTS[formCode] || ["Board Resolution"];
    const prompt = `Create editable Indian corporate-compliance working drafts, not legal advice. Use only supplied facts. Never invent dates, statutory provisions, signatures, or identifiers. Use [VERIFY] for missing facts. Research leads are not authority.\n\nFiling: ${formCode} — ${formName || ""}\nCompany: ${JSON.stringify(minimiseForAi(company))}\nTasks: ${JSON.stringify(minimiseForAi(tasks || []))}\nUser facts: ${JSON.stringify(minimiseForAi(fields))}\nNotes: ${minimiseForAi(notes)}\nRequired documents: ${JSON.stringify(documents)}\nResearch leads: ${JSON.stringify(sources)}\n\nReturn JSON only: {"documents":[{"title":"Document title","content":"Editable draft"}],"assumptions":["facts to verify"]}.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiKey)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }) });
    const result = await response.json(); if (!response.ok || result.error) throw new Error(result.error?.message || "Drafting service failed.");
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text; if (!text) throw new Error("No draft returned.");
    const generated = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
    return respond(request, { documents: generated.documents || [], assumptions: generated.assumptions || [], sources });
  } catch (error) { return respond(request, { error: error instanceof Error ? error.message : "Unexpected error" }, 400); }
});
