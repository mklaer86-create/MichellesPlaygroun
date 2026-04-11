Set up a new newsletter quarter for Michelle.

The quarter to create is: $ARGUMENTS
(Example: if the user typed `/new-quarter 2026-Q3`, create the Q3 folder.)

Steps:
1. Read `newsletters/_TEMPLATE.md` to get the full template content.
2. Create `newsletters/$ARGUMENTS/content.md` with that template content.
3. In the new file, update the frontmatter fields:
   - Set `quarter:` to "$ARGUMENTS"
   - Leave `hero_image:` and `logo_url:` blank — Michelle will fill those in
   - Keep `donate_url:` as-is unless she specifies otherwise
4. Confirm to Michelle that the file is ready in plain language. Tell her:
   - Where to find it (newsletters/$ARGUMENTS/content.md)
   - That she can open it in GitHub, click the pencil icon, and start writing
   - That saving (committing) will auto-build the email

If no argument was given (i.e., $ARGUMENTS is empty), ask Michelle which quarter
she wants to create before doing anything.
