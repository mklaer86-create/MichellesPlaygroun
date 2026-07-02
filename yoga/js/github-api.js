// Thin wrapper around the GitHub REST Contents API so the in-app editor can
// commit changes straight from the browser using a personal access token.
// This is the app's only "backend" — there is no server.

import { getPAT } from "./state.js";
import { utf8ToBase64 } from "./utils.js";

const OWNER = "mklaer86-create";
const REPO = "MichellesPlaygroun";
const BRANCH = "main";
const API_BASE = "https://api.github.com";

export class GitHubApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function authHeaders(extra = {}) {
  const token = getPAT();
  if (!token) {
    throw new GitHubApiError(
      "No GitHub token saved yet. Add one in Settings before saving changes.",
      401
    );
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    ...extra,
  };
}

function contentsUrl(path) {
  return `${API_BASE}/repos/${OWNER}/${REPO}/contents/${encodeURI(path)}?ref=${BRANCH}`;
}

async function friendlyError(res) {
  let detail = "";
  try {
    const body = await res.json();
    detail = body.message || "";
  } catch {
    // ignore
  }
  if (res.status === 401 || res.status === 403) {
    throw new GitHubApiError(
      "GitHub rejected the token. Check Settings — it may be missing, wrong, or expired.",
      res.status
    );
  }
  if (res.status === 409) {
    throw new GitHubApiError(
      "This file changed since it was loaded. Reload the page and redo your edit.",
      res.status
    );
  }
  throw new GitHubApiError(
    `GitHub API error (${res.status}): ${detail || res.statusText}`,
    res.status
  );
}

// Fetch a JSON file's current content + blob sha (needed for updates).
// Returns null if the file doesn't exist yet.
export async function getJsonFile(path) {
  const res = await fetch(contentsUrl(path), { headers: authHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) await friendlyError(res);
  const body = await res.json();
  const decoded = decodeURIComponent(
    escape(atob(body.content.replace(/\n/g, "")))
  );
  return { sha: body.sha, json: JSON.parse(decoded) };
}

// Write a JSON file. Pass sha for an update, omit it to create a new file.
export async function putJsonFile(path, data, sha, message) {
  const content = utf8ToBase64(JSON.stringify(data, null, 2) + "\n");
  const res = await fetch(contentsUrl(path), {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      message,
      content,
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) await friendlyError(res);
  return res.json();
}

// Look up just the blob sha for a file (works for binary files too, since it
// never tries to decode/parse the content) — null if the file doesn't exist.
export async function getFileSha(path) {
  const res = await fetch(contentsUrl(path), { headers: authHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) await friendlyError(res);
  const body = await res.json();
  return body.sha;
}

// Write a binary file (e.g. an uploaded pose photo) from a base64 string
// that has already had its "data:...;base64," prefix stripped off.
// Pass sha when overwriting an existing file at the same path.
export async function putBinaryFile(path, base64Content, message, sha) {
  const res = await fetch(contentsUrl(path), {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      message,
      content: base64Content,
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) await friendlyError(res);
  return res.json();
}
