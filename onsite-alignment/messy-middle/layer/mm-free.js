/* Idea 7: Free vs % off.
 * PROTO HEADER
 *   ID:          PROTO-2026-MM7
 *   Hypothesis:  [ASSUMPTION] During a campaign, giving the frame for free (the visitor pays the unframed price) wins
 *                at least as much revenue per visitor as a percentage price advantage of similar cost, and protects the
 *                editions' price story, because the power of free was a top-2 bias in 18 of 31 categories. Art Week rules
 *                carried 68% of 2026 online growth and discount depth rose from 14.9% to 16.7%.
 *   Prior:       Webshop YTD review Nov 2026; Decoding Decisions (power of free: car hire +28 points with a free day).
 *   Goals:       primary ATC, revenue per visitor, margin per order · secondary free_choose_frame [UNBOUND]
 *   Variants:    ?mm-free=a today's percentage (control, default) | b frame included
 *   Status:      exploration
 * The numbers are production's own: the framing drawer's cards for the chosen size give the unframed price and each
 * frame's price. "Equal cost" needs finance: LUMAS's cost of a frame is not its retail price, so b shows the frame's
 * retail value honestly and finance sets which frames qualify before a test.
 */
(function () {
  const B = window.MM;
  if (!B || !B.on('free')) return;
  const qs = new URLSearchParams(location.search);
  // read from the link only (not sticky): the overview opens several arms side by side in one tab
  if ((qs.get('mm-free') || 'a') !== 'b') return;
  document.documentElement.classList.add('mm-free-b');

  // Campaign line in the promotion banner (static HTML on every page).
  function banner() {
    document.querySelectorAll('promotion-banner span').forEach(s => {
      const t = s.textContent.trim();
      if (t === '20% auf alle LUMAS Editionen') s.textContent = 'Rahmen inklusive';
      else if (/20% auf alle Editionen/.test(t)) s.textContent = t.replace('20% auf alle Editionen', 'Rahmen inklusive');
    });
  }

  const isFramed = c => /rahmen|artbox/i.test(c.header || '') && !/kaschierung/i.test(c.header || '');
  function cardsForSize() {
    const ap = window.activeProduct;
    if (!ap) return null;
    const all = [...document.querySelectorAll('[data-cards]')].flatMap(d => { try { return JSON.parse(d.dataset.cards); } catch (e) { return []; } });
    const same = all.filter(c => c.sku === ap.sku && +c.innerWidthMm === +(ap.innerWidthMm || ap.widthMm));
    const cards = same.length ? same : all.filter(c => c.sku === ap.sku);
    const base = cards.find(c => c.colorLabel === 'rahmenlos') || cards.find(c => /kaschierung/i.test(c.header || ''));
    const framed = cards.filter(isFramed);
    const current = cards.find(c => String(c.frameId) === String(ap.frameId)) || cards.find(c => +c.widthMm === +ap.widthMm && c.header === ap.header);
    return { base, framed, current, ap };
  }

  function priceBlock() {
    const box = document.querySelector('.pdp-price-container');
    const s = cardsForSize();
    if (!box || !s || !s.current) return;
    box.querySelector('.mm-free-price')?.remove();
    const cur = s.current, base = s.base;
    let html;
    if (base && isFramed(cur)) {
      html = `<span class="mm-free-now">${B.euro(base.priceRaw)}</span> <span class="mm-free-was">statt <s>${B.euro(cur.priceRaw)}</s></span>
        <span class="mm-free-msg">Rahmen inklusive, im Wert von ${B.euro(cur.priceRaw - base.priceRaw)}</span>`;
    } else if (base && cur === base && s.framed.length) {
      const top = Math.max(...s.framed.map(f => f.priceRaw - base.priceRaw));
      html = `<span class="mm-free-now">${B.euro(cur.priceRaw)}</span>
        <span class="mm-free-msg">Rahmen inklusive: wähle einen Rahmen im Wert von bis zu ${B.euro(top)}, der Preis bleibt.</span>`;
    } else {
      html = `<span class="mm-free-now">${B.euro(cur.priceRaw)}</span>`;
    }
    box.appendChild(B.el(`<div class="mm-free-price">${html}</div>`));
  }

  function infoBanner() {
    const b = document.querySelector('.pdp-info-banner');
    if (!b || b.querySelector('.mm-free-info')) return;
    b.appendChild(B.el(`<div class="bg-sunken p-1 mm-free-info"><h3 class="headline-medium-section text-wrap-balance">Black Week</h3>
      <p class="headline-medium-section text-wrap-balance mb-1">Rahmen inklusive</p>
      <p class="bg-page color-secondary text-sm px-1 py-1 text-wrap-balance">Wähle einen Rahmen, du zahlst den Preis ohne Rahmen.</p></div>`));
  }

  // Add to cart with an unframed acrylic: offer the frames first, in production's gift dialog style.
  let bypass = false, dialog = null;
  function offerFrames(e) {
    const btn = e.target.closest('.pdp-container .add-to-cart button');
    if (!btn || bypass) return;
    const s = cardsForSize();
    if (!s || !s.base || s.current !== s.base || !s.framed.length) return;
    e.preventDefault(); e.stopImmediatePropagation();
    openDialog(s, btn);
  }

  function openDialog(s, btn) {
    dialog?.remove();
    const opts = s.framed.map((f, i) => {
      const col = (f.colors || []).find(c => String(c.idColor) === String(f.colorId)) || (f.colors || [])[0] || {};
      return `<div class="mm-free-item">
        <img src="${B.esc(B.asset(col.cornerImage || ''))}" alt="" class="mm-free-corner">
        <div class="mm-free-details"><div class="mm-free-title">${B.esc(f.header)}</div><div class="mm-free-sub">${B.esc(f.colorLabel || col.label || '')}</div>
        <div class="mm-free-desc">Im Wert von ${B.euro(f.priceRaw - s.base.priceRaw)}. Du zahlst ${B.euro(s.base.priceRaw)}.</div>
        <button type="button" class="mm-works-atc" data-mm-frame="${i}">Mit diesem Rahmen</button></div></div>`;
    }).join('');
    dialog = B.el(`<dialog class="mm-free-dialog" aria-label="Dein Rahmen zur Black Week">
      <div class="mm-free-head"><form method="dialog"><button class="mm-free-x" aria-label="Schließen"></button></form>
        <h4>Dein Rahmen zur Black Week</h4><p>Wähle einen Rahmen, er ist im Preis enthalten.</p></div>
      <div class="mm-free-options">${opts}</div>
      <div class="mm-free-foot"><button type="button" class="mm-free-skip">Ohne Rahmen in den Warenkorb</button></div>
    </dialog>`);
    document.body.appendChild(dialog);
    dialog.showModal();
    B.track('free_offer', { mm_sku: s.base.sku, mm_frames: s.framed.length });
    const proceed = () => { bypass = true; dialog.close(); btn.click(); setTimeout(() => { bypass = false; }, 300); };
    dialog.querySelectorAll('[data-mm-frame]').forEach(b => b.addEventListener('click', () => {
      const f = s.framed[+b.dataset.mmFrame];
      B.track('free_choose_frame', { mm_sku: f.sku, mm_frame: f.header, mm_value: (f.priceRaw - s.base.priceRaw) / 100 });
      B.applyConfig(f.sku, f.widthMm, f.colorId);
      dialog.close();
      setTimeout(() => { bypass = true; btn.click(); B.toast(`${f.header} ist inklusive. Du zahlst ${B.euro(s.base.priceRaw)}.`); setTimeout(() => { bypass = false; }, 300); }, 1100);
    }));
    dialog.querySelector('.mm-free-skip').addEventListener('click', () => { B.track('free_skip'); proceed(); });
  }

  B.ready(() => {
    banner();
    if (!document.querySelector('.pdp-container')) return;
    infoBanner();
    setTimeout(priceBlock, 700);
    let last = '';
    setInterval(() => { const a = window.activeProduct; const k = a && [a.sku, a.widthMm, a.frameId, a.colorId].join('.'); if (k && k !== last) { last = k; priceBlock(); } }, 500);
    window.addEventListener('click', offerFrames, true);
    // what goes into the cart costs what the buy box says: the unframed price, no campaign percentage
    document.addEventListener('mm-cart-add', () => {
      const s = cardsForSize();
      const list = B.cart();
      if (!s || !s.current || !list.length) return;
      const pay = s.base && isFramed(s.current) ? s.base.priceRaw : s.current.priceRaw;
      list[0] = { ...list[0], price: pay, old: pay < s.current.priceRaw ? s.current.priceRaw : 0 };
      B.store.set('mm-cart', list);
    });   // window capture runs before the core's document capture
    B.track('free_view', { mm_variant: 'b' });
    if (qs.get('mm-open') === 'frames') setTimeout(() => {
      const s = cardsForSize(); const btn = document.querySelector('.pdp-container .add-to-cart button');
      if (s && s.base && s.framed.length && btn) openDialog(s, btn);
    }, 1500);
  });
})();
