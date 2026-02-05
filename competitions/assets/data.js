import { supabase } from "./supabaseClient.js";

export async function fetchActiveContests(){
  const { data, error } = await supabase
    .from("contests")
    .select("id, slug, title, subtitle, status, start_at, end_at, hero_image_url")
    .eq("status", "active")
    .order("start_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchContestBySlug(slug){
  const { data, error } = await supabase
    .from("contests")
    .select("id, slug, title, subtitle, status, start_at, end_at, hero_image_url")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchContestants(contestId){
  const { data, error } = await supabase
    .from("contestants")
    .select("id, contest_id, display_name, bio, photo_url, is_published")
    .eq("contest_id", contestId)
    .eq("is_published", true)
    .order("display_name", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchContestantById(id){
  const { data, error } = await supabase
    .from("contestants")
    .select("id, contest_id, display_name, bio, photo_url, is_published")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * ✅ PUBLIC totals for a whole contest (reads from your vote_totals VIEW)
 * Requires you already created vote_totals and granted SELECT.
 */
export async function fetchVoteTotalsByContest(contestId){
  const { data, error } = await supabase
    .from("vote_totals")
    .select("contestant_id, contest_id, paid_votes, free_votes, total_votes")
    .eq("contest_id", contestId)
    .order("total_votes", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * ✅ PUBLIC totals for one contestant (handy for contestant.html)
 */
export async function fetchVoteTotalsByContestant(contestantId){
  const { data, error } = await supabase
    .from("vote_totals")
    .select("contestant_id, contest_id, paid_votes, free_votes, total_votes")
    .eq("contestant_id", contestantId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

/**
 * ✅ FIXED: this used to query "votes" (wrong table for your build)
 * Your schema uses free_votes + paid_votes (and RLS should allow each user to see their own free votes).
 *
 * Returns how many FREE votes the logged-in user has cast for this contestant.
 */
export async function getMyFreeVoteCountForContestant(contestantId){
  const { count, error } = await supabase
    .from("free_votes")
    .select("id", { count: "exact", head: true })
    .eq("contestant_id", contestantId);

  if (error) throw error;
  return count ?? 0;
}
