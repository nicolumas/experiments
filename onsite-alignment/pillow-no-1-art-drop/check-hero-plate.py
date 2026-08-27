#!/usr/bin/env python3
"""Prove the hero type plate never covers an artwork, and by how much it clears.

    node audit.js && python3 check-hero-plate.py

Why this test exists
--------------------
The brand book (Performance Marketing) forbids darkening or lightening layers
over an artwork, or over a room containing one, even for text legibility: the
instruction is to move the text instead. So this page has no gradient scrim and
the lockup sits on an opaque charcoal plate. That only holds if the plate lands
on floor, wall and plinth, never on a work.

How it is measured
------------------
audit.js records the plate rectangle from the live layout at each width, along
with the container box, the image's natural size and its object-position. This
script maps the plate back through the object-fit:cover transform into source
pixels and tests it against the artwork rectangles below.

A colour detector was tried first and rejected: brass and French oak parquet
occupy the same warm, saturated band, so the detector flagged the herringbone
floor under the plate as artwork. The rectangles below were measured by hand and
verified by rendering them over the photograph. Each is deliberately larger than
the work it bounds, so the reported clearance is a lower bound.
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPORT = HERE / 'audit-report.json'

# Minimum breathing room between the plate and any work, in CSS pixels.
MIN_CLEARANCE = 24

# Artwork rectangles in source-image pixels, (x0, y0, x1, y1).
# hero-room-portrait.jpg is a 3:4 crop of the landscape master taken at x=560
# (see prepare-assets.py), so its boxes are the same rectangles shifted by -560
# and clipped to the 768px crop.
PARIS_ARTWORKS = {
    'Pillow No. 1, sculpture and oak base': (725, 145, 1200, 690),
    'framed drawing, right wall':           (1185, 0, 1535, 575),
    'framed picture, background left':      (615, 120, 915, 395),
}
CROP_X = 560
PORTRAIT_W = 768

ARTWORKS = {'hero-room-paris.jpg': PARIS_ARTWORKS}
ARTWORKS['hero-room-portrait.jpg'] = {
    name: (max(0, x0 - CROP_X), y0, min(PORTRAIT_W, x1 - CROP_X), y1)
    for name, (x0, y0, x1, y1) in PARIS_ARTWORKS.items()
    if x1 - CROP_X > 0 and x0 - CROP_X < PORTRAIT_W
}


def cover_to_source(rect, container, natural, object_position):
    """Map a rect in viewport coordinates into source-image pixels."""
    cw, ch = container['w'], container['h']
    nw, nh = natural
    scale = max(cw / nw, ch / nh)
    parts = object_position.split()
    px, py = (float(v.rstrip('%')) / 100 for v in (parts + parts)[:2])
    off_x = (cw - nw * scale) * px
    off_y = (ch - nh * scale) * py
    rx, ry = rect['x'] - container['x'], rect['y'] - container['y']
    return ((rx - off_x) / scale, (ry - off_y) / scale,
            (rx + rect['w'] - off_x) / scale, (ry + rect['h'] - off_y) / scale, scale)


def clearance(a, b):
    """Shortest distance between two rects; negative means they overlap."""
    ax0, ay0, ax1, ay1 = a
    bx0, by0, bx1, by1 = b
    dx = max(bx0 - ax1, ax0 - bx1)
    dy = max(by0 - ay1, ay0 - by1)
    if dx >= 0 or dy >= 0:
        return max(dx, dy)
    return max(dx, dy)          # both negative -> overlap depth on the tighter axis


def main():
    if not REPORT.exists():
        sys.exit('audit-report.json not found — run "node audit.js" first')
    geo = json.loads(REPORT.read_text())['checks']['heroGeometry']

    failures = []
    print(f'\n=== hero plate vs artwork · minimum clearance {MIN_CLEARANCE} CSS px ===\n')
    for width in sorted(geo, key=int):
        g = geo[width]
        src = g['src']
        boxes = ARTWORKS.get(src)
        if boxes is None:
            failures.append(f'{width}px: no artwork map for {src}')
            print(f'  {width:>5}px  {src}  — NO ARTWORK MAP\n')
            continue

        plate = cover_to_source(g['plate'], g['container'], g['natural'], g['objectPosition'])
        px0, py0, px1, py1, scale = plate
        print(f'  {width:>5}px  {src}   cover scale {scale:.3f}, object-position {g["objectPosition"]}')
        print(f'         plate -> source  x[{px0:7.1f},{px1:7.1f}]  y[{py0:7.1f},{py1:7.1f}]')
        worst = None
        for name, box in sorted(boxes.items()):
            d = clearance((px0, py0, px1, py1), box)
            css = d * scale
            flag = 'ok' if css >= MIN_CLEARANCE else ('CLEAR BUT TIGHT' if css >= 0 else 'OVERLAP')
            print(f'         {name:38} {css:8.0f} CSS px  {flag}')
            if worst is None or css < worst[1]:
                worst = (name, css)
        if worst and worst[1] < MIN_CLEARANCE:
            failures.append(f'{width}px: {worst[0]} only {worst[1]:.0f} CSS px away')
        print()

    if failures:
        print('  FAIL')
        for f in failures:
            print('   ', f)
        print()
        sys.exit(1)
    print(f'  PASS — {len(geo)} widths, plate clears every work by at least '
          f'{MIN_CLEARANCE} CSS px\n')


main()
