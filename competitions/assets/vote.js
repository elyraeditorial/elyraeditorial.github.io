import { supabase } from "./supabaseClient.js";

export async function castFreeVote(contestId, contestantId){
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if(userErr) throw userErr;
  if(!userRes?.user) throw new Error("Please log in first.");

  const userId = userRes.user.id;

  const { data, error } = await supabase
    .from("votes")
    .insert({
      user_id: userId,          // ✅ explicitly satisfy RLS
      contest_id: contestId,
      contestant_id: contestantId,
      vote_type: "free"
    })
    .select("id")
    .single();

  if(error){
    // Friendly duplicate vote message
    const msg = String(error.message || "").toLowerCase();
    if(msg.includes("duplicate") || msg.includes("unique")){
      throw new Error("You already used your free vote for this contestant.");
    }
    throw error;
  }

  return data;
}
