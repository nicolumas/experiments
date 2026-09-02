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

# Second delivery, 02.09.2026: a full replacement set at 2752x1536 for the hero,
# the buy-box shot and all five carousel slides, all with the same walnut base.
# It supersedes every room render and both studio plates from the first
# delivery, and it retires two open items in the README: the hero master is no
# longer 1535px, and the two slides whose bases were wrong are re-rendered.
UPDATED = Path('/Users/nicolatracey/LUMAS ART Dropbox/Nicola Tracey/Mac (2)/'
               'Downloads/RNE Drop_ Updated assets')

# (folder, source name, output name, max width[, sharpen])
# `sharpen` is an UnsharpMask (radius, percent, threshold), and after the second
# delivery nothing needs it: every image is now downscaled from a 2752px master
# rather than resampled up, so it is sharp at its display size on its own.
COPIES = [
    # --- hero: the only full-bleed image ------------------------------------
    # Still chosen by geometry. The lockup sits lower-left and is ~365px wide at
    # 1024, so it collides with any composition whose subject starts before ~40%
    # of the frame width. Here the sculpture starts at 56%, the clearest margin
    # of anything delivered so far, so the type has the whole left third.
    (UPDATED, 'Header2.jpg', 'hero-room-paris.jpg', 1920),

    # --- the work isolated, and the craft details --------------------------
    (STUDIO, 'DSC_4439_cleaned.png',     'detail-surface.jpg', 1200),
    (STUDIO, 'DSC_4441-clean.png',       'detail-base.jpg',    1200),
    (DESIGN, 'Screenshot 2026-08-26 at 10.04.40 1.jpg',
                                         'detail-edition.jpg', 1600),

    # --- the artist --------------------------------------------------------
    (DESIGN, 'RNE_Portrait_1.jpg', 'artist-portrait.jpg', 1600),

    # --- the galleries -----------------------------------------------------
    # A LUMAS opening, from the shoot the galleries prototype uses. The master
    # is 7011x4674, so 1280 is a true 2x for the ~640px column and the crop is
    # already 1.501, near enough 3:2 that the frame takes it uncropped.
    (STUDIO, 'DSC06390.jpg', 'gallery-event.jpg', 1280),

    # --- rooms, in the delivered carousel order ----------------------------
    # The second delivery replaces all five. Same five scenes as before but
    # re-rendered and re-ordered, and every base is now the same walnut, so the
    # pale-blond and two-tone bases are gone. check_bases() below still measures
    # each one against the studio reference after every run.
    (UPDATED, 'carousel_1.jpg', 'room-01-plinth.jpg',    1920),
    (UPDATED, 'carousel_2.jpg', 'room-02-highrise.jpg',  1920),
    (UPDATED, 'carousel_3.jpg', 'room-03-loft.jpg',      1920),
    (UPDATED, 'carousel_4.jpg', 'room-04-garden.jpg',    1920),
    (UPDATED, 'carousel_5.jpg', 'room-05-sideboard.jpg', 1920),
]

# Where the oak base sits in each render, as fractions of the frame. Read off a
# 1%-grid zoom of each master, tight enough to sit on the base itself: a loose
# box picks up the plinth or the table and the colour report becomes noise. The
# boxes must be re-read whenever the renders are replaced — after the second
# delivery the old ones were sampling plinth and called a good base wrong.
# Automatic detection was tried and abandoned: keying off the sculpture's lowest
# gold pixel lands above the base, and in carousel_5 the brass table frame and
# the reflection in the glass top capture the mask outright.
BASE_PATCH = {
    'room-01-plinth.jpg':    (.455, .685, .545, .735),
    'room-02-highrise.jpg':  (.435, .712, .555, .765),
    'room-03-loft.jpg':      (.425, .715, .535, .775),
    'room-04-garden.jpg':    (.485, .735, .575, .785),
    'room-05-sideboard.jpg': (.415, .775, .525, .845),
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
# Buy-box shot, cropped to the 864/1024 box the panel already uses. The frame
# is media--contain, so the file's own ratio has to match or the art letterboxes.
# Measured on the master by saturation mask: the sculpture and its base span
# x 0.298-0.672, so a 1296px window (864/1024 of the 1536px height) at x=688
# leaves an even 4.8% of ground either side.
CROP_WORK = (UPDATED, 'Product_image_2.jpg', 'work-studio.jpg',
             688, 0, 1984, 1536, None)

# Tall crops taken from a landscape master. The left edge is a FRACTION of the
# source width, so each one survives its master being re-exported at a
# different size, and the crop uses the master's full height.
# (folder, source, output, ratio w/h, left fraction, output height[, sharpen])
TALL_CROPS = [
    # Hero, <=767px only. The sculpture and base span x 0.560-0.790 of the new
    # master, so an 0.466 left edge centres them in the 3:4 window with an even
    # 9.4% either side, and keeps the marble plinth and a slice of parquet.
    # 1152px is the full height of the master at this ratio, so the phone hero
    # is no longer a 768px upscale.
    (UPDATED, 'Header2.jpg', 'hero-room-portrait.jpg', 3 / 4, 0.466, 1536),

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
# cannot ship an orphan. Nothing here may also be an output — main() asserts it.
RETIRED = [
    'detail-seam.jpg', 'hero-room-plinth.jpg', 'hero-room-sideboard.jpg',
    'room-01-newyork.jpg', 'room-02-newyork.jpg', 'room-02-reflection.jpg',
    'room-02-sideboard.jpg', 'room-03-garden.jpg', 'room-03-reflection.jpg',
    'room-03-salon.jpg', 'room-03-sideboard.jpg', 'room-04-salon.jpg',
    'room-04-walnut.jpg', 'room-05-concrete.jpg', 'room-05-garden.jpg',
    'room-05-walnut.jpg', 'room-06-garden.jpg', 'room-06-highrise.jpg',
    'room-06-walnut.jpg', 'room-07-garden.jpg', 'room-07-highrise.jpg',
    'room-07-loft.jpg', 'room-08-concrete.jpg', 'room-08-highrise.jpg',
    'room-08-loft.jpg', 'room-09-concrete.jpg', 'room-09-loft.jpg',
    'room-09-sideboard.jpg', 'room-10-concrete.jpg', 'room-10-mediterran.jpg',
    'room-11-mediterran.jpg', 'room-living.jpg', 'room-villa.jpg',
]

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

    # A name may not be both produced and retired: the retire pass runs last, so
    # such a name would be written and then deleted, and publish.py would fail
    # on a referenced-but-missing image. Renaming a room slide to a name the
    # graveyard already held is exactly how that happens.
    produced = [e[2] for e in COPIES] + [CROP_WORK[2]] + [e[2] for e in TALL_CROPS]
    clash = sorted(set(produced) & set(RETIRED))
    if clash:
        sys.exit(f'these names are produced AND retired: {clash}')
    dupes = sorted({n for n in produced if produced.count(n) > 1})
    if dupes:
        sys.exit(f'two entries write the same output: {dupes}')

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
    print('  delta is judged; spread is information only, but the two together')
    print('  find a two-tone base: carousel_3 (room-03-loft) renders the left')
    print('  face of the walnut near-white, and it posts both the worst delta')
    print('  and the widest spread of the five.')


main()
