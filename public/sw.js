/* Karyawan notifikasi lokal: tanpa push server, hanya contoh + klik buka beranda. */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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
