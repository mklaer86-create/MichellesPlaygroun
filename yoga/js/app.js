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
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {
        // Offline support is a nice-to-have; ignore registration failures.
      });
    });
  }
}
