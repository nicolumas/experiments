/* PROTO-2026-066 · arm 2 "warm". The markup is server-rendered (_scripts/arms.py, a Twig change in
   production) and driven by production's <edition-finder> component unchanged: it toggles the
   answers, fetches the count and writes the CTA. This file adds only the live preview: the first
   matching works, loaded with the same /search/?…&is_artfinder=1 request the component makes. */
(() => {
  'use strict';
  const hf = window.hf;
  if (!hf || hf.arm !== 'warm') {
    return;
  }
  const PHONE = matchMedia('(max-width: 759px)');
  const ROWS = ['subject', 'mood', 'budget'];
  const DEBOUNCE_MS = 300; // the component's own debounce

  hf.whenVueReady(async () => {
    const finder = document.querySelector('edition-finder.hfw');
    if (!finder) {
      return;
    }
    await Promise.race([customElements.whenDefined('edition-finder'), new Promise(r => setTimeout(r, 5000))]);

    const peek = finder.querySelector('.hfw__peek');
    const match = finder.querySelector('.hfw__match');
    peek.classList.add('hf-peek');
    let ticket = 0;
    let timer = null;
    let controller = null;

    const picks = () =>
      ROWS.map(row => finder.querySelector(`[data-row="${row}"] .chip[aria-pressed="true"]`)).filter(Boolean);
    const labelOf = chip => (chip.querySelector('.hfw-art__label') || chip).textContent.trim();

    function say(state) {
      const chosen = picks();
      if (state === 'empty') {
        match.innerHTML = 'Für diese Kombination gibt es gerade keine Werke. <button type="button" class="hfw__reset">Auswahl zurücksetzen</button>';
        return;
      }
      if (state === 'error') {
        match.textContent = 'Die Vorschau lädt gerade nicht. Deine Auswahl führt trotzdem zu den passenden Werken.';
        return;
      }
      match.innerHTML = chosen.length
        ? 'Passend zu ' + chosen.map(c => `<span class="hfw__match-val">${hf.esc(labelOf(c))}</span>`).join(', ')
        : 'Eine erste Auswahl aus der Sammlung';
    }

    async function refresh() {
      const mine = ++ticket;
      controller?.abort();
      controller = new AbortController();
      say('ok');
      hf.ghosts(peek, PHONE.matches ? 3 : 4);
      peek.setAttribute('aria-busy', 'true');
      if (hf.tokens.includes('loading')) {
        return; // review: hold the loading state
      }
      try {
        const { works, count } = await hf.fetchWorks(hf.finderParams(finder), controller.signal);
        if (mine !== ticket) {
          return;
        }
        if (!count) {
          peek.innerHTML = '';
          say('empty');
        } else {
          hf.renderWorks(peek, works.slice(0, PHONE.matches ? 3 : 4));
        }
      } catch (e) {
        if (e.name === 'AbortError' || mine !== ticket) {
          return;
        }
        peek.innerHTML = '';
        say('error');
      } finally {
        if (mine === ticket) {
          peek.removeAttribute('aria-busy');
        }
      }
    }

    finder.addEventListener('click', e => {
      if (e.target.closest('.hfw__reset')) {
        picks().forEach(chip => chip.click());
        hf.track('edition_finder_reset', {});
        return;
      }
      const work = e.target.closest('.hf-work');
      if (work) {
        hf.track('edition_finder_peek_click', {
          position: Number(work.dataset.position),
          item_url: work.getAttribute('href'),
          finder_selection: hf.selectionLabel(finder)
        });
        return;
      }
      if (e.target.closest('.chip')) {
        clearTimeout(timer);
        timer = setTimeout(refresh, DEBOUNCE_MS);
      }
    });
    PHONE.addEventListener('change', refresh);

    /* review presets: ?hf=subject-landscape,mood-quiet,budget-under-1k (+ loading / error) */
    if (hf.tokens.includes('error')) {
      sessionStorage.setItem('hf:fail-next', '1');
    }
    hf.tokens.forEach(t => {
      const [row, ...rest] = t.split('-');
      if (ROWS.includes(row)) {
        finder.querySelector(`[data-row="${row}"] .chip[data-chip="${rest.join('-')}"]`)?.click();
      }
    });
    clearTimeout(timer);
    refresh();
  });
})();
