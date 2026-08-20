# PDP with configuration-specific gallery availability

Prototype of a simplified LUMAS product detail page where **gallery availability is a
first-class part of the buy box** and always refers to the exact configuration on screen.

Reference page: <https://www.lumas.de/pictures/marta_contreras_simo/liu/>

- `index.html` — the page. All states are real URLs.
- `mobile.html` — four 390 × 844 frames side by side.
- Prototype states are also reachable from the "Prototype states" button, bottom left.

Serve `prototype/` and open `/pdp/`. Hotlinked artwork needs a network connection.

---

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

## Availability states

| State | Condition | Copy | Action |
|---|---|---|---|
| none | no gallery known | Check gallery availability | resolves the nearest holding gallery |
| A | ≥ 3 units at selected gallery | In stock · Berlin, Kurfürstendamm | Reserve in gallery |
| B | 1–2 units | Last one / Only 2 left · Berlin, Kurfürstendamm | Reserve in gallery |
| C | 0 at the selected gallery | Unavailable in Berlin · Available to buy online | none |
| D | 0 everywhere | Not currently in a gallery · Made to order | none |
| E | gallery remembered from a previous visit | rendered immediately, no skeleton | as above |

States C and D name no alternative gallery and carry no action: the online CTA below is the
path. That is a deliberate change from the original brief, which asked C to point at another
gallery.

One interaction gets to a result: the availability row is a single link that resolves the
nearest holding gallery **and** opens the drawer showing it. No prior configuration step
is required, and no second click is needed to see the answer.

The row's action reads **Reserve in gallery** rather than "change" — the gallery is a way to
buy, not a store picker. It **expands a reservation panel in place**, directly under the
band and above the CTA, in the band's own warm tone so the two read as one block. The panel
carries two lines only — what will be held, where, and how it is confirmed, then the address
and hours — followed by Name / Email / Phone, the **Reserve this artwork** CTA and the consent
line. Submitting swaps it for a "Reservation received" confirmation with a directions
link. It animates open via `grid-template-rows: 0fr → 1fr`, owns a URL (`&reserve=1`) so it
is linkable, works without JavaScript, and the row's arrow rotates to show the toggle state.

Collapsed is the default, so in the resting state nothing sits between availability and the
primary CTA. The panel only comes between them once the shopper asks for it.

The selected gallery is shown on a strip **directly above the image**, not in the navigation:

    ⌖  YOUR GALLERY BERLIN, KURFÜRSTENDAMM  |  IN STOCK IN THIS CONFIGURATION

That strip is an indicator only, with no control on it. It carries the stock line for the
current configuration, so it changes when the size or the framing changes, and it is absent
until a gallery is known.

## Image stage

The main image is the real LUMAS framed render (`image-with-frame`) whenever a framing is
selected, and the bare print when it is not. Under it sits the live PDP's own thumbnail rail:
the work, two room views, the AR preview, the certificate, the framing corner and the back
view. Room views composite the framed render onto the real LUMAS room photographs. Switching
a thumbnail is view state, not product state, so it does not touch the URL.

Note: the `image-with-frame` endpoint returns one canonical framed render regardless of the
frame requested, so the preview does not vary between the three framing options.

## Gallery drawer

Right-hand drawer, never a modal. On desktop (≥ 1180px) the page is **pushed**, so the
price, the availability row and the CTA stay fully visible while the drawer is open.
Galleries holding the configuration offer **Reserve here**; the rest can still be set as
your gallery. Since "choose a different gallery" was removed from the reservation pop-up,
the drawer currently has no entry point in the UI and is reachable only by URL
(`&drawer=1`) or the prototype states menu. On
mobile the drawer carries the configuration and the price in its own header, so what you
are buying is never in doubt. Dismiss with the X, the scrim, or Escape.

Galleries holding the current configuration sort to the top. Selecting one updates the
buy box, the header chip, "See it in person" and "Other galleries".

## Data provenance

Real:

- Sizes, SKUs and print prices — DE product feed, abstract 18685 (`MCS15` €230,
  `MCS14` €610, `MCS13` €790).
- Framing prices — PIM option set per SKU, receiver DE (e.g. Basel frame with shadow gap,
  matt: €249 / €519 / €879).
- Gallery names, streets, postcodes, opening hours and phone numbers — the live LUMAS
  gallery pages.
- Artwork image — `img.lumas.com`, shown bare at its true 1:1 ratio and never cropped.
  The frame is drawn around it in CSS, so the preview changes with the configuration.

Mock:

- Per-configuration unit counts (`INVENTORY`), chosen so every availability state is
  reachable from the states menu.
- Distances, which assume a visitor in Berlin.
- The gallery photograph is a real LUMAS interior used generically; it is labelled
  "Inside a LUMAS gallery" rather than attributed to a specific room.

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
rail and the recommendation modules. Below the fold only "See it in person" remains; the
"Other galleries" and "About this work" sections were removed. The promo bar is kept because
it is part of the real chrome, and it is dismissible.

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
