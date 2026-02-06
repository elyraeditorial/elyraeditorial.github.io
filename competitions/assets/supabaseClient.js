import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUPABASE_URL = "https://iymusojokibhgbuqhwza.supabase.co";

// IMPORTANT:
// Put your REAL Supabase "anon public" key here (the long JWT that starts with eyJ...)
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5bXVzb2pva2liaGdidXFod3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODU2ODMsImV4cCI6MjA4NTc2MTY4M30.sookF7oBeRxeRK85Dww9G7tsB7Os_Vg1dudvztyaRqo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // this helps your login persist + work reliably after magic-link callback
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
