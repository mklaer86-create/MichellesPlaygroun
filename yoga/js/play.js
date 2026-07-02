import { renderNav, registerServiceWorker } from "./app.js";
import { loadAll, getSequenceById, resolveSequenceSteps } from "./data.js";
import { toast } from "./utils.js";

renderNav("home");
registerServiceWorker();

const els = {
  progressBadge: document.getElementById("progressBadge"),
  pauseBtn: document.getElementById("pauseBtn"),
  barFill: document.getElementById("barFill"),
  poseCard: document.getElementById("poseCard"),
  pauseHint: document.getElementById("pauseHint"),
  poseImage: document.getElementById("poseImage"),
  poseName: document.getElementById("poseName"),
  poseSanskrit: document.getElementById("poseSanskrit"),
  poseCue: document.getElementById("poseCue"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  upNext: document.getElementById("upNext"),
  doneScreen: document.getElementById("doneScreen"),
  restartBtn: document.getElementById("restartBtn"),
};

let steps = [];
let idx = 0;
let paused = false;
let stepDurationSec = 0;
let pausedElapsedSec = 0;
let runStartedAt = 0;

function startBar(seconds) {
  stepDurationSec = seconds;
  pausedElapsedSec = 0;
  runStartedAt = Date.now();
  els.barFill.style.transition = "none";
  els.barFill.style.transform = "scaleX(0)";
  // eslint-disable-next-line no-unused-expressions
  els.barFill.offsetWidth; // force reflow so the next transition actually animates
  els.barFill.style.transition = `transform ${seconds}s linear`;
  els.barFill.style.transform = "scaleX(1)";
}

function pauseBar() {
  const elapsedThisRun = (Date.now() - runStartedAt) / 1000;
  pausedElapsedSec = Math.min(pausedElapsedSec + elapsedThisRun, stepDurationSec);
  const scale = stepDurationSec > 0 ? pausedElapsedSec / stepDurationSec : 1;
  els.barFill.style.transition = "none";
  els.barFill.style.transform = `scaleX(${scale})`;
}

function resumeBar() {
  const remaining = Math.max(stepDurationSec - pausedElapsedSec, 0.2);
  runStartedAt = Date.now();
  els.barFill.style.transition = `transform ${remaining}s linear`;
  els.barFill.style.transform = "scaleX(1)";
}

els.barFill.addEventListener("transitionend", (e) => {
  if (e.propertyName !== "transform" || paused) return;
  goNext();
});

function renderStep() {
  const step = steps[idx];
  els.progressBadge.textContent = `${idx + 1} / ${steps.length}`;
  els.poseImage.src = step.image || "";
  els.poseImage.alt = step.name;
  els.poseImage.style.visibility = step.image ? "visible" : "hidden";
  els.poseName.textContent = step.name;
  els.poseSanskrit.textContent = step.sanskritName || "";
  els.poseCue.textContent = step.cue || "";
  els.prevBtn.disabled = idx === 0;

  const next = steps[idx + 1];
  if (next) {
    els.upNext.innerHTML = `
      ${next.image ? `<img src="${next.image}" alt="">` : ""}
      <span>Up next: <strong>${next.name}</strong></span>
    `;
  } else {
    els.upNext.innerHTML = `<span>Last pose in this sequence</span>`;
  }

  paused = false;
  els.pauseBtn.textContent = "⏸";
  els.pauseHint.style.display = "none";
  startBar(step.durationSec);
}

function goNext() {
  if (idx >= steps.length - 1) {
    showDone();
    return;
  }
  idx += 1;
  renderStep();
}

function goPrev() {
  if (idx === 0) return;
  idx -= 1;
  renderStep();
}

function togglePause() {
  paused = !paused;
  els.pauseBtn.textContent = paused ? "▶" : "⏸";
  els.pauseHint.style.display = paused ? "block" : "none";
  if (paused) pauseBar();
  else resumeBar();
}

function showDone() {
  els.barFill.style.transition = "none";
  els.doneScreen.classList.add("show");
}

function restart() {
  idx = 0;
  els.doneScreen.classList.remove("show");
  renderStep();
}

els.nextBtn.addEventListener("click", () => goNext());
els.prevBtn.addEventListener("click", () => goPrev());
els.pauseBtn.addEventListener("click", togglePause);
els.restartBtn.addEventListener("click", restart);

// Touch/swipe/tap zones on the card itself.
(function setupGestures() {
  const card = els.poseCard;
  let startX = 0;
  let startY = 0;
  let active = false;

  card.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
    startY = e.clientY;
    active = true;
  });

  card.addEventListener("pointerup", (e) => {
    if (!active) return;
    active = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dx) > 60 && Math.abs(dy) < 80) {
      if (dx < 0) goNext();
      else goPrev();
      return;
    }

    const rect = card.getBoundingClientRect();
    const relX = startX - rect.left;
    const third = rect.width / 3;
    if (relX < third) goPrev();
    else if (relX > third * 2) goNext();
    else togglePause();
  });
})();

async function init() {
  const params = new URLSearchParams(location.search);
  const seqId = params.get("seq");
  await loadAll();
  const sequence = seqId ? getSequenceById(seqId) : null;

  if (!sequence) {
    toast("That sequence wasn't found.", { tone: "error" });
    setTimeout(() => (location.href = "index.html"), 1200);
    return;
  }

  steps = resolveSequenceSteps(sequence);
  if (steps.length === 0) {
    toast("This sequence has no poses yet.", { tone: "error" });
    return;
  }
  renderStep();
}

init();
