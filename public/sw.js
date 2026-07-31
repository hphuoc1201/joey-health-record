// Minimal service worker: its presence + a fetch handler makes the app
// installable ("Add to Home screen" / install button in Chrome). It does not
// cache anything, so it never serves stale content.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("fetch", () => {
  // Pass-through: let the network handle every request.
});
