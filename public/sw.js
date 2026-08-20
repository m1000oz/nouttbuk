// Service worker mínimo: el único requisito real para que Chrome/Android
// consideren la app instalable como PWA es que exista un service worker
// registrado con un manejador de "fetch" (aunque sea pass-through). No cachea
// nada todavía, offline real queda fuera de alcance del MVP (design.md no lo
// pide, solo instalación sin perder funcionalidad respecto a la web).
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
