export function qs(sel, root=document){ return root.querySelector(sel); }
export function qsa(sel, root=document){ return [...root.querySelectorAll(sel)]; }

export function setText(el, text){ if(el) el.textContent = text; }
export function setHTML(el, html){ if(el) el.innerHTML = html; }

export function toast(msg){
  alert(msg); // simple & reliable for mobile
}

export function getParam(name){
  const u = new URL(location.href);
  return u.searchParams.get(name);
}

export function go(path){
  location.href = path;
}

export function requireParam(name){
  const v = getParam(name);
  if(!v) throw new Error(`Missing URL parameter: ${name}`);
  return v;
}

export function formatDate(iso){
  if(!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString();
}
