import { supabase } from "./supabaseClient.js";

export async function castFreeVote(contestId, contestantId){
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if(userErr) throw userErr;
  if(!userRes?.user) throw new Error("Please log in first.");

  const { data, error } = await supabase
    .from("free_votes")
    .insert({
      contest_id: contestId,
      contestant_id: contestantId
      // user_id is automatically set by default auth.uid()
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
