import { supabase } from "./supabaseClient.js?v=18";

const QUERY_TIMEOUT_MS = 6500;

function withTimeout(promise, ms = QUERY_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Supabase request timed out.")), ms)
    )
  ]);
}

function isActiveContest(c, now = Date.now()) {
  if (!c) return false;

  if (typeof c.status === "string" && c.status.length) {
    const s = c.status.toLowerCase().trim();
    if (["active", "open", "live"].includes(s)) return true;
    if (["closed", "ended", "draft", "inactive"].includes(s)) return false;
  }

  if (typeof c.is_active === "boolean") return c.is_active;

  const startTime = c.start_at ? new Date(c.start_at).getTime() : null;
  const endTime = c.end_at ? new Date(c.end_at).getTime() : null;

  const startOk = !startTime || !Number.isFinite(startTime) || startTime <= now;
  const endOk = !endTime || !Number.isFinite(endTime) || endTime >= now;

  return startOk && endOk;
}

/** Active contests list */
export async function fetchActiveContests() {
  try {
    const query = supabase
      .from("contests")
      .select("*")
      .order("created_at", { ascending: false });

    const { data, error } = await withTimeout(query);

    if (error) {
      console.warn("fetchActiveContests error:", error);
      return [];
    }

    const rows = (data || []).filter(c => !!c?.slug && isActiveContest(c));
    return rows;
  } catch (err) {
    console.warn("fetchActiveContests fallback:", err);
    return [];
  }
}

/** Contest by slug */
export async function fetchContestBySlug(slug) {
  if (!slug) return null;

  try {
    const query = supabase
      .from("contests")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    const { data, error } = await withTimeout(query);

    if (error) {
      console.warn("fetchContestBySlug error:", error);
      return null;
    }

    return data || null;
  } catch (err) {
    console.warn("fetchContestBySlug fallback:", err);
    return null;
  }
}

/** Contestant by id */
export async function fetchContestantById(id) {
  if (!id) return null;

  try {
    const query = supabase
      .from("contestants")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    const { data, error } = await withTimeout(query);

    if (error) {
      console.warn("fetchContestantById error:", error);
      return null;
    }

    return data || null;
  } catch (err) {
    console.warn("fetchContestantById fallback:", err);
    return null;
  }
}

/** Contestants for a contest */
export async function fetchContestantsByContestId(contestId) {
  if (!contestId) return [];

  try {
    const query = supabase
      .from("contestants")
      .select("*")
      .eq("contest_id", contestId)
      .order("created_at", { ascending: true });

    const { data, error } = await withTimeout(query);

    if (error) {
      console.warn("fetchContestantsByContestId error:", error);
      return [];
    }

    return (data || []).filter(r =>
      typeof r.is_published === "boolean" ? r.is_published : true
    );
  } catch (err) {
    console.warn("fetchContestantsByContestId fallback:", err);
    return [];
  }
}

/** Live total for one contestant */
export async function fetchVoteTotalsForContestant(contestantId) {
  if (!contestantId) return { total_votes: 0 };

  try {
    const query = supabase
      .from("contestant_vote_totals")
      .select("total_votes")
      .eq("contestant_id", contestantId)
      .maybeSingle();

    const { data, error } = await withTimeout(query);

    if (error) {
      console.warn("fetchVoteTotalsForContestant error:", error);
      return { total_votes: 0 };
    }

    return { total_votes: Number(data?.total_votes || 0) };
  } catch (err) {
    console.warn("fetchVoteTotalsForContestant fallback:", err);
    return { total_votes: 0 };
  }
}

/** Totals for all contestants in a contest */
export async function fetchVoteTotalsForContest(contestId) {
  if (!contestId) return [];

  try {
    const query = supabase
      .from("contestant_vote_totals")
      .select("contest_id, contestant_id, total_votes")
      .eq("contest_id", contestId);

    const { data, error } = await withTimeout(query);

    if (error) {
      console.warn("fetchVoteTotalsForContest error:", error);
      return [];
    }

    return (data || []).map(row => ({
      contest_id: row.contest_id,
      contestant_id: row.contestant_id,
      total_votes: Number(row.total_votes || 0)
    }));
  } catch (err) {
    console.warn("fetchVoteTotalsForContest fallback:", err);
    return [];
  }
}
