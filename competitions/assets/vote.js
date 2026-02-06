import { supabase } from "./supabaseClient.js";

/**
 * ✅ Use SAME ORIGIN since you routed /api/* to the Worker:
 * This avoids CORS + avoids accidentally hitting workers.dev.
 * NO trailing slash.
 */
const WORKER_BASE = location.origin;

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
 * Calls Worker (same domain):
 *   POST /api/create-checkout-session
 *
 * Worker accepts snake_case OR camelCase (if you pasted my updated Worker).
 * We'll send snake_case to match your comment.
 */
export async function startPaidVoteCheckout({
  contestId,
  contestantId,
  pack,
  returnTo,
}) {
  if (!contestId || !contestantId) throw new Error("Contest not ready yet.");

  const p = Number(pack);
  if (![10, 50].includes(p)) throw new Error("Invalid pack (must be 10 or 50).");

  const payload = {
    contest_id: contestId,
    contestant_id: contestantId,
    pack: p,
    return_to: returnTo || (location.origin + location.pathname + location.search),
    // OPTIONAL: only needed if your Worker uses these (safe to include)
    success_url: `${location.origin}/competitions/paid-success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: returnTo || `${location.origin}/competitions/`,
  };

  // ✅ Use relative path so it ALWAYS hits the routed worker on your domain
  const url = `${WORKER_BASE}/api/create-checkout-session`;

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store", // ✅ helps prevent “old response / old script” weirdness
  });

  let out = null;
  const text = await r.text();
  try { out = text ? JSON.parse(text) : null; } catch { out = null; }

  if (!r.ok) {
    throw new Error(out?.error || text || `Checkout session failed (${r.status}).`);
  }
  if (!out?.url) {
    throw new Error(out?.error || "Checkout URL missing.");
  }

  location.href = out.url;
}
