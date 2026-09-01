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

from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
STUDIO = HERE.parent
DESIGN = Path('/Users/nicolatracey/LUMAS ART Dropbox/Grafik/01_Gestaltung/02_Web/'
              '1_LUMAS/07_Website/Landingpages/2026/08-2026/ART DROP RNE')

# (folder, source name, output name, max width[, sharpen])
# `sharpen` is an UnsharpMask (radius, percent, threshold). It is used only where
# the image is shown at or above its native pixel size: the hero master is
# 1535px on a full-bleed canvas and the buy-box shot is 864px in a ~700px
# column, so both are resampled up and read soft. It cannot add detail that is
# not there — a larger master is still the real fix, see the README.
COPIES = [
    # --- hero: the only full-bleed image ------------------------------------
    # Chosen by geometry, not taste. The lockup sits lower-left and is ~365px
    # wide at 1024, so it collides with any composition whose subject starts
    # before ~40% of the frame width. Every render in the second delivery is
    # 16:9 with the object at 31-37%, and at desktop widths a tall hero crops
    # those horizontally, magnifying the object further into the corner. This
    # 3:2 salon shot has the sculpture at 47.8%, which clears at every width.
    (STUDIO, 'room2 (1).png', 'hero-room-paris.jpg', 1535, (1.2, 115, 3)),

    # --- the work isolated, and the craft details --------------------------
    (STUDIO, 'DSC_4439_cleaned.png',     'detail-surface.jpg', 1200),
    (STUDIO, 'DSC_4441-clean.png',       'detail-base.jpg',    1200),
    (DESIGN, 'Screenshot 2026-08-26 at 10.04.40 1.jpg',
                                         'detail-edition.jpg', 1600),

    # --- the artist --------------------------------------------------------
    (DESIGN, 'RNE_Portrait_1.jpg', 'artist-portrait.jpg', 1600),

    # --- rooms, in carousel order -----------------------------------------
    # Only three. Six renders were cut for deformed geometry, and two more for
    # the base: RNE_img_03 renders it in pale blond oak (measured rgb 180,156,131
    # against the real smoked oak at 111,86,70) and RNE_img_01 renders it
    # two-tone with one near-white face. The three below all measure within
    # range of the reference base.
    (DESIGN, 'room1 1.jpg',    'room-01-plinth.jpg',    1920),
    (DESIGN, 'RNE_img_04.jpg', 'room-02-sideboard.jpg', 1920),
    (DESIGN, 'RNE_img_10.jpg', 'room-03-garden.jpg',    1920),
]

# The isolated studio shot, cropped to the object. The master is 3:2 with the
# sculpture occupying only the middle 47% of the width, which left the work
# looking small between two wide grey margins. Measured object box is
# x[366,1086] y[67,983] of 1536x1024; this crop is that box plus 10% padding,
# full height. Keep CROP_WORK and .work-block__art's aspect-ratio in step.
CROP_WORK = (STUDIO, 'DSC_4411-reflections.png', 'work-studio.jpg',
             294, 0, 1158, 1024, (1.0, 95, 3))

# 3:4 crop of the hero master. Left edge as a FRACTION of the source width, so
# it survives the master being re-exported at a different size. 0.365 keeps the
# sculpture, its plinth and the framed background picture in frame.
PORTRAIT = (STUDIO, 'room2 (1).png', 'hero-room-portrait.jpg', 0.365, 1024, (1.2, 115, 3))

# Retired by later deliveries or by the decisions above, removed so publish.py
# cannot ship an orphan.
RETIRED = ['hero-room-plinth.jpg', 'hero-room-sideboard.jpg', 'room-living.jpg',
           'room-villa.jpg', 'detail-seam.jpg',
           'room-01-newyork.jpg', 'room-02-newyork.jpg', 'room-02-reflection.jpg',
           'room-03-reflection.jpg', 'room-03-salon.jpg', 'room-04-salon.jpg',
           'room-04-walnut.jpg', 'room-05-garden.jpg', 'room-05-sideboard.jpg',
           'room-05-walnut.jpg', 'room-06-garden.jpg', 'room-06-highrise.jpg',
           'room-06-walnut.jpg', 'room-07-garden.jpg', 'room-07-highrise.jpg',
           'room-07-loft.jpg', 'room-08-concrete.jpg', 'room-08-highrise.jpg',
           'room-08-loft.jpg', 'room-09-concrete.jpg', 'room-09-loft.jpg',
           'room-09-sideboard.jpg', 'room-10-concrete.jpg', 'room-10-mediterran.jpg',
           'room-11-mediterran.jpg']

QUALITY = 88   # working copy stays generous; publish.py caps and re-encodes


def save(im, out, cap, sharpen=None):
    if im.width > cap:
        im = im.resize((cap, round(im.height * cap / im.width)), Image.LANCZOS)
    if sharpen:
        radius, percent, threshold = sharpen
        im = im.filter(ImageFilter.UnsharpMask(radius=radius, percent=percent,
                                               threshold=threshold))
    im.save(HERE / out, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
    kb = (HERE / out).stat().st_size // 1024
    print(f'  {out:26} {im.width}x{im.height}  {kb}KB')


def main():
    missing = [f'{e[0].name}/{e[1]}' for e in COPIES if not (e[0] / e[1]).exists()]
    if missing:
        sys.exit(f'masters not found: {missing}')

    print(f'studio masters: {STUDIO}')
    print(f'design masters: {DESIGN}\n')
    for entry in COPIES:
        folder, name, out, cap = entry[:4]
        sharpen = entry[4] if len(entry) > 4 else None
        save(Image.open(folder / name).convert('RGB'), out, cap, sharpen)

    folder, name, out, x0, y0, x1, y1, sharpen = CROP_WORK
    im = Image.open(folder / name).convert('RGB')
    save(im.crop((x0, y0, x1, y1)), out, x1 - x0, sharpen)
    print(f'  {"":26} -> .work-block__art aspect-ratio:{x1 - x0}/{y1 - y0}')

    folder, name, out, left_frac, height, sharpen = PORTRAIT
    im = Image.open(folder / name).convert('RGB')
    crop_h = min(height, im.height)
    crop_w = round(crop_h * 3 / 4)
    left = round(im.width * left_frac)
    if left + crop_w > im.width:
        sys.exit(f'{name}: 3:4 crop at x={left} does not fit {im.size}')
    # take the crop at full master resolution, then scale to `height`
    scale = im.height / crop_h
    box = (left, 0, left + round(crop_w * scale), im.height)
    save(im.crop(box).resize((crop_w, crop_h), Image.LANCZOS), out, crop_w, sharpen)

    for old in RETIRED:
        p = HERE / old
        if p.exists():
            p.unlink()
            print(f'  removed retired {old}')


main()
