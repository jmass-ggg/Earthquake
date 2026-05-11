/* QuakeGuard Service Worker */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: "QuakeGuard Alert", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "QuakeGuard Alert";
  const body = payload.body || payload.message || "Emergency alert received.";

  const options = {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    requireInteraction: true,
    vibrate: [1000, 500, 1000, 500, 2000],
    data: payload,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const payload = event.notification.data || {};
  const targetUrl = "/emergency";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.postMessage({ type: "OPEN_EMERGENCY_SCREEN", alert: payload });
            try {
              client.navigate(targetUrl);
            } catch (e) {
              /* noop */
            }
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      }),
  );
});
