#!/usr/bin/env python3
"""
Add the LUMAS navigation to a prototype page.

    python3 _nav/inline.py DE --into prototype/my-page.html      # link to the kit files
    python3 _nav/inline.py DE --into prototype/my-page.html --inline
    python3 _nav/inline.py DE --new prototype/my-page.html       # start a page from scratch

--inline embeds every asset so the result is one portable file (adds ~590 KB, most of it the
webfonts). Without it the page references the kit by relative path, which keeps the file small
while you work but only renders when served (the prototype server on :8941, not file://).

Re-running is safe: the injected regions are fenced with LUMAS-NAV-KIT markers and replaced in
place, so upgrading a page to a newer kit is the same command again.
"""
import argparse, os, re, sys

KIT = os.path.dirname(os.path.abspath(__file__))
MARKETS = ('US', 'DE', 'AT', 'UK')
# order is load order: fonts, then the live stylesheet, then the widget css, then the
# bridge layer, which has to come last to win against nav-core.css
CSS = ('nav-fonts.css', 'nav-utile-display.css', 'nav-core.css', 'nav-widgets.css',
       'nav-standalone.css')

BEGIN, END = '<!-- LUMAS-NAV-KIT:{}:BEGIN -->', '<!-- LUMAS-NAV-KIT:{}:END -->'

SKELETON = """<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>{title}</title>
<style>
  /* The nav is fixed; keep page content clear of it. nav.js does not set --nav-h, so read the
     header's height if you need it exactly (see nav-standalone.css). */
  body{{margin:0;font-size:1.6rem;font-family:archivo,system-ui,sans-serif;
    background:var(--color-surface-page,#fff);color:var(--color-text-primary,#1c1a18)}}
  main{{padding:12rem 2.4rem 6rem;max-width:120rem;margin:0 auto}}
</style>
</head>
<body>
<main>
  <h1>Page content</h1>
</main>
</body>
</html>
"""
LANG = {'US': 'en-US', 'UK': 'en-GB', 'DE': 'de-DE', 'AT': 'de-AT'}


def fence(name, body):
    return f'{BEGIN.format(name)}\n{body}\n{END.format(name)}'


def strip(html, name):
    return re.sub(re.escape(BEGIN.format(name)) + r'.*?' + re.escape(END.format(name)),
                  '', html, flags=re.S)


def read(name):
    with open(os.path.join(KIT, name), encoding='utf-8') as fh:
        return fh.read()


def build(market, target, embed):
    rel = os.path.relpath(KIT, os.path.dirname(os.path.abspath(target)))
    if embed:
        head = '\n'.join(f'<style>/* {c} */\n{read(c)}</style>' for c in CSS)
        script = f'<script>\n{read("nav.js")}</script>'
    else:
        head = '\n'.join(f'<link rel="stylesheet" href="{rel}/{c}" />' for c in CSS)
        script = f'<script src="{rel}/nav.js"></script>'
    return head, read(f'nav-{market}.html'), script


def inject(html, market, target, embed):
    head, markup, script = build(market, target, embed)
    for n in ('CSS', 'MARKUP', 'JS'):
        html = strip(html, n)
    if '</head>' not in html or '</body>' not in html:
        sys.exit('target needs both </head> and </body>')
    html = html.replace('</head>', fence('CSS', head) + '\n</head>', 1)
    m = re.search(r'<body[^>]*>', html)
    html = html[:m.end()] + '\n' + fence('MARKUP', markup) + html[m.end():]
    html = html.replace('</body>', fence('JS', script) + '\n</body>', 1)
    return re.sub(r'\n{3,}', '\n\n', html)


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('market', choices=MARKETS)
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument('--into', metavar='FILE', help='add the nav to an existing page')
    g.add_argument('--new', metavar='FILE', help='create a minimal page with the nav')
    p.add_argument('--inline', action='store_true', help='embed the assets (portable, +590 KB)')
    p.add_argument('--title', default='LUMAS')
    a = p.parse_args()

    target = a.into or a.new
    if a.new:
        if os.path.exists(target):
            sys.exit(f'{target} exists — use --into to update it')
        html = SKELETON.format(lang=LANG[a.market], title=a.title)
    else:
        with open(target, encoding='utf-8') as fh:
            html = fh.read()

    out = inject(html, a.market, target, a.inline)
    with open(target, 'w', encoding='utf-8') as fh:
        fh.write(out)
    print(f'{target}: {a.market} nav {"embedded" if a.inline else "linked"} '
          f'({os.path.getsize(target)/1024:.0f} KB)')


if __name__ == '__main__':
    main()
