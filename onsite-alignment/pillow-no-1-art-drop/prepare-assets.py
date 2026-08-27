#!/usr/bin/env python3
"""Derive the page's image set from the supplied studio PNGs.

    python3 prepare-assets.py

Reads the masters from ../ (the "art drop" folder the studio delivered) and
writes JPEGs into this folder. Re-runnable: it overwrites its own output and
never touches the masters.

Two things worth knowing:

  * The masters are only ~1535px wide. That is below what a full-bleed desktop
    hero wants on a 2x display (~2880px). Nothing here can invent detail, so
    the hero ships at native width and the README asks for a larger master.
  * No portrait room render was supplied. `hero-room-portrait.jpg` is a 3:4
    crop derived from the landscape Paris shot, framed so the sculpture sits
    right of centre and the lower left stays clear for the type plate. It is a
    stand-in: a real portrait render should replace it.
"""
import sys
from pathlib import Path

from PIL import Image

SRC = Path(__file__).resolve().parent.parent
DST = Path(__file__).resolve().parent

# name in ../  ->  (output name, max width, description)
COPIES = [
    ('room2 (1).png',           'hero-room-paris.jpg',   1535),
    ('room1.png',               'room-living.jpg',       1440),
    ('room3 (1).png',           'room-villa.jpg',        1440),
    ('DSC_4411-reflections.png', 'work-studio.jpg',      1440),
    ('DSC_4439_cleaned.png',    'detail-surface.jpg',    1200),
    ('DSC_4441-clean.png',      'detail-base.jpg',       1200),
    ('DSC_4417-clean.png',      'detail-seam.jpg',       1200),
]

# 3:4 crop of the Paris shot. Left edge in source pixels; the sculpture spans
# roughly x 734-1194, so 560 puts it right of centre with floor space at the
# lower left where the type plate sits.
PORTRAIT = ('room2 (1).png', 'hero-room-portrait.jpg', 560, 1024)

QUALITY = 88   # working copy stays generous; publish.py re-encodes at 70


def save(im, out, cap):
    if im.width > cap:
        im = im.resize((cap, round(im.height * cap / im.width)), Image.LANCZOS)
    im.save(DST / out, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
    kb = (DST / out).stat().st_size // 1024
    print(f'  {out:26} {im.width}x{im.height}  {kb}KB')


def main():
    missing = [n for n, *_ in COPIES if not (SRC / n).exists()]
    if missing:
        sys.exit(f'masters not found in {SRC}: {missing}')

    print(f'masters: {SRC}')
    for name, out, cap in COPIES:
        save(Image.open(SRC / name).convert('RGB'), out, cap)

    name, out, left, height = PORTRAIT
    im = Image.open(SRC / name).convert('RGB')
    width = round(height * 3 / 4)
    if left + width > im.width:
        sys.exit(f'{name}: 3:4 crop at x={left} does not fit {im.size}')
    save(im.crop((left, 0, left + width, height)), out, 1024)


main()
