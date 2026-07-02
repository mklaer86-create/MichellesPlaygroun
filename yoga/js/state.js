// localStorage / sessionStorage helpers: GitHub token, timer default,
// and the "optimistic overlay" that makes edits show up instantly in this
// browser tab even before the GitHub Pages rebuild finishes.

const PAT_KEY = "yoga_pat";
const DURATION_KEY = "yoga_default_duration_sec";
const OVERLAY_POSES_KEY = "yoga_overlay_poses";
const OVERLAY_SEQUENCES_KEY = "yoga_overlay_sequences";
const DELETED_POSES_KEY = "yoga_overlay_deleted_poses";
const DELETED_SEQUENCES_KEY = "yoga_overlay_deleted_sequences";

export function getPAT() {
  return localStorage.getItem(PAT_KEY) || "";
}

export function setPAT(token) {
  localStorage.setItem(PAT_KEY, token.trim());
}

export function clearPAT() {
  localStorage.removeItem(PAT_KEY);
}

export function hasPAT() {
  return getPAT().length > 0;
}

export function getDefaultDurationSec() {
  const v = parseInt(localStorage.getItem(DURATION_KEY), 10);
  return Number.isFinite(v) && v > 0 ? v : 30;
}

export function setDefaultDurationSec(sec) {
  localStorage.setItem(DURATION_KEY, String(sec));
}

function readJsonArray(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeJsonArray(key, arr) {
  sessionStorage.setItem(key, JSON.stringify(arr));
}

export function getPoseOverlay() {
  return readJsonArray(OVERLAY_POSES_KEY);
}

export function setPoseOverlayItem(pose) {
  const list = getPoseOverlay().filter((p) => p.id !== pose.id);
  list.push(pose);
  writeJsonArray(OVERLAY_POSES_KEY, list);
  const deleted = getDeletedPoseIds().filter((id) => id !== pose.id);
  writeJsonArray(DELETED_POSES_KEY, deleted);
}

export function getDeletedPoseIds() {
  return readJsonArray(DELETED_POSES_KEY);
}

export function markPoseDeleted(id) {
  writeJsonArray(
    OVERLAY_POSES_KEY,
    getPoseOverlay().filter((p) => p.id !== id)
  );
  const deleted = new Set(getDeletedPoseIds());
  deleted.add(id);
  writeJsonArray(DELETED_POSES_KEY, [...deleted]);
}

export function getSequenceOverlay() {
  return readJsonArray(OVERLAY_SEQUENCES_KEY);
}

export function setSequenceOverlayItem(sequence) {
  const list = getSequenceOverlay().filter((s) => s.id !== sequence.id);
  list.push(sequence);
  writeJsonArray(OVERLAY_SEQUENCES_KEY, list);
  const deleted = getDeletedSequenceIds().filter((id) => id !== sequence.id);
  writeJsonArray(DELETED_SEQUENCES_KEY, deleted);
}

export function getDeletedSequenceIds() {
  return readJsonArray(DELETED_SEQUENCES_KEY);
}

export function markSequenceDeleted(id) {
  writeJsonArray(
    OVERLAY_SEQUENCES_KEY,
    getSequenceOverlay().filter((s) => s.id !== id)
  );
  const deleted = new Set(getDeletedSequenceIds());
  deleted.add(id);
  writeJsonArray(DELETED_SEQUENCES_KEY, [...deleted]);
}
