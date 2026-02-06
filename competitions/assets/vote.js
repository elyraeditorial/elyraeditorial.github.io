import { supabase } from "./supabaseClient.js";
import { fetchJson } from "./ui.js";

// ✅ Free vote
export async function castFreeVote(contestId, contestantId){
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if(userErr) throw userErr;
  if(!userRes?.user) throw new Error("Please log in first.");

  const { data, error } = await supabase
    .from("free_votes")
    .insert({
      contest_id: contestId,
      contestant_id: contestantId
    })
    .select("id")
    .single();

  if(error){
    const msg = String(error.message || "").toLowerCase();
    if(msg.includes("duplicate") || msg.includes("unique")){
      throw new Error("You already used your free vote for this contestant.");
    }
    throw error;
  }

  return data;
}

/**
 * ✅ Paid vote checkout (this matches your contestant.html)
 * Your Worker endpoint should be: POST /api/create-checkout-session
 *
 * Expected Worker input examples (pick one style and match your Worker):
 * Option A (pack-based):
 *   { contest_id, contestant_id, pack, return_to }
 *
 * Option B (price-id based):
 *   { contest_id, contestant_id, price_id, return_to }
 */
export async function startPaidVoteCheckout({ contestId, contestantId, pack, priceId, returnTo }){
  if(!contestId || !contestantId) throw new Error("Contest not ready yet.");

  const payload = {
    contest_id: contestId,
    contestant_id: contestantId,
    return_to: returnTo || (location.origin + location.pathname + location.search)
  };

  // If you're using "pack" in your Worker (10 / 50):
  if(pack) payload.pack = pack;

  // If you're using Stripe price IDs in your Worker:
  if(priceId) payload.price_id = priceId;

  const res = await fetchJson("/api/create-checkout-session", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if(!res?.url) throw new Error("Checkout URL missing.");
  location.href = res.url;
}
