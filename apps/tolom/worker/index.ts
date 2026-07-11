// Custom Service Worker — Push Notifications
// This file is compiled by next-pwa and prepended to the Workbox-generated SW.
// It handles push events and notification interactions.

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  tag?: string;
  renotify?: boolean;
}

// ── Push Event ─────────────────────────────────────────────────
self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  let payload: PushNotificationPayload;
  try {
    payload = event.data.json() as PushNotificationPayload;
  } catch {
    // Fallback for non-JSON push messages
    payload = {
      title: "TOLOM",
      body: event.data.text(),
    };
  }

  const options: NotificationOptions = {
    body: payload.body,
    icon: payload.icon ?? "/icon-192.png",
    badge: payload.badge ?? "/icon-192.png",
    image: payload.image,
    tag: payload.tag ?? "tolom-default",
    renotify: payload.renotify ?? true,
    vibrate: [200, 100, 200],
    data: { url: payload.url ?? "/dashboard" },
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options),
  );
});

// ── Notification Click ─────────────────────────────────────────
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const url =
    (event.notification.data as { url?: string } | undefined)?.url ??
    "/dashboard";

  event.waitUntil(
    (async () => {
      // Focus existing window if one matches the URL, otherwise open new
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        if ("focus" in client) {
          // If client URL already matches, just focus
          if (client.url.includes(new URL(url, self.location.origin).pathname)) {
            return client.focus();
          }
        }
      }

      // No matching window — open new one
      return self.clients.openWindow(url);
    })(),
  );
});

// ── Notification Close (analytics placeholder) ─────────────────
self.addEventListener("notificationclose", (event: NotificationEvent) => {
  // Could send analytics about dismissed notifications
  void event;
});
