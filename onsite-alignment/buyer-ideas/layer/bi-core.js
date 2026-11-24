/* Buyer ideas: shared state and helpers.
 * - remembers every product page configuration the visitor looks at (bi-recent)
 * - remembers what goes into the cart (bi-cart)
 * - pushes bi_* events to window.dataLayer (leading measures for an A/B test)
 * ?bi=none shows production; ?bi=return,cartbar switches single ideas; ?bi-seed=1 fills demo history.
 */
(function () {
  const qs = new URLSearchParams(location.search);
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  // ?bi=none: production only. ?bi=return,cartbar: only those ideas. No ?bi: every idea on.
  let active = (qs.get('bi') || '').split(',').filter(Boolean);
  try {
    if (qs.get('bi') === 'none') sessionStorage.setItem('bi-off', '1');
    else if (qs.has('bi')) sessionStorage.removeItem('bi-off');
    if (sessionStorage.getItem('bi-off')) active = ['none'];
  } catch (e) { /* ignore */ }
  const on = name => !active.includes('none') && (!active.length || active.includes(name) || active.includes('all'));

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
  const track = (event, params = {}) => { (window.dataLayer = window.dataLayer || []).push({ event: 'bi_' + event, ...params }); };
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function toast(text) {
    let t = document.querySelector('.bi-toast');
    if (!t) { t = el('<div class="bi-toast" role="status"></div>'); document.body.appendChild(t); }
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

  function remember(c) {
    if (!c) return;
    const list = store.get('bi-recent', []).filter(x => x.abstractId !== c.abstractId);
    list.unshift(c); store.set('bi-recent', list.slice(0, 10));
  }

  function addToCart(c, source) {
    const cart = store.get('bi-cart', []);
    cart.unshift({ ...c, ts: Date.now() }); store.set('bi-cart', cart.slice(0, 6));
    track('add_to_cart', { bi_source: source, bi_sku: c.sku, value: c.price / 100 });
    document.dispatchEvent(new CustomEvent('bi-cart-add', { detail: c }));
  }

  // Demo history: works bought by real buyers in the 16-22 Nov week, configurations captured from their product pages on 24 Nov (Black Week prices).
  const SEED = [
    { abstractId: '5584593', sku: 'IME112', title: 'From a Dream 04', artist: 'Isabelle Menin', url: '/pictures/isabelle_menin/from_a_dream_04/', w: 500, h: 500, header: 'Kaschierung unter Acrylglas', finish: 'Stärke 2 mm glänzend', price: 35900, old: 44900, framed: '/product/image-with-frame/?colorKey=74&frameKey=8-36-21-634&abstractId=5584593&imageSku=ime109&sku=IME112&size=_full', image: '/img_lumas_com/showimg_ime109_desktop.jpg', thumb: '/img_lumas_com/showimg_ime109_search.jpg' },
    {"abstractId": "6782581", "sku": "ACR30", "url": "/pictures/axel_crieger/rive_gauche/", "title": "Rive Gauche", "artist": "Axel Crieger", "w": 1000, "h": 750, "header": "Kaschierung unter Acrylglas", "finish": "Stärke 2 mm glänzend", "price": 79900, "old": 99900, "framed": "/product/image-with-frame/?colorKey=53&frameKey=8-36-21-634&abstractId=6782581&imageSku=acr29&sku=ACR30&size=_full", "image": "/img_lumas_com/showimg_acr29_desktop.jpg", "thumb": "/img_lumas_com/showimg_acr29_search.jpg", "productionDays": 5},
    {"abstractId": "6762878", "sku": "MCS54", "url": "/pictures/marta_contreras_simo/nina/", "title": "Nina", "artist": "Marta Contreras Simó", "w": 400, "h": 400, "header": "Kaschierung unter Acrylglas", "finish": "Stärke 2 mm matt", "price": 35900, "old": 44900, "framed": "/product/image-with-frame/?colorKey=52&frameKey=8-36-411-634&abstractId=6762878&imageSku=mcs52&sku=MCS54&size=_full", "image": "/img_lumas_com/showimg_mcs52_desktop.jpg", "thumb": "/img_lumas_com/showimg_mcs52_search.jpg", "productionDays": 5},
    {"abstractId": "833689", "sku": "APU03", "url": "/pictures/alessandro_puccinelli/intersections_22/", "title": "Intersections 22", "artist": "Alessandro Puccinelli", "w": 1200, "h": 800, "header": "Kaschierung unter Acrylglas", "finish": "Stärke 2 mm matt", "price": 100000, "old": 125000, "framed": "/product/image-with-frame/?colorKey=74&frameKey=8-36-411-634&abstractId=833689&imageSku=apu03&sku=APU03&size=_full", "image": "/img_lumas_com/showimg_apu03_desktop.jpg", "thumb": "/img_lumas_com/showimg_apu03_search.jpg", "productionDays": 5},
    {"abstractId": "1171949", "sku": "LDR12", "url": "/pictures/luc_dratwa/legendary/", "title": "Legendary", "artist": "Luc Dratwa", "w": 472, "h": 712, "header": "Luma ArtBox", "finish": "25mm Tiefe, mit Acrylglas matt, Schwarz", "price": 63900, "old": 79900, "framed": "/product/image-with-frame/?colorKey=783&frameKey=11-413-411&abstractId=1171949&imageSku=ldr11&sku=LDR12&size=_full", "image": "/img_lumas_com/showimg_ldr11_desktop.jpg", "thumb": "/img_lumas_com/showimg_ldr11_search.jpg", "productionDays": 10},
  ];
  if ((qs.get('bi-seed') === '1' && !store.get('bi-seeded', false)) || qs.get('bi-seed') === 'fresh') {
    store.set('bi-recent', SEED.map((s, i) => ({ ...s, ts: Date.now() - (i + 1) * 86400000 })));
    store.set('bi-seeded', true);
  }
  if (qs.get('bi-seed') === 'cart') store.set('bi-cart', [{ ...SEED[0], ts: Date.now() }]);
  if (qs.get('bi-seed') === 'reset') {
    ['bi-recent', 'bi-cart', 'bi-seeded'].forEach(k => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } });
    try { sessionStorage.removeItem('bi-return-hidden'); sessionStorage.removeItem('bi-off'); } catch (e) { /* ignore */ }
  }

  // Product pages: remember the configuration on screen; production's own add to cart feeds the cart bar.
  function watchPdp() {
    if (!document.querySelector('.pdp-container')) return;
    const save = () => remember(currentConfig());
    setTimeout(save, 600);
    let lastKey = '';
    setInterval(() => { const a = window.activeProduct; const k = a && [a.sku, a.widthMm, a.colorId].join('.'); if (a && a.sku && k !== lastKey) { lastKey = k; save(); } }, 800);
    document.addEventListener('click', e => {
      const b = e.target.closest('.add-to-cart button');
      if (!b) return;
      const c = currentConfig(); if (c) addToCart(c, 'pdp');
    }, true);
  }

  window.BI = { on, path, asset, store, euro, cm, mobile, track, el, esc, toast, currentConfig, configText, sizeText, remember, addToCart, SEED };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchPdp); else watchPdp();
})();
