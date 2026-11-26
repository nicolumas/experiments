/* Messy middle: shared state and helpers for the seven site ideas (Decoding Decisions × lumas.de, 26 Nov 2026).
 * - remembers every product page configuration the visitor looks at (mm-recent), with the visit it happened in
 * - remembers what goes into the cart (mm-cart)
 * - pushes mm_* events to window.dataLayer: the leading measures each A/B test would use
 * Switches (all set on start.html, never shown on the shop pages):
 *   ?mm=none            production only (sticks for the tab; ?mm=all brings everything back)
 *   ?mm=works,cartbar   only those ideas
 *   ?mm-mode=exploring|returning|evaluating|decided   puts the visitor into that mode with matching demo data
 *   ?arm=a|b|c          the test arm for ideas with several (scarcity: a today, b true fact, c none; free: a %, b free)
 * Goals: only ATC is a bound ABlyft goal; every other goal named in a module header is [UNBOUND].
 */
(function () {
  const qs = new URLSearchParams(location.search);
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
  };
  const session = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) { /* ignore */ } },
  };

  let active = (qs.get('mm') || session.get('mm-only') || '').split(',').filter(Boolean);
  if (qs.has('mm')) {
    if (qs.get('mm') === 'all') { active = []; session.del('mm-only'); } else session.set('mm-only', qs.get('mm'));
  }
  const on = name => !active.includes('none') && (!active.length || active.includes(name));

  // Test arms: ?arm= sticks for the tab.
  if (qs.has('arm')) session.set('mm-arm', qs.get('arm'));
  const arm = () => session.get('mm-arm') || '';

  // A visit starts when the tab opens a page with no visit marker; views from earlier visits make a returning visitor.
  if (!session.get('mm-visit')) session.set('mm-visit', String(Date.now()));
  const visitStart = () => +session.get('mm-visit');

  // The published static copy (GitHub Pages) has no server: page identity comes from aaStatic.page,
  // and mirror paths for images and framed renders point at LUMAS's own hosts.
  const path = () => (window.aaStatic && window.aaStatic.page) || location.pathname;
  const asset = u => {
    if (!u || !window.aaStatic) return u;
    return u.replace(/^\/img_lumas_com\//, 'https://img.lumas.com/').replace(/^\/product\/image-with-frame\//, 'https://www.lumas.de/product/image-with-frame/');
  };
  const euro = cents => '€ ' + Math.round(cents / 100).toLocaleString('de-DE');
  const cm = mm => (Math.round(mm / 10 * 10) / 10).toLocaleString('de-DE');
  const mobile = () => matchMedia('(max-width: 767px)').matches;
  const track = (event, params = {}) => { (window.dataLayer = window.dataLayer || []).push({ event: 'mm_' + event, mm_mode: window.MM && window.MM.mode, ...params }); };
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ready = fn => { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); };

  function toast(text) {
    let t = document.querySelector('.mm-toast');
    if (!t) { t = el('<div class="mm-toast" role="status"></div>'); document.body.appendChild(t); }
    t.textContent = text; t.classList.add('is-on');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('is-on'), 3200);
  }

  /** The product page configuration on screen, in the words the buy box uses. */
  function currentConfig() {
    const ap = window.activeProduct;
    if (!ap || !ap.sku) return null;
    let pp = ap.productPreview;
    if (typeof pp === 'string') { try { pp = JSON.parse(pp); } catch (e) { pp = {}; } }
    let strike = ap.strike;
    if (typeof strike === 'string') { try { strike = JSON.parse(strike); } catch (e) { strike = null; } }
    const disc = strike && strike.hasActiveDiscount !== false && strike.default && strike.default.new && strike.default.new < +ap.priceRaw;
    const og = document.querySelector('meta[property="og:title"]')?.content || document.title;
    const title = (og.split(' von ')[0] || '').trim();
    const artist = document.querySelector('.pdp-container h1 .artist, h1.artist-holder a')?.textContent.trim() || '';
    return {
      abstractId: String(ap.abstractId), sku: ap.sku, colorId: String(ap.colorId || ''), url: path(),
      title, artist, w: +ap.widthMm, h: +ap.heightMm, header: ap.header || '',
      finish: (ap.label || '').replace(/,?\s*[\d,]+\s*x\s*[\d,]+\s*cm\s*\(Außenmaß\)/i, '').trim(),
      price: disc ? strike.default.new : +ap.priceRaw, old: disc ? +ap.priceRaw : 0,
      framed: pp.framed_image ? pp.framed_image + '&size=_full' : '',
      image: pp.images?.desktop || pp.images?.search || '', thumb: pp.images?.search || '', productionDays: ap.productionDays || '', ts: Date.now(),
    };
  }
  const sizeText = c => `${cm(c.w)} × ${cm(c.h)} cm`;
  const configText = c => [sizeText(c), c.header, c.finish].filter(Boolean).join(' · ');
  const restoreUrl = c => `${c.url}${c.url.includes('?') ? '&' : '?'}mm-restore=${encodeURIComponent([c.sku, c.w, c.colorId].join('.'))}`;

  function remember(c) {
    if (!c) return;
    const old = store.get('mm-recent', []);
    const prev = old.find(x => x.abstractId === c.abstractId);
    const list = old.filter(x => x.abstractId !== c.abstractId);
    // keep the first time it was seen, so a work from an earlier visit stays "from an earlier visit"
    list.unshift({ ...c, first: prev ? prev.first || prev.ts : c.ts });
    store.set('mm-recent', list.slice(0, 10));
    document.dispatchEvent(new CustomEvent('mm-recent-change'));
  }
  const recent = () => store.get('mm-recent', []);
  const earlierWorks = () => recent().filter(x => (x.first || x.ts) < visitStart());
  const cart = () => store.get('mm-cart', []);

  function addToCart(c, source) {
    const list = cart().filter(x => x.sku !== c.sku || x.w !== c.w);
    list.unshift({ ...c, ts: Date.now() }); store.set('mm-cart', list.slice(0, 6));
    track('add_to_cart', { mm_source: source, mm_sku: c.sku, value: c.price / 100 });   // ABLYFT-GOAL: ATC
    document.dispatchEvent(new CustomEvent('mm-cart-add', { detail: c }));
  }

  /** The framing drawer's card for a size/frame, the same object production's drawer applies. */
  function cardFor(sku, w, colorId) {
    const cards = [...document.querySelectorAll('[data-cards]')].flatMap(d => { try { return JSON.parse(d.dataset.cards); } catch (e) { return []; } });
    const card = cards.find(x => x.sku === sku && (!w || +x.widthMm === +w)) || cards.find(x => x.sku === sku);
    if (!card) return null;
    const pp = typeof card.productPreview === 'string' ? JSON.parse(card.productPreview) : { ...card.productPreview };
    const col = (card.colors || []).find(x => String(x.idColor) === String(colorId));
    if (!col || String(card.colorId) === String(colorId)) return { ...card, productPreview: pp };
    if (pp.framed_image) pp.framed_image = pp.framed_image.replace(/colorKey=\d+/, 'colorKey=' + col.colorImportId);
    return { ...card, colorId: col.idColor, colorLabel: col.label, label: card.colorLabel ? card.label.replace(card.colorLabel, col.label) : card.label, productPreview: pp };
  }

  /** Puts the product page into a size/frame the way production's drawer does; no note, the buy box shows it. */
  function applyConfig(sku, w, colorId) {
    const card = cardFor(sku, w, colorId);
    if (!card) return false;
    const sizes = [...document.querySelectorAll('.pdp-products .size')];
    const btn = sizes.find(b => +b.dataset.widthMm === +card.widthMm && +b.dataset.heightMm === +card.heightMm) || sizes.find(b => +b.dataset.innerWidthMm === +card.innerWidthMm);
    if (btn && !btn.classList.contains('active')) btn.click();
    setTimeout(() => { if (window.vueInstance?.updateProduct) window.vueInstance.updateProduct(card); }, 450);
    return true;
  }

  // Demo history: works bought by real buyers in the 16-22 Nov week, configurations captured from their
  // product pages on 24 Nov (Black Week prices). Luc Dratwa's Legendary carries today's strongest demand claim.
  const SEED = [
    { abstractId: '1171949', sku: 'LDR12', url: '/pictures/luc_dratwa/legendary/', title: 'Legendary', artist: 'Luc Dratwa', w: 472, h: 712, header: 'Luma ArtBox', finish: '25mm Tiefe, mit Acrylglas matt, Schwarz', price: 63900, old: 79900, framed: '/product/image-with-frame/?colorKey=783&frameKey=11-413-411&abstractId=1171949&imageSku=ldr11&sku=LDR12&size=_full', image: '/img_lumas_com/showimg_ldr11_desktop.jpg', thumb: '/img_lumas_com/showimg_ldr11_search.jpg', productionDays: 10, colorId: '' },
    { abstractId: '5584593', sku: 'IME112', title: 'From a Dream 04', artist: 'Isabelle Menin', url: '/pictures/isabelle_menin/from_a_dream_04/', w: 500, h: 500, header: 'Kaschierung unter Acrylglas', finish: 'Stärke 2 mm glänzend', price: 35900, old: 44900, framed: '/product/image-with-frame/?colorKey=74&frameKey=8-36-21-634&abstractId=5584593&imageSku=ime109&sku=IME112&size=_full', image: '/img_lumas_com/showimg_ime109_desktop.jpg', thumb: '/img_lumas_com/showimg_ime109_search.jpg', productionDays: 5, colorId: '' },
    { abstractId: '6782581', sku: 'ACR30', url: '/pictures/axel_crieger/rive_gauche/', title: 'Rive Gauche', artist: 'Axel Crieger', w: 1000, h: 750, header: 'Kaschierung unter Acrylglas', finish: 'Stärke 2 mm glänzend', price: 79900, old: 99900, framed: '/product/image-with-frame/?colorKey=53&frameKey=8-36-21-634&abstractId=6782581&imageSku=acr29&sku=ACR30&size=_full', image: '/img_lumas_com/showimg_acr29_desktop.jpg', thumb: '/img_lumas_com/showimg_acr29_search.jpg', productionDays: 5, colorId: '' },
    { abstractId: '6762878', sku: 'MCS54', url: '/pictures/marta_contreras_simo/nina/', title: 'Nina', artist: 'Marta Contreras Simó', w: 400, h: 400, header: 'Kaschierung unter Acrylglas', finish: 'Stärke 2 mm matt', price: 35900, old: 44900, framed: '/product/image-with-frame/?colorKey=52&frameKey=8-36-411-634&abstractId=6762878&imageSku=mcs52&sku=MCS54&size=_full', image: '/img_lumas_com/showimg_mcs52_desktop.jpg', thumb: '/img_lumas_com/showimg_mcs52_search.jpg', productionDays: 5, colorId: '' },
    { abstractId: '833689', sku: 'APU03', url: '/pictures/alessandro_puccinelli/intersections_22/', title: 'Intersections 22', artist: 'Alessandro Puccinelli', w: 1200, h: 800, header: 'Kaschierung unter Acrylglas', finish: 'Stärke 2 mm matt', price: 100000, old: 125000, framed: '/product/image-with-frame/?colorKey=74&frameKey=8-36-411-634&abstractId=833689&imageSku=apu03&sku=APU03&size=_full', image: '/img_lumas_com/showimg_apu03_desktop.jpg', thumb: '/img_lumas_com/showimg_apu03_search.jpg', productionDays: 5, colorId: '' },
  ];
  function seedHistory() {
    const now = Date.now();
    store.set('mm-recent', SEED.map((s, i) => ({ ...s, ts: now - (i + 2) * 86400000, first: now - (i + 2) * 86400000 })));
  }
  function resetAll() {
    ['mm-recent', 'mm-cart'].forEach(store.del);
    ['mm-return-hidden', 'mm-decided'].forEach(session.del);
  }

  window.MM = { on, arm, path, asset, store, session, euro, cm, mobile, track, el, esc, ready, toast, currentConfig, configText, sizeText, restoreUrl,
    remember, recent, earlierWorks, cart, addToCart, cardFor, applyConfig, seedHistory, resetAll, SEED, visitStart, mode: 'exploring' };

  // Product pages: remember the configuration on screen; production's own add to cart feeds the cart bar.
  function watchPdp() {
    if (!document.querySelector('.pdp-container')) return;
    const restore = qs.get('mm-restore');
    if (restore) {
      const [sku, w, colorId] = restore.split('.');
      if (MM.applyConfig(sku, w, colorId)) track('works_restore', { mm_sku: sku });
    }
    const save = () => remember(currentConfig());
    setTimeout(save, restore ? 1400 : 600);
    let lastKey = '';
    setInterval(() => { const a = window.activeProduct; const k = a && [a.sku, a.widthMm, a.colorId].join('.'); if (a && a.sku && k !== lastKey) { lastKey = k; save(); } }, 800);
    document.addEventListener('click', e => {
      const b = e.target.closest('.add-to-cart button');
      if (!b) return;
      const c = currentConfig(); if (c) addToCart(c, 'pdp');
    }, true);
  }
  ready(watchPdp);
})();
