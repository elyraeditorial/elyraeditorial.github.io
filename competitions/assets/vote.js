import { supabase } from "./supabaseClient.js?v=18";
import { apiUrl } from "./ui.js?v=18";

export async function fetchLatestContestantTotals(contestantId) {
  if (!contestantId) throw new Error("Contestant missing.");

  const { data, error } = await supabase
    .from("contestant_vote_totals")
    .select("total_votes, paid_votes")
    .eq("contestant_id", contestantId)
    .maybeSingle();

  if (error) throw error;

  return data || { total_votes: 0, paid_votes: 0 };
}

export async function startPaidVoteCheckout({
  contestId,
  contestantId,
  pack = 1,
  returnTo
} = {}) {
  if (!contestId) throw new Error("Contest not ready yet.");
  if (!contestantId) throw new Error("Contestant not ready yet.");

  const res = await fetch(apiUrl("/api/create-checkout-session"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contest_id: contestId,
      contestant_id: contestantId,
      pack: Number(pack),
      return_to: returnTo || (location.origin + location.pathname + location.search)
    })
  });

  const text = await res.text();
  let out = {};
  try {
    out = text ? JSON.parse(text) : {};
  } catch {
    out = { error: text || "Checkout failed." };
  }

  if (!res.ok) {
    throw new Error(out?.error || "Checkout failed.");
  }

  if (!out?.url) {
    throw new Error("Checkout URL missing.");
  }

  location.href = out.url;
}
