// Loads poses.json/sequences.json, resolves sequence steps against the
// shared pose library (this is where "editing a pose propagates everywhere"
// actually happens), and orchestrates saves through the GitHub API + the
// local optimistic overlay.

import * as gh from "./github-api.js";
import * as state from "./state.js";
import { nowIso } from "./utils.js";

const POSES_PATH = "yoga/data/poses.json";
const SEQUENCES_PATH = "yoga/data/sequences.json";

let cachedPoses = null;
let cachedSequences = null;

function applyOverlay(items, overlay, deletedIds) {
  const byId = new Map(items.map((i) => [i.id, i]));
  for (const item of overlay) byId.set(item.id, item);
  for (const id of deletedIds) byId.delete(id);
  return [...byId.values()];
}

// Fetches the live, published data (cache-busted) and layers this browser
// tab's not-yet-published edits on top, so the UI reflects reality even
// during the ~1 minute window while GitHub Pages is rebuilding.
export async function loadAll({ force = false } = {}) {
  if (cachedPoses && cachedSequences && !force) {
    return { poses: cachedPoses, sequences: cachedSequences };
  }
  const bust = Date.now();
  const [posesRes, sequencesRes] = await Promise.all([
    fetch(`data/poses.json?v=${bust}`),
    fetch(`data/sequences.json?v=${bust}`),
  ]);
  const rawPoses = posesRes.ok ? await posesRes.json() : [];
  const rawSequences = sequencesRes.ok ? await sequencesRes.json() : [];

  cachedPoses = applyOverlay(
    rawPoses,
    state.getPoseOverlay(),
    state.getDeletedPoseIds()
  );
  cachedSequences = applyOverlay(
    rawSequences,
    state.getSequenceOverlay(),
    state.getDeletedSequenceIds()
  );
  return { poses: cachedPoses, sequences: cachedSequences };
}

export function getPoses() {
  return cachedPoses || [];
}

export function getSequences() {
  return cachedSequences || [];
}

export function getPoseById(id) {
  return getPoses().find((p) => p.id === id) || null;
}

export function getSequenceById(id) {
  return getSequences().find((s) => s.id === id) || null;
}

// Resolve one step to its final displayed values: a per-step override wins,
// otherwise it falls back to the shared pose, otherwise (duration only) to
// the sequence's default, otherwise the app-wide setting.
export function resolveStep(sequence, step) {
  const pose = getPoseById(step.poseId);
  const overrides = step.overrides || {};
  const fallbackName = pose ? pose.name : "(missing pose)";
  return {
    stepId: step.stepId,
    poseId: step.poseId,
    pose,
    name: overrides.name ?? fallbackName,
    sanskritName: overrides.sanskritName ?? pose?.sanskritName ?? "",
    cue: overrides.cue ?? pose?.cue ?? "",
    image: overrides.image ?? pose?.image ?? "",
    durationSec:
      overrides.durationSec ??
      pose?.defaultDurationSec ??
      sequence.defaultDurationSec ??
      state.getDefaultDurationSec(),
    hasOverride: Object.keys(overrides).length > 0,
  };
}

export function resolveSequenceSteps(sequence) {
  return sequence.steps.map((step) => resolveStep(sequence, step));
}

export function findSequencesUsingPose(poseId) {
  return getSequences().filter((seq) =>
    seq.steps.some((s) => s.poseId === poseId)
  );
}

// ---- Save/delete orchestration (GitHub commit + local overlay) ----

export async function savePose(pose) {
  const current = await gh.getJsonFile(POSES_PATH);
  const arr = current ? current.json : [];
  const idx = arr.findIndex((p) => p.id === pose.id);
  const record = { ...pose, updatedAt: nowIso() };
  if (idx >= 0) {
    record.createdAt = arr[idx].createdAt || record.createdAt || nowIso();
    arr[idx] = record;
  } else {
    record.createdAt = record.createdAt || nowIso();
    arr.push(record);
  }
  await gh.putJsonFile(
    POSES_PATH,
    arr,
    current?.sha,
    idx >= 0 ? `Update pose: ${record.name}` : `Add pose: ${record.name}`
  );
  state.setPoseOverlayItem(record);
  if (cachedPoses) {
    const i = cachedPoses.findIndex((p) => p.id === record.id);
    if (i >= 0) cachedPoses[i] = record;
    else cachedPoses.push(record);
  }
  return record;
}

export async function deletePose(id) {
  const usedBy = findSequencesUsingPose(id);
  if (usedBy.length > 0) {
    const names = usedBy.map((s) => s.name).join(", ");
    throw new Error(
      `Can't delete — this pose is used in: ${names}. Remove it from those sequences first.`
    );
  }
  const current = await gh.getJsonFile(POSES_PATH);
  const arr = (current ? current.json : []).filter((p) => p.id !== id);
  await gh.putJsonFile(POSES_PATH, arr, current?.sha, `Delete pose: ${id}`);
  state.markPoseDeleted(id);
  if (cachedPoses) cachedPoses = cachedPoses.filter((p) => p.id !== id);
}

export async function saveSequence(sequence) {
  const current = await gh.getJsonFile(SEQUENCES_PATH);
  const arr = current ? current.json : [];
  const idx = arr.findIndex((s) => s.id === sequence.id);
  const record = { ...sequence, updatedAt: nowIso() };
  if (idx >= 0) {
    record.createdAt = arr[idx].createdAt || record.createdAt || nowIso();
    arr[idx] = record;
  } else {
    record.createdAt = record.createdAt || nowIso();
    arr.push(record);
  }
  await gh.putJsonFile(
    SEQUENCES_PATH,
    arr,
    current?.sha,
    idx >= 0 ? `Update sequence: ${record.name}` : `Add sequence: ${record.name}`
  );
  state.setSequenceOverlayItem(record);
  if (cachedSequences) {
    const i = cachedSequences.findIndex((s) => s.id === record.id);
    if (i >= 0) cachedSequences[i] = record;
    else cachedSequences.push(record);
  }
  return record;
}

export async function deleteSequence(id) {
  const current = await gh.getJsonFile(SEQUENCES_PATH);
  const arr = (current ? current.json : []).filter((s) => s.id !== id);
  await gh.putJsonFile(SEQUENCES_PATH, arr, current?.sha, `Delete sequence: ${id}`);
  state.markSequenceDeleted(id);
  if (cachedSequences) cachedSequences = cachedSequences.filter((s) => s.id !== id);
}

// Uploads a cropped pose photo and returns the path to store on the pose.
export async function savePoseImage(poseId, base64NoPrefix, ext) {
  const path = `yoga/images/poses/${poseId}.${ext}`;
  const existingSha = await gh.getFileSha(path);
  await gh.putBinaryFile(
    path,
    base64NoPrefix,
    `Add/update image for pose: ${poseId}`,
    existingSha
  );
  return `images/poses/${poseId}.${ext}`;
}
