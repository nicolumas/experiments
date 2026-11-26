#!/usr/bin/env python3
"""Derive the image set for the Penguins in Japan art drop.

Two kinds of asset:

1. The ARTWORK, which is real. It is pulled from the LUMAS image server at its
   largest published rendition (`showimg_rja63_full.jpg`, 1600x1200) and written
   out unchanged in geometry. It is never cropped, never sharpened, never
   letterboxed onto a ground.

2. PLACEHOLDERS for everything the studio has not delivered yet: the hero room
   (landscape + portrait), five room slides, three craft details and the artist
   portrait (two crops). These are flat bone panels carrying the slot name and
   the exact pixel size the real asset should arrive at. They exist so the page
   measures correctly -- fold, overflow, contrast and carousel geometry are all
   real numbers even before the photography lands.

   They are deliberately ugly-honest rather than a stock photo: nobody can
   mistake one for a finished asset, and `audit.js` asserts exactly this set.

Run:  python3 prepare-assets.py
"""

import io
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent

# ---------------------------------------------------------------- the artwork
ARTWORK_URL = 'https://img.lumas.com/showimg_rja63_full.jpg'
ARTWORK_OUT = 'work-penguins.jpg'

# ------------------------------------------------------------- placeholder set
# (filename, width, height, label, dark)
# Widths are what the published page wants at 2x for its largest rendered box;
# publish.py caps to the same numbers.
#
# The two hero panels are DARK on purpose. The hero lockup is light type over a
# measured scrim, so a bone panel there would render the review copy as white on
# cream and read as a broken page rather than as a missing asset. A mid-charcoal
# panel keeps the lockup legible while the real room is outstanding. It is NOT a
# claim about how dark the real room will be -- the hero contrast and the scrim
# are unverified until the photograph lands and check-hero-scrim.py runs on it.
PLACEHOLDERS = [
    ('hero-room.jpg',           1920, 1080, 'HERO · RAUM MIT WERK · 16:9', True),
    ('hero-room-portrait.jpg',  1152, 1536, 'HERO MOBIL · RAUM MIT WERK · 3:4', True),
    ('room-01.jpg',             1800, 1200, 'RAUM 1 · 3:2'),
    ('room-02.jpg',             1800, 1200, 'RAUM 2 · 3:2'),
    ('room-03.jpg',             1800, 1200, 'RAUM 3 · 3:2'),
    ('room-04.jpg',             1800, 1200, 'RAUM 4 · 3:2'),
    ('room-05.jpg',             1800, 1200, 'RAUM 5 · 3:2'),
    ('detail-acrylic.jpg',      1200,  800, 'DETAIL · ACRYLGLASKANTE · 3:2'),
    ('detail-signature.jpg',    1200,  800, 'DETAIL · SIGNATUR UND NUMMER · 3:2'),
    ('detail-edge.jpg',         1200,  800, 'DETAIL · RAHMENLOSE KANTE · 3:2'),
    ('artist-portrait.jpg',     1600, 1200, 'PORTRÄT · ROBERT JAHNS · 4:3'),
    ('artist-portrait-tall.jpg', 1100, 1650, 'PORTRÄT · ROBERT JAHNS · 2:3'),
]

BONE = (244, 237, 226)
CHARCOAL = (28, 26, 24)
HAIRLINE = (199, 195, 190)
DARK = (58, 55, 51)
DARK_RULE = (72, 68, 63)
DARK_HAIRLINE = (96, 92, 86)

FONT_CANDIDATES = [
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/System/Library/Fonts/Helvetica.ttc',
    '/Library/Fonts/Arial.ttf',
]


def load_font(size):
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def fetch_artwork():
    req = urllib.request.Request(ARTWORK_URL, headers={'User-Agent': 'art-drop-build'})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    im = Image.open(io.BytesIO(data)).convert('RGB')
    out = HERE / ARTWORK_OUT
    im.save(out, 'JPEG', quality=92, subsampling=0, optimize=True)
    print(f'  {ARTWORK_OUT:28s} {im.width}x{im.height}  ratio {im.width / im.height:.3f}  '
          f'{out.stat().st_size // 1024} KB   (real artwork, uncropped)')
    return im.size


def draw_placeholder(name, w, h, label, dark=False):
    ground = DARK if dark else BONE
    ink = BONE if dark else CHARCOAL
    sub = HAIRLINE if dark else (90, 87, 82)
    rule = DARK_RULE if dark else (236, 228, 215)
    edge = DARK_HAIRLINE if dark else HAIRLINE

    im = Image.new('RGB', (w, h), ground)
    d = ImageDraw.Draw(im)

    inset = max(10, round(min(w, h) * 0.025))
    d.rectangle([inset, inset, w - inset - 1, h - inset - 1], outline=edge, width=2)

    # A sparse diagonal rule, enough to read as "not a photograph" at a glance
    # without turning the box into a pattern that fights the page.
    step = max(60, round(min(w, h) / 10))
    for x in range(-h, w, step):
        d.line([(x, h - inset), (x + h, inset)], fill=rule, width=1)

    size = max(18, round(min(w, h) * 0.045))
    font = load_font(size)
    small = load_font(max(13, round(size * 0.62)))

    dims = f'{w} x {h} px'
    lb = d.textbbox((0, 0), label, font=font)
    db = d.textbbox((0, 0), dims, font=small)
    gap = round(size * 0.7)
    total = (lb[3] - lb[1]) + gap + (db[3] - db[1])
    y = (h - total) / 2

    d.text(((w - (lb[2] - lb[0])) / 2 - lb[0], y - lb[1]), label, font=font, fill=ink)
    d.text(((w - (db[2] - db[0])) / 2 - db[0], y + (lb[3] - lb[1]) + gap - db[1]),
           dims, font=small, fill=sub)

    out = HERE / name
    im.save(out, 'JPEG', quality=80, optimize=True)
    print(f'  {name:28s} {w}x{h}  ratio {w / h:.3f}  {out.stat().st_size // 1024} KB   '
          f'PLACEHOLDER{" (dark, for the hero lockup)" if dark else ""}')


def main():
    print('Artwork')
    try:
        fetch_artwork()
    except Exception as exc:                                  # noqa: BLE001
        sys.exit(f'could not fetch {ARTWORK_URL}: {exc}')

    print('\nPlaceholders (replace every one of these before launch)')
    for entry in PLACEHOLDERS:
        draw_placeholder(*entry)

    produced = {ARTWORK_OUT} | {p[0] for p in PLACEHOLDERS}
    print(f'\n{len(produced)} files written to {HERE}')
    print('Placeholders: ' + ', '.join(sorted(p[0] for p in PLACEHOLDERS)))


if __name__ == '__main__':
    main()
