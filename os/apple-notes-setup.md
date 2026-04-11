# Apple Notes Setup — Morning Brief

This guide walks you through creating an Apple Shortcut that automatically
drops your daily brief into Apple Notes each morning.

Everything is done on your iPad — no apps to install, just the built-in Shortcuts app.

---

## What You're Building

Every morning at 7am, a Shortcut will:
1. Check what today's date is
2. Grab your brief from GitHub (it's already been generated at that point)
3. Create a new note in Apple Notes with that content

---

## Step 1: Get Your GitHub URL

Your daily briefs live at this URL pattern:
```
https://raw.githubusercontent.com/mklaer86-create/michellesplaygroun/main/os/briefs/YYYY-MM-DD.md
```

For example, today's brief would be:
```
https://raw.githubusercontent.com/mklaer86-create/michellesplaygroun/main/os/briefs/2026-04-11.md
```

**If your repo is private**, you'll need a GitHub token (see Step 1b below).  
**If your repo is public**, skip to Step 2.

### Step 1b — Create a GitHub Token (private repos only)

1. On any browser, go to **github.com** → click your profile photo → **Settings**
2. Scroll down to **Developer settings** (bottom of left sidebar)
3. Click **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
4. Give it a name like "Morning Brief Shortcut"
5. Set expiration to **1 year** (or no expiration)
6. Under **Repository access** → select **Only select repositories** → choose this repo
7. Under **Permissions** → **Contents** → set to **Read-only**
8. Click **Generate token** → **copy it immediately** (you won't see it again)

Save your token somewhere safe (like an Apple Note) — you'll paste it in Step 3.

---

## Step 2: Build the Shortcut

1. Open the **Shortcuts** app on your iPad
2. Tap the **+** button (top right) to create a new shortcut
3. Tap **Add Action**

**Action 1: Get today's date as YYYY-MM-DD**
- Search for **"Format Date"**
- Tap it to add it
- Tap the date field → choose **"Current Date"**
- Tap "Format" → choose **"Custom"**
- Type: `yyyy-MM-dd`
- This gives you something like `2026-04-11`

**Action 2: Build the URL**
- Tap **Add Action** → search for **"Text"**
- In the text field, type: `https://raw.githubusercontent.com/mklaer86-create/michellesplaygroun/main/os/briefs/`
- After that URL text, tap the **variable icon** (looks like a box with x) → select the date result from Action 1
- Then type `.md` at the end
- It should look like: `https://raw.githubusercontent.com/.../os/briefs/[Formatted Date].md`

**Action 3: Fetch the brief from GitHub**
- Tap **Add Action** → search for **"Get Contents of URL"**
- Tap on the URL field → choose the "Text" result from Action 2

*If your repo is private, expand this action (tap the arrow):*
- Tap **Headers** → **Add new header**
- Key: `Authorization`
- Value: `token YOUR_TOKEN_HERE` (paste the token from Step 1b)

**Action 4: Create the Apple Note**
- Tap **Add Action** → search for **"Create Note"**
- For **Body**: tap the field → select the result from "Get Contents of URL"
- For **Title** (optional): type `Daily Brief — ` then add the formatted date variable
- For **Folder** (optional): choose or create a folder called "Daily Briefs"

4. Tap **Done** (top right)
5. Name it: **Morning Brief**

---

## Step 3: Set It to Run Automatically at 7am

1. In Shortcuts, tap the **Automation** tab (bottom of screen)
2. Tap the **+** button → **Personal Automation**
3. Choose **Time of Day**
4. Set time to **7:00 AM**
5. Choose **Daily**
6. Tap **Next**
7. Tap **Add Action** → search for **"Run Shortcut"**
8. Choose **Morning Brief**
9. Tap **Next**
10. Turn **OFF** "Ask Before Running" (so it runs silently)
11. Tap **Done**

---

## Testing It

To test before waiting for tomorrow morning:
1. Open Shortcuts → find **Morning Brief**
2. Tap the **play button** (▶)
3. Check Apple Notes — you should see today's brief appear

If it doesn't work:
- Make sure today's brief exists in GitHub (`os/briefs/2026-04-11.md`)
- If private repo, double-check your token (no extra spaces)
- Make sure "Allow Untrusted Shortcuts" is on: Settings → Shortcuts

---

## Adjusting the Time

The brief is generated in GitHub at 7am Eastern (11am UTC).
If you're in a different timezone, you may want to adjust either:
- The GitHub Action cron in `.github/workflows/daily-brief.yml` (the `0 11 * * *` line)
- The Shortcut automation time

---

## A Note on the Brief Layout

The brief that lands in Apple Notes will include markdown formatting
(like `**bold**` and `- lists`). Apple Notes doesn't render markdown,
so you'll see the plain text with the symbols.

If you'd prefer plain text without any symbols, let me know and I can
update the template to remove markdown formatting entirely.
