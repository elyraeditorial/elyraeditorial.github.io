import { supabase } from "./supabaseClient.js";

/** Contest by slug */
export async function fetchContestBySlug(slug){
  const { data, error } = await supabase
    .from("contests")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if(error) throw error;
  return data;
}

/** Contestant by id */
export async function fetchContestantById(id){
  const { data, error } = await supabase
    .from("contestants")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if(error) throw error;
  return data;
}

/**
 * Live totals for a contestant, from view: public.contestant_vote_totals
 * Returns: { free_votes, paid_votes, total_votes }
 */
export async function fetchVoteTotalsForContestant(contestantId){
  const { data, error } = await supabase
    .from("contestant_vote_totals")
    .select("free_votes, paid_votes, total_votes")
    .eq("contestant_id", contestantId)
    .maybeSingle();

  if(error) throw error;
  return data || { free_votes: 0, paid_votes: 0, total_votes: 0 };
}

/**
 * Organizer dashboard totals (per contest)
 * Requires a simple view or RPC. Easiest: query contestants and totals view.
 * This returns totals aggregated for a contest.
 */
export async function fetchContestDashboardTotals(contestId){
  // total contestants in contest
  const { count: contestantsCount, error: cErr } = await supabase
    .from("contestants")
    .select("id", { count: "exact", head: true })
    .eq("contest_id", contestId);

  if(cErr) throw cErr;

  // sum totals from contestant_vote_totals
  const { data: rows, error: tErr } = await supabase
    .from("contestant_vote_totals")
    .select("free_votes, paid_votes, total_votes")
    .eq("contest_id", contestId);

  if(tErr) throw tErr;

  let free_votes = 0, paid_votes = 0, total_votes = 0;
  for(const r of (rows || [])){
    free_votes += Number(r.free_votes || 0);
    paid_votes += Number(r.paid_votes || 0);
    total_votes += Number(r.total_votes || 0);
  }

  return {
    contest_id: contestId,
    contestants: Number(contestantsCount || 0),
    free_votes,
    paid_votes,
    total_votes
  };
}
