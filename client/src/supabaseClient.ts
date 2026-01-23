import { createClient } from '@supabase/supabase-js';

// --- This is the correct section for your project (using Vite) ---
// Using the exact variable names from your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// -----------------------------------------------------------------

// Basic validation for credentials
if (!supabaseUrl) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL. Please check your .env file.');
}
if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY. Please check your .env file.');
}

// Create and export the Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
