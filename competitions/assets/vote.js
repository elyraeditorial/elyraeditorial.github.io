import { supabase } from "./supabaseClient.js";
import { apiUrl, safeJson, toast } from "./ui.js";

// =====================
// FREE VOTE (Supabase)
// =====================
export async function castFreeVote(contestId, contestantId) {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!userRes?.user) throw new Error("Please log in first.");

  const { data, error } = await supabase
    .from("free_votes")
    .insert({
      contest_id: contestId,
      contestant_id: contestantId
      // user_id auto from auth.uid() if you set default
    })
    .select("id")
    .single();

  if (error) {
    const msg = String(error.message || "").toLowerCase();
    if (msg.includes("duplicate") || msg.includes("unique")) {
      throw new Error("You already used your free vote for this contestant.");
    }
    throw error;
  }

  toast("✅ Free vote cast!");
  return data;
}

// =====================
// PAID VOTE (Stripe → Worker)
// =====================
export async function startPaidVoteCheckout({ contestId, contestantId, pack = "10" }) {
  const res = await fetch(apiUrl("create-checkout-session"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contestId,
      contestantId,
      pack // "10" or "50"
    })
  });

  const json = await safeJson(res);

  if (!res.ok || !json?.url) {
    console.error("Checkout error:", json);
    throw new Error(json?.error || "Failed to create checkout session.");
  }

  // Redirect to Stripe Checkout
  window.location.href = json.url;
}

// =====================
// OPTIONAL: REFRESH TOTALS
// =====================
export async function fetchVoteTotals(contestantId) {
  const { data, error } = await supabase
    .from("vote_totals")
    .select("*")
    .eq("contestant_id", contestantId)
    .single();

  if (error) throw error;
  return data;
}
