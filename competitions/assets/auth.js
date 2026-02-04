import { supabase } from "./supabaseClient.js";

export async function sendMagicLink(email){
  const redirectTo = `${window.location.origin}/competitions/auth-callback.html`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo }
  });

  if(error) throw error;
}

export async function getSession(){
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

export async function signOut(){
  const { error } = await supabase.auth.signOut();
  if(error) throw error;
}
