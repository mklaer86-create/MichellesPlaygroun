Build the email HTML for Michelle's newsletter.

If $ARGUMENTS is provided, use that as the path to content.md (e.g. "newsletters/2026-Q3/content.md").
If no argument is given, find the most recently modified content.md file under newsletters/.

Steps:
1. Identify the target content.md file (from argument or most recent).
2. Run the build script: `python scripts/build_email.py <path-to-content.md>`
3. After it completes, tell Michelle:
   - Where the output file is (same folder, named email.html)
   - How to get it into Mailchimp:
     1. Open the email.html file in GitHub
     2. Click the "Raw" button
     3. Select all (Ctrl+A) and copy
     4. In Mailchimp: Create Campaign → "Code your own" → paste
4. If the build fails, show her the error in plain English and suggest how to fix it.

Keep all explanations simple — Michelle works on iPad and is not an engineer.
