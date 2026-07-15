// Minimale service worker voor het Viesa Dashboard.
// Nodig om notificaties te kunnen tonen op mobiel (geïnstalleerde PWA).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Klik op een melding → open/focus het dashboard.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/agenda");
    }),
  );
});
