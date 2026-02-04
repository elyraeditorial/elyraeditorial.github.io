import { supabase } from "./supabaseClient.js";

export async function sendMagicLink(email){
  if(!email) throw new Error("Enter an email address.");

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: "https://elyraeditorial.com/competitions/auth-callback.html"
    }
  });

  if(error) throw error;
}
