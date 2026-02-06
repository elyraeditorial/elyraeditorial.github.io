import { supabase } from "./supabaseClient.js";

/**
 * Free vote (stored in Supabase)
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
      // user_id via auth.uid() default if your DB is set like that
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
 * Paid vote checkout (Stripe via Cloudflare Worker)
 *
 * Your worker should expose:
 *  POST /api/create-checkout-session
 * Body: { pack: 10|50, contestId, contestantId, successUrl, cancelUrl }
 * Returns: { url }
 */
export async function startPaidVoteCheckout({ contestId, contestantId, pack }){
  if(!contestId || !contestantId) throw new Error("Missing contest or contestant id.");
  if(pack !== 10 && pack !== 50) throw new Error("Invalid vote pack.");

  // Worker base: same origin if you routed it to your domain.
  // If you ONLY have workers.dev, put full URL here instead.
  const WORKER_BASE = ""; // keep blank when Worker is routed on your domain

  // Success: go to thanks page (then user can click back)
  const successUrl = `${location.origin}/competitions/thanks.html?paid=1&id=${encodeURIComponent(contestantId)}&contest=${encodeURIComponent(contestId)}`;
  const cancelUrl  = `${location.href}`;

  const res = await fetch(`${WORKER_BASE}/api/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pack,
      contestId,
      contestantId,
      successUrl,
      cancelUrl
    })
  });

  let payload = null;
  try{ payload = await res.json(); } catch {}

  if(!res.ok){
    const msg = payload?.error || `Checkout error (${res.status})`;
    throw new Error(msg);
  }

  if(!payload?.url) throw new Error("Worker did not return a checkout URL.");
  location.href = payload.url;
}
