import { renderNav } from "./app.js";
import * as data from "./data.js";
import { hasPAT, resolveImageSrc, setLocalImagePreview } from "./state.js";
import { toast, genId, uniqueSlug } from "./utils.js";
import { openImageCropper } from "./image-crop.js";
import { openPoseEditor } from "./library.js";

renderNav("builder");

const PLACEHOLDER_IMAGE = "images/poses/_placeholder.svg";
const params = new URLSearchParams(location.search);
const seqId = params.get("seq");

const root = document.getElementById("builderRoot");

let openOverridePanelStepId = null;
// stepId -> { base64, ext } photo picked for a step's image override, not
// yet uploaded/committed until "Save overrides" is clicked.
const pendingOverrideImages = new Map();

function requirePAT() {
  if (!hasPAT()) {
    toast("Add a GitHub token in Settings before editing sequences.", { tone: "error" });
    return false;
  }
  return true;
}

async function persistSequence(sequence) {
  try {
    await data.saveSequence(sequence);
    toast("Saved. Live everywhere in about a minute.");
    return true;
  } catch (err) {
    toast(err.message, { tone: "error", duration: 6000 });
    return false;
  }
}

// ---------------- List view ----------------

function renderListView() {
  const sequences = data.getSequences();
  root.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Sequences</h1>
        <p>Build a flow, then reorder, insert, or override any pose within it.</p>
      </div>
      <button class="btn-primary" id="newSeqBtn">+ New sequence</button>
    </div>
    <div class="grid" id="seqGrid"></div>
  `;

  const grid = document.getElementById("seqGrid");
  if (sequences.length === 0) {
    grid.innerHTML = `<div class="empty-state">No sequences yet — create your first one.</div>`;
  } else {
    grid.innerHTML = sequences
      .map(
        (seq) => `
        <a class="sequence-card" href="builder.html?seq=${encodeURIComponent(seq.id)}">
          <h3>${seq.name}</h3>
          <div class="meta">${seq.steps.length} pose${seq.steps.length === 1 ? "" : "s"}</div>
        </a>`
      )
      .join("");
  }

  document.getElementById("newSeqBtn").addEventListener("click", async () => {
    if (!requirePAT()) return;
    const name = prompt("Name this sequence:");
    if (!name || !name.trim()) return;
    const id = uniqueSlug(name.trim(), data.getSequences().map((s) => s.id));
    const sequence = {
      id,
      name: name.trim(),
      description: "",
      defaultDurationSec: 30,
      steps: [],
    };
    const ok = await persistSequence(sequence);
    if (ok) location.href = `builder.html?seq=${encodeURIComponent(id)}`;
  });
}

// ---------------- Editor view ----------------

function renderEditorView(sequence) {
  const steps = sequence.steps.map((step) => ({
    step,
    resolved: data.resolveStep(sequence, step),
  }));

  root.innerHTML = `
    <div class="page-header">
      <div>
        <h1>${sequence.name}</h1>
        <p>${sequence.description || ""}</p>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button id="renameSeqBtn">Rename</button>
        <button class="btn-danger" id="deleteSeqBtn">Delete sequence</button>
      </div>
    </div>
    <a href="builder.html">← All sequences</a>

    <div class="step-list" style="margin-top:16px;">
      ${renderInsertRow(0)}
      ${steps
        .map(
          ({ step, resolved }, i) => `
        ${renderStepRow(step, resolved, i, steps.length)}
        ${renderInsertRow(i + 1)}
      `
        )
        .join("")}
    </div>
  `;

  document.getElementById("renameSeqBtn").addEventListener("click", async () => {
    if (!requirePAT()) return;
    const name = prompt("Rename sequence:", sequence.name);
    if (!name || !name.trim()) return;
    sequence.name = name.trim();
    if (await persistSequence(sequence)) renderEditorView(sequence);
  });

  document.getElementById("deleteSeqBtn").addEventListener("click", async () => {
    if (!requirePAT()) return;
    if (!confirm(`Delete the whole "${sequence.name}" sequence? This can't be undone.`)) return;
    try {
      await data.deleteSequence(sequence.id);
      toast("Sequence deleted.");
      location.href = "builder.html";
    } catch (err) {
      toast(err.message, { tone: "error" });
    }
  });

  root.querySelectorAll(".insert-row button").forEach((btn) => {
    btn.addEventListener("click", () => openPosePicker(sequence, parseInt(btn.dataset.index, 10)));
  });

  root.querySelectorAll(".step-row").forEach((rowEl) => {
    const stepId = rowEl.dataset.stepId;
    const step = sequence.steps.find((s) => s.stepId === stepId);
    const index = sequence.steps.indexOf(step);

    rowEl.querySelector(".move-up")?.addEventListener("click", async () => {
      if (index <= 0) return;
      [sequence.steps[index - 1], sequence.steps[index]] = [sequence.steps[index], sequence.steps[index - 1]];
      if (await persistSequence(sequence)) renderEditorView(sequence);
    });
    rowEl.querySelector(".move-down")?.addEventListener("click", async () => {
      if (index >= sequence.steps.length - 1) return;
      [sequence.steps[index + 1], sequence.steps[index]] = [sequence.steps[index], sequence.steps[index + 1]];
      if (await persistSequence(sequence)) renderEditorView(sequence);
    });
    rowEl.querySelector(".remove-step")?.addEventListener("click", async () => {
      if (!requirePAT()) return;
      if (!confirm("Remove this pose from the sequence?")) return;
      sequence.steps.splice(index, 1);
      if (await persistSequence(sequence)) renderEditorView(sequence);
    });
    rowEl.querySelector(".toggle-override")?.addEventListener("click", () => {
      openOverridePanelStepId = openOverridePanelStepId === stepId ? null : stepId;
      renderEditorView(sequence);
    });
  });

  if (openOverridePanelStepId) {
    wireOverridePanel(sequence, openOverridePanelStepId);
  }
}

function renderStepRow(step, resolved, index, total) {
  const isOpen = openOverridePanelStepId === step.stepId;
  return `
    <div class="step-row-wrap" data-step-id="${step.stepId}">
      <div class="step-row" data-step-id="${step.stepId}">
        <img src="${resolveImageSrc(resolved.image) || PLACEHOLDER_IMAGE}" alt="" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'">
        <div class="step-info">
          <div class="name">${index + 1}. ${resolved.name} ${resolved.hasOverride ? '<span class="tag">customized</span>' : ""}</div>
          <div class="meta">${resolved.durationSec}s${resolved.cue ? " · " + resolved.cue : ""}</div>
        </div>
        <div class="step-actions">
          <button class="move-up" ${index === 0 ? "disabled" : ""} title="Move up">↑</button>
          <button class="move-down" ${index === total - 1 ? "disabled" : ""} title="Move down">↓</button>
          <button class="toggle-override" title="Customize this step">${isOpen ? "Close" : "Customize"}</button>
          <button class="btn-danger remove-step" title="Remove">✕</button>
        </div>
      </div>
      ${isOpen ? renderOverridePanel(step, resolved) : ""}
    </div>
  `;
}

function renderOverridePanel(step, resolved) {
  const overrides = step.overrides || {};
  const pending = pendingOverrideImages.get(step.stepId);
  const previewImage = pending
    ? `data:image/jpeg;base64,${pending.base64}`
    : resolveImageSrc(overrides.image || resolved.image) || PLACEHOLDER_IMAGE;

  return `
    <div class="override-panel">
      <p style="margin-bottom:8px;">Overrides apply only to this occurrence — the shared pose and its other uses are unaffected.</p>

      <div class="checkbox-row">
        <input type="checkbox" id="ovNameChk-${step.stepId}" ${"name" in overrides ? "checked" : ""}>
        <label for="ovNameChk-${step.stepId}" style="margin:0;">Override name</label>
      </div>
      <input type="text" id="ovNameInput-${step.stepId}" value="${overrides.name ?? resolved.name}">

      <div class="checkbox-row">
        <input type="checkbox" id="ovCueChk-${step.stepId}" ${"cue" in overrides ? "checked" : ""}>
        <label for="ovCueChk-${step.stepId}" style="margin:0;">Override cue text</label>
      </div>
      <textarea id="ovCueInput-${step.stepId}">${overrides.cue ?? resolved.cue}</textarea>

      <div class="checkbox-row">
        <input type="checkbox" id="ovDurationChk-${step.stepId}" ${"durationSec" in overrides ? "checked" : ""}>
        <label for="ovDurationChk-${step.stepId}" style="margin:0;">Override duration</label>
      </div>
      <input type="number" id="ovDurationInput-${step.stepId}" min="1" value="${overrides.durationSec ?? resolved.durationSec}">

      <div class="checkbox-row">
        <input type="checkbox" id="ovImageChk-${step.stepId}" ${"image" in overrides || pending ? "checked" : ""}>
        <label for="ovImageChk-${step.stepId}" style="margin:0;">Override image</label>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <img src="${previewImage}" alt="" style="width:60px;height:60px;object-fit:contain;background:var(--accent-light);border-radius:8px;" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'">
        <button id="ovImageBtn-${step.stepId}">Change photo</button>
      </div>

      <div class="modal-actions">
        <button class="btn-primary" id="ovSaveBtn-${step.stepId}">Save overrides</button>
      </div>
    </div>
  `;
}

function wireOverridePanel(sequence, stepId) {
  const step = sequence.steps.find((s) => s.stepId === stepId);

  document.getElementById(`ovImageBtn-${stepId}`)?.addEventListener("click", () => {
    openImageCropper({
      onDone: (base64, ext) => {
        pendingOverrideImages.set(stepId, { base64, ext });
        document.getElementById(`ovImageChk-${stepId}`).checked = true;
        renderEditorView(sequence);
      },
    });
  });

  document.getElementById(`ovSaveBtn-${stepId}`)?.addEventListener("click", async () => {
    if (!requirePAT()) return;
    const btn = document.getElementById(`ovSaveBtn-${stepId}`);
    btn.disabled = true;
    btn.textContent = "Saving…";

    const overrides = {};

    if (document.getElementById(`ovNameChk-${stepId}`).checked) {
      overrides.name = document.getElementById(`ovNameInput-${stepId}`).value.trim();
    }
    if (document.getElementById(`ovCueChk-${stepId}`).checked) {
      overrides.cue = document.getElementById(`ovCueInput-${stepId}`).value.trim();
    }
    if (document.getElementById(`ovDurationChk-${stepId}`).checked) {
      const v = parseInt(document.getElementById(`ovDurationInput-${stepId}`).value, 10);
      if (Number.isFinite(v) && v > 0) overrides.durationSec = v;
    }
    if (document.getElementById(`ovImageChk-${stepId}`).checked) {
      const pending = pendingOverrideImages.get(stepId);
      if (pending) {
        try {
          const path = await data.savePoseImage(`${step.poseId}__${stepId}`, pending.base64, pending.ext);
          overrides.image = path;
          // Display the photo locally until the site rebuild publishes it.
          const mime = pending.ext === "png" ? "image/png" : "image/jpeg";
          setLocalImagePreview(path, `data:${mime};base64,${pending.base64}`);
        } catch (err) {
          toast(err.message, { tone: "error" });
          btn.disabled = false;
          btn.textContent = "Save overrides";
          return;
        }
      } else if (step.overrides?.image) {
        overrides.image = step.overrides.image;
      }
    }

    step.overrides = Object.keys(overrides).length > 0 ? overrides : undefined;
    if (!step.overrides) delete step.overrides;
    pendingOverrideImages.delete(stepId);

    const ok = await persistSequence(sequence);
    if (ok) {
      openOverridePanelStepId = null;
      renderEditorView(sequence);
    } else {
      btn.disabled = false;
      btn.textContent = "Save overrides";
    }
  });
}

function renderInsertRow(index) {
  return `<div class="insert-row"><button data-index="${index}">+ Insert pose here</button></div>`;
}

function openPosePicker(sequence, insertAtIndex) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>Add a pose</h2>
        <button class="btn-icon" id="pickerClose">✕</button>
      </div>
      <input type="text" id="pickerSearch" class="search-input" placeholder="Search poses…">
      <button class="btn-block" id="pickerNewPoseBtn">+ Create a brand-new pose</button>
      <div class="grid" id="pickerGrid" style="margin-top:14px;"></div>
    </div>
  `;
  document.body.appendChild(backdrop);

  function renderPickerGrid(query = "") {
    const poses = data
      .getPoses()
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
    const grid = backdrop.querySelector("#pickerGrid");
    grid.innerHTML = poses
      .map(
        (p) => `
        <button class="pose-card" data-id="${p.id}" style="text-align:left;">
          <img src="${resolveImageSrc(p.image) || PLACEHOLDER_IMAGE}" alt="" class="pose-thumb" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'">
          <div style="font-size:14px;font-weight:600;">${p.name}</div>
        </button>`
      )
      .join("");

    grid.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!requirePAT()) return;
        sequence.steps.splice(insertAtIndex, 0, { stepId: genId("step"), poseId: btn.dataset.id });
        backdrop.remove();
        if (await persistSequence(sequence)) renderEditorView(sequence);
      });
    });
  }

  backdrop.querySelector("#pickerClose").addEventListener("click", () => backdrop.remove());
  backdrop.querySelector("#pickerSearch").addEventListener("input", (e) => renderPickerGrid(e.target.value));
  backdrop.querySelector("#pickerNewPoseBtn").addEventListener("click", async () => {
    const pose = await openPoseEditor(null);
    if (!pose) return;
    if (!requirePAT()) return;
    sequence.steps.splice(insertAtIndex, 0, { stepId: genId("step"), poseId: pose.id });
    backdrop.remove();
    if (await persistSequence(sequence)) renderEditorView(sequence);
  });

  renderPickerGrid();
}

// ---------------- Init ----------------

async function init() {
  await data.loadAll();
  if (!seqId) {
    renderListView();
    return;
  }
  const sequence = data.getSequenceById(seqId);
  if (!sequence) {
    toast("That sequence wasn't found.", { tone: "error" });
    location.href = "builder.html";
    return;
  }
  renderEditorView(sequence);
}

init();
