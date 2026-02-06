import { supabase } from "./supabaseClient.js";
import { fetchJson } from "./ui.js";

/**
 * ✅ Cloudflare Worker base (NO trailing slash)
 * Your real worker domain:
 */
const WORKER_BASE = "https://green-tree-a555.elyra-editorial-42f.workers.dev";

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
 */
export async function startPaidVoteCheckout({
  contestId,
  contestantId,
  pack,
  priceId,
  returnTo,
}){
  if(!contestId || !contestantId) throw new Error("Contest not ready yet.");

  const defaultReturnTo = location.origin + location.pathname + location.search;

  // ✅ Payload MUST match Worker keys
  const payload = {
    contest_id: contestId,
    contestant_id: contestantId,
    pack: (pack === 10 || pack === 50) ? pack : undefined,
    return_to: returnTo || defaultReturnTo
  };

  // Remove undefined keys
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

  const url = `${WORKER_BASE}/api/create-checkout-session`;

  let res;
  try {
    res = await fetchJson(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
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
