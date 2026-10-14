/* Outfit4Today – einfacher Service Worker (kein Framework).
 *  - Statische Dateien (Next-Bundles, Icons, Sounds, Manifest): Cache-First, damit die App schnell startet.
 *  - Seitenaufrufe: immer zuerst das Netz (so gibt es nie veraltete Seiten); ohne Verbindung die Offline-Seite.
 *  - Anfragen an andere Server (Supabase, Fotos, Fonts) und API-Aufrufe werden NICHT angefasst.
 */
const CACHE = "outfit4today-v1";
const SHELL = ["/offline.html", "/icons/180", "/icons/192", "/icons/512", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // einzeln hinzufügen: ein fehlendes Teil soll die Installation nicht verhindern
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => undefined))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isStatic = (path) =>
  path.startsWith("/_next/static/") ||
  path.startsWith("/icons/") ||
  path.startsWith("/sounds/") ||
  path === "/manifest.webmanifest";

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    return;
  }

  if (isStatic(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});
