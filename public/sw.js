/// <reference lib="webworker" />

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// Handle incoming push notifications (works even when app is closed)
self.addEventListener("push", (e) => {
  if (!e.data) return;

  let data;
  try {
    data = e.data.json();
  } catch {
    data = { title: "Doable", body: e.data.text() };
  }

  const options = {
    body: data.body || "",
    tag: data.tag || "doable",
    icon: "/images/B4.png",
    badge: "/images/B4.png",
    vibrate: [200, 100, 200],
    data: { url: "/" },
    actions: [{ action: "open", title: "Open Doable" }],
  };

  e.waitUntil(self.registration.showNotification(data.title || "Doable", options));
});

// Handle notification click — focus or open the app
self.addEventListener("notificationclick", (e) => {
  e.notification.close();

  const urlToOpen = e.notification.data?.url || "/";

  e.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(urlToOpen);
      })
  );
});
