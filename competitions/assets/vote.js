import { supabase } from "./supabaseClient.js";

// ✅ Change to your real domain worker base
const WORKER_BASE_URL = "https://elyraeditorial.com/api";

/**
 * ✅ FREE VOTE (requires free_votes.user_id column + RLS / unique constraint)
 * Inserts: contest_id, contestant_id, user_id
 */
export async function castFreeVote(contestId, contestantId) {
  // Must be logged in
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const user = userRes?.user;
  if (!user) throw new Error("Please log in first.");

  // Insert free vote
  const { data, error } = await supabase
    .from("free_votes")
    .insert({
      contest_id: contestId,
      contestant_id: contestantId,
      user_id: user.id
    })
    .select("id")
    .single();

  if (error) {
    const msg = String(error.message || "").toLowerCase();

    // Handles unique constraint errors cleanly
    if (msg.includes("duplicate") || msg.includes("unique")) {
      throw new Error("You already used your free vote for this contestant.");
    }

    throw error;
  }

  return data;
}

/**
 * ✅ PAID VOTES (Stripe)
 * priceId = Stripe price ID
 * contestId + contestantId saved into Stripe metadata/session so webhook can credit votes
 */
export async function buyVotes({ priceId, contestId, contestantId }) {
  const res = await fetch(`${WORKER_BASE_URL}/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId, contestId, contestantId })
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Checkout session error:", data);
    throw new Error(data?.error || "Checkout failed");
  }

  if (!data?.url) {
    console.error("No checkout url returned:", data);
    throw new Error("Checkout failed (no URL).");
  }

  // Redirect to Stripe Checkout
  window.location.href = data.url;
}
