import { supabase } from "./supabaseClient.js";

/**
 * Sends a magic-link sign-in email.
 * next = where to send the user AFTER sign-in (must be a relative path).
 */
export async function sendMagicLink(email, next = "/competitions/") {
  // Keep redirect Elyra-branded (your own site), not Supabase pages
  const redirectTo =
    `${location.origin}/competitions/auth-callback.html?next=${encodeURIComponent(next)}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      // optional: helps reduce accidental duplicate accounts across emails
      shouldCreateUser: true
    }
  });

  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data?.session || null;
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user || null;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
