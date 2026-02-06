import { supabase } from "./supabaseClient.js";
import { getSession, signOut } from "./auth.js";

function $(id){ return document.getElementById(id); }

function render(session){
  const loginLink = $("navLoginLink");
  const signoutLink = $("navSignOutLink");
  const who = $("navWho");

  if(!loginLink || !signoutLink) return;

  const loggedIn = !!session;

  loginLink.style.display = loggedIn ? "none" : "inline-flex";
  signoutLink.style.display = loggedIn ? "inline-flex" : "none";

  if(who){
    who.textContent = loggedIn && session?.user?.email ? `(${session.user.email})` : "";
  }
}

export async function wireNavAuth(){
  const signoutLink = $("navSignOutLink");
  if(!signoutLink) return;

  // Initial paint
  try{
    const session = await getSession();
    render(session);
  }catch(e){
    console.error(e);
    render(null);
  }

  // ✅ Live updates (this is what you were missing)
  supabase.auth.onAuthStateChange((_event, session) => {
    render(session);
  });

  signoutLink.addEventListener("click", async (e) => {
    e.preventDefault();
    try{ await signOut(); } catch(err){ console.error(err); }
    render(null);
    location.replace("/competitions/");
  });
}
