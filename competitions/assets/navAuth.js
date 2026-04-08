import { supabase } from "./supabaseClient.js?v=17";

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

  try {
    const { data } = await supabase.auth.getSession();
    render(data?.session || null);
  } catch (e) {
    console.error(e);
    render(null);
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    render(session);
  });

  if(signoutLink){
    signoutLink.addEventListener("click", async (e) => {
      e.preventDefault();
      try { await supabase.auth.signOut(); } catch(e){}
      render(null);
      location.replace("/competitions/");
    });
  }
}
