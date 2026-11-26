/* Idea 1a: Your works, on the homepage.
 * PROTO HEADER
 *   ID:          PROTO-2026-MM1
 *   Hypothesis:  [ASSUMPTION] If a returning visitor's homepage opens on the work they configured in an earlier
 *                visit (their size, frame and today's price, one tap to the cart), the share of returning visits that
 *                re-find an earlier work rises from 22% and revenue per returning visitor follows, because 51% of
 *                revenue comes from buyers who came back for a work they had already seen.
 *   Prior:       buyer paths 1-24 Nov 2026 (712 orders); returning sessions 8-24 Nov (41.4k, home re-find 22%).
 *   Goals:       primary ATC · secondary re-find rate [UNBOUND]
 *   Variants:    control = ?mm=none | homepage welcome (this) + header and listing entries (mm-works.js)
 *   Status:      exploration
 */
(function () {
  const B = window.MM;
  if (!B || !B.on('return') || B.path() !== '/') return;

  function priceHtml(c) {
    return c.old
      ? `<div class="price discounted"><span class="no-wrap">Jetzt nur <strong>${B.euro(c.price)}</strong></span> <span class="no-wrap">statt <s>${B.euro(c.old)}</s></span></div>`
      : `<div class="price"><strong>${B.euro(c.price)}</strong></div>`;
  }

  function carouselItem(c) {
    return `<div class="item"><a href="${B.esc(B.restoreUrl(c))}" data-mm="recent"><picture class="image-container"><img alt="${B.esc(c.title)}" loading="lazy" src="${B.esc(B.asset(c.thumb || c.image))}" onload="this.style.aspectRatio=this.naturalWidth/this.naturalHeight"></picture>
      <div class="artwork-container"><div><p class="artwork">${B.esc(c.title)}</p><p class="artist">${B.esc(c.artist)}</p>
      <div class="carousel-price">${priceHtml(c)}</div><p class="mm-recent-size">${B.esc(B.sizeText(c))}</p></div></div></a></div>`;
  }

  function render() {
    const recent = B.earlierWorks();
    const host = document.querySelector('main .container-fluid');
    if (!recent.length || !host || B.session.get('mm-return-hidden') || B.mode === 'decided') return;
    const c = recent[0];
    const days = Math.max(0, Math.round((Date.now() - (c.ts || Date.now())) / 86400000));
    const when = days === 0 ? 'heute' : days === 1 ? 'gestern' : `vor ${days} Tagen`;
    const rest = recent.slice(1, 9);
    const section = B.el(`
      <section class="mm-return" aria-label="Zuletzt angesehen">
        <div class="mm-return-stage">
          <div class="mm-return-art"><img src="${B.esc(B.asset(c.framed || c.image))}" alt="${B.esc(c.title)} von ${B.esc(c.artist)}" onerror="if(this.src.indexOf('image-with-frame')>-1){this.src='${B.esc(B.asset(c.image))}'}"></div>
          <div class="mm-return-copy">
            <p class="mm-eyebrow">Willkommen zurück</p>
            <h2 class="like-h3 text-wrap-balance">Hier warst du stehen geblieben</h2>
            <p class="mm-return-work"><a href="${B.esc(B.restoreUrl(c))}" data-mm="work"><span class="mm-return-title">${B.esc(c.title)}</span><span class="mm-return-artist">${B.esc(c.artist)}</span></a></p>
            <p class="mm-return-config">${B.esc(B.configText(c))}</p>
            <div class="mm-return-price">${priceHtml(c)}</div>
            <div class="mm-return-actions">
              <button type="button" class="btn btn-primary mm-return-atc">In den Warenkorb</button>
              <a class="mm-textlink" href="${B.esc(B.restoreUrl(c))}" data-mm="work">Größe oder Rahmen ändern</a>
            </div>
            <p class="mm-return-note">Zuletzt angesehen ${when}. Versand in ${c.productionDays || 5} Tagen.</p>
          </div>
          <button type="button" class="mm-close" aria-label="Ausblenden">×</button>
        </div>
        ${rest.length ? `<div class="mm-return-more"><p class="mm-eyebrow">Ebenfalls angesehen</p>
          <section class="product-carousel-container"><div class="product-carousel" role="region" aria-label="Zuletzt angesehene Werke" tabindex="0" style="white-space:nowrap;overflow-x:auto;width:100%">${rest.map(carouselItem).join(' ')}</div></section></div>` : ''}
      </section>`);
    host.insertBefore(section, host.firstElementChild);
    B.track('return_view', { mm_sku: c.sku, mm_days: days, mm_recent: recent.length });

    section.querySelector('.mm-return-atc').addEventListener('click', async e => {
      const btn = e.currentTarget;
      if (btn.disabled) return;
      btn.disabled = true;
      try { await fetch(`/cart/add/${encodeURIComponent(c.sku)}/`, { method: 'POST', body: 'quantity=1', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }); } catch (err) { /* the clone swallows the post */ }
      B.addToCart(c, 'return');
      btn.textContent = 'Im Warenkorb';
      btn.classList.add('is-done');
    });
    section.querySelectorAll('[data-mm]').forEach(a => a.addEventListener('click', () => B.track('return_click', { mm_target: a.dataset.mm, mm_sku: c.sku })));
    section.querySelector('.mm-close').addEventListener('click', () => {
      B.session.set('mm-return-hidden', '1');
      B.track('return_dismiss', { mm_sku: c.sku });
      section.remove();
    });
  }

  B.ready(render);
})();
