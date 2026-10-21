/* PROTO-2026-066 · arm 3 "window". Markup is server-rendered in the finder's slot (_scripts/arms.py).
   Reworked from PROTO-2026-063 (prototype/artfinder-window/layer/afs.js): same five views and ten
   presets, but in today's finder position instead of beneath the hero, and the Artfinder results
   page stays production in every arm so the test isolates the homepage module.
   Each answer is a preset of existing Artfinder params only (topic, categories_pairs, dimension). */
(() => {
  'use strict';
  const hf = window.hf;
  if (!hf || hf.arm !== 'window') {
    return;
  }
  const STORE_KEY = 'hf:view';
  const PHONE = matchMedia('(max-width: 759px)');

  /* "Mehr davon" continues the view, "Das Gegenteil" answers it. Counts on 2026-10-14 in brackets. */
  const VIEWS = {
    city: {
      more: { params: [['topic', 'Architektur / City']], line: 'Mehr Stadt: Architektur, Straßen, Skylines.' }, // 460
      less: { params: [['topic', 'Wasser'], ['categories_pairs[calm_intense]', '-5']], line: 'Das Gegenteil von Dächern: ruhiges Wasser.' } // 276
    },
    water: {
      more: { params: [['topic', 'Wasser']], line: 'Mehr Wasser: Meer, Seen und Küsten.' }, // 288
      less: { params: [['topic', 'Architektur / City'], ['categories_pairs[calm_intense]', '5']], line: 'Das Gegenteil von Wasser: lebendige Städte.' } // 432
    },
    hills: {
      more: { params: [['topic', 'Landschaft']], line: 'Mehr Weite: Landschaften und Berge.' }, // 340
      less: { params: [['topic', 'Architektur / City'], ['categories_pairs[muted_bold]', '5']], line: 'Das Gegenteil von Bergen und Feldern: Stadt, Licht und Farbe.' }
    },
    green: {
      more: { params: [['topic', 'Blumen']], line: 'Mehr Grün: Blüten und Gärten.' }, // 299
      less: { params: [['topic', 'Architektur / City'], ['categories_pairs[minimalist_detailed]', '-5']], line: 'Das Gegenteil von Grün: klare Linien, Beton und Glas.' } // 878
    },
    wall: {
      more: { params: [['topic', 'Abstrakt / Graphisch'], ['categories_pairs[minimalist_detailed]', '-5']], line: 'Mehr Struktur: grafische, reduzierte Werke.' }, // 151
      less: { params: [['topic', 'Landschaft'], ['dimension', 'panorama']], line: 'Das Gegenteil einer Hauswand: Panoramen mit Horizont.' } // 55
    }
  };
  const HINT = 'Wähl eine Aussicht. Die passenden Editionen erscheinen hier.';

  const paramsFor = state => new URLSearchParams(state.view ? VIEWS[state.view][state.dir].params : []);
  const urlFor = state => {
    const qs = paramsFor(state).toString();
    return '/artfinder/' + (qs ? '?' + qs : '');
  };

  hf.whenVueReady(() => {
    const bar = document.querySelector('.hfx');
    if (!bar) {
      return;
    }
    const line = bar.querySelector('.hfx__line');
    const peek = bar.querySelector('.hfx__peek');
    const cta = bar.querySelector('[data-hfx-cta]');
    const views = [...bar.querySelectorAll('.hfx-view')];
    const dirButtons = [...bar.querySelectorAll('.hfx__dir [role="radio"]')];
    peek.classList.add('hf-peek');
    // the shared view height divides the row by the sum of the five ratios
    const ratioSum = views.reduce((sum, v) => sum + Number(v.querySelector('.hfx-view__art').style.getPropertyValue('--r')), 0);
    bar.querySelector('.hfx__views').style.setProperty('--hfx-ratio-sum', ratioSum.toFixed(3));

    let state = { view: null, dir: 'more' };
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
      if (saved && VIEWS[saved.view]) {
        state = { view: saved.view, dir: saved.dir === 'less' ? 'less' : 'more' };
      }
    } catch {
      /* start empty */
    }
    if (hf.tokens.includes('clear')) {
      state = { view: null, dir: 'more' };
    }
    const preset = hf.tokens.find(t => t.startsWith('view-'));
    if (preset && VIEWS[preset.slice(5)]) {
      state.view = preset.slice(5);
    }
    if (hf.tokens.includes('less')) {
      state.dir = 'less';
    }
    if (hf.tokens.includes('error')) {
      sessionStorage.setItem('hf:fail-next', '1');
    }
    const label = () => (state.view ? `${state.view} | ${state.dir}` : '(none)');

    let ticket = 0;
    async function loadPeek() {
      const mine = ++ticket;
      line.querySelector('.hfx__count')?.remove();
      if (!state.view) {
        peek.innerHTML = '';
        return;
      }
      hf.ghosts(peek, PHONE.matches ? 3 : 4);
      peek.setAttribute('aria-busy', 'true');
      if (hf.tokens.includes('loading')) {
        return;
      }
      try {
        const { works, count } = await hf.fetchWorks(paramsFor(state));
        if (mine !== ticket) {
          return;
        }
        hf.renderWorks(peek, works.slice(0, PHONE.matches ? 3 : 4));
        if (count) {
          line.insertAdjacentHTML('beforeend', ` <span class="hfx__count">${count.toLocaleString('de-DE')} Werke</span>`);
        }
      } catch {
        if (mine === ticket) {
          peek.innerHTML = '';
        }
      } finally {
        if (mine === ticket) {
          peek.removeAttribute('aria-busy');
        }
      }
    }

    function render() {
      views.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === state.view)));
      dirButtons.forEach(b => {
        const on = b.dataset.dir === state.dir;
        b.setAttribute('aria-checked', String(on));
        b.tabIndex = on ? 0 : -1;
      });
      line.textContent = state.view ? VIEWS[state.view][state.dir].line : HINT;
      line.classList.toggle('is-hint', !state.view);
      cta.href = urlFor(state);
      try {
        sessionStorage.setItem(STORE_KEY, JSON.stringify(state));
      } catch {
        /* private mode */
      }
      loadPeek();
    }

    bar.querySelector('.hfx__views').addEventListener('click', e => {
      const button = e.target.closest('.hfx-view');
      if (!button) {
        return;
      }
      const previous = state.view;
      state = { ...state, view: previous === button.dataset.view ? null : button.dataset.view };
      render();
      hf.track(state.view ? 'edition_finder_select' : 'edition_finder_clear', {
        finder_row: 'view',
        finder_value: state.view ?? '(none)',
        finder_previous: previous ?? '(none)',
        finder_direction: state.dir
      });
    });

    const setDir = dir => {
      if (dir === state.dir) {
        return;
      }
      state = { ...state, dir };
      render();
      hf.track('edition_finder_select', { finder_row: 'direction', finder_value: dir, finder_view: state.view ?? '(none)' });
    };
    dirButtons.forEach(b => b.addEventListener('click', () => setDir(b.dataset.dir)));
    bar.querySelector('.hfx__dir').addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        return;
      }
      e.preventDefault();
      setDir(state.dir === 'more' ? 'less' : 'more');
      dirButtons.find(b => b.dataset.dir === state.dir).focus();
    });

    peek.addEventListener('click', e => {
      const work = e.target.closest('.hf-work');
      if (work) {
        hf.track('edition_finder_peek_click', { position: Number(work.dataset.position), item_url: work.getAttribute('href'), finder_selection: label() });
      }
    });

    cta.addEventListener('click', e => {
      if (cta.getAttribute('aria-busy') === 'true') {
        e.preventDefault();
        return;
      }
      hf.track('edition_finder_cta_click', { finder_selection: label() });
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }
      cta.setAttribute('aria-busy', 'true');
    });
    window.addEventListener('pageshow', e => {
      if (e.persisted) {
        cta.removeAttribute('aria-busy');
      }
    });

    render();
  });
})();
