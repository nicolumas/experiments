/* Idea 6: Cart stays in sight.
 * After the first add to cart, a compact bar keeps the work, its size and price and the way to checkout
 * in view on every page. It slides away while scrolling down and returns on scroll up; on phones it sits
 * above production's bottom navigation.
 * Evidence: between first add to cart and purchase, 34% of buyers view another artwork; 15% add a second work.
 */
(function () {
  const B = window.BI;
  if (!B || !B.on('cartbar')) return;
  let bar = null;

  function bottomOffset() {
    const nav = document.querySelector('.bottom-nav, bottom-nav, #bottom-nav');
    if (!nav) return 0;
    const r = nav.getBoundingClientRect();
    return r.height && r.top < innerHeight ? Math.max(0, innerHeight - r.top) : 0;
  }

  function render(fresh) {
    const cart = B.store.get('bi-cart', []);
    if (!cart.length) return;
    const c = cart[0];
    const more = cart.length - 1;
    const html = `<aside class="bi-cartbar" aria-label="Warenkorb">
      <a class="bi-cartbar-work" href="${B.esc(c.url)}"><img src="${B.esc(B.asset(c.thumb || c.image))}" alt="">
        <span class="bi-cartbar-text"><span class="bi-cartbar-title">${B.esc(c.title)}</span>
        <span class="bi-cartbar-meta">${B.esc(B.sizeText(c))} · ${B.euro(c.price)}${more ? ` · +${more} ${more === 1 ? 'weiteres Werk' : 'weitere Werke'}` : ''}</span></span></a>
      <a class="btn btn-primary bi-cartbar-go" href="#checkout" data-bi="checkout">Zur Kasse</a>
    </aside>`;
    if (bar) bar.remove();
    bar = B.el(html);
    document.body.appendChild(bar);
    bar.style.setProperty('--bi-bottom', bottomOffset() + 'px');
    requestAnimationFrame(() => bar.classList.add('is-on'));
    if (fresh) { bar.classList.add('is-fresh'); setTimeout(() => bar && bar.classList.remove('is-fresh'), 1600); }
    bar.querySelector('.bi-cartbar-go').addEventListener('click', e => {
      e.preventDefault();
      B.track('cartbar_click', { bi_target: 'checkout', bi_items: cart.length });
      B.toast('Prototyp: hier geht es direkt zur Kasse.');
    });
    bar.querySelector('.bi-cartbar-work').addEventListener('click', () => B.track('cartbar_click', { bi_target: 'work' }));
    B.track('cartbar_view', { bi_items: cart.length, bi_fresh: !!fresh });
  }

  let lastY = scrollY;
  addEventListener('scroll', () => {
    if (!bar) return;
    const y = scrollY;
    if (Math.abs(y - lastY) < 8) return;
    bar.classList.toggle('is-away', y > lastY && y > 160);
    lastY = y;
  }, { passive: true });
  addEventListener('resize', () => bar && bar.style.setProperty('--bi-bottom', bottomOffset() + 'px'));
  // The clone swallows the cart POST, so production's cart overlay opens empty; close it and let the bar confirm.
  document.addEventListener('bi-cart-add', () => setTimeout(() => {
    document.querySelectorAll('dialog.cart-overlay[open]').forEach(d => { if (!d.querySelector('img')) d.close(); });
    render(true);
  }, 400));

  function init() { setTimeout(() => render(false), 500); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
