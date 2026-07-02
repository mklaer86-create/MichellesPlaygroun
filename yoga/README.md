# Flow Cards — Yoga Sequence Flashcards

A flashcard app for stepping through your yoga sequences one pose at a time —
image, name, and a short cue — on your phone, tablet, or desktop. Advance by
tapping/swiping, or let it auto-advance on a timer.

---

## One-Time Setup

Two things need doing once before this is live. If someone already did these,
skip ahead.

### 1. Turn on GitHub Pages for this repo

1. Go to this repo's **Settings** tab
2. Click **Pages** in the left sidebar
3. Under "Build and deployment" → **Source**, choose **GitHub Actions**

After that, every commit that touches the `yoga/` folder automatically
publishes the app (check the **Actions** tab for a green checkmark, same as
the newsletter builder).

### 2. Create a GitHub token so the in-app editor can save your changes

The Pose Library and Sequence Builder screens save directly back to this
repo, so they need a token:

1. GitHub → your profile picture → **Settings** → **Developer settings** →
   **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
2. Set an expiration date
3. Under **Repository access**, choose **Only select repositories** → this repo
4. Under **Permissions** → **Repository permissions**, set **Contents** to
   **Read and write**. Leave everything else as "No access."
5. Generate the token and copy it
6. In the app, open **Settings** and paste it in

Treat this token like a password — never paste it into a shared or public
computer. Use the **Clear token** button in Settings if you ever need to
remove it from a device.

---

## Using the App

- **Practice**: pick a sequence on the home screen, then tap the right side
  of a card (or swipe left) to go forward, the left side (or swipe right) to
  go back, and the middle to pause/resume the auto-advance timer.
- **Poses**: the Pose Library holds every pose you've added. Editing a pose's
  photo, name, or cue there updates it everywhere it's used across every
  sequence.
- **Sequences**: the Sequence Builder is where you create flows, reorder or
  insert poses, remove them, and — if one occurrence of a pose needs
  different wording, timing, or a different photo just for that one
  spot — set a one-off override that won't affect the shared pose or any
  other sequence.
- **Add your own photos**: when adding or editing a pose, "Add photo" lets
  you take or choose a picture (like a photo of a hand-drawn pose) and crop
  it down to a clean square before saving.

## After Saving a Change

Saving commits straight to this repo. Give it about a minute for the site to
rebuild (watch the **Actions** tab for the green checkmark, or just refresh
the page after a minute) before it shows up on your other devices.

## Files in This Folder

```
data/poses.json        ← the shared pose library
data/sequences.json    ← all sequences, referencing poses by id
images/poses/          ← pose photos and placeholder art
js/                     ← app logic (no build step — plain files, load as-is)
```

You won't normally need to touch these files directly — the in-app editor
does it for you — but they're plain, readable JSON if you ever want to look.
