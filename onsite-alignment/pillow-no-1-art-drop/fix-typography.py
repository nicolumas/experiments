#!/usr/bin/env python3
"""Bind line breaks so no line orphans a short word and no paragraph widows.

    python3 fix-typography.py [file.html ...]      # defaults to both builds

House rule: a line must not end on an article, preposition or conjunction, and
a paragraph must not end with a single word on its own line. `text-wrap: pretty`
helps with the second and does nothing for the first, so the binding is done
here, at build time, with real non-breaking spaces.

Three rules, in order:

  1  UNITS  numbers keep their unit and their multiplication signs:
     44 × 44 × 15 cm, 185 °C, 1.950 €, 15,5 × 15,5 × 4 cm
  2  SHORT  a short function word is bound to the word after it, so it cannot
     be left dangling at the end of a line
  3  WIDOW  the last two words of a sentence-length run are bound together

Every bound run is capped at RUN_CAP characters. That cap is the whole reason
this is safe: an unbounded run can be wider than a 320px column, which turns a
typographic fix into a horizontal scrollbar. audit.js measures the rendered line
boxes afterwards and fails on any remaining offender, so this script does not
have to be clever, only conservative.

Idempotent: existing non-breaking spaces are normalised to plain spaces first,
so re-running never compounds.
"""
import pathlib
import re
import sys

NB = ' '
RUN_CAP = 18          # characters, including the joins

# Short function words that must not end a line. German first, then the English
# ones the generated review copy needs.
SHORT = {
    'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem',
    'einer', 'und', 'oder', 'mit', 'von', 'vom', 'zum', 'zur', 'aus', 'auf',
    'bei', 'im', 'am', 'in', 'an', 'ist', 'als', 'wie', 'nur', 'bis', 'für',
    'ohne', 'über', 'unter', 'vor', 'nach', 'seit', 'sich', 'wird', 'sind',
    'dabei', 'jedes', 'jeder', 'jede', 'keine', 'kein', 'zwei', 'drei',
    'the', 'a', 'an', 'and', 'or', 'of', 'to', 'on', 'at', 'is', 'as', 'for',
    'by', 'with', 'from', 'no', 'its', 'it', 'that', 'only', 'until', 'after',
    'every', 'each', 'one', 'two', 'three', 'so', 'and',
}

# Rule 1: unit and figure groups, applied as plain regex substitutions.
UNIT_RULES = [
    (re.compile(r'(\d)\s+(×)\s+(\d)'), r'\1' + NB + r'\2' + NB + r'\3'),
    # two rules, not one: \b after "€" or "%" can never match, because the
    # character before the boundary is already non-word. That silently dropped
    # the binding in "1.950 €" on the first run.
    (re.compile(r'(\d)\s+(cm|mm|kg)\b'), r'\1' + NB + r'\2'),
    (re.compile(r'(\d)\s+(°C|€|%)'), r'\1' + NB + r'\2'),
    (re.compile(r'\b(No\.)\s+(\d)'), r'\1' + NB + r'\2'),
]

SKIP_BLOCKS = re.compile(r'<(script|style)\b.*?</\1>', re.S | re.I)
COMMENTS = re.compile(r'<!--.*?-->', re.S)


def bind_words(text):
    """Apply the SHORT and WIDOW rules to one run of visible text."""
    # keep leading/trailing whitespace exactly as found
    lead = text[:len(text) - len(text.lstrip())]
    trail = text[len(text.rstrip()):]
    core = text.strip()
    if not core or len(core) < 12:
        return text

    # split on single spaces only; anything else stays untouched
    parts = core.split(' ')
    if len(parts) < 2:
        return text

    out = [parts[0]]
    for word in parts[1:]:
        prev = out[-1]
        tail = prev.split(NB)[-1]
        clean = re.sub(r'[^\wÄÖÜäöüß]+$', '', tail).lower()
        run_len = len(prev.split(' ')[-1]) + 1 + len(word)
        if clean in SHORT and run_len <= RUN_CAP:
            out[-1] = prev + NB + word          # rule 2
        else:
            out.append(word)

    # rule 3: never leave the last word alone on its own line
    if len(out) >= 2:
        joined_len = len(out[-2].split(' ')[-1]) + 1 + len(out[-1])
        if joined_len <= RUN_CAP:
            out[-2] = out[-2] + NB + out[-1]
            out.pop()

    return lead + ' '.join(out) + trail


def process(html):
    html = html.replace(NB, ' ')                 # idempotency

    # protect script and style bodies from every rule
    shields = []

    def shield(m):
        shields.append(m.group(0))
        return f'\x00{len(shields) - 1}\x00'

    html = SKIP_BLOCKS.sub(shield, html)
    html = COMMENTS.sub(shield, html)

    def fix_run(m):
        return '>' + bind_words(m.group(1)) + '<'

    # only visible text between tags; attributes are never touched, because a
    # non-breaking space inside alt or aria-label is read out as a character
    html = re.sub(r'>([^<>]+)<', fix_run, html)

    for rx, rep in UNIT_RULES:
        html = rx.sub(rep, html)

    for i, block in enumerate(shields):
        html = html.replace(f'\x00{i}\x00', block)
    return html


def main():
    targets = [pathlib.Path(a) for a in sys.argv[1:]] or [
        pathlib.Path(__file__).with_name('pillow-art-drop.html'),
        pathlib.Path(__file__).with_name('pillow-art-drop-en.html'),
    ]
    for path in targets:
        if not path.exists():
            print(f'  skipped {path.name} (not found)')
            continue
        before = path.read_text(encoding='utf-8')
        after = process(before)
        path.write_text(after, encoding='utf-8')
        print(f'  {path.name}: {after.count(NB)} bound spaces '
              f'({"changed" if after != before else "unchanged"})')


main()
