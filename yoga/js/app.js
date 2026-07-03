// Shared chrome: top nav bar + service worker registration.
// Each page calls renderNav('home' | 'library' | 'builder' | 'settings')
// into a <header id="site-nav"></header> placeholder.

const NAV_ITEMS = [
  { key: "home", href: "index.html", label: "Practice" },
  { key: "library", href: "library.html", label: "Poses" },
  { key: "builder", href: "builder.html", label: "Sequences" },
  { key: "settings", href: "settings.html", label: "Settings" },
];

export function renderNav(active) {
  const el = document.getElementById("site-nav");
  if (!el) return;
  el.innerHTML = `
    <div class="nav-inner">
      <span class="nav-brand">🧘 Flow Cards</span>
      <nav class="nav-links">
        ${NAV_ITEMS.map(
          (item) =>
            `<a href="${item.href}" class="${item.key === active ? "active" : ""}">${item.label}</a>`
        ).join("")}
      </nav>
    </div>
  `;
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  // When a new app version activates mid-visit, reload once so the user
  // gets the new version immediately instead of needing a second manual
  // refresh (the classic cache-first service worker trap). Only do this
  // when the page was already controlled by a previous worker — on the
  // first-ever install, controllerchange fires too (clients.claim) and
  // reloading then would be needless flicker.
  const wasControlledAtLoad = !!navigator.serviceWorker.controller;
  let reloadedForUpdate = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!wasControlledAtLoad || reloadedForUpdate) return;
    reloadedForUpdate = true;
    location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      // Offline support is a nice-to-have; ignore registration failures.
    });
  });
}
