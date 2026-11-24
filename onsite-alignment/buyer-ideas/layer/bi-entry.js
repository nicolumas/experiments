/* Idea 5: Artworks first on mobile entry pages.
 * On phones the homepage opens on four works with their prices, taken from production's own
 * bestseller carousel further down the page; the hero and everything else follow unchanged.
 * Evidence: 53% of mobile visits reach a product page vs 68% on desktop (16-22 Nov, lumas.de).
 */
(function () {
  const B = window.BI;
  if (!B || !B.on('entry') || B.path() !== '/') return;
  const SKIP = /^(gun)$/i; // no weapon motifs at the top of the page

  function render() {
    if (!B.mobile() || document.querySelector('.bi-entry')) return;
    const host = document.querySelector('main .container-fluid');
    const source = document.querySelector('#bestseller .product-carousel');
    if (!host || !source) return;
    const items = [...source.querySelectorAll('.item')].filter(it => it.querySelector('picture img') && !SKIP.test(it.querySelector('.artwork')?.textContent.trim() || '')).slice(0, 4);
    if (items.length < 4) return;
    const section = B.el(`<section class="bi-entry" aria-label="Bestseller">
      <div class="bi-entry-head"><h2 class="like-h3">Bestseller</h2><a class="bi-textlink" href="/highlights/bestseller/" data-bi="all">Alle ansehen</a></div>
      <div class="bi-entry-grid"></div></section>`);
    const grid = section.querySelector('.bi-entry-grid');
    items.forEach((it, i) => {
      const a = it.querySelector('a');
      const img = it.querySelector('picture img');
      const card = B.el(`<a class="bi-entry-card" href="${B.esc(a.getAttribute('href'))}" data-bi="card" data-pos="${i + 1}">
        <span class="bi-entry-img"><img alt="${B.esc(img.alt)}" src="${B.esc(img.getAttribute('src'))}"></span>
        <span class="bi-entry-meta"><span class="artwork">${B.esc(it.querySelector('.artwork')?.textContent || '')}</span>
        <span class="artist">${B.esc(it.querySelector('.artist')?.textContent || '')}</span></span></a>`);
      const price = it.querySelector('.carousel-price');
      if (price) card.querySelector('.bi-entry-meta').appendChild(price.cloneNode(true));
      grid.appendChild(card);
    });
    const welcome = host.querySelector(':scope > .bi-return');
    if (welcome) welcome.after(section); else host.insertBefore(section, host.firstElementChild);
    B.track('entry_view', { bi_items: items.length });
    section.querySelectorAll('[data-bi]').forEach(a => a.addEventListener('click', () => B.track('entry_click', { bi_target: a.dataset.bi, bi_pos: +(a.dataset.pos || 0) })));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();
