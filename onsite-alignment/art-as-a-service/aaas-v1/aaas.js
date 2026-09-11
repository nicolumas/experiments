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

  /* One model, and it is the "Verbindliche Konditionen" in the GLOB-2053
   * description. An earlier 21 Aug checklist in the comments proposed a net
   * basis, a 3/6/12 term choice, 14-day withdrawal and tickbox consent; the
   * comments are not the spec, and every one of those contradicts the
   * description, so none of them survive here. The term is fixed at 36 months
   * and there is no term selector, which both tickets state outright. */
  var MODE_KEY = 'aaas-mode';
  var STEP_KEY = 'aaas-step';
  var PAY_KEY = 'aaas-pay';
  var DATA_KEY = 'aaas-order';
  var FALLBACK_SHIPPING = 39; // AT. The epic's worked example uses the DE figure of 29.

  var TERMS = {
    rate: 0.0375,          // of the GROSS price
    months: 36,            // fixed, no selector
    credit: 0.80,          // of rent paid, against a buyout
    withdrawalDays: 60,    // from delivery
    noticeDays: 30,        // to the end of the month
    exchangeEarlyShare: 0.30  // of the higher of the old or new work's price
  };



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

  function rateLabel() {
    return (TERMS.rate * 100).toString().replace('.', ',') + ' % vom Brutto-Verkaufspreis';
  }

  /* ---------- the model ---------- */

  function quote(gross, shipping) {
    var base = gross;                            // the rate is on the gross price
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
            '<li>' + Math.round(TERMS.credit * 100) + ' % deiner gezahlten Miete werden ' +
              'angerechnet, wenn du das Werk übernimmst. Das Bereitstellungsentgelt nicht.</li>' +
            '<li>Übernehmen kannst du jederzeit. Ab dem ' + q.ownedFromMonth + '. Monat liegt der ' +
              'Übernahmepreis bei ' + money(0) + '.</li>' +
            '<li>Tauschen und zurückgeben kannst du ab Monat ' + TERMS.months + '. Ein früherer ' +
              'Tausch kostet ' + Math.round(TERMS.exchangeEarlyShare * 100) + ' % des ' +
              'Kaufpreises und ein neues Bereitstellungsentgelt.</li>' +
            '<li>Kündigungsfrist ' + TERMS.noticeDays + ' Tage zum Monatsende.</li>' +
          '</ul>' +
          '<p class="aaas-note">' + TERMS.withdrawalDays + ' Tage Widerrufsrecht ab Lieferung, ' +
            'dabei trägst du den Rückversand und die Miete für die Nutzungsdauer. Zahlung per ' +
            'SEPA-Lastschrift oder Kreditkarte. Das Werk bleibt bis zur Übernahme Eigentum ' +
            'von LUMAS.</p>' +
        '</div>' +
        '<div class="aaas-drawer-foot">' +
          '<button type="button" class="aaas-btn" data-aaas-rent>In den Warenkorb, zur Miete</button>' +
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
             TERMS.months + ' Monate.</div>';
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
            // the PDP decides with a switch, so the cart repeats that control
            // rather than offering the same choice in another shape
            switchControl(q, renting, 'data-mode="' + (renting ? 'buy' : 'rent') + '"') +
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
  /* The page shows one presentation, "inline". The four others are kept because
   * each was built and reviewed, but they are off the page: reachable only by
   * asking for one in the URL, ?variant=line|seg|switch|rows. Reading it from
   * the URL rather than sessionStorage is deliberate, since a stored value from
   * an earlier session would otherwise pin a reviewer to a presentation with no
   * control left on the page to get back out of it. */
  var VARIANTS = { inline: 'Inline', line: 'Linie', seg: 'Segmented',
                   'switch': 'Switch', rows: 'Zeilen' };

  function variant() {
    try {
      var v = new URLSearchParams(location.search).get('variant');
      return VARIANTS[v] ? v : 'inline';
    } catch (e) { return 'inline'; }
  }

  // The term belongs in the control only when there is no term dropdown under
  // it. With the dropdown present the trigger already names it, and repeating it
  // wrapped the switch label onto a second line at 390px.
  function termSuffix() {
    return ', ' + TERMS.months + ' Monate';
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
    // "Linie": no control at all on the page, renting enters as a sentence and
    // a link, and the terms open in the drawer. The quietest of the five.
    if (variant() === 'line') {
      transformBuyBox(q, false);
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
    var inline = variant() === 'inline';

    // only the inline presentation rewrites the price and the CTA; calling it
    // with false on every other path is what restores them when the variant or
    // the mode changes back
    transformBuyBox(q, inline && renting);

    if (inline) {
      line.className = 'aaas-inline';
      line.innerHTML = inlineControl(q, renting) + (renting ? inlineDetail(q) : '');
    } else {
      line.className = 'aaas-pdp-b';
      line.innerHTML =
        // the shop's own section-header class, so the label matches "wähle Größe…"
        '<div class="pdp-product-section-header">Kaufen oder mieten:</div>' +
        modeChooser(q, renting) +
        (renting ? pdpRentDetail(q) : '');
    }

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

  }

  /* ---------- PDP: the inline presentation ----------
   * A quiet entry line carrying a switch, and flipping it turns the whole
   * buy box over rather than adding a panel beside it: the price
   * becomes a monthly, the CTA becomes "Mieten für X", and the terms open in
   * place. A slide-in was tried first and reads as a detour, so this variant
   * never opens one. No section label and no rule above it either, so in buy
   * mode nothing is added to the page but one line of text. */

  function pdpPriceText() {
    var p = document.querySelector('.pdp-price-container pdp-price');
    return p ? p.textContent.trim() : '';
  }

  function inlineControl(q, renting) {
    return '<button type="button" class="aaas-ms aaas-ms-quiet" role="switch" ' +
      'data-pdptoggle aria-checked="' + renting + '">' +
      '<span class="aaas-ms-track"><span class="aaas-ms-knob"></span></span>' +
      '<span class="aaas-ms-text">' + (renting
        ? 'oder für <b>' + pdpPriceText() + '</b> kaufen'
        : 'oder ab <b>' + money(q.monthly) + '</b>/Monat mieten') +
      '</span></button>';
  }

  function fact(label, value, sub, major) {
    return '<div' + (major ? ' class="aaas-fact-major"' : '') + '><dt>' + label +
      (sub ? '<small>' + sub + '</small>' : '') + '</dt><dd>' + value + '</dd></div>';
  }

  // everything the 21 Aug checklist asks for on the PDP, in place of the panel
  function inlineDetail(q) {
    return '<div class="aaas-inline-detail">' +
      '<dl class="aaas-facts">' +
        fact('Monatsmiete', money(q.monthly), rateLabel()) +
        fact('Bereitstellungsentgelt', money(q.provisioning),
             'einmalig, entspricht einer Monatsmiete') +
        fact('Versand', money(q.shipping), 'einmalig') +
        fact('Heute fällig', money(q.dueToday), null, true) +
        fact('Ab Monat 2 monatlich', money(q.monthly)) +
        fact('Gesamt über ' + TERMS.months + ' Monate', money(q.totalCost),
             'inklusive Bereitstellung und Versand') +
      '</dl>' +
      '<p class="aaas-note">Übernehmen kannst du jederzeit. ' +
        Math.round(TERMS.credit * 100) + ' % deiner gezahlten Miete werden angerechnet, ' +
        'das Bereitstellungsentgelt nicht. Ab dem ' + q.ownedFromMonth + '. Monat liegt der ' +
        'Übernahmepreis bei ' + money(0) + '.</p>' +
      '<p class="aaas-note">Tauschen und zurückgeben kannst du ab Monat ' + TERMS.months +
        ', ein früherer Tausch kostet ' + Math.round(TERMS.exchangeEarlyShare * 100) +
        ' % des Kaufpreises. Kündigungsfrist ' + TERMS.noticeDays + ' Tage zum Monatsende.</p>' +
      '<p class="aaas-note">Widerruf ' + TERMS.withdrawalDays + ' Tage ab Lieferung, dabei ' +
        'trägst du den Rückversand und die Miete für die Nutzungsdauer. Das Werk bleibt bis ' +
        'zur Übernahme Eigentum von LUMAS.</p>' +
      '<p class="aaas-note"><button type="button" class="aaas-link" data-tip="damage">' +
        'Was passiert bei Beschädigung?</button></p>' +
      // deliberately makes no insurance promise: that decision is still open
      '<div class="aaas-tip" hidden>Normale Gebrauchsspuren sind kein Problem. Bei einem ' +
        'Schaden melde dich bei uns, wir klären Reparatur und Kosten gemeinsam.</div>' +
    '</div>';
  }

  /* The buy box itself turns over: the shop's price element is swapped for the
   * monthly and the add-to-cart label becomes the rent one. Both are restored
   * from what was captured, never rebuilt, so buy mode is byte-identical to the
   * page as shipped. The shop's <pdp-price> is hidden rather than rewritten,
   * which also keeps pdpGross() reading the real price underneath. */
  function transformBuyBox(q, renting) {
    var box = document.querySelector('.pdp-price-container');
    if (box) {
      var shopPrice = box.querySelector('pdp-price');
      var rent = box.querySelector('.aaas-price-rent');
      if (renting) {
        // the shop's own .price class carries the buy price's type, so wearing it
        // makes the monthly render in exactly the same face, size and colour,
        // and keeps tracking it across breakpoints. No <b>: the global b rule
        // swaps in archivo-bold, and the shop's price is archivo at 400.
        if (!rent) { rent = el('div', 'price aaas-price-rent'); box.appendChild(rent); }
        rent.innerHTML = money(q.monthly) +
          '<span class="aaas-price-rent-unit">/Monat</span>';
      }
      if (rent) rent.hidden = !renting;
      if (shopPrice) shopPrice.classList.toggle('aaas-hidden-by-rent', renting);
    }

    var cta = document.querySelector('[data-aaas-cta]');
    if (!cta) {
      var all = document.querySelectorAll('.pdp-actions button, .pdp-actions a');
      for (var i = 0; i < all.length && !cta; i++) {
        if (/in den warenkorb/i.test(all[i].textContent || '')) cta = all[i];
      }
      if (cta) cta.dataset.aaasCta = '1';
    }
    if (!cta) return;
    // the label is a bare text node next to the bag icon, so the node is edited
    // in place and the icon left alone
    for (var n = cta.firstChild; n; n = n.nextSibling) {
      if (n.nodeType !== 3 || !n.nodeValue.trim()) continue;
      if (!cta.dataset.aaasLabel) cta.dataset.aaasLabel = n.nodeValue;
      n.nodeValue = renting
        ? 'Mieten für ' + money(q.monthly) + '/Monat'
        : cta.dataset.aaasLabel;
      return;
    }
  }

  // spec B only: term choice, the net basis, shipping note, damage tooltip and the
  // rent-to-own share, all of which the 21 Aug checklist asks for on the PDP
  function pdpRentDetail(q) {
    return       '<p class="aaas-note">' + rateLabel() + ' (' + money(q.base) + ').</p>' +
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
      // The real add-to-cart posts to the live shop; in the clone it opens the
      // drawer. Matched on the marker first, not only on the label: the inline
      // presentation relabels this button to "Mieten für X" in rent mode, and
      // matching on its text alone meant the click stopped being caught there
      // and the drawer never opened.
      var atc = e.target.closest('button, a');
      if (!atc || atc.closest('.aaas-drawer')) return;
      if (atc.hasAttribute('data-aaas-cta') || /in den warenkorb/i.test(atc.textContent || '')) {
        e.preventDefault();
        e.stopPropagation();
        // the PDP decides buy vs rent, so the add follows that choice
        attemptAdd(mode() === 'rent');
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

  /* The captured summary describes the work that happened to be in the cart at
   * capture time. Point every part of it at the chosen variant so the size, the
   * finishing, the image and the price agree with the PDP and the drawer. */
  function applyCartItemToSummary(aside, priceEl, item) {
    priceEl.textContent = money(item.gross);
    priceEl.dataset.aaasBuy = money(item.gross);
    var img = aside.querySelector('.article img, .cart-items-container img');
    if (img && item.image) img.setAttribute('src', item.image);
    var name = aside.querySelector('.article-name, .cart-items-container .name');
    if (name && item.title) name.textContent = item.title;
    // the size sits in its own .mt-1 line inside .product-finishing, and the
    // summary carries a desktop and a mobile copy of it
    aside.querySelectorAll('.product-finishing, .product-finishing-mobile').forEach(function (box) {
      var size = box.querySelector('.mt-1');
      if (size && item.size) size.textContent = item.size + ' cm';
      // the finishing is the box's own text, ahead of that size line
      [].forEach.call(box.childNodes, function (n) {
        if (n.nodeType === 3 && n.nodeValue.trim() && item.finishing) n.nodeValue = item.finishing;
      });
    });
  }

  function initCheckout() {
    var aside = document.querySelector('aside');
    var priceEl = checkoutItemPrice();
    if (!aside || !priceEl) return;
    // The captured summary holds whatever was in the cart when the page was
    // grabbed, so on its own the checkout quoted a different work from the one
    // just chosen. The stored item wins whenever there is one.
    var item = cartItem();
    var gross = (item && item.gross) || parseMoney(priceEl.textContent);
    if (!gross) return;
    var q = quote(gross, (item && item.shipping) || FALLBACK_SHIPPING);
    if (item) applyCartItemToSummary(aside, priceEl, item);

    fillShopExpress();
    if (!priceEl.dataset.aaasBuy) priceEl.dataset.aaasBuy = priceEl.textContent.trim();
    var host = aside.querySelector('.cart-items-container') || aside;

    if (!document.getElementById('aaas-mode')) {
      var panel = el('div', 'aaas-mode');
      panel.id = 'aaas-mode';
      // the same switch as the PDP and the cart. syncSwitches keeps it in step:
      // unlike the cart, this panel is built once and never re-rendered.
      panel.innerHTML = '<div class="aaas-label">Kaufen oder mieten</div>' +
        switchControl(q, mode() === 'rent',
          'data-mode="' + (mode() === 'rent' ? 'buy' : 'rent') + '"') +
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

      // picking a payment method swaps the card fields and the mandate copy
      document.addEventListener('change', function (e) {
        if (!e.target.matches || !e.target.matches('input[name="aaas-payment"]')) return;
        setPayMethod(e.target.value);
        renderPayChoice(q);
      });

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

  function summaryRow(label, body, note, toStep) {
    return '<div class="aaas-corow">' +
      '<div class="aaas-corow-label">' + label + '</div>' +
      '<div class="aaas-corow-body">' + body +
        (note ? '<em>' + note + '</em>' : '') + '</div>' +
      '<button type="button" class="aaas-link aaas-back" data-step="' + toStep + '">Bearbeiten</button>' +
    '</div>';
  }

  // The page carries the brand marks as <symbol> entries in an SVG sprite, which
  // render at 0x0 unless referenced. Point at them with <use> rather than cloning
  // the symbol (that produced duplicate ids and nothing visible), and keep the
  // wrapper an <svg>: a <span> child of the label inherits the custom radio dot.
  var CARD = 'adyen-credit-card-cse';

  function payMethod(renting) {
    var v; try { v = sessionStorage.getItem(PAY_KEY); } catch (e) {}
    var allowed = renting ? [ 'sepa', CARD ]
                          : [ 'adyen-paypal', CARD, 'invoice', 'klarna', 'paybybank', 'sepa' ];
    return allowed.indexOf(v) > -1 ? v : allowed[0];
  }
  function setPayMethod(v) { try { sessionStorage.setItem(PAY_KEY, v); } catch (e) {} }

  /* Card details in the clone are plain fields. On the live checkout they are
   * Adyen's hosted inputs, which cannot run here, but the step has to show that
   * a card is entered rather than jumping straight to the mandate. */
  function cardFields() {
    return '<form class="aaas-form aaas-cardform" novalidate>' +
      field('aaas_card_number', 'Kartennummer', 'text', '') +
      fieldPair(field('aaas_card_exp', 'Gültig bis (MM/JJ)', 'text', ''),
                field('aaas_card_cvc', 'Sicherheitscode', 'text', '')) +
      field('aaas_card_name', 'Name auf der Karte', 'text', '') +
    '</form>';
  }

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

  /* The checkout's own field component, copied from its captured email field:
   * .form-group.form-group__full > .col-xs-12 > input + label, which is what
   * makes the shop position the label absolutely and float it into the box.
   * Two earlier attempts got this wrong in opposite directions. A hand-rolled
   * wrapper missed those rules and printed an uppercase caption above every
   * field; .form-row, borrowed from the register form, is styled by the account
   * page's bundle, which the checkout never loads, so the fields came out
   * unstyled with the label beside them. */
  function field(id, label, type, value, optional) {
    return '<div class="form-group form-group__full"><div class="col-xs-12">' +
      '<input id="' + id + '" name="' + id + '" type="' + (type || 'text') +
        '" placeholder="' + label + (optional ? '' : '*') + '" value="' + (value || '') + '"' +
        (optional ? '' : ' required="required"') + '>' +
      '<label' + (optional ? '' : ' class="required"') + ' for="' + id + '">' + label +
      '</label></div></div>';
  }

  // the live checkout pairs first/last name and postcode/city; the field itself
  // stays the shop's, only the two-up placement is ours
  function fieldPair(a, b) { return '<div class="aaas-pair">' + a + b + '</div>'; }

  function salutation() {
    var opt = function (id, label, checked) {
      return '<label class="radio-button"><input id="' + id + '" name="aaas_salutation" ' +
        'type="radio" value="' + id + '"' + (checked ? ' checked=""' : '') + '><span></span> ' +
        label + '</label>';
    };
    return '<div class="form-group__full type-radio salutation"><label>Anrede</label>' +
      '<div class="options">' + opt('aaasMr', 'Herr', true) + opt('aaasMrs', 'Frau') +
      opt('aaasMx', 'Divers') + '</div></div>';
  }

  /* Prose, not a tickbox. LUMAS-16152 asks that the contract conclusion
   * "appear trustworthy and understandable, without coming across as merely a
   * formality involving a checkbox in the fine print". The tickbox version came
   * from the 21 Aug comment and is gone with the rest of it. */
  function rentConsent(q, method) {
    var card = method === CARD;
    return '<div class="aaas-consent">' +
      '<h3>' + (card ? 'Wiederkehrende Kartenzahlung' : 'SEPA-Lastschriftmandat') + '</h3>' +
      '<p>' + (card
        ? 'Du autorisierst LUMAS, monatlich <b>' + money(q.monthly) + '</b> von dieser Karte ' +
          'einzuziehen, erstmals <b>' + money(q.dueToday) + '</b> zum Start. Die Autorisierung ' +
          'gilt für die Dauer des Mietvertrags über ' + TERMS.months + ' Monate.'
        : 'Du ermächtigst LUMAS, monatlich <b>' + money(q.monthly) + '</b> von deinem Konto ' +
          'einzuziehen, erstmals <b>' + money(q.dueToday) + '</b> zum Start. Das Mandat gilt ' +
          'für die Dauer des Mietvertrags über ' + TERMS.months + ' Monate.') + '</p>' +
      '<p>Du kannst die Zahlungsart jederzeit in deinem Konto ändern.</p></div>';
  }

  // only the two blocks that depend on the choice are redrawn, so the rest of
  // the step and the customer's focus survive picking a different method
  function renderPayChoice(q) {
    var renting = mode() === 'rent';
    var chosen = payMethod(renting);
    var detail = document.getElementById('aaas-paydetail');
    if (detail) detail.innerHTML = chosen === CARD ? cardFields() : '';
    var consent = document.getElementById('aaas-rentconsent');
    if (consent) consent.innerHTML = renting ? rentConsent(q, chosen) : '';
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
        // the live checkout labels this as body copy, not as a heading
        '<p class="message aaas-form-title">Rechnungsadresse</p>' +
        // A real <form> element, because the shop's field styling is scoped to
        // "main form .form-group__full > div input + label". Outside a form the
        // same markup gets none of it: the label stays in flow beside a 21px
        // unstyled input, which is what the two earlier attempts produced.
        '<form class="aaas-form" novalidate>' +
          salutation() +
          fieldPair(field('aaas_first', 'Vorname', 'text', d.first),
                    field('aaas_last', 'Nachname', 'text', d.last)) +
          field('aaas_company', 'Firma', 'text', d.company, true) +
          field('aaas_street', 'Strasse, Hausnummer', 'text', d.street) +
          field('aaas_extra', 'Adresszusatz', 'text', d.extra, true) +
          fieldPair(field('aaas_zip', 'Postleitzahl', 'text', d.zip),
                    field('aaas_city', 'Stadt', 'text', d.city)) +
          '<div class="form-group form-group__full"><div class="col-xs-12">' +
            '<select id="aaas_country" name="aaas_country">' +
              '<option>Österreich</option><option>Schweiz</option><option>Deutschland</option>' +
            '</select><label class="required" for="aaas_country">Land</label></div></div>' +
          field('aaas_phone', 'Telefon für Rückfragen zur Lieferung', 'tel', d.phone) +
        '</form>' +
        toggleRow('Lieferadresse entspricht Rechnungsadresse', true) +
        toggleRow('So schnell wie möglich versenden', true) +
        (renting
          ? '<p class="aaas-note">Das Werk bleibt während der Mietzeit Eigentum von LUMAS und wird an ' +
            'dieser Adresse genutzt. Wenn du umziehst, sag uns bitte Bescheid.</p>'
          : '') +
        '<div class="aaas-actions">' +
          '<button type="button" class="btn aaas-next" data-step="3">Weiter zu Zahlungsmöglichkeiten</button>' +
        '</div>';
      return;
    }

    // step 3 carries the paid action: the live checkout has no separate summary step
    // fictional placeholders only: no real customer address belongs in a prototype
    var addr = [d.first, d.last].filter(Boolean).join(' ') || 'Alex Beispiel';
    var street = d.street || 'Musterstraße 1';
    var town = [d.zip || '1010', d.city || 'Wien'].join(' ');

    // only SEPA and card can carry a recurring Adyen mandate
    var chosen = payMethod(renting);
    var row = function (id, name) { return payRow(id, name, id === chosen); };
    var methods = renting
      ? row('sepa', 'SEPA-Lastschrift') +
        row(CARD, 'Kreditkarte')
      : row('adyen-paypal', 'PayPal') +
        row(CARD, 'Kreditkarte') +
        row('invoice', 'Rechnung, zahle nach Erhalt deiner Bestellung') +
        row('klarna', 'Klarna, später zahlen') +
        row('paybybank', 'Pay by Bank') +
        row('sepa', 'SEPA-Lastschrift');

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
      '<div id="aaas-paydetail">' + (chosen === CARD ? cardFields() : '') + '</div>' +
      '<div id="aaas-rentconsent">' + (renting ? rentConsent(q, chosen) : '') + '</div>' +
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
    var item = cartItem();
    var q = quote((item && item.gross) || parseFloat(host.getAttribute('data-gross')),
                  (item && item.shipping) || FALLBACK_SHIPPING);
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
    var acctItem = cartItem();
    var q = quote((acctItem && acctItem.gross) || parseFloat(host.getAttribute('data-gross')),
                  (acctItem && acctItem.shipping) || FALLBACK_SHIPPING);
    // the fixture says 14 months paid, which is impossible on spec B's 12-month
    // term, so clamp it and derive the end date from the term rather than a fixture
    var paid = Math.min(parseInt(host.getAttribute('data-months-paid'), 10) || 0, TERMS.months);
    var pct = Math.min(100, Math.round(paid / TERMS.months * 100));

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
              '<td>Bezahlt</td><td>' + money(q.monthly) + '</td></tr>';
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
              '<p class="aaas-note">Kündigungsfrist ' + TERMS.noticeDays +
                ' Tage zum Monatsende.</p>' +
              '<div class="aaas-grid">' +
                stat('Monatsmiete', money(q.monthly)) +
                stat('Nächste Abbuchung', host.getAttribute('data-next')) +
                stat('Übernahmepreis heute', money(buyoutAt(q, paid))) +
                stat('Bereits gezahlt', money(round2(q.monthly * paid))) +
              '</div>' +
            '</div></div>' +

            // LUMAS-16152 asks the account to carry the recurring payment method
            '<div class="aaas-label">Zahlungsart</div>' +
            '<div class="aaas-panel"><div class="aaas-panel-inner">' +
              '<div class="aaas-payline"><span>SEPA-Lastschrift, IBAN endet auf 4021</span>' +
                '<button type="button" class="aaas-link">Ändern</button></div>' +
              '<p class="aaas-note">Karte abgelaufen oder Bank gewechselt? ' +
                '<a href="#">Zahlungsart über unser Team aktualisieren</a>.</p>' +
            '</div></div>' +

            '<div class="aaas-label">Abbuchungen</div>' +
            '<table class="aaas-orders"><thead><tr><th>Rate</th><th>Datum</th>' +
              '<th>Status</th><th>Betrag</th></tr></thead><tbody>' + rows + '</tbody></table>' +

            '<div class="aaas-label" style="margin-top:var(--sp-6)">Zum Laufzeitende</div>' +
            '<div class="aaas-options">' +
              '<div class="aaas-option"><h4>Übernehmen</h4>Jederzeit möglich. ' +
                Math.round(TERMS.credit * 100) + ' % deiner gezahlten Miete werden angerechnet, ' +
                'das Bereitstellungsentgelt nicht. Aktuell ' + money(buyoutAt(q, paid)) +
                '.</div>' +
              '<div class="aaas-option" data-locked><h4>Tauschen</h4>Ab Monat ' + TERMS.months +
                ' kostenlos, es fallen eine neue Monatsmiete und ein neues ' +
                'Bereitstellungsentgelt an. Vorher jederzeit gegen ' +
                Math.round(TERMS.exchangeEarlyShare * 100) + ' % des Kaufpreises.</div>' +
              '<div class="aaas-option" data-locked><h4>Zurückgeben</h4>Ab Monat ' + TERMS.months +
                '. Das Werk muss in verkaufsfähigem Zustand sein, der Echtheitsnachweis muss ' +
                'beiliegen. Den Rückversand übernehmen wir.</div>' +
            '</div>' +
            '<div id="aaas-eot"></div>' +

            // GLOB-2053: CS and Finance handle end-of-term manually in the pilot
            '<div class="aaas-panel aaas-cs"><div class="aaas-panel-inner">' +
              '<h2 class="aaas-card-title">Kündigung oder Ankauf besprechen</h2>' +
              '<p class="aaas-note">Ruf uns an unter 030 30 30 69 69 oder schreib uns über ' +
                'das <a href="#">Kontaktformular</a>. Wir wickeln Übernahme, Tausch und ' +
                'Rückgabe persönlich mit dir ab.</p>' +
            '</div></div>' +
          '</div>' +
        '</div>' +
      '</div>';

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

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 400); });
  } else {
    setTimeout(boot, 400);
  }
})();
