# Art by room — shared hero + furniture kit

The five room landing pages (kitchen, office & study, bedroom, living room, hallway) were
built independently and each invented its own hero layout, class vocabulary and type scale.
This kit is the shared layer that makes them read as one page type: one hero, one eyebrow,
one button pair, one artwork credit.

Section content stays page-specific. Only the things a visitor reads as branding are unified.

## Quick start

```bash
python3 _room-lp/inline.py --into onsite-alignment/kitchen-art/index.html
```

Re-running is safe. The injected regions are fenced with `LUMAS-ROOM-LP:*` comments and get
replaced in place, so upgrading a page to a newer kit is the same command again. Add
`--inline` to embed the assets and get one portable file.

The stylesheet is injected immediately before `</head>` so it loads **after** the page's own
styles and wins at equal specificity. That is the whole mechanism. Do not move it earlier.

## What the kit ships

| File | What it is |
|---|---|
| `room-lp.css` | The hero, the buttons, and the furniture aliases. |
| `room-lp.js` | Measures the fixed nav into `--nav-h`. Nothing else. |
| `inline.py` | The only thing you run. |
| `compare.html` | All five heroes rendered live in one sheet, with an alignment ruler. |

## What it does NOT ship

**The hero markup.** That is page content — its own image, headline, lede, CTAs and credit —
so it lives in the page between `LUMAS-ROOM-LP:HERO` markers, hand-authored against the
classes below. The kit styles it; it does not write it.

There is no breadcrumb: the hero meets the nav directly. The `BreadcrumbList` JSON-LD is
still in the pages' `<head>` and still drives the SERP trail — that is a separate decision
from the on-page element.

```html
<!-- LUMAS-ROOM-LP:HERO:BEGIN -->
<header class="rlp-hero" id="m1">
  <figure class="rlp-hero__media">
    <img src="assets/kitchen-wall-art-hero.jpg" alt="…" width="1920" height="1080" fetchpriority="high">
  </figure>
  <div class="rlp-hero__text">
    <p class="rlp-eyebrow">Art by room &middot; Kitchen</p>
    <h1 class="rlp-hero__title">Kitchen wall art: make the everyday vivid</h1>
    <p class="rlp-hero__lede">…</p>
    <div class="rlp-hero__cta">
      <a class="rlp-btn rlp-btn--primary" href="#m4">See the selection</a>
      <a class="rlp-btn rlp-btn--secondary" href="/en/room-upload/">See it in your kitchen</a>
    </div>
    <p class="rlp-hero__credit">Shown: Isabelle Menin, <a href="…">Only in your heart 03</a></p>
  </div>
</header>
<!-- LUMAS-ROOM-LP:HERO:END -->
```

## The rules the hero encodes

- **Image left, text right, on white.** The image is sized by *subtraction*, not by a share
  of the page: the copy takes a bounded, readable column (`--rlp-text-col`, 38% falling to
  41% at mid widths, never under `--rlp-text-min`) and the media column takes the entire
  remainder — about 59% of the viewport at 1440, bleeding to the left edge, with only
  `--rlp-hero-pad` of gutter on the right. Below 1000px it stacks: image full width, then
  text.
- **One frame, identical on all five pages at any given width.** 3:2 above 1340px, 4:3 from
  1340 down to 1000 where the frame is at its narrowest and a 3:2 box would be shorter than
  the copy beside it, then 3:2 again once the image goes full width. Nudge the crop per page
  with `--rlp-hero-focus` on the `.rlp-hero` element, never with a different ratio — what is
  shared is that all five agree at every width.
- **Keep the copy inside the frame.** `--rlp-text-pad-y`, `--rlp-lede-gap`, `--rlp-cta-gap`
  and `--rlp-credit-gap` exist so the mid-width band can tighten the vertical rhythm. If a
  hero starts showing white bands above and below its image, the copy has outgrown the frame:
  tighten the rhythm or cut a line, do not shrink the type.
- **Sentence-case H1**, Utile Display Regular, `clamp(34px, 3.2vw, 52px)`. Uppercase is for
  eyebrows, UI labels and button text only.
- **Two CTAs**, primary solid + secondary outline, in that order. Keep each label to about
  24 characters: longer and the pair wraps to two rows on one page and not the others,
  which is exactly the inconsistency this kit exists to remove.
- **A credit line**, always, in the shape `Shown: Artist, Work` with the work linked to its
  real PDP. If the work in the hero image cannot be attributed, change the image — do not
  drop the line, and do not invent an attribution.

## Furniture aliases

The pages disagree on class names for the same three things, so `room-lp.css` maps the
existing vocabulary onto canonical values rather than rewriting five sets of section markup:

| Thing | Selectors it catches |
|---|---|
| Eyebrow | `.eyebrow`, `.t-eyebrow` (excluding artwork-card artist lines) |
| Section heading | `h2.d-h2`, `h2.t-h2`, `h2.display-h2`, `h2.h2`, `h2.strip__h2` |
| Buttons | `.btn` + `.btn--primary`/`.btn-primary`, `.btn--secondary`/`.btn-secondary`, `.btn--ghost`/`.btn-ghost` |

Inverse and light variants are excluded throughout: they sit on charcoal bands and already
carry the right contrast.

## Host page requirements

1. **The nav kit must be installed** (`python3 _nav/inline.py UK --into <page>`). `room-lp.css`
   pins `site-header { font-size: 1.6rem }` because the nav inherits the host page's body
   font-size, and the pages disagreed (15px vs 16px). That alone moved the measured nav
   height by 2px and every offset below it with it.
2. **Offset the page for the fixed nav exactly once.** The kit does it, on `<body>`. A page
   that also offsets its own `<main>` double-counts it by a full nav height — that bug was
   live on the bedroom page.
3. **English nav on all five.** They are English pages; the hallway was shipping the German
   nav. Switch market with the same `inline.py` command and a different code.

## Known limits

- The page ground is `#FFFFFF`. Not `#FAF6F1` — that is the cream AI builds default to, and
  it is wrong in the v2-branding skill too.
- Small copy is `#5A5752` (7.19:1). `#908C87` is 3.34:1 and fails AA at 11px, so it is not
  used anywhere in this kit.
- The kit does not touch artwork cards, carousels, or module layout. Those are per-page.
- Grid tracks written as two percentages summing to 100 (`grid-template-columns: 40% 60%`)
  overflow their container by exactly the column-gap. Use `fr` — it divides what is left
  after the gap. This shipped on two of the five pages and cost a horizontal scrollbar
  between 1000 and 1300px.
