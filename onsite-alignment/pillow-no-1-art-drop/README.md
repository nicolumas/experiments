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
| `prepare-assets.py` | Derives the JPEG set (and the portrait hero crop) from the studio PNGs in `../`. |
| `audit.js` | The measured checks. `node audit.js [url]` → `audit-report.json`. |
| `functional.js` | Interaction checks: carousels, newsletter, drawer, dev clock, ENDED routing. `node functional.js`. |
| `check-hero-plate.py` | Proves the hero type plate never covers an artwork. Reads `audit-report.json`. |
| `publish.py` | Working copy → published copy: gate injection, metric stripping, photo re-encode. |
| `lumas-fonts.css` + 4 `UtileDisplay-*` files | Licensed TypeNetwork faces (IDs 373473 / 373474). |
| `*.jpg` | Room shots, the studio shot, three craft details. |

Regenerate English after any German change:

```bash
python3 translate-en.py
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

## Deliberate departures from the template, and why

**1. No hero scrim. The lockup sits on an opaque charcoal plate.**
The brand book (Performance Marketing → *Umgang mit Kunstwerken in visuellen
Assets*) forbids darkening or lightening layers over an artwork, or over a room
containing one, *even for text legibility*: „stattdessen Textposition ändern“.
A bottom-up gradient over a room shot is exactly that layer. So the photograph
ships untouched and the type sits on a solid `--surface-inverse` plate placed
where the picture carries floor, wall and plinth. Two consequences: contrast is
deterministic (`#F4EDE2` on `#1C1A18` = 13.98:1) instead of dependent on the
pixels behind each line, and the plate position has to be proven rather than
eyeballed — that is what `check-hero-plate.py` does.

**2. „JETZT KAUFEN“ is gone. Every CTA reads „WERK SICHERN“.**
The tonality chapter blacklists *Kaufen / Jetzt kaufen* and names
*Entdecken / Werk sichern* as the replacements. Same reason
*„zufriedene Kunden“* became *„zufriedene Sammler:innen“*, and the price
window is a *Vorzugspreis*, never a *Rabatt*.

**3. `ENDED` does not mean sold out.**
This drop is a price window, not a closing edition: after 14.09 the work stays
on sale at a higher price (CF & AR, 13.08.26). So `ENDED` says
„Der Vorzugspreis ist beendet“, keeps a live `ZUM WERK` CTA to the PDP, and
never claims the edition has closed. The higher price is **not** stated on the
page because no figure was supplied.

**4. The three „own it“ cards carry craft, not finishes.**
A sculpture has no LUMASEC/Artbox choice and no framing, so the cards are
surface / base / signature. Copy is the supplied product description verbatim
in substance.

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

## Verified — measured numbers, not assurances

Run all three; the first two in this order:

```bash
node audit.js && python3 check-hero-plate.py
node functional.js
```

Last run, German canonical, Chromium:

| Check | Result |
|---|---|
| Images | 17/17 load. 1 deliberate placeholder (artist portrait). |
| Horizontal overflow | 0px at 320 / 390 / 430 / 768 / 1024 / 1440 / 1920 |
| Hero lockup above the fold | 320×568, 390×844, 430×932 — plate bottom lands exactly on the fold at all three |
| AA contrast | 4 phases × {390, 1440} = 8 combinations, 63–82 text nodes each, **0 failures**, minimum **5.19:1** (`--text-tertiary` on charcoal). Large text judged at 24px, or 18.66px at weight ≥700. |
| Hero plate vs artwork | 5 widths, minimum clearance **63 CSS px** (at 390px); 152–268px on desktop. Plate covers no work at any width. |
| Type combinations | **10** at 390px, **12** at 1440px (target ≤12) |
| Countdown numeral width | All 100 digit pairs render at 33.59px (390px) and 80.63px (1440px) — zero spread |
| Carousel per view | rooms 1 everywhere; works 1 / 1 / 1 / 3 / 4 / 5 / 5 at the seven widths, measured from rendered slide widths |
| English build | `translate-en.py` exits 0, and the English file passes the same audit with identical numbers |
| Fonts | `fontTools` name table on both shipped woff2 faces: no `Trial` string. Utile Display v1.302, TypeNetwork IDs 373473 / 373474. |
| Interaction (`functional.js`) | Both carousels scroll on click and on ArrowRight and re-enable the prev button; the newsletter rejects an empty field with `aria-invalid` and swaps in the confirmation on a valid one; the burger toggles the drawer and `aria-expanded`; the dev switcher time-travels (PUBLIC previews 12.09 12:00, countdown 02 TAGE 11 STD 59 MIN); exactly one `<h1>`; `ENDED` still routes both CTAs to the PDP. **16/16 pass.** |
| Published copy | Every referenced asset returns 200 from `onsite-alignment/pillow-no-1-art-drop/`, the GA4 figure is stripped, gate and `noindex` are injected. Folder 1.4MB. |

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

- **No artist portrait was supplied.** Section 4 renders a visible
  `⚠︎ Platzhalter` block, 4:5. It must not ship as-is.
- **No artist quote was supplied.** The section works without one, but a real
  Neff quote would strengthen it.
- **No portrait room render was supplied.** `hero-room-portrait.jpg` is a 3:4
  crop of the Paris landscape master, cut by `prepare-assets.py` at x=560.
  It serves every viewport below 1024px. A real portrait render should replace
  it — and if it does, re-run `node audit.js && python3 check-hero-plate.py`,
  because the plate clearance is asset-specific.
- **Hero resolution.** The studio masters are ~1535px wide. A full-bleed
  desktop hero wants ~2880px for a 2× display. Ask for a larger master.
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
