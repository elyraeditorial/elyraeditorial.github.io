import { supabase } from "./supabaseClient.js";

/* -----------------------------
   Small helper to make errors readable
------------------------------ */
function cleanErr(e){
  const msg = String(e?.message || e || "");
  return msg.replace(/\s+/g, " ").trim();
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

/** ✅ List contests (for competitions index page) */
export async function fetchContests(){
  const { data, error } = await supabase
    .from("contests")
    .select("*")
    .order("created_at", { ascending: false });

  if(error) throw error;
  return data || [];
}

/** ✅ List contestants by contest (for contest.html page) */
export async function fetchContestantsByContest(contestId){
  const { data, error } = await supabase
    .from("contestants")
    .select("*")
    .eq("contest_id", contestId)
    .order("created_at", { ascending: true });

  if(error) throw error;
  return data || [];
}

/**
 * ✅ Live totals for a contestant
 * Primary: view `contestant_vote_totals`
 * Fallback: compute from tables (free_votes count + paid_votes sum(votes))
 */
export async function fetchVoteTotalsForContestant(contestantId){
  // 1) Try the view first (fastest)
  try{
    const { data, error } = await supabase
      .from("contestant_vote_totals")
      .select("contestant_id, free_votes, paid_votes, total_votes")
      .eq("contestant_id", contestantId)
      .maybeSingle();

    if(error) throw error;

    if(data){
      return {
        free_votes: Number(data.free_votes || 0),
        paid_votes: Number(data.paid_votes || 0),
        total_votes: Number(data.total_votes || 0),
      };
    }
  }catch(e){
    // Don’t crash the page — we’ll fallback below.
    console.warn("totals view failed, falling back:", cleanErr(e));
  }

  // 2) Fallback: compute from tables
  let free_votes = 0;
  let paid_votes = 0;

  // free_votes = count rows for this contestant
  try{
    const { count, error } = await supabase
      .from("free_votes")
      .select("id", { count: "exact", head: true })
      .eq("contestant_id", contestantId);

    if(error) throw error;
    free_votes = Number(count || 0);
  }catch(e){
    console.warn("free_votes count failed:", cleanErr(e));
  }

  // paid_votes = sum(paid_votes.votes) for this contestant
  try{
    const { data, error } = await supabase
      .from("paid_votes")
      .select("votes")
      .eq("contestant_id", contestantId);

    if(error) throw error;

    paid_votes = (data || []).reduce((sum, r) => {
      return sum + Number(r?.votes || 0);
    }, 0);
  }catch(e){
    console.warn("paid_votes sum failed:", cleanErr(e));
  }

  return {
    free_votes,
    paid_votes,
    total_votes: Number(free_votes + paid_votes),
  };
}

/**
 * ✅ Organizer dashboard totals (per contest)
 * Primary: RPC `get_contest_dashboard_totals` (if you create it)
 * Fallback: aggregates from contestants + totals per contestant
 */
export async function fetchContestDashboardTotals(contestId){
  // 1) Try RPC first if it exists
  try{
    const { data, error } = await supabase
      .rpc("get_contest_dashboard_totals", { p_contest_id: contestId });

    if(!error && data){
      // data might return a row or array depending on your SQL
      const row = Array.isArray(data) ? data[0] : data;
      if(row){
        return {
          contest_id: contestId,
          contestants: Number(row.contestants || 0),
          free_votes: Number(row.free_votes || 0),
          paid_votes: Number(row.paid_votes || 0),
          total_votes: Number(row.total_votes || 0),
        };
      }
    }
  }catch(e){
    console.warn("RPC dashboard totals not available, falling back:", cleanErr(e));
  }

  // 2) Fallback: count contestants
  const { count: contestantsCount, error: cErr } = await supabase
    .from("contestants")
    .select("id", { count: "exact", head: true })
    .eq("contest_id", contestId);

  if(cErr) throw cErr;

  // 3) Fallback: sum totals by reading contestants then totals per contestant
  const contestants = await fetchContestantsByContest(contestId);

  let free_votes = 0, paid_votes = 0, total_votes = 0;
  for(const person of contestants){
    const t = await fetchVoteTotalsForContestant(person.id);
    free_votes += Number(t.free_votes || 0);
    paid_votes += Number(t.paid_votes || 0);
    total_votes += Number(t.total_votes || 0);
  }

  return {
    contest_id: contestId,
    contestants: Number(contestantsCount || 0),
    free_votes,
    paid_votes,
    total_votes
  };
}
