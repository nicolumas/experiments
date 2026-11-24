/* Idea 3: Your edition, online.
 * The link on a gallery receipt or order email opens the artist's page as "Deine Edition": the work the
 * collector took home, where and when, and the artist's other works that hang well beside it, as
 * production product cards that buy online. Everything below is the artist page as it is today.
 * Open: /artist/<artist>/?bi=edition&bi-sku=<SKU>&bi-g=<Galerie>&bi-d=<YYYY-MM-DD>
 * Evidence: customers who buy in both channels order more often (3.1 vs 2.5 orders); only 2,401 did.
 */
(function () {
  const B = window.BI;
  const qs = new URLSearchParams(location.search);
  if (!B || qs.get('bi') !== 'edition' || !qs.get('bi-sku') || !B.path().startsWith('/artist/')) return;
  const sku = qs.get('bi-sku').toUpperCase();
  const gallery = qs.get('bi-g') || 'Frankfurt';
  const date = qs.get('bi-d') ? new Date(qs.get('bi-d')) : new Date(Date.now() - 10 * 86400000);
  const dateText = date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

  const REASON = {
    upright: 'Hochformat: als Paar daneben',
    across: 'Querformat: als Paar daneben',
    panorama: 'Panorama: als ruhiges Gegenstück',
    square: 'Gleiches Format: als Reihe',
  };

  function render() {
    const cards = [...document.querySelectorAll('.artist-otherworks product-card')];
    const host = document.querySelector('main .artist-detail-container');
    if (!cards.length || !host) return setTimeout(render, 400);
    const data = cards.map(c => { try { return { el: c, d: JSON.parse(c.dataset.product) }; } catch (e) { return null; } }).filter(Boolean);
    const mine = data.find(x => Object.keys(x.d.prices || {}).includes(sku));
    if (!mine) return;
    const d = mine.d;
    const img = ((d.image_urls && (d.image_urls.full || Object.values(d.image_urls)[0])) || '').replace(/_(full|search|small)\.jpg$/, '_desktop.jpg');
    const artist = d.artist;
    const intro = (document.querySelector('.artist-info-intro')?.textContent || '').trim().replace(/\s+/g, ' ');
    const introShort = intro.length > 260 ? intro.slice(0, intro.lastIndexOf(' ', 250)) + ' …' : intro;
    // Beside it: works of a similar price level, one per other format first (a pair), then the same format
    // (a row); production's order (its ranking on the artist page) decides within each format.
    const pool = data.filter(x => x !== mine && x.d.price >= mine.d.price * 0.5);
    const beside = [];
    ['upright', 'across', 'panorama', 'square'].filter(f => f !== d.dimension).forEach(f => { const x = pool.find(p => p.d.dimension === f); if (x) beside.push(x); });
    pool.filter(p => p.d.dimension === d.dimension).forEach(x => beside.push(x));
    pool.forEach(x => { if (!beside.includes(x)) beside.push(x); });
    beside.splice(4);

    const section = B.el(`
      <section class="bi-edition">
        <div class="bi-edition-hero">
          <div class="bi-edition-art"><img src="${B.esc(B.asset(img))}" alt="${B.esc(d.abstract_name)} von ${B.esc(artist)}"></div>
          <div class="bi-edition-copy">
            <p class="bi-eyebrow">Deine Edition</p>
            <h1 class="bi-edition-title">${B.esc(d.abstract_name)}</h1>
            <p class="bi-edition-artist"><a href="${B.esc(d.artist_url)}">${B.esc(artist)}</a></p>
            <dl class="bi-edition-facts">
              <div><dt>Gesammelt</dt><dd>${B.esc(dateText)}, LUMAS Galerie ${B.esc(gallery)}</dd></div>
              <div><dt>Edition</dt><dd>${(d.edition || []).includes('LIMITED') ? 'Limited Edition' : 'Open Edition'}${d.year_creation ? ', ' + B.esc(d.year_creation) : ''}</dd></div>
            </dl>
            ${introShort ? `<p class="bi-edition-intro">${B.esc(introShort)}</p>` : ''}
            <a class="bi-textlink" href="${B.esc(d.url)}">Zur Edition</a>
          </div>
        </div>
        <div class="bi-edition-beside">
          <div class="text-center text-wrap-balance"><h2 class="like-h3">Passt zu deiner Edition</h2>
          <p class="bi-edition-sub">Weitere Werke von ${B.esc(artist)}, ausgewählt für die Wand neben ${B.esc(d.abstract_name)}.</p></div>
          <div class="search-results artist-otherworks bi-edition-grid"></div>
        </div>
      </section>`);
    const grid = section.querySelector('.bi-edition-grid');
    beside.forEach(x => {
      const clone = x.el.cloneNode(true);
      const tag = B.el(`<p class="bi-beside-reason">${REASON[x.d.dimension] || ''}</p>`);
      const wrap = document.createElement('div'); wrap.className = 'bi-beside';
      wrap.append(clone, tag); grid.appendChild(wrap);
      clone.addEventListener('click', () => B.track('edition_click', { bi_sku: sku, bi_target: x.d.first_concrete_sku }), true);
    });
    host.insertBefore(section, host.firstElementChild);
    document.title = `Deine Edition: ${d.abstract_name} | LUMAS`;
    B.track('edition_view', { bi_sku: sku, bi_gallery: gallery });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(render, 300)); else setTimeout(render, 300);
})();
