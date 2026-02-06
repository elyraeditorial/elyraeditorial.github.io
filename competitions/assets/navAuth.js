import { getSession, signOut } from "./auth.js";

function $(id){ return document.getElementById(id); }

export async function wireNavAuth(){
  const loginLink  = $("navLoginLink");
  const signoutLink = $("navSignOutLink");
  const who = $("navWho");

  if(!loginLink || !signoutLink) return;

  // default state (logged out)
  loginLink.style.display = "inline-flex";
  signoutLink.style.display = "none";
  if(who) who.textContent = "";

  let session = null;
  try{
    session = await getSession();
  }catch(e){
    console.error("getSession failed:", e);
    // keep logged-out state
    return;
  }

  if(session?.user){
    loginLink.style.display = "none";
    signoutLink.style.display = "inline-flex";

    const email = session.user.email || "";
    if(who && email){
      // show something clean in the nav
      who.textContent = email;
    }
  }

  signoutLink.addEventListener("click", async (e) => {
    e.preventDefault();
    try{
      await signOut();
    }catch(err){
      console.error("signOut failed:", err);
    }
    // force refresh state
    location.replace("/competitions/");
  });
}
