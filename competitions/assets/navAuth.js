import { getSession, signOut } from "./auth.js";

function $(id){ return document.getElementById(id); }

export async function wireNavAuth(){
  const loginLink = $("navLoginLink");   // <a id="navLoginLink">
  const signoutLink = $("navSignOutLink"); // <a id="navSignOutLink">
  const who = $("navWho"); // optional <span id="navWho">

  if(!loginLink || !signoutLink) return;

  // default state
  loginLink.style.display = "inline-flex";
  signoutLink.style.display = "none";
  if(who) who.textContent = "";

  const session = await getSession();
  if(session){
    loginLink.style.display = "none";
    signoutLink.style.display = "inline-flex";
    if(who) who.textContent = session?.user?.email ? `(${session.user.email})` : "";
  }

  signoutLink.addEventListener("click", async (e) => {
    e.preventDefault();
    try{
      await signOut();
    }catch(err){
      console.error(err);
    }
    location.replace("/competitions/");
  });
}
