// ===== DOM helpers =====
export function qs(sel, root = document) { return root.querySelector(sel); }
export function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }

export function setText(el, text) { if (el) el.textContent = text ?? ""; }
export function setHTML(el, html) { if (el) el.innerHTML = html ?? ""; }

// ===== UX helpers =====
export function toast(msg) {
  // Reliable on mobile; swap later to a custom toast UI if you want.
  alert(String(msg ?? ""));
}

export function getParam(name) {
  const u = new URL(location.href);
  return u.searchParams.get(name);
}

export function go(path) {
  location.href = path;
}

export function requireParam(name) {
  const v = getParam(name);
  if (!v) throw new Error(`Missing URL parameter: ${name}`);
  return v;
}

// ===== Validation helpers =====
export function isUuid(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || ""));
}

export function requireUuidParam(name) {
  const v = requireParam(name);
  if (!isUuid(v)) throw new Error(`Invalid UUID in URL parameter: ${name}`);
  return v;
}

// ===== Formatting =====
export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString();
}

export function formatNumber(n) {
  const x = Number(n ?? 0);
  return Number.isFinite(x) ? x.toLocaleString() : "0";
}

// ===== Worker API helpers =====
// Use your production domain in production.
// This keeps it consistent across every page that calls the Worker.
export const WORKER_BASE_URL =
  (location.hostname.includes("localhost") || location.hostname.includes("127.0.0.1"))
    ? "http://localhost:8787/api"
    : "https://elyraeditorial.com/api";

export function apiUrl(path) {
  // path can be "create-checkout-session" OR "/create-checkout-session"
  const p = String(path || "").replace(/^\/+/, "");
  return `${WORKER_BASE_URL}/${p}`;
}

export async function safeJson(res) {
  // Avoids crashes when a Worker returns non-JSON (HTML, plain text, etc.)
  try { return await res.json(); } catch { return null; }
}

// Tiny helper if you need to wait before refreshing totals after Stripe
export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
