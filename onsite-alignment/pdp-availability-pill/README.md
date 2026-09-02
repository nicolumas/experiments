# PDP with an availability pill and consultant contact

Second iteration of the simplified LUMAS PDP. The local-inventory module is gone; gallery
availability is now a single compact pill under the price, and the gallery's details plus a
route to a human sit behind it.

Reference page: <https://www.lumas.de/pictures/marta_contreras_simo/liu/>

- `index.html` — the page. All states are real URLs.
- `mobile.html` — four 390 x 844 frames.

Serve `prototype/` and open `/pdp-pill/`.

## What changed from the first iteration

Removed:

- The **local-inventory module** in all its forms: the gallery card with its Details & map
  expansion, the strip over the image, and the gallery drawer behind them.
- The **Reserve for gallery visit** button, its reservation modal and the
  "or buy online now" separator that only existed to divide the two CTAs.
- The **promo banner on mobile** (it stays on desktop).

Added:

- A **compact green availability tag at the top of the buy box**, above the artist name: "Available in BERLIN KURFÜRSTENDAMM" with an
  info icon. Square-cornered at the 2px chip radius, not a rounded pill. It only appears when the selected gallery actually holds the current size and
  framing, so it is a positive signal only, never a negative one.
- A **pop-up behind the tag** carrying the gallery name, address, opening hours and a
  directions link, then "Get in touch, our art consultants would be happy to help you."
  and three CTAs: **Email**, **WhatsApp**, **Call**. Email pre-fills a subject with the
  artwork and size; WhatsApp and Call use the gallery's own number. The pop-up owns a URL
  (`&info=1`), so it is linkable and survives a reload.

The buy box is now: availability tag, artist, title, edition, size, framing, price, one
black **Add to cart**, fine print. On mobile the tag is centred with the title block.

## The architectural rule

> Selected configuration → price → gallery inventory.
> These three always describe the same physical object.

**Inventory belongs to the configuration, not to the artwork.**

```
Artwork  (Liu, Marta Contreras Simó, edition of 150)
  └── Configuration                       key = size + frame
        ├── size          40 / 80 / 120 cm  (SKU MCS15 / MCS14 / MCS13)
        ├── frame         none / slimline / shadow gap / ArtBox 50
        ├── price         print price + frame price for that size
        └── galleryInventory
              ├── gallery        name, address, opening hours, phone, distance
              └── quantity       units of THIS size in THIS frame, at that gallery
```

There is no state in which the price describes one configuration and the availability
another: both are read from the same `configure(size, frame)` result.

## Server-rendered, not patched after load

Every configuration is its own URL:

```
/pdp/?size=s80&frame=basel&gallery=kudamm
```

- Size and frame options are links. Choosing one is a real navigation.
- The chosen gallery persists in a `lumas_gallery` cookie, so a later visit renders that
  gallery's status straight away (state E) with no "checking availability" step.
- `gallery=auto` resolves to the nearest gallery that actually holds the configuration,
  then the URL is canonicalised to the resolved gallery.
- The page is produced by one pure function of (URL params + cookie) that runs
  synchronously while the document parses, so price and availability are in the first
  paint. In production that same function is the server template. Nothing is rewritten
  client-side after load; JS only handles the drawer, the sticky mobile bar and the
  "configuration changed" note.

## The states, as URLs

Every state is a link:

| State | URL |
|---|---|
| Tag shown | `?size=s80&frame=basel&gallery=kudamm` |

| No tag, not in this gallery | `?size=s120&frame=basel&gallery=kudamm` |
| No tag, not in any gallery | `?size=s80&frame=none&gallery=kudamm` |
| No gallery known | `?size=s80&frame=basel&gallery=none` |
| Consultant pop-up | `?size=s80&frame=slim&gallery=kudamm&info=1` |
| Remembered gallery | `?size=s80&frame=basel` |

## Radii

Everything on the page is square or near-square, per the brand's low-radius rule: the
availability tag and the pop-up badge sit at the 2px chip radius, buttons and the pop-up
card are sharp, the size selector keeps the live PDP's 4px and the framing control its 3px.
The header search field keeps its 20px because that is what production ships.

Note the V2 foundations do carve out an exception, reserving the fully-rounded pill for
availability and status chips. This prototype does not use it, by request.

## Availability states

| Condition | Result |
|---|---|
| Selected gallery holds this size and framing | green tag, "Available in <gallery>" |
| It does not, or no gallery is known | no tag; Add to cart is the whole story |

The tag is deliberately one-directional: it never says a work is unavailable, it just goes
quiet. That is a change from the first iteration, which designed an explicit state for
"unavailable in Berlin" and for "not in any gallery".

## Layout

Full-bleed. The hero spans the whole viewport width with no centred max-width: the buy
column holds a fixed `clamp(464px, 26vw, 560px)` and every extra pixel goes to the image
stage, which reads as gallery wall. The artwork is capped at `min(64vh, 720px)` so the
stage stays in proportion with the buy column instead of stranding it.

## Styling

The chrome and the buy box are built from the live PDP's own computed styles, not an
interpretation of them:

| Element | Value taken from the live page |
|---|---|
| Body | `archivo` 15px / 22.5px, `#1C1A18` on white |
| Artist heading | `utile-display` 400, 37px, letter-spacing `-1.48px` |
| Work title | `archivo` 13px, letter-spacing `1.3px`, uppercase |
| Section labels | `archivo` 11px, letter-spacing `1px`, uppercase |
| Image stage | `#E2D8CC` + the site's own `pdp-background.jpg` linen texture |
| Size selector | segmented row, active cell white with 1px `#1C1A18`, radius 4px |
| Framing control | `.framing-drawer` summary, 36px tall, 1px solid, radius 3px |
| Price | `archivo` 32px |
| Availability band | the `demand-indicator` surface, `#F7F1E9`, radius 2px |
| Primary CTA | 50px tall, `#1C1A18` on `#F4EDE2`, 16px, letter-spacing `1px`, uppercase |
| Secondary button | 52px, 1px `#1C1A18`, 12px bold, letter-spacing `1.68px` |
| Fine print | `archivo` 9px uppercase |

Fonts are the project's own `archivo.woff2` and `utile-display` files from
`prototype/assets/fonts/`. The logo and the stage texture are the real assets.

What was intentionally dropped from the live page: the two `demand-indicator` urgency bands,
"Preis vorschlagen", the follow-artist button, the Trustpilot block, the sticky back-to-top
rail and the recommendation modules. There is no below-the-fold content at all now, only the
footer: the gallery card carries the address, hours, map and actions that "See it in person"
used to hold. The promo bar is kept because it is part of the real chrome, and it is
dismissible.

The live page already has an "In Galerie ansehen" button that opens a centred `<dialog>`.
That is what this prototype replaces: the availability row above the CTA, plus a side drawer.

## Deliberate deviations from the brief

- **No mobile sticky bar.** It was removed by request. Instead the mobile hero is compressed
  hard: artwork at 31vh, one-line gallery strip and price line, shorter size and framing
  controls. The availability row now starts at y≈789 on a 390 × 844 phone, so its first line
  is inside the first viewport and the CTA is one short scroll below it.
- **Mobile keeps its own hierarchy.** The artist/title/edition block is centred, the
  thumbnail rail is hidden, the availability action becomes a full-width row inside the
  band, and the gallery strip and price line each collapse to a single line.
- **Framing uses the live `.framing-drawer` control** rather than chips, so it matches the
  real PDP and costs one 36px row instead of a grid.
