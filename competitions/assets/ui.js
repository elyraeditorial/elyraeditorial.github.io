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
 * ✅ API base for your Worker (workers.dev)
 * This makes "/api/..." calls go to your Cloudflare Worker instead of GitHub Pages.
 */
export const API_BASE = "https://green-tree-a555.workers.dev";

/**
 * Build an API url.
 * - If an ABSOLUTE url is passed in, return it unchanged.
 * - If a relative "/api/..." path is passed, prefix with API_BASE.
 */
export function apiUrl(path){
  const p = String(path || "").trim();

  // absolute URL support
  if(p.startsWith("http://") || p.startsWith("https://")) return p;

  // ensure leading slash
  const withSlash = p.startsWith("/") ? p : ("/" + p);
  return `${API_BASE}${withSlash}`;
}

/**
 * Fetch JSON (or text) with good error messages.
 */
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
    const msg =
      (body && typeof body === "object" && body.error) ? body.error :
      (typeof body === "string" && body) ? body :
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return body;
}
