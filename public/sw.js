/* Seporsi Terakhir SW: app-shell offline ringan. Navigasi network-first +
   fallback /offline; aset same-origin statis stale-while-revalidate.
   Tanpa precache build-hash (nama file _next berubah tiap build). */

const VERSION = "seporsi-v1";
const STATIC_CACHE = `${VERSION}-static`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest" ||
    /\.(?:png|jpg|jpeg|webp|svg|gif|ico|woff2?)$/.test(pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigasi: coba jaringan dulu agar konten selalu segar; offline → /offline.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(STATIC_CACHE);
          const fallback = await cache.match(OFFLINE_URL);
          return fallback ?? Response.redirect(OFFLINE_URL, 302);
        }
      })(),
    );
    return;
  }

  // Aset statis: sajikan cache dulu, segarkan di latar.
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const hit = await cache.match(request);
        const refresh = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit ?? refresh;
      })(),
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const w of wins) {
        if ("focus" in w) {
          await w.focus();
          return;
        }
      }
      if (self.clients.openWindow) await self.clients.openWindow("/");
    })(),
  );
});
