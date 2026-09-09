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

## Consent

The page asks for nothing on arrival. `getCurrentPosition` is not called until the visitor
presses a button, verified at every state below.

**The first ask is a compact slide-in.** On a first visit, when we have no idea where they are
and they have not already named a gallery, a 328px panel slides up from the bottom-left after
900ms, sized 328 x 169. On a phone it becomes a bottom sheet with 10px gutters. It carries a
headline, one sentence, a filled **Use my location** and a **Not now** link, plus a close
control.

It is shown **once**. Whatever the visitor does with it, `lumas_loc_ask_v1` records that the
ask has happened and it never appears again.

**Dismissing is "not now", not "no".** Closing the panel writes only the ask flag, never a
refusal, so nothing about the visitor's location preference is inferred from a dismissal. Only
an actual `PERMISSION_DENIED` from the browser writes `refused`.

**The offer is never lost.** The 34px chip is painted underneath the slide-in before it
appears, so the panel is a prompt over a standing affordance rather than the only route in.
Dismiss the panel and the chip is still there:

> ⌖ See it in a gallery near you

Pressing the chip opens a 300px popover holding the same sentence and the same two actions.
On desktop that popover is absolutely positioned, so opening it shifts nothing. Below 560px it
drops into the flow under the chip.

| | closed | open |
|---|---|---|
| Slide-in | not shown after the first ask | 328 x 169 fixed, 370 x 169 on a phone |
| Chip, desktop | 34px | 34px + floating popover |
| Chip, mobile | 34px | 176px |

**Refusing means refusing.** `PERMISSION_DENIED` (error code 1) does not fall back to IP: the
chip changes to "Choose a gallery" and no location is used at all. The brief asked for an IP
fallback on denial; that is narrowed deliberately. Codes 2 and 3 are technical failures rather
than an answer, so a coarse regional guess is still fair there.

The outcome is remembered in `localStorage` under `lumas_loc_v1` (`device`, `refused`, or
`manual:<id>`). Once located, the line under the pill carries **Change** and
**Stop using my location**, so the state is visible and reversible on the page itself.

Under `prefers-reduced-motion: reduce` the panel fades in place instead of sliding.

## Precision gating

A fix is only trusted if it can distinguish one German city from another.

| Precision | Trusted | Shown as |
|---|---|---|
| `device` | yes | "Near Essen", distances to one decimal under 10km |
| `city` (IP) | yes | "Near Hamburg, based on your region", "approx. 4 km" |
| `country` (IP) | no | no gallery named; the invitation is offered instead |

The `kmText(v, precise)` helper exists so a city-level fix can never print "0.8 km" and imply
a precision it does not have.

## The states, as URLs

| State | URL |
|---|---|
| The first ask, slide-in | `?size=s80&frame=basel&ask=1` |
| Dismissed, the chip remains | `?size=s80&frame=basel&ask=0` |
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

When the visitor is located and **no** gallery holds the configuration, the module says
nothing at all rather than announcing their city for no reason: no pill, no location line.

## What was changed in the base

Eleven lines, listed so the copy stays auditable:

- Six `GALLERIES` rows gained `lat` / `lon`.
- Four lines in `renderPill()` and one in `renderGalleryInfo()` read `ACTIVE_GAL` instead of
  the URL-only `GAL`.

`ACTIVE_GAL` and `MANUAL` are declared next to `const GAL`, before the base's first
synchronous render, so the base still paints price and availability in the first paint with
no client-side rewrite. The location layer only ever repaints on top of that.

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
