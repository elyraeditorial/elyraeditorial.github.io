import { supabase } from "./supabaseClient.js";

export async function isOrganizer(){
  const { data, error } = await supabase.auth.getUser();
  if(error) throw error;
  const user = data.user;
  if(!user) return false;

  // profile.role = 'organizer' or 'admin'
  const { data: prof, error: e2 } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if(e2) return false;
  return prof?.role === "organizer" || prof?.role === "admin";
}

export async function requireOrganizer(){
  const ok = await isOrganizer();
  if(!ok) throw new Error("Organizer access only.");
}

export async function createContest(payload){
  const { data, error } = await supabase.from("contests").insert(payload).select("*").single();
  if(error) throw error;
  return data;
}

export async function createContestant(payload){
  const { data, error } = await supabase.from("contestants").insert(payload).select("*").single();
  if(error) throw error;
  return data;
}

export async function listMyContests(){
  const { data, error } = await supabase
    .from("contests")
    .select("id, slug, title, status, start_at, end_at")
    .order("created_at", { ascending: false });

  if(error) throw error;
  return data || [];
}
