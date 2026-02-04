import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUPABASE_URL = "https://iymusojokibhgbuqhwza.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_x4oVk8QVoPsJ432g9859OA_eLPH1At5";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
