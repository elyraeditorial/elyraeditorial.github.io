import { supabase } from "./supabaseClient.js";

// ✅ Cast ONE free vote per user per contestant
export async function castFreeVote(contestId, contestantId){
  // 1️⃣ Check session (not just getUser)
  const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) throw sessionErr;

  if (!sessionRes?.session?.user) {
    throw new Error("You must be logged in to vote.");
  }

  const userId = sessionRes.session.user.id;

  // 2️⃣ Attempt insert (RLS will enforce 1 free vote per user per contestant)
  const { data, error } = await supabase
    .from("free_votes")
    .insert({
      user_id: userId,
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

    throw new Error("Unable to submit vote. Please try again.");
  }

  return data;
}
