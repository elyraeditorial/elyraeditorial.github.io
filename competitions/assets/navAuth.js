import { getSession, signOut } from "./auth.js";

function $(id){ return document.getElementById(id); }

function currentPathWithQuery(){
  return location.pathname + location.search;
}

function setNavState({ signedIn, email }){
  const loginLink   = $("navLoginLink");     // <a id="navLoginLink">
  const signoutLink = $("navSignOutLink");   // <a id="navSignOutLink">
  const who         = $("navWho");           // <span id="navWho">

  if(!loginLink || !signoutLink) return;

  if(signedIn){
    loginLink.style.display = "none";
    signoutLink.style.display = "inline-flex";
    if(who) who.textContent = email ? `(${email})` : "";
  }else{
    // Build login link that returns to current page
    const next = encodeURIComponent(currentPathWithQuery());
    loginLink.href = `/competitions/login.html?next=${next}`;

    loginLink.style.display = "inline-flex";
    signoutLink.style.display = "none";
    if(who) who.textContent = "";
  }
}

export async function wireNavAuth(){
  const loginLink   = $("navLoginLink");
  const signoutLink = $("navSignOutLink");

  if(!loginLink || !signoutLink) return;

  // Prevent double-wiring if the script runs more than once
  if(signoutLink.dataset.wired === "1") return;
  signoutLink.dataset.wired = "1";

  async function refresh(){
    try{
      const session = await getSession();
      const email = session?.user?.email || "";
      setNavState({ signedIn: !!session, email });
    }catch(err){
      console.warn("wireNavAuth: getSession failed:", err);
      setNavState({ signedIn: false, email: "" });
    }
  }

  // Initial render
  setNavState({ signedIn: false, email: "" });
  await refresh();

  // When returning from magic-link, session may update after navigation;
  // refresh again when tab becomes visible.
  document.addEventListener("visibilitychange", () => {
    if(document.visibilityState === "visible") refresh();
  });

  // If another tab logs in/out, reflect it
  window.addEventListener("storage", (e) => {
    // Supabase stores tokens in localStorage; any change means "refresh"
    if(e.key && (e.key.includes("supabase") || e.key.includes("sb-"))) refresh();
  });

  signoutLink.addEventListener("click", async (e) => {
    e.preventDefault();
    try{
      await signOut();
    }catch(err){
      console.error("signOut failed:", err);
    }finally{
      setNavState({ signedIn: false, email: "" });
      location.replace("/competitions/");
    }
  });
}
