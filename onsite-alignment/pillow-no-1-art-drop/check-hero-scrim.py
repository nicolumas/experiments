#!/usr/bin/env python3
"""Tune and prove the hero scrim by measurement instead of taste.

    node audit.js && python3 check-hero-scrim.py

The type sits directly on the photograph. That only works if the scrim behind
each line is dark enough for AA — and the brand book asks for as little
darkening over the artwork as possible, so "dark enough" has to mean the
LIGHTEST ramp that still clears, not a comfortable one.

What it does
------------
audit.js records, per width: the hero image and its natural size, the container
box, object-position, the computed ::after height / gradient / mask, and every
lockup line with its own rect, colour and type spec. This script then:

  1  parses the rendered gradient and mask, so it tests what the browser
     actually paints rather than a copy of the CSS kept in sync by hand
  2  maps each line's rect back through the object-fit:cover transform into
     source-image pixels
  3  walks that band ROW BY ROW: at each row it takes the 95th-percentile
     brightness (the brightest local patch, not the mean, because a single
     bright highlight behind a stroke is what actually fails) and composites
     the scrim alpha for that row's height
  4  reports the worst row per line, and checks it against 4.5:1, or 3:1 for
     large text — WCAG large is 24px, or 18.66px at weight >= 700, not 18px

It also checks two things the scrim does not decide:

  * that the cover crop leaves every work FULLY in frame at every width. A
    fixed object-position cannot guarantee this, which is why setHeroCrop() in
    the page derives it from the same artwork box used here.
  * the maximum scrim alpha that lands on the artwork, because that is the cost
    of putting type on the image and it belongs in the open, not hidden.

Artwork boxes are FRACTIONS of the hero master, measured by hand and verified
by rendering them over the photograph, so they survive a re-export at
a different size. A colour detector was tried and rejected: polished brass and
warm oak furniture occupy the same saturated band.
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
REPORT = HERE / 'audit-report.json'

LANDSCAPE = 'hero-room-paris.jpg'
PORTRAIT = 'hero-room-portrait.jpg'

# Fractions of the hero master (room2 (1).png), (x0, y0, x1, y1). Measured by
# hand and verified by rendering them over the photograph, so they survive a
# re-export at a different size. Each is deliberately larger than the work it
# bounds. The white plinth, the chair, the rug and the vase are furniture.
# The primary work is the one being sold: cropping it fails the build. The other
# two are pictures hanging in the photographed room. They still must not be
# washed by the scrim, but a full-bleed hero will always clip incidental wall
# art at the frame edge, so their framing is reported, not enforced.
MASTER_ARTWORKS = {
    'Pillow No. 1, sculpture and base': (0.472, 0.142, 0.782, 0.674),
    'framed drawing, right wall':       (0.772, 0.000, 1.000, 0.562),
    'framed picture, background left':  (0.401, 0.117, 0.596, 0.386),
}
PRIMARY = 'Pillow No. 1, sculpture and base'
# must match PORTRAIT in prepare-assets.py
CROP_LEFT_FRAC = 0.365
MASTER_W, MASTER_H = 1535, 1024
CROP_W_FRAC = (MASTER_H * 3 / 4) / MASTER_W

BRIGHT_PERCENTILE = 95


def artwork_fracs(src):
    if src == LANDSCAPE:
        return MASTER_ARTWORKS
    out = {}
    for name, (x0, y0, x1, y1) in MASTER_ARTWORKS.items():
        nx0 = (x0 - CROP_LEFT_FRAC) / CROP_W_FRAC
        nx1 = (x1 - CROP_LEFT_FRAC) / CROP_W_FRAC
        if nx1 <= 0 or nx0 >= 1:
            continue                        # cropped out of frame
        out[name] = (max(0.0, nx0), y0, min(1.0, nx1), y1)
    return out


# ------------------------------------------------------------------ colour ---

def srgb_to_lin(v):
    v = v / 255.0
    return np.where(v <= 0.03928, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)


def luminance(rgb):
    lin = srgb_to_lin(np.asarray(rgb, dtype=float))
    return 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]


def contrast(l1, l2):
    hi, lo = np.maximum(l1, l2), np.minimum(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def parse_rgb(text):
    nums = [float(n) for n in re.findall(r'[\d.]+', text)]
    return (nums[0], nums[1], nums[2], nums[3] if len(nums) > 3 else 1.0)


def parse_gradient(css):
    """-> (direction, [(position 0-1, (r,g,b,a)), ...]) from a linear-gradient()."""
    m = re.search(r'linear-gradient\((.*)\)\s*$', css.strip(), re.S)
    if not m:
        return None, []
    body = m.group(1)
    parts, depth, cur = [], 0, ''
    for ch in body:
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
        if ch == ',' and depth == 0:
            parts.append(cur.strip()); cur = ''
        else:
            cur += ch
    parts.append(cur.strip())
    direction = 'to top'
    if parts and parts[0].startswith(('to ', 'top', 'bottom', 'left', 'right')) \
       or (parts and 'deg' in parts[0]):
        direction = parts.pop(0)
    stops = []
    for pt in parts:
        cm = re.match(r'(rgba?\([^)]*\)|#[0-9a-fA-F]+)\s*([\d.]+)%?', pt)
        if not cm:
            continue
        stops.append((float(cm.group(2)) / 100.0, parse_rgb(cm.group(1))))
    return direction, stops


def sample_gradient(stops, t):
    """Alpha (and colour) of the gradient at normalised position t."""
    if not stops:
        return 0.0, (0, 0, 0)
    t = min(1.0, max(0.0, t))
    if t <= stops[0][0]:
        c = stops[0][1]
        return c[3], c[:3]
    for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
        if t <= p1:
            f = 0.0 if p1 == p0 else (t - p0) / (p1 - p0)
            a = c0[3] + (c1[3] - c0[3]) * f
            rgb = tuple(c0[i] + (c1[i] - c0[i]) * f for i in range(3))
            return a, rgb
    c = stops[-1][1]
    return c[3], c[:3]


# ---------------------------------------------------------------- geometry ---

def cover(container, natural, object_position):
    cw, ch = container['w'], container['h']
    nw, nh = natural
    scale = max(cw / nw, ch / nh)
    parts = object_position.split()
    px, py = (float(v.rstrip('%')) / 100 for v in (parts + parts)[:2])
    return scale, (cw - nw * scale) * px, (ch - nh * scale) * py


def main():
    if not REPORT.exists():
        sys.exit('audit-report.json not found — run "node audit.js" first')
    geo = json.loads(REPORT.read_text())['checks']['heroGeometry']

    cache = {}
    failures = []
    art_alpha_max = {}
    print('\n=== hero scrim, measured against the photograph ===\n')

    for width in sorted(geo, key=int):
        g = geo[width]
        src, cont = g['src'], g['container']
        if src not in cache:
            cache[src] = np.asarray(Image.open(HERE / src).convert('RGB')).astype(float)
        img = cache[src]
        ih, iw = img.shape[:2]

        scale, off_x, off_y = cover(cont, g['natural'], g['objectPosition'])
        scrim_h = float(re.findall(r'[\d.]+', g['scrim']['height'])[0])
        _, stops = parse_gradient(g['scrim']['background'])
        mask_dir, mask_stops = parse_gradient(g['scrim']['mask']) \
            if g['scrim']['mask'] and g['scrim']['mask'] != 'none' else (None, [])

        def alpha_at(view_y, view_x):
            """Composited scrim alpha at a viewport point."""
            t = (cont['y'] + cont['h'] - view_y) / scrim_h        # 0 at bottom
            a, rgb = sample_gradient(stops, t)
            if t > 1:
                a = 0.0
            if mask_stops:
                mx = (view_x - cont['x']) / cont['w']
                # mask alpha: black = keep, transparent = drop
                ma, _ = sample_gradient(mask_stops, mx)
                a *= ma
            return a, rgb

        print(f'  {width:>5}px  {src}  scrim {scrim_h:.0f}px'
              f'{"  masked" if mask_stops else ""}  cover scale {scale:.3f}')

        # The cover crop must never cut the work. This is the check the reported
        # bug should have been caught by: object-position was set to 100% to put
        # darker floor behind the type, which sliced the top off the sculpture on
        # a wide, short window. setHeroCrop() now derives the position from this
        # same box, and this asserts the result.
        visible_top = -off_y / scale
        visible_bottom = (cont['h'] - off_y) / scale
        for name, (_, fy0, _, fy1) in artwork_fracs(src).items():
            top, bottom = fy0 * ih, fy1 * ih
            cut_top = visible_top - top
            cut_bottom = bottom - visible_bottom
            if cut_top > 1 or cut_bottom > 1:
                note = 'CROPPED' if name == PRIMARY else 'clipped (incidental)'
                if name == PRIMARY:
                    failures.append(f'{width}px: the work is cropped by '
                                    f'{max(cut_top, 0):.0f}px top / {max(cut_bottom, 0):.0f}px bottom')
                print(f'         {note}: "{name}" loses '
                      f'{max(cut_top, 0):.0f}px top, {max(cut_bottom, 0):.0f}px bottom')
            else:
                print(f'         "{name}" fully in frame '
                      f'({-cut_top:.0f}px air above, {-cut_bottom:.0f}px below)')

        for line in g['lines']:
            fg = luminance(parse_rgb(line['color'])[:3])
            large = line['fontSize'] >= 24 or (line['fontSize'] >= 18.66 and line['fontWeight'] >= 700)
            need = 3.0 if large else 4.5

            # line rect -> source pixels
            sx0 = int(max(0, (line['x'] - cont['x'] - off_x) / scale))
            sx1 = int(min(iw, (line['x'] + line['w'] - cont['x'] - off_x) / scale))
            sy0 = int(max(0, (line['y'] - cont['y'] - off_y) / scale))
            sy1 = int(min(ih, (line['y'] + line['h'] - cont['y'] - off_y) / scale))
            if sx1 <= sx0 or sy1 <= sy0:
                print(f'         {line["text"][:34]:34} off-image, skipped')
                continue

            worst = None
            for sy in range(sy0, sy1):
                row = img[sy, sx0:sx1]
                bright = np.percentile(row, BRIGHT_PERCENTILE, axis=0)
                view_y = cont['y'] + off_y + sy * scale
                # weakest alpha across the row's width (the mask fades right)
                a, rgb = alpha_at(view_y, line['x'])
                a2, _ = alpha_at(view_y, line['x'] + line['w'])
                a = min(a, a2)
                comp = bright * (1 - a) + np.asarray(rgb) * a
                r = float(contrast(fg, luminance(comp)))
                if worst is None or r < worst[0]:
                    worst = (r, a, tuple(bright.round().astype(int)))

            r, a, bright = worst
            ok = r >= need - 0.005
            print(f'         {line["text"][:34]:34} {line["fontSize"]:>4.0f}px  '
                  f'brightest patch rgb{bright}  scrim {a*100:4.0f}%  '
                  f'{r:5.2f}:1  need {need}  {"ok" if ok else "FAIL"}')
            if not ok:
                failures.append(f'{width}px "{line["text"][:28]}" {r:.2f}:1 < {need}')

        # how much darkening lands on the works
        for name, (fx0, fy0, fx1, fy1) in artwork_fracs(src).items():
            ax0, ax1 = fx0 * iw, fx1 * iw
            ay0, ay1 = fy0 * ih, fy1 * ih
            amax = 0.0
            for sy in np.linspace(ay0, ay1, 40):
                for sx in np.linspace(ax0, ax1, 40):
                    vy = cont['y'] + off_y + sy * scale
                    vx = cont['x'] + off_x + sx * scale
                    if not (cont['y'] <= vy <= cont['y'] + cont['h']):
                        continue
                    a, _ = alpha_at(vy, vx)
                    amax = max(amax, a)
            art_alpha_max.setdefault(name, 0.0)
            art_alpha_max[name] = max(art_alpha_max[name], amax)
            print(f'         scrim over "{name}": max {amax*100:.0f}%')
        print()

    print('  scrim landing on the works, worst case across all widths:')
    for name, a in art_alpha_max.items():
        print(f'    {name:36} {a*100:.0f}%')
    print()

    if failures:
        print('  FAIL')
        for f in failures:
            print('   ', f)
        print()
        sys.exit(1)
    print(f'  PASS — every lockup line clears AA at all {len(geo)} widths\n')


main()
