import { supabase } from "./supabaseClient.js";

export async function sendMagicLink(email, next = "/competitions/organizer/"){
  const redirectTo = `${location.origin}/competitions/auth-callback.html?next=${encodeURIComponent(next)}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo }
  });

  if(error) throw error;
}

export async function getSession(){
  const { data, error } = await supabase.auth.getSession();
  if(error) throw error;
  return data?.session || null;
}

export async function getUser(){
  const { data, error } = await supabase.auth.getUser();
  if(error) throw error;
  return data?.user || null;
}

export async function signOut(){
  const { error } = await supabase.auth.signOut();
  if(error) throw error;
}
