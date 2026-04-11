#!/usr/bin/env python3
"""
Newsletter Email Builder
========================
Converts a newsletter content.md file into email-ready HTML.

You never need to run or edit this file — GitHub runs it automatically
every time you save (commit) a content.md file.

Output: email.html in the same folder as your content.md
"""

import re
import sys
from pathlib import Path

try:
    import markdown
    HAVE_MARKDOWN = True
except ImportError:
    HAVE_MARKDOWN = False
    print("Note: 'markdown' package not found. Run: pip install markdown")


# ── Brand Colors ──────────────────────────────────────────────────────────────
NAVY   = '#1B3A5C'
GOLD   = '#C4943A'
LIGHT  = '#EEF3F8'
WHITE  = '#FFFFFF'
TEXT   = '#333333'
MUTED  = '#666666'
BORDER = '#D0DAE8'
BG     = '#F4F6F8'
# ──────────────────────────────────────────────────────────────────────────────


def parse_frontmatter(text):
    """Read the metadata at the top of the file (between the --- lines)."""
    m = re.match(r'^---\r?\n(.*?)\r?\n---\r?\n(.*)', text, re.DOTALL)
    if not m:
        return {}, text.strip()
    meta = {}
    for line in m.group(1).split('\n'):
        if ':' in line:
            key, _, val = line.partition(':')
            meta[key.strip()] = val.strip().strip('"\'')
    return meta, m.group(2).strip()


def markdown_to_html(text):
    """Convert markdown text to HTML."""
    if HAVE_MARKDOWN:
        md = markdown.Markdown(extensions=['tables', 'extra'])
        return md.convert(text)
    # Basic fallback if markdown package isn't available
    paragraphs = re.split(r'\n\n+', text)
    return '\n'.join(f'<p>{p.strip()}</p>' for p in paragraphs if p.strip())


def add_email_styles(html):
    """
    Add inline CSS styles to every HTML element.
    Email clients ignore external stylesheets, so everything must be inline.
    """
    replacements = [
        # Paragraphs
        ('<p>',
         f'<p style="color:{TEXT};font-family:Georgia,serif;font-size:15px;'
         f'line-height:1.85;margin:0 0 14px;">'),
        # H2 — subheadings within a section
        ('<h2>',
         f'<h2 style="color:{NAVY};font-family:Georgia,serif;font-size:17px;'
         f'font-weight:bold;margin:22px 0 10px;padding-bottom:6px;'
         f'border-bottom:1px solid {BORDER};">'),
        # H3
        ('<h3>',
         f'<h3 style="color:{NAVY};font-family:Georgia,serif;font-size:15px;'
         f'font-weight:bold;margin:16px 0 8px;">'),
        # Bullet lists
        ('<ul>',
         f'<ul style="color:{TEXT};font-family:Georgia,serif;font-size:15px;'
         f'line-height:1.85;margin:10px 0 14px;padding-left:22px;">'),
        # Numbered lists
        ('<ol>',
         f'<ol style="color:{TEXT};font-family:Georgia,serif;font-size:15px;'
         f'line-height:1.85;margin:10px 0 14px;padding-left:22px;">'),
        # List items
        ('<li>', '<li style="margin-bottom:5px;">'),
        # Blockquotes — used for testimonials/pull quotes
        ('<blockquote>',
         f'<blockquote style="border-left:4px solid {GOLD};margin:18px 0;'
         f'padding:12px 20px;background:#faf7f2;font-style:italic;">'),
        # Links
        ('<a href="',
         f'<a style="color:{GOLD};text-decoration:none;font-weight:bold;" href="'),
        # Bold text
        ('<strong>', f'<strong style="color:{NAVY};">'),
        # Images
        ('<img ',
         '<img style="max-width:100%;height:auto;display:block;'
         'margin:14px auto;border-radius:3px;" '),
        # Tables (for events lists)
        ('<table>',
         f'<table style="width:100%;border-collapse:collapse;margin:14px 0;'
         f'font-family:Georgia,serif;font-size:14px;">'),
        ('<th>',
         f'<th style="background:{NAVY};color:{WHITE};padding:9px 14px;'
         f'text-align:left;font-weight:bold;">'),
        ('<td>',
         f'<td style="padding:9px 14px;border-bottom:1px solid {BORDER};color:{TEXT};">'),
        # Horizontal rules
        ('<hr />',
         f'<hr style="border:none;border-top:1px solid {BORDER};margin:18px 0;" />'),
        ('<hr>',
         f'<hr style="border:none;border-top:1px solid {BORDER};margin:18px 0;" />'),
    ]
    for old, new in replacements:
        html = html.replace(old, new)
    return html


def build_section(title, content_markdown):
    """Build one section block: a colored header bar + the content below it."""
    content_html = add_email_styles(markdown_to_html(content_markdown))

    # Sections with a title get the colored header bar
    header_html = ''
    if title:
        header_html = f'''  <tr>
    <td style="background:{LIGHT};padding:13px 36px;border-top:3px solid {NAVY};">
      <p style="color:{NAVY};font-family:Arial,sans-serif;font-size:12px;
                letter-spacing:1.8px;text-transform:uppercase;font-weight:bold;margin:0;">
        {title}
      </p>
    </td>
  </tr>'''

    return f'''{header_html}
  <tr>
    <td style="background:{WHITE};padding:24px 36px 20px;">
      {content_html}
    </td>
  </tr>'''


def split_into_sections(body_text):
    """
    Split the markdown body on H1 headings (lines starting with # but not ##).
    Returns a list of (section_title, section_content) pairs.
    """
    parts = re.split(r'^# (.+)$', body_text, flags=re.MULTILINE)

    sections = []

    # Content before the first # heading (rare, but handle it)
    intro = parts[0].strip()
    if intro:
        sections.append(('', intro))

    # Everything after splits into alternating: title, content, title, content...
    for i in range(1, len(parts), 2):
        title   = parts[i].strip()
        content = parts[i + 1].strip() if i + 1 < len(parts) else ''
        sections.append((title, content))

    return sections


def build_full_email(meta, sections):
    """Assemble the complete HTML email from all the pieces."""
    title      = meta.get('title', 'IMDI International Newsletter')
    quarter    = meta.get('quarter', '')
    hero_image = meta.get('hero_image', '').strip()
    donate_url = meta.get('donate_url', 'https://imdinternational.org/give')
    logo_url   = meta.get('logo_url', '').strip()

    # Optional logo above the title
    logo_html = ''
    if logo_url:
        logo_html = (f'<img src="{logo_url}" alt="IMDI International" '
                     f'style="height:52px;display:block;margin:0 auto 14px;" />')

    # Optional full-width hero image below the header
    hero_html = ''
    if hero_image:
        hero_html = f'''
  <tr>
    <td style="padding:0;line-height:0;">
      <img src="{hero_image}" alt="Newsletter header image"
           style="width:100%;max-width:600px;display:block;height:auto;" />
    </td>
  </tr>'''

    # All content sections joined together
    all_sections_html = '\n'.join(build_section(t, c) for t, c in sections)

    return f'''<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>{title} — {quarter}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
    body {{ margin: 0; padding: 0; background-color: {BG}; }}
    img {{ border: 0; outline: none; text-decoration: none; }}
    @media only screen and (max-width: 620px) {{
      .email-container {{ width: 100% !important; }}
      .section-pad {{ padding-left: 20px !important; padding-right: 20px !important; }}
    }}
  </style>
</head>
<body style="margin:0;padding:0;background-color:{BG};">

<table width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background-color:{BG};">
<tr>
<td align="center" style="padding:24px 12px 48px;">

  <!-- Email container — max 600px wide -->
  <table class="email-container" width="600" cellpadding="0" cellspacing="0"
         border="0" style="max-width:600px;width:100%;background:{WHITE};">

    <!-- ── HEADER ─────────────────────────────────────────────────────── -->
    <tr>
      <td style="background:{NAVY};padding:32px 36px;text-align:center;">
        {logo_html}
        <p style="color:#AECBE6;font-family:Arial,sans-serif;font-size:10px;
                  letter-spacing:3px;text-transform:uppercase;margin:0 0 10px;">
          IMDI INTERNATIONAL
        </p>
        <h1 style="color:{WHITE};font-family:Georgia,'Times New Roman',serif;
                   font-size:24px;font-weight:normal;margin:0 0 10px;letter-spacing:0.5px;">
          {title}
        </h1>
        <p style="color:{GOLD};font-family:Arial,sans-serif;font-size:13px;
                  font-weight:bold;margin:0;letter-spacing:1px;">
          {quarter}
        </p>
      </td>
    </tr>

    {hero_html}

    <!-- ── CONTENT SECTIONS ───────────────────────────────────────────── -->
    {all_sections_html}

    <!-- ── DONATE CALL TO ACTION ──────────────────────────────────────── -->
    <tr>
      <td style="background:{LIGHT};padding:30px 36px;text-align:center;
                 border-top:2px solid {BORDER};">
        <p style="color:{NAVY};font-family:Georgia,serif;font-size:16px;
                  font-weight:bold;margin:0 0 18px;">
          Partner With Us in the Mission
        </p>
        <a href="{donate_url}"
           style="display:inline-block;background:{GOLD};color:{WHITE};
                  font-family:Arial,sans-serif;font-size:13px;font-weight:bold;
                  padding:14px 38px;text-decoration:none;letter-spacing:1px;
                  border-radius:3px;text-transform:uppercase;">
          Give Now
        </a>
      </td>
    </tr>

    <!-- ── FOOTER ─────────────────────────────────────────────────────── -->
    <tr>
      <td style="background:{NAVY};padding:24px 36px;text-align:center;">
        <p style="color:#AECBE6;font-family:Arial,sans-serif;font-size:12px;
                  margin:0 0 8px;">
          IMDI International &nbsp;·&nbsp; imdinternational.org
        </p>
        <p style="color:#7A9DBF;font-family:Arial,sans-serif;font-size:11px;
                  line-height:1.7;margin:0;">
          You received this because you subscribed to our newsletter.<br />
          <a href="*|UNSUB|*"
             style="color:{GOLD};text-decoration:none;">Unsubscribe</a>
          &nbsp;·&nbsp;
          <a href="*|UPDATE_PROFILE|*"
             style="color:{GOLD};text-decoration:none;">Update Preferences</a>
        </p>
      </td>
    </tr>

  </table>
  <!-- End email container -->

</td>
</tr>
</table>

</body>
</html>'''


def main():
    if len(sys.argv) < 2:
        print("Usage: python build_email.py <path/to/content.md>")
        sys.exit(1)

    content_path = Path(sys.argv[1])
    if not content_path.exists():
        print(f"Error: File not found — {content_path}")
        sys.exit(1)

    print(f"Building email from: {content_path}")

    raw_text       = content_path.read_text(encoding='utf-8')
    meta, body     = parse_frontmatter(raw_text)
    sections       = split_into_sections(body)
    email_html     = build_full_email(meta, sections)
    output_path    = content_path.parent / 'email.html'

    output_path.write_text(email_html, encoding='utf-8')

    section_titles = [t for t, _ in sections if t]
    print(f"Done! Email saved to: {output_path}")
    print(f"Sections: {', '.join(section_titles) if section_titles else '(intro only)'}")


if __name__ == '__main__':
    main()
