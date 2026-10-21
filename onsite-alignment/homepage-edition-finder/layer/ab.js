/* ═══ PROTO HEADER ═══
  ID:          PROTO-2026-066
  Hypothesis:  For lumas.de (DE) homepage visitors, a finder that shows its answers as real editions and
               previews matching works as the visitor chooses (arm 2, or the window question, arm 3) raises
               the share of homepage sessions that open the Artfinder results and reach a product page,
               because it reads as a look at the collection rather than a filter form. Moving the
               unchanged finder up (arm 1) raises the same share because more sessions reach it.
               Arm 1 isolates position (finder + trust block moved to directly below the campaign tiles);
               arms 2 and 3 isolate the module and stay in today's position.
  Prior:       memory notes, no formal ledger. GA4 DE 24 Sep–21 Oct 2026: 94,778 homepage-landing
               sessions (70,563 mobile); sessions with edition_finder_cta_click 3,631 (4.3% of mobile,
               2.3% of desktop HP-landing sessions). Earlier: 56% of mobile HP sessions never pass 10%
               scroll; intent channels carry 88% of HP add-to-carts, so arm 1 (Bestseller pushed down)
               needs an intent-ATC guardrail.
  Goals:       primary  finder click-through: sessions with edition_finder_cta_click or
                        edition_finder_peek_click / homepage sessions (the CTA event exists in GA4 today)
               secondary homepage→PDP reach (session-scoped) · edition_finder_view · artfinder results views
               guardrails ATC (custom goal on the add_to_cart dataLayer push; ~25% MDE, so non-inferiority
               only) · Bestseller carousel clicks (arm 1) · intent-channel ATC · purchase CVR
  Status:      exploration
═══ */
(() => {
  'use strict';
  const arm = window.HF_ARM || 'control';
  const UI = { control: 'chips', move: 'chips', warm: 'warm', window: 'window' }[arm] || 'chips';
  const POSITION = arm === 'move' ? 'below_campaign_tiles' : 'below_trustpilot';
  const query = new URLSearchParams(location.search);
  const tokens = (query.get('hf') || '').split(',').filter(Boolean);
  const OPEN_ENDED_TO = 2000000; // same constant as edition-finder/url.js

  /* ── Tracking stubs: each call site is named after the GA4 event it becomes. In production
     these go through tracking-core.js emit(); edition_finder_select and edition_finder_cta_click
     already exist in tracking/events.js and only gain finder_ui + finder_position. ── */
  function track(event, data = {}) {
    const payload = { event, section: 'Edition Finder', finder_ui: UI, finder_position: POSITION, ab_arm: arm, ...data };
    window.hfEvents = window.hfEvents || [];
    window.hfEvents.push({ ...payload, at: new Date().toISOString() });
    console.info('%c[hf track]', 'color:#5a5752;font-weight:bold', payload);
    window.dispatchEvent(new CustomEvent('hf:track', { detail: payload }));
  }

  /* production mounts Vue first; anything we add to the DOM waits for it so it is not re-rendered away */
  function whenVueReady(fn) {
    const started = Date.now();
    (function wait() {
      if (window.vueInstance) {
        window.vueInstance.$nextTick(() => setTimeout(fn, 0));
      } else if (Date.now() - started < 10000) {
        setTimeout(wait, 50);
      } else {
        fn();
      }
    })();
  }

  const esc = s =>
    String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const image = sku => `${window.HF_IMG_BASE || '/img_lumas_com/'}showimg_${sku}_search.jpg`;

  /* ── Live preview ("peek") shared by arms 2 and 3. A justified row: every work keeps its
     true ratio and the row's height follows from the column width, so nothing is cropped.
     Works far outside 0.6–2.2 are skipped: in a row of four they would shrink the others. ── */
  async function fetchWorks(params, signal) {
    if (sessionStorage.getItem('hf:fail-next') === '1') {
      sessionStorage.removeItem('hf:fail-next');
      await new Promise(r => setTimeout(r, 700));
      throw new Error('review: forced failure');
    }
    const p = new URLSearchParams(params);
    p.set('is_artfinder', '1');
    const res = await fetch(`/search/?${p}`, {
      signal,
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
    });
    if (!res.ok) {
      throw new Error(`search ${res.status}`);
    }
    const data = await res.json();
    const all = (data.products || []).filter(w => w.image_sku && w.ratio > 0);
    const even = all.filter(w => w.ratio >= 0.6 && w.ratio <= 2.2);
    // a panorama answer ("Das Gegenteil einer Hauswand") has almost no even works: show three as they are
    return { works: even.length >= 3 ? even : all.slice(0, 3), count: Number(data.numFound) || 0 };
  }

  function ghosts(container, n) {
    container.innerHTML = Array.from({ length: n }, (_, i) =>
      `<span class="hf-ghost" style="--r:${[1.33, 0.8, 1.5, 1][i % 4]}"></span>`).join('');
  }

  function renderWorks(container, works) {
    container.innerHTML = works
      .map((w, i) => `<a class="hf-work" href="${esc(w.url)}" style="--r:${w.ratio};--i:${i}" data-position="${i + 1}"
          title="${esc(w.abstract_name)}, ${esc(w.artist)}">
          <img src="${image(w.image_sku)}" alt="${esc(w.abstract_name)} von ${esc(w.artist)}" decoding="async"></a>`)
      .join('');
    container.querySelectorAll('img').forEach(img => {
      const show = () => img.closest('.hf-work').classList.add('is-in');
      if (img.complete) {
        show();
      } else {
        img.addEventListener('load', show, { once: true });
        img.addEventListener('error', show, { once: true });
      }
    });
  }

  /* price/topic/categories_pairs exactly as frontend/themes/white/assets/js/components/edition-finder/url.js */
  function finderParams(root) {
    const params = new URLSearchParams();
    root.querySelectorAll('.chip[aria-pressed="true"]').forEach(chip => {
      const row = chip.closest('[data-row]')?.dataset.row;
      if (row === 'budget') {
        params.set('price', `from${chip.dataset.from}-to${chip.dataset.to ?? OPEN_ENDED_TO}`);
      } else if (row === 'subject' && chip.dataset.topic) {
        params.set('topic', chip.dataset.topic);
      } else if (row === 'mood' && chip.dataset.axes) {
        Object.entries(JSON.parse(chip.dataset.axes)).forEach(([axis, v]) => params.set(`categories_pairs[${axis}]`, String(v)));
      }
    });
    return params;
  }

  const selectionLabel = root =>
    ['budget', 'subject', 'mood']
      .map(row => root.querySelector(`[data-row="${row}"] .chip[aria-pressed="true"]`)?.dataset.chip ?? '(none)')
      .join(' | ');

  window.hf = { arm, ui: UI, position: POSITION, tokens, track, whenVueReady, esc, image, fetchWorks, ghosts, renderWorks, finderParams, selectionLabel };

  /* ── Arm-independent instrumentation: the module came into view, and (for the chip-based
     finders, control/move/warm) what was chosen and the CTA click. ── */
  whenVueReady(() => {
    const module = document.querySelector('edition-finder, .hfx');
    if (!module) {
      return;
    }
    // ABLYFT-GOAL: homepage_view_edition-finder [UNBOUND, bind from the 16-goal library]
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        if (entries.some(en => en.isIntersecting)) {
          track('edition_finder_view', { page_y: Math.round(module.getBoundingClientRect().top + scrollY) });
          io.disconnect();
        }
      }, { threshold: 0.4 });
      io.observe(module);
    }
    if (module.tagName === 'EDITION-FINDER') {
      module.addEventListener('click', e => {
        const chip = e.target.closest('.chip');
        const cta = e.target.closest('[data-finder-cta]');
        if (cta && cta.getAttribute('aria-disabled') !== 'true') {
          track('edition_finder_cta_click', { finder_selection: selectionLabel(module), finder_cta_label: cta.textContent.trim() });
        }
        if (chip) {
          // production's handler may run before or after this one (upgrade order): read the state after it
          setTimeout(() => {
            track('edition_finder_select', {
              finder_row: chip.closest('[data-row]')?.dataset.row,
              finder_value: chip.getAttribute('aria-pressed') === 'true' ? chip.dataset.chip : '(none)'
            });
          }, 0);
        }
      });
    }
    if (tokens.includes('top')) {
      const y = module.getBoundingClientRect().top + scrollY - Number(query.get('hf_offset') || 140);
      window.scrollTo({ top: y, behavior: 'instant' });
    }
  });
})();
