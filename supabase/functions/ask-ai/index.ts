import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Collect the document text AND the frontend template
    const { textContent, targetTemplate } = await req.json()

    if (!textContent || !targetTemplate) {
      throw new Error("Missing textContent or targetTemplate parameter.")
    }

    const prompt = `You are an expert Indian Corporate Compliance Officer.
Analyze the raw text extracted from the MCA filing.

Extract data that strictly fits the keys provided in the JSON template below. Do not add any new keys, and do not change the existing key names. If a value cannot be found in the text, use "Not Disclosed".

Target JSON Template Structure:
${JSON.stringify(targetTemplate, null, 2)}

Document Text Content:
\"\"\"
${textContent}
\"\"\"

Respond ONLY with a valid JSON object matching the exact keys of the target template. Do not include markdown formatting or extra text.`;

    const geminiPayload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload)
      }
    )

    const data = await response.json()
    const extractedJson = data.candidates[0].content.parts[0].text

    return new Response(extractedJson, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})