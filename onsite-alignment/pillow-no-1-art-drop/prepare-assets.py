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
    # Six of the eleven renders were cut for deformed geometry. RNE_img_03 and
    # RNE_img_01 are back at the client's request for retouching: their bases
    # render pale blond and two-tone respectively, against the real smoked oak.
    # check_bases() below measures every one of them against the studio
    # reference after each run, so re-running this script is also the check.
    (DESIGN, 'room1 1.jpg',    'room-01-plinth.jpg',    1920),
    (DESIGN, 'RNE_img_03.jpg', 'room-02-newyork.jpg',   1920),
    (DESIGN, 'RNE_img_04.jpg', 'room-03-sideboard.jpg', 1920),
    (DESIGN, 'RNE_img_10.jpg', 'room-04-garden.jpg',    1920),
    (DESIGN, 'RNE_img_01.jpg', 'room-05-concrete.jpg',  1920),
]

# Where the oak base sits in each render, as fractions of the frame. Eyeballed
# once and only used for the colour report below, so a loose box is fine.
BASE_PATCH = {
    'room-01-plinth.jpg':    (.44, .70, .56, .78),
    'room-02-newyork.jpg':   (.42, .72, .55, .80),
    'room-03-sideboard.jpg': (.44, .78, .58, .87),
    'room-04-garden.jpg':    (.44, .76, .57, .85),
    'room-05-concrete.jpg':  (.42, .74, .56, .83),
}
# the studio shot of the real base is the reference every render is judged against
BASE_REFERENCE = ('detail-base.jpg', (.30, .72, .62, .92))
BASE_TOLERANCE = 30       # mean per-channel distance before it is called out
# No spread threshold. A two-tone base was the other defect worth catching, but
# these sample boxes are loose enough to include the table or floor around the
# base, so the light-to-dark range says as much about the surroundings as about
# the wood: the studio reference itself scores 142 against a white marble
# surface. The number is printed for information and judged by eye.

# The isolated studio shot, cropped to the object. The master is 3:2 with the
# sculpture occupying only the middle 47% of the width, which left the work
# looking small between two wide grey margins. Measured object box is
# x[366,1086] y[67,983] of 1536x1024; this crop is that box plus 10% padding,
# full height. Keep CROP_WORK and .work-block__art's aspect-ratio in step.
CROP_WORK = (STUDIO, 'DSC_4411-reflections.png', 'work-studio.jpg',
             294, 0, 1158, 1024, (1.0, 95, 3))

# Tall crops taken from a landscape master. The left edge is a FRACTION of the
# source width, so each one survives its master being re-exported at a
# different size, and the crop uses the master's full height.
# (folder, source, output, ratio w/h, left fraction, output height[, sharpen])
TALL_CROPS = [
    # Hero, <=767px only. 0.365 keeps the sculpture, its plinth and the framed
    # background picture in frame.
    (STUDIO, 'room2 (1).png', 'hero-room-portrait.jpg', 3 / 4, 0.365, 1024,
     (1.2, 115, 3)),

    # Artist portrait for the two-column layout (>=1024px), where a 4:3 crop
    # left ~380px of empty bone under it against the text column. 2:3 makes the
    # portrait as tall as that column at 1440 and 1920. Measured on the master:
    # his head spans x 0.15-0.52, so an 0.11 left edge keeps 4% air beside it
    # and puts the larger margin, 6.5%, on the side he is looking towards.
    # 1100px wide is a true 2x for the 533px column, so it is downscaled from
    # the 1500px window and needs no sharpening.
    (DESIGN, 'RNE_Portrait_1.jpg', 'artist-portrait-tall.jpg', 2 / 3, 0.11, 1650),
]

# Retired by later deliveries or by the decisions above, removed so publish.py
# cannot ship an orphan.
RETIRED = ['room-02-sideboard.jpg', 'room-03-garden.jpg', 'room-10-concrete.jpg','hero-room-plinth.jpg', 'hero-room-sideboard.jpg', 'room-living.jpg',
           'room-villa.jpg', 'detail-seam.jpg',
           'room-01-newyork.jpg', 'room-02-reflection.jpg',
           'room-03-reflection.jpg', 'room-03-salon.jpg', 'room-04-salon.jpg',
           'room-04-walnut.jpg', 'room-05-garden.jpg', 'room-05-sideboard.jpg',
           'room-05-walnut.jpg', 'room-06-garden.jpg', 'room-06-highrise.jpg',
           'room-06-walnut.jpg', 'room-07-garden.jpg', 'room-07-highrise.jpg',
           'room-07-loft.jpg', 'room-08-concrete.jpg', 'room-08-highrise.jpg',
           'room-08-loft.jpg', 'room-09-concrete.jpg', 'room-09-loft.jpg',
           'room-09-sideboard.jpg', 'room-10-concrete.jpg', 'room-10-mediterran.jpg',
           'room-11-mediterran.jpg']

QUALITY = 88   # working copy stays generous; publish.py caps and re-encodes

# The design folder gets reorganised between deliveries — on 02.09.2026 four of
# the room masters moved into an `artdrop` subfolder — so a master is looked up
# by name in the folder itself and then one level down in the known subfolders,
# rather than being pinned to a path that a tidy-up breaks.
SUBFOLDERS = ['artdrop']


def master(folder, name):
    for candidate in [folder / name] + [folder / sub / name for sub in SUBFOLDERS]:
        if candidate.exists():
            return candidate
    return None


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
    missing = [f'{e[0].name}/{e[1]}' for e in COPIES + TALL_CROPS
               if master(e[0], e[1]) is None]
    if missing:
        sys.exit(f'masters not found: {missing}')

    print(f'studio masters: {STUDIO}')
    print(f'design masters: {DESIGN}\n')
    for entry in COPIES:
        folder, name, out, cap = entry[:4]
        sharpen = entry[4] if len(entry) > 4 else None
        save(Image.open(master(folder, name)).convert('RGB'), out, cap, sharpen)

    folder, name, out, x0, y0, x1, y1, sharpen = CROP_WORK
    im = Image.open(master(folder, name)).convert('RGB')
    save(im.crop((x0, y0, x1, y1)), out, x1 - x0, sharpen)
    print(f'  {"":26} -> .work-block__art aspect-ratio:{x1 - x0}/{y1 - y0}')

    for entry in TALL_CROPS:
        folder, name, out, ratio, left_frac, height = entry[:6]
        sharpen = entry[6] if len(entry) > 6 else None
        im = Image.open(master(folder, name)).convert('RGB')
        crop_h = min(height, im.height)
        crop_w = round(crop_h * ratio)
        left = round(im.width * left_frac)
        # take the crop at full master resolution, then scale to `height`
        scale = im.height / crop_h
        box_w = round(crop_w * scale)
        if left + box_w > im.width:
            sys.exit(f'{name}: {ratio:.3f} crop at x={left} does not fit {im.size}')
        box = (left, 0, left + box_w, im.height)
        save(im.crop(box).resize((crop_w, crop_h), Image.LANCZOS), out, crop_w, sharpen)

    for old in RETIRED:
        p = HERE / old
        if p.exists():
            p.unlink()
            print(f'  removed retired {old}')

    check_bases()


def check_bases():
    """Report each room render's base colour against the studio reference.

    The sculpture sits on a smoked oak base. Several of the delivered renders
    invent a different wood: one came out pale blond, another two-tone with a
    near-white face. That is the kind of thing nobody notices until a collector
    does, so it is measured rather than eyed. This reports, it does not fail:
    the sample boxes are approximate and a render can be legitimately warmer or
    cooler with the light in the room.
    """
    import numpy as np

    def patch(path, box):
        a = np.asarray(Image.open(path).convert('RGB')).astype(float)
        h, w = a.shape[:2]
        x0, y0, x1, y1 = box
        return a[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)].reshape(-1, 3)

    def spread(px):
        """Light-to-dark range inside the patch, p90 minus p10."""
        lum = px @ np.array([0.2126, 0.7152, 0.0722])
        return float(np.percentile(lum, 90) - np.percentile(lum, 10))

    ref_name, ref_box = BASE_REFERENCE
    ref_px = patch(HERE / ref_name, ref_box)
    ref, ref_spread = ref_px.mean(0), spread(ref_px)
    print(f'\nbase colour vs {ref_name} — reference rgb'
          f'({int(ref[0])}, {int(ref[1])}, {int(ref[2])}), spread {ref_spread:.0f}')
    for name, box in BASE_PATCH.items():
        if not (HERE / name).exists():
            continue
        px = patch(HERE / name, box)
        got, spr = px.mean(0), spread(px)
        dist = float(np.abs(got - ref).mean())
        flag = 'ok' if dist <= BASE_TOLERANCE else 'OFF, wrong colour — retouch'
        print(f'  {name:24} rgb({int(got[0]):3}, {int(got[1]):3}, {int(got[2]):3})'
              f'   delta {dist:5.1f}   spread {spr:5.1f}   {flag}')
    print('  delta is judged; spread is information only. A two-tone base still\n'
          '  needs an eye: RNE_img_01 renders one face near-white and averages\n'
          '  out to a plausible brown.')


main()
