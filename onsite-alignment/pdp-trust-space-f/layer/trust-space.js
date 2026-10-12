/*
 * PDP trust space: every option from the "international websites – PDP" thread,
 * switchable from a toggle bar on the cloned PDP.
 *
 * Elements (each can be switched on its own):
 *   stars    Trustpilot stars under the artwork title (Claudius)
 *   usps     USP list straight under the CTA, shipping line kept (the variant tested before)
 *   assure   returns + payment, store-aware
 *   collectors   collector count (edition + signature already sit under the title)
 *   consult  speak with an art consultant, gallery or video (a quiet row)
 *   advisor  the art consultant as the main focus: a card straight under the CTA
 *
 * Versions are presets over those elements; state lives in the URL (?v= / ?e=)
 * so a link reproduces exactly what someone saw.
 */
(function () {
  var STORE = window.__LUMAS_STORE === 'com' ? 'us' : 'de';
  var isDE = STORE === 'de';
  var PORTS = { de: 8958, us: 8959 };

  var ELEMENTS = [
    { key: 'stars', label: 'Stars under title' },
    { key: 'usps', label: 'USPs under CTA' },
    { key: 'assure', label: 'Returns + payment' },
    { key: 'collectors', label: 'Collectors' },
    { key: 'consult', label: 'Art consultant' },
    { key: 'advisor', label: 'Consultant card' }
  ];
  var BUNDLE = ['assure', 'collectors'];
  var VERSIONS = [
    { id: 'A', name: 'Control', note: 'Production today.', els: [] },
    { id: 'B', name: 'Stars under title', note: 'Trustpilot moves between the title and the size selection, above the fold at every resolution.', els: ['stars'] },
    { id: 'C', name: 'USPs under CTA', note: 'Returns, payment and collector count straight under the CTA. Shipping line stays. Tested before: ATC flat, revenue slightly up.', els: ['usps'] },
    { id: 'D', name: 'Trust bundle', note: 'Three facts under Trustpilot that appear nowhere else on the page: returns, payment, collector count.', els: BUNDLE },
    { id: 'E', name: 'Bundle + consultant', note: 'D plus a quiet row: speak with an art consultant, in a gallery or by video.', els: BUNDLE.concat('consult') },
    { id: 'F', name: 'Stars + bundle + consultant', note: 'Everything except the USP list: stars under the title, the bundle where Trustpilot was, and the consultant row.', els: ['stars'].concat(BUNDLE, 'consult') },
    { id: 'G', name: 'Consultant first', note: 'The art consultant is the main focus: a compact card straight under the CTA. Gallery or video opens the booking pop-up with every gallery calendar. Video: no gallery offers a video service yet, so that tab books the same calendars for now. Add to cart stays the only solid button.', els: ['advisor'] }
  ];

  var COPY = {
    de: {
      returns: '60 Tage Rückgaberecht',
      payment: 'Bezahlen nach Lieferung oder in bis zu 36 zinsfreien Raten',
      collectors: '350.000 zufriedene Sammler:innen weltweit',
      consultLine: 'Sprich mit unseren Art Consultants, in der Galerie oder per\u00a0Video',
      consultHref: '/kontakt/',
      advisorTitle: 'Lass dich von unseren Art\u00a0Consultants\u00a0beraten',
      advisorBody: 'Zu Größe, Kaschierung und Wirkung im\u00a0Raum. Kostenlos und\u00a0unverbindlich.',
      advisorGallery: 'In der Galerie',
      advisorVideo: 'Per Video',
      advisorCall: 'Oder ruf uns an',
      advisorPhone: '+49 30 30306969',
      advisorTel: '+493030306969',
      bookTitle: 'Beratungstermin vereinbaren',
      bookGallery: 'In der Galerie',
      bookVideo: 'Per Video',
      bookGalleryIntro: 'Wähle deine Galerie. Kostenlos und\u00a0unverbindlich.',
      bookVideoIntro: 'Wähle die Galerie, die dich per Video berät. Den Link erhältst du mit der\u00a0Bestätigung.',
      bookRow: 'Termin wählen',
      bookPick: 'Galerie wählen',
      bookCall: 'Lieber telefonisch?',
      bookClose: 'Schließen',
      // booking ids from each gallery page (/booking/galerie/<id>/ redirects to that gallery's Microsoft Bookings calendar)
      galleries: [
        ['Berlin Kurfürstendamm', 201201], ['Berlin Mitte', 201101], ['Dortmund', 204001], ['Düsseldorf', 201801],
        ['Frankfurt', 201401], ['Frankfurt Flughafen', 201402], ['Hamburg', 203901], ['Hannover', 202901],
        ['Köln', 201501], ['Mannheim', 203601], ['München', 201601], ['Stuttgart', 201701],
        ['Wien', 202001], ['Zürich', 201901]
      ],
      bookingBase: 'https://www.lumas.de/booking/galerie/',
      stars: function (r, n) { return r + ' von 5 · ' + n + ' Bewertungen auf Trustpilot'; },
      usps: ['Lieben oder innerhalb von 60 Tagen zurückgeben', 'Bezahlen nach Lieferung oder in bis zu 36 zinsfreien Raten', '330.000 zufriedene Sammler:innen seit über 20 Jahren']
    },
    us: {
      returns: '60-day returns',
      payment: 'Pay later or in installments with Klarna',
      collectors: '350,000 satisfied collectors worldwide',
      consultLine: 'Speak with an art consultant, at the gallery or by\u00a0video',
      consultHref: '/contact/',
      advisorTitle: 'Get advice from our art\u00a0consultants',
      advisorBody: 'On size, framing and how the work will look in your\u00a0space. Free\u00a0of\u00a0charge.',
      advisorGallery: 'At the gallery',
      advisorVideo: 'By video',
      advisorCall: 'Or call us',
      advisorPhone: '+1 212 219 9497',
      advisorTel: '+12122199497',
      bookTitle: 'Book a consultation',
      bookGallery: 'At the gallery',
      bookVideo: 'By video',
      bookGalleryIntro: 'Choose your gallery. Free of\u00a0charge.',
      bookVideoIntro: 'Choose the gallery that advises you by video. The link comes with your\u00a0confirmation.',
      bookRow: 'Choose a time',
      bookPick: 'Choose a gallery',
      bookCall: 'Prefer to call?',
      bookClose: 'Close',
      galleries: [['New York SoHo', 208101], ['Miami Beach', 208701]],
      bookingBase: 'https://www.lumas.com/booking/galerie/',
      stars: function (r, n) { return r + ' out of 5 · ' + n + ' reviews on Trustpilot'; },
      usps: ['Love it or return it within 60 days', 'Pay later or in installments with Klarna', '330,000 satisfied collectors over more than 20 years']
    }
  };
  var t = COPY[STORE];

  var ICON = {
    returns: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    payment: '<rect x="2" y="5" width="20" height="14" rx="1"/><path d="M2 10h20"/>',
    collectors: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    consult: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    video: '<path d="m16 13 5.2 3.5a.5.5 0 0 0 .8-.4V7.9a.5.5 0 0 0-.8-.4L16 11"/><rect x="2" y="6" width="14" height="12" rx="1"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>'
  };
  function icon(name, cls) {
    return '<svg class="' + (cls || 'ts-icon') + '" viewBox="0 0 24 24" aria-hidden="true">' + ICON[name] + '</svg>';
  }

  // ---- state -----------------------------------------------------------------
  // window.tsOnly = 'F' pins one version (a single-version copy): no switching, store toggle only
  var ONLY = VERSIONS.filter(function (x) { return x.id === window.tsOnly; })[0];

  function readState() {
    if (ONLY) return { version: ONLY.id, els: ONLY.els.slice() };
    var q = new URLSearchParams(location.search);
    var v = (q.get('v') || 'A').toUpperCase();
    if (v === 'CUSTOM') {
      return { version: 'custom', els: (q.get('e') || '').split(',').filter(Boolean) };
    }
    var preset = VERSIONS.filter(function (x) { return x.id === v; })[0] || VERSIONS[0];
    return { version: preset.id, els: preset.els.slice() };
  }
  function stateQuery(state) {
    return state.version === 'custom' ? 'v=custom&e=' + state.els.join(',') : 'v=' + state.version;
  }
  function writeState(state) {
    var q = new URLSearchParams(location.search);
    q.delete('v'); q.delete('e');
    var url = location.pathname + '?' + (q.toString() ? q.toString() + '&' : '') + stateQuery(state) + location.hash;
    history.replaceState(null, '', url);
  }
  function matchPreset(els) {
    var sorted = els.slice().sort().join(',');
    var hit = VERSIONS.filter(function (x) { return x.els.slice().sort().join(',') === sorted; })[0];
    return hit ? hit.id : 'custom';
  }

  // ---- page facts -----------------------------------------------------------
  function trustpilotFacts(tp) {
    var score = tp.querySelector('.trustpilot-rating-score b');
    var count = tp.querySelector('.trustpilot-rating-count b');
    return { score: score ? score.textContent.trim() : '', count: count ? count.textContent.trim() : '' };
  }

  // ---- element renderers ----------------------------------------------------
  // One list, one style: every line is an icon plus a short fact; the consultant line is the only link.
  function bundleHtml(on) {
    var items = [];
    if (on.assure) items.push(['returns', t.returns], ['payment', t.payment]);
    if (on.collectors) items.push(['collectors', t.collectors]);
    var html = items.map(function (i) { return '<li>' + icon(i[0]) + '<span>' + i[1] + '</span></li>'; }).join('');
    if (on.consult) {
      html += '<li class="ts-consult">' + icon('consult') + '<a href="' + t.consultHref + '" data-ts-book="gallery">' + t.consultLine + ' →</a></li>';
    }
    return html ? '<ul class="ts-list">' + html + '</ul>' : '';
  }


  // ---- apply ----------------------------------------------------------------
  var state = readState();

  function clear() {
    document.querySelectorAll('[data-ts-added]').forEach(function (n) { n.remove(); });
    document.documentElement.removeAttribute('data-ts-stars');
    document.documentElement.removeAttribute('data-ts-active');
  }

  function apply() {
    clear();
    var on = {};
    state.els.forEach(function (k) { on[k] = true; });
    var tp = document.querySelector('.pdp-product-info .trustpilot-rating');
    if (!tp) return;
    if (state.els.length) document.documentElement.setAttribute('data-ts-active', '');

    if (on.stars) {
      var facts = trustpilotFacts(tp);
      var stars = tp.querySelector('.trustpilot-rating-stars');
      var line = document.createElement('a');
      line.className = 'ts-stars';
      line.setAttribute('data-ts-added', '');
      line.href = tp.href; line.target = '_blank'; line.rel = 'noopener noreferrer';
      line.innerHTML = (stars ? stars.outerHTML : '') + '<span>' + t.stars(facts.score, facts.count) + '</span>';
      // Claudius' spot: between the artist/title block and the size selection. The buy box
      // is a grid with named areas, so the line goes inside the edition block to stay there.
      var edition = document.querySelector('.pdp-basic-info .edition-container');
      if (edition) edition.appendChild(line);
      document.documentElement.setAttribute('data-ts-stars', '');
    }

    if (on.usps) {
      var list = document.createElement('ul');
      list.className = 'ts-usps';
      list.setAttribute('data-ts-added', '');
      // same order as the copy: returns, payment, collectors
      var uspIcons = ['returns', 'payment', 'collectors'];
      list.innerHTML = t.usps.map(function (u, i) { return '<li>' + icon(uspIcons[i]) + u + '</li>'; }).join('');
      var more = document.querySelector('.pdp-product-info .pdp-more-info');
      if (more) more.insertAdjacentElement('beforebegin', list);
    }

    if (on.advisor) {
      var card = document.createElement('section');
      card.className = 'ts-advisor';
      card.setAttribute('data-ts-added', '');
      card.innerHTML =
        '<div class="ts-advisor-body">' +
          '<h2 class="ts-advisor-title">' + t.advisorTitle + '</h2>' +
          '<p>' + t.advisorBody + '</p>' +
          '<div class="ts-advisor-actions">' +
            '<button type="button" data-ts-book="gallery">' + icon('pin') + t.advisorGallery + '</button>' +
            '<button type="button" data-ts-book="video">' + icon('video') + t.advisorVideo + '</button>' +
          '</div>' +
          '<p class="ts-advisor-call">' + t.advisorCall + ': <a href="tel:' + t.advisorTel + '">' + t.advisorPhone + '</a></p>' +
        '</div>';
      var shipping = document.querySelector('.pdp-product-info .pdp-more-info');
      if (shipping) shipping.insertAdjacentElement('afterend', card);
    }

    var html = bundleHtml(on);
    if (html) {
      var block = document.createElement('section');
      block.className = 'trust-space';
      block.setAttribute('data-ts-added', '');
      block.innerHTML = html;
      tp.insertAdjacentElement('afterend', block);
    }
  }

  // ---- booking pop-up -------------------------------------------------------
  var booking, lastFocus;
  function buildBooking() {
    var el = document.createElement('div');
    el.className = 'ts-book';
    el.hidden = true;
    // a styled dropdown of galleries (combobox + listbox); the button opens the chosen gallery's own booking calendar
    var chips = '<div class="ts-book-pick">' +
      '<div class="ts-dd">' +
        '<button type="button" class="ts-dd-btn" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="ts-dd-list">' +
          '<span class="ts-dd-val is-empty">' + t.bookPick + '</span>' +
          '<svg class="ts-dd-chev" viewBox="0 0 12 12" aria-hidden="true"><path d="m2.5 4.5 3.5 3.5 3.5-3.5"/></svg></button>' +
        '<ul class="ts-dd-list" id="ts-dd-list" role="listbox" aria-label="' + t.bookPick + '" tabindex="-1" hidden>' +
          t.galleries.map(function (gal, i) {
            return '<li role="option" id="ts-dd-o' + i + '" data-value="' + gal[1] + '" aria-selected="false">' + gal[0] + '</li>';
          }).join('') +
        '</ul></div>' +
      '<a class="ts-book-go" aria-disabled="true" target="_blank" rel="noopener">' + t.bookRow + '</a></div>';
    el.innerHTML =
      '<div class="ts-book-backdrop" data-ts-book-close></div>' +
      '<div class="ts-book-dialog" role="dialog" aria-modal="true" aria-labelledby="ts-book-title">' +
        '<div class="ts-book-head"><h2 id="ts-book-title">' + t.bookTitle + '</h2>' +
          '<button type="button" class="ts-book-x" data-ts-book-close aria-label="' + t.bookClose + '">' + icon('close', 'ts-book-xicon') + '</button></div>' +
        '<div class="ts-book-mode" role="tablist">' +
          '<button type="button" role="tab" data-mode="gallery">' + icon('pin') + t.bookGallery + '</button>' +
          '<button type="button" role="tab" data-mode="video">' + icon('video') + t.bookVideo + '</button></div>' +
        '<p class="ts-book-intro"></p>' +
        chips +
        '<p class="ts-book-call">' + t.bookCall + ' <a href="tel:' + t.advisorTel + '">' + t.advisorPhone + '</a></p>' +
      '</div>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-ts-book-close]')) closeBooking();
      var tab = e.target.closest('[data-mode]');
      if (tab) setMode(tab.dataset.mode);
      var go = e.target.closest('.ts-book-go');
      if (go && go.getAttribute('aria-disabled') === 'true') e.preventDefault();
    });
    wireDropdown(el);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !el.hidden) closeBooking();
    });
    return el;
  }
  function wireDropdown(el) {
    var dd = el.querySelector('.ts-dd'), btn = dd.querySelector('.ts-dd-btn'), list = dd.querySelector('.ts-dd-list');
    var opts = Array.prototype.slice.call(list.children), active = -1;
    function setActive(i) {
      active = Math.max(0, Math.min(opts.length - 1, i));
      opts.forEach(function (o, n) { o.classList.toggle('is-active', n === active); });
      btn.setAttribute('aria-activedescendant', opts[active].id);
      opts[active].scrollIntoView({ block: 'nearest' });
    }
    // the dialog scrolls its own content, so the list is fixed to the viewport and flips up when needed
    function place() {
      var r = btn.getBoundingClientRect(), below = innerHeight - r.bottom - 72, above = r.top - 16; // 72: clear of the prototype's version bar
      var up = below < 200 && above > below;
      list.style.left = r.left + 'px';
      list.style.width = r.width + 'px';
      list.style.maxHeight = Math.min(260, up ? above : below) + 'px';
      list.style.top = up ? 'auto' : (r.bottom - 1) + 'px';
      list.style.bottom = up ? (innerHeight - r.top - 1) + 'px' : 'auto';
      dd.classList.toggle('is-up', up);
    }
    addEventListener('resize', function () { if (!list.hidden) close(); });
    el.querySelector('.ts-book-dialog').addEventListener('scroll', function () { if (!list.hidden) place(); });
    function open() {
      list.hidden = false; btn.setAttribute('aria-expanded', 'true'); dd.classList.add('is-open');
      place();
      var sel = opts.findIndex(function (o) { return o.getAttribute('aria-selected') === 'true'; });
      setActive(sel < 0 ? 0 : sel);
    }
    function close() {
      list.hidden = true; btn.setAttribute('aria-expanded', 'false'); dd.classList.remove('is-open');
      btn.removeAttribute('aria-activedescendant');
    }
    function choose(i) {
      opts.forEach(function (o, n) { o.setAttribute('aria-selected', String(n === i)); });
      var val = btn.querySelector('.ts-dd-val');
      val.textContent = opts[i].textContent; val.classList.remove('is-empty');
      var go = el.querySelector('.ts-book-go');
      go.href = t.bookingBase + opts[i].dataset.value + '/';
      go.removeAttribute('aria-disabled');
      close(); btn.focus();
    }
    btn.addEventListener('click', function () { if (list.hidden) open(); else close(); });
    list.addEventListener('click', function (e) {
      var o = e.target.closest('[role="option"]');
      if (o) choose(opts.indexOf(o));
    });
    list.addEventListener('mousemove', function (e) {
      var o = e.target.closest('[role="option"]');
      if (o && opts.indexOf(o) !== active) setActive(opts.indexOf(o));
    });
    btn.addEventListener('keydown', function (e) {
      var k = e.key;
      if (list.hidden && (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ')) { e.preventDefault(); open(); return; }
      if (list.hidden) return;
      if (k === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (k === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (k === 'Home') { e.preventDefault(); setActive(0); }
      else if (k === 'End') { e.preventDefault(); setActive(opts.length - 1); }
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); choose(active); }
      else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      else if (k === 'Tab') close();
      else if (k.length === 1) {
        var hit = opts.findIndex(function (o) { return o.textContent.toLowerCase().indexOf(k.toLowerCase()) === 0; });
        if (hit >= 0) setActive(hit);
      }
    });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) close(); });
    el.closeDropdown = close;
  }
  function setMode(mode) {
    booking.querySelectorAll('[data-mode]').forEach(function (b) {
      b.setAttribute('aria-selected', String(b.dataset.mode === mode));
    });
    booking.querySelector('.ts-book-intro').textContent = mode === 'video' ? t.bookVideoIntro : t.bookGalleryIntro;
  }
  function openBooking(mode) {
    lastFocus = document.activeElement;
    setMode(mode);
    booking.hidden = false;
    document.documentElement.classList.add('ts-book-open');
    requestAnimationFrame(function () { booking.classList.add('is-open'); });
    booking.querySelector('[aria-selected="true"]').focus();
  }
  function closeBooking() {
    if (booking.closeDropdown) booking.closeDropdown();
    booking.classList.remove('is-open');
    document.documentElement.classList.remove('ts-book-open');
    setTimeout(function () { booking.hidden = true; }, 220);
    if (lastFocus) lastFocus.focus();
  }

  // ---- toggle bar -----------------------------------------------------------
  function buildBar() {
    var bar = document.createElement('div');
    bar.className = 'ts-bar';
    if (ONLY) {
      bar.classList.add('ts-bar--only');
      bar.setAttribute('aria-label', 'Prototype store');
      bar.innerHTML = '<div class="ts-bar-main"><span class="ts-bar-title">Version ' + ONLY.id + ' · ' + ONLY.name + '</span>' +
        '<div class="ts-bar-store" role="group" aria-label="Store"><a data-store="de">DE</a><a data-store="us">US</a></div></div>';
      document.body.appendChild(bar);
      return bar;
    }
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Prototype versions');
    bar.innerHTML =
      '<div class="ts-bar-panel" hidden>' +
        '<p class="ts-bar-note"></p>' +
        '<div class="ts-bar-store ts-bar-store-panel" role="group" aria-label="Store"><a data-store="de">DE</a><a data-store="us">US</a></div>' +
        '<div class="ts-bar-switches">' + ELEMENTS.map(function (e) {
          return '<label><input type="checkbox" value="' + e.key + '"><span>' + e.label + '</span></label>';
        }).join('') + '</div>' +
      '</div>' +
      '<div class="ts-bar-main">' +
        '<span class="ts-bar-title">Trust space</span>' +
        '<div class="ts-bar-versions" role="group" aria-label="Version">' + VERSIONS.map(function (v) {
          return '<button type="button" data-version="' + v.id + '" title="' + v.name + '"><b>' + v.id + '</b><span>' + v.name + '</span></button>';
        }).join('') + '</div>' +
        '<button type="button" class="ts-bar-more" aria-expanded="false" title="Switch single elements">' + icon('sliders', 'ts-bar-icon') + '<span>Elements</span></button>' +
        '<div class="ts-bar-store" role="group" aria-label="Store">' +
          '<a data-store="de">DE</a><a data-store="us">US</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bar);

    var panel = bar.querySelector('.ts-bar-panel');
    var more = bar.querySelector('.ts-bar-more');
    more.addEventListener('click', function () {
      var open = panel.hidden;
      panel.hidden = !open;
      more.setAttribute('aria-expanded', String(open));
    });
    bar.querySelectorAll('[data-version]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = VERSIONS.filter(function (x) { return x.id === b.dataset.version; })[0];
        state = { version: v.id, els: v.els.slice() };
        update();
      });
    });
    bar.querySelectorAll('.ts-bar-switches input').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var els = [].slice.call(bar.querySelectorAll('.ts-bar-switches input:checked')).map(function (x) { return x.value; });
        var preset = matchPreset(els);
        state = { version: preset, els: els };
        update();
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
      var v = VERSIONS.filter(function (x) { return x.id === e.key.toUpperCase(); })[0];
      if (v) { state = { version: v.id, els: v.els.slice() }; update(); }
    });
    return bar;
  }

  function syncBar(bar) {
    bar.querySelectorAll('[data-version]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.version === state.version));
    });
    bar.querySelectorAll('.ts-bar-switches input').forEach(function (cb) {
      cb.checked = state.els.indexOf(cb.value) !== -1;
    });
    var v = VERSIONS.filter(function (x) { return x.id === state.version; })[0];
    var note = bar.querySelector('.ts-bar-note');
    if (note) note.textContent = v ? v.id + ' · ' + v.name + '. ' + v.note : 'Custom mix of single elements.';
    bar.querySelectorAll('[data-store]').forEach(function (a) {
      var s = a.dataset.store;
      a.setAttribute('aria-current', String(s === STORE));
      // the published copy is two static pages; locally each store is its own server
      a.href = window.tsStatic
        ? window.tsStatic[s] + '?' + stateQuery(state)
        : 'http://localhost:' + PORTS[s] + location.pathname + '?' + stateQuery(state);
    });
  }

  var bar;
  function update() {
    writeState(state);
    apply();
    syncBar(bar);
  }

  function whenPresent(selector, cb, tries) {
    var el = document.querySelector(selector);
    if (el) return cb(el);
    if ((tries || 0) > 100) return;
    setTimeout(function () { whenPresent(selector, cb, (tries || 0) + 1); }, 100);
  }

  whenPresent('.pdp-product-info .trustpilot-rating', function () {
    bar = buildBar();
    booking = buildBooking();
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-ts-book]');
      if (!trigger) return;
      e.preventDefault();
      openBooking(trigger.dataset.tsBook);
    });
    update();
  });
})();
