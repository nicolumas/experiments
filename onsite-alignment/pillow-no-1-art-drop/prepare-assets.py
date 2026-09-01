#!/usr/bin/env python3
"""Derive the page's image set from the delivered masters.

    python3 prepare-assets.py

Two source folders, because the assets arrived in two batches:

  STUDIO  ../                      the first delivery: the object on a plain
                                   ground and three macro details, 1535px PNGs
  DESIGN  .../ART DROP RNE/        the second delivery: ten room renders at
                                   2752-3072px, the artist portrait, and the
                                   studio shot of four Pillows side by side

Both are plain RGB with no embedded ICC profile, so a straight convert is safe
here. That is worth re-checking on any new delivery: design-team files are often
CMYK with a heavy profile, and converting those without colour management
shifts the colours visibly.

Re-runnable: it overwrites its own output and never touches the masters.

No portrait room render was delivered. `hero-room-portrait.jpg` is a 3:4 crop of
the landscape hero master. It is a stand-in; a real portrait render should
replace it, and `check-hero-scrim.py` has to be re-run when it does, because the
scrim is tuned to these exact pixels.
"""
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
STUDIO = HERE.parent
DESIGN = Path('/Users/nicolatracey/LUMAS ART Dropbox/Grafik/01_Gestaltung/02_Web/'
              '1_LUMAS/07_Website/Landingpages/2026/08-2026/ART DROP RNE')

# (folder, source name, output name, max width)
COPIES = [
    # --- hero: the only full-bleed image ------------------------------------
    # Chosen by geometry, not taste. The lockup sits lower-left and is ~365px
    # wide at 1024, so it collides with any composition whose subject starts
    # before ~40% of the frame width. Every render in the second delivery is
    # 16:9 with the object at 31-37%, and at desktop widths a 92vh hero crops
    # those horizontally, magnifying the object further into the corner. This
    # 3:2 salon shot has the sculpture at 47.8%, which clears at every width.
    # Its cost is resolution: 1535px, where the second delivery offers 2752px.
    (STUDIO, 'room2 (1).png', 'hero-room-paris.jpg', 1535),

    # --- the work isolated, and the craft details --------------------------
    (STUDIO, 'DSC_4439_cleaned.png',     'detail-surface.jpg', 1200),
    (STUDIO, 'DSC_4441-clean.png',       'detail-base.jpg',    1200),
    (DESIGN, 'Screenshot 2026-08-26 at 10.04.40 1.jpg',
                                         'detail-edition.jpg', 1600),

    # --- the artist --------------------------------------------------------
    (DESIGN, 'RNE_Portrait_1.jpg', 'artist-portrait.jpg', 1600),

    # --- rooms, in carousel order -----------------------------------------
    (DESIGN, 'room1 1.jpg',    'room-01-plinth.jpg',     1920),
    (DESIGN, 'RNE_img_03.jpg', 'room-02-newyork.jpg',    1920),
    (DESIGN, 'RNE_img_07.jpg', 'room-03-reflection.jpg', 1920),
    (DESIGN, 'RNE_img_05.jpg', 'room-04-salon.jpg',      1920),
    (DESIGN, 'RNE_img_04.jpg', 'room-05-sideboard.jpg',  1920),
    (DESIGN, 'RNE_img_02.jpg', 'room-06-walnut.jpg',     1920),
    (DESIGN, 'RNE_img_10.jpg', 'room-07-garden.jpg',     1920),
    (DESIGN, 'RNE_img_08.jpg', 'room-08-highrise.jpg',   1920),
    (DESIGN, 'RNE_img_06.jpg', 'room-09-loft.jpg',       1920),
    (DESIGN, 'RNE_img_01.jpg', 'room-10-concrete.jpg',   1920),
    (STUDIO, 'room3 (1).png',  'room-11-mediterran.jpg', 1440),
]

# The isolated studio shot, cropped to the object. The master is 3:2 with the
# sculpture occupying only the middle 47% of the width, which left the work
# looking small between two wide grey margins. Measured object box is
# x[366,1086] y[67,983] of 1536x1024; this crop is that box plus 10% padding,
# full height. Keep CROP_WORK and .work-block__art's aspect-ratio in step.
CROP_WORK = (STUDIO, 'DSC_4411-reflections.png', 'work-studio.jpg', 294, 0, 1158, 1024)

# 3:4 crop of the hero master. Left edge as a FRACTION of the source width, so
# it survives the master being re-exported at a different size. 0.365 keeps the
# sculpture, its plinth and the framed background picture in frame.
PORTRAIT = (STUDIO, 'room2 (1).png', 'hero-room-portrait.jpg', 0.365, 1024)

# Retired by later deliveries or by the hero decision above, removed so
# publish.py cannot ship an orphan.
RETIRED = ['hero-room-plinth.jpg', 'hero-room-sideboard.jpg', 'room-living.jpg',
           'room-villa.jpg', 'detail-seam.jpg',
           'room-01-newyork.jpg', 'room-02-reflection.jpg', 'room-03-salon.jpg',
           'room-04-walnut.jpg', 'room-05-garden.jpg', 'room-06-highrise.jpg',
           'room-07-loft.jpg', 'room-08-concrete.jpg', 'room-09-sideboard.jpg',
           'room-10-mediterran.jpg']

QUALITY = 88   # working copy stays generous; publish.py caps and re-encodes


def save(im, out, cap):
    if im.width > cap:
        im = im.resize((cap, round(im.height * cap / im.width)), Image.LANCZOS)
    im.save(HERE / out, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
    kb = (HERE / out).stat().st_size // 1024
    print(f'  {out:26} {im.width}x{im.height}  {kb}KB')


def main():
    missing = [f'{folder.name}/{name}' for folder, name, *_ in COPIES
               if not (folder / name).exists()]
    if missing:
        sys.exit(f'masters not found: {missing}')

    print(f'studio masters: {STUDIO}')
    print(f'design masters: {DESIGN}\n')
    for folder, name, out, cap in COPIES:
        save(Image.open(folder / name).convert('RGB'), out, cap)

    folder, name, out, x0, y0, x1, y1 = CROP_WORK
    im = Image.open(folder / name).convert('RGB')
    save(im.crop((x0, y0, x1, y1)), out, x1 - x0)
    print(f'  {"":26} -> .work-block__art aspect-ratio:{x1 - x0}/{y1 - y0}')

    folder, name, out, left_frac, height = PORTRAIT
    im = Image.open(folder / name).convert('RGB')
    crop_h = min(height, im.height)
    crop_w = round(crop_h * 3 / 4)
    left = round(im.width * left_frac)
    if left + crop_w > im.width:
        sys.exit(f'{name}: 3:4 crop at x={left} does not fit {im.size}')
    # take the crop at full master resolution, then scale to `height`
    scale = im.height / crop_h
    box = (left, 0, left + round(crop_w * scale), im.height)
    save(im.crop(box).resize((crop_w, crop_h), Image.LANCZOS), out, crop_w)

    for old in RETIRED:
        p = HERE / old
        if p.exists():
            p.unlink()
            print(f'  removed retired {old}')


main()
