// Offline support: the app shell is cached; pages and question sets prefer fresh copies when online.
const VERSION = "md-2026-10-22-4";
const CORE = ["./", "index.html", "manifest.webmanifest", "apple-touch-icon.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
async function networkFirst(req) {
  const c = await caches.open(VERSION);
  try { const r = await fetch(req); if (r && r.ok) c.put(req, r.clone()); return r; }
  catch (e) { const hit = await c.match(req, { ignoreSearch: true }); if (hit) return hit; if (req.mode === "navigate") return (await c.match("index.html")) || Response.error(); throw e; }
}
async function staleWhileRevalidate(req) {
  const c = await caches.open(VERSION); const hit = await c.match(req);
  const net = fetch(req).then((r) => { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }).catch(() => hit);
  return hit || net;
}
self.addEventListener("fetch", (e) => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === "navigate" || url.pathname.endsWith("/index.html") || url.pathname.endsWith(".json")) e.respondWith(networkFirst(req));
    else e.respondWith(staleWhileRevalidate(req));
  } else if (url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) e.respondWith(staleWhileRevalidate(req));
});
