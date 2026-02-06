import { supabase } from "./supabaseClient.js";

/** ✅ Active contests list (matches your real contests table)
 * Uses: id, slug, title, subtitle, start_at, end_at, status, hero_image_url
 */
export async function fetchActiveContests(){
  const { data, error } = await supabase
    .from("contests")
    .select("id, slug, title, subtitle, start_at, end_at, status, hero_image_url")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const now = Date.now();

  const rows = (data || []).filter(c => {
    // status-based (you have this)
    if (typeof c.status === "string" && c.status.length) {
      const s = c.status.toLowerCase();
      if (s === "active" || s === "open" || s === "live") return true;
      if (s === "closed" || s === "ended" || s === "draft") return false;
      // otherwise fall through to date checks
    }

    // date fallback
    const startOk = !c.start_at || (new Date(c.start_at).getTime() <= now);
    const endOk   = !c.end_at   || (new Date(c.end_at).getTime() >= now);
    return startOk && endOk;
  });

  // Must have slug for routing
  return rows.filter(c => !!c.slug);
}

/** Contest by slug */
export async function fetchContestBySlug(slug){
  const { data, error } = await supabase
    .from("contests")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Contestant by id */
export async function fetchContestantById(id){
  const { data, error } = await supabase
    .from("contestants")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** ✅ Contestants list for a contest page */
export async function fetchContestantsForContest(contestId){
  const { data, error } = await supabase
    .from("contestants")
    .select("id, contest_id, display_name, bio, photo_url, is_published, created_at")
    .eq("contest_id", contestId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // show only published if that column exists / is used
  return (data || []).filter(c => c.is_published !== false);
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

  if (error) throw error;
  return data || { free_votes: 0, paid_votes: 0, total_votes: 0 };
}

/**
 * Organizer dashboard totals (per contest) - client-side aggregation
 */
export async function fetchContestDashboardTotals(contestId){
  const { count: contestantsCount, error: cErr } = await supabase
    .from("contestants")
    .select("id", { count: "exact", head: true })
    .eq("contest_id", contestId);

  if (cErr) throw cErr;

  const { data: rows, error: tErr } = await supabase
    .from("contestant_vote_totals")
    .select("free_votes, paid_votes, total_votes")
    .eq("contest_id", contestId);

  if (tErr) throw tErr;

  let free_votes = 0, paid_votes = 0, total_votes = 0;
  for (const r of (rows || [])) {
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
