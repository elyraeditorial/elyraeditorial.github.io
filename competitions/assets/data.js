import { supabase } from "./supabaseClient.js";

/** ✅ Active contests list */
export async function fetchActiveContests(){
  const { data, error } = await supabase
    .from("contests")
    .select("id, slug, title, subtitle, start_at, end_at, status")
    .order("created_at", { ascending: false });

  if(error) throw error;

  const now = Date.now();

  const rows = (data || []).filter(c => {
    // Status-based: you have "active"
    if (typeof c.status === "string" && c.status.length) {
      const s = c.status.toLowerCase();
      if (s === "active" || s === "open" || s === "live") return true;
      if (s === "closed" || s === "ended" || s === "draft") return false;
    }
    // Date fallback
    const startOk = !c.start_at || (new Date(c.start_at).getTime() <= now);
    const endOk   = !c.end_at   || (new Date(c.end_at).getTime() >= now);
    return startOk && endOk;
  });

  return rows.filter(c => !!c.slug);
}

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

/** ✅ Contestants for a contest (THIS FIXES THE LOADING on contest.html) */
export async function fetchContestantsByContestId(contestId){
  const { data, error } = await supabase
    .from("contestants")
    .select("id, contest_id, display_name, bio, photo_url, is_published, created_at")
    .eq("contest_id", contestId)
    .order("created_at", { ascending: true });

  if(error) throw error;

  // If you use is_published, only show published
  const rows = (data || []).filter(r => (typeof r.is_published === "boolean" ? r.is_published : true));
  return rows;
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

/** ✅ Totals for all contestants in a contest (optional, used on contest.html + organizer) */
export async function fetchVoteTotalsForContest(contestId){
  const { data, error } = await supabase
    .from("contestant_vote_totals")
    .select("contest_id, contestant_id, free_votes, paid_votes, total_votes")
    .eq("contest_id", contestId);

  if(error) throw error;
  return data || [];
}

/** Organizer dashboard totals (client-side aggregation) */
export async function fetchContestDashboardTotals(contestId){
  const { count: contestantsCount, error: cErr } = await supabase
    .from("contestants")
    .select("id", { count: "exact", head: true })
    .eq("contest_id", contestId);

  if(cErr) throw cErr;

  const rows = await fetchVoteTotalsForContest(contestId);

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
