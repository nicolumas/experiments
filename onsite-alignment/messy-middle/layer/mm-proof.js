/* Idea 5: Proof where explorers land.
 * PROTO HEADER
 *   ID:          PROTO-2026-MM5
 *   Hypothesis:  [ASSUMPTION] If an artist page opens on the four works collectors chose most in the last 30 days,
 *                above the biography, visitors from Paid Social (about 30k artist landings at €0.08 per visit vs €0.67
 *                on artwork-page landings) click through to an artwork page and add to cart more often, because social
 *                proof was a top-2 bias in 28 of 31 categories, and a rolling 30-day top 25 sold about 10x more per work
 *                than "Letzte Exemplare" in 17 of 17 campaign windows.
 *   Prior:       Funnel review round two (artist landings €0.64 vs €2.03 per session); artweek hot-25 backtest.
 *   Goals:       primary ATC · secondary proof_click (artwork page from the row) [UNBOUND]
 *   Variants:    control = ?mm=none | works first (this)
 *   Status:      exploration
 * Data: DWH lumas_product_all, B2C + B2B lines in the Tableau revenue universe, all channels, 26 Oct - 24 Nov 2026,
 * net revenue summed over every size of the work (decide-by-revenue). Production would compute this nightly per artist.
 * The product page already carries production's live Social Proof Bar ("N Sammler sehen es sich gerade an"); not repeated.
 */
(function () {
  const B = window.MM;
  if (!B || !B.on('proof')) return;

  const TOP = {
    '/artist/isabelle_menin/': [
      { title: 'Midnight 01', net: 28554, orders: 8 },
      { title: 'From a Dream 04', net: 16743, orders: 17 },
      { title: 'Only In Your Heart 03', net: 16581, orders: 9 },
      { title: 'Dew', net: 10207, orders: 5 },
    ],
  };
  const top = TOP[B.path()];
  if (!top) return;

  function cardFor(title) {
    return [...document.querySelectorAll('product-card')].find(c => {
      try { return JSON.parse(c.dataset.product || '{}').abstract_name === title; } catch (e) { return false; }
    });
  }

  function render() {
    if (B.mode === 'decided' || document.querySelector('.mm-proof')) return true;
    const cards = top.map(t => cardFor(t.title)).filter(Boolean);
    const anchor = document.querySelector('blockquote.artist-info-links');
    if (cards.length < 3 || !anchor || !cards[0].querySelector('img')) return false;   // wait for production's cards
    const section = B.el(`<section class="mm-proof" aria-label="Diesen Monat besonders gefragt">
      <div class="mm-proof-head"><p class="mm-eyebrow">Diesen Monat besonders gefragt</p>
      <p class="mm-proof-sub">Die Werke von ${B.esc(document.querySelector('h1')?.textContent.trim() || '')}, die Sammler in den letzten 30 Tagen am häufigsten gewählt haben.</p></div>
      <div class="search-results mm-proof-grid"></div>
      <a class="mm-textlink mm-proof-all" href="#mm-all-works">Alle Werke ansehen</a>
    </section>`);
    const grid = section.querySelector('.mm-proof-grid');
    cards.forEach((card, i) => {
      const copy = card.cloneNode(true);
      copy.classList.add('mm-proof-card');
      copy.querySelectorAll('a[href]').forEach(a => a.addEventListener('click', () => B.track('proof_click', { mm_pos: i, mm_title: top[i].title })));
      grid.appendChild(copy);
    });
    anchor.parentNode.insertBefore(section, anchor);
    const all = document.querySelector('.search-results.artist-otherworks');
    if (all) { all.id = 'mm-all-works'; section.querySelector('.mm-proof-all').addEventListener('click', e => { e.preventDefault(); all.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); }
    B.track('proof_view', { mm_artist: B.path(), mm_count: cards.length });
    return true;
  }

  B.ready(() => {
    let tries = 0;
    const t = setInterval(() => { if (render() || ++tries > 30) clearInterval(t); }, 300);
  });
})();
