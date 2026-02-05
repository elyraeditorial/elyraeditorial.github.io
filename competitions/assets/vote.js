import { supabase } from "./supabaseClient.js";

const WORKER_URL = "https://green-tree-a555.elyra-editorial-42f.workers.dev";

// Free vote (direct Supabase)
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

// Paid vote → Cloudflare Worker → Stripe Checkout
export async function startPaidVoteCheckout({ contestId, contestantId, pack }) {
  const res = await fetch(`${WORKER_URL}/api/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contestId, contestantId, pack })
  });

  if(!res.ok){
    const txt = await res.text();
    throw new Error("Checkout failed: " + txt);
  }

  const json = await res.json();
  if(!json?.url) throw new Error("Missing checkout URL");

  window.location.href = json.url;
}
