# AaaS baseline — verbatim clone of at.lumas.com

The **"before" state** for Art as a Service ([GLOB-2053](https://lumas.atlassian.net/browse/GLOB-2053) /
[LUMAS-16152](https://lumas.atlassian.net/browse/LUMAS-16152)). No rental UI has been added. Every later
AaaS prototype should be diffable against these files.

Captured from the live **AT** store on **2026-09-07**. Source of truth is the live site, not this repo's
`frontend/themes/white/` Twig.

## Anchor product

Alika&Siara by Marta Contreras Simó — **MCS45 = the 150 × 150 cm variant** (`data-abstract-id=6335462`,
`variant=2`). This is the exact article used in GLOB-2053's own worked pricing example.

| Fact (verified live, AT store) | Value |
|---|---|
| Gross list price | **€ 2.990** — matches the epic's example exactly |
| Art Week price (−20 %) | **€ 2.392** — matches the epic's second example exactly |
| Shipping | **€ 39** (the epic's example uses the DE figure of €29) |
| Cart "to pay" | € 2.431 (= 2.392 + 39) |
| Edition | Limited Edition **100**, signed (the page title still says 150, which is the MCS03 edition) |
| Mounting | Kaschierung unter Acrylglas, Stärke 2 mm matt |

## Files

| File | Surface | Source URL |
|---|---|---|
| `pdp.html` | Product detail page | `/pictures/marta_contreras_simo/alikasiara/` |
| `checkout.html` | Single-page checkout, guest/customer step, MCS45 in cart | `/checkout/single-page/customer/` |
| `account.html` | Account entry (login/register shell) | `/login/` |
| `cart-drawer-fragment.html` | Cart drawer line-item markup | `POST /cart/add/MCS45/` |
| `cart-add-response.json` | Full add-to-cart payload (`html`, `totals`, `klaviyoData`) | same |

Assets are mirrored **path-preserving** per host (`cdn_lumas_com/`, `img_lumas_com/`, `at_lumas_com/`,
`media_lumas_com/`), so every relative `url()` inside the site's own CSS keeps resolving untouched.
~773 assets, ~53 MB, including the real Archivo + Utile Display woff2 files and all 192 webpack chunks.

## Viewing

Served by the existing `prototype-server` launch config (port 8941):

```bash
open http://localhost:8941/aaas-baseline/pdp.html
```

Use the server rather than `file://` — the pages request assets by relative path.

## Two findings that change the AaaS plan

1. **There is no standalone cart page on the AT store.** `/cart/` returns a `302` to
   `/checkout/single-page/` whether the cart is empty or full. The cart is a **drawer**
   (`div.cart-overlay`) plus the checkout's own order summary. Any plan that puts the buy/rent mode
   switch on "the cart page" has no such page to put it on in the pilot markets.
2. **The two blocks the AaaS plan says must disappear in rent mode are both on the checkout**, not a
   cart page: the *Gutschein einlösen* voucher field and the express payment buttons (Amazon Pay,
   plus Google/Facebook sign-in). Neither can carry a recurring SEPA mandate.

## Campaign removal (Archive Sale / Art Week)

The capture happened during Archive Sale + Art Week. A transient campaign should not be baked into a
baseline, and this is not merely cosmetic: **Art Week's −20 % changes the very gross price the AaaS
monthly rent is a percentage of.** A discounted baseline would misprice every rent calculation.

`_scripts/depromo.py` removes it, and is idempotent — re-run it after any re-capture:

- `<promotion-banner>` — the two promo bars on every page
- `.pdp-info-banner` — the CMS slot holding the ART WEEK block in the buy box
- nav links to `/artweek/` and `/archive-sale/` (including the "SALE" nav item)
- the `content-infusion-artweek` CMS config entry
- `data-strike` JSON on the size buttons and the matching embedded `"strike"` payload — this is what
  `<pdp-price>` uses to render "€ 439 statt € 549 / Heute € 110 sparen". Emptying it leaves the plain
  regular price.

Result: the PDP shows a clean **€ 549** (MCS03 default) with no strikethrough; the checkout line item
shows the full **€ 2.990**. No campaign text renders on any page.

## What was changed, and why

Three deliberate edits — everything else is byte-for-byte as served:

1. **Three third-party `<script src>`/`<link>` tags per page removed** (consent manager, tag manager,
   tracking, Baqend Speedkit) plus the `<dialog class="geotargeting-popup">`. They cannot work offline
   and inject blocking overlays (a consent wall and a modal "switch to your local shop" dialog that
   makes the whole page inert). **All inline scripts are kept** — they define page data and globals.
2. **`window.assetsPublicPath` repointed** from `https://cdn.lumas.com/assets/` to the local mirror, so
   webpack's lazy chunks load from these files instead of the CDN.
3. **Campaign chrome removed** — see the section above.

## Known limitations

- **The PDP opens on MCS03 (40 × 40, €439)**, because that is the server-rendered default; MCS45 is
  selected client-side. All four size buttons are present with correct `data-sku`, so 150 × 150 is
  selectable in the clone — worth a manual click to confirm the JS wiring survived.
- **Checkout is captured at the guest/customer step only.** Reaching the address, payment and summary
  steps requires submitting real personal data, which I did not do. The payment-method markup *is*
  present in the page (including `payment-icon-sepa`), so the payment list can still be inspected.
- **`account.html` is the unauthenticated shell.** The real account area (orders, payment methods —
  where the rental overview would live) needs a login. To baseline it, log in yourself and save that
  page; I will not enter credentials.
- **The captured cart still carries the Art Week discount in its data**, even though nothing visible on
  `checkout.html` shows it. The cart was created while the campaign was live, so its embedded payload
  holds `DISCOUNT_CAMPAIGN_ARTWEEK-AUG26` (−€598) and its `grandTotal` is €2.431 (= €2.392 + €39
  shipping), while the visible line item reads the full €2.990. The discount data was deliberately left
  intact: stripping it would leave the totals arithmetic inconsistent. Re-capture the cart once the
  campaign ends if you need clean totals.
- One nav thumbnail (`media.lumas.com/.../budapest.jpg`) returns 403 at source, so it is missing here too.
- The clone is a **static snapshot**: search, add-to-cart and navigation post to relative paths that do
  not exist locally.

## Dropbox warning

This repo lives inside Dropbox. New files here can be dehydrated to online-only, after which the server
starts 404-ing and `ls` looks empty. Right-click `prototype/aaas-baseline` → **Make Available Offline**.
