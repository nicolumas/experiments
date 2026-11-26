/* Idea 2: Cart stays in sight.
 * PROTO HEADER
 *   ID:          PROTO-2026-MM2
 *   Hypothesis:  [ASSUMPTION] If, after the first add to cart, a compact bar keeps the chosen work and the way to
 *                checkout in view, and on another work's page opens the two side by side at true relative size,
 *                checkout starts from non-cart pages and second-work orders rise, because 34% of buyers view another
 *                work between first add to cart and purchase and 15% add a second.
 *   Prior:       Cart Layer test (39094149): +10% RPV through AOV but 11% fewer reached checkout, so the bar follows
 *                production's cart layer and never repeats it.
 *   Goals:       primary ATC (second work) · secondary cartbar_click checkout, compare_open [UNBOUND]
 *   Variants:    control = ?mm=none | bar (this) | bar + compare (this, on a second work's product page)
 *   Status:      exploration
 */
(function () {
  const B = window.MM;
  if (!B || !B.on('cartbar')) return;
  let bar = null, sheet = null;

  function bottomOffset() {
    const nav = document.querySelector('.bottom-nav, bottom-nav, #bottom-nav, .mobile-bottom-navigation');
    if (!nav) return 0;
    const r = nav.getBoundingClientRect();
    return r.height && r.top < innerHeight ? Math.max(0, innerHeight - r.top) : 0;
  }

  // On a product page of a different work than the cart's, the bar offers the side-by-side view.
  function otherWorkHere(c) {
    const here = B.currentConfig();
    return here && here.abstractId !== c.abstractId ? here : null;
  }

  function render(fresh) {
    const cart = B.cart();
    if (!cart.length || B.mode === 'decided') { if (bar) { bar.remove(); bar = null; } return; }
    const c = cart[0];
    const more = cart.length - 1;
    const here = otherWorkHere(c);
    const html = `<aside class="mm-cartbar${here ? ' has-compare' : ''}" aria-label="Warenkorb">
      <a class="mm-cartbar-work" href="${B.esc(B.restoreUrl(c))}"><img src="${B.esc(B.asset(c.thumb || c.image))}" alt="">
        <span class="mm-cartbar-text"><span class="mm-cartbar-label">Im Warenkorb${more ? ` · ${cart.length} Werke` : ''}${here ? ` · <button type="button" class="mm-cartbar-compare mm-cartbar-compare-inline">Vergleichen</button>` : ''}</span>
        <span class="mm-cartbar-line"><span class="mm-cartbar-title">${B.esc(c.title)}</span><span class="mm-cartbar-price">${B.euro(c.price)}</span></span></span></a>
      <span class="mm-cartbar-actions">
        ${here ? `<button type="button" class="mm-cartbar-compare">Vergleichen</button>` : ''}
        <a class="mm-cartbar-go" href="#checkout">Zur Kasse</a>
      </span>
    </aside>`;
    if (bar) bar.remove();
    bar = B.el(html);
    document.body.appendChild(bar);
    const dock = () => bar && bar.style.setProperty('--mm-bottom', bottomOffset() + 'px');
    dock(); setTimeout(dock, 600); setTimeout(dock, 1600);   // the bottom navigation mounts after the page
    requestAnimationFrame(() => bar.classList.add('is-on'));
    if (fresh) { bar.classList.add('is-fresh'); setTimeout(() => bar && bar.classList.remove('is-fresh'), 1600); }
    bar.querySelector('.mm-cartbar-go').addEventListener('click', e => {
      e.preventDefault();
      B.track('cartbar_click', { mm_target: 'checkout', mm_items: cart.length });
      B.toast('Prototyp: hier geht es direkt zur Kasse.');
    });
    bar.querySelector('.mm-cartbar-work').addEventListener('click', () => B.track('cartbar_click', { mm_target: 'work' }));
    bar.querySelectorAll('.mm-cartbar-compare').forEach(cmp => cmp.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); openCompare(c, here); }));
    B.track('cartbar_view', { mm_items: cart.length, mm_fresh: !!fresh, mm_compare: !!here });
    if (here && !fresh && new URLSearchParams(location.search).get('mm-open') === 'compare') setTimeout(() => openCompare(c, here), 700);
  }

  // Side by side, drawn at true relative size (outer cm), so "which is bigger on my wall" needs no maths.
  function openCompare(inCart, here) {
    closeCompare();
    const maxH = B.mobile() ? 150 : 190;
    const scale = maxH / Math.max(inCart.h, here.h);
    const fig = (c, label) => `<figure class="mm-compare-fig">
      <div class="mm-compare-frame" style="height:${maxH + 24}px"><img src="${B.esc(B.asset(c.framed || c.image))}" alt="${B.esc(c.title)}" style="width:${Math.round(c.w * scale)}px;height:${Math.round(c.h * scale)}px" onerror="this.src='${B.esc(B.asset(c.image))}'"></div>
      <figcaption><span class="mm-compare-label">${label}</span><strong>${B.esc(c.title)}</strong><span>${B.esc(B.sizeText(c))} · ${B.euro(c.price)}</span></figcaption></figure>`;
    sheet = B.el(`<div class="mm-compare-layer" role="dialog" aria-label="Nebeneinander vergleichen"><div class="mm-compare">
      <div class="mm-compare-head"><p class="mm-compare-heading">Nebeneinander, im Größenverhältnis</p><button type="button" class="mm-works-close" aria-label="Schließen">×</button></div>
      <div class="mm-compare-row">${fig(inCart, 'Im Warenkorb')}${fig(here, 'Dieses Werk')}</div>
      <div class="mm-compare-actions">
        <button type="button" class="btn btn-secondary mm-compare-add">Beide nehmen</button>
        <a class="btn btn-primary mm-compare-go" href="#checkout">Zur Kasse</a>
      </div></div></div>`);
    document.body.appendChild(sheet);
    requestAnimationFrame(() => sheet && sheet.classList.add('is-on'));
    B.track('compare_open', { mm_cart_sku: inCart.sku, mm_sku: here.sku });
    sheet.addEventListener('click', e => { if (e.target === sheet) closeCompare(); });
    sheet.querySelector('.mm-works-close').addEventListener('click', closeCompare);
    sheet.querySelector('.mm-compare-go').addEventListener('click', e => { e.preventDefault(); B.track('cartbar_click', { mm_target: 'checkout_compare' }); B.toast('Prototyp: hier geht es direkt zur Kasse.'); });
    sheet.querySelector('.mm-compare-add').addEventListener('click', () => {
      const atc = document.querySelector('.pdp-container .add-to-cart button');
      if (atc) atc.click(); else B.addToCart(here, 'compare');
      closeCompare();
    });
  }
  function closeCompare() { if (!sheet) return; const s = sheet; sheet = null; s.classList.remove('is-on'); setTimeout(() => s.remove(), 260); }

  let lastY = scrollY;
  addEventListener('scroll', () => {
    if (!bar) return;
    const y = scrollY;
    if (Math.abs(y - lastY) < 8) return;
    bar.classList.toggle('is-away', y > lastY && y > 160);
    bar.style.setProperty('--mm-bottom', bottomOffset() + 'px');
    lastY = y;
  }, { passive: true });
  addEventListener('resize', () => bar && bar.style.setProperty('--mm-bottom', bottomOffset() + 'px'));
  // The clone swallows the cart POST, so production's cart overlay opens empty; close it and let the bar confirm.
  document.addEventListener('mm-cart-add', () => setTimeout(() => {
    document.querySelectorAll('dialog.cart-overlay[open]').forEach(d => { if (!d.querySelector('img')) d.close(); });
    render(true);
  }, 400));

  // wait for the bottom navigation (phones) so the bar docks on it from the first frame, and on a product page for
  // its configuration, so the bar knows whether to offer "Vergleichen"
  const settled = () => (!B.mobile() || bottomOffset() > 0) && (!document.querySelector('.pdp-container') || B.currentConfig());
  B.ready(() => { let n = 0; const t = setInterval(() => { if (settled() || ++n > 30) { clearInterval(t); render(false); } }, 150); });
})();
