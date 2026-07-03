import { renderNav } from "./app.js";
import * as data from "./data.js";
import { hasPAT, resolveImageSrc, setLocalImagePreview } from "./state.js";
import { toast, uniqueSlug } from "./utils.js";
import { openImageCropper } from "./image-crop.js";

const PLACEHOLDER_IMAGE = "images/poses/_placeholder.svg";

// Opens the add/edit pose modal. Resolves with the saved pose, or null if
// the user cancelled. Shared with builder.js so "+ New pose" inside the
// sequence builder reuses this exact same form instead of a second copy.
export function openPoseEditor(existingPose = null) {
  return new Promise((resolve) => {
    if (!hasPAT()) {
      toast("Add a GitHub token in Settings before saving poses.", { tone: "error" });
      resolve(null);
      return;
    }

    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>${existingPose ? "Edit pose" : "New pose"}</h2>
          <button class="btn-icon" id="poseModalClose">✕</button>
        </div>

        <div style="text-align:center;">
          <img id="posePreviewImg" src="${resolveImageSrc(existingPose?.image) || PLACEHOLDER_IMAGE}" alt=""
               onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'"
               style="width:120px;height:120px;object-fit:contain;background:var(--accent-light);border-radius:14px;">
          <div style="margin-top:8px;">
            <button id="poseChangePhotoBtn">${existingPose?.image ? "Change photo" : "Add photo"}</button>
          </div>
        </div>

        <label for="poseName">Name</label>
        <input type="text" id="poseName" value="${existingPose?.name || ""}" placeholder="e.g. Mountain Pose">

        <label for="poseSanskrit">Sanskrit name (optional)</label>
        <input type="text" id="poseSanskrit" value="${existingPose?.sanskritName || ""}" placeholder="e.g. Tadasana">

        <label for="poseCue">Cue text</label>
        <textarea id="poseCue" placeholder="A short instruction shown on the card">${existingPose?.cue || ""}</textarea>

        <label for="poseDuration">Default hold time (seconds)</label>
        <input type="number" id="poseDuration" min="1" value="${existingPose?.defaultDurationSec ?? 30}">

        <label for="poseTags">Tags (comma separated, optional)</label>
        <input type="text" id="poseTags" value="${(existingPose?.tags || []).join(", ")}" placeholder="e.g. standing, backbend">

        <div class="modal-actions">
          <button id="poseCancelBtn">Cancel</button>
          <button class="btn-primary" id="poseSaveBtn">Save pose</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    let pendingPhoto = null; // { base64, ext }

    function close(result) {
      backdrop.remove();
      resolve(result);
    }

    backdrop.querySelector("#poseModalClose").addEventListener("click", () => close(null));
    backdrop.querySelector("#poseCancelBtn").addEventListener("click", () => close(null));

    backdrop.querySelector("#poseChangePhotoBtn").addEventListener("click", () => {
      openImageCropper({
        onDone: (base64, ext) => {
          pendingPhoto = { base64, ext };
          const mime = ext === "png" ? "image/png" : "image/jpeg";
          backdrop.querySelector("#posePreviewImg").src = `data:${mime};base64,${base64}`;
        },
      });
    });

    backdrop.querySelector("#poseSaveBtn").addEventListener("click", async () => {
      const name = backdrop.querySelector("#poseName").value.trim();
      if (!name) {
        toast("Give the pose a name.", { tone: "error" });
        return;
      }
      const saveBtn = backdrop.querySelector("#poseSaveBtn");
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving…";

      try {
        const id =
          existingPose?.id ||
          uniqueSlug(name, data.getPoses().map((p) => p.id));

        let image = existingPose?.image || PLACEHOLDER_IMAGE;
        if (pendingPhoto) {
          image = await data.savePoseImage(id, pendingPhoto.base64, pendingPhoto.ext);
          // The committed image won't be on the published site for ~1 min;
          // remember the photo locally so it displays immediately here.
          const mime = pendingPhoto.ext === "png" ? "image/png" : "image/jpeg";
          setLocalImagePreview(image, `data:${mime};base64,${pendingPhoto.base64}`);
        }

        const tags = backdrop
          .querySelector("#poseTags")
          .value.split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        const pose = {
          id,
          name,
          sanskritName: backdrop.querySelector("#poseSanskrit").value.trim(),
          cue: backdrop.querySelector("#poseCue").value.trim(),
          defaultDurationSec:
            parseInt(backdrop.querySelector("#poseDuration").value, 10) || 30,
          tags,
          image,
        };

        const saved = await data.savePose(pose);
        toast(`Saved "${saved.name}". Live everywhere in about a minute.`);
        close(saved);
      } catch (err) {
        toast(err.message, { tone: "error" });
        saveBtn.disabled = false;
        saveBtn.textContent = "Save pose";
      }
    });
  });
}

export async function confirmAndDeletePose(pose) {
  if (!hasPAT()) {
    toast("Add a GitHub token in Settings before deleting poses.", { tone: "error" });
    return false;
  }
  if (!confirm(`Delete "${pose.name}"? This can't be undone.`)) return false;
  try {
    await data.deletePose(pose.id);
    toast(`Deleted "${pose.name}".`);
    return true;
  } catch (err) {
    toast(err.message, { tone: "error", duration: 6000 });
    return false;
  }
}

// ---- Page wiring (only runs when library.html's own elements exist, so
// this module can be safely imported from builder.js just for the modal) ----

function initLibraryPage() {
  renderNav("library");
  const grid = document.getElementById("poseGrid");
  const search = document.getElementById("poseSearch");
  let query = "";

  function renderGrid() {
    const poses = data
      .getPoses()
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (poses.length === 0) {
      if (data.getPoses().length === 0 && data.isDataUnavailable()) {
        grid.innerHTML = `<div class="empty-state">Can't reach the pose library right now — your data is safe on GitHub.<br>Check your connection or try again in a minute.<br><br><button class="btn-primary" onclick="location.reload()">Try again</button></div>`;
      } else {
        grid.innerHTML = `<div class="empty-state">No poses match yet.</div>`;
      }
      return;
    }

    grid.innerHTML = poses
      .map(
        (pose) => `
        <div class="pose-card" data-id="${pose.id}">
          <img src="${resolveImageSrc(pose.image) || PLACEHOLDER_IMAGE}" alt="" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'">
          <h3 style="font-size:15px;">${pose.name}</h3>
          <div class="meta">${pose.sanskritName || ""}</div>
          <div class="meta">${pose.defaultDurationSec}s</div>
          <div class="step-actions">
            <button class="edit-btn" data-id="${pose.id}">Edit</button>
            <button class="btn-danger delete-btn" data-id="${pose.id}">Delete</button>
          </div>
        </div>`
      )
      .join("");
  }

  grid.addEventListener("click", async (e) => {
    const editBtn = e.target.closest(".edit-btn");
    const deleteBtn = e.target.closest(".delete-btn");
    if (editBtn) {
      const pose = data.getPoseById(editBtn.dataset.id);
      const saved = await openPoseEditor(pose);
      if (saved) renderGrid();
    } else if (deleteBtn) {
      const pose = data.getPoseById(deleteBtn.dataset.id);
      const deleted = await confirmAndDeletePose(pose);
      if (deleted) renderGrid();
    }
  });

  search.addEventListener("input", () => {
    query = search.value;
    renderGrid();
  });

  document.getElementById("addPoseBtn").addEventListener("click", async () => {
    const saved = await openPoseEditor(null);
    if (saved) renderGrid();
  });

  data.loadAll().then(renderGrid);
}

if (document.getElementById("poseGrid")) {
  initLibraryPage();
}
