import { supabase } from "./supabaseClient.js";

/**
 * Use your custom domain / Worker route
 */
const WORKER_BASE = "https://elyraeditorial.com";

/**
 * Free vote
 * Assumes your table allows one free vote per user via DB constraints/policies.
 */
export async function castFreeVote(contestId, contestantId) {
  if (!contestId || !contestantId) {
    throw new Error("Contest or contestant is missing.");
  }

  // Confirm signed-in user
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;

  const user = userRes?.user;
  if (!user) {
    throw new Error("Please log in first.");
  }

  // Insert free vote
  // IMPORTANT: include user_id so your DB can truly track 1 free vote per person
  const { data, error } = await supabase
    .from("free_votes")
    .insert({
      contest_id: contestId,
      contestant_id: contestantId,
      user_id: user.id
    })
    .select("id, contest_id, contestant_id, user_id, created_at")
    .single();

  if (error) {
    const msg = String(error.message || "").toLowerCase();

    if (
      msg.includes("duplicate") ||
      msg.includes("unique") ||
      msg.includes("already")
    ) {
      throw new Error("You already used your free vote.");
    }

    throw error;
  }

  return data;
}

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
 * Cast free vote and immediately fetch refreshed totals
 */
export async function castFreeVoteAndRefresh(contestId, contestantId) {
  await castFreeVote(contestId, contestantId);
  return await fetchLatestContestantTotals(contestantId);
}

/**
 * Paid vote checkout
 */
export async function startPaidVoteCheckout({
  contestId,
  contestantId,
  pack,
  returnTo,
}) {
  if (!contestId || !contestantId) throw new Error("Contest not ready yet.");
  if (![10, 50].includes(Number(pack))) throw new Error("Invalid pack.");

  const payload = {
    contest_id: contestId,
    contestant_id: contestantId,
    pack: Number(pack),
    return_to: returnTo || (location.origin + location.pathname + location.search),
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

  if (!r.ok) throw new Error(out?.error || text || "Checkout failed.");
  if (!out?.url) throw new Error("Checkout URL missing.");

  location.href = out.url;
}
