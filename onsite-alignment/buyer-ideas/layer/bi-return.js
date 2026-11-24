/* Idea 1: Pick up where you left off.
 * A returning visitor's homepage opens on the work they last configured: their size, finish and price,
 * one tap to the cart. Below it, the other works they looked at, in production's carousel.
 * Evidence: 35% of net revenue comes from buyers who had decided before the buying visit.
 */
(function () {
  const B = window.BI;
  if (!B || !B.on('return') || B.path() !== '/') return;

  function priceHtml(c) {
    return c.old
      ? `<div class="price discounted"><span class="no-wrap">Jetzt nur <strong>${B.euro(c.price)}</strong></span> <span class="no-wrap">statt <s>${B.euro(c.old)}</s></span></div>`
      : `<div class="price"><strong>${B.euro(c.price)}</strong></div>`;
  }

  function carouselItem(c) {
    return `<div class="item"><a href="${B.esc(c.url)}" data-bi="recent"><picture class="image-container"><img alt="${B.esc(c.title)}" loading="lazy" src="${B.esc(B.asset(c.thumb || c.image))}" onload="this.style.aspectRatio=this.naturalWidth/this.naturalHeight"></picture>
      <div class="artwork-container"><div><p class="artwork">${B.esc(c.title)}</p><p class="artist">${B.esc(c.artist)}</p>
      <div class="carousel-price">${priceHtml(c)}</div><p class="bi-recent-size">${B.esc(B.sizeText(c))}</p></div></div></a></div>`;
  }

  function render() {
    const recent = B.store.get('bi-recent', []);
    const host = document.querySelector('main .container-fluid');
    if (!recent.length || !host || sessionStorage.getItem('bi-return-hidden')) return;
    const c = recent[0];
    const days = Math.max(0, Math.round((Date.now() - (c.ts || Date.now())) / 86400000));
    const when = days === 0 ? 'heute' : days === 1 ? 'gestern' : `vor ${days} Tagen`;
    const rest = recent.slice(1, 9);
    const section = B.el(`
      <section class="bi-return" aria-label="Zuletzt angesehen">
        <div class="bi-return-stage">
          <div class="bi-return-art"><img src="${B.esc(B.asset(c.framed || c.image))}" alt="${B.esc(c.title)} von ${B.esc(c.artist)}" onerror="if(this.src.indexOf('image-with-frame')>-1){this.src='${B.esc(B.asset(c.image))}'}"></div>
          <div class="bi-return-copy">
            <p class="bi-eyebrow">Willkommen zurück</p>
            <h2 class="like-h3 text-wrap-balance">Hier warst du stehen geblieben</h2>
            <p class="bi-return-work"><a href="${B.esc(c.url)}" data-bi="work"><span class="bi-return-title">${B.esc(c.title)}</span><span class="bi-return-artist">${B.esc(c.artist)}</span></a></p>
            <p class="bi-return-config">${B.esc(B.configText(c))}</p>
            <div class="bi-return-price">${priceHtml(c)}</div>
            <div class="bi-return-actions">
              <button type="button" class="btn btn-primary bi-return-atc">In den Warenkorb</button>
              <a class="bi-textlink" href="${B.esc(c.url)}" data-bi="work">Größe oder Rahmen ändern</a>
            </div>
            <p class="bi-return-note">Zuletzt angesehen ${when}. Versand in ${c.productionDays || 5} Tagen.</p>
          </div>
          <button type="button" class="bi-close" aria-label="Ausblenden">×</button>
        </div>
        ${rest.length ? `<div class="bi-return-more"><p class="bi-eyebrow">Ebenfalls angesehen</p>
          <section class="product-carousel-container"><div class="product-carousel" role="region" aria-label="Zuletzt angesehene Werke" tabindex="0" style="white-space:nowrap;overflow-x:auto;width:100%">${rest.map(carouselItem).join(' ')}</div></section></div>` : ''}
      </section>`);
    host.insertBefore(section, host.firstElementChild);
    B.track('return_view', { bi_sku: c.sku, bi_days: days, bi_recent: recent.length });

    section.querySelector('.bi-return-atc').addEventListener('click', async e => {
      const btn = e.currentTarget;
      if (btn.disabled) return;
      btn.disabled = true;
      try { await fetch(`/cart/add/${encodeURIComponent(c.sku)}/`, { method: 'POST', body: 'quantity=1', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }); } catch (err) { /* the clone swallows the post */ }
      B.addToCart(c, 'return');
      btn.textContent = 'Im Warenkorb';
      btn.classList.add('is-done');
    });
    section.querySelectorAll('[data-bi]').forEach(a => a.addEventListener('click', () => B.track('return_click', { bi_target: a.dataset.bi, bi_sku: c.sku })));
    section.querySelector('.bi-close').addEventListener('click', () => {
      try { sessionStorage.setItem('bi-return-hidden', '1'); } catch (e) { /* ignore */ }
      B.track('return_dismiss', { bi_sku: c.sku });
      section.remove();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();
