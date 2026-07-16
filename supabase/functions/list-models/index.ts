import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async () => {
  const apiKey = Deno.env.get("GEMINI_API_KEY");

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY not found." }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );

  const data = await response.json();

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
    },
  });
});