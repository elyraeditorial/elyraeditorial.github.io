import { supabase } from "./supabaseClient.js";

/**
 * ✅ Use your CUSTOM DOMAIN (Cloudflare Worker route)
 */
const WORKER_BASE = "https://elyraeditorial.com";

/**
 * ✅ Free vote
 */
export async function castFreeVote(contestId, contestantId) {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!userRes?.user) throw new Error("Please log in first.");

  const { data, error } = await supabase
    .from("free_votes")
    .insert({
      contest_id: contestId,
      contestant_id: contestantId
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
  try { out = JSON.parse(text); } catch {}

  if (!r.ok) throw new Error(out?.error || text || "Checkout failed.");
  if (!out?.url) throw new Error("Checkout URL missing.");

  location.href = out.url;
}
