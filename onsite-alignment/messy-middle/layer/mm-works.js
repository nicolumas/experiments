/* Idea 1b: Your works, everywhere.
 * PROTO HEADER
 *   ID:          PROTO-2026-MM1 (with mm-return.js)
 *   Hypothesis:  [ASSUMPTION] If every page carries a way back to the works a visitor viewed (a header entry with a
 *                count, and on listings a slim strip above the grid), returning visitors who land on a listing re-find
 *                an earlier work more often than today's 15%, because coming back for a seen work is 51% of revenue.
 *   Prior:       returning sessions 8-24 Nov 2026: listing landings 28% of returning visits, 15% re-find.
 *   Goals:       primary ATC · secondary works_open, works_click (re-find) [UNBOUND]
 *   Variants:    control = ?mm=none | header entry + listing strip + panel (this)
 *   Status:      exploration
 *
 * Production already writes a last-seen cookie (1 year, 20 works) on every product page and has a /lastseen/
 * page nobody links to; this layer stands in for both with the visitor's remembered configurations.
 * A work opened from here arrives in the size and frame the visitor chose (?mm-restore), without a note.
 */
(function () {
  const B = window.MM;
  if (!B || !B.on('works')) return;

  const CLOCK = '<svg style="max-width: var(--icon-max-size); max-height: var(--icon-max-size)" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M8 .9a7.1 7.1 0 1 1 0 14.2A7.1 7.1 0 0 1 8 .9zm0 .84a6.26 6.26 0 1 0 0 12.52A6.26 6.26 0 0 0 8 1.74zm-.42 2.3h.84v4.1l2.86 1.7-.43.72-3.27-1.95z" fill="currentColor"/></svg>';
  let panel = null;

  const list = () => B.recent().filter(x => x.url !== B.path()).slice(0, 8);

  function priceHtml(c) {
    return c.old
      ? `<span class="mm-works-price is-campaign"><strong>${B.euro(c.price)}</strong> <s>${B.euro(c.old)}</s></span>`
      : `<span class="mm-works-price"><strong>${B.euro(c.price)}</strong></span>`;
  }

  function itemHtml(c, i) {
    return `<li class="mm-works-item">
      <a class="mm-works-img" href="${B.esc(B.restoreUrl(c))}" data-mm-pos="${i}"><img src="${B.esc(B.asset(c.thumb || c.image))}" alt="" loading="lazy"></a>
      <div class="mm-works-text">
        <a class="mm-works-title" href="${B.esc(B.restoreUrl(c))}" data-mm-pos="${i}">${B.esc(c.title)}</a>
        <span class="mm-works-artist">${B.esc(c.artist)}</span>
        <span class="mm-works-config">${B.esc(B.sizeText(c))}${c.header ? ' · ' + B.esc(c.header) : ''}</span>
        ${priceHtml(c)}
      </div>
      <button type="button" class="mm-works-atc" data-mm-pos="${i}" aria-label="${B.esc(c.title)} in den Warenkorb">In den Warenkorb</button>
    </li>`;
  }

  function openPanel(source) {
    const works = list();
    if (!works.length) return;
    closePanel();
    panel = B.el(`<div class="mm-works-layer" role="dialog" aria-modal="false" aria-label="Zuletzt angesehen">
      <div class="mm-works-panel">
        <div class="mm-works-head"><p class="mm-works-heading">Zuletzt angesehen</p><button type="button" class="mm-works-close" aria-label="Schließen">×</button></div>
        <p class="mm-works-sub">In der Größe und Rahmung, die du zuletzt gewählt hast.</p>
        <ul class="mm-works-list">${works.map(itemHtml).join('')}</ul>
      </div></div>`);
    document.body.appendChild(panel);
    const hb = document.querySelector('site-header')?.getBoundingClientRect();
    if (hb && !B.mobile()) panel.querySelector('.mm-works-panel').style.top = Math.max(16, Math.round(hb.bottom + 8)) + 'px';
    requestAnimationFrame(() => panel && panel.classList.add('is-on'));
    B.track('works_open', { mm_source: source, mm_count: works.length });
    panel.addEventListener('click', e => { if (e.target === panel) closePanel(); });
    panel.querySelector('.mm-works-close').addEventListener('click', closePanel);
    panel.querySelectorAll('a[data-mm-pos]').forEach(a => a.addEventListener('click', () => B.track('works_click', { mm_source: source, mm_pos: +a.dataset.mmPos, mm_sku: works[+a.dataset.mmPos].sku })));
    panel.querySelectorAll('.mm-works-atc').forEach(btn => btn.addEventListener('click', async () => {
      const c = works[+btn.dataset.mmPos];
      if (btn.disabled) return;
      btn.disabled = true;
      try { await fetch(`/cart/add/${encodeURIComponent(c.sku)}/`, { method: 'POST', body: 'quantity=1', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }); } catch (err) { /* the clone swallows the post */ }
      B.addToCart(c, 'works_' + source);
      btn.textContent = 'Im Warenkorb';
      btn.classList.add('is-done');
    }));
    document.addEventListener('keydown', escClose);
    panel.querySelector('.mm-works-close').focus({ preventScroll: true });
  }
  function escClose(e) { if (e.key === 'Escape') closePanel(); }
  function closePanel() {
    if (!panel) return;
    const p = panel; panel = null;
    p.classList.remove('is-on');
    document.removeEventListener('keydown', escClose);
    setTimeout(() => p.remove(), 260);
  }

  // Header: a sibling of production's wish list icon, cloned so production's header styles apply.
  function header() {
    const n = B.recent().filter(x => x.url !== B.path()).length;
    document.querySelectorAll('.mm-works-entry').forEach(e => e.remove());
    if (!n || B.mode === 'decided') return;
    document.querySelectorAll('site-header .wishlist-wrapper').forEach(wrap => {
      const entry = wrap.cloneNode(true);
      entry.classList.add('mm-works-entry');
      const a = entry.querySelector('a');
      a.className = 'wishlist-link mm-works-link';
      a.setAttribute('href', '/lastseen/');
      a.setAttribute('aria-label', `Zuletzt angesehen, ${n} ${n === 1 ? 'Werk' : 'Werke'}`);
      a.querySelector('svg').outerHTML = CLOCK;
      const count = entry.querySelector('header-counter, .wishlist-count');
      if (count) { count.textContent = String(n); count.removeAttribute('hidden'); count.classList.add('mm-works-count'); }
      a.addEventListener('click', e => { e.preventDefault(); openPanel('header'); });
      wrap.parentNode.insertBefore(entry, wrap);
    });
  }

  // Listings: a slim strip above the grid, only for visitors coming back with works from an earlier visit.
  function strip() {
    if (!B.earlierWorks().length || B.mode === 'decided') return;
    const grid = document.querySelector('search-results, .search-results');
    if (!grid || document.querySelector('.mm-works-strip') || document.querySelector('.pdp-container')) return;
    const works = list();
    if (!works.length) return;
    const s = B.el(`<button type="button" class="mm-works-strip">
      <span class="mm-works-thumbs">${works.slice(0, 3).map(c => `<img src="${B.esc(B.asset(c.thumb || c.image))}" alt="">`).join('')}</span>
      <span class="mm-works-strip-text"><strong>Deine zuletzt angesehenen Werke</strong><span>${works.length} ${works.length === 1 ? 'Werk' : 'Werke'}, in deiner Größe und Rahmung</span></span>
      <span class="mm-works-strip-go" aria-hidden="true">→</span></button>`);
    s.addEventListener('click', () => openPanel('listing'));
    const host = grid.closest('.row') || grid;
    host.parentNode.insertBefore(s, host);
    B.track('works_strip_view', { mm_count: works.length });
  }

  function init() {
    header();
    [900, 2000, 3500].forEach(t => setTimeout(strip, t));   // listings can render late; strip() adds itself once
    // production's Vue mount can re-render the header; put the entry back if it goes
    setTimeout(() => { if (!document.querySelector('.mm-works-entry')) header(); }, 1500);
    document.addEventListener('mm-recent-change', header);
    if (new URLSearchParams(location.search).get('mm-open') === 'works') setTimeout(() => openPanel('preview'), 1500);
  }
  B.ready(init);
})();
