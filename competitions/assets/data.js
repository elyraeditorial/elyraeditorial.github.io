import { supabase } from "./supabaseClient.js?v=18";

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
      if (["active", "open", "live"].includes(s)) return true;
      if (["closed", "ended", "draft"].includes(s)) return false;
    }

    if (typeof c.is_active === "boolean") return c.is_active;

    const startOk = !c.start_at || (new Date(c.start_at).getTime() <= now);
    const endOk = !c.end_at || (new Date(c.end_at).getTime() >= now);
    return startOk && endOk;
  });

  return rows.filter(c => !!c.slug);
}

/** Contest by slug */
export async function fetchContestBySlug(slug) {
  const { data, error } = await supabase
    .from("contests")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Contestant by id */
export async function fetchContestantById(id) {
  const { data, error } = await supabase
    .from("contestants")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Contestants for a contest */
export async function fetchContestantsByContestId(contestId) {
  const { data, error } = await supabase
    .from("contestants")
    .select("*")
    .eq("contest_id", contestId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data || []).filter(r =>
    typeof r.is_published === "boolean" ? r.is_published : true
  );
}

/** Live totals for a contestant */
export async function fetchVoteTotalsForContestant(contestantId) {
  const { data, error } = await supabase
    .from("contestant_vote_totals")
    .select("free_votes, paid_votes, total_votes")
    .eq("contestant_id", contestantId)
    .maybeSingle();

  if (error) throw error;
  return data || { free_votes: 0, paid_votes: 0, total_votes: 0 };
}

/** Totals for all contestants in a contest */
export async function fetchVoteTotalsForContest(contestId) {
  const { data, error } = await supabase
    .from("contestant_vote_totals")
    .select("contest_id, contestant_id, free_votes, paid_votes, total_votes")
    .eq("contest_id", contestId);

  if (error) throw error;
  return data || [];
}
