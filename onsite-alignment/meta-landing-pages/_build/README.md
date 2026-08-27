# scale.html — generator

`scale.html` is generated, because every price, dimension, edition size and PDP link
is bound to the live catalogue in two locales and is duplicated across EN/DE markup.

    python3 _build/build.py                      # rewrites ../scale.html
    python3 ../_nav/inline.py US --into ../scale.html   # re-attaches the nav kit

`data.py` holds the bound catalogue rows (LUMAS webshop feed mirror, com + de,
pulled 2026-08-25). Re-pull with `lumas_webshop_sql_query` when prices move.
Image codes are `images.fallback` from the variant feed, not the SKU — they differ
(e.g. IME118 -> showimg_ime117). Every code was verified HTTP 200 and its intrinsic
ratio checked against the work's cm ratio, because the scale diagrams size the
artwork by width and let the image's own ratio set the height.
