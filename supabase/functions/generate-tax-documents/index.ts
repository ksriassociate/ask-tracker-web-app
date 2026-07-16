import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, genericResearchQuery, minimiseForAi, requireAiUser, requireAuthorisedSharing } from "../_shared/ai-security.ts";

const response = (request: Request, data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders(request), "Content-Type": "application/json" } });

serve(async (request) => {
  try {
    const headers = corsHeaders(request);
    if (request.method === "OPTIONS") return new Response("ok", { headers });
    if (request.method !== "POST") return response(request, { error: "Method not allowed" }, 405);
    const { customerId, filingId, extraFacts, dataProcessingConsent } = await request.json();
    requireAuthorisedSharing(dataProcessingConsent);
    if (!customerId || !filingId || !String(extraFacts || "").trim()) throw new Error("Customer, filing, and additional facts are required.");
    const supabase = await requireAiUser(request, "tax_documents");
    const [{ data: customer, error: customerError }, { data: profile, error: profileError }, { data: filing, error: filingError }] = await Promise.all([
      supabase.from("customers").select("id,company_name,status").eq("id", customerId).single(),
      supabase.from("tax_profiles").select("tax_residency,gst_registration_type,income_tax_status").eq("customer_id", customerId).maybeSingle(),
      supabase.from("tax_filings").select("id,tax_type,form_code,tax_period,due_date,status,amount_payable,interest_or_penalty,risk_level,notes").eq("id", filingId).eq("customer_id", customerId).single(),
    ]);
    if (customerError || profileError || filingError) throw customerError || profileError || filingError;
    const serperKey = Deno.env.get("SERPER_API_KEY"); const geminiKey = Deno.env.get("GEMINI_API_KEY"); const model = Deno.env.get("GEMINI_MODEL");
    if (!serperKey || !geminiKey || !model) throw new Error("AI provider secrets are not configured.");
    const search = await fetch("https://google.serper.dev/search", { method: "POST", headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" }, body: JSON.stringify({ q: genericResearchQuery(`${filing.tax_type} ${filing.form_code || "return"}`), gl: "in", num: 5 }) });
    if (!search.ok) throw new Error("Research service failed.");
    const research = await search.json(); const sources = (research.organic || []).slice(0, 5).map((item: any) => ({ title: item.title || "Source", link: item.link || "", snippet: item.snippet || "" }));
    const prompt = `You create Indian tax-compliance working drafts for review, not tax advice. Do not invent rates, portal facts, acknowledgements, certificates, challans, figures, or citations. Use [VERIFY] for missing facts. Research leads are not authority.\n\nClient: ${JSON.stringify(minimiseForAi(customer))}\nTax profile: ${JSON.stringify(minimiseForAi(profile || {}))}\nFiling: ${JSON.stringify(minimiseForAi(filing))}\nProfessional facts: ${minimiseForAi(extraFacts)}\nResearch leads: ${JSON.stringify(sources)}\n\nReturn JSON only: {"documents":[{"title":"Client information request / checklist","content":"..."},{"title":"CA working-paper checklist","content":"..."},{"title":"Client confirmation / covering email","content":"..."}],"assumptions":["facts to verify"]}.`;
    const generated = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiKey)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }) });
    const result = await generated.json(); if (!generated.ok || result.error) throw new Error(result.error?.message || "Tax drafting service failed.");
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text; if (!text) throw new Error("No draft returned."); const payload = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
    return response(request, { documents: payload.documents || [], assumptions: payload.assumptions || [], sources });
  } catch (error) { return response(request, { error: error instanceof Error ? error.message : "Unexpected error" }, 400); }
});
