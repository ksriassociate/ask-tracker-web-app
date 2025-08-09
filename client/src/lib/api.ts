// src/lib/api.ts
const API_URL = import.meta.env.VITE_SUPABASE_URL;
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!API_URL || !API_KEY) {
  throw new Error("Missing Supabase environment variables.");
}

export async function apiRequest(
  method: string,
  path: string,
  data?: unknown
): Promise<any> {
  const response = await fetch(`${API_URL}/rest/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: API_KEY,
      Authorization: `Bearer ${API_KEY}`,
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  return await response.json();
}
