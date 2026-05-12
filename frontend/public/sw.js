const CACHE_NAME = "quakeguard-cache-v1";

const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/login",
  "/emergency",
  "/manifest.json"
];

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        return Promise.resolve();
      });
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() => {
          return caches.match("/");
        })
      );
    })
  );
});

self.addEventListener("push", event => {
  let alertData = {
    title: "Earthquake Alert",
    message: "Strong earthquake detected. Move to a safe area immediately.",
    magnitude: 6.5,
    risk_level: "HIGH"
  };

  if (event.data) {
    try {
      alertData = event.data.json();
    } catch (error) {
      alertData.message = event.data.text();
    }
  }

  const notificationTitle = "🚨 QuakeGuard Emergency Alert";

  const notificationOptions = {
    body: alertData.message,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: "quakeguard-emergency-alert",
    requireInteraction: true,
    vibrate: [500, 200, 500, 200, 800],
    data: {
      url: "/emergency",
      alert: alertData
    },
    actions: [
      {
        action: "open",
        title: "Open Emergency"
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationTitle,
      notificationOptions
    )
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  const targetUrl = new URL("/emergency", self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(clientList => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin)) {
          if ("navigate" in client) {
            return client.navigate(targetUrl).then(() => client.focus());
          }

          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

      return Promise.resolve();
    })
  );
});