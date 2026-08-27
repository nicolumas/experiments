# Art by room — shared hero + furniture kit

The five room landing pages (kitchen, office & study, bedroom, living room, hallway) were
built independently and each invented its own hero layout, class vocabulary and type scale.
This kit is the shared layer that makes them read as one page type: one hero, one breadcrumb,
one eyebrow, one button pair, one artwork credit.

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
| `room-lp.css` | The hero, the breadcrumb, the buttons, and the furniture aliases. |
| `room-lp.js` | Measures the fixed nav into `--nav-h`. Nothing else. |
| `inline.py` | The only thing you run. |

## What it does NOT ship

**The hero markup.** That is page content — its own image, headline, lede, CTAs and credit —
so it lives in the page between `LUMAS-ROOM-LP:HERO` markers, hand-authored against the
classes below. The kit styles it; it does not write it.

```html
<!-- LUMAS-ROOM-LP:HERO:BEGIN -->
<nav class="rlp-crumb" aria-label="Breadcrumb">
  <ol>
    <li><a href="…">Home</a></li>
    <li aria-hidden="true">/</li>
    <li><a href="…/art-by-room/">Art by room</a></li>
    <li aria-hidden="true">/</li>
    <li aria-current="page">Kitchen</li>
  </ol>
</nav>

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

- **Image left, text right, on white.** The media column bleeds to the left page edge and is
  48% of the viewport. Below 900px it stacks: image first, then text.
- **One ratio: 3:2.** Every source render is 16:9, so this is a modest centre crop that keeps
  the mounted work in frame. Nudge the crop per page with `--rlp-hero-focus` on the
  `.rlp-hero` element. Never with a different ratio — the ratio is the thing being shared.
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
