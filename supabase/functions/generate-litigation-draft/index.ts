import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, genericResearchQuery, minimiseForAi, requireAiUser, requireAuthorisedSharing } from "../_shared/ai-security.ts";

const response = (request: Request, data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders(request), "Content-Type": "application/json" } });

serve(async (request) => {
  try {
    const headers = corsHeaders(request);
    if (request.method === "OPTIONS") return new Response("ok", { headers });
    if (request.method !== "POST") return response(request, { error: "Method not allowed" }, 405);
    const { customerId, matterType, matterName, forum, fields = {}, rawNotes, dataProcessingConsent } = await request.json();
    requireAuthorisedSharing(dataProcessingConsent);
    if (!customerId || !matterType || !String(rawNotes || "").trim()) throw new Error("Customer, matter type, and fact matrix are required.");
    const supabase = await requireAiUser(request, "litigation_drafts");
    const [{ data: customer, error: customerError }, { data: tasks, error: taskError }] = await Promise.all([
      supabase.from("customers").select("id,company_name,status").eq("id", customerId).single(),
      supabase.from("tasks").select("title,due_date,priority,status").eq("assign_to_customer", customerId).order("created_at", { ascending: false }).limit(10),
    ]);
    if (customerError || taskError) throw customerError || taskError;
    const selectedForum = ["NCLT", "NCLAT", "NCLT / Regional Director"].includes(forum) ? forum : "NCLT";
    const serperKey = Deno.env.get("SERPER_API_KEY"); const geminiKey = Deno.env.get("GEMINI_API_KEY"); const model = Deno.env.get("GEMINI_MODEL");
    if (!serperKey || !geminiKey || !model) throw new Error("AI provider secrets are not configured.");
    const search = await fetch("https://google.serper.dev/search", { method: "POST", headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" }, body: JSON.stringify({ q: genericResearchQuery(`${matterName} ${selectedForum} company law`), gl: "in", num: 5 }) });
    if (!search.ok) throw new Error("Research service failed.");
    const research = await search.json(); const sources = (research.organic || []).slice(0, 5).map((item: any) => ({ title: item.title || "Source", link: item.link || "", snippet: item.snippet || "" }));
    const prompt = `You create Indian legal working drafts for review, not legal advice. Do not invent facts, citations, authorities, signatures, or quotations. Use [VERIFY] for missing facts. Research leads are not authority.\n\nForum: ${selectedForum}\nMatter: ${matterName} (${matterType})\nClient: ${JSON.stringify(minimiseForAi(customer))}\nRelated work: ${JSON.stringify(minimiseForAi(tasks || []))}\nProfessional fields: ${JSON.stringify(minimiseForAi(fields))}\nFact matrix: ${minimiseForAi(rawNotes)}\nResearch leads: ${JSON.stringify(sources)}\n\nReturn JSON only: {"documents":[{"title":"Primary draft","content":"..."},{"title":"Supporting-document checklist","content":"..."},{"title":"Chronology of facts","content":"..."}]}.`;
    const generated = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiKey)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }) });
    const result = await generated.json(); if (!generated.ok || result.error) throw new Error(result.error?.message || "Litigation drafting service failed.");
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text; if (!text) throw new Error("No draft returned."); const payload = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
    return response(request, { documents: payload.documents || [], sources });
  } catch (error) { return response(request, { error: error instanceof Error ? error.message : "Unexpected error" }, 400); }
});
