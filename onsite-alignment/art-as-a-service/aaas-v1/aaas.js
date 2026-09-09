/* Art as a Service - behaviour layer over the at.lumas.com baseline.
 *
 * Every number derives from the binding conditions in GLOB-2053:
 *   monthly rent      3.75 % of the GROSS price
 *   provisioning fee  one month's rent, once, never credited against a buyout
 *   minimum term      36 months, fixed (there is deliberately no term selector)
 *   buyout            any time; 80 % of rent paid so far is credited
 *   return/exchange   only from month 36
 *   withdrawal        60 days from delivery
 *   payment           SEPA direct debit or card, recurring via Adyen
 *
 * Copy follows the brandbook: du-form, sentence case, no exclamation marks, no
 * emoji, no em-dashes. A 36-month commitment is never called flexible, and
 * insurance is never claimed - that decision is still open and blocks the contract.
 */
(function () {
  'use strict';

  /* Two specs run side by side, because GLOB-2053 contains both and they conflict.
   *   A  the binding "Verbindliche Konditionen" in the ticket description:
   *      3.75 % of the GROSS price, fixed 36 months, 60-day withdrawal, consent as
   *      prose (which LUMAS-16152 also asks for).
   *   B  the earlier checklist in the 21 Aug comment: rent as a share of the NET
   *      price, a 3/6/12 term choice, 14-day withdrawal, consent via tickboxes.
   * A is the default. The toggle exists so both can be shown, not to imply either
   * has been decided. */
  var SPEC_KEY = 'aaas-spec';
  var MODE_KEY = 'aaas-mode';
  var TERM_KEY = 'aaas-term';
  var FALLBACK_SHIPPING = 39; // AT. The epic's worked example uses the DE figure of 29.
  var VAT_AT = 0.20;

  var SPECS = {
    A: {
      id: 'A', label: 'Verbindliche Konditionen', rate: 0.0375, base: 'brutto',
      months: 36, termChoices: null, credit: 0.80, withdrawalDays: 60,
      consent: 'prose', monthlyShipping: false, pdpToggle: false
    },
    B: {
      id: 'B', label: 'Checkliste 21.08.', rate: 0.0375, base: 'netto',
      months: 12, termChoices: [3, 6, 12],
      // The checklist asks for the 3 / 6 / 12 dropdown and puts "monatliche
      // Rate %" in the PIM, but never states a rate PER term. Only the
      // 12-month figure below is the checklist's own 3,75 %; the two shorter
      // rates are ASSUMED so the dropdown means something. Shape follows
      // Grover, which the epic names as the contract template: halve the term
      // and the monthly rises by roughly 1,4x, so the longer commitment is the
      // cheaper month. Replace with real PIM values before this is quoted.
      rates: { 3: 0.0750, 6: 0.0550, 12: 0.0375 },
      credit: 0.80, withdrawalDays: 14,
      consent: 'tickbox', monthlyShipping: true, pdpToggle: true
    }
  };

  function spec() {
    try { return sessionStorage.getItem(SPEC_KEY) === 'B' ? 'B' : 'A'; } catch (e) { return 'A'; }
  }
  function setSpec(v) { try { sessionStorage.setItem(SPEC_KEY, v); } catch (e) {} }

  function storedTerm() {
    var v; try { v = parseInt(sessionStorage.getItem(TERM_KEY), 10); } catch (e) {}
    return v;
  }
  function setStoredTerm(n) { try { sessionStorage.setItem(TERM_KEY, String(n)); } catch (e) {} }

  // TERMS stays a plain object so every existing TERMS.months reference keeps
  // working; the chosen term is folded in here rather than at each call site.
  var TERMS;

  function rateFor(months) {
    var s = SPECS[spec()];
    return (s.rates && s.rates[months]) || s.rate;
  }

  function applySpec() {
    var s = SPECS[spec()];
    var chosen = s.termChoices && s.termChoices.indexOf(storedTerm()) > -1 ? storedTerm() : s.months;
    TERMS = {
      id: s.id, label: s.label, rate: rateFor(chosen), base: s.base, credit: s.credit,
      withdrawalDays: s.withdrawalDays, consent: s.consent,
      monthlyShipping: s.monthlyShipping, termChoices: s.termChoices,
      pdpToggle: s.pdpToggle, months: chosen
    };
  }
  applySpec();

  /* ---------- money ---------- */

  function parseMoney(text) {
    if (!text) return null;
    var m = String(text).replace(/\s/g, '').match(/-?[\d.]+(?:,\d+)?/);
    if (!m) return null;
    var raw = m[0];
    raw = raw.indexOf(',') > -1 ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/\./g, '');
    var n = parseFloat(raw);
    return isNaN(n) ? null : n;
  }

  function money(n) {
    return '€ ' + n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function round2(n) { return Math.round(n * 100) / 100; }

  function monthlyFor(base, months) { return round2(base * rateFor(months)); }

  function rateLabel() {
    return (TERMS.rate * 100).toString().replace('.', ',') + ' % vom ' +
      (TERMS.base === 'netto' ? 'Netto-Verkaufspreis' : 'Kaufpreis');
  }

  /* ---------- the model ---------- */

  function quote(gross, shipping) {
    // spec B bases the rent on the NET price, so the same artwork rents cheaper
    var base = TERMS.base === 'netto' ? round2(gross / (1 + VAT_AT)) : gross;
    var monthly = round2(base * TERMS.rate);
    return {
      base: base,
      gross: gross,
      shipping: shipping,
      monthly: monthly,
      provisioning: monthly,                       // exactly one month's rent
      dueToday: round2(monthly * 2 + shipping),
      totalRent: round2(monthly * TERMS.months),
      totalCost: round2(monthly * TERMS.months + monthly + shipping),
      // Buyout falls by 80 % of each month's rent and reaches zero here. For every
      // artwork that lands on month 34, two months BEFORE return and exchange
      // unlock at 36. Surfacing it is more honest than hiding it.
      ownedFromMonth: Math.ceil(gross / (TERMS.credit * monthly))
    };
  }

  function buyoutAt(q, monthsPaid) {
    return Math.max(0, round2(q.gross - TERMS.credit * q.monthly * monthsPaid));
  }

  /* ---------- helpers ---------- */

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function mode() { try { return sessionStorage.getItem(MODE_KEY) || 'buy'; } catch (e) { return 'buy'; } }
  function setMode(v) { try { sessionStorage.setItem(MODE_KEY, v); } catch (e) {} }

  // A single stored item is enough to express the pilot's rule: a rental contract
  // covers one work, and a rental cannot share a cart with a purchase (GLOB-2053,
  // "keine gemischten Warenkörbe").
  var CART_KEY = 'aaas-cart';

  function cartItem() {
    try { return JSON.parse(sessionStorage.getItem(CART_KEY) || 'null'); } catch (e) { return null; }
  }

  function setCartItem(o) {
    try {
      if (o) sessionStorage.setItem(CART_KEY, JSON.stringify(o));
      else sessionStorage.removeItem(CART_KEY);
    } catch (e) {}
  }

  function figure(label, value, sub) {
    return '<div><span>' + label + (sub ? '<small>' + sub + '</small>' : '') +
           '</span><b>' + value + '</b></div>';
  }

  function modeSwitch(q, cls) {
    return '<div class="aaas-mode-switch' + (cls ? ' ' + cls : '') + '">' +
      '<button type="button" class="aaas-mode-btn" data-mode="buy">Kaufen' +
        '<small>' + money(q.gross) + ' einmalig</small></button>' +
      '<button type="button" class="aaas-mode-btn" data-mode="rent">Mieten' +
        '<small>' + money(q.monthly) + ' im Monat</small></button>' +
      '</div>';
  }

  /* The PDP's switch, extracted so every surface that carries the buy-or-rent
   * decision in spec B uses the same control rather than a second dialect of
   * it. `attrs` is how a caller hangs its own hook on it (the PDP listens for
   * data-pdptoggle, the cart and checkout for data-mode) without copying the
   * markup. A button with role="switch" rather than a label wrapping a
   * checkbox: that construction rendered a square knob, and the knob is a real
   * element so nothing in the shop's stylesheet can reach it. */
  function switchControl(q, renting, attrs) {
    return '<button type="button" class="aaas-ms" role="switch" ' + (attrs || '') +
      ' aria-checked="' + renting + '">' +
      '<span class="aaas-ms-track"><span class="aaas-ms-knob"></span></span>' +
      '<span class="aaas-ms-text">Mieten statt kaufen' +
        '<span class="aaas-ms-sep" aria-hidden="true"> · </span>' +
        '<b>' + money(q.monthly) + '</b> im Monat' +
        (renting ? termSuffix() : '') +
      '</span></button>';
  }

  function syncSwitches(renting, root) {
    var scope = root || document;
    scope.querySelectorAll('.aaas-mode-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === (renting ? 'rent' : 'buy')));
    });
    // the switch states the mode it is in and carries the one it would move to,
    // so both attributes have to turn over together
    scope.querySelectorAll('.aaas-ms[data-mode]').forEach(function (sw) {
      sw.setAttribute('aria-checked', String(renting));
      sw.setAttribute('data-mode', renting ? 'buy' : 'rent');
    });
  }

  /* ---------- PDP: product facts ---------- */

  function activeSize() {
    return document.querySelector('button.size.active') || document.querySelector('button.size');
  }

  function pdpGross() {
    var c = document.querySelector('.pdp-price-container');
    if (!c) return null;
    return parseMoney((c.querySelector('pdp-price') || c).textContent);
  }

  function pdpShipping() {
    var b = activeSize();
    return (b && parseMoney(b.getAttribute('data-shipment-cost'))) || FALLBACK_SHIPPING;
  }

  function pdpQuote() { return quote(pdpGross(), pdpShipping()); }

  function product() {
    var size = activeSize();
    var img = document.querySelector('main img.normal') || document.querySelector('main img');
    // the mounting choice is not a <select>: it is the framing-drawer trigger
    var mount = document.querySelector('.framing-drawer-trigger span');
    var artist = document.querySelector('.artist-holder');
    var title = document.querySelector('.work-container');
    return {
      sku: size ? size.getAttribute('data-sku') : '',
      artist: artist ? artist.textContent.trim() : '',
      title: title ? title.textContent.trim() : document.title.split(' von ')[0],
      size: size ? size.textContent.replace(/\s+/g, ' ').replace(/(Bestseller|Neu|Ausverkauft)/gi, '').trim() : '',
      finishing: mount ? mount.textContent.replace(/\s+/g, ' ').trim() : '',
      image: img ? img.getAttribute('src') : '',
      href: location.pathname
    };
  }

  /* ---------- conditions drawer (short, scannable) ---------- */

  function openConditions() {
    var q = pdpQuote();
    var old = document.getElementById('aaas-drawer');
    if (old) old.remove();

    var d = el('dialog', 'aaas-drawer');
    d.id = 'aaas-drawer';
    d.setAttribute('aria-labelledby', 'aaas-drawer-title');
    d.innerHTML =
      '<div class="aaas-drawer-inner">' +
        '<div class="aaas-drawer-head">' +
          '<h2 id="aaas-drawer-title">Mieten statt kaufen</h2>' +
          '<button type="button" class="aaas-close" aria-label="Schließen">&times;</button>' +
        '</div>' +
        '<div class="aaas-drawer-body">' +
          '<p class="aaas-lede">Du nimmst das Werk heute mit nach Hause und entscheidest später, ' +
            'ob es bleibt.</p>' +
          '<div class="aaas-figures">' +
            figure('Monatsmiete', '<b>' + money(q.monthly) + '</b>', TERMS.months + ' Monate Mindestlaufzeit') +
            figure('Heute fällig', '<b>' + money(q.dueToday) + '</b>',
                   'Miete, Bereitstellung und Versand') +
            figure('Gesamt über ' + TERMS.months + ' Monate', '<b>' + money(q.totalCost) + '</b>') +
          '</div>' +
          '<ul class="aaas-points">' +
            '<li>80 % deiner gezahlten Miete werden angerechnet, wenn du das Werk übernimmst.</li>' +
            '<li>Übernehmen kannst du jederzeit. Ab dem ' + q.ownedFromMonth + '. Monat liegt der ' +
              'Übernahmepreis bei ' + money(0) + '.</li>' +
            '<li>Tauschen oder zurückgeben kannst du ab Monat ' + TERMS.months + '.</li>' +
          '</ul>' +
          '<p class="aaas-note">' + TERMS.withdrawalDays + ' Tage Widerrufsrecht ab Lieferung. ' +
            'Zahlung per SEPA-Lastschrift oder Kreditkarte. Das Werk bleibt bis zur Übernahme ' +
            'Eigentum von LUMAS.</p>' +
        '</div>' +
        '<div class="aaas-drawer-foot">' +
          '<button type="button" class="aaas-btn" data-aaas-rent>In den Warenkorb, zur Miete</button>' +
          // spec B's checklist asks for a "später kaufen" option alongside the terms
          (TERMS.pdpToggle
            ? '<button type="button" class="aaas-btn aaas-btn-secondary" data-aaas-buy>' +
              'Stattdessen jetzt kaufen</button>'
            : '') +
        '</div>' +
      '</div>';

    document.body.appendChild(d);
    d.querySelector('.aaas-close').addEventListener('click', function () { d.close(); });
    d.querySelector('[data-aaas-rent]').addEventListener('click', function () {
      d.close();
      attemptAdd(true);
    });
    var buyNow = d.querySelector('[data-aaas-buy]');
    if (buyNow) buyNow.addEventListener('click', function () {
      d.close();
      attemptAdd(false);
    });
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
  }

  /* ---------- cart drawer ----------
   * Rebuilt from the real markup the live shop returns from POST /cart/add/.
   * Injected into the shop's own empty .cart-overlay shell so the shop's CSS
   * styles it, rather than inventing a look for it. */

  function cartTotals(q, renting) {
    if (!renting) {
      return '<div class="price-to-pay"><div>Gesamtpreis inkl. MwSt.</div><div>' +
               money(q.gross + q.shipping) + '</div></div>' +
             '<div class="shipping-added">Der Betrag beinhaltet lokale Versandkosten.</div>';
    }
    return '<div class="aaas-cart-figures">' +
             figure('Monatsmiete', '<b>' + money(q.monthly) + '</b>') +
             figure('Bereitstellungsentgelt', '<b>' + money(q.provisioning) + '</b>', 'einmalig') +
             figure('Versand', '<b>' + money(q.shipping) + '</b>', 'einmalig') +
           '</div>' +
           '<div class="price-to-pay"><div>Heute fällig</div><div>' + money(q.dueToday) + '</div></div>' +
           '<div class="shipping-added">Danach ' + money(q.monthly) + ' im Monat, ' +
             TERMS.months + ' Monate.</div>' +
           // spec B's checklist asks for a cross-border hint in the cart
           (TERMS.pdpToggle
             ? '<p class="aaas-note aaas-xborder">Mieten ist nicht in allen Lieferländern ' +
               'verfügbar. Im Pilotbetrieb: Österreich, Schweiz und international.</p>'
             : '');
  }

  function renderCart(q, p) {
    var shell = document.querySelector('.cart-overlay');
    if (!shell) return;
    var renting = mode() === 'rent';

    shell.innerHTML =
      '<div class="backdrop"></div>' +
      '<div class="arrow-up"></div>' +
      // has-payment-options also drives the drawer's own grid sizing, so it stays on
      // in both modes; the express block is hidden rather than removed
      '<div class="cart-overlay-container has-payment-options">' +
        // no .continue-shopping: it lands on the same line as .title and collides
        // with it. The close button already provides the way out.
        '<button class="icon-close" aria-label="Schließen"></button>' +
        '<div class="title">Warenkorb</div>' +
        '<div class="items"><div class="item" data-sku="' + p.sku + '">' +
          '<a href="' + p.href + '"><picture class="product-image">' +
            '<img src="' + p.image + '" alt="' + p.title + '"></picture></a>' +
          '<div class="item-meta">' +
            '<div class="name">' + p.title + '</div>' +
            '<div class="artist-name">' + p.artist + '</div>' +
            '<div class="finishing">GRÖSSE: ' + p.size +
              (p.finishing ? '&nbsp;|&nbsp;' + p.finishing : '') + '</div>' +
            '<div class="price">' + (renting
              ? money(q.monthly) + ' im Monat'
              : money(q.gross)) + '</div>' +
          '</div>' +
        '</div></div>' +
        // the switch sits with the money, not stranded in the void between the
        // item and the pinned bottom: one coherent decision block
        '<div class="cart-overlay-bottom">' +
          '<div class="aaas-cart-mode">' +
            '<div class="aaas-label">Kaufen oder mieten</div>' +
            // spec B decides on the PDP with a switch, so the cart repeats that
            // control rather than offering the same choice in another shape
            (TERMS.pdpToggle
              ? switchControl(q, renting, 'data-mode="' + (renting ? 'buy' : 'rent') + '"')
              : modeSwitch(q)) +
          '</div>' +
          // express checkout is left out of the drawer entirely for now. It also
          // cannot carry a recurring SEPA mandate, so it never applied to renting.
          // (.has-payment-options stays on the container: it drives the grid sizing.)
          '<div class="cart-totals">' +
            cartTotals(q, renting) +
            '<div class="button"><a href="checkout.html" class="btn">Zur Kasse</a></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    syncSwitches(renting, shell);

    // entering checkout from the cart always restarts the step flow
    var toCheckout = shell.querySelector('.cart-totals a.btn');
    if (toCheckout) toCheckout.addEventListener('click', function () { setStep(1); });

    shell.querySelector('.icon-close').addEventListener('click', closeCart);
    shell.querySelector('.backdrop').addEventListener('click', closeCart);
    shell.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-mode]');
      if (!b) return;
      var m = b.getAttribute('data-mode');
      setMode(m);
      p.rent = (m === 'rent');
      setCartItem(p);                              // keep the stored item in step
      renderCart(q, p);                            // re-render in the chosen mode
    });
  }

  /* ---------- mixed-cart conflict ----------
   * GLOB-2053 rules out mixed carts, and the pilot's contract covers one work.
   * Reachable without contrivance: each size is its own SKU, so adding a second
   * variant while a rental is in the cart is a real path. The state offers a
   * choice rather than a dead end, since refusing without a way forward is worse
   * than the conflict itself. */

  function conflictCopy(existing, asRent) {
    if (existing.rent && asRent) {
      return {
        label: 'Nur ein Werk pro Mietvertrag',
        lede: 'Ein Mietvertrag gilt für ein Werk. Du hast bereits ein Werk zur Miete im Warenkorb.',
        keep: 'Bisherige Miete behalten',
        swap: 'Stattdessen dieses Werk mieten'
      };
    }
    return {
      label: 'Miete und Kauf getrennt bestellen',
      lede: 'Ein gemietetes und ein gekauftes Werk lassen sich nicht zusammen bestellen. ' +
            'Schließe die Miete ab, danach kannst du das zweite Werk kaufen.',
      keep: 'Miete behalten',
      swap: existing.rent ? 'Miete verwerfen und dieses Werk kaufen' : 'Stattdessen dieses Werk mieten'
    };
  }

  function conflictWork(it, note) {
    return '<div class="aaas-cf-work">' +
      '<img src="' + (it.image || '') + '" alt="">' +
      '<div class="aaas-cf-meta"><b>' + (it.title || '') + '</b>' +
        '<span>' + (it.artist || '') + '</span>' +
        (it.size ? '<span>' + it.size + '</span>' : '') + '</div>' +
      '<span class="aaas-cf-tag">' + note + '</span></div>';
  }

  function renderConflict(existing, incoming, asRent) {
    var shell = document.querySelector('.cart-overlay');
    if (!shell) return;
    var c = conflictCopy(existing, asRent);

    shell.innerHTML =
      '<div class="backdrop"></div><div class="arrow-up"></div>' +
      '<div class="cart-overlay-container has-payment-options">' +
        '<button class="icon-close" aria-label="Schließen"></button>' +
        '<div class="title">Warenkorb</div>' +
        '<div class="aaas-cf" role="alert">' +
          '<div class="aaas-label">' + c.label + '</div>' +
          '<p class="aaas-cf-lede">' + c.lede + '</p>' +
          conflictWork(existing, existing.rent ? 'Zur Miete im Warenkorb' : 'Im Warenkorb') +
          conflictWork(incoming, asRent ? 'Neu, zur Miete' : 'Neu, zum Kauf') +
        '</div>' +
        '<div class="cart-overlay-bottom">' +
          '<div class="aaas-cf-actions">' +
            '<button type="button" class="aaas-btn" data-cf="keep">' + c.keep + '</button>' +
            '<button type="button" class="aaas-btn aaas-btn-secondary" data-cf="swap">' + c.swap + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    shell.querySelector('.icon-close').addEventListener('click', closeCart);
    shell.querySelector('.backdrop').addEventListener('click', closeCart);
    shell.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-cf]');
      if (!b) return;
      if (b.getAttribute('data-cf') === 'swap') {
        setCartItem(incoming);
        setMode(asRent ? 'rent' : 'buy');
      }
      openCart();
    });
  }

  function attemptAdd(asRent) {
    var p = product();
    p.gross = pdpGross();
    p.shipping = pdpShipping();
    p.rent = asRent;

    var have = cartItem();
    // two purchases can share a cart; anything involving a rental cannot
    if (have && have.sku !== p.sku && (have.rent || asRent)) {
      renderConflict(have, p, asRent);
      lockScroll();
      return;
    }
    setCartItem(p);
    setMode(asRent ? 'rent' : 'buy');
    openCart();
  }

  function lockScroll() {
    document.documentElement.classList.add('scroll-locked');
    document.addEventListener('keydown', escClose);
  }

  function openCart() {
    var it = cartItem() || product();
    var q = quote(it.gross || pdpGross(), it.shipping || pdpShipping());
    renderCart(q, it);
    lockScroll();
  }

  function closeCart() {
    var shell = document.querySelector('.cart-overlay');
    if (shell) shell.innerHTML = '';
    document.documentElement.classList.remove('scroll-locked');
    document.removeEventListener('keydown', escClose);
  }

  function escClose(e) { if (e.key === 'Escape') closeCart(); }

  /* ---------- PDP wiring ---------- */

  /* Three ways to present the buy/rent choice on the PDP, switchable from the
   * prototype marker so they can be compared in place. The original paired
   * buttons carried a label and a price each, which crowded a binary choice and
   * repeated the price already shown above the box.
   *   seg     one segmented track, active half filled. Prices live above.
   *   switch  a labelled switch under the price, price line follows the state.
   *   rows    full-width radio rows, label left and price right, room to breathe.
   */
  var VARIANT_KEY = 'aaas-variant';
  var VARIANTS = { seg: 'Segmented', 'switch': 'Switch', rows: 'Zeilen' };

  function variant() {
    try { return VARIANTS[sessionStorage.getItem(VARIANT_KEY)] ? sessionStorage.getItem(VARIANT_KEY) : 'seg'; }
    catch (e) { return 'seg'; }
  }
  function setVariant(v) { try { sessionStorage.setItem(VARIANT_KEY, v); } catch (e) {} }

  // The term belongs in the control only when there is no term dropdown under
  // it. With the dropdown present the trigger already names it, and repeating it
  // wrapped the switch label onto a second line at 390px.
  function termSuffix() {
    return TERMS.termChoices ? '' : ', ' + TERMS.months + ' Monate';
  }

  function modeChooser(q, renting) {
    var v = variant();

    if (v === 'switch') {
      return switchControl(q, renting, 'data-pdptoggle');
    }

    if (v === 'rows') {
      var row = function (m, label, price) {
        var on = (m === 'rent') === renting;
        return '<label class="aaas-moderow"' + (on ? ' data-on' : '') + '>' +
          '<input type="radio" name="aaas-pdpmode" value="' + m + '"' + (on ? ' checked' : '') + '>' +
          '<span class="aaas-moderow-name">' + label + '</span>' +
          '<b class="aaas-moderow-price">' + price + '</b></label>';
      };
      return '<div class="aaas-moderows" role="radiogroup" aria-label="Kaufen oder mieten">' +
        row('buy', 'Kaufen', money(q.gross)) +
        row('rent', 'Mieten', money(q.monthly) + ' im Monat') +
      '</div>';
    }

    // seg: the prices stay in the buy box's own price line, not inside the control
    return '<div class="aaas-seg" role="group" aria-label="Kaufen oder mieten">' +
      '<button type="button" class="aaas-seg-btn" data-pdpmode="buy" aria-pressed="' +
        (!renting) + '">Kaufen</button>' +
      '<button type="button" class="aaas-seg-btn" data-pdpmode="rent" aria-pressed="' +
        renting + '">Mieten</button>' +
    '</div>' +
    '<div class="aaas-seg-price">' + (renting
      ? '<b>' + money(q.monthly) + '</b> im Monat' + termSuffix()
      : '<b>' + money(q.gross) + '</b> einmalig') + '</div>';
  }

  /* A branded listbox. A native <select> draws its option list in the OS, which
   * cannot be styled at all, so the trigger mirrors the PDP's own Kaschierung
   * control and the list is ours. Keyboard and ARIA per the project's
   * accessibility rules: arrows move, Enter picks, Escape closes and restores
   * focus to the trigger. */
  var outsideClickWired = false;

  function selectMarkup(id, label, options, value) {
    var current = options.filter(function (o) { return o.value === value; })[0] || options[0];
    return '<div class="aaas-select" id="' + id + '">' +
      '<div class="pdp-product-section-header">' + label + '</div>' +
      '<button type="button" class="aaas-select-trigger" aria-haspopup="listbox" ' +
        'aria-expanded="false" id="' + id + '-trigger"><span>' + current.label + '</span></button>' +
      '<ul class="aaas-select-list" role="listbox" aria-labelledby="' + id + '-trigger" hidden>' +
        options.map(function (o) {
          return '<li role="option" data-val="' + o.value + '" tabindex="-1" aria-selected="' +
            (o.value === value ? 'true' : 'false') + '">' + o.label +
            (o.note ? '<span class="aaas-opt-note">' + o.note + '</span>' : '') + '</li>';
        }).join('') +
      '</ul></div>';
  }

  function closeAllSelects(except) {
    document.querySelectorAll('.aaas-select').forEach(function (s) {
      if (s === except) return;
      var l = s.querySelector('.aaas-select-list');
      var t = s.querySelector('.aaas-select-trigger');
      if (l) l.hidden = true;
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }

  function wireSelect(root, onPick) {
    var trigger = root.querySelector('.aaas-select-trigger');
    var list = root.querySelector('.aaas-select-list');
    if (!trigger || !list) return;
    var opts = [].slice.call(list.querySelectorAll('[role="option"]'));

    function close(back) {
      list.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      if (back) trigger.focus();
    }
    function open() {
      closeAllSelects(root);
      list.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      (list.querySelector('[aria-selected="true"]') || opts[0]).focus();
    }
    function pick(o) {
      opts.forEach(function (x) { x.setAttribute('aria-selected', String(x === o)); });
      trigger.querySelector('span').textContent = o.textContent;
      close(true);
      onPick(o.getAttribute('data-val'));
    }

    trigger.addEventListener('click', function () { list.hidden ? open() : close(false); });
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    list.addEventListener('click', function (e) {
      var o = e.target.closest('[role="option"]');
      if (o) pick(o);
    });
    list.addEventListener('keydown', function (e) {
      var i = opts.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); close(true); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); (opts[i + 1] || opts[0]).focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); (opts[i - 1] || opts[opts.length - 1]).focus(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (opts[i]) pick(opts[i]); }
      else if (e.key === 'Tab') { close(false); }
    });

    // one shared outside-click listener, so re-rendering the block cannot stack them
    if (!outsideClickWired) {
      outsideClickWired = true;
      document.addEventListener('click', function (e) {
        if (!e.target.closest || !e.target.closest('.aaas-select')) closeAllSelects(null);
      });
    }
  }

  function renderPdpLine() {
    var container = document.querySelector('.pdp-price-container');
    if (!container || !pdpGross()) return;
    var q = pdpQuote();

    var line = document.getElementById('aaas-rent-line');
    if (!line) {
      line = el('div', 'aaas-rent-line');
      line.id = 'aaas-rent-line';
      // buying stays primary: renting enters as a line, never a second button
      container.insertAdjacentElement('afterend', line);
    }
    if (!TERMS.pdpToggle) {
      // spec A: buying stays primary, renting enters as a line and a link
      line.className = 'aaas-rent-line';
      line.innerHTML =
        '<span>Oder mieten ab <b>' + money(q.monthly) + '</b> im Monat</span>' +
        '<span class="aaas-sep" aria-hidden="true">·</span>' +
        '<button type="button" class="aaas-link" id="aaas-open">So funktioniert Mieten</button>';
      line.querySelector('#aaas-open').addEventListener('click', openConditions);
      return;
    }

    // spec B: the buy/rent decision sits on the PDP, with a term choice
    var renting = mode() === 'rent';
    line.className = 'aaas-pdp-b';
    line.innerHTML =
      // the shop's own section-header class, so the label matches "wähle Größe…"
      '<div class="pdp-product-section-header">Kaufen oder mieten:</div>' +
      modeChooser(q, renting) +
      (renting ? pdpRentDetail(q) : '');

    if (!line.dataset.wired) {
      line.dataset.wired = '1';
      line.addEventListener('click', function (e) {
        if (!e.target.closest) return;
        var m = e.target.closest('[data-pdpmode]');
        if (m) { setMode(m.getAttribute('data-pdpmode')); renderPdpLine(); return; }
        var sw = e.target.closest('[data-pdptoggle]');
        if (sw) {
          setMode(sw.getAttribute('aria-checked') === 'true' ? 'buy' : 'rent');
          renderPdpLine();
          return;
        }
        if (e.target.closest('#aaas-open')) { openConditions(); return; }
        var tip = e.target.closest('[data-tip]');
        if (tip) {
          var box = line.querySelector('.aaas-tip');
          if (box) box.hidden = !box.hidden;
        }
      });

      // the switch and rows variants change via inputs, not clicks on buttons
      line.addEventListener('change', function (e) {
        var t = e.target;
        if (!t.matches) return;
        if (t.matches('input[name="aaas-pdpmode"]')) {
          setMode(t.value);
          renderPdpLine();
        }
      });
    }

    // the block is re-rendered on every change, so the listbox is wired each time
    var sel = line.querySelector('.aaas-select');
    if (sel) wireSelect(sel, function (val) {
      setStoredTerm(parseInt(val, 10));
      applySpec();
      renderPdpLine();
    });
  }

  // spec B only: term choice, the net basis, shipping note, damage tooltip and the
  // rent-to-own share, all of which the 21 Aug checklist asks for on the PDP
  function pdpRentDetail(q) {
    // Each option carries its own monthly, so the three terms can be compared
    // in the list rather than one at a time. The trigger stays the bare term:
    // the switch line above it already states the price you would pay.
    return selectMarkup('aaas-term', 'Wähle die Laufzeit:',
      TERMS.termChoices.map(function (n) {
        return { value: String(n), label: n + ' Monate',
                 note: money(monthlyFor(q.base, n)) + ' im Monat' };
      }), String(TERMS.months)) +
      '<p class="aaas-note">' + rateLabel() + ' (' + money(q.base) + ').</p>' +
      '<p class="aaas-note">Versand ' + money(q.shipping) + ' einmalig, danach fällt nur ' +
        'die Monatsmiete an.</p>' +
      '<p class="aaas-note">' + Math.round(TERMS.credit * 100) + ' % deiner gezahlten Miete ' +
        'werden angerechnet, wenn du das Werk übernimmst.</p>' +
      '<p class="aaas-note"><button type="button" class="aaas-link" data-tip="damage">' +
        'Was passiert bei Beschädigung?</button></p>' +
      // deliberately makes no insurance promise: that decision is still open
      '<div class="aaas-tip" hidden>Normale Gebrauchsspuren sind kein Problem. Bei einem ' +
        'Schaden melde dich bei uns, wir klären Reparatur und Kosten gemeinsam.</div>' +
      '<button type="button" class="aaas-link" id="aaas-open">Mietkonditionen ansehen</button>';
  }

  function initPdp() {
    if (!document.querySelector('.pdp-price-container')) return;
    renderPdpLine();

    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      if (e.target.closest('button.size')) { setTimeout(renderPdpLine, 120); return; }
      // the real add-to-cart posts to the live shop; in the clone it opens the drawer
      var atc = e.target.closest('button, a');
      if (atc && /in den warenkorb/i.test(atc.textContent || '') && !atc.closest('.aaas-drawer')) {
        e.preventDefault();
        e.stopPropagation();
        // spec B decides buy vs rent on the PDP, so the add follows that choice
        attemptAdd(TERMS.pdpToggle && mode() === 'rent');
      }
    }, true);
  }

  /* ---------- checkout ---------- */

  function checkoutItemPrice() {
    // .article-price is also the summary's column heading ("Preis"),
    // so take the first one that actually carries an amount
    var nodes = document.querySelectorAll('.article-price');
    for (var i = 0; i < nodes.length; i++) {
      if (parseMoney(nodes[i].textContent) != null) return nodes[i];
    }
    return null;
  }

  function initCheckout() {
    var aside = document.querySelector('aside');
    var priceEl = checkoutItemPrice();
    if (!aside || !priceEl) return;
    var gross = parseMoney(priceEl.textContent);
    if (!gross) return;
    var q = quote(gross, FALLBACK_SHIPPING);

    fillShopExpress();
    if (!priceEl.dataset.aaasBuy) priceEl.dataset.aaasBuy = priceEl.textContent.trim();
    var host = aside.querySelector('.cart-items-container') || aside;

    if (!document.getElementById('aaas-mode')) {
      var panel = el('div', 'aaas-mode');
      panel.id = 'aaas-mode';
      // spec B decides with a switch on the PDP and in the cart, so the last
      // surface carrying the decision uses it too rather than reverting to the
      // button pair. syncSwitches keeps it in step: unlike the cart, this panel
      // is built once and never re-rendered.
      panel.innerHTML = '<div class="aaas-label">Kaufen oder mieten</div>' +
        (TERMS.pdpToggle
          ? switchControl(q, mode() === 'rent',
              'data-mode="' + (mode() === 'rent' ? 'buy' : 'rent') + '"')
          : modeSwitch(q)) +
        '<div class="aaas-rent-summary" id="aaas-rent-summary" hidden></div>';
      host.insertAdjacentElement('beforebegin', panel);
      panel.addEventListener('click', function (e) {
        var b = e.target.closest('[data-mode]');
        if (!b) return;
        setMode(b.getAttribute('data-mode'));
        setStep(1);                                // changing mode restarts the flow
        applyCheckoutMode(q);
      });
    }

    if (!document.body.dataset.aaasSteps) {
      document.body.dataset.aaasSteps = '1';
      document.addEventListener('click', function (e) {
        if (!e.target.closest) return;

        // the real customer step submits to the live shop; here it advances
        var real = e.target.closest('#loginForm_submit');
        var nav = e.target.closest('.aaas-next, .aaas-back');
        if (!real && !nav) return;
        e.preventDefault();
        e.stopPropagation();

        var keep = {};
        ['first', 'last', 'street', 'zip', 'city'].forEach(function (k) {
          var i = document.getElementById('aaas_' + k);
          if (i && i.value) keep[k] = i.value;
        });
        saveOrder(keep);

        setStep(real ? 2 : parseInt(nav.getAttribute('data-step'), 10));
        applyCheckoutMode(q);
        window.scrollTo(0, 0);
      }, true);
    }

    applyCheckoutMode(q);
  }

  function applyCheckoutMode(q) {
    var renting = mode() === 'rent';
    var priceEl = checkoutItemPrice();
    syncSwitches(renting);

    if (priceEl) {
      priceEl.innerHTML = renting
        ? money(q.monthly) + '<span class="aaas-sub">im Monat, ' + TERMS.months + ' Monate</span>'
        : priceEl.dataset.aaasBuy;
    }

    var summary = document.getElementById('aaas-rent-summary');
    if (summary) {
      summary.hidden = !renting;
      summary.innerHTML = renting
        ? '<table class="aaas-breakdown"><tbody>' +
            '<tr><th scope="row">Monatsmiete<span class="aaas-sub">' + rateLabel() +
              '</span></th><td>' + money(q.monthly) + '</td></tr>' +
            '<tr><th scope="row">Bereitstellungsentgelt<span class="aaas-sub">einmalig, entspricht einer Monatsmiete</span></th><td>' + money(q.provisioning) + '</td></tr>' +
            '<tr><th scope="row">Versand<span class="aaas-sub">einmalig</span></th><td>' + money(q.shipping) + '</td></tr>' +
            '<tr class="aaas-row-major"><th scope="row">Heute fällig</th><td>' + money(q.dueToday) + '</td></tr>' +
            '<tr><th scope="row">Ab Monat 2 monatlich</th><td>' + money(q.monthly) + '</td></tr>' +
            '<tr><th scope="row">Gesamt über ' + TERMS.months + ' Monate<span class="aaas-sub">inklusive Bereitstellung und Versand</span></th><td>' + money(q.totalCost) + '</td></tr>' +
          '</tbody></table>'
        : '';
    }

    // a voucher cannot apply to a rental contract, and the express buttons skip the
    // payment step entirely so they cannot carry a recurring SEPA mandate
    ['.coupon-form-container', 'section.spc-express', '.payment-buttons'].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (n) {
        n.classList.toggle('aaas-hidden-by-rent', renting);
      });
    });
    document.querySelectorAll('section.spc-express').forEach(function (ex) {
      var sep = ex.nextElementSibling;
      if (sep && sep.classList.contains('separator')) sep.classList.toggle('aaas-hidden-by-rent', renting);
    });

    // only SEPA and card can carry the recurring mandate
    document.querySelectorAll('.payment-methods [id^="payment-icon-"]').forEach(function (n) {
      var id = n.id.replace('payment-icon-', '');
      var keep = /sepa|credit-card|mastercard|american-express/.test(id);
      (n.closest('li, .payment-method, label') || n)
        .classList.toggle('aaas-hidden-by-rent', renting && !keep);
    });

    // the commitment stays visible in the summary panel for the whole flow, so it
    // is never out of sight while the customer works through the steps
    renderConsent(q, renting);
    // the live flow leaves the checkout for a real success page
    if (step() >= 4) { window.location.href = 'success.html'; return; }
    renderSteps(q);
  }

  function checkRow(id, label) {
    return '<label class="aaas-check"><input type="checkbox" id="' + id + '">' +
      '<span>' + label + '</span></label>';
  }

  /* Spec A states the mandate as prose, which is what LUMAS-16152 asks for
   * ("not a checkbox in the fine print"). Spec B's checklist asks for explicit
   * tickboxes plus an opt-out of the withdrawal period for an immediate start. */
  function rentConsent(q) {
    if (TERMS.consent !== 'tickbox') {
      return '<div class="aaas-consent"><h3>SEPA-Lastschriftmandat</h3>' +
        '<p>Du ermächtigst LUMAS, monatlich <b>' + money(q.monthly) + '</b> von deinem Konto ' +
        'einzuziehen, erstmals <b>' + money(q.dueToday) + '</b> zum Start. Das Mandat gilt für ' +
        'die Dauer des Mietvertrags über ' + TERMS.months + ' Monate.</p>' +
        '<p>Du kannst die Zahlungsart jederzeit in deinem Konto ändern.</p></div>';
    }
    return '<div class="aaas-consent"><h3>Zustimmungen</h3>' +
      checkRow('aaas_c_contract',
        'Ich habe den <a href="#">Mietvertrag</a> gelesen und bestätige ihn.') +
      checkRow('aaas_c_debit',
        'Ich stimme der wiederkehrenden Abbuchung von <b>' + money(q.monthly) +
        '</b> im Monat per SEPA-Lastschrift oder Kreditkarte zu.') +
      checkRow('aaas_c_start',
        'Ich möchte sofort starten und verzichte auf mein ' + TERMS.withdrawalDays +
        '-tägiges Widerrufsrecht.') +
      '<p class="aaas-note">Ohne diesen Verzicht beginnt die Miete nach Ablauf der ' +
        TERMS.withdrawalDays + ' Tage.</p>' +
      '<p class="aaas-note">Den Mietvertrag findest du nach der Bestellung in deinem ' +
        'Kundenkonto.</p></div>';
  }

  function renderConsent(q, renting) {
    var node = document.getElementById('aaas-consent');
    if (!renting) { if (node) node.remove(); return; }
    if (!node) {
      var anchor = document.querySelector('aside .cart-items-container') || document.querySelector('aside');
      if (!anchor) return;
      node = el('div', 'aaas-consent');
      node.id = 'aaas-consent';
      anchor.insertAdjacentElement('afterend', node);
    }
    node.innerHTML =
      '<h3>Das buchst du</h3>' +
      '<p>Du schließt einen Mietvertrag über <b>' + TERMS.months + ' Monate</b> ab. Heute werden ' +
        '<b>' + money(q.dueToday) + '</b> abgebucht, danach monatlich <b>' + money(q.monthly) +
        '</b> per SEPA-Lastschrift oder Kreditkarte.</p>' +
      '<p>Übernehmen kannst du jederzeit. 80 % deiner gezahlten Miete werden angerechnet, ab dem ' +
        q.ownedFromMonth + '. Monat liegt der Übernahmepreis bei ' + money(0) + '. Tausch und ' +
        'Rückgabe sind ab Monat ' + TERMS.months + ' möglich.</p>' +
      '<p>' + TERMS.withdrawalDays + ' Tage Widerrufsrecht ab Lieferung. Es gelten die ' +
        'Mietbedingungen und die Widerrufsbelehrung.</p>';
  }

  /* ---------- checkout steps ----------
   * The captured page only contains the guest/customer step: address, payment and
   * summary are server-rendered after an email is submitted, so they are not in the
   * clone. They are built here using the checkout's own markup patterns
   * (.col-xs-12 wrappers with a floating <label>, button.btn, h1.main-title) so they
   * inherit the shop's styling rather than a look invented for the prototype. */

  // Stages mirror the live checkout: 1 = the real captured email step,
  // 2 = billing address, 3 = payment (which carries the paid action, there is no
  // separate summary step), 4 = confirmation.
  var STEP_KEY = 'aaas-step';
  var DATA_KEY = 'aaas-order';

  function step() {
    try { return parseInt(sessionStorage.getItem(STEP_KEY), 10) || 1; } catch (e) { return 1; }
  }
  function setStep(n) { try { sessionStorage.setItem(STEP_KEY, String(n)); } catch (e) {} }
  function orderData() {
    try { return JSON.parse(sessionStorage.getItem(DATA_KEY) || '{}'); } catch (e) { return {}; }
  }
  function saveOrder(patch) {
    var d = orderData();
    Object.keys(patch).forEach(function (k) { d[k] = patch[k]; });
    try { sessionStorage.setItem(DATA_KEY, JSON.stringify(d)); } catch (e) {}
  }

  function field(id, label, type, value) {
    return '<div class="col-xs-12 aaas-field">' +
      '<input id="' + id + '" name="' + id + '" type="' + (type || 'text') +
        '" placeholder="' + label + '*" value="' + (value || '') + '" required>' +
      '<label class="required" for="' + id + '">' + label + '</label></div>';
  }

  function payOption(id, name, note, checked) {
    return '<label class="aaas-pay' + (checked ? ' is-on' : '') + '">' +
      '<input type="radio" name="aaas-payment" value="' + id + '"' + (checked ? ' checked' : '') + '>' +
      // NOT a bare <span>: the checkout styles label > span as its custom radio dot
      '<span class="aaas-pay-text"><b>' + name + '</b>' +
      (note ? '<small>' + note + '</small>' : '') + '</span></label>';
  }

  // the live checkout collapses a completed section into a labelled row with an
  // edit link, instead of showing a numbered progress bar
  function summaryRow(label, body, note, toStep) {
    return '<div class="aaas-corow">' +
      '<div class="aaas-corow-label">' + label + '</div>' +
      '<div class="aaas-corow-body">' + body +
        (note ? '<em>' + note + '</em>' : '') + '</div>' +
      '<button type="button" class="aaas-link aaas-back" data-step="' + toStep + '">Ändern</button>' +
    '</div>';
  }

  // The page carries the brand marks as <symbol> entries in an SVG sprite, which
  // render at 0x0 unless referenced. Point at them with <use> rather than cloning
  // the symbol (that produced duplicate ids and nothing visible), and keep the
  // wrapper an <svg>: a <span> child of the label inherits the custom radio dot.
  function payMark(id) {
    var sym = document.getElementById('payment-icon-' + id);
    if (!sym) return '';
    // The marks do not share a box: Pay by Bank is 576x213, PayPal's wordmark
    // 89x22, the card badges 60x40. Each svg carries its own ratio so none is
    // stretched or cropped, and the CSS fixes only the height.
    var vb = sym.getAttribute('viewBox') || '0 0 60 40';
    var n = vb.split(/[\s,]+/);
    return '<svg class="aaas-payrow-mark" viewBox="' + vb +
      '" style="aspect-ratio:' + n[2] + '/' + n[3] + '" aria-hidden="true">' +
      '<use href="#payment-icon-' + id + '"></use></svg>';
  }

  function payRow(id, name, checked) {
    return '<label class="aaas-payrow">' +
      '<input type="radio" name="aaas-payment" value="' + id + '"' + (checked ? ' checked' : '') + '>' +
      '<span class="aaas-payrow-name">' + name + '</span>' + payMark(id) + '</label>';
  }

  // Express checkout, buy mode only: these routes skip the payment step, so they
  // cannot carry the recurring SEPA mandate a rental needs. Brand marks come from
  // the shop's own sprite rather than being redrawn.
  // The sprite's amazon-pay symbol is a square card badge rather than a wordmark,
  // so at button size it reads as an illegible tile next to PayPal's logotype.
  // The wordmark is set as text instead, which is what the live button shows.
  var EXPRESS_WORD = { 'amazon-pay': 'amazon pay' };

  function expressBtn(id, label) {
    var word = EXPRESS_WORD[id];
    if (word) {
      return '<button type="button" class="aaas-express-btn" data-brand="' + id +
        '" aria-label="' + label + '"><span class="aaas-express-word">' + word +
        '</span></button>';
    }
    var sym = document.getElementById('payment-icon-' + id);
    var open = '<button type="button" class="aaas-express-btn" data-brand="' + id +
      '" aria-label="' + label + '">';
    if (!sym) return open + '<span class="aaas-express-word">' + label + '</span></button>';
    // Each mark has its own viewBox (PayPal is a 89x22 wordmark, Amazon Pay a
    // 32x32 glyph, Apple Pay a 60x40 badge). Forcing one box on all three
    // stretched two of them, so the button carries the symbol's own ratio.
    var vb = sym.getAttribute('viewBox') || '0 0 60 40';
    var n = vb.split(/[\s,]+/);
    return open + '<svg viewBox="' + vb + '" style="aspect-ratio:' + n[2] + '/' + n[3] +
      '" aria-hidden="true"><use href="#payment-icon-' + id + '"></use></svg></button>';
  }

  /* The shop ships its own express block at the top of the checkout, and all
   * three routes in it are provider custom elements drawn by that provider's
   * SDK against a live merchant session: <paypal-express-checkout-button>,
   * <amazon-checkout-button>, <apple-pay-checkout-button>. None of those SDKs
   * can run in a static clone, so the section renders empty apart from Amazon's
   * grey placeholder image. These stand-ins take their place so the buy flow
   * shows what the live checkout shows. They are presentation only: no express
   * route is wired, which is also why rent mode hides the block outright. */
  function fillShopExpress() {
    var box = document.querySelector('section.spc-express .buttons-container');
    if (!box || box.dataset.aaasFilled) return;
    box.dataset.aaasFilled = '1';
    box.innerHTML = '<div class="aaas-express-row">' +
      expressBtn('paypal', 'PayPal') +
      expressBtn('amazon-pay', 'Amazon Pay') +
      expressBtn('apple-pay', 'Apple Pay') +
    '</div>';
  }

  function toggleRow(label, on) {
    return '<label class="aaas-toggle"><input type="checkbox"' + (on ? ' checked' : '') + '>' +
      '<span class="aaas-toggle-track"></span>' + label + '</label>';
  }

  // both the step flow and the confirmation need these, and either can be the
  // first to run on a fresh load, so creating them lives in one place
  function ensureHost(main) {
    var host = document.getElementById('aaas-step-host');
    if (!host) {
      // The host goes BELOW the express block and its "oder" divider, not
      // straight under the H1: express stays on screen through the flow, and
      // anchoring above it would push it under the step content from step 2 on.
      var anchor = main.querySelector('h1.main-title') || main.firstElementChild;
      var ex = main.querySelector('section.spc-express');
      if (ex) {
        anchor = ex;
        var sep = ex.nextElementSibling;
        if (sep && sep.classList.contains('separator')) anchor = sep;
      }
      host = el('div'); host.id = 'aaas-step-host';
      anchor.insertAdjacentElement('afterend', host);
    }
    return { host: host };
  }

  function renderSteps(q) {
    var main = document.querySelector('.spc-container main');
    if (!main) return;
    var renting = mode() === 'rent';
    var s = step();
    var d = orderData();

    var host = ensureHost(main).host;

    // step 1 keeps the real captured markup; later steps replace the column.
    // The express block and its "oder" divider are exempt: on the live checkout
    // they sit above the flow the whole way, not only on the first step.
    [].forEach.call(main.children, function (c) {
      if (c === host || c.tagName === 'H1') return;
      var prev = c.previousElementSibling;
      if (c.classList.contains('spc-express') ||
          (c.classList.contains('separator') && prev &&
           prev.classList.contains('spc-express'))) return;
      c.classList.toggle('aaas-hidden-by-step', s > 1);
    });

    if (s === 1) { host.innerHTML = ''; return; }

    var mailInput = document.getElementById('loginForm_email');
    var email = d.email || (mailInput && mailInput.value) || 'gast@beispiel.at';
    var contact = summaryRow('Kontakt', email,
      'Als Gast bestellen, ein Passwort kannst du später anlegen.', 1);

    if (s === 2) {
      host.innerHTML =
        contact +
        '<h2 class="aaas-step-title">Rechnungsadresse</h2>' +
        '<div class="aaas-titlerow"><div class="aaas-stat-label">Anrede</div>' +
          '<label><input type="radio" name="aaas-title" checked> Herr</label>' +
          '<label><input type="radio" name="aaas-title"> Frau</label>' +
          '<label><input type="radio" name="aaas-title"> Divers</label></div>' +
        '<div class="aaas-form">' +
          field('aaas_first', 'Vorname', 'text', d.first) +
          field('aaas_last', 'Nachname', 'text', d.last) +
          field('aaas_company', 'Firma', 'text', d.company) +
          field('aaas_street', 'Straße und Hausnummer', 'text', d.street) +
          field('aaas_extra', 'Adresszusatz', 'text', d.extra) +
          field('aaas_zip', 'PLZ', 'text', d.zip) +
          field('aaas_city', 'Ort', 'text', d.city) +
          '<div class="col-xs-12 aaas-field"><select id="aaas_country" name="aaas_country">' +
            '<option>Österreich</option><option>Schweiz</option><option>Deutschland</option>' +
          '</select><label for="aaas_country">Land</label></div>' +
          field('aaas_phone', 'Telefonnummer für Rückfragen zur Lieferung', 'tel', d.phone) +
        '</div>' +
        toggleRow('Die Rechnungsadresse entspricht der Lieferadresse', true) +
        toggleRow('Schnellstmöglich versenden', true) +
        (renting
          ? '<p class="aaas-note">Das Werk bleibt während der Mietzeit Eigentum von LUMAS und wird an ' +
            'dieser Adresse genutzt. Wenn du umziehst, sag uns bitte Bescheid.</p>'
          : '') +
        '<div class="aaas-actions">' +
          '<button type="button" class="btn aaas-next" data-step="3">Weiter zu den Zahlungsoptionen</button>' +
        '</div>';
      return;
    }

    // step 3 carries the paid action: the live checkout has no separate summary step
    // fictional placeholders only: no real customer address belongs in a prototype
    var addr = [d.first, d.last].filter(Boolean).join(' ') || 'Alex Beispiel';
    var street = d.street || 'Musterstraße 1';
    var town = [d.zip || '1010', d.city || 'Wien'].join(' ');

    // only SEPA and card can carry a recurring Adyen mandate
    var methods = renting
      ? payRow('sepa', 'SEPA-Lastschrift', true) +
        payRow('adyen-credit-card-cse', 'Kreditkarte')
      : payRow('adyen-paypal', 'PayPal', true) +
        payRow('adyen-credit-card-cse', 'Kreditkarte') +
        payRow('invoice', 'Rechnung, zahle nach Erhalt deiner Bestellung') +
        payRow('klarna', 'Klarna, später zahlen') +
        payRow('paybybank', 'Pay by Bank') +
        payRow('sepa', 'SEPA-Lastschrift');

    host.innerHTML =
      contact +
      summaryRow('Lieferung an', addr + '<br>' + street + '<br>' + town + '<br>Österreich',
        'Die Rechnungsadresse entspricht der Lieferadresse', 2) +
      '<h2 class="aaas-step-title">Zahlung</h2>' +
      '<p class="aaas-note" style="margin-top:0">' +
        (renting
          ? 'Für die Miete brauchen wir eine Zahlungsart, die wiederkehrend belastet werden ' +
            'kann. Rechnung, PayPal und die Express-Zahlarten stehen deshalb nicht zur Verfügung.'
          : 'Bitte wähle eine der verfügbaren Zahlungsarten.') +
      '</p>' +
      '<div class="aaas-payrows">' + methods + '</div>' +
      (renting ? rentConsent(q) : '') +
      '<p class="aaas-legal">' +
        (renting
          ? 'Mit dem Abschluss schließt du einen Mietvertrag über ' + TERMS.months +
            ' Monate ab. Es gelten unsere <a href="#">Mietbedingungen</a> und unsere ' +
            '<a href="#">Datenschutzerklärung</a>. Informationen zum Widerrufsrecht, ' +
            TERMS.withdrawalDays + ' Tage ab Lieferung, findest du <a href="#">hier</a>.'
          : 'Mit dem Abschluss dieses Kaufs akzeptierst du unsere <a href="#">AGB</a> sowie ' +
            'unsere <a href="#">Datenschutzerklärung</a>. Informationen zum Widerrufsrecht ' +
            'findest du <a href="#">hier</a>.') +
      '</p>' +
      '<div class="aaas-actions">' +
        '<button type="button" class="btn aaas-next" data-step="4">' +
          (renting ? 'Zahlungspflichtig mieten' : 'Jetzt bestellen') + '</button>' +
      '</div>';
  }

  function renderConfirmation(q) {
    var renting = mode() === 'rent';
    var main = document.querySelector('.spc-container main');
    var aside = document.querySelector('.spc-container aside');
    if (!main) return;
    var refs = ensureHost(main);
    var host = refs.host;
    if (aside) aside.classList.add('aaas-hidden-by-step');
    [].forEach.call(main.children, function (c) {
      if (c === host) return;
      c.classList.add('aaas-hidden-by-step');
    });
    host.classList.remove('aaas-hidden-by-step');
    host.innerHTML =
      '<div class="aaas-confirm">' +
        '<h2>' + (renting ? 'Deine Miete läuft' : 'Danke für deine Bestellung') + '</h2>' +
        (renting
          ? '<p class="aaas-lede">Du hast das Werk gemietet, nicht gekauft. Es bleibt bis zu einer ' +
            'Übernahme Eigentum von LUMAS.</p>' +
            '<div class="aaas-figures">' +
              figure('Heute abgebucht', '<b>' + money(q.dueToday) + '</b>') +
              figure('Ab dem nächsten Monat', '<b>' + money(q.monthly) + '</b>', TERMS.months + ' Monate') +
            '</div>' +
            '<div class="aaas-label" style="margin-top:var(--sp-6)">Wie es weitergeht</div>' +
            '<ul class="aaas-points">' +
              '<li>Den Mietvertrag bekommst du per E-Mail, er liegt auch in deinem Konto.</li>' +
              // no insurance claim: that decision is still open and blocks the contract
              '<li>Wir liefern in sieben Tagen, fertig zum Aufhängen.</li>' +
              '<li>Die erste monatliche Rate ziehen wir einen Monat nach Lieferung ein.</li>' +
              '<li>Übernahme, Tausch und Rückgabe steuerst du in deinem Konto.</li>' +
            '</ul>' +
            '<div class="aaas-actions"><a class="btn" href="account-rental.html">Zu deiner Miete</a></div>'
          : '<p class="aaas-lede">Wir haben deine Bestellung erhalten und melden uns mit der ' +
            'Versandbestätigung.</p>') +
      '</div>';
  }

  /* ---------- order success ----------
   * Mirrors the live success page: centred headline, order line, a survey panel
   * beside a help panel, the ordered work, then account / share / follow panels.
   * The rental variant drops the ownership framing and adds the money and dates
   * the customer actually needs, plus the contract and the route to the account. */

  function addMonths(n) {
    var d = new Date();
    d.setMonth(d.getMonth() + n);
    var p = function (v) { return (v < 10 ? '0' : '') + v; };
    return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear();
  }

  function initSuccess() {
    var host = document.querySelector('[data-aaas-success]');
    if (!host) return;
    var renting = mode() === 'rent';
    var q = quote(parseFloat(host.getAttribute('data-gross')), FALLBACK_SHIPPING);
    var order = host.getAttribute('data-order');
    var panel = function (cls, inner) { return '<div class="aaas-sx-panel ' + cls + '">' + inner + '</div>'; };

    var figures = !renting ? '' : panel('aaas-sx-figures',
      '<div class="aaas-label">Deine Miete</div>' +
      '<div class="aaas-grid">' +
        '<div><div class="aaas-stat-label">Heute abgebucht</div>' +
          '<div class="aaas-stat-value">' + money(q.dueToday) + '</div></div>' +
        '<div><div class="aaas-stat-label">Ab dem nächsten Monat</div>' +
          '<div class="aaas-stat-value">' + money(q.monthly) + '</div></div>' +
        '<div><div class="aaas-stat-label">Nächste Abbuchung</div>' +
          '<div class="aaas-stat-value">' + addMonths(1) + '</div></div>' +
        '<div><div class="aaas-stat-label">Mindestlaufzeit endet</div>' +
          '<div class="aaas-stat-value">' + addMonths(TERMS.months) + '</div></div>' +
      '</div>' +
      '<p class="aaas-note">Den Mietvertrag schicken wir dir per E-Mail, er liegt auch in deinem ' +
        'Konto. Übernahme, Tausch und Rückgabe steuerst du dort.</p>' +
      '<div class="aaas-actions"><a class="btn" href="account-rental.html">Zu deiner Miete</a></div>');

    host.innerHTML =
      '<div class="aaas-sx">' +
        '<div class="aaas-sx-head">' +
          '<h1>' + (renting ? 'Das Werk zieht bei dir ein' : 'Die Kunst hat ihren Platz gefunden') + '</h1>' +
          '<p>Wir haben deine Bestellung erhalten: #' + order + '.<br>' +
            (renting
              ? 'Du bekommst in Kürze eine E-Mail mit der Bestätigung und deinem Mietvertrag.'
              : 'Du bekommst in Kürze eine E-Mail mit der Bestätigung und der Übersicht deiner Bestellung.') +
          '</p>' +
        '</div>' +
        figures +
        '<div class="aaas-sx-row">' +
          panel('aaas-sx-survey', '<h2>Wie hast du von uns erfahren?</h2>' +
            '<p class="aaas-note">Eine kurze Frage, damit wir wissen, was funktioniert.</p>') +
          panel('aaas-sx-help', '<h2>Hast du Fragen zu deiner Bestellung?</h2>' +
            '<p>Ruf uns an unter der LUMAS Hotline: 030 30 30 69 69</p>' +
            '<p>Schreib uns über unser <a href="#">Kontaktformular</a></p>' +
            '<p>Oder sprich direkt mit jemandem im Live Chat</p>') +
        '</div>' +
        panel('aaas-sx-work',
          '<div class="aaas-sx-work-head">' +
            '<span class="aaas-label">' + (renting ? 'Gemietet' : 'Gekauft') + '</span>' +
            '<span>Bestellung #' + order + '</span>' +
            '<span>' + (renting
              ? 'Lieferung in 5 bis 7 Werktagen'
              : 'Lieferung in 5 bis 7 Werktagen') + '</span>' +
          '</div>' +
          '<div class="aaas-sx-work-row">' +
            '<img src="' + host.getAttribute('data-image') + '" alt="">' +
            '<div><b>' + host.getAttribute('data-artist') + '</b>' +
              '<div class="aaas-meta">' + host.getAttribute('data-title') + ' · ' +
                host.getAttribute('data-sku') + '</div>' +
              (renting ? '<div class="aaas-meta">' + money(q.monthly) + ' im Monat, ' +
                TERMS.months + ' Monate</div>' : '') +
            '</div>' +
            '<a class="aaas-link" href="pdp.html">Werk ansehen</a>' +
          '</div>') +
        '<div class="aaas-sx-row">' +
          panel('aaas-sx-account', '<h2>Erstelle dein kostenloses LUMAS Konto</h2>' +
            '<ul class="aaas-points"><li>Bestellungen und Abbuchungen im Blick behalten.</li>' +
            '<li>' + (renting ? 'Mietvertrag und Laufzeit jederzeit einsehen.' :
              'Lieferungen einfach verfolgen.') + '</li></ul>' +
            '<div class="aaas-form" style="grid-template-columns:1fr">' +
              field('aaas_sx_mail', 'E-Mail', 'email', '') +
              field('aaas_sx_pass', 'Passwort', 'password', '') +
            '</div>' +
            '<button type="button" class="aaas-btn">Konto anlegen</button>' +
            '<p class="aaas-legal">Mit der Registrierung akzeptierst du unsere <a href="#">AGB</a> ' +
              'und unsere <a href="#">Datenschutzerklärung</a>.</p>') +
          '<div class="aaas-sx-stack">' +
            panel('', '<h2>' + (renting ? 'Zeig, was bei dir hängt' : 'Zeig dein neues Meisterwerk') + '</h2>' +
              '<p class="aaas-note">Lass deine Freunde sehen, was jetzt bei dir an der Wand hängt.</p>' +
              '<button type="button" class="aaas-pill">Jetzt teilen</button>') +
            panel('', '<h2>Werde LUMAS Fan</h2>' +
              '<p class="aaas-note">Folge uns für neue Editionen und Einblicke.</p>') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* ---------- account ---------- */

  function initAccount() {
    var host = document.querySelector('[data-aaas-account]');
    if (!host) return;
    var q = quote(parseFloat(host.getAttribute('data-gross')), FALLBACK_SHIPPING);
    // the fixture says 14 months paid, which is impossible on spec B's 12-month
    // term, so clamp it and derive the end date from the term rather than a fixture
    var paid = Math.min(parseInt(host.getAttribute('data-months-paid'), 10) || 0, TERMS.months);
    var pct = Math.min(100, Math.round(paid / TERMS.months * 100));
    var specB = TERMS.pdpToggle;   // the 21 Aug checklist adds several account items

    var forward = function (s, n) {
      var p = String(s).split('.').map(Number);
      var d = new Date(p[2], p[1] - 1 + n, p[0]);
      var pad = function (v) { return (v < 10 ? '0' : '') + v; };
      return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
    };
    var endDate = forward(host.getAttribute('data-start'), TERMS.months);

    var stat = function (l, v) {
      return '<div><div class="aaas-stat-label">' + l + '</div><div class="aaas-stat-value">' + v + '</div></div>';
    };

    // step a dd.mm.yyyy date back n whole months
    var shift = function (s, back) {
      var p = String(s).split('.').map(Number);
      var d = new Date(p[2], p[1] - 1 - back, p[0]);
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
    };

    var rows = '';
    for (var i = 0; i < 4 && paid - i > 0; i++) {
      rows += '<tr><td>Rate ' + (paid - i) + ' von ' + TERMS.months + '</td>' +
              '<td>' + shift(host.getAttribute('data-next'), i + 1) + '</td>' +
              '<td>Bezahlt</td><td>' + money(q.monthly) + '</td>' +
              // spec B's checklist asks for invoices alongside the debit history
              (TERMS.pdpToggle ? '<td><a class="aaas-link" href="#">Rechnung</a></td>' : '') +
              '</tr>';
    }

    // the real account sidebar, with Mieten added. In the live shop this is one
    // more entry in the navigation.twig array plus a sprite symbol.
    var ICON = {
      dash: '<path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
      user: '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
      pin: '<path d="M12 22s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="11" r="2.5"/>',
      doc: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v4h4"/>',
      rent: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
      chart: '<path d="M4 20V11M10 20V4M16 20v-6M2 22h20"/>',
      mail: '<path d="M3 6h18v12H3z"/><path d="m3 7 9 6 9-6"/>',
      link: '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
      out: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="m10 16-4-4 4-4"/><path d="M6 12h10"/>'
    };
    var NAV = [
      ['Dashboard', 'dash'], ['Profil', 'user'], ['Adressen', 'pin'],
      ['Bestellungen', 'doc'], ['Mieten', 'rent'], ['Editionsverlauf', 'chart'],
      ['E-Mail Einstellungen', 'mail'], ['Verbundene Konten', 'link'], ['Abmelden', 'out']
    ];
    var nav = NAV.map(function (n) {
      var cur = n[0] === 'Mieten' ? ' aria-current="page"' : '';
      return '<a href="#"' + cur + '><svg viewBox="0 0 24 24" aria-hidden="true">' +
             ICON[n[1]] + '</svg>' + n[0] + '</a>';
    }).join('');

    host.innerHTML =
      '<div class="aaas-acct">' +
        '<div class="aaas-acct-head">' +
          '<h1>Willkommen ' + host.getAttribute('data-name') + '</h1>' +
          '<p>Dein LUMAS-Konto. Hier findest du deine Bestellhistorie, deine Miete und Informationen.</p>' +
        '</div>' +
        '<div class="aaas-acct-body">' +
          '<nav class="aaas-acct-nav">' + nav + '</nav>' +
          '<div class="aaas-acct-main">' +
            '<div class="aaas-label">Dein gemietetes Werk</div>' +
            '<div class="aaas-panel"><div class="aaas-panel-inner">' +
              '<div class="aaas-card-head">' +
                '<img src="' + host.getAttribute('data-image') + '" alt="">' +
                '<div><h2 class="aaas-card-title">' + host.getAttribute('data-title') + '</h2>' +
                  '<div class="aaas-meta">' + host.getAttribute('data-artist') + '<br>' +
                    host.getAttribute('data-format') + '<br>Bestellnummer ' +
                    host.getAttribute('data-order') + ' · Beginn ' + host.getAttribute('data-start') +
                  '</div></div>' +
              '</div>' +
              '<div class="aaas-progress"><span style="width:' + pct + '%"></span></div>' +
              '<div class="aaas-progress-legend"><span>Monat ' + paid + ' von ' + TERMS.months + '</span>' +
                '<span>Mindestlaufzeit endet ' + endDate + '</span></div>' +
              (specB
                ? '<p class="aaas-note">Nach der Mindestlaufzeit verlängert sich die Miete ' +
                  'monatlich, bis du übernimmst, tauschst oder zurückgibst.</p>'
                : '') +
              '<div class="aaas-grid">' +
                stat('Monatsmiete', money(q.monthly)) +
                stat('Nächste Abbuchung', host.getAttribute('data-next')) +
                stat('Übernahmepreis heute', money(buyoutAt(q, paid))) +
                (specB
                  ? stat('Erstes Replacement', endDate)
                  : stat('Bereits gezahlt', money(round2(q.monthly * paid)))) +
              '</div>' +
            '</div></div>' +

            // spec B: payment method is self-service, with a CS route for an expired card
            (specB
              ? '<div class="aaas-label">Zahlungsart</div>' +
                '<div class="aaas-panel"><div class="aaas-panel-inner">' +
                  '<div class="aaas-payline"><span>SEPA-Lastschrift, IBAN endet auf 4021</span>' +
                    '<button type="button" class="aaas-link">Ändern</button></div>' +
                  '<p class="aaas-note">Karte abgelaufen oder Bank gewechselt? ' +
                    '<a href="#">Zahlungsart über unser Team aktualisieren</a>.</p>' +
                '</div></div>'
              : '') +

            '<div class="aaas-label">Abbuchungen</div>' +
            '<table class="aaas-orders"><thead><tr><th>Rate</th><th>Datum</th>' +
              '<th>Status</th><th>Betrag</th>' + (specB ? '<th>Rechnung</th>' : '') +
              '</tr></thead><tbody>' + rows + '</tbody></table>' +

            '<div class="aaas-label" style="margin-top:var(--sp-6)">Zum Laufzeitende</div>' +
            '<div class="aaas-options">' +
              '<div class="aaas-option"><h4>Übernehmen</h4>Jederzeit möglich. ' +
                Math.round(TERMS.credit * 100) + ' % deiner gezahlten Miete werden angerechnet. ' +
                'Aktuell ' + money(buyoutAt(q, paid)) + '.' +
                (specB ? '<button type="button" class="aaas-link" data-eot="buy">' +
                  'Ankauf starten</button>' : '') + '</div>' +
              '<div class="aaas-option" data-locked><h4>Tauschen</h4>Ab Monat ' + TERMS.months +
                '. Gegen ein neues Bereitstellungsentgelt.' +
                // the checklist leaves this one open: account flow or CS only
                (specB ? '<span class="aaas-open">Offen: Anfrage im Konto oder nur über ' +
                  'unser Team</span>' : '') + '</div>' +
              '<div class="aaas-option" data-locked><h4>Zurückgeben</h4>Ab Monat ' + TERMS.months +
                '. Das Werk muss in verkaufsfähigem Zustand sein, der Echtheitsnachweis muss beiliegen.' +
                (specB ? '<button type="button" class="aaas-link" data-eot="return">' +
                  'Rückgabe anfragen</button>' : '') + '</div>' +
            '</div>' +
            '<div id="aaas-eot"></div>' +

            (specB
              ? '<div class="aaas-panel aaas-cs"><div class="aaas-panel-inner">' +
                  '<h2 class="aaas-card-title">Kündigung oder Ankauf besprechen</h2>' +
                  '<p class="aaas-note">Ruf uns an unter 030 30 30 69 69 oder schreib uns über ' +
                    'das <a href="#">Kontaktformular</a>. Wir wickeln Übernahme, Tausch und ' +
                    'Rückgabe persönlich mit dir ab.</p>' +
                '</div></div>'
              : '<p class="aaas-note">Für Übernahme, Tausch und Rückgabe melde dich bei unserem Team.</p>') +
          '</div>' +
        '</div>' +
      '</div>';

    // spec B: the buyout and return requests resolve inline rather than dead-ending
    var eot = document.getElementById('aaas-eot');
    if (eot) host.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-eot]');
      if (!b) return;
      if (b.getAttribute('data-eot') === 'buy') {
        eot.innerHTML = '<div class="aaas-consent"><h3>Ankauf bestätigen</h3>' +
          '<p>Du übernimmst <b>' + host.getAttribute('data-title') + '</b> zum aktuellen ' +
          'Übernahmepreis von <b>' + money(buyoutAt(q, paid)) + '</b>. Die monatliche ' +
          'Abbuchung endet danach.</p>' +
          '<button type="button" class="aaas-btn" data-eot="buy-confirm">Ankauf zahlungspflichtig bestätigen</button></div>';
      } else if (b.getAttribute('data-eot') === 'buy-confirm') {
        eot.innerHTML = '<div class="aaas-consent"><h3>Ankauf angefragt</h3>' +
          '<p>Wir haben deine Anfrage erhalten und melden uns mit der Abschlussrechnung. ' +
          'Die monatliche Abbuchung stoppen wir mit dem Abschluss.</p></div>';
      } else if (b.getAttribute('data-eot') === 'return') {
        eot.innerHTML = '<div class="aaas-consent"><h3>Rückgabe anfragen</h3>' +
          '<p>Wir schicken dir Verpackung und Rücksendeetikett. Bitte lege den ' +
          'Echtheitsnachweis bei und gib das Werk in verkaufsfähigem Zustand zurück.</p>' +
          '<p>Nach Eingang prüfen wir den Zustand und beenden den Mietvertrag.</p></div>';
      }
      eot.scrollIntoView({ block: 'nearest' });
    });
  }

  /* ---------- boot ---------- */

  function boot() {
    try { initPdp(); } catch (e) { console.warn('[aaas] pdp', e); }
    try { initSuccess(); } catch (e) { console.warn('[aaas] success', e); }
    try { initAccount(); } catch (e) { console.warn('[aaas] account', e); }

    // the checkout's order summary renders late, so keep trying briefly
    if (document.querySelector('.spc-container')) {
      var tries = 0;
      (function attempt() {
        if (document.getElementById('aaas-mode')) return;
        try { initCheckout(); } catch (e) { console.warn('[aaas] checkout', e); }
        if (!document.getElementById('aaas-mode') && ++tries < 15) setTimeout(attempt, 400);
      })();
    }

    if (!document.querySelector('.aaas-flag')) {
      var flag = el('div', 'aaas-flag');
      flag.innerHTML =
        '<span class="aaas-flag-title">Prototyp · Art as a Service</span>' +
        '<span class="aaas-flag-spec">' +
          '<button type="button" data-spec="A"' +
            (spec() === 'A' ? ' aria-pressed="true"' : '') + '>Spec A</button>' +
          '<button type="button" data-spec="B"' +
            (spec() === 'B' ? ' aria-pressed="true"' : '') + '>Spec B</button>' +
        '</span>' +
        '<span class="aaas-flag-note">' + TERMS.label + '</span>' +
        // the buy/rent presentation only exists in spec B, so only offer it there
        (TERMS.pdpToggle
          ? '<span class="aaas-flag-spec aaas-flag-variant">' +
            Object.keys(VARIANTS).map(function (k) {
              return '<button type="button" data-aaas-variant="' + k + '"' +
                (variant() === k ? ' aria-pressed="true"' : '') + '>' + VARIANTS[k] + '</button>';
            }).join('') + '</span>'
          : '');
      // switching spec changes the pricing basis, so the page is re-rendered whole
      flag.addEventListener('click', function (e) {
        var v = e.target.closest('[data-aaas-variant]');
        if (v) { setVariant(v.getAttribute('data-aaas-variant')); location.reload(); return; }
        var b = e.target.closest('[data-spec]');
        if (!b) return;
        setSpec(b.getAttribute('data-spec'));
        try { sessionStorage.removeItem(TERM_KEY); } catch (err) {}
        location.reload();
      });
      document.body.appendChild(flag);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 400); });
  } else {
    setTimeout(boot, 400);
  }
})();
