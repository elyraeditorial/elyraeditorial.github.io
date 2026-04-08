import { supabase } from "./supabaseClient.js?v=16";

/** Active contests list */
export async function fetchActiveContests() {
  const { data, error } = await supabase
    .from("contests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const now = Date.now();

  const rows = (data || []).filter(c => {
    if (typeof c.status === "string" && c.status.length) {
      const s = c.status.toLowerCase();
      if (["active","open","live"].includes(s)) return true;
      if (["closed","ended","draft"].includes(s)) return false;
    }

    if (typeof c.is_active === "boolean") return c.is_active;

    const startOk = !c.start_at || (new Date(c.start_at).getTime() <= now);
    const endOk = !c.end_at || (new Date(c.end_at).getTime() >= now);
    return startOk && endOk;
  });

  return rows.filter(c => !!c.slug);
}
