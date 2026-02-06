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

/**
 * API base for your Worker:
 * - If your Worker is routed on the SAME domain as the site (recommended): leave ""
 *   Example route: https://elyraeditorial.com/api/*
 *
 * - If your Worker is on workers.dev (different domain): set it like:
 *   export const API_BASE = "https://YOUR-WORKER.workers.dev";
 */
export const API_BASE = ""; // <-- change only if needed

export function apiUrl(path){
  if(!path.startsWith("/")) path = "/" + path;
  return `${API_BASE}${path}`;
}

export async function fetchJson(path, options={}){
  const res = await fetch(apiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  // try to parse JSON, but don’t crash if it's not JSON
  let body = null;
  const text = await res.text();
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }

  if(!res.ok){
    const msg = (body && body.error) ? body.error : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return body;
}
