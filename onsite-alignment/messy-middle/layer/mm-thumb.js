/* Idea 4: Art's rules of thumb.
 * PROTO HEADER
 *   ID:          PROTO-2026-MM4
 *   Hypothesis:  [ASSUMPTION] If a colour, format or size word typed into search is offered first as the shop's own
 *                filter (and the rest of the query is kept), fewer searches end without a click and more reach an
 *                artwork page, because art buyers narrow down by rules of thumb (category heuristics: a top-2 bias in
 *                14 of 31 categories). Site search, 90 days: schwarz-weiß ~400 sessions, panorama, Quer/Hochformat,
 *                XXL and klein; "signiert" only 13.
 *   Prior:       GA4 searchTerm DE 26 Aug - 24 Nov 2026; production filters colors / dimension / width already exist.
 *   Goals:       primary ATC · secondary thumb_click (search to filtered listing), search exits [UNBOUND]
 *   Variants:    control = ?mm=none | filter suggestion + shape on listing cards (this)
 *   Status:      exploration
 * Rooms (Küche ~170, Bad ~100 sessions) have no filter or room page in production yet; they need the Art by [ROOM]
 * pages first, so they are left out here.
 */
(function () {
  const B = window.MM;
  if (!B || !B.on('thumb')) return;

  // Words visitors type → production's existing filter values (filter-key colors / dimension, width ranges, /format/ pages).
  const COLORS = [
    [/schwarz[\s-]*wei(ß|ss)|s\/w(?![a-zäöüß])|schwarzwei(ß|ss)/, 'blackwhite', 'Schwarz-Weiß', 'linear-gradient(135deg,#1c1a18 50%,#fff 50%)'],
    [/(?<![a-zäöüß])gr(ü|ue)n[a-zäöüß]*/, 'green', 'Grün', '#5d7a4f'],
    [/(?<![a-zäöüß])hellblau(?![a-zäöüß])|(?<![a-zäöüß])himmelblau(?![a-zäöüß])/, 'sky', 'Himmelblau', '#9cc3df'],
    [/(?<![a-zäöüß])blau[a-zäöüß]*/, 'blue', 'Blau', '#2f5a8c'],
    [/(?<![a-zäöüß])rot(?![a-zäöüß])|(?<![a-zäöüß])rote(?![a-zäöüß])/, 'red', 'Rot', '#b0322a'],
    [/(?<![a-zäöüß])gelb[a-zäöüß]*/, 'yellow', 'Gelb', '#e3c04a'],
    [/(?<![a-zäöüß])orange(?![a-zäöüß])/, 'orange', 'Orange', '#e07b39'],
    [/(?<![a-zäöüß])lila(?![a-zäöüß])|(?<![a-zäöüß])violett(?![a-zäöüß])/, 'purple', 'Lila', '#7a4f8c'],
    [/(?<![a-zäöüß])braun[a-zäöüß]*/, 'brown', 'Braun', '#7a5536'],
    [/(?<![a-zäöüß])bunt[a-zäöüß]*|(?<![a-zäöüß])farbenfroh[a-zäöüß]*/, 'colorful', 'Bunt', 'conic-gradient(#b0322a,#e3c04a,#5d7a4f,#2f5a8c,#7a4f8c,#b0322a)'],
    [/(?<![a-zäöüß])wei(ß|ss)(?![a-zäöüß])/, 'white', 'Weiß', '#fff'],
    [/(?<![a-zäöüß])schwarz[a-zäöüß]*/, 'black', 'Schwarz', '#1c1a18'],
  ];
  const FORMATS = [
    [/(?<![a-zäöüß])quer[a-zäöüß]*/, 'across', 'Querformat'],
    [/(?<![a-zäöüß])hoch(format)?(?![a-zäöüß])/, 'upright', 'Hochformat'],
    [/(?<![a-zäöüß])quadrat[a-zäöüß]*/, 'square', 'Quadrat'],
    [/(?<![a-zäöüß])rund[a-zäöüß]*/, 'round', 'Rund'],
    [/(?<![a-zäöüß])panorama[a-zäöüß]*/, 'panorama', 'Panorama'],
  ];
  const SIZES = [
    [/(?<![a-zäöüß])xxl(?![a-zäöüß])|(?<![a-zäöüß])riesig[a-zäöüß]*|(?<![a-zäöüß])gro(ß|ss)e?(?![a-zäöüß])|(?<![a-zäöüß])gro(ß|ss)formatig[a-zäöüß]*/, 'width=from2000-to5500', 'Ab 200 cm Breite'],
    [/(?<![a-zäöüß])klein[a-zäöüß]*|(?<![a-zäöüß])kleinformat[a-zäöüß]*/, 'width=from0-to550&height=from0-to600', 'Bis 55 cm Breite'],
  ];
  const SHAPE = { across: 'Querformat', upright: 'Hochformat', square: 'Quadrat', panorama: 'Panorama', round: 'Rund', object: 'Objekt' };

  function parse(raw) {
    let q = ' ' + raw.toLowerCase().trim() + ' ';
    const found = [];
    for (const [re, value, label, swatch] of COLORS) if (re.test(q)) { found.push({ kind: 'Farbwelt', param: 'colors=' + value, label, swatch }); q = q.replace(re, ' '); break; }
    for (const [re, value, label] of FORMATS) if (re.test(q)) { found.push({ kind: 'Format', param: 'dimension=' + value, label, icon: 'icon-format-' + value }); q = q.replace(re, ' '); break; }
    for (const [re, param, label] of SIZES) if (re.test(q)) { found.push({ kind: 'Größe', param, label }); q = q.replace(re, ' '); break; }
    const rest = q.replace(/(?<![a-zäöüß])(bilder?|kunst|fotos?|fotografie|wandbilder?|in|mit|und)(?![a-zäöüß])/g, ' ').replace(/\s+/g, ' ').trim();
    return { found, rest };
  }

  function urlFor(p) {
    const parts = p.found.map(f => f.param);
    if (p.rest) parts.unshift('q=' + encodeURIComponent(p.rest));
    return '/search/?' + parts.join('&');
  }

  function markHtml(f) {
    if (f.swatch) return `<span class="mm-thumb-swatch" style="background:${f.swatch}"></span>`;
    if (f.icon) return `<svg class="mm-thumb-icon" aria-hidden="true"><use href="#${f.icon}"></use></svg>`;
    return '<span class="mm-thumb-swatch is-size" aria-hidden="true">↔</span>';
  }

  // Desktop: the header dropdown (.suggestion-container .suggestions, a grid of <dl> columns).
  // Phones: the bottom navigation's search panel (nav-search .search-suggestions, a list of text links).
  function boxFor(input) {
    const nav = input.closest('nav-search');
    if (nav) return nav.querySelector('.search-suggestions');
    return input.closest('form')?.parentElement?.querySelector('.suggestion-container .suggestions') || document.querySelector('.suggestion-container .suggestions');
  }

  function update(input) {
    const box = boxFor(input);
    if (!box) return;
    box.querySelector('.mm-thumb')?.remove();
    const p = parse(input.value || '');
    if (!p.found.length) return;
    const href = urlFor(p);
    const title = p.found.map(f => f.label).join(' · ') + (p.rest ? ` · „${p.rest}“` : '');
    const dl = B.el(`<dl class="mm-thumb"><dt>Als Filter</dt><dd><a class="mm-thumb-link" href="${B.esc(href)}">
      <span class="mm-thumb-marks">${p.found.map(markHtml).join('')}</span>
      <span class="mm-thumb-text"><strong>${B.esc(title)}</strong><span>${p.found.map(f => f.kind).join(', ')} anwenden</span></span>
      <span aria-hidden="true">→</span></a></dd></dl>`);
    dl.querySelector('a').addEventListener('mousedown', e => e.preventDefault());   // production closes the dropdown on blur
    dl.querySelector('a').addEventListener('click', () => B.track('thumb_click', { mm_query: input.value, mm_filters: p.found.map(f => f.param).join('&') }));
    box.insertBefore(dl, box.firstChild);
    B.track('thumb_view', { mm_query: input.value });
  }

  function watchSearch() {
    document.querySelectorAll('input[name="q"]').forEach(input => {
      let t = null;
      const run = () => { clearTimeout(t); t = setTimeout(() => update(input), 320); };
      input.addEventListener('input', run);
      input.addEventListener('focus', run);
      // production re-renders the suggestions while typing; put ours back on top
      const box = boxFor(input);
      if (box) new MutationObserver(() => { if (input.value && !box.querySelector('.mm-thumb')) run(); }).observe(box, { childList: true });
    });
  }

  // Listing cards: the shape before production's "N Größen verfügbar", the second rule of thumb visible at a glance.
  function shapeOnCards() {
    document.querySelectorAll('product-card:not([data-mm-shape])').forEach(card => {
      let data; try { data = JSON.parse(card.dataset.product || '{}'); } catch (e) { data = {}; }
      const label = SHAPE[data.dimension];
      const meta = card.querySelector('.product-meta');
      if (!label || !meta) return;
      card.dataset.mmShape = '1';
      const node = [...card.querySelectorAll('*')].find(n => n.children.length === 0 && /Größen? verfügbar/.test(n.textContent));
      if (node) { node.textContent = `${label} · ${node.textContent.trim()}`; return; }
      const n = Object.keys(data.prices || {}).length;
      meta.appendChild(B.el(`<div class="mm-shape">${label}${n > 1 ? ` · ${n} Größen` : ''}</div>`));
    });
  }

  B.ready(() => {
    watchSearch();
    if (document.querySelector('.pdp-container')) return;
    setTimeout(shapeOnCards, 900);
    new MutationObserver(() => shapeOnCards()).observe(document.body, { childList: true, subtree: true });
  });
})();
