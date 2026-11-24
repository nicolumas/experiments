/* Idea 2: Send it to my phone.
 * Under the buy button: desktop shows a QR code that opens this work on the phone with the chosen
 * size and finish already set; the phone gets a link to copy for the computer. Arriving with
 * ?bi-handoff=<sku> applies that configuration through production's own updateProduct.
 * Evidence: 47% of buyers GA4 counts as first visits are existing customers on another device.
 */
(function () {
  const B = window.BI;
  if (!B || !B.on('handoff')) return;
  const QR_LIB = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';

  function handoffUrl() {
    const c = B.currentConfig();
    const u = new URL(location.origin + location.pathname);
    if (c) u.searchParams.set('bi-handoff', [c.sku, c.w, c.colorId].join('.'));
    return u.toString();
  }

  function loadQr() {
    if (window.QRCode) return Promise.resolve();
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = QR_LIB; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }

  function openPanel(anchor) {
    let panel = document.querySelector('.bi-handoff-panel');
    if (panel) { panel.remove(); return; }
    const c = B.currentConfig();
    panel = B.el(`<div class="bi-handoff-panel" role="dialog" aria-label="Auf dem Handy weiter ansehen">
      <button type="button" class="bi-close" aria-label="Schließen">×</button>
      <div class="bi-qr" aria-hidden="true"></div>
      <div class="bi-handoff-copy">
        <p class="bi-handoff-head">Mit dem Handy scannen</p>
        <p>Das Werk öffnet sich auf deinem Handy, eingestellt wie hier:</p>
        <p class="bi-handoff-config">${B.esc(c ? B.configText(c) : '')}</p>
        <a class="bi-textlink" href="${B.esc(handoffUrl())}" target="_blank" rel="noopener" data-bi="test">Auf diesem Gerät testen</a>
      </div>
    </div>`);
    anchor.insertAdjacentElement('afterend', panel);
    panel.querySelector('.bi-close').addEventListener('click', () => panel.remove());
    panel.querySelector('[data-bi="test"]').addEventListener('click', () => B.track('handoff_test'));
    loadQr().then(() => {
      // eslint-disable-next-line no-new
      new window.QRCode(panel.querySelector('.bi-qr'), { text: handoffUrl(), width: 132, height: 132, colorDark: '#1d1d1b', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.M });
    }).catch(() => { panel.querySelector('.bi-qr').textContent = 'QR-Code nicht verfügbar'; });
    B.track('handoff_open', { bi_sku: c && c.sku, bi_direction: 'desktop_to_phone' });
  }

  async function copyLink() {
    const url = handoffUrl();
    try { await navigator.clipboard.writeText(url); B.toast('Link kopiert. Größe und Rahmung sind darin gespeichert.'); } catch (e) { prompt('Link kopieren', url); }
    B.track('handoff_open', { bi_direction: 'phone_to_desktop' });
  }

  function addEntry() {
    const atc = document.querySelector('.pdp-container .add-to-cart');
    const box = atc && atc.closest('.button-container');
    if (!box || document.querySelector('.bi-handoff')) return;
    const phone = B.mobile();
    const entry = B.el(`<div class="bi-handoff"><button type="button" class="bi-handoff-link">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.5" fill="none" stroke="currentColor"/><path d="M7 12.5h2" stroke="currentColor"/></svg>
      <span>${phone ? 'Am Computer weiter ansehen' : 'Auf dem Handy weiter ansehen'}</span></button></div>`);
    box.insertAdjacentElement('afterend', entry);
    entry.querySelector('button').addEventListener('click', e => (phone ? copyLink() : openPanel(entry)));
  }

  /** The framing card for sku + outer width, with the colour applied the way the framing drawer does it. */
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

  function applyHandoff() {
    const raw = new URLSearchParams(location.search).get('bi-handoff');
    if (!raw) return;
    const [sku, w, colorId] = raw.split('.');
    const card = cardFor(sku, w, colorId);
    if (!card) return;
    const btn = [...document.querySelectorAll('.pdp-products .size')].find(b => +b.dataset.widthMm === +card.widthMm && +b.dataset.heightMm === +card.heightMm)
      || [...document.querySelectorAll('.pdp-products .size')].find(b => +b.dataset.innerWidthMm === +card.innerWidthMm);
    if (btn && !btn.classList.contains('active')) btn.click();
    setTimeout(() => {
      if (window.vueInstance?.updateProduct) window.vueInstance.updateProduct(card);
      setTimeout(() => {
        const c = B.currentConfig();
        const atc = document.querySelector('.pdp-container .add-to-cart');
        const box = atc && atc.closest('.button-container');
        if (box && c) {
          const note = B.el(`<div class="bi-handoff-arrived"><strong>Von deinem anderen Gerät übernommen</strong><span>${B.esc(B.configText(c))}</span></div>`);
          box.insertAdjacentElement('beforebegin', note);
          if (B.mobile()) note.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        B.track('handoff_arrive', { bi_sku: sku });
      }, 250);
    }, 450);
  }

  function init() { setTimeout(() => { addEntry(); applyHandoff(); }, 700); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
