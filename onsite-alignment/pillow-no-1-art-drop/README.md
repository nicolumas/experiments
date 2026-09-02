# Pillow No. 1 — LUMAS Art Drop landing page

Single-file landing page for **Pillow No. 1** by **Rafael Neff** (SKU `RNE319`,
SAP `4700-000003-RNE319`). Market: lumas.de, German canonical, EUR.

It is a landing page that links to the PDP. It is not a PDP.

**PDP:** <https://www.lumas.de/pictures/rafael_neff/pillow_no_1/>

## Files

| File | |
|---|---|
| `pillow-art-drop.html` | **Canonical.** German. Edit this one. |
| `pillow-art-drop-en.html` | Build artefact. English review copy. Do not hand-edit. |
| `translate-en.py` | Regenerates the English file from the German. Exits non-zero if any German survives. |
| `prepare-assets.py` | Derives the JPEG set from both asset deliveries. Names the sources and the crops. |
| `audit.js` | The measured checks. `node audit.js [url]` → `audit-report.json`. |
| `functional.js` | Interaction checks: carousels, newsletter, drawer, dev clock, ENDED routing. `node functional.js`. |
| `check-hero-scrim.py` | Proves the hero scrim and the hero crop against the real pixels. Reads `audit-report.json`. |
| `fix-typography.py` | Binds line breaks so no line orphans a short word and no paragraph widows. Run after any copy edit. |
| `publish.py` | Working copy → published copy: gate injection, metric stripping, photo re-encode. |
| `lumas-fonts.css` + 4 `UtileDisplay-*` files | Licensed TypeNetwork faces (IDs 373473 / 373474). |
| `*.jpg` | Hero (landscape + portrait crop), eleven room renders, the studio shot, three craft images, the artist portrait. |

Regenerate English after any German change (this also re-applies the line-break
binding to both files):

```bash
python3 fix-typography.py pillow-art-drop.html && python3 translate-en.py
```

Re-derive the images if the studio delivers new masters:

```bash
python3 prepare-assets.py
```

## Phases

One constant drives the whole page: `PHASE` = `REVEAL` | `EARLY_ACCESS` |
`PUBLIC` | `ENDED`. Override per URL:

```
pillow-art-drop.html?phase=PUBLIC
pillow-art-drop.html?dev=1          # phase switcher + readiness meter
```

`?dev=1` also time-travels the clock, so previewing a phase previews a
plausible moment inside it rather than counting down from today.

### Schedule as built

| | |
|---|---|
| Reveal | 09.09.2026, 00:00 |
| Early Access | 11.09.2026, 09:00 |
| Public sale | 12.09.2026, 09:00 |
| Price advantage ends | 14.09.2026, 23:59 |

All times Europe/Berlin, which is **CEST (+02:00)** on these dates. The brief
says CET; the ISO offsets in `SCHEDULE` are the real local ones.

## Section order

1. Hero
2. Buy box
3. Trust: strictly limited · shipped insured · 60-day return
4. About the work
5. Handcrafted down to the finest detail
6. The artist
7. Rooms
8. In the galleries
9. Urgency: countdown and closing CTA

The old trust row (330,000 collectors · 19 galleries · 60-day returns) was
replaced by the new section at position 3. Its galleries claim moved into the
gallery section at 8, so nothing is said twice. The gallery section is
deliberately additive and carries a *secondary* CTA: the closing block right
after it holds the primary one, so the page never resolves a purchase intent
with "go to a gallery instead".

## Deliberate departures from the template, and why

**1. The hero type sits on the photograph over a measured scrim.**
The brand book (Performance Marketing → *Umgang mit Kunstwerken in visuellen
Assets*) asks for no darkening layer over an artwork or over a room containing
one, *even for text legibility*: „stattdessen Textposition ändern“. This build
first honoured that literally, with an opaque charcoal plate. That was overruled
on review: type on the image, with a light darkening layer where legibility
needs it. So the scrim is kept as small as it can be and still clear AA:

* it is **solved numerically, not chosen**. `check-hero-scrim.py` parses the
  gradient the browser actually paints, maps each lockup line back into source
  pixels, walks the band row by row taking the 95th-percentile brightness, and
  composites the alpha at that height. The published values are the
  lightest-*looking* ramp (lowest peak alpha) that clears AA with 12% to spare.
* above 1024px it is **masked horizontally** so it dies out before it reaches
  the sculpture. Measured result: **0–15% darkening ever lands on a work**, and
  0% on either framed picture at every width.
* the offer line was split into two short lines because as one line it ran to
  44.6% of the container at 1024px, past where the mask has to start fading —
  the mask then cut the ramp behind the type to 43% and no ramp could clear.

Two ramps, not one, because the portrait and landscape crops are different
photographs of the same room: below 768px the ramp is 32% tall and unmasked but
kept below the sculpture's base, and **0% darkening reaches the work**; from
768px up it is 56% tall and masked, and 15–20% reaches the work at its edge.

The portrait asset stops at 767px on purpose. In a 768×735 hero a 3:4 crop is
cropped *vertically*, which pushes the work's base to 77% of the container, 3%
above the type — measured, no ramp could then reach the type without washing
the work. Tablets get the landscape asset and its mask instead.

Re-run the script if the hero image is ever swapped: the numbers are tuned to
these exact pixels.

**9. The hero crop position is computed, not set.**
`object-position` was briefly `50% 100%` to put the darkest floor behind the
type, and it sliced the top off the sculpture on a wide, short window
(2000×1080). A fixed percentage cannot be right at every viewport shape, so
`setHeroCrop()` derives it from the work's own bounding box: the largest value
that still keeps the box in frame, which is the most floor available without
ever cropping the work. `check-hero-scrim.py` asserts the result, and reports the
air above and below. The CSS fallback if JS never runs is 30%, which holds up to
about 2560px wide.

**10. The isolated studio shot is cropped to the object.**
The master is 3:2 with the sculpture in the middle 47% of the width, which left
the work looking small between two wide grey margins. Measured object box is
x[366,1086] y[67,983] of 1536×1024; the crop is that plus 10% padding, and
`.work-block__art` carries the matching `aspect-ratio: 864/1024`, so `contain`
never letterboxes.

**11. Two real quotes, marked as quotes, and one claim left out.**
The about-the-work section pivots on „Wir Künstler sind Suchende", verbatim
from the interview on lumas.de/artist/rafael_neff/, and the paragraph after it
uses his own „wir probieren aus, wir werden zurückgeworfen". What is *not* there
is the origin-in-leftover-material story: „entstanden aus den Resten vergoldeter
Portraitplatten" is the Gold Leaves series on the same page, not Pillow No. 1,
so it is not claimed about this work. If the artist confirms a comparable origin
for the Pillows, it is a strong line and worth adding.

The pull quote carries German „…" marks (English „…" becomes “…”) rather than
relying on size alone, because at t-h4 on a centred axis it otherwise read as a
second headline. There is no hanging indent: measured in Utile Display at 26px
the German marks advance 0.405em and 0.391em, so the sentence sits 0.85px off
the centre axis in German and 0.34px in English, and hanging the opening mark
would have pushed it a visible 10px off the axis the display line sits on.
The quote, its attribution and the paragraph that unpacks it are one flex unit
with a 20px internal rhythm against the block's 32px, so it reads as the opening
of that thought instead of a floating third block.

**12. The artist-section quote is also real, and also not about this work.**
No statement about Pillow No. 1 was supplied. There *is* a published first-person
quote in the LUMAS artist interview, about his working method rather than this
sculpture: „Wenn ich eine Sache gefunden habe, arbeite ich so lange daran, bis
sie perfekt ist: die eine, richtige Ausdrucksform. Erst dann ist es Kunst."
It is used verbatim apart from one dash normalised to a colon, per the no-dash
rule. Source: lumas.de/artist/rafael_neff/, Interview tab. A quote about *this*
work would be better and is still worth asking the artist for.

**13. Awards and exhibitions are lifted from the artist page, not written.**
Both columns come from the Vita on lumas.de/artist/rafael_neff/. The awards list
is complete to 2005; the exhibitions column is explicitly labelled a selection,
because the full list runs to about thirty entries. Collections (DZ Bank,
Deutsche Bank, Berenberg, LBBW, Sparkassenverband Rheinland-Pfalz) are on the
artist page too and are available if a third column is ever wanted.

**14. The page ends on the CTA. There is no rail of other works.**
A nine-work Rafael Neff carousel used to close the page. It was removed: a drop
page has one job, and the last thing on the page should be the way to act on
it, not nine alternatives to it. The related-works job belongs to the PDP the
CTA points at. Its markup, CSS, tracking and translations were all taken out
rather than hidden, so nothing dead is left behind — see the section-order list
above for what the page is now.

**2. „JETZT KAUFEN“ is gone. Every CTA reads „WERK SICHERN“.**
The tonality chapter blacklists *Kaufen / Jetzt kaufen* and names
*Entdecken / Werk sichern* as the replacements. Same reason
*„zufriedene Kunden“* became *„zufriedene Sammler:innen“*, and the price
window is a *Vorzugspreis*, never a *Rabatt*.

**3. `ENDED` does not mean sold out, and the mechanic is stated four times.**
This drop is a price window, not a closing edition: after 14.09 the work stays
on sale at a higher price (CF & AR, 13.08.26). The page therefore calls it an
**Einführungspreis** (introductory price), not a Vorzugspreis, because the word
itself implies the price rises. "Three days, then higher" appears in the banner,
in the hero lockup, beside the price in the work panel, and in the closing
block. `ENDED` says „Der Einführungspreis ist beendet“, keeps a live `ZUM WERK`
CTA to the PDP, and never claims the edition has closed. The higher price is
**not** stated because no figure was supplied.

**4. The three „own it“ cards carry craft, not finishes.**
A sculpture has no LUMASEC/Artbox choice and no framing, so the cards are
surface / base / signature. Copy is the supplied product description verbatim
in substance. The third card shows the studio shot of four Pillows side by side,
which is the only image in the set that *evidences* the Unikatsedition claim
rather than asserting it: four pieces, four different forms.

**5. There is no certificate anywhere on the page.**
The feed records this variant as `edition_signature = signatur_ohne_zertifikat`
— signed, *no* certificate. The brief agrees ("signed by the artist with date
and edition number"). The reference build had a certificate card; reusing it
here would have invented a document that does not exist.

**6. "72H" is not used as an on-page duration claim.**
The campaign is named `ART DROP | 72H`, and 12.–14.09 is 72 hours as three
calendar days. The purchasable public window (12.09 09:00 → 14.09 23:59) is
62h59m. The page therefore says „Drei Tage“ and prints the dates, and the
countdown counts to the real end. Same decision as the previous build.

**7. Section 4 (voice) has no artist quote.**
None was supplied, and nothing may be put in Rafael Neff's mouth. The
inspiration section carries the editorial idea in LUMAS's own voice instead,
deliberately not marked up as a quotation.

**8. The hero image is the 1535px salon, not one of the 2752px renders.**
Chosen by geometry. The lockup sits lower-left and is ~365px wide at 1024, so it
collides with any composition whose subject starts before ~40% of the frame
width. Every render in the second delivery is 16:9 with the object at 31-37%,
and at desktop widths the hero crops those horizontally, magnifying the object
further into the corner: measured, the type landed on brass at rgb(240) and
needed a ~50% wash over the sculpture to be legible. The 3:2 salon shot has the
sculpture at 47.8% and clears at every width. Its cost is resolution, which is
listed under Open below. A 2560px export of *that* room, or any render with the
object right of centre, resolves it.

## Verified — measured numbers, not assurances

Run all three; the first two in this order (`check-hero-scrim.py` reads the
geometry `audit.js` writes):

```bash
node audit.js && python3 check-hero-scrim.py
node functional.js
```

Last run, German canonical, Chromium:

| Check | Result |
|---|---|
| Images | 20/20 load, including every carousel slide. 0 placeholders. |
| Horizontal overflow | 0px at 320 / 390 / 430 / 768 / 1024 / 1440 / 1920 |
| Hero lockup above the fold | 320×568, 390×844, 430×932, and the short desktop windows 768×700, 1024×700, 1440×800, 1920×900 — all clear |
| AA contrast (page) | 4 phases × {390, 1440} = 8 combinations, **0 failures**, minimum **5.19:1**. Large text judged at 24px, or 18.66px at weight ≥700. The hero lockup is excluded here and measured properly below. |
| AA contrast (hero, sampled pixels) | All four lockup lines at **7** widths clear, with the ramps solved to a 12% margin above AA. |
| Scrim over the artwork | **0%** below 768px, **15–20%** above it (the masked edge only). 0% on both incidental framed pictures at every width. |
| Type combinations | **10** at 390px, **12** at 1440px (target ≤12) |
| Countdown numeral width | All 100 digit pairs render at 33.59px (390px) and 80.63px (1440px) — zero spread |
| Carousel per view | rooms 1 everywhere (5 slides); works 1 / 1 / 1 / 3 / 4 / 5 / 5 at the seven widths, measured from rendered slide widths |
| English build | `translate-en.py` exits 0 |
| Fonts | `fontTools` name table on both shipped woff2 faces: no `Trial` string. Utile Display v1.302, TypeNetwork IDs 373473 / 373474. |
| Hero crop | The work is fully in frame at 320 / 390 / 430 / 768 / 1024 / 1440 / 1920, with 145px of air above it on phones and 20px at 1920. Asserted, not assumed. |
| Line breaks | No orphans and no widows at 320 / 390 / 430 / 768 / 1024 / 1440, measured from real line boxes with Ranges over the live text nodes. |
| Interaction (`functional.js`) | **16/16 pass.** Both carousels scroll on click and on ArrowRight and re-enable the prev button; the newsletter rejects an empty field with `aria-invalid` and swaps in the confirmation on a valid one; the burger toggles the drawer and `aria-expanded`; the dev switcher time-travels into each phase; the readiness meter reports zero missing assets; exactly one `<h1>`; `ENDED` still routes both CTAs to the PDP. |
| Published copy | Every referenced asset returns 200 from `onsite-alignment/pillow-no-1-art-drop/`, the GA4 figure is stripped, gate and `noindex` are injected. |

Three audit-harness bugs were found and fixed along the way, all of which had
been reporting green-looking nonsense:

* lazy carousel images never loaded, because the track has
  `scroll-behavior:smooth` (so assigning `scrollLeft` in a loop animates and
  never arrives) and because Chromium will not start a lazy load for a slide
  whose section is off-screen vertically;
* the generic contrast walker was compositing the hero type against `.proof`'s
  background *colour*, having no way to see the photograph — it now defers those
  four lines to `check-hero-scrim.py`, which is stricter, not laxer;
* the first line-break check wrapped every word in a span to measure it, which
  changes how `text-wrap: balance` distributes lines and reported a widow the
  browser was not rendering. It now measures with Ranges over the untouched
  text node.

Digit advances measured from the shipped `UtileDisplay-Regular.woff2`: `1` is
366 units against `6` at 528, on a 1000-unit em. Widest raw pair is 6+6 at
1.056em, hence `min-width:1.12em` on `.cd__num`.

### Not verified

- **iOS Safari `svh`.** The hero height uses `100svh` with a `100vh`
  fallback. Chromium honours `svh`, so the fold numbers above are correct
  there, but the specific iOS toolbar behaviour the fallback exists for has
  not been reproduced on a real device.
- **Real-device rendering of the licensed faces.** Verified in Chromium only.
- **The 330.000 figure** in the trust row is carried over from the previous
  approved build. It was not re-sourced.

## Open before launch

- **No artist quote was supplied.** The voice section works without one, but a
  real Neff quote would strengthen it.
- **No portrait room render was supplied.** `hero-room-portrait.jpg` is a 3:4
  crop of the salon landscape master, cut by `prepare-assets.py` at 36.5% of the
  width. It serves every viewport below 1024px. A real portrait render should
  replace it — and if it does, re-run
  `node audit.js && python3 check-hero-scrim.py`, because the scrim is tuned to
  these exact pixels.
- **Hero resolution: 1535px.** A full-bleed desktop hero wants ~2880px for a 2×
  display. The second delivery has 2752px renders but none of them works
  compositionally as a hero (see departure 8). An unsharp mask (r 1.2 / 115% /
  t 3) is applied on the way out, which helps the resampled edges read cleaner
  but cannot add detail. Ask for a 2560px+ export of the salon room, or a render
  with the object right of centre. The buy-box shot gets a lighter pass
  (r 1.0 / 95% / t 3) for the same reason: 864px native in a ~700px column.
- **No photograph of the signature exists.** Neither delivery includes a
  close-up of a signed base, so the third craft card sets the edition mark in
  type (`Rafael Neff · 2026 · Nr. ___ / 999`) rather than showing one. A
  rendered signature would be a fabricated artefact. **Asset request: one macro
  of the signature and edition number on the smoked oak base.**
- **Two slides in the rooms slider need their base retouched.** Six of the
  eleven renders were cut for deformed geometry. Two more have a wrong base and
  are back in the deck at the client's request, to be edited: `RNE_img_03`
  (slide 2) renders the smoked oak pale blond, and `RNE_img_01` (slide 5)
  renders it two-tone with one near-white face. `prepare-assets.py` measures
  every render's base against the studio reference on each run and prints the
  delta, so re-running it after an edit is also the check. It judges colour
  only: the sample boxes take in some of the surrounding table or floor, so the
  light-to-dark spread it also prints is information rather than a verdict, and
  a two-tone base still needs an eye.
- **`detail-edition.jpg` is a screen grab.** The source file is
  `Screenshot 2026-08-26 at 10.04.40 1.jpg`, 2170×1198. It is the best evidence
  on the page for the Unikatsedition claim, so it is used — but confirm a proper
  master exists before launch.
- **`SOLD_COUNT = null`.** The scarcity bar stays hidden until a real stock
  feed is wired in. It must never render an invented number.
- **The post-drop price is unknown.** The page says the price rises without
  naming a figure. If a figure exists, add it.
- **New copy needs sign-off:** the hero editorial line, the „Über das Werk“
  section, the rooms headline, and the condensed artist bio (which is
  shortened from lumas.de/artist/rafael_neff/, not newly written).
- **The brief's „Live (silent): Friday 11.09. (5PM)“ line is not modelled.**
  The page has one purchasable boundary on the 11th: Early Access at 09:00, per
  the brief's own Early Access line. If 17:00 is a separate gate (page live but
  quiet, mail sent later), say which and `SCHEDULE.earlyAccess` moves.
- **`production_days = 70`** is in the feed. It is deliberately not on the
  page: it is a production figure, not a delivery promise.

## Two data discrepancies worth checking

1. **US price.** The brief says *CH, US: 2250*. The feed says CH = **2250 CHF**
   ✓ but `com` (US) = **2550 USD**. One of the two is stale.
2. **Go-live timestamp.** The brief says *Artikel live stellen 11.09. 08:00*.
   The PIM has `published_at` = **10.09.2026 00:00 CEST** on `RNE319`, a day
   and eight hours earlier.

Everything else in the brief reconciles with the feed: price 1.950 € (EK
1.228,99), `copies_total` 999, 440 × 440 mm, technique Messing, category
Sculptures, status `coming_soon`.

## Other markets

The page is one market. The prices for the rest, read from the feed on
2026-08-26, so a per-market build is a find-and-replace plus a link swap:

| Market | Price |
|---|---|
| DE, AT, FR, EU, HU | 1.950 € |
| UK | £1,990 |
| CH | CHF 2.250 |
| COM / US | $2,550 (brief says 2250 — see above) |

Franchise purchase price (`PrintBrutto_ek`): **1.228,99 €**.
`Discountable: NO` is an operational flag; it is not stated on the page.

## Delete before launch

- The `phaseSwitch` JS block and the `.phase-switch` CSS rule (review only).
- The `?dev=1` switcher block, if it should not ship.
- The GA4 scroll-depth figure in the TRUST section comment — `publish.py`
  strips this automatically and fails loudly if it cannot find it.

## Publishing

```bash
python3 translate-en.py && python3 publish.py
```

Writes to `~/lumas-prototypes-share/onsite-alignment/pillow-no-1-art-drop/`
as `index.html` (German) and `en.html`, injects the access gate and `noindex`,
strips the internal metric, and re-encodes the photography at quality 70 with
per-image width caps. It then prints the `index.html` entry to paste into the
onsite-alignment listing — that step is manual on purpose, because the listing
is grouped by session and shared with other pages.

## Local review

```bash
python3 -m http.server 8947 --directory .
```

Then <http://localhost:8947/pillow-art-drop.html?dev=1>.
