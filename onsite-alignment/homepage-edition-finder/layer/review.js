/* Review dock for PROTO-2026-066. Not part of any arm: it switches arms, jumps to the states,
   pins implementation notes and logs the tracking stubs. ?review=0 hides it; `v` cycles arms. */
(() => {
  'use strict';
  const arm = window.HF_ARM || 'control';
  const query = new URLSearchParams(location.search);
  if (query.get('review') === '0') {
    document.documentElement.classList.add('rv-hidden');
  }
  // published copy: one static page per arm (window.HF_PAGES, set by _publish.py)
  const PAGES = window.HF_PAGES || null;
  const isHome = PAGES ? true : location.pathname === '/';

  const ARMS = [
    ['control', 'Control'],
    ['move', '1 · Weiter oben'],
    ['warm', '2 · Neu gestaltet'],
    ['window', '3 · Fenster']
  ];
  const STATES = {
    control: [['Finder', '/?hf=top']],
    move: [['Finder', '/?hf=top'], ['Seitenanfang', '/']],
    warm: [
      ['Start', '/?hf=top'],
      ['Auswahl', '/?hf=top,subject-landscape,mood-quiet,budget-under-1k'],
      ['Keine Werke', '/?hf=top,subject-still-life,mood-bold,budget-under-250'],
      ['Lädt', '/?hf=top,subject-architecture,loading'],
      ['Fehler', '/?hf=top,subject-portrait,error']
    ],
    window: [
      ['Start', '/?hf=top,clear'],
      ['Aussicht', '/?hf=top,view-water'],
      ['Das Gegenteil', '/?hf=top,view-city,less'],
      ['Panorama', '/?hf=top,view-wall,less'],
      ['Lädt', '/?hf=top,view-green,loading'],
      ['Fehler', '/?hf=top,view-hills,error']
    ]
  };
  const NOTES = {
    control: [
      ['edition-finder', 'Control', 'Production as captured on 21 Oct 2026: Bestseller, "Bekannt aus", Trustpilot, then the finder. Budget is the first question.']
    ],
    move: [
      ['[data-section="campaign_tiles"]', 'Anchor', 'The block now follows the three campaign tiles directly. In production this is a CMS reorder: no new markup, no new CSS.'],
      ['.bg-raised', 'Trust block moves too', 'My call: "Bekannt aus" sits directly above Trustpilot and was decided as one composition, so the two move together. Split them only if Brand wants the press band to stay.'],
      ['edition-finder', 'Finder unchanged', 'Same module, same copy. The Bestseller carousel follows it; guardrail on Bestseller clicks and intent-channel add-to-cart.']
    ],
    warm: [
      ['.hfw__title', 'Same component, new template', 'Still <edition-finder>: production\'s component toggles the answers, fetches the count and writes the CTA unchanged. Only the Twig markup and CSS change, plus the preview.'],
      ['[data-row="subject"]', 'Answers are editions', 'Each answer is pictured by the edition that ranks first for it in the live Artfinder, at its true ratio, never cropped. Chosen answers lift and underline; others are never faded (s06).'],
      ['[data-row="budget"]', 'Budget last', 'Same six price bands and params, worded "bis € 1.000" per the Oct 2026 price format, asked after the art.'],
      ['.hfw__answer', 'Live preview', 'The first matching works load with the same /search/?…&is_artfinder=1 request the component makes for the count. Each links to its product page.'],
      ['.hfw__cta', 'CTA', 'Production\'s count label ("2.486 Werke anzeigen"), at its own width on phones.']
    ],
    window: [
      ['.hfx__q', 'In today\'s slot', 'Replaces the finder where it sits now, so the test isolates the module from position. The lede opens with the approved brand line "Kunst ist ein Fenster zur Welt." (s14).'],
      ['.hfx__views', 'Five views', 'Real editions at their true ratio sharing one height. The other views stay at full strength when one is chosen (s06: no dimming of artworks).'],
      ['.hfx__dir', 'Mehr davon / Das Gegenteil', 'Radiogroup, arrow keys switch. Every combination is a preset of existing Artfinder params (topic, categories_pairs, dimension).'],
      ['.hfx__cta', 'Results page unchanged', 'Lands on the production /artfinder/ results in every arm. The PROTO-2026-063 results chips are out of this test.']
    ]
  };

  const remember = (k, v) => {
    try {
      if (v === undefined) {
        return sessionStorage.getItem(k);
      }
      sessionStorage.setItem(k, v);
    } catch {
      return null;
    }
    return v;
  };
  const withArm = (href, v) => {
    const u = new URL(href, location.origin);
    if (PAGES) {
      u.searchParams.delete('v');
      return PAGES[v] + u.search;
    }
    u.searchParams.set('v', v);
    return u.pathname + u.search;
  };
  const here = (PAGES ? '/' : location.pathname) + location.search;
  const btn = (label, href, current) =>
    `<a class="rv__btn" href="${href}"${current ? ' aria-current="page"' : ''}>${label}</a>`;

  const dock = document.createElement('aside');
  dock.className = 'rv';
  dock.setAttribute('aria-label', 'Prototype review controls');
  dock.dataset.collapsed = remember('rv:collapsed') ?? (innerWidth < 760 ? 'true' : 'false');
  const armLabel = ARMS.find(([id]) => id === arm)?.[1] ?? arm;
  dock.innerHTML = `
    <div class="rv__head">
      <span class="rv__id">PROTO-2026-066 <small>${armLabel}</small></span>
      <button type="button" class="rv__toggle" aria-label="Collapse or expand">≡</button>
    </div>
    <div class="rv__body">
      <div class="rv__group">
        <p class="rv__label">Arm (key: v)</p>
        <div class="rv__row">${ARMS.map(([id, label]) => btn(label, withArm(isHome ? here : '/', id), id === arm)).join('')}</div>
      </div>
      <div class="rv__group">
        <p class="rv__label">States</p>
        <div class="rv__row">${(STATES[arm] || []).map(([t, href]) => btn(t, withArm(href, arm), false)).join('')}
          <a class="rv__btn" href="${PAGES ? 'index.html' : '/board/'}"${PAGES ? '' : ' target="_blank" rel="noopener"'}>Board${PAGES ? '' : ' ↗'}</a></div>
      </div>
      <div class="rv__group">
        <label class="rv__check"><input type="checkbox" data-notes> Show implementation notes</label>
      </div>
      <div class="rv__group">
        <p class="rv__label">Tracking (stubs, newest first)</p>
        <ul class="rv__log"></ul>
        <p class="rv__empty">No events yet.</p>
      </div>
    </div>`;
  document.body.appendChild(dock);

  dock.querySelector('.rv__toggle').addEventListener('click', () => {
    dock.dataset.collapsed = dock.dataset.collapsed === 'true' ? 'false' : 'true';
    remember('rv:collapsed', dock.dataset.collapsed);
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'v' || e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input, textarea, select, [contenteditable]')) {
      return;
    }
    const i = ARMS.findIndex(([id]) => id === arm);
    location.href = withArm(isHome ? here : '/', ARMS[(i + 1) % ARMS.length][0]);
  });

  /* tracking log */
  const log = dock.querySelector('.rv__log');
  const empty = dock.querySelector('.rv__empty');
  const show = payload => {
    const { event, ...rest } = payload;
    const li = document.createElement('li');
    li.innerHTML = '<b></b> <span></span>';
    li.querySelector('b').textContent = event;
    li.querySelector('span').textContent = Object.entries(rest)
      .filter(([k]) => !['section', 'at', 'ab_arm'].includes(k))
      .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(' · ');
    log.prepend(li);
    empty.hidden = true;
    while (log.children.length > 30) {
      log.lastElementChild.remove();
    }
  };
  (window.hfEvents || []).forEach(show);
  window.addEventListener('hf:track', e => show(e.detail));

  /* notes */
  const notesBox = dock.querySelector('[data-notes]');
  let pins = [];
  let timer = null;
  const clearPins = () => {
    pins.forEach(p => p.remove());
    pins = [];
    document.querySelectorAll('.rv-card').forEach(c => c.remove());
  };
  function drawPins() {
    clearPins();
    (isHome ? NOTES[arm] || [] : []).forEach(([selector, title, text], i) => {
      const el = [...document.querySelectorAll(selector)].find(n => n.getClientRects().length);
      if (!el) {
        return;
      }
      const box = el.getBoundingClientRect();
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'rv-pin';
      pin.textContent = String(i + 1);
      pin.setAttribute('aria-label', `Note ${i + 1}: ${title}`);
      pin.style.left = `${Math.max(4, box.left + scrollX - 10)}px`;
      pin.style.top = `${Math.max(4, box.top + scrollY - 10)}px`;
      pin.addEventListener('click', ev => {
        ev.stopPropagation();
        document.querySelectorAll('.rv-card').forEach(c => c.remove());
        const card = document.createElement('div');
        card.className = 'rv-card';
        card.innerHTML = '<strong></strong><p></p>';
        card.querySelector('strong').textContent = `${i + 1}. ${title}`;
        card.querySelector('p').textContent = text;
        const left = Math.min(box.left + scrollX + 18, scrollX + document.documentElement.clientWidth - 336);
        card.style.left = `${Math.max(scrollX + 8, left)}px`;
        card.style.top = `${box.top + scrollY + 18}px`;
        document.body.appendChild(card);
      });
      document.body.appendChild(pin);
      pins.push(pin);
    });
  }
  const setNotes = on => {
    remember('rv:notes', on ? '1' : '0');
    clearInterval(timer);
    if (on) {
      drawPins();
      timer = setInterval(() => {
        if (!document.querySelector('.rv-card')) {
          drawPins();
        }
      }, 1200);
    } else {
      clearPins();
    }
  };
  notesBox.checked = remember('rv:notes') === '1' || query.get('notes') === '1';
  notesBox.addEventListener('change', () => setNotes(notesBox.checked));
  document.addEventListener('click', e => {
    if (!e.target.closest('.rv-card, .rv-pin')) {
      document.querySelectorAll('.rv-card').forEach(c => c.remove());
    }
  });
  if (notesBox.checked) {
    setTimeout(() => setNotes(true), 900);
  }
})();
