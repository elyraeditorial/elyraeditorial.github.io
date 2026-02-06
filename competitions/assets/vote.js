import { supabase } from "./supabaseClient.js";
import { fetchJson } from "./ui.js";

/**
 * Free vote: inserts a row into public.free_votes.
 * Assumes your table has a default user_id = auth.uid() and RLS allows insert for logged-in users.
 */
export async function castFreeVote(contestId, contestantId){
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if(userErr) throw userErr;
  if(!userRes?.user) throw new Error("Please log in first.");

  const { data, error } = await supabase
    .from("free_votes")
    .insert({
      contest_id: contestId,
      contestant_id: contestantId
      // user_id set by default auth.uid() if you configured that
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
 * Paid votes: asks your Cloudflare Worker to create a Stripe Checkout Session.
 * Your Worker endpoint should be: POST /api/create-checkout-session
 * and return: { url: "https://checkout.stripe.com/..." }
 */
export async function startPaidCheckout({ contestId, contestantId, priceId, returnTo }){
  const payload = {
    contest_id: contestId,
    contestant_id: contestantId,
    price_id: priceId,
    return_to: returnTo || (location.origin + location.pathname + location.search)
  };

  const res = await fetchJson("/api/create-checkout-session", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if(!res?.url) throw new Error("Checkout URL missing.");
  // Redirect to Stripe
  location.href = res.url;
}
