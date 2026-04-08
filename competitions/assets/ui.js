export function qs(sel, root=document){ return root.querySelector(sel); }
export function qsa(sel, root=document){ return [...root.querySelectorAll(sel)]; }

export function setText(el, text){ if(el) el.textContent = text; }
export function setHTML(el, html){ if(el) el.innerHTML = html; }

export function toast(msg){
  alert(msg);
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

export const API_BASE = "https://green-tree-a555.elyra-editorial-42f.workers.dev";

export function apiUrl(path){
  const p = String(path || "").trim();

  if(p.startsWith("http://") || p.startsWith("https://")) return p;

  const withSlash = p.startsWith("/") ? p : ("/" + p);
  return `${API_BASE}${withSlash}`;
}

export async function fetchJson(path, options={}){
  const res = await fetch(apiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  let body = null;
  const text = await res.text();
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }

  if(!res.ok){
    const msg =
      (body && typeof body === "object" && body.error) ? body.error :
      (typeof body === "string" && body) ? body :
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return body;
}
