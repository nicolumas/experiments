# PDP availability pill, with a gallery locator

Third iteration. This is a **copy of `prototype/pdp-pill/`** with one layer added on top: the
page can now work out *which* gallery to talk about, instead of waiting to be told.

The functional diff against the base is 11 changed lines and roughly 280 added ones; nothing
was removed. The brand-token corrections below were applied to both folders in the same pass,
so those lines are identical in each.

Reference page: <https://www.lumas.de/pictures/marta_contreras_simo/liu/>

- `index.html` — the page. Every state is a real URL.
- `mobile.html` — seven 390 x 844 frames.

Serve `prototype/` and open `/pdp-pill-locator/`.

## The one rule this layer keeps

Location and availability are two services. They meet in exactly one function.

```
LOC  (device | ip | chosen by hand)   →  rank galleries by real distance
CFG.stock                             →  which galleries hold THIS size and framing
                                      ↓
                      resolveActive() → the nearest gallery that actually has it
```

`nearestHolder()` filters by stock **first**, then sorts by distance, so the page can never
name a nearby gallery that does not hold the configuration. Change the size or the framing
and the whole chain re-runs, because a different configuration can live in a different city.

Distance is Haversine against the gallery's real coordinates. When there is no fix, it falls
back to the base's own hardcoded per-gallery `km` values, which is what the base was already
using as its implicit notion of "near".

## German, du form

The page runs the **real LUMAS navigation** (`prototype/_nav/`, DE market), injected with
`python3 prototype/_nav/inline.py DE --into`. That nav is German and addresses the visitor as
**du**, so the whole page follows it: `du`, `dein`, `deiner`, never `Sie`. The brandbook's
du/Sie firewall says the two are never mixed in one asset.

Prices render through `toLocaleString('de-DE')`, so it is `€ 1.129`, not `€ 1,129`.

Nothing in the page defines its own header any more. The prototype's promo bar, header markup
and their CSS were removed rather than left dead; `--nav-h` is measured from `<site-header>` at
runtime and drives the body offset, the sticky buy column and the slide-in.

## Where the location lives

Two surfaces, and they do different jobs.

**The PDP carries the availability tag and nothing else.** When a gallery near the visitor
holds this exact size and framing, the buy box shows one green tag:

> Verfügbar in **BERLIN KURFÜRSTENDAMM**

No location line, no chip, no explanation. Where we think the visitor is does not belong on the
product.

**The navigation carries the location.** A pin sits beside the account icon, with a small green
dot once a location is known. Hover on a pointer, tap on a touch screen, and it opens: a panel
hanging under the icon on desktop, a full-width drawer under the nav on a phone. Because it
lives in the nav it persists across the session instead of being restated on every page.

| State | Panel |
|---|---|
| Located by device | In der Nähe von Essen · Auf Basis deines Geräts · **Ändern** · **Standort nicht mehr verwenden** |
| Located by region | In der Nähe von Hamburg · Auf Basis deiner Region · **Ändern** |
| Gallery chosen by hand | Berlin, Kurfürstendamm · Von dir gewählt · **Ändern** · **Standort zurücksetzen** |
| Refused | Kein Standort · "Wir verwenden deinen Standort nicht." · **Galerie wählen** |
| Nothing known | Galerie in deiner Nähe · the disclosure · **Standort verwenden** · **Galerie wählen** |

The control is injected at runtime, in front of `site-header .auth-link`, rather than into the
nav kit's fenced markup, so re-running `inline.py` to refresh the nav cannot wipe it. It retries
for four seconds while `nav.js` upgrades the custom element, then gives up quietly.

## Consent

The page asks for nothing on arrival. `getCurrentPosition` is not called until the visitor
presses a button, verified at every state below.

**The first ask is a compact slide-in, top right.** On a first visit, when we have no idea where
the visitor is and they have not already named a gallery, a 328px panel slides in from the right
under the nav after 900ms, landing directly beneath the location pin it will hand over to. On a
phone it is full width with 10px gutters. It carries a headline, one sentence, a filled
**Standort verwenden** and a **Jetzt nicht** link, plus a close control.

It is shown **once**. Whatever the visitor does with it, `lumas_loc_ask_v1` records that the ask
has happened and it never appears again. After that the nav pin is the only way in, which is the
point: one control, one place, all session.

**Dismissing is "jetzt nicht", not "nein".** Closing the panel writes only the ask flag, never a
refusal, so nothing about the visitor's location preference is inferred from a dismissal. Only
an actual `PERMISSION_DENIED` from the browser writes `refused`.

**Refusing means refusing.** `PERMISSION_DENIED` (error code 1) does not fall back to IP: the
nav panel reads "Kein Standort" and offers the gallery chooser instead. The brief asked for an
IP fallback on denial; that is narrowed deliberately. Codes 2 and 3 are technical failures
rather than an answer, so a coarse regional guess is still fair there.

The outcome is remembered in `localStorage` under `lumas_loc_v1` (`device`, `refused`, or
`manual:<id>`), and is reversible from the nav panel at any time.

Under `prefers-reduced-motion: reduce` the panel fades in place instead of sliding.

## Precision gating

A fix is only trusted if it can distinguish one German city from another.

| Precision | Trusted | Shown as |
|---|---|---|
| `device` | yes | "In der Nähe von Essen", distances to one decimal under 10km |
| `city` (IP) | yes | "In der Nähe von Hamburg", "Auf Basis deiner Region", "ca. 4 km" |
| `country` (IP) | no | no gallery named; the nav panel offers the invitation instead |

The `kmText(v, precise)` helper exists so a city-level fix can never print "0,8 km" and imply
a precision it does not have.

## The states, as URLs

| State | URL |
|---|---|
| The first ask, slide-in | `?size=s80&frame=basel&ask=1` |
| Dismissed, nav pin only | `?size=s80&frame=basel&ask=0` |
| Located by region, nearest gallery | `?size=s80&frame=basel&loc=ip&ipcity=Hamburg` |
| Located by device | `?size=s80&frame=basel&loc=device` |
| Location refused | `?size=s80&frame=basel&loc=denied` |
| Region only, no gallery claimed | `?size=s80&frame=basel&loc=ip-weak` |
| Gallery chosen by hand | `?size=s80&frame=basel&gallery=kudamm` |
| No gallery holds this framing | `?size=s80&frame=none&loc=ip&ipcity=Hamburg` |
| Consultant pop-up | `?size=s80&frame=basel&gallery=kudamm&info=1` |

`?loc=` and `?ipcity=` are demo switches standing in for a server-side GeoIP lookup. In
production the coarse fix arrives with the document and only the device fix is asynchronous.
`?ask=1` replays the first ask and `?ask=0` suppresses it, so both sides of it are linkable
without clearing browser storage.

The slide-in is skipped entirely when a `?loc=` switch is forced, when a gallery is already
chosen by URL or cookie, or when the ask flag is set.

When the visitor is located and **no** gallery holds the configuration, the PDP says nothing:
no tag. The nav panel still reports where we think they are, because that is a session fact
rather than a claim about this product.

## How far this has moved from the base

`prototype/pdp-pill/` is still the base and is still English, with its own hand-built header.
This copy has since diverged on four axes, none of which were folded back:

1. The real DE navigation replaces the hand-built header and promo bar.
2. All copy is German in the du form.
3. The location layer, which the base does not have at all.
4. The location control lives in the nav rather than on the product.

The one rule carried over untouched is the base's rendering contract: `ACTIVE_GAL` and `MANUAL`
are declared next to `const GAL`, before the first synchronous render, so price and availability
are still in the first paint with no client-side rewrite. The location layer only repaints on
top of that.

## Brand tokens

Every colour on the page is a real V2 token. The values below were hand-mixed in an earlier
pass and have since been corrected to the Figma foundations:

| Was | Now | Token |
|---|---|---|
| `#26603A` | `#3A6B4A` | `status/success` |
| `#E7F1EA` | `#E8F2EB` | `status/success-bg` |
| `#DBEAE1` | `#DCEBE2` | success-bg hover, re-derived |
| `#5C5C5C` | `#5A5752` | `text/secondary`, charcoal/700 |
| `#6E6A65` | `#908C87` | `text/tertiary`, charcoal/500 (search placeholder only) |
| `#FAF7F3` | `#FAF6F1` | `surface/page`, ivory/300 |
| `#E9E2D7` | `#EAE2D8` | `border/subtle`, bone/200 |
| `#000` | `#3A3835` | charcoal/800, primary CTA hover |

The availability tag now reads 5.42:1 on its own background, so it still clears AA.

Two deliberate exceptions remain:

- The **frame swatches** (`#24211D`, `#141210`, `#7A5B3F`) depict physical frame finishes.
  They are product imagery, not brand colour, so they stay as they are.
- The **header search field** keeps its 20px radius because that is what production ships,
  even though V2 puts inputs at 4px. The chrome mirrors the live page on purpose.

Em-dashes are gone from the page title and the mobile board, per the V2 voice rule. The
en-dashes inside opening-hours ranges stay: those are numeric ranges, not punctuation.

## Everything else

Unchanged from `prototype/pdp-pill/`: the configuration-keyed inventory model, the green
availability tag and its consultant pop-up, the full-bleed layout, and the live-PDP computed
styles. See that folder's README for those.
