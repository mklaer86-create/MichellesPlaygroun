// A small, dependency-free crop/rotate/zoom tool so a raw phone photo of a
// sketchbook page can be cropped down to one clean square pose image before
// it's committed to the repo. Deliberately simple: pan by dragging, zoom via
// a slider, rotate in 90° steps — no free-form crop handles.

const BOX = 320; // on-screen crop viewport, in CSS px
const OUTPUT = 800; // exported image size, in px

export function openImageCropper({ onDone, onCancel } = {}) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>Add a photo</h2>
        <button class="btn-icon" id="cropClose">✕</button>
      </div>
      <div id="cropPicker">
        <p>Take or choose a photo. You'll be able to crop it down to just the pose.</p>
        <input type="file" accept="image/*" capture="environment" id="cropFileInput" style="display:none">
        <button class="btn-primary btn-block" id="cropChooseBtn">Choose photo</button>
      </div>
      <div id="cropEditor" style="display:none;">
        <div class="crop-canvas-wrap">
          <canvas id="cropCanvas" width="${BOX}" height="${BOX}"></canvas>
        </div>
        <div class="crop-controls">
          <div class="row">
            <span>🔍</span>
            <input type="range" id="cropZoom" min="1" max="3" step="0.02" value="1">
          </div>
          <div class="row">
            <button id="cropRotateBtn">↻ Rotate</button>
            <button id="cropRetakeBtn">Choose a different photo</button>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button id="cropCancelBtn">Cancel</button>
        <button class="btn-primary" id="cropUseBtn" disabled>Use this photo</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const canvas = backdrop.querySelector("#cropCanvas");
  const ctx = canvas.getContext("2d");
  const fileInput = backdrop.querySelector("#cropFileInput");
  const zoomInput = backdrop.querySelector("#cropZoom");
  const useBtn = backdrop.querySelector("#cropUseBtn");
  const editorEl = backdrop.querySelector("#cropEditor");
  const pickerEl = backdrop.querySelector("#cropPicker");

  let img = null;
  let rotation = 0;
  let zoom = 1;
  let panX = 0;
  let panY = 0;

  function close() {
    backdrop.remove();
  }

  function draw(targetCtx, boxSize, px, py) {
    if (!img) return;
    targetCtx.clearRect(0, 0, boxSize, boxSize);
    targetCtx.save();
    targetCtx.translate(boxSize / 2 + px, boxSize / 2 + py);
    targetCtx.rotate((rotation * Math.PI) / 180);
    const rotated = rotation % 180 !== 0;
    const effW = rotated ? img.height : img.width;
    const effH = rotated ? img.width : img.height;
    const baseFit = Math.max(boxSize / effW, boxSize / effH);
    const finalScale = baseFit * zoom;
    targetCtx.scale(finalScale, finalScale);
    targetCtx.drawImage(img, -img.width / 2, -img.height / 2);
    targetCtx.restore();
  }

  function redraw() {
    draw(ctx, BOX, panX, panY);
  }

  function loadFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => {
        img = image;
        rotation = 0;
        zoom = 1;
        panX = 0;
        panY = 0;
        zoomInput.value = "1";
        pickerEl.style.display = "none";
        editorEl.style.display = "block";
        useBtn.disabled = false;
        redraw();
      };
      image.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  backdrop.querySelector("#cropChooseBtn").addEventListener("click", () => fileInput.click());
  backdrop.querySelector("#cropRetakeBtn").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => loadFile(fileInput.files[0]));

  backdrop.querySelector("#cropRotateBtn").addEventListener("click", () => {
    rotation = (rotation + 90) % 360;
    panX = 0;
    panY = 0;
    redraw();
  });

  zoomInput.addEventListener("input", () => {
    zoom = parseFloat(zoomInput.value);
    redraw();
  });

  // Drag to pan.
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panStartX = 0;
  let panStartY = 0;

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    panStartX = panX;
    panStartY = panY;
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    panX = panStartX + (e.clientX - dragStartX);
    panY = panStartY + (e.clientY - dragStartY);
    redraw();
  });
  window.addEventListener("pointerup", () => {
    dragging = false;
  });

  backdrop.querySelector("#cropClose").addEventListener("click", () => {
    close();
    onCancel?.();
  });
  backdrop.querySelector("#cropCancelBtn").addEventListener("click", () => {
    close();
    onCancel?.();
  });

  useBtn.addEventListener("click", () => {
    const outCanvas = document.createElement("canvas");
    outCanvas.width = OUTPUT;
    outCanvas.height = OUTPUT;
    const outCtx = outCanvas.getContext("2d");
    const scaleFactor = OUTPUT / BOX;
    draw(outCtx, OUTPUT, panX * scaleFactor, panY * scaleFactor);
    const dataUrl = outCanvas.toDataURL("image/jpeg", 0.85);
    const base64 = dataUrl.split(",")[1];
    close();
    onDone?.(base64, "jpg");
  });
}
