// Bump this whenever the precached file list changes so old caches get
// cleaned up on the next visit.
const CACHE_VERSION = "flow-cards-v1";
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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
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

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}
