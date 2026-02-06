import { supabase } from "./supabaseClient.js";

/**
 * Prefer your custom domain route first (Cloudflare Routes: elyraeditorial.com/api/*)
 * Fallback to workers.dev if needed.
 */
const API_BASE_PRIMARY = "https://elyraeditorial.com";
const API_BASE_FALLBACK = "https://green-tree-a555.elyra-editorial-42f.workers.dev"; // your worker preview/host

async function postJson(url, payload) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let out = {};
  try { out = await r.json(); } catch {}

  if (!r.ok) {
    throw new Error(out?.error || `Request failed (${r.status})`);
  }
  return out;
}

/**
 * ✅ Free vote (Supabase insert)
 */
export async function castFreeVote(contestId, contestantId) {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!userRes?.user) throw new Error("Please log in first.");

  const { data, error } = await supabase
    .from("free_votes")
    .insert({
      contest_id: contestId,
      contestant_id: contestantId,
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

  return data;
}

/**
 * ✅ Paid vote checkout
 * Sends EXACT keys your Worker expects:
 *  - contest_id
 *  - contestant_id
 *  - pack (10 or 50)
 *  - return_to
 */
export async function startPaidVoteCheckout({
  contestId,
  contestantId,
  pack,
  returnTo,
}) {
  if (!contestId || !contestantId) throw new Error("Contest not ready yet.");
  if (![10, 50].includes(Number(pack))) throw new Error("Invalid pack.");

  const return_to = returnTo || (location.origin + location.pathname + location.search);

  const payload = {
    contest_id: contestId,
    contestant_id: contestantId,
    pack: Number(pack),
    return_to,
  };

  const endpointPrimary = `${API_BASE_PRIMARY}/api/create-checkout-session`;
  const endpointFallback = `${API_BASE_FALLBACK}/api/create-checkout-session`;

  let res;
  try {
    res = await postJson(endpointPrimary, payload);
  } catch (e) {
    // fallback to worker host if route isn’t fully working yet
    res = await postJson(endpointFallback, payload);
  }

  if (!res?.url) throw new Error("Checkout URL missing.");
  location.href = res.url;
}
