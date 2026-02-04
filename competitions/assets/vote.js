import { supabase } from "./supabaseClient.js";

export async function castFreeVote(contestId, contestantId){
  // One free vote per user per contestant by default (enforced by DB unique index)
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if(userErr) throw userErr;
  if(!userRes?.user) throw new Error("Please log in first.");

  const { data, error } = await supabase.from("votes").insert({
    contest_id: contestId,
    contestant_id: contestantId,
    vote_type: "free"
  }).select("id").single();

  if(error){
    // common duplicate vote message
    if(String(error.message || "").toLowerCase().includes("duplicate")){
      throw new Error("You already used your free vote for this contestant.");
    }
    throw error;
  }
  return data;
}
