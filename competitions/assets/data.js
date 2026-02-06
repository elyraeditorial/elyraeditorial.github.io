import { supabase } from "./supabaseClient.js";

/**
 * Fetch a contest by its slug
 */
export async function fetchContestBySlug(slug){
  const { data, error } = await supabase
    .from("contests")
    .select("*")
    .eq("slug", slug)
    .single();

  if(error) throw error;
  return data;
}

/**
 * Fetch a contestant by UUID
 */
export async function fetchContestantById(id){
  const { data, error } = await supabase
    .from("contestants")
    .select("*")
    .eq("id", id)
    .single();

  if(error) throw error;
  return data;
}

/**
 * Live vote totals for a contestant
 * Requires the SQL view + RPC from the Supabase SQL section.
 */
export async function fetchVoteTotalsForContestant(contestantId){
  // Preferred: RPC (clean + fast)
  const { data, error } = await supabase
    .rpc("get_contestant_vote_totals", { p_contestant_id: contestantId });

  if(error){
    // Fallback: direct view query (if RPC name differs)
    const { data: v, error: e2 } = await supabase
      .from("contestant_vote_totals")
      .select("contestant_id, contest_id, free_votes, paid_votes, total_votes")
      .eq("contestant_id", contestantId)
      .single();

    if(e2) throw e2;
    return v;
  }

  // RPC returns an array table result
  return Array.isArray(data) ? data[0] : data;
}

/**
 * Organizer dashboard totals for a contest
 * Requires the SQL view + RPC from the Supabase SQL section.
 */
export async function fetchContestDashboardTotals(contestId){
  const { data, error } = await supabase
    .rpc("get_contest_dashboard_totals", { p_contest_id: contestId });

  if(error){
    // Fallback: direct view query
    const { data: v, error: e2 } = await supabase
      .from("contest_dashboard_totals")
      .select("contest_id, slug, contestants, free_votes, paid_votes, total_votes")
      .eq("contest_id", contestId)
      .single();

    if(e2) throw e2;
    return v;
  }

  return Array.isArray(data) ? data[0] : data;
}

/**
 * Organizer: fetch all contests (handy for a dropdown)
 */
export async function fetchAllContests(){
  const { data, error } = await supabase
    .from("contests")
    .select("id, title, slug, created_at")
    .order("created_at", { ascending: false });

  if(error) throw error;
  return data || [];
}

/**
 * Organizer: list contestants for a contest with live totals
 * Uses the view: contestant_vote_totals
 */
export async function fetchContestantsWithTotals(contestId){
  // We join contestants + totals by selecting from contestants and then per contestant call totals (safe + simple)
  // If you want faster later, we can build one SQL view that joins automatically.
  const { data: contestants, error } = await supabase
    .from("contestants")
    .select("id, display_name, bio, photo_url, created_at")
    .eq("contest_id", contestId)
    .order("created_at", { ascending: true });

  if(error) throw error;

  const rows = [];
  for(const c of (contestants || [])){
    try{
      const t = await fetchVoteTotalsForContestant(c.id);
      rows.push({ ...c, totals: t || null });
    }catch{
      rows.push({ ...c, totals: null });
    }
  }
  return rows;
}
