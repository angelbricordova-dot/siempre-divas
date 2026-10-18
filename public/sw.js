/* Service worker de Siempre Divas: notificaciones y app instalable. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  // Solo para navegación: si no hay internet, mostramos un aviso simple.
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(
          '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión</title><body style="font-family:system-ui;background:#0e0c0a;color:#f4eee6;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px"><div><h1 style="color:#c9a45c">Sin conexión</h1><p>Revisa tu internet y vuelve a intentar.</p></div>',
          { headers: { "Content-Type": "text/html; charset=utf-8" } },
        ),
    ),
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Siempre Divas", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Siempre Divas", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/admin" },
      vibrate: [80, 40, 80],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
