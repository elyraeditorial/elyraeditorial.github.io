import { supabase } from "./supabaseClient.js";

const DEFAULT_AFTER_LOGIN = "/competitions/"; // voters go here by default

function safeNext(next){
  if(!next) return DEFAULT_AFTER_LOGIN;
  try{
    const decoded = decodeURIComponent(next);
    return decoded.startsWith("/") ? decoded : DEFAULT_AFTER_LOGIN;
  }catch{
    return DEFAULT_AFTER_LOGIN;
  }
}

export async function sendMagicLink(email, next = DEFAULT_AFTER_LOGIN){
  const redirectTo =
    `${location.origin}/competitions/auth-callback.html?next=${encodeURIComponent(safeNext(next))}`;

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

export async function requireAuth(next = location.pathname + location.search){
  const session = await getSession();
  if(session) return session;

  location.href = `/competitions/login.html?next=${encodeURIComponent(next)}`;
  throw new Error("Auth session missing!");
}

export async function signOut(){
  const { error } = await supabase.auth.signOut();
  if(error) throw error;
}
