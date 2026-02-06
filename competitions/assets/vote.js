import { supabase } from "./supabaseClient.js";
import { fetchJson } from "./ui.js";

/**
 * ✅ Cloudflare Worker base (NO trailing slash)
 * Your worker: green-tree-a555
 */
const WORKER_BASE = "https://green-tree-a555.workers.dev";

/**
 * ✅ Free vote (Supabase insert)
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
      // user_id is set by default auth.uid() on the DB side
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
 * ✅ Paid vote checkout (used by contestant.html)
 *
 * Calls your Worker:
 *   POST https://green-tree-a555.workers.dev/api/create-checkout-session
 *
 * Worker should return:
 *   { url: "https://checkout.stripe.com/..." }
 *
 * Supports BOTH styles:
 * - pack-based: pack: 10 or 50
 * - price-based: priceId: "price_..."
 */
export async function startPaidVoteCheckout({
  contestId,
  contestantId,
  pack,
  priceId,
  returnTo,
}){
  if(!contestId || !contestantId) throw new Error("Contest not ready yet.");

  // Normalize return path
  const defaultReturnTo = location.origin + location.pathname + location.search;

  // Stripe return URLs (what your worker should pass to Stripe)
  const successUrl =
    `${location.origin}/competitions/contestant.html?id=${encodeURIComponent(contestantId)}&paid=1`;
  const cancelUrl =
    `${location.origin}/competitions/contestant.html?id=${encodeURIComponent(contestantId)}`;

  // Payload (match these keys in your Worker)
  const payload = {
    contestId,
    contestantId,
    pack: (pack === 10 || pack === 50) ? pack : undefined,
    priceId: priceId || undefined,
    returnTo: returnTo || defaultReturnTo, // optional (for your own use/logging)
    successUrl,
    cancelUrl,
  };

  // Remove undefined keys (keeps payload clean)
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

  // IMPORTANT:
  // GitHub Pages cannot do "/api/..." locally — must call your Worker full URL.
  const url = `${WORKER_BASE}/api/create-checkout-session`;

  // We can use fetchJson if it works, but it MUST accept absolute URLs.
  // If your fetchJson only supports relative paths, we fall back to fetch().
  let res;
  try {
    res = await fetchJson(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (e) {
    // Fallback (works even if fetchJson can’t handle absolute URLs)
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let out = {};
    try { out = await r.json(); } catch {}
    if(!r.ok) throw new Error(out?.error || "Checkout session failed.");
    res = out;
  }

  if(!res?.url) throw new Error("Checkout URL missing.");
  location.href = res.url;
}
