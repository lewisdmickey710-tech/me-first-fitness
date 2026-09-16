// Deliberately minimal for now -- this only exists so the browser
// considers the app installable (Chrome/Android requires an active service
// worker with a fetch handler before it'll offer "Install app"). No
// offline caching yet; the fetch handler below is a pure passthrough.
// Push notification handling (a "push" event listener) gets added here in
// Phase 2 -- this file is the shared foundation both features sit on.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
