/* "Deine Galerie" on the lumas.de clone.
 *
 * Three surfaces, all additive to the production page:
 *   1. Header (desktop): "Galerie Hamburg" next to the icons, opens a flyout to see or change it.
 *   2. PDP buy box: an availability pill for the SELECTED size (stock is per size SKU), with a
 *      popover (desktop) / bottom sheet (phones) listing every gallery that has the work.
 *   3. PLP: "Vorrätig in Hamburg" switch at the top of the filters, one line on stocked tiles.
 *
 * Stock is the real SAP snapshot (layer/stock.json, dwh.lumas_sap_stock_new, standard variants),
 * keyed by the same size SKU the PDP shows under the price (LDR74 etc.).
 * Visitor state lives in localStorage so it follows the visitor across pages.
 */
(() => {
  'use strict';

  const EN = (document.documentElement.lang || '').startsWith('en') || location.pathname.startsWith('/en/');
  const T = EN ? {
    gallery: 'Gallery', choose: 'Choose gallery', myGallery: 'My gallery', yourGallery: 'Your gallery', inStock: 'In stock in',
    inStockShort: 'In stock', inN: n => `In stock in ${n} galleries`, otherSize: 'Other size in',
    openToday: h => `Open today ${h}`, closedToday: 'Closed today', toGallery: 'Visit gallery', route: 'Directions',
    ipNote: 'Chosen from your approximate location.', remember: 'Save as my gallery', change: 'Change gallery',
    plz: 'Postcode', search: 'Search', plzBad: 'Please enter a five-digit postcode.', plzUnknown: 'We do not know this postcode.',
    allWith: 'All galleries with this work', alsoIn: 'Also in stock in', otherGallery: 'Choose another gallery',
    near: 'Which gallery is near you?', nearSub: 'We show you which works you can take home the same day.',
    mineTxt: s => `${s} cm, on hand. See it in person and take it home the same day.`,
    mineOtherTxt: 'The size you selected is not on hand here right now.',
    pickSize: s => `Select ${s} cm`,
    nearTxt: g => `Not on hand in ${g} right now.`,
    online: d => d ? `Ordered online, it ships in ${d} days.` : 'You can also order it online as usual.',
    countTitle: n => `On hand in ${n} galleries`, countSub: 'Enter your postcode and we show you the nearest.',
    filter: g => `In stock in ${g}`, filterNone: 'In stock at my gallery', takeHome: 'Take home today',
    filterCount: (n, g) => `${n} of these in stock in ${g}`, km: 'km', sizes: 'Sizes'
  } : {
    gallery: 'Galerie', choose: 'Galerie wählen', myGallery: 'Meine Galerie', yourGallery: 'Deine Galerie', inStock: 'Vorrätig in',
    inStockShort: 'Vorrätig', inN: n => `In ${n} Galerien vorrätig`, otherSize: 'Andere Größe in',
    openToday: h => `Heute geöffnet ${h}`, closedToday: 'Heute geschlossen', toGallery: 'Zur Galerie', route: 'Route planen',
    ipNote: 'Nach deinem ungefähren Standort gewählt.', remember: 'Als meine Galerie merken', change: 'Galerie ändern',
    plz: 'Postleitzahl', search: 'Suchen', plzBad: 'Bitte gib eine fünfstellige Postleitzahl ein.', plzUnknown: 'Diese Postleitzahl kennen wir nicht.',
    allWith: 'Alle Galerien mit diesem Werk', alsoIn: 'Auch vorrätig in', otherGallery: 'Andere Galerie wählen',
    near: 'Welche Galerie ist in deiner Nähe?', nearSub: 'Wir zeigen dir, welche Werke du dort sofort mitnehmen kannst.',
    mineTxt: s => `${s} cm, vorrätig. Du kannst das Werk im Original ansehen und direkt mitnehmen.`,
    mineOtherTxt: 'Deine gewählte Größe ist hier gerade nicht vorrätig.',
    pickSize: s => `${s} cm wählen`,
    nearTxt: g => `In ${g} ist das Werk gerade nicht vorrätig.`,
    online: d => d ? `Online bestellt ist es in ${d} Tagen bei dir.` : 'Online kannst du es wie gewohnt bestellen.',
    countTitle: n => `In ${n} Galerien vorrätig`, countSub: 'Mit deiner Postleitzahl zeigen wir dir die nächste.',
    filter: g => `Vorrätig in ${g}`, filterNone: 'In meiner Galerie vorrätig', takeHome: 'Heute mitnehmen',
    filterCount: (n, g) => `${n} davon in ${g} vorrätig`, km: 'km', sizes: 'Größen'
  };
  const PREFIX = EN ? '/en' : '';
  // The layer is served at /layer/ by serve.py, and from a sub-path in the published static copy.
  // _publish.py sets window.dgStatic = { links: {clonePath: localFile} }; anything not in the
  // map points at live lumas.de there, because the static copy holds only a few pages.
  const LAYER_BASE = document.currentScript ? new URL('.', document.currentScript.src).href : '/layer/';
  const STATIC = window.dgStatic || null;
  const shopHref = path => (STATIC ? STATIC.links[path] || 'https://www.lumas.de' + path : path);
  if (STATIC) {
    // production renders product cards client-side with root paths, and the card navigates via
    // its own data-product-url; retarget both as they appear
    const local = v => shopHref(v.split('#')[0].split('?')[0]);
    const retarget = () => {
      document.querySelectorAll('a[href^="/"]').forEach(a => a.setAttribute('href', local(a.getAttribute('href'))));
      document.querySelectorAll('[data-product-url^="/"]').forEach(c => { c.dataset.productUrl = local(c.dataset.productUrl); });
    };
    let queued = 0;
    new MutationObserver(() => { cancelAnimationFrame(queued); queued = requestAnimationFrame(retarget); })
      .observe(document.documentElement, { childList: true, subtree: true });
    retarget();
    // the card's own click handler navigates from its data-product JSON, so take the click first
    window.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('product-card a[href]');
      if (!a) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.metaKey || e.ctrlKey) window.open(a.href, '_blank', 'noopener');
      else location.href = a.href;
    }, true);
  }

  // The twelve German galleries. Addresses and hours as published on lumas.de (30 Sep 2026).
  const G = [
    { k: '201101', n: 'Berlin Mitte', lat: 52.5246, lng: 13.402, a: 'Hackesche Höfe, Rosenthaler Straße 40/41, 10178 Berlin', h: '11–19', u: 'berlin-mitte' },
    { k: '201201', n: 'Berlin Kurfürstendamm', lat: 52.503, lng: 13.329, a: 'Fasanenstraße 73, 10719 Berlin', h: '11–19', u: 'berlin-kurfuerstendamm' },
    { k: '204001', n: 'Dortmund', lat: 51.513, lng: 7.465, a: 'Schwarze-Brüder-Str. 1, 44137 Dortmund', h: '10–18', u: 'dortmund' },
    { k: '201801', n: 'Düsseldorf', lat: 51.225, lng: 6.778, a: 'Grünstraße 8, 40212 Düsseldorf', h: '10–18', u: 'duesseldorf' },
    { k: '201401', n: 'Frankfurt', lat: 50.115, lng: 8.68, a: 'Kaiserstraße 13, 60311 Frankfurt am Main', h: '10:30–19', u: 'frankfurt' },
    { k: '201402', n: 'Frankfurt Flughafen', lat: 50.051, lng: 8.57, a: 'Flughafen Frankfurt Main', h: '6–21:30', u: 'fraport', sunday: true },
    { k: '203901', n: 'Hamburg', lat: 53.551, lng: 9.993, a: 'Kaufmannshaus, Große Bleichen 31, 20354 Hamburg', h: '10–19', u: 'hamburg' },
    { k: '202901', n: 'Hannover', lat: 52.374, lng: 9.739, a: 'Kröpcke-Passage, Luisenstraße 10–11, 30159 Hannover', h: '10–19', u: 'hannover' },
    { k: '201501', n: 'Köln', lat: 50.938, lng: 6.956, a: 'Mittelstraße 15, 50672 Köln', h: '10–19', u: 'koeln' },
    { k: '203601', n: 'Mannheim', lat: 49.487, lng: 8.466, a: 'N6 3–7 / Kunststraße, 68161 Mannheim', h: '11–18:30', u: 'mannheim' },
    { k: '201601', n: 'München', lat: 48.14, lng: 11.575, a: 'Brienner Straße 3, 80333 München', h: '10–19', u: 'muenchen' },
    { k: '201701', n: 'Stuttgart', lat: 48.777, lng: 9.178, a: 'Lange Straße 3, 70173 Stuttgart', h: '11–19', u: 'stuttgart' }
  ];
  const IP_GUESS = '203901'; // what the IP lookup would return for this demo: Hamburg
  const NEAR_KM = 200;
  // Two-digit postcode regions → centroid, enough to rank twelve galleries.
  const PLZ = { '01': [51.05, 13.74], '02': [51.18, 14.42], '03': [51.76, 14.33], '04': [51.34, 12.37], '06': [51.48, 11.97], '07': [50.88, 12.08], '08': [50.72, 12.49], '09': [50.83, 12.92], '10': [52.52, 13.4], '12': [52.46, 13.45], '13': [52.57, 13.33], '14': [52.4, 13.06], '15': [52.34, 14.55], '16': [52.75, 13.24], '17': [53.56, 13.26], '18': [54.09, 12.13], '19': [53.63, 11.41], '20': [53.55, 10], '21': [53.3, 10.3], '22': [53.6, 9.95], '23': [53.87, 10.69], '24': [54.32, 10.13], '25': [54, 9.4], '26': [53.14, 8.21], '27': [53.35, 8.6], '28': [53.08, 8.8], '29': [52.62, 10.08], '30': [52.37, 9.74], '31': [52.15, 9.95], '32': [52.1, 8.67], '33': [51.9, 8.55], '34': [51.31, 9.48], '35': [50.58, 8.68], '36': [50.55, 9.68], '37': [51.53, 9.93], '38': [52.26, 10.52], '39': [52.12, 11.63], '40': [51.23, 6.78], '41': [51.19, 6.44], '42': [51.26, 7.15], '44': [51.51, 7.47], '45': [51.46, 7.01], '46': [51.6, 6.8], '47': [51.43, 6.76], '48': [51.96, 7.63], '49': [52.28, 8.05], '50': [50.94, 6.96], '51': [50.95, 7.1], '52': [50.78, 6.08], '53': [50.73, 7.1], '54': [49.75, 6.64], '55': [49.99, 8.25], '56': [50.36, 7.59], '57': [50.87, 8.02], '58': [51.36, 7.47], '59': [51.68, 7.82], '60': [50.11, 8.68], '61': [50.23, 8.61], '63': [49.98, 9.14], '64': [49.87, 8.65], '65': [50.08, 8.24], '66': [49.24, 6.99], '67': [49.44, 7.77], '68': [49.49, 8.47], '69': [49.4, 8.69], '70': [48.78, 9.18], '71': [48.8, 9.1], '72': [48.52, 9.06], '73': [48.7, 9.6], '74': [49.14, 9.22], '75': [48.89, 8.7], '76': [49.01, 8.4], '77': [48.47, 7.94], '78': [48.06, 8.46], '79': [47.99, 7.84], '80': [48.14, 11.58], '81': [48.12, 11.62], '82': [47.99, 11.34], '83': [47.86, 12.12], '84': [48.54, 12.15], '85': [48.6, 11.5], '86': [48.37, 10.9], '87': [47.73, 10.31], '88': [47.78, 9.61], '89': [48.4, 9.99], '90': [49.45, 11.08], '91': [49.6, 11], '92': [49.44, 11.86], '93': [49.01, 12.1], '94': [48.57, 13.43], '95': [50, 11.8], '96': [49.89, 10.9], '97': [49.79, 9.95], '98': [50.61, 10.69], '99': [50.98, 11.03] };

  // ---- state ----------------------------------------------------------------------------
  const KEY = 'dg:v1';
  const DEFAULTS = { mode: 'ip', gal: IP_GUESS, placement: 'top', headerStyle: 'label', filter: false };
  // the PLP switch is a filter, not a preference: it starts off on every page load
  const S = Object.assign({}, DEFAULTS, readStore(), { filter: false });
  // ?header=icon / ?header=label opens straight into a header option (and remembers it)
  const headerParam = new URLSearchParams(location.search).get('header');
  if (['label', 'short', 'icon'].includes(headerParam)) { S.headerStyle = headerParam; save(); }
  let STOCK = {};                       // gallery code → Set of size SKUs
  let dist = null;                      // gallery code → km from an entered postcode
  let plzValue = '', plzError = '';
  function readStore() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode */ } }

  const byK = k => G.find(g => g.k === k);
  const cur = () => (S.mode === 'none' ? null : byK(S.gal));
  const has = (g, sku) => !!g && !!STOCK[g.k] && STOCK[g.k].has(String(sku).toUpperCase());
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function km(a, b) {
    const r = x => (x * Math.PI) / 180, dl = r(b.lat - a.lat), dg = r(b.lng - a.lng);
    const h = Math.sin(dl / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dg / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(h));
  }
  function today(g) {
    if (new Date().getDay() === 0 && !g.sunday) return T.closedToday;
    return T.openToday(g.h + (EN ? '' : ' Uhr'));
  }
  function track(event, params) {
    (window.dataLayer = window.dataLayer || []).push(Object.assign({ event }, params));
    window.dispatchEvent(new CustomEvent('dg:event', { detail: { event, params } }));
  }
  function whenPresent(sel, cb, root) {
    const found = (root || document).querySelector(sel);
    if (found) return cb(found);
    const mo = new MutationObserver(() => {
      const el = (root || document).querySelector(sel);
      if (el) { mo.disconnect(); cb(el); }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
  const isPhone = () => innerWidth < 768;

  const IC = {
    pin: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M8 14.5s4.5-4.2 4.5-8A4.5 4.5 0 0 0 3.5 6.5c0 3.8 4.5 8 4.5 8Z"/><circle cx="8" cy="6.5" r="1.6"/></svg>',
    chev: '<svg class="dg-chev" viewBox="0 0 10 10" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 3.5 5 6.5 8 3.5"/></svg>',
    info: '<svg class="dg-i" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.1"><circle cx="8" cy="8" r="6.6"/><path d="M8 7.2v4M8 4.9v.1" stroke-linecap="round"/></svg>',
    close: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><path d="m4 4 8 8M12 4l-8 8"/></svg>'
  };

  // ---- shared dialog (desktop: anchored popover, phones: bottom sheet) ------------------
  let dialog = null, dialogAnchor = null, dialogRender = null;
  function openDialog(anchor, render, label) {
    closeDialog(false);
    dialogAnchor = anchor; dialogRender = render;
    // Phones: bottom sheet. Wider screens: a drawer that slides in from the right.
    const sheet = isPhone();
    const wrap = document.createElement('div');
    wrap.className = 'dg-layer ' + (sheet ? 'dg-sheet-mode' : 'dg-drawer-mode');
    wrap.innerHTML = '<div class="dg-scrim" data-dg-close></div>' +
      `<div class="dg-fly ${sheet ? 'dg-sheet' : 'dg-drawer'}" role="dialog" aria-modal="true" aria-label="${esc(label)}">` +
      (sheet ? '<div class="dg-grab"></div>' : '') +
      `<button class="dg-x" type="button" data-dg-close aria-label="${EN ? 'Close' : 'Schließen'}">${IC.close}</button><div class="dg-body"></div></div>`;
    document.body.appendChild(wrap);
    dialog = wrap;
    anchor.setAttribute('aria-expanded', 'true');
    paintDialog();
    document.documentElement.classList.add('dg-lock');
    const panel = wrap.querySelector('.dg-fly');
    panel.tabIndex = -1;
    panel.focus({ preventScroll: true });
  }
  function paintDialog(focusSel) {
    if (!dialog) return;
    dialog.querySelector('.dg-body').innerHTML = dialogRender();
    position();
    if (focusSel) { const f = dialog.querySelector(focusSel); if (f) f.focus(); }
  }
  function position() {
    if (!dialog || !dialog.classList.contains('dg-pop-mode')) return; // drawer and sheet need no anchoring
    const fly = dialog.querySelector('.dg-fly');
    const r = dialogAnchor.getBoundingClientRect();
    const w = fly.offsetWidth;
    const alignRight = dialogAnchor.dataset.dgAlign === 'right';
    let left = alignRight ? r.right - w : r.left;
    left = Math.max(16, Math.min(left, document.documentElement.clientWidth - w - 16));
    fly.style.left = left + scrollX + 'px';
    fly.style.top = r.bottom + scrollY + 10 + 'px';
  }
  function closeDialog(refocus = true) {
    if (!dialog) return;
    const leaving = dialog;
    leaving.classList.add('dg-out');
    setTimeout(() => leaving.remove(), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220);
    dialog = null;
    document.documentElement.classList.remove('dg-lock');
    if (dialogAnchor) {
      dialogAnchor.setAttribute('aria-expanded', 'false');
      if (refocus && document.contains(dialogAnchor)) dialogAnchor.focus({ preventScroll: true });
    }
    dist = null; plzValue = ''; plzError = '';
  }
  addEventListener('resize', () => position());
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && dialog) closeDialog(); });
  document.addEventListener('click', e => {
    if (!dialog) return;
    if (e.target.closest('[data-dg-close]')) return closeDialog();
    if (!e.target.closest('.dg-fly') && !e.target.closest('[aria-expanded="true"][data-dg-anchor]')) closeDialog(false);
  });

  // ---- building blocks -----------------------------------------------------------------
  const galLinks = g => `<div class="dg-links"><a href="${shopHref(`${PREFIX}/galerien/${g.u}/`)}" data-dg-link="gallery">${T.toGallery}</a>` +
    `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('LUMAS ' + g.a)}" target="_blank" rel="noopener" data-dg-link="route">${T.route}</a></div>`;
  const galHead = (eyebrow, g, extra) => `<div><p class="dg-eb">${esc(eyebrow)}</p><p class="dg-name">LUMAS ${esc(g.n)}</p>` +
    `<div class="dg-meta"><span>${esc(g.a)}</span><span class="dg-open">${today(g)}</span>${extra || ''}</div></div>`;
  const ipNote = () => (S.mode === 'ip' ? `<div class="dg-guess"><span>${T.ipNote}</span><button type="button" class="dg-btn" data-dg-confirm>${T.remember}</button></div>` : '');
  const plzForm = () => `<form class="dg-plz" data-dg-plz novalidate><input inputmode="numeric" autocomplete="postal-code" maxlength="5" placeholder="${T.plz}" aria-label="${T.plz}" value="${esc(plzValue)}"><button class="dg-btn" type="submit">${T.search}</button></form>` +
    (plzError ? `<p class="dg-err" role="alert">${esc(plzError)}</p>` : '');
  function galleryList(rows, g) {
    const withDist = rows.map(r => ({ ...r, d: dist ? dist[r.x.k] : g && g !== r.x ? km(g, r.x) : null }));
    if (withDist.some(r => r.d != null)) withDist.sort((a, b) => (a.d ?? 1e9) - (b.d ?? 1e9));
    return `<ul class="dg-list">${withDist.map(({ x, d, note }) =>
      `<li><button type="button" data-dg-pick="${x.k}"${g && g.k === x.k ? ' aria-current="true"' : ''}><span>${esc(x.n)}${note ? `<em>${esc(note)}</em>` : ''}</span>` +
      `<small>${d != null ? Math.round(d) + ' ' + T.km : g && g.k === x.k ? T.yourGallery : ''}</small></button></li>`).join('')}</ul>`;
  }
  function chooserBody() {
    const g = cur();
    const top = g
      ? `${galHead(T.yourGallery, g)}${ipNote()}${galLinks(g)}<hr>`
      : `<div><p class="dg-eb">${T.yourGallery}</p><p class="dg-name">${T.near}</p><div class="dg-meta"><span>${T.nearSub}</span></div></div>`;
    return `${top}<p class="dg-sub">${g ? T.otherGallery : T.plz}</p>${plzForm()}${galleryList(G.filter(x => x !== g).map(x => ({ x })), g)}`;
  }

  // ---- 1. header entry point (desktop) -------------------------------------------------
  let headerBtn = null;
  // Two header options: the labelled entry, or an icon sized and weighted like production's header icons
  // (same pin geometry as the shop sprite's #pin, stroke matched to #user/#cart at 22px)
  const HEAD_ICON = '<svg class="dg-head-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5-5.54 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.2 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>';
  // label: first item of the icon row; icon: right after WhatsApp, inside production's contact group
  function placeHeaderBtn() {
    const aside = document.querySelector('site-header header > aside');
    const wa = aside && aside.querySelector('.nav-container > whats-app-contact');
    if (S.headerStyle === 'icon' && wa) {
      if (wa.nextElementSibling !== headerBtn) wa.after(headerBtn);
    } else if (aside && aside.firstElementChild !== headerBtn) aside.insertBefore(headerBtn, aside.firstChild);
  }
  function headerLabel() {
    const g = cur();
    const name = g ? `${T.gallery} ${g.n}` : T.choose;
    if (headerBtn) {
      headerBtn.dataset.style = S.headerStyle;
      if (S.headerStyle === 'icon') { headerBtn.setAttribute('aria-label', name); headerBtn.title = name; }
      else { headerBtn.removeAttribute('aria-label'); headerBtn.removeAttribute('title'); }
    }
    if (headerBtn) placeHeaderBtn();
    if (S.headerStyle === 'icon') return HEAD_ICON;
    // short: just the city once chosen, "Meine Galerie" before
    if (S.headerStyle === 'short') return `${IC.pin}<span>${g ? `<b>${esc(g.n)}</b>` : T.myGallery}</span>${IC.chev}`;
    return `${IC.pin}<span>${g ? `${T.gallery} <b>${esc(g.n)}</b>` : T.choose}</span>${IC.chev}`;
  }
  function mountHeader() {
    whenPresent('site-header header > aside', aside => {
      headerBtn = document.createElement('button');
      headerBtn.type = 'button';
      headerBtn.className = 'dg-head';
      headerBtn.dataset.dgAnchor = '';
      headerBtn.dataset.dgAlign = 'right';
      headerBtn.setAttribute('aria-haspopup', 'dialog');
      headerBtn.setAttribute('aria-expanded', 'false');
      aside.insertBefore(headerBtn, aside.firstChild);
      headerBtn.innerHTML = headerLabel();
      headerBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (dialog && dialogAnchor === headerBtn) return closeDialog();
        track('gallery_header_open', { gallery: S.mode === 'none' ? '' : S.gal, state: S.mode });
        openDialog(headerBtn, chooserBody, T.yourGallery);
      });
    });
  }

  // ---- 2. PDP availability pill ---------------------------------------------------------
  let pdp = null; // { root, sizes: [{sku,label,btn}], pillWrap }
  function readSizes() {
    return [...document.querySelectorAll('.pdp-products .product-sizes .size')].map(btn => {
      const m = (btn.dataset.productPreview || '').match(/[?&]sku=([A-Za-z0-9]+)/);
      const dims = btn.textContent.match(/(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)/i);
      return { sku: m ? m[1].toUpperCase() : null, label: dims ? `${dims[1]} × ${dims[2]}` : btn.textContent.trim(), btn };
    }).filter(s => s.sku);
  }
  function selectedSize() {
    const sizes = pdp.sizes;
    const shown = (document.querySelector('.pdp-more-info .product-sku') || {}).textContent;
    return sizes.find(s => s.btn.classList.contains('active')) || sizes.find(s => s.sku === (shown || '').trim()) || sizes[0];
  }
  function shipDays() {
    const t = (document.querySelector('.pdp-more-info') || {}).textContent || '';
    const m = t.match(/(?:in|within)\s+(\d+)\s+(?:Tagen|days)/i);
    return m ? m[1] : null;
  }
  function pdpState() {
    const sel = selectedSize();
    const g = cur();
    const holders = G.filter(x => pdp.sizes.some(s => has(x, s.sku)));
    if (!holders.length) return null;
    const withSel = holders.filter(x => has(x, sel.sku));
    if (g && has(g, sel.sku)) return { kind: 'mine', g, sel, holders };
    if (g) {
      const mine = pdp.sizes.filter(s => has(g, s.sku));
      if (mine.length) return { kind: 'mineOther', g, sel, sizes: mine, holders };
      const nearest = pool => pool.map(x => ({ x, d: km(g, x) })).sort((a, b) => a.d - b.d).find(n => n.d <= NEAR_KM);
      const exact = nearest(withSel);
      if (exact) return { kind: 'near', g, sel, at: exact.x, d: exact.d, holders };
      const other = nearest(holders);
      if (other) return { kind: 'nearOther', g, sel, at: other.x, d: other.d, holders };
    }
    return { kind: 'count', n: holders.length, sel, holders };
  }
  function pillHTML(st) {
    const a = 'type="button" class="dg-pill%" data-dg-anchor aria-haspopup="dialog" aria-expanded="false"';
    switch (st.kind) {
      case 'mine': return `<button ${a.replace('%', ' dg-ok')}><span>${T.inStock}</span><b>${esc(st.g.n)}</b>${IC.info}</button>`;
      case 'mineOther': return `<button ${a.replace('%', ' dg-ok')}><span>${T.inStock}</span><b>${esc(st.g.n)}</b><span class="dg-km">${EN ? 'only' : 'nur'} ${st.sizes.map(s => s.label).join(', ')} cm</span>${IC.info}</button>`;
      case 'near': return `<button ${a.replace('%', '')}><span>${T.inStock}</span><b>${esc(st.at.n)}</b><span class="dg-km">${Math.round(st.d)} ${T.km}</span>${IC.info}</button>`;
      case 'nearOther': return `<button ${a.replace('%', '')}><span>${T.otherSize}</span><b>${esc(st.at.n)}</b><span class="dg-km">${Math.round(st.d)} ${T.km}</span>${IC.info}</button>`;
      default: return st.n === 1
        ? `<button ${a.replace('%', '')}><span>${T.inStock}</span><b>${esc(st.holders[0].n)}</b>${IC.info}</button>`
        : `<button ${a.replace('%', '')}><span>${T.inN(st.n)}</span>${IC.info}</button>`;
    }
  }
  function holderRows(st, exclude) {
    return st.holders.filter(x => x !== exclude).map(x => ({
      x, note: pdp.sizes.filter(s => has(x, s.sku)).map(s => s.label).join(', ')
    }));
  }
  // Each fact appears once: the gallery in the headline, a size in the text or on the button
  // (never both), and no gallery repeated in the list below it. "Galerie ändern" is always there.
  function popBody() {
    const st = pdpState();
    if (!st) return '';
    const g = cur();
    const online = `<p class="dg-txt dg-online">${T.online(shipDays())}</p>`;
    const change = `<button type="button" class="dg-quiet" data-dg-chooser>${T.change}</button>`;
    const alsoIn = exclude => {
      const rows = holderRows(st, exclude);
      return rows.length ? `<hr><p class="dg-sub">${T.alsoIn}</p>${galleryList(rows, g)}` : '';
    };
    const sizeButton = size => `<div class="dg-actions"><button type="button" class="dg-btn" data-dg-size="${size.sku}">${T.pickSize(size.label)}</button></div>`;
    if (st.kind === 'mine') {
      return `${galHead(T.yourGallery, g)}<p class="dg-txt">${T.mineTxt(st.sel.label)}</p>${ipNote()}${galLinks(g)}${alsoIn(g)}${change}`;
    }
    if (st.kind === 'mineOther') {
      return `${galHead(T.yourGallery, g)}<p class="dg-txt">${T.mineOtherTxt}</p>${sizeButton(st.sizes[0])}${online}${ipNote()}${galLinks(g)}${alsoIn(g)}${change}`;
    }
    if (st.kind === 'near' || st.kind === 'nearOther') {
      const there = pdp.sizes.filter(s => has(st.at, s.sku));
      const extra = `<span>${Math.round(st.d)} ${T.km} ${EN ? 'away' : 'entfernt'}</span>` +
        (st.kind === 'near' ? `<span>${T.sizes}: ${esc(there.map(s => s.label).join(', '))} cm</span>` : '');
      return `${galHead(EN ? 'Nearest gallery with this work' : 'Nächste Galerie mit diesem Werk', st.at, extra)}` +
        `<p class="dg-txt">${T.nearTxt(g.n)}</p>${st.kind === 'nearOther' ? sizeButton(there[0]) : ''}${online}${galLinks(st.at)}${alsoIn(st.at)}${change}`;
    }
    return `<div><p class="dg-eb">${EN ? 'See the original' : 'Im Original ansehen'}</p><p class="dg-name">${st.n === 1 ? 'LUMAS ' + esc(st.holders[0].n) : T.countTitle(st.n)}</p><div class="dg-meta"><span>${T.countSub}</span></div></div>` +
      (st.n === 1 ? `${galLinks(st.holders[0])}` : `${plzForm()}${galleryList(holderRows(st), g)}`) + online + change;
  }
  let chooserMode = false;
  function pdpDialogBody() { return chooserMode ? chooserBody() : popBody(); }
  function renderPill() {
    if (!pdp) return;
    const st = pdpState();
    // .pdp-basic-info is a named-area grid, so the pill lives inside an existing area:
    // the top of .artist-row, or the empty .pdp-test-tax-klarna slot between price and CTA.
    const host = document.querySelector(S.placement === 'price'
      ? '.pdp-basic-info .pdp-test-tax-klarna'
      : '.pdp-basic-info .artist-row');
    if (!host) return;
    if (!pdp.pillWrap) {
      pdp.pillWrap = document.createElement('div');
      pdp.pillWrap.className = 'dg-pillwrap';
    }
    pdp.pillWrap.dataset.placement = S.placement;
    if (pdp.pillWrap.parentElement !== host) host.insertBefore(pdp.pillWrap, host.firstChild);
    pdp.pillWrap.innerHTML = st ? pillHTML(st) : '';
    pdp.pillWrap.hidden = !st;
    if (st) {
      const btn = pdp.pillWrap.querySelector('button');
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (dialog && dialogAnchor === btn) return closeDialog();
        chooserMode = false;
        track('gallery_pill_click', { pill_state: st.kind, sku: st.sel.sku, gallery: S.mode === 'none' ? '' : S.gal });
        openDialog(btn, pdpDialogBody, EN ? 'Availability in our galleries' : 'Verfügbarkeit in den Galerien');
      });
      if (pdp.lastShown !== st.kind + st.sel.sku) {
        pdp.lastShown = st.kind + st.sel.sku;
        track('gallery_pill_view', { pill_state: st.kind, sku: st.sel.sku });
      }
    }
  }
  function mountPdp() {
    whenPresent('.pdp-products .product-sizes .size', () => {
      pdp = { sizes: readSizes(), pillWrap: null };
      if (!pdp.sizes.length) { pdp = null; return; }
      renderPill();
      // size changes swap the active class; the SKU under the price follows
      const watch = [document.querySelector('.pdp-products'), document.querySelector('.pdp-more-info .product-sku')].filter(Boolean);
      let pending = 0;
      const mo = new MutationObserver(() => {
        cancelAnimationFrame(pending);
        pending = requestAnimationFrame(() => {
          const fresh = readSizes();
          if (fresh.length) pdp.sizes = fresh;
          renderPill();
          if (dialog && dialogAnchor && !document.contains(dialogAnchor)) closeDialog(false);
        });
      });
      watch.forEach(n => mo.observe(n, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true, characterData: true }));
    });
  }

  // ---- 3. PLP switch + tile line --------------------------------------------------------
  let plp = null;
  function cardSkus(card) {
    try {
      const p = JSON.parse(card.dataset.product || '{}');
      return Object.keys(p.prices || {}).concat(p.first_concrete_sku ? [p.first_concrete_sku] : []);
    } catch (e) { return []; }
  }
  function paintCards() {
    if (!plp) return;
    const g = cur();
    let shown = 0, loaded = 0;
    document.querySelectorAll('product-card').forEach(card => {
      loaded++;
      const stocked = !!g && cardSkus(card).some(s => has(g, s));
      if (stocked) shown++;
      card.classList.toggle('dg-hide', S.filter && !!g && !stocked);
    });
    const count = document.querySelector('.results-count');
    if (count) {
      let note = count.querySelector('.dg-count');
      if (S.filter && g) {
        if (!note) { note = document.createElement('span'); note.className = 'dg-count'; count.appendChild(note); }
        note.textContent = T.filterCount(shown, g.n);
      } else if (note) note.remove();
    }
    plp.loaded = loaded;
  }
  function toggleHTML() {
    const g = cur();
    return `<label><input type="checkbox" name="dg_gallery"${S.filter && g ? ' checked' : ''}><span></span> ${esc(g ? T.filter(g.n) : T.filterNone)}</label>` +
      `<small>${g ? T.takeHome : T.choose}</small>`;
  }
  function mountToggle(body) {
    if (body.querySelector('.dg-toggle')) return;
    const box = document.createElement('div');
    box.className = 'toggle-switch dg-toggle';
    box.innerHTML = toggleHTML();
    body.insertBefore(box, body.firstChild);
    // production's sidebar treats any input change inside it as a filter change (re-query + scroll),
    // so the switch's events stop here
    box.addEventListener('input', e => e.stopPropagation());
    box.addEventListener('change', e => {
      e.stopPropagation();
      if (!e.target.matches('input')) return;
      if (!cur()) {
        e.target.checked = false;
        const anchor = headerBtn && headerBtn.offsetParent ? headerBtn : box.querySelector('label');
        anchor.dataset.dgAnchor = '';
        openDialog(anchor, chooserBody, T.yourGallery);
        return;
      }
      S.filter = e.target.checked; save();
      track('gallery_filter_toggle', { on: S.filter, gallery: S.gal });
      // hiding cards makes the browser's scroll anchoring jump the page; keep the visitor where they are
      const keepY = scrollY;
      paintCards();
      scrollTo(0, keepY);
    });
  }
  function repaintToggles() {
    document.querySelectorAll('.dg-toggle').forEach(t => { t.innerHTML = toggleHTML(); });
  }
  function mountPlp() {
    whenPresent('product-card', () => {
      plp = { loaded: 0 };
      paintCards();
      let pending = 0;
      const mo = new MutationObserver(muts => {
        if (muts.every(m => [...m.addedNodes].every(n => n.nodeType !== 1 || n.classList?.contains('dg-count') || n.classList?.contains('dg-toggle')))) return;
        cancelAnimationFrame(pending);
        pending = requestAnimationFrame(() => {
          document.querySelectorAll('.filter-sidebar .sidebar-body').forEach(mountToggle);
          paintCards();
        });
      });
      mo.observe(document.body, { childList: true, subtree: true });
      document.querySelectorAll('.filter-sidebar .sidebar-body').forEach(mountToggle);
    });
  }

  // ---- interactions inside the dialog ---------------------------------------------------
  function pick(k) {
    S.gal = k; S.mode = 'saved'; save();
    track('gallery_select', { gallery: k, source: dialogAnchor === headerBtn ? 'header' : pdp ? 'pdp' : 'plp' });
    closeDialog();
    refreshAll(true);
  }
  function refreshAll(flash) {
    if (headerBtn) {
      headerBtn.innerHTML = headerLabel();
      if (flash) { headerBtn.classList.remove('dg-flash'); void headerBtn.offsetWidth; headerBtn.classList.add('dg-flash'); }
    }
    renderPill();
    repaintToggles();
    paintCards();
    if (window.__dgPanel) window.__dgPanel();
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-dg-pick],[data-dg-confirm],[data-dg-size],[data-dg-chooser],[data-dg-link]');
    if (!t || !dialog) return;
    if (t.dataset.dgPick) return pick(t.dataset.dgPick);
    if (t.dataset.dgConfirm !== undefined) {
      S.mode = 'saved'; save(); track('gallery_confirm', { gallery: S.gal });
      paintDialog(); refreshAll(true); return;
    }
    if (t.dataset.dgSize) {
      const size = pdp && pdp.sizes.find(s => s.sku === t.dataset.dgSize);
      track('gallery_size_switch', { sku: t.dataset.dgSize, gallery: S.gal });
      closeDialog(false);
      if (size) size.btn.click();
      return;
    }
    if (t.dataset.dgChooser !== undefined) { e.stopPropagation(); chooserMode = true; paintDialog('input'); return; }
    if (t.dataset.dgLink) track('gallery_link_click', { link: t.dataset.dgLink, gallery: S.gal });
  });
  document.addEventListener('submit', e => {
    if (!e.target.matches('[data-dg-plz]')) return;
    e.preventDefault();
    const v = e.target.querySelector('input').value.trim();
    plzValue = v;
    if (!/^\d{5}$/.test(v)) { plzError = T.plzBad; dist = null; return paintDialog('[data-dg-plz] input'); }
    const c = PLZ[v.slice(0, 2)];
    if (!c) { plzError = T.plzUnknown; dist = null; return paintDialog('[data-dg-plz] input'); }
    plzError = ''; dist = {};
    G.forEach(g => { dist[g.k] = km({ lat: c[0], lng: c[1] }, g); });
    track('gallery_postcode_search', { region: v.slice(0, 2) });
    paintDialog('.dg-list button');
  });

  // ---- presenter panel ------------------------------------------------------------------
  function mountPanel() {
    const root = document.createElement('div');
    root.className = 'dg-panel';
    root.innerHTML = `<button type="button" class="dg-panel-toggle" aria-expanded="false">Deine Galerie</button><div class="dg-panel-body" hidden></div>`;
    document.body.appendChild(root);
    const body = root.querySelector('.dg-panel-body');
    const toggle = root.querySelector('.dg-panel-toggle');
    const log = [];
    window.addEventListener('dg:event', e => { log.unshift(e.detail); log.length = Math.min(log.length, 6); if (!body.hidden) paint(); });
    const seg = (name, opts, val) => `<div class="dg-seg" role="group" aria-label="${name}">${opts.map(([v, l]) => `<button type="button" data-${name}="${v}" aria-pressed="${val === v}">${l}</button>`).join('')}</div>`;
    const here = location.pathname + location.search.replace(/[?&]pristine\b/, '');
    function paint() {
      const sep = here.includes('?') ? '&' : '?';
      body.innerHTML =
        `<p class="dg-p-h">Visitor</p>${seg('mode', [['ip', 'IP guess'], ['saved', 'Saved choice'], ['none', 'Unknown']], S.mode)}` +
        `<p class="dg-p-h">Gallery</p><select data-galsel ${S.mode === 'none' ? 'disabled' : ''}>${G.map(g => `<option value="${g.k}"${g.k === S.gal ? ' selected' : ''}>${g.n} · ${STOCK[g.k] ? STOCK[g.k].size : 0} SKUs</option>`).join('')}</select>` +
        `<p class="dg-p-h">Header entry</p>${seg('hstyle', [['label', 'Label'], ['short', 'Short'], ['icon', 'Icon only']], S.headerStyle)}` +
        `<p class="dg-p-h">PDP pill</p>${seg('placement', [['top', 'Above artist'], ['price', 'Below price']], S.placement)}` +
        `<p class="dg-p-h">Walk-through</p><ul class="dg-p-links">${WALK.map(([u, l]) => `<li><a href="${shopHref(PREFIX + u)}">${l}</a></li>`).join('')}</ul>` +
        `<p class="dg-p-row"><a href="${STATIC ? 'https://www.lumas.de' + (STATIC.path || '/') : here + sep + 'pristine'}"${STATIC ? ' target="_blank" rel="noopener"' : ''}>${STATIC ? 'This page live on lumas.de' : 'This page without the layer'}</a> · <button type="button" data-reset>Reset</button></p>` +
        `<p class="dg-p-h">Events (dataLayer)</p><ol class="dg-p-log">${log.map(l => `<li><b>${l.event}</b> ${esc(JSON.stringify(l.params || {}))}</li>`).join('') || '<li>none yet</li>'}</ol>` +
        `<p class="dg-p-note">Stock: SAP snapshot ${STOCK_META.snapshot}, standard variants, 12 German galleries. IP guess is simulated as Hamburg.</p>`;
    }
    window.__dgPanel = () => { if (!body.hidden) paint(); };
    toggle.addEventListener('click', () => {
      body.hidden = !body.hidden;
      toggle.setAttribute('aria-expanded', String(!body.hidden));
      if (!body.hidden) paint();
    });
    body.addEventListener('click', e => {
      const t = e.target.closest('button');
      if (!t) return;
      if (t.dataset.mode) { S.mode = t.dataset.mode; if (S.mode === 'ip') S.gal = IP_GUESS; if (S.mode === 'none') S.filter = false; }
      else if (t.dataset.placement) S.placement = t.dataset.placement;
      else if (t.dataset.hstyle) S.headerStyle = t.dataset.hstyle;
      else if (t.dataset.reset !== undefined) Object.assign(S, DEFAULTS);
      else return;
      save(); closeDialog(false); refreshAll(false); paint();
    });
    body.addEventListener('change', e => {
      if (!e.target.matches('[data-galsel]')) return;
      S.gal = e.target.value; if (S.mode === 'ip') S.mode = 'saved';
      save(); closeDialog(false); refreshAll(true); paint();
    });
  }
  // Pages that show each pill state with Hamburg as the gallery (checked against the snapshot).
  // Computed from the snapshot, with the page's default size selected.
  const WALK = [
    ['/pictures/olaf_hajek/frida-6/', 'Green: selected size in Hamburg (Hajek, Frida)'],
    ['/pictures/chiron_duong/portrait_no209/', 'Other size in Hamburg, one click to switch (Duong)'],
    ['/pictures/sven_fennema/incantata_iii/', 'Nearest gallery: Hannover, 132 km (Fennema)'],
    ['/pictures/manu_grinspan/gun/', 'None within 200 km: count + postcode (Grinspan)'],
    ['/highlights/bestseller/', 'PLP: Bestseller, switch + tile lines']
  ];
  let STOCK_META = { snapshot: '' };

  // ---- boot -----------------------------------------------------------------------------
  fetch(LAYER_BASE + 'stock.json').then(r => r.json()).then(data => {
    STOCK_META = data;
    Object.entries(data.stock).forEach(([k, list]) => { STOCK[k] = new Set(list); });
    mountHeader();
    mountPdp();
    mountPlp();
    mountPanel();
  });
})();
