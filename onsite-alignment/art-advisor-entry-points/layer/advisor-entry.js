/*
 * Art Advisor entry points on the lumas.de clone.
 *
 * Implements the integration concept "Art Advisor × Suche" (claude.ai artifact
 * ECP4NcN4BwskG7EJqviZb3) on top of verbatim production pages. Nothing here edits
 * production markup in place: every entry point is inserted next to an existing
 * element, and the homepage finder is only hidden, never removed. serve.py adds
 * this file to every page; append ?pristine to any URL to see production alone.
 *
 *   3.1 search overlay row        3.4 Artfinder menu card
 *   3.2 inline tile in results    3.5 homepage free-text finder
 *   3.3 banner on question / 0-3  3.6 product page "similar, but different"
 *       hit results               3.7 back-to-consultation pill after a handoff
 *
 * Copy follows the page language: German on lumas.de, English under lumas.de/en/.
 *
 * A presenter panel (bottom right) switches each entry point on or off for the
 * stakeholder walk-through, shows the query class, and logs the GA4 events the
 * concept asks for. No event leaves the browser.
 */
(() => {
  'use strict';

  const ADVISOR = window.aaStatic?.advisor || '/art-advisor/';
  const LAYER = new URL('.', document.currentScript.src).href;   // this folder, also under the published copy's subpath
  // the shop page this is: the address bar, or in the published static copy the page it was captured from
  const PAGE = window.aaStatic?.page ? new URL(window.aaStatic.page, location.origin) : location;
  const STORE = 'aa-entry-points';
  const ENTRIES = [
    ['overlay', '3.1', 'Search overlay row'],
    ['tile', '3.2', 'Results tile (many hits)'],
    ['banner', '3.3', 'Results banner (question / 0–3 hits)'],
    ['nav', '3.4', 'Artfinder menu card'],
    ['finder', '3.5', 'Homepage free-text finder'],
    ['pdp', '3.6', 'Product page link'],
    ['pill', '3.7', 'Back-to-consultation pill'],
    ['listbar', '3.8', 'Listing top bar (every listing page)'],
    ['sidetab', '3.9', 'Side tab (every page)'],
  ];

  const ls = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} },
  };
  const ss = {
    get(key) { try { return sessionStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { sessionStorage.setItem(key, value); } catch (e) {} },
  };
  const on = Object.assign(Object.fromEntries(ENTRIES.map(([id]) => [id, true])), ls.get(STORE, {}));
  // what the empty search dropdown offers: a bar above the tiles, or a tile among "Most wanted"
  const EMPTY_VARIANT = ls.get('aa-empty-variant', 'bar');
  // how the advisor opens: a window over the shop (default) or the full page
  const OPEN_MODE = ls.get('aa-open-mode', 'window');

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

  // lumas.de serves English under /en/ (<html lang="en">); the entry points follow the page
  const LOCALE = (document.documentElement.lang || 'de').toLowerCase().startsWith('en') ? 'en' : 'de';
  const PREFIX = LOCALE === 'en' ? '/en' : '';
  // the visitor's own words, in the page language's quotation marks
  // the signature: sparkle + ART ADVISOR, the same small lockup on every entry point
  const mark = () => `<span class="aa-mark">${ICON_SPARKLE}<span>Art Advisor</span></span>`;
  const quoted = q => (LOCALE === 'en' ? '“' + esc(q) + '”' : '„' + esc(q) + '“');
  const COPY = {
    de: {
      rowLead: q => `<strong>Frag den Art Advisor</strong> ${q}. Er stellt dir 2–3 Fragen und schlägt passende Editionen vor.`,
      rowQuiet: q => `${q} mit dem Art Advisor eingrenzen →`,
      emptyBar: '<strong>Nicht sicher, wo du anfangen sollst?</strong> Beschreib deinen Raum, eine Stimmung oder einen Anlass, und der Art Advisor schlägt passende Editionen vor.',
      emptyCta: 'Art Advisor fragen →',
      bannerTitle: 'Das klingt nach einer Frage für den Art Advisor',
      bannerText: 'Er versteht Räume, Stimmungen und Anlässe, und er kennt alle Editionen.',
      bannerInput: 'Deine Frage an den Art Advisor',
      bannerButton: 'Art Advisor fragen',
      zeroLine: q => `Keine Edition passt zu ${quoted(q.replace(/ (\S+)$/, '\u00a0$1'))}.`,
      zeroTitle: 'Lass den Art Advisor suchen',
      zeroText: 'Beschreib deinen Raum, eine Stimmung oder einen Anlass. Der Art\u00a0Advisor kennt alle Editionen und schlägt die passenden\u00a0vor.',
      zeroClassic: 'Oder starte eine neue Suche',
      classicLabel: 'Treffer der klassischen Suche',
      tileTitle: n => `${n.toLocaleString('de-DE')} Editionen sind viel.`,
      tileText: q => `Erzähl dem Art Advisor von deinem Raum, und er grenzt ${q} für dich ein.`,
      tileTitleFiltered: n => `${n.toLocaleString('de-DE')} Editionen passen zu deiner Auswahl.`,
      tileTextFiltered: 'Erzähl dem Art Advisor von deinem Raum, und er findet darunter dein Werk.',
      listBar: '<strong>Nicht ganz das Richtige dabei?</strong> Der Art Advisor findet mit dir das Werk, das zu deinem Raum passt.',
      listBarFiltered: n => `<strong>${n} Editionen in deiner Auswahl.</strong> Der Art Advisor findet darunter das Werk, das zu deinem Raum passt.`,
      start: 'Art Advisor fragen',
      hide: 'Ausblenden',
      endConsult: 'Beratung schließen',
      sideTab: 'Art Advisor fragen',
      navText: 'Beschreib deinen Raum oder Anlass, wir finden gemeinsam dein Werk',
      finderTitle: 'Finde deine Edition',
      finderSub: 'Beschreib deinen Raum, deinen Anlass oder deine Stimmung.',
      finderPlaceholder: 'Ein ruhiges Bild über dem Sofa, eher Naturtöne …',
      finderGo: 'Fragen',
      finderChips: ['Unter € 1.000', 'Landschaft', 'Ruhig', 'Als Geschenk'],
      toClassic: 'Lieber klicken? Zum klassischen Finder',
      toAdvisor: 'Lieber beschreiben? Zum Art Advisor Finder',
      pdpText: 'Gefällt dir die Richtung, aber nicht ganz?',
      pdpLink: 'Ähnliches im Art Advisor finden →',
      pdpQuery: (artwork, artist) => `Ähnlich wie „${artwork}“ von ${artist}, aber etwas anders`,
      pill: n => `Zurück zur Beratung${n ? ` <span>· ${n} Vorschläge</span>` : ''}`,
    },
    en: {
      rowLead: q => `<strong>Ask the Art Advisor</strong> ${q}. It asks you 2–3 questions and suggests editions that fit.`,
      rowQuiet: q => `Narrow down ${q} with the Art Advisor →`,
      emptyBar: '<strong>Not sure where to start?</strong> Describe your room, a mood or an occasion, and the Art Advisor suggests editions that fit.',
      emptyCta: 'Ask the Art Advisor →',
      bannerTitle: 'That sounds like a question for the Art Advisor',
      bannerText: 'It understands rooms, moods and occasions, and it knows every edition.',
      bannerInput: 'Your question for the Art Advisor',
      bannerButton: 'Ask the Art Advisor',
      zeroLine: q => `No editions match ${quoted(q.replace(/ (\S+)$/, '\u00a0$1'))}.`,
      zeroTitle: 'Let the Art Advisor find it',
      zeroText: 'Describe your room, a mood or an occasion. The Art\u00a0Advisor knows every edition and suggests the ones that\u00a0fit.',
      zeroClassic: 'Or start a new search',
      classicLabel: 'Results from the classic search',
      tileTitle: n => `${n.toLocaleString('en-GB')} editions is a lot.`,
      tileText: q => `Tell the Art Advisor about your room and it will narrow down ${q} for you.`,
      tileTitleFiltered: n => `${n.toLocaleString('en-GB')} editions match your selection.`,
      tileTextFiltered: 'Tell the Art Advisor about your room and it will find your work among them.',
      listBar: '<strong>Not quite it?</strong> The Art Advisor helps you find the work that fits your room.',
      listBarFiltered: n => `<strong>${n.toLocaleString('en-GB')} editions in your selection.</strong> The Art Advisor finds the one that fits your room.`,
      start: 'Ask the Art Advisor',
      hide: 'Hide',
      endConsult: 'Close consultation',
      sideTab: 'Ask the Art Advisor',
      navText: 'Describe your room or occasion and we find your work together',
      finderTitle: 'Find your edition',
      finderSub: 'Describe your room, your occasion or your mood.',
      finderPlaceholder: 'A calm picture above the sofa, natural tones …',
      finderGo: 'Ask',
      finderChips: ['Under € 1,000', 'Landscape', 'Calm', 'As a gift'],
      toClassic: 'Prefer clicking? Go to the classic finder',
      toAdvisor: 'Prefer describing? Go to the Art Advisor finder',
      pdpText: 'Like the direction, but not quite?',
      pdpLink: 'Find similar with the Art Advisor →',
      pdpQuery: (artwork, artist) => `Similar to “${artwork}” by ${artist}, but a little different`,
      pill: n => `Back to your consultation${n ? ` <span>· ${n} suggestions</span>` : ''}`,
    },
  }[LOCALE];

  // ---- events (GA4 stand-ins from the concept, section 05) -----------------------
  const events = ls.get('aa-events', []);
  function track(name, params = {}) {
    events.unshift({ t: new Date().toLocaleTimeString('de-DE'), name, params: { ...params, locale: LOCALE } });
    events.length = Math.min(events.length, 40);
    ls.set('aa-events', events);
    console.info('[GA4 stand-in]', name, params);
    renderEventLog();
  }
  const viewed = new Set();
  function trackView(placement, cls) {
    const key = placement + '|' + cls + '|' + (currentQuery || '');
    if (viewed.has(key)) return;
    viewed.add(key);
    track('advisor_offer_view', { placement, class: cls });
  }

  // ---- handoff (concept section 04) -------------------------------------------
  function advisorUrl(q, placement, filters = []) {
    const ret = location.pathname + location.search;
    const params = new URLSearchParams({ lang: LOCALE, return: ret });
    if (q) params.set('q', q);
    // active PLP / search filters travel with the visitor (concept 04: &filters=)
    if (filters.length) params.set('filters', JSON.stringify(filters));
    params.set('src', placement);
    return ADVISOR + '?' + params.toString();
  }
  function goToAdvisor(q, placement, filters = []) {
    track('advisor_offer_click', { placement, filters: filters.length });
    if (OPEN_MODE === 'window') openAdvisorWindow(advisorUrl(q, placement, filters));
    else location.href = advisorUrl(q, placement, filters);
  }

  // ---- the advisor as a window over the shop --------------------------------------
  // The advisor runs in an iframe on the same origin, so it shares sessionStorage (its saved
  // conversation, the dock's count) with the shop. Minimise (–, Esc, a click on the dimmed shop)
  // hides the window but keeps the frame alive, so the conversation carries on and returns as it
  // was; close (×) ends the consultation view. Product links inside open in the shop page itself.
  let advisorWindow = null;
  let windowEnding = false;
  function openAdvisorWindow(url) {
    if (advisorWindow?.open) return;
    document.querySelector('.aa-pill')?.remove();
    // minimised: bring the same window back, mid-conversation
    if (advisorWindow) { showAdvisorWindow(); return; }
    const src = url + (url.includes('?') ? '&' : '?') + 'embed=1';
    advisorWindow = el(`<dialog class="aa-window" aria-label="Art Advisor"><iframe class="aa-window-frame" title="Art Advisor" src="${esc(src)}"></iframe></dialog>`);
    advisorWindow.addEventListener('click', e => { if (e.target === advisorWindow) minimiseAdvisorWindow(); });
    advisorWindow.addEventListener('cancel', e => { e.preventDefault(); minimiseAdvisorWindow(); });   // Esc on the shop side
    advisorWindow.addEventListener('close', () => {
      document.documentElement.classList.remove('aa-window-open');
      if (windowEnding) {
        windowEnding = false;
        advisorWindow.remove();
        advisorWindow = null;
        ss.set('aa:active', '0');
        document.querySelector('.aa-pill')?.remove();
      } else {
        returnPill(true);   // minimised: the dock takes its place
      }
    });
    document.body.append(advisorWindow);
    showAdvisorWindow();
  }
  function showAdvisorWindow() {
    document.documentElement.classList.add('aa-window-open');
    advisorWindow.showModal();
    advisorWindow.querySelector('iframe').focus();
  }
  function minimiseAdvisorWindow() {
    if (!advisorWindow?.open) return;
    track('advisor_window_minimise', {});
    advisorWindow.close();
  }
  function closeAdvisorWindow() {
    track('advisor_window_close', {});
    windowEnding = true;
    if (advisorWindow?.open) advisorWindow.close();
    else advisorWindow?.dispatchEvent(new Event('close'));
  }
  window.addEventListener('message', e => {
    if (e.origin !== location.origin) return;
    if (e.data?.type === 'lumas-art-advisor:close') closeAdvisorWindow();
    if (e.data?.type === 'lumas-art-advisor:minimise') minimiseAdvisorWindow();
  });

  // ---- routing: which class is this query? (concept section 02) ---------------
  const LEX = {
    // German and English signal words: lumas.de serves both
    question: /^(was|welche[smnr]?|wie|wo|wer|warum|womit|gibt es|what|which|how|where|who|why|is there|are there|do you|can you)\b|\?$/,
    wanting: /\b(such[et]?|suche etwas|brauche?|möchte|hätte gern|finde|empfiehl\w*|passt|passend\w*|looking for|need|want|would like|recommend\w*|suggest\w*|goes with|go with|match\w*|fits?)\b/,
    context: /\b(schlafzimmer|wohnzimmer|küche|kueche|flur|diele|büro|buero|kinderzimmer|esszimmer|bad|praxis|wand|sofa|couch|bett|raum|zimmer|geschenk\w*|mutter|vater|mama|papa|freund\w*|partner\w*|hochzeit|geburtstag|weihnacht\w*|jubiläum|gemütlich\w*|ruhig\w*|entspann\w*|fröhlich\w*|stimmung|elegant\w*|modern\w*|hell\w*|dunkl\w*|warm\w*|kühl\w*|bedroom|living room|lounge|kitchen|hallway|hall|office|study|nursery|kids room|dining room|bathroom|wall|bed|room|gift|present|mother|mum|mom|father|dad|friend|wife|husband|wedding|birthday|christmas|anniversary|cosy|cozy|calm|relaxing|peaceful|cheerful|mood|bright|dark|cool)\b/,
    relational: /\b(für|fuer|passt zu|ähnlich wie|aehnlich wie|über dem|über das|über der|zu meine[mnr]?|zu einer?|for|similar to|like this|above the|over the|next to|with my|for my)\b/,
    facet: /\b(blau|rot|grün|gruen|gelb|orange|rosa|pink|lila|violett|schwarz|weiß|weiss|bunt|grau|beige|gold|silber|abstrakt\w*|landschaft\w*|natur|wasser|meer|ozean|strand|stadt|städte|architektur|tier\w*|floral|blume\w*|blüte\w*|portrait|porträt|akt|new york|paris|berlin|groß|gross|klein|xxl|quer\w*|hoch\w*|quadrat\w*|panorama|rund|unter|bis|euro|€|fotografie|malerei|skulptur\w*|schwarz-weiß|blue|red|green|yellow|purple|black|white|colou?rful|grey|gray|silver|abstract|landscape\w*|nature|water|sea|ocean|beach|city|cities|architecture|animals?|flowers?|nude|large|small|big|portrait format|square|round|under|below|photography|painting|sculptures?|black and white)\b/,
  };
  const suggestCache = new Map();
  async function suggest(q) {
    if (q.length < 3) return [];
    if (suggestCache.has(q)) return suggestCache.get(q);
    let terms = [];
    try {
      const r = await fetch(PREFIX + '/suggest/?term=' + encodeURIComponent(q), { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
      terms = await r.json();
    } catch (e) {}
    suggestCache.set(q, terms);
    return terms;
  }
  function classify(q, terms = [], hits = null) {
    const text = q.toLowerCase().trim();
    const words = text.split(/\s+/).filter(Boolean);
    const signals = [];
    if (!words.length) return { cls: 'empty', signals };
    const entity = terms.some(t => { const s = t.toLowerCase(); return s === text || (s.includes(text) && words.length <= 3); });
    if (entity) signals.push('entity match');
    if (words.length >= 4) signals.push('≥ 4 words');
    if (LEX.question.test(text)) signals.push('question');
    if (LEX.wanting.test(text)) signals.push('wanting');
    if (LEX.context.test(text)) signals.push('room / occasion / mood');
    if (LEX.relational.test(text)) signals.push('relational');
    const facet = LEX.facet.test(text);
    if (facet) signals.push('maps to facets');
    if (hits != null) signals.push(hits + ' hits');
    const conversational = signals.some(s => ['≥ 4 words', 'question', 'wanting', 'room / occasion / mood', 'relational'].includes(s));
    let cls;
    if (conversational && !(entity && words.length <= 2)) cls = 'C';
    else if (hits != null && hits <= 3) { cls = 'C'; signals.push('rescue'); }
    else if (entity) cls = 'A';
    else if (facet) cls = 'B';
    else cls = 'A';
    return { cls, signals };
  }
  let currentQuery = '';
  let currentClass = null;
  let lastLogged = '';
  // the panel shows the class live while typing; the event is logged once per search (concept 02)
  function setClassReadout(q, result, isSearch = false) {
    currentQuery = q;
    currentClass = result;
    const key = q + '|' + result.cls;
    if (isSearch && q && key !== lastLogged) {
      lastLogged = key;
      const hits = result.signals.find(s => / hits$/.test(s));
      track('search_classified', { class: result.cls, word_count: q.split(/\s+/).length, hit_count: hits ? parseInt(hits, 10) : 'n/a' });
    }
    renderPanelClass();
  }

  // ---- 3.1 search overlay row ----------------------------------------------------
  function overlayRow(q, cls, context) {
    if (cls === 'C') {
      return el(`<a class="aa-row aa-row--lead" href="${esc(advisorUrl(q, 'overlay'))}" data-aa-placement="overlay">
        <span class="aa-row-icon" aria-hidden="true">${ICON_SPARKLE}</span>
        <span class="aa-row-text">${COPY.rowLead(quoted(q))}</span>
        <kbd class="aa-row-kbd">Enter ↵</kbd></a>`);
    }
    if (cls === 'B') {
      return el(`<a class="aa-row aa-row--quiet" href="${esc(advisorUrl(q, 'overlay'))}" data-aa-placement="overlay"><span class="aa-row-icon" aria-hidden="true">${ICON_SPARKLE}</span>${COPY.rowQuiet(quoted(q))}</a>`);
    }
    if (cls === 'empty' && EMPTY_VARIANT === 'bar') {
      return el(`<a class="aa-row aa-row--lead aa-row--start" href="${esc(advisorUrl('', 'overlay-empty'))}" data-aa-placement="overlay-empty">
        <span class="aa-row-icon" aria-hidden="true">${ICON_SPARKLE}</span>
        <span class="aa-row-text">${COPY.emptyBar}</span>
        <span class="aa-row-cta">${COPY.emptyCta}</span></a>`);
    }
    return null;
  }
  // production's dropdown closes 250 ms after the field blurs; keep focus while a row is pressed
  document.addEventListener('pointerdown', e => { if (e.target.closest('.aa-row')) e.preventDefault(); }, true);
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-aa-placement]');
    if (!a) return;
    e.preventDefault();
    const q = a.closest('[data-aa-query]')?.dataset.aaQuery ?? currentQuery;
    const filters = JSON.parse(a.closest('[data-aa-filters]')?.dataset.aaFilters || '[]');
    goToAdvisor(a.dataset.aaPlacement.startsWith('overlay-empty') ? '' : (a.dataset.aaQ ?? q), a.dataset.aaPlacement, filters);
  }, true);

  function setupOverlay(input, containers) {
    if (!on.overlay || !input) return;
    let timer = null;
    let state = { q: null, cls: null };
    const place = () => {
      document.querySelectorAll('.aa-row').forEach(n => { if (containers.owns(n)) n.remove(); });
      const row = state.cls ? overlayRow(state.q, state.cls) : null;
      if (!row) return;
      row.dataset.aaQuery = state.q;
      const target = containers.target(state.cls);
      if (!target) return;
      if (state.cls === 'C' || state.cls === 'empty') target.prepend(row); else target.append(row);
      trackView('overlay', state.cls);
    };
    const update = async () => {
      const q = input.value.trim();
      const terms = await suggest(q);
      const result = classify(q, terms);
      if (q !== input.value.trim()) return;
      state = { q, cls: result.cls };
      setClassReadout(q, result);
      // run after production has swapped its own dropdown content
      setTimeout(place, 60);
    };
    const schedule = () => { clearTimeout(timer); timer = setTimeout(update, 340); };
    input.addEventListener('input', schedule);
    input.addEventListener('keyup', schedule);
    input.addEventListener('focus', schedule);
    // production toggles hidden on its containers; re-place the row when it does
    new MutationObserver(() => { if (state.cls) requestAnimationFrame(place); })
      .observe(containers.root, { attributes: true, attributeFilter: ['hidden'], subtree: true, childList: false });
    // Enter on a class C query follows the row (concept 3.1); otherwise production's own behaviour
    input.form?.addEventListener('submit', e => {
      const q = input.value.trim();
      const toAdvisor = on.overlay && q && classify(q, suggestCache.get(q) || []).cls === 'C';
      if (!toAdvisor && !(window.aaStatic && q)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      // the published static copy cannot run production's search; aaStatic routes it
      if (toAdvisor) goToAdvisor(q, 'overlay-enter');
      else aaStatic.go(PREFIX + '/search/?q=' + encodeURIComponent(q));
    }, true);
  }
  // the tile variant: the Art Advisor as the first "Most wanted" tile, built from production's own
  // tile markup; the last tile is hidden (not removed) so the grid keeps its eight places
  function searchTile() {
    if (!on.overlay || EMPTY_VARIANT !== 'tile') return;
    document.querySelectorAll('.search-dropdown .suggestions dl:first-of-type, nav-search .search-default dl:first-of-type').forEach(dl => {
      if (dl.querySelector('.aa-search-tile')) return;
      const tiles = [...dl.querySelectorAll(':scope > dd')];
      if (!tiles.length) return;
      const dd = el(`<dd class="aa-search-tile"><a href="${esc(advisorUrl('', 'overlay-tile'))}" data-aa-placement="overlay-tile" data-aa-q="">
        <picture><img alt="Art Advisor" class="max-w-full" src="${LAYER}search-tile-art-advisor.svg"></picture>
        <span>Art Advisor</span></a></dd>`);
      tiles[tiles.length - 1].classList.add('aa-hidden');
      tiles[0].before(dd);
    });
  }
  function overlayDesktop() {
    const input = document.querySelector('search-focus input[type=search]');
    const dropdown = document.querySelector('.search-dropdown');
    const auto = document.querySelector('search-focus .autocomplete-container');
    if (!input || !dropdown || !auto) return;
    setupOverlay(input, {
      root: document.querySelector('site-header') || document.body,
      owns: n => dropdown.contains(n) || auto.contains(n),
      target(cls) {
        if (cls === 'empty') return dropdown.querySelector('.suggestion-container');
        if (!auto.hidden) return auto;
        return cls === 'C' ? dropdown.querySelector('.suggestion-container') : dropdown.querySelector('.suggestions');
      },
    });
  }
  function overlayMobile() {
    const nav = document.querySelector('nav-search');
    if (!nav) return;
    const input = nav.querySelector('input');
    const sugg = nav.querySelector('.search-suggestions');
    const def = nav.querySelector('.search-default');
    setupOverlay(input, {
      root: nav,
      owns: n => nav.contains(n),
      target(cls) {
        if (cls === 'empty') return def;
        return sugg && !sugg.hidden ? sugg : def;
      },
    });
  }

  // ---- results page: 3.2 tile and 3.3 banner -----------------------------------------
  const isSearchPage = /(^|\/)search\/?$/.test(PAGE.pathname);
  // the filters a visitor has applied, as production labels them in the toolbar pills
  function activeFilters() {
    // text pills carry a .pill-label; colour pills are a bare swatch named only in its aria-label
    const colour = LOCALE === 'en' ? 'Colour' : 'Farbe';
    const labels = [...document.querySelectorAll('.filters-toolbar .pill:not(.pill-q)')].map(p => {
      const text = p.querySelector('.pill-label')?.textContent.trim();
      if (text) return text;
      const swatch = p.querySelector('.color-swatch[aria-label]')?.getAttribute('aria-label');
      return swatch ? `${colour}: ${swatch}` : '';
    }).filter(Boolean);
    return [...new Set(labels)];
  }
  function resultsQuery() { return new URLSearchParams(PAGE.search).get('q') || document.querySelector('search-focus input')?.value || ''; }
  function hitCount() {
    const n = document.querySelector('.results-count strong');
    if (n) return parseInt(n.textContent.replace(/\D/g, ''), 10) || 0;
    return document.querySelectorAll('.search-results product-card').length;
  }
  async function decorateResults() {
    // search pages start from the query; category pages (PLPs) from the category's own name
    const q = (isSearchPage ? resultsQuery() : document.querySelector('#main-content h1, h1')?.textContent || '').trim();
    const hits = hitCount();
    const filters = activeFilters();
    // only redraw when something the visitor sees has changed; production adds nodes to the grid all
    // the time (lazy images, videos), and redrawing on each would make the tile flicker
    const key = [q, hits, filters.join('|'), on.tile, on.banner, on.listbar].join('§');
    const current = document.querySelector('.aa-tile, .aa-banner, .aa-listbar');
    if (current && current.isConnected && current.dataset.aaKey === key) return;
    // same state and nothing placed last time: nothing to do (but a tile production patched away comes back)
    if (!current && lastDecorated === key && !lastPlaced) return;
    lastDecorated = key;
    lastPlaced = false;
    decorating = true;
    document.querySelectorAll('.aa-banner, .aa-tile, .aa-classic-label, .aa-listbar').forEach(n => n.remove());
    document.querySelectorAll('.aa-zero-hidden').forEach(n => n.classList.remove('aa-hidden', 'aa-zero-hidden'));
    unstickListbar();
    decorating = false;
    if (!q) return;
    const result = isSearchPage ? classify(q, await suggest(q), hits) : { cls: 'B', signals: ['category page', hits + ' hits'] };
    if (filters.length) result.signals.push(filters.length + ' filters');
    setClassReadout(q, result, isSearchPage);
    const filtersAttr = esc(JSON.stringify(filters));
    const page = parseInt(new URLSearchParams(PAGE.search).get('page') || '1', 10);

    // 0 hits: the Art Advisor takes the place of production's "sorry" line and "Start a new search"
    // field, with the classic search one click away; production's "How to find" block stays below
    const zero = document.querySelector('.no-result-search');
    const zeroForm = zero?.querySelector(':scope > form');
    if (on.banner && isSearchPage && hits === 0 && zeroForm) {
      const block = el(`<section class="aa-banner aa-banner--zero" data-aa-query="${esc(q)}" data-aa-filters="${filtersAttr}" data-aa-key="${esc(key)}">
        <p class="aa-zero-line">${COPY.zeroLine(q)}</p>
        ${mark()}
        <h2 class="aa-banner-title">${COPY.zeroTitle}</h2>
        <p class="aa-banner-text">${COPY.zeroText}</p>
        <form class="aa-banner-form">
          <input class="aa-banner-input" name="q" value="${esc(q)}" aria-label="${COPY.bannerInput}">
          <button class="aa-btn" type="submit">${COPY.bannerButton}</button>
        </form>
        <button class="aa-link aa-zero-classic" type="button">${COPY.zeroClassic}</button>
      </section>`);
      const classic = [...zeroForm.children].slice(0, 2);   // the "0 hits" line and the new-search field
      classic.forEach(n => n.classList.add('aa-hidden', 'aa-zero-hidden'));
      block.querySelector('form').addEventListener('submit', e => {
        e.preventDefault();
        goToAdvisor(block.querySelector('input').value.trim() || q, 'banner-zero', filters);
      });
      block.querySelector('.aa-zero-classic').addEventListener('click', e => {
        classic.forEach(n => n.classList.remove('aa-hidden'));
        e.currentTarget.remove();
        zeroForm.querySelector('input[type=search], input[name=q], input')?.focus();
        track('advisor_finder_switch', { to: 'classic', placement: 'banner-zero' });
      });
      zero.insertBefore(block, zeroForm);
      lastPlaced = true;
      trackView('banner-zero', result.cls);
      return;
    }

    if (on.banner && isSearchPage && (result.cls === 'C' || hits <= 3)) {
      const banner = el(`<section class="aa-banner" data-aa-query="${esc(q)}" data-aa-filters="${filtersAttr}" data-aa-key="${esc(key)}">
        <div class="aa-banner-copy">
          ${mark()}
          <p class="aa-banner-title">${COPY.bannerTitle}</p>
          <p class="aa-banner-text">${COPY.bannerText}</p>
        </div>
        <form class="aa-banner-form">
          <input class="aa-banner-input" name="q" value="${esc(q)}" aria-label="${COPY.bannerInput}">
          <button class="aa-btn" type="submit">${COPY.bannerButton}</button>
        </form>
      </section>`);
      banner.querySelector('form').addEventListener('submit', e => {
        e.preventDefault();
        goToAdvisor(banner.querySelector('input').value.trim() || q, hits === 0 ? 'banner-zero' : 'banner', filters);
      });
      const anchor = document.querySelector('.catalog-wrapper') || zero;
      anchor?.parentElement.insertBefore(banner, anchor);
      if (hits > 0) {
        const grid = document.querySelector('.search-results');
        grid?.parentElement.insertBefore(el(`<p class="aa-classic-label">${COPY.classicLabel}</p>`), grid);
      }
      lastPlaced = true;
      trackView(hits === 0 ? 'banner-zero' : 'banner', result.cls);
      return;
    }

    // 3.8 a slim bar at the top of every listing page, whatever the query class (the banner replaces it)
    if (on.listbar) {
      const bar = el(`<a class="aa-row aa-row--lead aa-row--start aa-listbar" href="${esc(advisorUrl(q, 'listing-bar', filters))}"
          data-aa-placement="listing-bar" data-aa-query="${esc(q)}" data-aa-filters="${filtersAttr}" data-aa-key="${esc(key)}">
        <span class="aa-row-icon" aria-hidden="true">${ICON_SPARKLE}</span>
        <span class="aa-row-text">${filters.length ? COPY.listBarFiltered(hits) : COPY.listBar}</span>
        <span class="aa-row-cta">${COPY.emptyCta}</span></a>`);
      const anchor = document.querySelector('.catalog-wrapper');
      if (anchor) { anchor.parentElement.insertBefore(bar, anchor); stickListbar(bar); lastPlaced = true; trackView('listing-bar', result.cls); }
    }

    if (on.tile && result.cls === 'B' && hits >= 12 && page === 1 && ss.get('aa:tile-dismissed') !== '1') {
      // production lays the grid out in as many columns as fit and leaves the rest empty
      const cols = [...document.querySelectorAll('.search-results .masonry-col')].filter(c => c.offsetParent && c.querySelector(':scope > product-card'));
      if (!cols.length) return;
      const col = cols[Math.floor(cols.length / 2)];
      const cards = [...col.querySelectorAll(':scope > product-card')];
      // grid position 4–8: the 5th item in a single phone column, else the middle column's 2nd slot
      const before = cols.length === 1 ? cards[4] : cards[1];
      const tile = el(`<div class="aa-tile" data-aa-query="${esc(q)}" data-aa-filters="${filtersAttr}" data-aa-key="${esc(key)}">
        <button class="aa-tile-close" type="button" aria-label="${COPY.hide}">×</button>
        ${mark()}
        <p class="aa-tile-title">${filters.length ? COPY.tileTitleFiltered(hits) : COPY.tileTitle(hits)}</p>
        <p class="aa-tile-text">${filters.length ? COPY.tileTextFiltered : COPY.tileText(quoted(q))}</p>
        <a class="aa-btn" href="${esc(advisorUrl(q, 'tile'))}" data-aa-placement="tile">${COPY.start}</a>
      </div>`);
      tile.querySelector('.aa-tile-close').addEventListener('click', () => {
        ss.set('aa:tile-dismissed', '1');
        track('advisor_offer_dismiss', { placement: 'tile' });
        tile.remove();
      });
      col.insertBefore(tile, before || null);
      lastPlaced = true;
      trackView('tile', result.cls);
    }
  }
  let decorating = false;
  let lastDecorated = '';   // the state last decorated, also when it needed no tile or banner
  let lastPlaced = false;   // whether that pass placed a tile or banner
  function watchResults() {
    let t = null;
    const run = () => { clearTimeout(t); t = setTimeout(decorateResults, 250); };
    // production renders the grid client-side; a new grid, or our tile being patched away, means redo
    const root = document.querySelector('.catalog-container') || document.querySelector('#main-content');
    if (root) new MutationObserver(muts => {
      if (decorating) return;
      if (muts.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && !String(n.className || '').startsWith('aa-'))
                      || [...m.removedNodes].some(n => n.nodeType === 1 && /\baa-(tile|banner|listbar)\b/.test(String(n.className || ''))))) run();
    }).observe(root, { childList: true, subtree: true });
    window.addEventListener('search-query-change', run);
    // filtering patches the existing grid in place and rewrites the address: watch both
    let sig = '';
    setInterval(() => {
      const now = location.search + '|' + hitCount() + '|' + activeFilters().join(',');
      if (now !== sig) { sig = now; run(); }
    }, 600);
  }

  // ---- 3.4 Artfinder menu card ---------------------------------------------------------
  function navCard() {
    if (!on.nav) return;
    const det = [...document.querySelectorAll('site-header nav > details')].find(d => /artfinder/i.test(d.querySelector('summary')?.textContent || ''));
    const dl = det?.querySelector('.menu.discovery dl');
    if (!dl || dl.querySelector('.aa-nav-card')) return;
    const dd = el(`<dd class="aa-nav-card">
      <a href="${esc(advisorUrl('', 'nav'))}" data-aa-placement="nav" data-aa-q="">
        <img alt="Art Advisor" class="max-w-full width-full height-auto mb-1 hidden-sm hidden-xs" height="86" src="${LAYER}nav-art-advisor.svg" title="Art Advisor" width="214" style="aspect-ratio:auto;">
        <svg class="hidden-lg hidden-md"><use href="#consult"></use></svg>
        <header>Art&nbsp;Advisor</header>
        <aside>${COPY.navText}</aside>
        <button type="button">${COPY.start}</button>
      </a></dd>`);
    dl.prepend(dd);
    det.addEventListener('toggle', () => { if (det.open) trackView('nav', 'n/a'); });
  }

  // ---- 3.5 homepage free-text finder -----------------------------------------------------
  function homepageFinder() {
    if (!on.finder || PAGE.pathname !== PREFIX + '/') return;
    const finder = document.querySelector('edition-finder');
    const heading = finder?.previousElementSibling;
    if (!finder || document.querySelector('.aa-finder')) return;
    const chips = COPY.finderChips;
    const block = el(`<section class="aa-finder">
      ${mark()}
      <h2 class="aa-finder-title">${COPY.finderTitle}</h2>
      <p class="aa-finder-sub">${COPY.finderSub}</p>
      <form class="aa-finder-form">
        <input class="aa-finder-input" name="q" placeholder="${COPY.finderPlaceholder}" aria-label="${COPY.finderSub}">
        <button class="aa-btn" type="submit">${COPY.finderGo}</button>
      </form>
      <div class="aa-finder-chips">${chips.map(c => `<button type="button" class="aa-chip" data-aa-chip="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      <p class="aa-finder-switch"><button type="button" class="aa-link" data-aa-switch="classic">${COPY.toClassic}</button></p>
    </section>`);
    const back = el(`<p class="aa-finder-switch aa-finder-switch--classic" hidden><button type="button" class="aa-link" data-aa-switch="advisor">${COPY.toAdvisor}</button></p>`);
    // looked up on every use and wired by delegation: production's homepage app can re-render this
    // part of the page after the block is in, which keeps the markup but drops element listeners
    const showClassic = classic => {
      document.querySelector('.aa-finder').hidden = classic;
      document.querySelector('edition-finder')?.previousElementSibling?.classList.toggle('aa-hidden', !classic);
      document.querySelector('edition-finder')?.classList.toggle('aa-hidden', !classic);
      document.querySelector('.aa-finder-switch--classic').hidden = !classic;
      ss.set('aa:finder-classic', classic ? '1' : '0');
    };
    document.addEventListener('submit', e => {
      if (!e.target.matches('.aa-finder-form')) return;
      e.preventDefault();
      goToAdvisor(e.target.querySelector('input').value.trim(), 'homepage-finder');
    });
    document.addEventListener('click', e => {
      const chip = e.target.closest('.aa-finder [data-aa-chip]');
      if (chip) return goToAdvisor(chip.dataset.aaChip, 'homepage-finder-chip');
      const toggle = e.target.closest('[data-aa-switch]');
      if (!toggle) return;
      const classic = toggle.dataset.aaSwitch === 'classic';
      showClassic(classic);
      track('advisor_finder_switch', { to: classic ? 'classic' : 'advisor' });
    });
    (heading || finder).parentElement.insertBefore(block, heading || finder);
    finder.after(back);
    showClassic(ss.get('aa:finder-classic') === '1');
    new IntersectionObserver((entries, obs) => { if (entries.some(x => x.isIntersecting)) { trackView('homepage-finder', 'n/a'); obs.disconnect(); } }).observe(block);
  }

  // ---- 3.6 product page --------------------------------------------------------------
  function productPage() {
    if (!on.pdp) return;
    const actions = document.querySelector('.pdp-actions .button-container');
    if (!actions || document.querySelector('.aa-pdp')) return;
    // the buy box's own title and artist; <make-an-offer> carries them too, but only on the German shop
    const info = document.querySelector('.pdp-basic-info');
    const artist = info?.querySelector('h1 .artist, .artist')?.textContent.trim() || '';
    const artwork = info?.querySelector('.artwork')?.textContent.trim() || document.querySelector('make-an-offer')?.dataset.artwork || '';
    const sku = document.querySelector('.add-to-cart')?.dataset.sku || '';
    const q = artwork ? COPY.pdpQuery(artwork, artist) : '';
    const box = el(`<div class="aa-pdp">
      <span class="aa-pdp-icon" aria-hidden="true">${ICON_SPARKLE}</span>
      <p class="aa-pdp-text">${COPY.pdpText}</p>
      <a class="aa-link" href="${esc(advisorUrl(q, 'pdp'))}" data-aa-placement="pdp" data-aa-q="${esc(q)}">${COPY.pdpLink}</a>
    </div>`);
    box.dataset.sku = sku;
    // below add-to-cart, never above it (concept 3.6)
    actions.after(box);
    trackView('pdp', 'n/a');
  }

  // ---- 3.7 "Zurück zur Beratung" pill -------------------------------------------------
  function returnPill(afterWindow = false) {
    if (!on.pill || ss.get('aa:active') !== '1' || document.querySelector('.aa-pill') || advisorWindow?.open) return;
    const nav = performance.getEntriesByType('navigation')[0];
    let depth = parseInt(ss.get('aa:depth') || '0', 10);
    if (!afterWindow) {
      if (!nav || nav.type === 'navigate') depth += 1;
      else if (nav.type === 'back_forward') depth = Math.max(1, depth - 1);
      ss.set('aa:depth', String(depth));
    }
    const count = parseInt(ss.get('aa:count') || '0', 10);
    if (new URLSearchParams(location.search).get('from') === 'advisor') track('advisor_handoff_pdp', { sku: document.querySelector('make-an-offer')?.dataset.sku || document.querySelector('.add-to-cart')?.dataset.sku || '' });
    const pill = el(`<div class="aa-pill" role="region" aria-label="Art Advisor">
      <button class="aa-pill-back" type="button"><span class="aa-pill-icon" aria-hidden="true">${ICON_SPARKLE}</span>${COPY.pill(count)}</button>
      <button class="aa-pill-close" type="button" aria-label="${COPY.endConsult}" title="${COPY.endConsult}">×</button>
    </div>`);
    pill.querySelector('.aa-pill-back').addEventListener('click', () => {
      track('advisor_return_click', {});
      // window: reopen it, the advisor restores the conversation it saved for the session
      if (OPEN_MODE === 'window') { pill.remove(); openAdvisorWindow(ADVISOR + '?lang=' + LOCALE + '&return=' + encodeURIComponent(location.pathname + location.search)); return; }
      // full page: the advisor page is still in the browser's history
      if (history.length > depth) history.go(-depth);
      else location.href = ADVISOR + '?lang=' + LOCALE;
    });
    pill.querySelector('.aa-pill-close').addEventListener('click', () => {
      if (advisorWindow) closeAdvisorWindow();   // ends a minimised consultation too
      ss.set('aa:active', '0'); pill.remove();
    });
    document.body.append(pill);
    // the pill never covers the buy box: it steps aside while price and add-to-cart are on screen
    whenPresent('.pdp-actions', () => {
      const buy = document.querySelector('.pdp-actions');
      new IntersectionObserver(entries => {
        pill.classList.toggle('aa-pill--away', entries.some(x => x.isIntersecting));
      }).observe(buy);
    });
  }
  // the dock's count follows the advisor while it is minimised (its frame writes aa:count)
  window.addEventListener('storage', e => {
    if (e.key !== 'aa:count') return;
    const back = document.querySelector('.aa-pill-back');
    if (back) back.innerHTML = `<span class="aa-pill-icon" aria-hidden="true">${ICON_SPARKLE}</span>${COPY.pill(parseInt(e.newValue || '0', 10))}`;
  });
  // restored from the back/forward cache: refresh depth and count
  window.addEventListener('pageshow', e => {
    if (!e.persisted) return;
    document.querySelector('.aa-pill')?.remove();
    returnPill();
  });

  // ---- 3.8 sticky --------------------------------------------------------------------
  // The listing bar stays on screen while the visitor scrolls the results. It sticks where production's
  // filter toolbar would (under the sticky header on desktop, the top of the screen on phones), and the
  // toolbar and the filter sidebar move down by its height. Production positions both from
  // --top-offset on desktop, so the wrapper gets that variable raised; the phone toolbar sits at 0.
  let listbarSync = null;
  function stickListbar(bar) {
    const wrap = bar.parentElement;
    // whether it is stuck, from a marker just above it (its own height changes when it compacts)
    const marker = el('<div class="aa-listbar-marker" aria-hidden="true"></div>');
    wrap.insertBefore(marker, bar);
    let line = 0;
    const stuck = () => bar.classList.toggle('aa-listbar--stuck', marker.getBoundingClientRect().bottom < line);
    // production's own stick line, read with this layer's offsets lifted (synchronously, so never painted)
    const place = () => {
      if (!bar.isConnected) return;
      wrap.classList.remove('aa-has-listbar');
      wrap.style.removeProperty('--top-offset');
      const toolbar = wrap.querySelector('.filters-toolbar');
      line = toolbar ? parseFloat(getComputedStyle(toolbar).top) || 0 : 0;
      const viaVariable = line > 0;   // desktop: production's --top-offset; phones: a plain 0
      wrap.classList.add('aa-has-listbar');
      wrap.style.setProperty('--aa-listbar-top', line + 'px');
      wrap.style.setProperty('--aa-listbar-h', bar.offsetHeight + 'px');
      if (viaVariable) wrap.style.setProperty('--top-offset', line + bar.offsetHeight + 'px');
      stuck();
    };
    const resize = new ResizeObserver(place);
    resize.observe(bar);
    const header = document.querySelector('site-header');
    if (header) resize.observe(header);
    addEventListener('scroll', stuck, { passive: true });
    addEventListener('resize', place);
    listbarSync = { wrap, marker, resize, place, stuck };
    place();
  }
  function unstickListbar() {
    if (!listbarSync) return;
    const { wrap, marker, resize, place, stuck } = listbarSync;
    resize.disconnect();
    removeEventListener('scroll', stuck);
    removeEventListener('resize', place);
    marker.remove();
    wrap.classList.remove('aa-has-listbar');
    ['--top-offset', '--aa-listbar-top', '--aa-listbar-h'].forEach(v => wrap.style.removeProperty(v));
    listbarSync = null;
  }

  // ---- 3.9 side tab ---------------------------------------------------------------------
  // Not in the concept (added on request, after Westwing): a small sticky square on the right edge of
  // every page that opens the advisor without a question. It steps aside while the window is open and
  // while the dock (3.7) is showing, so there is only ever one way back into a running consultation.
  function sideTab() {
    if (!on.sidetab || document.querySelector('.aa-sidetab')) return;
    const tab = el(`<button class="aa-sidetab" type="button" aria-label="${COPY.sideTab}">
      <span class="aa-sidetab-label" aria-hidden="true">${COPY.sideTab}</span>
      <span class="aa-sidetab-icon" aria-hidden="true">${ICON_SPARKLE}</span>
    </button>`);
    tab.addEventListener('click', () => goToAdvisor('', 'side-tab'));
    document.body.append(tab);
    const sync = () => {
      const dock = document.querySelector('.aa-pill');
      tab.classList.toggle('aa-sidetab--away', !!(advisorWindow?.open || (dock && !dock.classList.contains('aa-pill--away'))));
    };
    // it never covers a small control of the page (a carousel arrow, a button): it moves up or down
    // to the nearest free spot beside it, and tucks away only when there is none; large links such
    // as whole product cards and full-width rows do not count
    const PHONE = matchMedia('(max-width: 759px)');
    const CONTROL = 'a, button, input, select, textarea, label, summary, [role=button], [tabindex]:not([tabindex="-1"])';
    const GAP = 8;   // keep this much clear around a control
    const blocked = shift => {
      // measured where it would rest, not where it is: a tucked tab is off screen, a hovered one wider
      const size = tab.querySelector('.aa-sidetab-icon').offsetWidth;
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight - (document.querySelector('.aa-bar-main')?.offsetHeight || 0);   // above the presenter bar
      const top = (PHONE.matches ? vh - 16 - size : (vh - size) / 2) + shift;
      if (top < 80 || top + size > vh - 16) return true;
      const xs = [vw - size - GAP, vw - size / 2, vw - 2], ys = [top - GAP, top + size / 2, top + size + GAP];
      return xs.some(x => ys.some(y => document.elementsFromPoint(x, y).some(node => {
        if (tab.contains(node) || node.closest('.aa-panel')) return false;
        const control = node.closest(CONTROL);
        if (!control) return false;
        const box = control.getBoundingClientRect();
        // full-width rows (footer links, list items) only lose their empty far end
        return box.width * box.height < 160 * 160 && box.width < vw / 2;
      })));
    };
    // rest first, then the nearest spots (phones only move up from the corner)
    const SHIFTS = [0, 64, -64, 128, -128, 192, -192];
    let pending = false;
    const checkCollision = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        if (tab.classList.contains('aa-sidetab--away')) return;
        const free = SHIFTS.filter(d => !PHONE.matches || d <= 0).find(d => !blocked(d));
        tab.classList.toggle('aa-sidetab--tucked', free === undefined);
        if (free !== undefined) tab.style.setProperty('--aa-tab-shift', free + 'px');
      });
    };
    addEventListener('scroll', checkCollision, { passive: true });
    addEventListener('resize', checkCollision);
    setInterval(checkCollision, 700);   // carousels move without scrolling
    new MutationObserver(sync).observe(document.body, { childList: true, subtree: false, attributes: true, attributeFilter: ['class'] });
    new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    sync();
    checkCollision();
    trackView('side-tab', 'n/a');
  }

  // ---- presenter panel ----------------------------------------------------------------
  // Lucide "sparkles" at the site's 1.5px line weight, marking the Art Advisor bar and row
  const ICON_SPARKLE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>';
  // the walk-through: [number label, short label, entry points it shows, shop path]
  const DEMO_SETS = {
    en: [
      ['Homepage', '3.4 · 3.5 · 3.9', '/en/'],
      ['dratwa', 'search, class A', '/en/search/?q=dratwa'],
      ['blue abstract', 'search, class B · 3.2', '/en/search/?q=blue+abstract'],
      ['Gift …', 'search, class C · 3.3', '/en/search/?q=gift+for+my+mother%2C+she+loves+nature'],
      ['0 hits', 'search, rescue · 3.3', '/en/search/?q=what+goes+with+a+beige+wall'],
      ['Category + filters', '3.2 · 3.8, filters into the chat', '/en/themes/abstract-graphic/?price=from50000-to100000&colors=blue'],
      ['Search + filters', '3.2 · 3.8, filters into the chat', '/en/search/?q=blue+abstract&price=from0-to50000&colors=blue'],
      ['Product page', '3.6', '/en/pictures/luc_dratwa/mountain_view/'],
    ],
    de: [
      ['Homepage', '3.4 · 3.5 · 3.9', '/'],
      ['dratwa', 'search, class A', '/search/?q=dratwa'],
      ['blau abstrakt', 'search, class B · 3.2', '/search/?q=blau+abstrakt'],
      ['Geschenk …', 'search, class C · 3.3', '/search/?q=geschenk+f%C3%BCr+meine+mutter%2C+sie+mag+natur'],
      ['0 hits', 'search, rescue · 3.3', '/search/?q=was+passt+zu+einer+beigen+wand'],
      ['Category + filters', '3.2 · 3.8, filters into the chat', '/themen/abstrakt-graphisch/?price=from50000-to100000&colors=blue'],
      ['Search + filters', '3.2 · 3.8, filters into the chat', '/search/?q=blau+abstrakt&price=from0-to50000&colors=blue'],
      ['Product page', '3.6', '/pictures/luc_dratwa/mountain_view/'],
    ],
  };
  const DEMOS = DEMO_SETS[LOCALE];
  const ICON_SLIDERS = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>';
  // one shop address, whatever the parameter order
  const pageId = (path, search = '') => {
    const params = [...new URLSearchParams(search)].filter(([k]) => k !== 'from').sort((x, y) => (x[0] + x[1] < y[0] + y[1] ? -1 : 1));
    return path + '?' + new URLSearchParams(params);
  };
  let panel = null;
  // presenter bar along the bottom of every page (prototype chrome, not part of the shop)
  function buildPanel() {
    const here = pageId(PAGE.pathname, PAGE.search);
    const step = DEMOS.findIndex(([, , href]) => pageId(...href.split(/(?=\?)/)) === here);
    // a walk-through page switches to its counterpart (category slugs and search words differ by
    // language); any other page just gains or loses /en
    const other = step >= 0 ? DEMO_SETS[LOCALE === 'en' ? 'de' : 'en'][step][2]
      : (LOCALE === 'en' ? (PAGE.pathname.replace(/^\/en/, '') || '/') : '/en' + PAGE.pathname) + PAGE.search;
    const langs = LOCALE === 'en' ? [['EN', '#', true], ['DE', other, false]] : [['EN', other, false], ['DE', '#', true]];
    const chip = (attrs, label) => `<label class="aa-bar-chip"><input ${attrs}><span>${label}</span></label>`;
    panel = el(`<aside class="aa-panel" role="region" aria-label="Prototype controls">
      <div class="aa-panel-body" id="aa-panel-body" hidden>
        <section><p class="aa-panel-h">Entry points</p>
          <div class="aa-bar-chips">${ENTRIES.map(([id, num, label]) => chip(`type="checkbox" data-aa-toggle="${id}" ${on[id] ? 'checked' : ''}`, `<b>${num}</b> ${esc(label)}`)).join('')}</div></section>
        <section><p class="aa-panel-h">Advisor opens as</p>
          <div class="aa-bar-chips">${chip(`type="radio" name="aa-open" value="window" ${OPEN_MODE === 'window' ? 'checked' : ''}`, 'Window over the shop')}${chip(`type="radio" name="aa-open" value="page" ${OPEN_MODE === 'page' ? 'checked' : ''}`, 'Full page')}</div>
          <p class="aa-panel-h">Empty search field (3.1)</p>
          <div class="aa-bar-chips">${chip(`type="radio" name="aa-empty" value="bar" ${EMPTY_VARIANT === 'bar' ? 'checked' : ''}`, 'Bar above the tiles')}${chip(`type="radio" name="aa-empty" value="tile" ${EMPTY_VARIANT === 'tile' ? 'checked' : ''}`, 'Tile in “Most wanted”')}</div>
          <p class="aa-panel-h"><a class="aa-bar-link" href="${PAGE.pathname + (PAGE.search ? PAGE.search + '&' : '?')}pristine">This page without the layer →</a></p></section>
        <section><p class="aa-panel-h">Query class</p>
          <p class="aa-panel-class" data-aa-class>Type in the search field or open a search.</p></section>
        <section><p class="aa-panel-h">Events <button type="button" class="aa-panel-clear">clear</button></p>
          <ol class="aa-panel-events" data-aa-events></ol></section>
      </div>
      <div class="aa-bar-main">
        <span class="aa-bar-title">Art Advisor</span>
        <nav class="aa-bar-pages" aria-label="Walk-through">${DEMOS.map(([label, shows, href], i) =>
          `<a href="${href}" title="${esc(label + ': ' + shows)}" ${i === step ? 'aria-current="page"' : ''}><b>${i + 1}</b><span>${esc(label)}</span></a>`).join('')}</nav>
        <button type="button" class="aa-panel-toggle" aria-expanded="false" aria-controls="aa-panel-body">${ICON_SLIDERS}<span>Entry points</span></button>
        <div class="aa-bar-lang" role="group" aria-label="Shop language">${langs.map(([l, href, current]) => `<a href="${href}" ${current ? 'aria-current="true"' : ''}>${l}</a>`).join('')}</div>
      </div>
    </aside>`);
    const toggle = panel.querySelector('.aa-panel-toggle');
    const body = panel.querySelector('.aa-panel-body');
    const setOpen = open => { body.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); ls.set('aa-panel-open', open); };
    setOpen(ls.get('aa-panel-open', false));
    toggle.addEventListener('click', () => setOpen(body.hidden));
    panel.querySelector('.aa-bar-lang [aria-current]').addEventListener('click', e => e.preventDefault());
    panel.querySelectorAll('[data-aa-toggle]').forEach(cb => cb.addEventListener('change', () => {
      on[cb.dataset.aaToggle] = cb.checked;
      ls.set(STORE, on);
      location.reload();
    }));
    panel.querySelectorAll('input[name=aa-open]').forEach(r => r.addEventListener('change', () => { ls.set('aa-open-mode', r.value); location.reload(); }));
    panel.querySelectorAll('input[name=aa-empty]').forEach(r => r.addEventListener('change', () => { ls.set('aa-empty-variant', r.value); location.reload(); }));
    panel.querySelector('.aa-panel-clear').addEventListener('click', () => { events.length = 0; ls.set('aa-events', events); renderEventLog(); });
    document.documentElement.classList.add('aa-has-bar');
    document.body.append(panel);
    panel.querySelector('[aria-current="page"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
    renderEventLog();
    renderPanelClass();
  }
  function renderPanelClass() {
    const out = panel?.querySelector('[data-aa-class]');
    if (!out || !currentClass) return;
    const names = { A: 'A · navigational, no offer', B: 'B · descriptive, quiet offer', C: 'C · conversational, Advisor first', empty: 'empty field' };
    out.innerHTML = currentQuery ? `<strong>${esc(names[currentClass.cls] || currentClass.cls)}</strong><br>${quoted(currentQuery)}<br><span>${esc(currentClass.signals.join(' · ') || 'no signals')}</span>` : esc(names.empty);
  }
  function renderEventLog() {
    const list = panel?.querySelector('[data-aa-events]');
    if (!list) return;
    list.innerHTML = events.slice(0, 8).map(ev => `<li><span>${esc(ev.t)}</span> <strong>${esc(ev.name)}</strong> ${esc(Object.entries(ev.params).map(([k, v]) => k + '=' + v).join(' '))}</li>`).join('') || '<li>No events yet.</li>';
  }

  // production renders some blocks (the PDP buy box, the finder) after load: wait for them
  function whenPresent(selector, fn, timeout = 10000) {
    if (document.querySelector(selector)) return fn();
    const obs = new MutationObserver(() => { if (document.querySelector(selector)) { obs.disconnect(); fn(); } });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => obs.disconnect(), timeout);
  }

  // ---- start ---------------------------------------------------------------------
  function start() {
    buildPanel();
    overlayDesktop();
    overlayMobile();
    searchTile();
    // search pages always; category pages once their client-rendered grid exists
    if (isSearchPage) watchResults(); else whenPresent('.search-results', watchResults);
    whenPresent('site-header nav > details', navCard);
    whenPresent('edition-finder', homepageFinder);
    whenPresent('.pdp-actions .button-container', productPage);
    returnPill();
    sideTab();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
