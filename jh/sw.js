// 離線快取（國中版）：所有檔案都先抓網路拿最新版，沒網路才用快取
const CACHE = "jifen-jh-v2";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-180.png",
  "../app.js", "../app.css", "../content.json", "../math.json", "../social.json", "../science.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("jifen-jh-") && k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: "no-store" }).then(r => {
    if (r.ok) { const copy = r.clone(); const key = url.pathname.endsWith(".json") ? url.origin + url.pathname : e.request; caches.open(CACHE).then(c => c.put(key, copy)); }
    return r;
  }).catch(() => caches.match(url.pathname.endsWith(".json") ? url.origin + url.pathname : e.request).then(r => r || (e.request.mode === "navigate" ? caches.match("./index.html") : undefined))));
});
