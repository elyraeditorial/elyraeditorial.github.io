import { supabase } from "./supabaseClient.js";
import { toast, go, qs } from "./ui.js";

export async function getSession(){
  const { data, error } = await supabase.auth.getSession();
  if(error) throw error;
  return data.session;
}

export async function getUser(){
  const { data, error } = await supabase.auth.getUser();
  if(error) throw error;
  return data.user;
}

export async function signOut(){
  await supabase.auth.signOut();
  toast("Signed out.");
  go("/competitions/login.html");
}

export async function sendMagicLink(email){
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Supabase will redirect back to your Site URL after confirmation
      emailRedirectTo: `${location.origin}/competitions/`
    }
  });
  if(error) throw error;
  toast("Check your email for the sign-in link.");
}

export async function bindLoginForm(){
  const form = qs("#loginForm");
  const email = qs("#email");
  if(!form || !email) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = (email.value || "").trim();
    if(!v) return toast("Enter your email.");
    try{
      await sendMagicLink(v);
    }catch(err){
      console.error(err);
      toast(err?.message || "Login failed.");
    }
  });

  const { data } = supabase.auth.onAuthStateChange((_event, _session) => {
    // optional hooks
  });

  return () => data.subscription.unsubscribe();
}
