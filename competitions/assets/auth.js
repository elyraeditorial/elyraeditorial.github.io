import { supabase } from "./supabaseClient.js";

// IMPORTANT: this must be allow-listed in Supabase Auth → URL Configuration
const EMAIL_REDIRECT_TO = "https://elyraeditorial.com/competitions/auth-callback.html";

export async function sendMagicLink(email){
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: EMAIL_REDIRECT_TO
    }
  });

  if(error) throw error;
  return true;
}

export async function getSession(){
  const { data, error } = await supabase.auth.getSession();
  if(error) throw error;
  return data?.session || null;
}

export async function signOut(){
  const { error } = await supabase.auth.signOut();
  if(error) throw error;
  return true;
}
