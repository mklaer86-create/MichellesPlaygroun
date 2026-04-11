Generate a clean, section-by-section copy document that Michelle can use to paste content
directly into her Canva newsletter template — no reformatting needed.

If $ARGUMENTS is provided, use that as the path to content.md.
If not, find the most recently modified newsletters/*/content.md.

Steps:
1. Read the content.md file and parse each section.
2. Read `context/me.md` if available, for voice/context.
3. Output each section as clearly labeled, copy-paste-ready blocks — like this:

   ━━━━━━━━━━━━━━━━━━━━━━━━━━
   FROM THE DIRECTOR
   ━━━━━━━━━━━━━━━━━━━━━━━━━━
   [Section text here, clean — no markdown symbols like **, #, or >]

   ━━━━━━━━━━━━━━━━━━━━━━━━━━
   FIELD UPDATES — [Region Name]
   ━━━━━━━━━━━━━━━━━━━━━━━━━━
   [Section text]

4. Strip all markdown formatting from the output:
   - Remove ** bold markers (keep the word, drop the **)
   - Remove * italic markers
   - Remove > blockquote markers (keep the quoted text)
   - Remove # heading markers
   - Keep bullet points as plain dashes or the actual text
   - Keep table content as simple line-by-line entries:
     Date: [date] | Event: [name] | Location: [place]

5. After each section block, add a brief note in [brackets] about where it goes
   in the Canva template (e.g., [Paste into the "Director's Letter" text box])
   — but only if you know enough context from me.md to say something useful.

6. End with a reminder:
   - Images: go to Canva → Apps → Google Drive to browse photos directly
   - Use the same section order as in Canva to make copying faster

The goal is that Michelle can open this output side-by-side with Canva and
paste each section in order — no cleanup needed.
