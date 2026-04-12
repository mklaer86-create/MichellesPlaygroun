# Integrations & App Connections

> This file tracks every tool Michelle uses, how it connects to the rest of the system,
> what's automated, and what still requires a manual step.

---

## GitHub (this repo)

**Account:** [your GitHub username]  
**Repo:** [your repo name — e.g. mklaer86-create/MichellesPlaygroun]  
**Purpose:** Central hub — newsletter content, OS files, automation scripts  
**Access:** Browser (iPad + any device), Obsidian Git plugin (iPad vault sync)

**What's automated:**
| Trigger | What happens |
|---------|-------------|
| Save `newsletters/**/content.md` | GitHub Action runs `build_email.py` → generates `email.html` in same folder |
| 7am Eastern every day | GitHub Action creates that day's daily brief in `os/briefs/YYYY-MM-DD.md` |

**Manual steps still required:**
- Copy the generated `email.html` into Mailchimp
- Fill in the daily brief (it's auto-created but not auto-filled)

---

## Mailchimp

**Account email:** [your Mailchimp login email]  
**Audience name:** [your list/audience name]  
**Purpose:** Send the quarterly newsletter to subscribers  
**Connected to GitHub:** Manually — copy HTML from `email.html` → paste into Mailchimp campaign

**Workflow:**
1. Write content in `newsletters/YYYY-QN/content.md`
2. Save (commit) — GitHub auto-builds `email.html`
3. Open `email.html` in GitHub → select all → copy
4. In Mailchimp: New Campaign → Code your own → paste HTML
5. Preview, test send, then send

**To automate further:** Mailchimp has an API. Could auto-create drafts — not set up yet.

---

## Canva

**Account:** [your Canva login]  
**Purpose:** Newsletter visual design, social media graphics, event materials  
**Connected to:** Google Drive (via Canva Apps panel)

**Setup (already done):**
- Canva → Apps → Google Drive → connected
- You can browse Drive images inside Canva without downloading/uploading

**Templates:**
| Template | What it's for | Canva link |
|----------|--------------|-----------|
| Newsletter | Quarterly print/design layout | [paste link] |
| Social Post | IMD Instagram/Facebook | [paste link] |
| Event Flyer | Trainings & events | [paste link] |

---

## Google Drive

**Account:** [your Google account]  
**Folder structure:** [describe your main IMD/media folder]  
**Purpose:** Image and asset storage — photos, graphics, source files  
**Connected to:** Canva (direct browse), GitHub (manual — paste image URLs into content.md)

**Using Drive images in newsletters:**
- Right-click an image in Drive → "Get link" → change to "Anyone with the link"
- Paste the URL into the `hero_image:` field in your `content.md` frontmatter

---

## Obsidian (iPad)

**Vault location:** Synced from this GitHub repo via Obsidian Git plugin  
**Purpose:** Daily brief, project notes, OS files — all in one place on iPad  
**Plugin:** Obsidian Git (community plugin — free)

**Sync setup:**
1. Install Obsidian Git from Community Plugins
2. Point vault at this repo
3. Pull to get latest files; push to save changes back to GitHub

**Key vault files:**
| File | What it is |
|------|-----------|
| `os/michelle-os.md` | Master brain / OS hub |
| `os/briefs/YYYY-MM-DD.md` | Today's brief (auto-generated each morning) |
| `projects/imd/project.md` | IMD project hub |
| `projects/writing/project.md` | Book writing hub |
| `projects/graduation/project.md` | Graduation planning |
| `context/me.md` | Personal context card for AI tools |

---

## Claude (AI Assistant)

**Access:** claude.ai (browser or app)  
**Slash commands available:** (type `/` in Claude to see all)

| Command | What it does |
|---------|-------------|
| `/build-email` | Builds newsletter email HTML |
| `/new-quarter` | Sets up a new newsletter quarter |
| `/draft-section` | Drafts a newsletter section in your voice |
| `/review-newsletter` | Checklist — what's done, what needs work |
| `/canva-copy` | Clean text blocks to paste into Canva |
| `/daily-brief` | Open and fill in today's brief conversationally |
| `/update-os` | Update your OS file sections |
| `/social-post` | Draft a social media post |
| `/new-project-note` | Create a new note in a project folder |
| `/add-task` | Add a task to a project hub |

---

## Potential Future Automations

Things that could be automated but aren't yet — add ideas here:

| Idea | Benefit | Complexity |
|------|---------|-----------|
| Auto-create Mailchimp draft from email.html | Skip the copy-paste step | Medium — needs API key |
| Post social content from GitHub | Schedule posts directly | Medium — needs platform API |
| Weekly project summary | Auto-email or note with open loops | Low — GitHub Action |
| Graduation countdown in daily brief | See days until May ceremony | Low — add to daily-brief.yml |

---

*Last updated: 2026-04-12*
