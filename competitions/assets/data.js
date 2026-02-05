import { supabase } from "./supabaseClient.js";

/* =========================
   Contests + Contestants
   ========================= */

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
  if(!slug) return null;

  const { data, error } = await supabase
    .from("contests")
    .select("id, slug, title, subtitle, status, start_at, end_at, hero_image_url")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function fetchContestants(contestId){
  if(!contestId) return [];

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
  if(!id) return null;

  const { data, error } = await supabase
    .from("contestants")
    .select("id, contest_id, display_name, bio, photo_url, is_published")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

/* =========================
   Vote totals (FREE + PAID)
   Reads from your SQL VIEW: vote_totals
   ========================= */

export async function fetchVoteTotalsByContest(contestId){
  if(!contestId) return [];

  const { data, error } = await supabase
    .from("vote_totals")
    .select("contestant_id, contest_id, paid_votes, free_votes, total_votes")
    .eq("contest_id", contestId)
    .order("total_votes", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchVoteTotalsByContestant(contestantId){
  if(!contestantId) return null;

  const { data, error } = await supabase
    .from("vote_totals")
    .select("contestant_id, contest_id, paid_votes, free_votes, total_votes")
    .eq("contestant_id", contestantId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

/* =========================
   "My votes" (logged-in user)
   =========================
   This matches your current vote.js which inserts into: votes
   (vote_type = "free" or "paid")
*/

export async function getMyFreeVoteCountForContestant(contestantId){
  if(!contestantId) return 0;

  // RLS should allow a logged-in user to count their own rows.
  const { count, error } = await supabase
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("contestant_id", contestantId)
    .eq("vote_type", "free");

  if (error) throw error;
  return count ?? 0;
}

export async function getMyTotalVoteCountForContestant(contestantId){
  if(!contestantId) return 0;

  // Optional helper: counts *all* vote rows the user has for that contestant.
  const { count, error } = await supabase
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("contestant_id", contestantId);

  if (error) throw error;
  return count ?? 0;
}
