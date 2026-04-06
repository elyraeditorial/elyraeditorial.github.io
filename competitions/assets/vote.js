import { supabase } from "./supabaseClient.js";

/**
 * Use your custom domain / Worker route
 */
const WORKER_BASE = "https://elyraeditorial.com";

/**
 * Fetch latest vote totals for one contestant
 * Reads from your Supabase view: contestant_vote_totals
 */
export async function fetchLatestContestantTotals(contestantId) {
  if (!contestantId) throw new Error("Contestant missing.");

  const { data, error } = await supabase
    .from("contestant_vote_totals")
    .select("free_votes, paid_votes, total_votes")
    .eq("contestant_id", contestantId)
    .maybeSingle();

  if (error) throw error;

  return data || {
    free_votes: 0,
    paid_votes: 0,
    total_votes: 0
  };
}

/**
 * Start paid checkout for votes
 * Main vote is now $1
 */
export async function startPaidVoteCheckout({
  contestId,
  contestantId,
  pack = 1,
  returnTo,
}) {
  if (!contestId || !contestantId) {
    throw new Error("Contest not ready yet.");
  }

  if (![1, 10, 50].includes(Number(pack))) {
    throw new Error("Invalid pack.");
  }

  const payload = {
    contest_id: contestId,
    contestant_id: contestantId,
    pack: Number(pack),
    return_to:
      returnTo || (location.origin + location.pathname + location.search),
  };

  const url = `${WORKER_BASE}/api/create-checkout-session`;

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await r.text();
  let out = {};

  try {
    out = JSON.parse(text);
  } catch {}

  if (!r.ok) {
    throw new Error(out?.error || text || "Checkout failed.");
  }

  if (!out?.url) {
    throw new Error("Checkout URL missing.");
  }

  location.href = out.url;
}

/**
 * Convenience helper for $1 vote
 */
export async function startOneDollarVote({
  contestId,
  contestantId,
  returnTo,
}) {
  return await startPaidVoteCheckout({
    contestId,
    contestantId,
    pack: 1,
    returnTo,
  });
}
