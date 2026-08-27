#!/usr/bin/env python3
"""
Add the shared "Art by room" hero + furniture layer to a room landing page.

    python3 _room-lp/inline.py --into onsite-alignment/kitchen-art/index.html
    python3 _room-lp/inline.py --into <page> --inline    # embed, one portable file

Without --inline the page references this folder by relative path, which keeps
the file small while you work but only renders when served.

Re-running is safe: the injected regions are fenced with LUMAS-ROOM-LP markers
and replaced in place, so upgrading a page to a newer kit is the same command
again. The stylesheet is injected immediately before </head> so it loads after
the page's own styles and wins at equal specificity — that is the whole point,
do not move it earlier.

The hero markup itself is NOT injected. It is page content (its own image,
headline, lede, CTAs and credit) and lives in the page between
LUMAS-ROOM-LP:HERO markers, authored by hand against the classes in
room-lp.css.
"""
import argparse, os, re, sys

KIT = os.path.dirname(os.path.abspath(__file__))
CSS = ('room-lp.css',)
JS = ('room-lp.js',)

BEGIN, END = '<!-- LUMAS-ROOM-LP:{}:BEGIN -->', '<!-- LUMAS-ROOM-LP:{}:END -->'


def fence(name, body):
    return f'{BEGIN.format(name)}\n{body}\n{END.format(name)}'


def strip(html, name):
    return re.sub(re.escape(BEGIN.format(name)) + r'.*?' + re.escape(END.format(name)),
                  '', html, flags=re.S)


def read(name):
    with open(os.path.join(KIT, name), encoding='utf-8') as fh:
        return fh.read()


def build(target, embed):
    rel = os.path.relpath(KIT, os.path.dirname(os.path.abspath(target)))
    if embed:
        head = '\n'.join(f'<style>/* {c} */\n{read(c)}</style>' for c in CSS)
        script = '\n'.join(f'<script>\n{read(j)}</script>' for j in JS)
    else:
        head = '\n'.join(f'<link rel="stylesheet" href="{rel}/{c}" />' for c in CSS)
        script = '\n'.join(f'<script src="{rel}/{j}"></script>' for j in JS)
    return head, script


def inject(html, target, embed):
    head, script = build(target, embed)
    for n in ('CSS', 'JS'):
        html = strip(html, n)
    if '</head>' not in html or '</body>' not in html:
        sys.exit('target needs both </head> and </body>')
    html = html.replace('</head>', fence('CSS', head) + '\n</head>', 1)
    html = html.replace('</body>', fence('JS', script) + '\n</body>', 1)
    return re.sub(r'\n{3,}', '\n\n', html)


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--into', metavar='FILE', required=True, help='the page to update')
    p.add_argument('--inline', action='store_true', help='embed the assets (portable)')
    a = p.parse_args()

    with open(a.into, encoding='utf-8') as fh:
        html = fh.read()
    out = inject(html, a.into, a.inline)
    with open(a.into, 'w', encoding='utf-8') as fh:
        fh.write(out)
    print(f'{a.into}: room-lp {"embedded" if a.inline else "linked"} '
          f'({os.path.getsize(a.into)/1024:.0f} KB)')


if __name__ == '__main__':
    main()
