# LUMAS navigation kit

The real LUMAS top navigation, extracted from the four live shops so any prototype can have it
in one command. Markup, styles, icon sprites, webfonts and behaviour — the whole thing, no CDN
and no build step.

Extracted from `prototype/two-hundred-years/`, where it was assembled and debugged against
`www.lumas.com`, `www.lumas.de`, `at.lumas.com` and `uk.lumas.com`.

## Quick start

Start a new page with the nav already in it:

```bash
python3 prototype/_nav/inline.py DE --new prototype/my-page.html
```

Add the nav to a page you already have:

```bash
python3 prototype/_nav/inline.py DE --into prototype/my-page.html
```

Markets: `US` `DE` `AT` `UK`. Serve the result from the prototype server (`localhost:8941`) —
linked assets do not resolve over `file://`.

Make it a single portable file — for sending to someone, or deploying on its own:

```bash
python3 prototype/_nav/inline.py DE --into prototype/my-page.html --inline
```

`--inline` embeds every asset, which adds ~590 KB (mostly webfonts). Without it the page
references this folder by relative path and stays small while you work.

Re-running is safe. The injected regions are fenced with `LUMAS-NAV-KIT:*` comments and get
replaced in place, so re-running after a kit change upgrades the page, and switching market is
just the same command with a different code. `demo.html` in this folder is a generated example.

## What you get

- The mega-menu: Artworks, Top 20, Artfinder, Inspiration, Galleries, About us — real
  localised menu content per market, with the Artfinder illustration cards
- Search: dropdown of popular searches/pages/categories on focus, and a form that submits to
  `<shop>/search/?q=…`
- Wishlist, account and cart links pointing at the right shop
- WhatsApp: QR dialog on desktop, opens the app directly on mobile (see `nav.js`)
- Contact dropdown: chat, email, phone, gallery visit — with the market's own phone number
- Mobile: hamburger drawer with scroll lock, the contact block cloned in after Galleries
- All icons as inline SVG sprites; Archivo, Archivo Bold, Icomoon and Utile Display embedded

## Files

| File | What it is |
|---|---|
| `inline.py` | The only thing you run. Injects/updates the nav in a page. |
| `nav-US/DE/AT/UK.html` | Markup per market: `<site-header>` chrome + `<template id="main-navigation">` + sprites. Only these differ per market. |
| `nav-fonts.css` | Archivo, Archivo Bold, Icomoon, Typekit `utile-display`, base64. |
| `nav-utile-display.css` | Self-hosted `UtileDisplay` (300, 300 italic, 400) — the brand display face. |
| `nav-core.css` | The live `site-header.css` plus its V2 token block, verbatim. |
| `nav-widgets.css` | `whats-app-contact` stylesheet + the Icomoon glyph rules it needs. |
| `nav-standalone.css` | The bridge layer. **Loads last, and must.** See below. |
| `nav.js` | The custom elements, the widget wiring, the mobile WhatsApp override. |
| `demo.html` | Generated example page. |

Load order matters: fonts → display face → core → widgets → **standalone last**.
`inline.py` handles it.

## Host page requirements

1. **Root font-size must be 62.5%.** `site-header.css` sizes everything in rem against a 10px
   root; at the browser default the nav renders ~1.6× oversized. `nav-standalone.css` sets it.
   If your page sets its own root size, reconcile the two deliberately.
2. The nav is `position: fixed`. Keep your content clear of it, and set `--nav-z` if 70 is the
   wrong layer for your page.
3. Nothing sets `--nav-h`. If your layout needs the exact height, measure it:
   `document.querySelector('site-header').getBoundingClientRect().height`. `nav-core.css` and
   the mega-menu's max-height read it, falling back to 64px.

## Why nav-standalone.css exists

The live nav is authored against the shop's `main.css`, which this kit does not ship. Every
rule in `nav-standalone.css` either restores a base rule `main.css` would have supplied, or
resets a live rule that only makes sense inside the full shop. Each one is a bug that was
actually observed. Before deleting any of them, check the nav again:

| Symptom | Cause |
|---|---|
| Nav renders ~1.6× too big | `site-header.css` assumes a 10px root |
| Everything in regular weight | bold comes from a separate family, `archivo-bold` |
| Artfinder illustrations letterboxed on beige bars | `width-full`/`height-auto` utilities missing, so the `height` attribute stayed pinned |
| The same link appears three or four times | `hidden-xs/sm/md/lg` undefined, so every responsive variant renders |
| Contact dropdown headings are slate blue | the live header ships `--link-color:#364153` |
| Hamburger, drawer X and search icons blue **on iOS only** | an unstyled `<button>` takes the system accent, and the icons use `fill: currentColor`. Invisible in Chromium. |
| Phone icon sits ~5px below its neighbours | `site-header.css` uses a doubled class, `details.contact.contact > summary svg`, with an asymmetric margin — the reset has to match that specificity |
| WhatsApp dialog hard against the left edge | a `* { margin: 0 }` reset in the host page also kills the UA `margin: auto` that centres a modal `<dialog>` |
| The Collections list runs as one tall column | the rule that widens long lists lives in `main.css` |
| Drawer "Kontakt" row is a bare chevron | `appendSecondaryElements()` clones the header contact into the drawer, so a narrow-screen rule hiding the label hit both |

One more, in `nav.js` rather than the CSS: italic display text rendering as tofu boxes. The
font stack must not lead with the locally-installed name `"Utile Display"` — a machine can have
a family by that name whose italic renders nothing, and font matching does not fall through
once a family matches. Lead with the self-hosted `UtileDisplay`.

## Per-market differences

Only the markup files differ. Verified identical across markets: every stylesheet, `nav.js`,
the sprites, and the artwork titles.

| | Shop | WhatsApp | Menu language |
|---|---|---|---|
| US | `www.lumas.com` | +1 212 219 9497 | English |
| UK | `uk.lumas.com` | +44 20 3608 7590 | English |
| DE | `www.lumas.de` | +49 30 3030 6969 | German (`du`) |
| AT | `at.lumas.com` | +43 1 907 2674 | German (`du`) |

Prices are not part of the kit — the nav carries none.

## Known limits

- Chromium only. Safari and Firefox untested.
- The mega-menu content is a snapshot. When the live nav changes, re-extract rather than
  hand-editing: the markup is machine-lifted from the live shops.
- There is no language switcher; it was deliberately removed.
- `promotion-banner` is still defined as a custom element in `nav.js` but no markup uses it.
  Bring the banner back only with the element present — an earlier build had an unguarded
  `document.querySelector('promotion-banner').remove()` that threw.
