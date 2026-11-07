// 離線快取：App 本體先用快取；題庫 content.json 每次優先抓網路（拿到最新題目），沒網路才用快取
const CACHE = "eng-reading-v1";
const SHELL = ["./", "./index.html", "./manifest.json", "./content.json", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-180.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  const networkFirst = url.pathname.endsWith("content.json") || e.request.mode === "navigate";
  if (networkFirst) {
    e.respondWith(fetch(e.request, { cache: "no-store" }).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html"))));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
