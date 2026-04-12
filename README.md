# Michelle's Newsletter Hub

Your quarterly newsletter system — write your content once, get a Mailchimp-ready
email automatically. No reformatting. No copy-paste nightmares.

---

## What This Does

You write your newsletter content in a simple text file (like filling out a form).
GitHub automatically converts it into a polished HTML email. You copy that HTML
into Mailchimp, and you're done.

**The problem it solves:** Your Canva newsletter is designed for print (multi-column,
letter-sized). Email clients need a totally different layout. Instead of reformatting
every quarter, you now write the content once here and get the email version for free.

---

## Your Quarterly Workflow (5 Steps)

### Step 1 — Open your newsletter folder

Go to `newsletters/2026-Q2/` (or whatever the current quarter is).
You'll see a file called `content.md` — that's where you write.

### Step 2 — Fill in your content

Click `content.md`, then click the **pencil icon** (top right of the file view) to edit.

You'll see clear sections already set up:
- From the Director
- Field Updates
- Stories of Impact
- Upcoming Events
- Prayer Requests
- Ways to Partner

Replace the placeholder text in each section with your real content.
The `#` symbols at the start of lines create the section headers — keep those.

### Step 3 — Save

Scroll to the bottom of the edit page. Click the green **"Commit changes"** button.
Type a quick note like "Q2 content draft" — then click **"Commit changes"** again.

That's your save. GitHub will now automatically build your email.

### Step 4 — Wait about 1 minute

Click the **"Actions"** tab at the top of this page. You'll see a job running.
When it shows a green checkmark, your email is ready.

### Step 5 — Copy your email HTML into Mailchimp

1. Go back to `newsletters/2026-Q2/` — there's now an `email.html` file
2. Click it, then click the **"Raw"** button (top right)
3. Select all the text (Ctrl+A on keyboard, or long-press → Select All on iPad)
4. Copy it
5. In Mailchimp: **Create Campaign** → **"Code your own"** → paste → done

---

## Starting a New Quarter

At the start of each new quarter:

1. Go to `newsletters/` in this repo
2. Click **"Add file"** → **"Create new file"**
3. In the filename box, type: `2026-Q3/content.md` (change the quarter)
4. In the large text area that appears, go to `newsletters/_TEMPLATE.md`,
   copy everything, and paste it into your new file
5. Update the `quarter:` line at the top to match the new quarter
6. Start writing — when you commit, the email builds automatically

---

## One-Time Fixes: Canva + Google Drive

### Make Drive images 1-click in Canva

Currently you have to import images manually. Here's the fix:

1. In Canva, click **"Apps"** in the left sidebar
2. Search for **"Google Drive"** → connect it with your Google account (one time)
3. Now when adding images: left sidebar → **Apps** → **Google Drive** → browse directly
4. No more downloading and re-uploading

### Organize your Drive for faster access

Create this folder structure so you always know where to look:

```
IMD Newsletter/
  Branding/          ← Logo, consistent graphics — reuse every quarter
  2026-Q1/           ← Archived
  2026-Q2/           ← Current — drop photos here throughout the quarter
  2026-Q3/           ← Stage next quarter's photos as they come in
```

Tip: Share this folder with your field teams so they can drop photos directly.

### Consider keeping two Canva templates

- **Print template** (what you have now) — for PDF, social sharing, printing
- **Email template** — search "email newsletter" in Canva's templates for a 600px
  single-column layout. But with this GitHub system, the email is auto-generated,
  so you may not need a Canva email template at all.

---

## Editing on iPad (Safari)

Everything here works in your browser — no apps to install.

| Action | How |
|--------|-----|
| Edit a file | Click the file → pencil icon ✏️ top right |
| Save changes | Scroll down → green "Commit changes" button |
| Create a new file | Click "Add file" → "Create new file" in any folder |
| Check build status | Click the "Actions" tab → look for green checkmark |
| Find your email HTML | Go to your quarter folder → `email.html` → "Raw" button |

---

## Files in This Repo

```
newsletters/
  _TEMPLATE.md          ← Copy this to start each new quarter
  2026-Q2/
    content.md          ← YOU WRITE HERE every quarter
    email.html          ← Auto-generated — copy this into Mailchimp

context/
  me.md                 ← Your personal context (fill this in over time)
                           Any AI tool can read this to understand who you are

scripts/
  build_email.py        ← The converter — you never touch this

.github/workflows/
  build-newsletter.yml  ← The auto-trigger — you never touch this
```

---

## Growing This Over Time

This repo is your vault — it grows with you. Some ideas for later:

- **`context/teaching-notes.md`** — keep your teaching outlines and session notes here
- **`context/org-contacts.md`** — key IMD contacts, board notes
- **`newsletters/archive/`** — keep past newsletters for reference and tone
- **Mailchimp automation** — we can add a step that creates the Mailchimp draft
  automatically, so you don't even have to paste the HTML manually
- **Social graphics brief** — a file that auto-generates what to post on social
  based on your newsletter content

---

## Stuck or Need Help?

Click **"Issues"** at the top of this page → **"New issue"** → describe what's not working.
Think of it like leaving yourself a sticky note.
