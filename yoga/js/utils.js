// Small shared helpers used across the app.

export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "item";
}

let idCounter = 0;
export function genId(prefix) {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

export function uniqueSlug(baseName, existingIds) {
  const base = slugify(baseName);
  if (!existingIds.includes(base)) return base;
  let n = 2;
  while (existingIds.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

// UTF-8 safe base64 encode/decode (handles emoji, accents, etc. in cue text).
export function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

export function base64ToUtf8(b64) {
  return decodeURIComponent(escape(atob(b64.replace(/\n/g, ""))));
}

export function nowIso() {
  return new Date().toISOString();
}

let toastTimer = null;
export function toast(message, { duration = 4000, tone = "default" } = {}) {
  let el = document.getElementById("app-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "app-toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.dataset.tone = tone;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), duration);
}
