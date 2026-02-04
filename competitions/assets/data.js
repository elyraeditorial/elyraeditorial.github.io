import { supabase } from "./supabaseClient.js";

export async function fetchActiveContests(){
  const { data, error } = await supabase
    .from("contests")
    .select("id, slug, title, subtitle, status, start_at, end_at, hero_image_url")
    .eq("status", "active")
    .order("start_at", { ascending: false });

  if(error) throw error;
  return data || [];
}

export async function fetchContestBySlug(slug){
  const { data, error } = await supabase
    .from("contests")
    .select("id, slug, title, subtitle, status, start_at, end_at, hero_image_url")
    .eq("slug", slug)
    .maybeSingle();

  if(error) throw error;
  return data;
}

export async function fetchContestants(contestId){
  const { data, error } = await supabase
    .from("contestants")
    .select("id, contest_id, display_name, bio, photo_url, is_published")
    .eq("contest_id", contestId)
    .eq("is_published", true)
    .order("display_name", { ascending: true });

  if(error) throw error;
  return data || [];
}

export async function fetchContestantById(id){
  const { data, error } = await supabase
    .from("contestants")
    .select("id, contest_id, display_name, bio, photo_url, is_published")
    .eq("id", id)
    .maybeSingle();

  if(error) throw error;
  return data;
}

// Count ONLY the logged-in user's votes for this contestant (RLS "read own" supports this)
export async function getMyVoteCountForContestant(contestantId){
  const { count, error } = await supabase
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("contestant_id", contestantId);

  if(error) throw error;
  return count ?? 0;
}
