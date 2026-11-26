# Penguins in Japan — LUMAS Christmas Art Drop landing page

Single-file landing page for **Penguins in Japan** by **Robert Jahns**
(SKU `RJA63`, SAP `1300-000010-RJA63`, abstract `20074`).
Market: lumas.de, German canonical, EUR. **DE only.**

Source brief: [LUMAS-16650](https://lumas.atlassian.net/browse/LUMAS-16650)
("ART DROP Robert Jahns | RJA | December 2026").

It is a landing page that links to the PDP. It is not a PDP.

**PDP:** <https://www.lumas.de/pictures/robert_jahns/penguins_in_japan/>
(published 21.12. 03:00, deactivated 23.12. 00:00 — see *Phases*)

Built on the Pillow No. 1 / Alice art-drop template. What changed and why is in
*Deliberate departures* below.

## Files

| File | |
|---|---|
| `penguins-art-drop.html` | **Canonical.** German. Edit this one. |
| `penguins-art-drop-en.html` | Build artefact. English review copy. Do not hand-edit. |
| `translate-en.py` | Regenerates the English file from the German. Exits non-zero if any German survives. |
| `prepare-assets.py` | Fetches the artwork and writes the twelve placeholder panels. |
| `audit.js` | The measured checks. `node audit.js [url]` → `audit-report.json`. |
| `functional.js` | Interaction checks: carousels, newsletter, drawer, dev clock, phase routing. |
| `check-hero-scrim.py` | Proves the hero scrim against real pixels. **Refuses to run** while the hero is a placeholder. |
| `fix-typography.py` | Binds line breaks so no line orphans a short word and no paragraph widows. Run after any copy edit. |
| `publish.py` | Working copy → published copy: gate injection, metric stripping, photo re-encode. |
| `lumas-fonts.css` + 4 `UtileDisplay-*` files | Licensed TypeNetwork faces (IDs 373473 / 373474). |
| `work-penguins.jpg` | The real artwork, 1600×1200, uncropped. |
| 12 other `*.jpg` | **Placeholders.** Every one must be replaced before launch. |

Regenerate English after any German change (this also re-applies the line-break
binding to both files):

```bash
python3 fix-typography.py penguins-art-drop.html && python3 translate-en.py
```

Re-derive the artwork and the placeholder panels:

```bash
python3 prepare-assets.py
```

## The placeholders

The rooms are being supplied separately, so twelve assets are labelled panels
rather than photographs. They carry the slot name and the exact pixel size the
real file should arrive at, and the markup marks each one with
`data-standin="<filename>"`, which `audit.js` asserts as an exact set: a missing
name means an asset was quietly dropped, an extra one means a real photograph
got replaced by a panel.

| File | Size | Slot |
|---|---|---|
| `hero-room.jpg` | 1920×1080 | full-bleed hero, ≥768px |
| `hero-room-portrait.jpg` | 1152×1536 | hero, ≤767px (behind `<source media>`) |
| `room-01.jpg` … `room-05.jpg` | 1800×1200 | the five hangings in the rooms carousel |
| `detail-acrylic.jpg` | 1200×800 | acrylic-glass edge |
| `detail-edge.jpg` | 1200×800 | frameless edge against the wall |
| `detail-signature.jpg` | 1200×800 | signature and edition number |
| `artist-portrait.jpg` | 1600×1200 | artist portrait, stacked layout |
| `artist-portrait-tall.jpg` | 1100×1650 | artist portrait, ≥1024px (behind `<source media>`) |

The two hero panels are **dark**; the other ten are bone. That is deliberate:
the hero lockup is light type over a scrim, so a bone panel there would render
the review copy as white on cream and read as a broken page rather than as a
missing asset. It is not a claim about how dark the real room will be.

**The alt text on the room slides is generic** ("Penguins in Japan, rahmenlos an
der Wand eines Wohnraums"). Rewrite one per room when the photographs land, in
both `penguins-art-drop.html` and the map in `translate-en.py`.

## Phases

One constant drives the whole page: `PHASE` =
`ANNOUNCE` | `EARLY_ACCESS` | `PUBLIC` | `ENDED`. Override per URL:

```
penguins-art-drop.html?phase=PUBLIC
penguins-art-drop.html?dev=1          # phase switcher + readiness meter
```

`?dev=1` also time-travels the clock, so previewing a phase previews a plausible
moment inside it rather than counting down from today.

### Schedule as built

| | | from the brief |
|---|---|---|
| Page live (ANNOUNCE) | 20.12.2026, 17:00 | "Onsite live: 20.12. \| 5pm" |
| Early Access | 21.12.2026, 08:00 | "Early Access: 21.12.26 \| 8am for all RJA customers in Germany" |
| Public sale | 21.12.2026, 12:00 | "official sale: 21.12.26 \| 12 noon" |
| Sale ends | 22.12.2026, 23:59 | "Sale Periode: 21.12. (05:00) - 22.12.2026 (23:59) CET" |

All times Europe/Berlin, which is **CET (+01:00)** in December, so the ISO
offsets and the brief's "CET" agree.

**There is no REVEAL phase.** The brief says "Reveal: ❌", so the first phase is
named `ANNOUNCE`: the page is live, the work is shown and the dates are stated,
but nothing is buyable and the PDP does not exist yet. The only action offered
is the Early Access signup.

## Section order

1. Hero
2. Buy box
3. Trust: strictly limited · shipped insured · 60-day return
4. About the work
5. One execution, made by hand
6. The artist
7. Rooms
8. Urgency: countdown and closing CTA
9. More works by the artist

## Deliberate departures from the template, and why

**1. The mechanic is inverted: `ENDED` means gone, not "cheaper window over".**
The Pillow drop was a price window, so its `ENDED` kept a live CTA to a work
that was still for sale. This one closes for good: the brief says "Once the
window closes, the artwork will no longer be available", and the feed backs it
with `deactivate_at = 2026-12-23 00:00:00`. So every "Einführungspreis /
danach steigt der Preis" string is gone, and in `ENDED` the page carries **no
buy CTA and no PDP link at all** — the onward route is the works rail at the
foot of the page. `functional.js` asserts exactly that, which is the inverse of
the assertion it carried on the previous build.

**2. No PDP link before 21.12. either.** The feed has
`published_at = 21.12.2026 03:00` and `deactivate_at = 23.12.2026 00:00`, so the
article exists only during `EARLY_ACCESS` and `PUBLIC`. The "MEHR DETAILS"
button is scoped to those two phases, and `functional.js` asserts no PDP link is
reachable in `ANNOUNCE` or in `ENDED`.

**3. "48H" is not used as an on-page duration claim.** The campaign is named
`ART DROP – 48H ONLY` and the shop's own product description opens with that
line, but 21.12. 12:00 → 22.12. 23:59 is **35h59m** of public sale, or 39h59m
counting Early Access. The page therefore says „Nur zwei Tage" and prints
„21.–22. Dezember" everywhere, and the countdown counts to the real end. Same
decision as the Pillow build's "72H". **The PDP will still say 48H ONLY**, so the
two surfaces will differ in that one phrase — worth a decision before launch.

**4. The price is „€ 299", currency first.** Brandbook s14, valid from
October 2026: the currency sign goes before the number with a space, no
decimals, German thousands separator. The template predates that rule and wrote
„1.950 €". The feed agrees with the brief's 299 figure: `DefaultFrame1Brutto` =
299. The print-only price of 150 is **not** shown, because `no_print = true` on
this variant — the bare print is not orderable, so 299 is the entry price, not
an "ab" price.

**5. There is exactly one execution, so the three cards describe it rather than
offering a choice.** `no_print` and `no_individual_frame` are both true, so
there is no finish to pick and no frame to choose. The cards are acrylic glass /
frameless / signature. Choosing anything still happens on the PDP, not here.

**6. The certificate is back.** `edition_signature = signatur`, which in the
feed taxonomy is hand-signed **with** a certificate. The Pillow build had to drop
the certificate card because that variant was `signatur_ohne_zertifikat`.

**7. The gallery section is not here.** The work does sell offline
(`is_pos = true`, Gallery sales channel, and Vienna has ordered five), but this
page has a two-day window: a "come and see it in a gallery" CTA inserts a
multi-day step into a sale that cannot wait, and competes with the only action
that can complete inside the window. Brandbook s14 makes the same call for paid
assets ("kein Verweis auf einen Galeriebesuch, keine Merkliste als
Call-to-Action: Beides schiebt Schritte zwischen Interesse und Kauf"). **Say so
if the offline channel should be supported here** and it goes back in, after the
closing CTA. Its CSS was removed with it.

**8. The hero scrim, the hero crop and the hero contrast are UNVERIFIED.**
`HERO_ART` is `null`, `setHeroCrop()` returns early, and `check-hero-scrim.py`
refuses to run and prints what to do instead. The ramp and mask values in the
stylesheet are inherited from the Pillow build and are tuned to *those* pixels;
they must be re-solved against the delivered photograph. Everything that script
normally reports — how much darkening lands on the artwork, whether the cover
crop keeps the work fully in frame, the per-line contrast on the photograph — is
open until then.

**9. The works rail box ratio is 1.338, re-measured.** Measured pixel ratios of
the nine chosen works are 1.278 to 1.338, so the box is as wide as the widest
work at full height: every work fills the box height and only its width varies,
nothing cropped, nothing letterboxed, no colour behind the art. **Paris
Balloons III** (`RJA60`) and **Brooklyn Bridge Tulips** (`RJA21`) are portrait at
0.750 and would leave a third of the box empty, so they are out. The `RJA4xx`
(Petites) and `RJA9xx` (Darlings) SKUs repeat motifs already in the rail and are
also out.

**10. The buy-box image is the artwork at its true ratio.** `work-penguins.jpg`
is `showimg_rja63_full.jpg`, 1600×1200, written out with its geometry untouched,
and `.work-block__art` carries `aspect-ratio: 4/3` so `contain` never
letterboxes. Nothing on the page crops the artwork.

**11. The artist CV has no exhibitions column.** The Vita on
lumas.de/artist/robert_jahns/ carries awards and no exhibitions or collections,
so the second column holds facts (Hamburg, technique, series, the Shorty Awards
finalist place) rather than an invented exhibition list.

**12. Both quotes are real and attributed.** „Meine Kunst finde ich in meinen
Gedanken und meiner Leidenschaft." and „In meinen Werken stecken viele Emotionen
und in jeder neuen Kreation steckt ein Stück meiner Seele." are verbatim from
the Interview tab on lumas.de/artist/robert_jahns/. The sentences around them
about his method (the idea visualised first, colour carrying the mood)
paraphrase his own answers on that page and claim nothing about *this* work that
he did not say about his work in general.

**13. No scarcity bar.** `SOLD_COUNT` is `null`, so the block stays hidden. The
feed carries `copies_available_sap = 148`, `reservedItemCount = 342` and
`soldCounter90days = 336` on an unreleased article; those are pre-production and
reservation counters, they do not reconcile with each other (342 + 148 > 400),
and none of them may drive a public "x von 400 verkauft" bar.

**14. No extra urgency layer.** Brandbook s14: „Trägt das Angebot bereits
Dringlichkeit in sich (festes Enddatum, auslaufende Edition), wird keine
zusätzliche Dringlichkeitsebene ergänzt." A two-day window on a 400-piece
edition is already the urgency, so there is one countdown and no second device.

**15. The review-only phase switch moved to the top of the hero on phones.**
Fixed bottom-right, it landed on the dates line of the bottom-left lockup.
Raising the lockup is not an option: it would lift the eyebrow off the scrim
band. It is deleted with the rest of the review chrome before launch anyway.

## Verified — measured numbers, not assurances

```bash
node audit.js "file://$PWD/penguins-art-drop.html"
node functional.js "file://$PWD/penguins-art-drop.html"
```

If the pinned Playwright in `tests/e2e` wants a browser revision that is not
installed, set `CHROME_PATH` to an installed headless shell; both scripts honour
it.

Last run, German canonical, Chromium:

| Check | Result |
|---|---|
| Images | **20/20 load**, including every carousel slide. 11 local + 9 remote catalogue shots. |
| Local assets decode | **13/13**, breakpoint-only ones included (the ≤767 hero portrait and the ≥1024 artist portrait). |
| Placeholder set | **12/12 expected stand-ins present**, none missing, none unexpected. |
| Horizontal overflow | **0px** at 320 / 390 / 430 / 768 / 1024 / 1440 / 1920 |
| Hero lockup above the fold | 320×568, 390×844, 430×932, and the short desktop windows 768×700, 1024×700, 1440×800, 1920×900 — all clear |
| AA contrast (page) | 4 phases × {390, 1440} = 8 combinations, **0 failures**, minimum **5.19:1**. Large text judged at 24px, or 18.66px at weight ≥700. |
| Line breaks | **No orphans and no widows** at 320 / 390 / 430 / 768 / 1024 / 1440, measured from real line boxes. |
| Type combinations | **11** at 390px, **12** at 1440px (target ≤12) |
| Countdown numeral width | All 100 digit pairs render at 33.59px (390px) and 80.63px (1440px) — zero spread |
| Carousel per view | rooms 1 everywhere (5 slides); works 1 / 1 / 1 / 3 / 4 / 5 / 5 at the seven widths, measured from rendered slide widths |
| English build | `translate-en.py` exits 0 |
| Interaction (`functional.js`) | **19/19 pass.** Both carousels scroll on click and on ArrowRight and re-enable the prev button; the newsletter rejects an empty field with `aria-invalid` and swaps in the confirmation on a valid one; the burger toggles the drawer and `aria-expanded`; the dev switcher time-travels into each phase; exactly one `<h1>`; `ENDED` shows no buy CTA, no PDP link and routes to the works rail; `ANNOUNCE` links nowhere near the unpublished PDP. |

### Not verified

- **The hero.** Scrim, crop and per-line contrast on the photograph are all
  open until a real room is delivered. See departure 8.
- **iOS Safari `svh`.** The hero height uses `100svh` with a `100vh` fallback.
  Chromium honours `svh`, so the fold numbers above are correct there, but the
  iOS toolbar behaviour the fallback exists for has not been reproduced on a
  real device.
- **Real-device rendering of the licensed faces.** Verified in Chromium only.

## Open before launch

1. **The Christmas delivery question, and it is the big one.** The drop runs
   **after** every published order deadline: LUMAS-14954 sets the DE extended
   deadline at **20.12. 23:59**, and its phase 5 (21.–25.12.) is galleries and
   vouchers, not home delivery. LUMAS-16650 says WWM pre-produces the artworks
   "allowing us extend the deadline for this one product", but it states **no
   delivery promise and no date**. The page therefore makes **no delivery claim
   at all**. If operations can commit to one, it is almost certainly the
   strongest line on the page and belongs in the buy box and the closing block.
   If they cannot, the page is correct as it stands. **This needs an answer
   before launch either way.**
2. **Every one of the twelve placeholders.** See the table above.
3. **Format orientation.** The brief says "Format: 60 x 80 cm"; the feed says
   `width 800 × height 600` mm and the artwork is landscape. The page prints
   **80 × 60 cm**. Confirm the brief is just H×W.
4. **Go-live timestamp.** The brief says "publish the products: 21.12.2026 |
   5am"; the feed has `published_at` = **21.12.2026 03:00 CET**, two hours
   earlier. Same class of discrepancy as the Pillow build's.
5. **"48H ONLY" on the PDP vs "Nur zwei Tage" here.** See departure 3.
6. **The gallery channel.** The brief flags "ACHTUNG: Sales Channel: DE =
   Online+Offline" and Vienna has ordered five pieces, but there is no gallery
   section on this page. See departure 7.
7. **Pricing confirmation.** The brief asks Christoph Bamberg to confirm. The
   feed agrees on DE 299 and on the franchise price 200,33. Other markets in the
   brief (UK/CH/US 329, HU 349, CA 470) are not on this page — DE only.
8. **New copy needs sign-off:** the hero lockup lines, the „Über das Werk"
   section, the three execution cards, the rooms headline and the condensed
   artist bio (shortened from lumas.de/artist/robert_jahns/, not newly written).
9. **The artist page's "World's Leading Modern Digital Artist" line is not
   used.** It is an award title he holds, but brandbook s14 restricts leadership
   claims, so it is left to the Vita rather than put in a headline. Say if it
   should appear.
10. **Review chrome to delete before launch:** the `phaseSwitch` JS block and
    the `.phase-switch` CSS rules (two of them now), and the `?dev=1` switcher
    block if it should not ship.

## Other markets

This page is DE only, per the brief. The other prices in the brief, for
reference: DE/AT/FR/EU **€ 299** · UK/CH/US **329** · HU **349** · CA **470** ·
franchise purchase price **200,33**. The feed carries `discountable = false`;
that is an operational flag and is not stated on the page.
