# Art as a Service — v1 layer

The rent journey, layered on the untouched clone in [`../aaas-baseline`](../aaas-baseline).
For [GLOB-2053](https://lumas.atlassian.net/browse/GLOB-2053) / [LUMAS-16152](https://lumas.atlassian.net/browse/LUMAS-16152).

```bash
open http://localhost:8952/aaas-v1/
```

## How it is built

`_build.py` reads the baseline, adds **exactly two tags** (`aaas.css`, `aaas.js`) and repoints asset
paths at `../aaas-baseline/` so the 57 MB of mirrored assets is never duplicated. A diff against the
baseline shows the layer and nothing else, so "what did AaaS change" is always answerable:

```bash
python3 _build.py
diff <(sed 's#\.\./aaas-baseline/##g' pdp.html) ../aaas-baseline/pdp.html
```

All behaviour lives in `aaas.js`; no baseline markup is edited by hand.

One extra rewrite happens in the same pass: a handful of `<use href>` references into
`sprite.svg` stayed absolute through the capture, and cross-origin `<use>` is blocked by the
browser, so the Trustpilot stars, its wordmark and the cart's quantity icons rendered as empty
boxes. Those are repointed at the mirrored sprite too. It is scoped to `/assets/` on purpose:
rewriting every `at.lumas.com` URL would turn the page's navigation into local file paths.

## Surfaces

| Page | What AaaS adds |
|---|---|
| `pdp.html` | "Oder mieten ab € X im Monat" line between price and CTA, plus a short conditions drawer with this artwork's real numbers. Buying stays the primary action. |
| **Cart drawer** (on the PDP) | Opens from "In den Warenkorb" or from the drawer. Carries the Kaufen/Mieten switch, so the decision happens in the cart as GLOB-2053 asks. In rent mode the line price becomes a monthly rate, express checkout disappears, and the total becomes "Heute fällig". |
| `checkout.html` | The full step flow, Kunde → Adresse → Zahlung → Übersicht → Bestätigung. Kaufen/Mieten switch in the cart summary, monthly breakdown, voucher + express payments removed in rent mode. |
| `account-rental.html` | "Deine Miete": term progress, next debit, current buyout price, paid-to-date, and the three end-of-term paths. |

## The model

Every figure is computed from the binding conditions, never hardcoded:

Everything comes from the **ticket descriptions**. An earlier checklist in the GLOB-2053
comments proposed a net basis, a 3 / 6 / 12 term choice, 14-day withdrawal and tickbox consent;
the comments are not the spec and every one of those contradicts the description, so none of
them are here.

| Term | Value |
|---|---|
| Monthly rent | 3,75 % of the **gross** price |
| Provisioning fee | one month's rent, once, **never** credited against a buyout |
| Minimum term | 36 months, fixed (there is no term selector) |
| Notice | 30 days to the end of the month |
| Buyout | any time; 80 % of rent paid so far is credited |
| Exchange | free from month 36 (new rent + new provisioning fee); earlier against 30 % of the price |
| Return | from month 36; saleable condition, certificate of authenticity included |
| Withdrawal | 60 days from delivery; the customer bears return shipping and pro-rata rent |
| Payment | SEPA or card, recurring via Adyen |
| Pilot markets | AT, CH, COM |

Verified against the epic's own worked example (MCS45, gross €2.990):

| | Prototype | GLOB-2053 |
|---|---|---|
| Monatsmiete | € 112,13 | € 112,13 |
| Bereitstellungsentgelt | € 112,13 | € 112,13 |
| Heute fällig | € 263,26 | € 253,26 (uses DE shipping €29; AT is €39) |
| Gesamt 36 Monate | € 4.187,81 | € 4.177,81 (same €29/€39 difference) |

Rerun that check against the epic's own table any time the model is touched: with the DE
shipping figure of €29 all five lines match to the cent.

Shipping is read per variant from the buy box, so the €549 40×40 correctly uses €9,90, not €39.

## Branding

`aaas.css` defines **no tokens of its own**. The shop already ships the full V2 system as CSS custom
properties, so the layer inherits them and tracks the brand automatically:

| Used | From the shop |
|---|---|
| Type | `--font-body` (archivo), `--font-body-bold`, `--font-display` (utile-display) |
| Colour | `--color-text-primary/secondary/inverse`, `--color-surface-page/muted/inverse`, `--color-border-default/focus` |
| Spacing | `--sp-1` … `--sp-24` (root is 10px, so 1rem = 10px) |
| Motion | `--motion-default`, `--motion-easing` |

Two notes. Headlines are **sentence case** in `--font-display`, per the V2 rule against all-caps
headlines; uppercase is reserved for UI labels and buttons. And small informational copy uses
`--color-text-secondary` (#5a5752) rather than `--color-text-tertiary` (#908c87), which is only about
3.3:1 on white and fails WCAG AA — tertiary is kept for decorative micro-labels beside the shop's own.

The mode-switch rules are scoped through `.aaas-mode-switch` deliberately: the checkout ships
`.spc-container aside button`, which outranks a single class and would otherwise strip the borders.

## Three deliberate design decisions

1. **Buying stays primary on the PDP.** Renting enters as a line of text and a link, never a second
   button competing with "In den Warenkorb".
2. **Consent is prominent prose, not a checkbox.** LUMAS-16152 asks that contract conclusion "not come
   across as merely a formality involving a checkbox in the fine print", and a later GLOB-2053 comment
   independently settled on the same thing ("kein Bestätigung im Checkout, sondern analog jetzt"). The
   "Das buchst du" block states the term, today's amount, the recurring amount and the withdrawal right
   in plain language.
3. **The month-34 problem is surfaced, not hidden.** Because 80 % of a 3,75 % rent is credited, the
   buyout price reaches €0 in month **34** for every artwork regardless of price, while return and
   exchange only unlock at **36**. The drawer and consent block say so plainly rather than implying a
   choice that has already been made.

## Copy

Brandbook rules applied: du-form, sentence case, no exclamation marks, no emoji, no em-dashes,
"Sammler:innen" not "Kunden", "Vorteil" not "Rabatt". A 36-month commitment is never called flexible,
and **insurance is never claimed** anywhere, since that decision is still open in the epic and blocks
both the contract and the FAQ.

## Not built yet

- The **transactional mails** (text-only per the design brief, so no design needed).
- **Exchange / return request flows.** GLOB-2053 says CS and Finance handle all three end-of-term
  paths manually in the pilot, so the account page shows them as states, not as self-service flows.
- The **rental conditions page** ("Mietbedingungen") the checkout links to. GLOB-2053 puts the
  legal pages outside this ticket.

## Open questions that materially affect this prototype

1. **Month 34 vs month 36.** Ownership arrives two months before return and exchange become available,
   so as written those two options can never actually be reached. Needs a commercial decision: allow
   exit before 34, auto-convert at 34, or change the credit rate.
2. **Is there a price floor for renting?** At €549 the 36-month total is €771,73. Renting always costs
   138,75 % of the price plus shipping, so on inexpensive works the value story is weak. The epic sets
   no floor.
3. **Where does the decision belong?** LUMAS-16152 leaves PDP vs cart open; a GLOB-2053 comment says the
   cart. On the AT store there is no cart page at all, so it currently sits in the checkout summary.
4. **First payment timing** (order date vs "shipped + 7 days") is unresolved and changes what
   "Heute fällig" may claim.
5. **Insurance** — undecided, and blocks the contract and FAQ.
