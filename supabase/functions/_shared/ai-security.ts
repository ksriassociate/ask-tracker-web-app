import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const rolesAllowedToGenerate = new Set(["principal_admin", "partner", "manager", "associate"]);

export function corsHeaders(request: Request) {
  const allowed = (Deno.env.get("ALLOWED_WEB_ORIGINS") || "http://localhost:5173")
    .split(",").map((value) => value.trim()).filter(Boolean);
  const origin = request.headers.get("origin") || "";
  if (origin && !allowed.includes(origin)) throw new Error("This website is not authorised to call FirmAxis AI services.");
  return {
    "Access-Control-Allow-Origin": origin || allowed[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

export async function requireAiUser(request: Request, feature: "compliance_documents" | "litigation_drafts" | "tax_documents") {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) throw new Error("Please sign in before generating a draft.");
  const supabase = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_ANON_KEY") || "", { global: { headers: { Authorization: authorization } } });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Your session is invalid. Please sign in again.");
  const { data: profile, error: profileError } = await supabase.from("user_profiles").select("role,is_active").eq("id", userData.user.id).maybeSingle();
  if (profileError || !profile?.is_active || !rolesAllowedToGenerate.has(profile.role)) throw new Error("Your role is not allowed to generate AI drafts.");
  const { data: allowed, error: quotaError } = await supabase.rpc("consume_ai_quota", { p_feature: feature, p_daily_limit: 20 });
  if (quotaError) throw new Error(`AI usage control is unavailable: ${quotaError.message}`);
  if (!allowed) throw new Error("Daily AI draft limit reached. Ask a Principal Admin if additional capacity is required.");
  return supabase;
}

export function requireAuthorisedSharing(value: unknown) {
  if (value !== true) throw new Error("Confirm that you are authorised to share the minimum necessary facts with the configured research and drafting providers.");
}

// Never send identifiers, contact details, bank data, or tax IDs to Serper.
export function genericResearchQuery(topic: string) { return `${String(topic).slice(0, 180)} India compliance guidance`; }
export function minimiseForAi(value: unknown): unknown {
  const blocked = new Set(["email", "phone", "phone_number", "contact_person", "cin", "gst", "gst_number", "pan", "tan", "aadhaar", "bank", "account_number", "password", "otp"]);
  if (Array.isArray(value)) return value.map(minimiseForAi);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !blocked.has(key.toLowerCase())).map(([key, item]) => [key, minimiseForAi(item)]));
  if (typeof value === "string") return value.replace(/[A-Z]{5}[0-9]{4}[A-Z]/gi, "[REDACTED-PAN]").replace(/\b\d{12}\b/g, "[REDACTED-ID]").replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[REDACTED-EMAIL]").slice(0, 12000);
  return value;
}
