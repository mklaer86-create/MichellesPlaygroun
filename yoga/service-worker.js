// Bump this whenever the precached file list changes so old caches get
// cleaned up on the next visit.
const CACHE_VERSION = "flow-cards-v4";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const DATA_CACHE = `${CACHE_VERSION}-data`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

const SHELL_FILES = [
  "./",
  "./index.html",
  "./play.html",
  "./library.html",
  "./builder.html",
  "./settings.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/app.js",
  "./js/data.js",
  "./js/github-api.js",
  "./js/state.js",
  "./js/play.js",
  "./js/library.js",
  "./js/builder.js",
  "./js/image-crop.js",
  "./js/utils.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

// Data files are precached into DATA_CACHE under bare-path keys (matching
// networkFirst's keying) so even a brand-new install mid-outage has a copy.
const DATA_FILES = ["./data/poses.json", "./data/sequences.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES)),
      caches.open(DATA_CACHE).then(async (cache) => {
        for (const file of DATA_FILES) {
          try {
            const response = await fetch(file);
            if (response.ok) {
              const bareKey = new URL(file, self.location.href).href;
              await cache.put(bareKey, response);
            }
          } catch {
            // Data precache is best-effort — install must not fail over it.
          }
        }
      }),
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // never intercept the GitHub API

  if (url.pathname.includes("/data/")) {
    event.respondWith(networkFirst(event.request, DATA_CACHE));
  } else if (url.pathname.includes("/images/poses/")) {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE));
  } else {
    event.respondWith(cacheFirst(event.request, SHELL_CACHE));
  }
});

// Only ever cache successful responses — caching a 404 (e.g. an image whose
// Pages deploy hasn't finished yet) would make it look broken forever.
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  // Data requests carry a cache-busting query (?v=...) that changes every
  // load; key the cache by the bare path so the offline fallback still hits.
  const cacheKey = request.url.split("?")[0];
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(cacheKey, response.clone());
      return response;
    }
    // Site answered but with an error (e.g. 404s during a broken Pages
    // deploy) — serve the last good copy if there is one.
    const cached = await cache.match(cacheKey);
    return cached || response;
  } catch (err) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
    throw err;
  }
}
