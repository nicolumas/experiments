(function () {
  var root = document.documentElement;

  // The USP bar rebuilt from the page's own five items: first line only, same icons.
  function ensureUspBar() {
    var top = document.querySelector('.spc-top-content');
    if (!top || top.querySelector('.tidy-usp')) return;
    var source = top.querySelector('.row.hidden-xs.hidden-sm.hidden-md') || top.querySelector('.row');
    if (!source) return;
    var list = document.createElement('ul');
    list.className = 'tidy-usp';
    Array.prototype.forEach.call(source.children, function (col) {
      var img = col.querySelector('img');
      var firstLine = '';
      for (var n = col.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3 && n.textContent.trim()) { firstLine = n.textContent.trim(); break; }
      }
      if (!firstLine) return;
      firstLine = firstLine
        .replace('330.000 Kunden', '330.000 Sammler:innen')
        .replace(/^Zahle nach Lieferung oder$/, 'Zahle nach Lieferung oder in Raten');
      var li = document.createElement('li');
      li.dataset.usp = /Zahle/.test(firstLine) ? 'payment' : /Aufh/.test(firstLine) ? 'hanging' : 'core';
      if (img) {
        var icon = document.createElement('img');
        icon.src = img.getAttribute('src');
        icon.alt = '';
        li.appendChild(icon);
      }
      var label = document.createElement('span');
      label.textContent = firstLine;
      li.appendChild(label);
      list.appendChild(li);
    });
    top.appendChild(list);
  }

  function ensureProofLine() {
    var list = document.querySelector('aside .checkout-shipment-estimation');
    if (!list || list.parentNode.querySelector('.tidy-proof')) return;
    var proof = document.createElement('div');
    proof.className = 'tidy-proof';
    proof.innerHTML = '<span class="stars" aria-hidden="true">★★★★★</span>' +
      '<span><b>Hervorragend</b> · 5.939&nbsp;Bewertungen auf&nbsp;Trustpilot</span>';
    list.parentNode.insertBefore(proof, list.nextSibling);
  }

  // Mobile only: the USPs join the shop's own shipping list instead of a top band.
  // Returns reuses the shop's existing row; the other two copy its markup and icon size.
  var ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var MOBILE_ROWS = [
    { key: 'proof', text: '330.000 Sammler:innen in über 20 Jahren',
      icon: ICON + '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18.5 14.5a6.5 6.5 0 0 1 3 5.5"/></svg>' },
    { key: 'box', text: 'Art security Box: versichert und risikofrei',
      icon: ICON + '<path d="M12 2.5l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>' }
  ];

  function ensureMobileUspRows() {
    var list = document.querySelector('aside .checkout-shipment-estimation');
    if (!list || list.querySelector('.tidy-mobile-usp')) return;
    MOBILE_ROWS.forEach(function (r) {
      var row = document.createElement('div');
      row.className = 'tidy-mobile-usp';
      row.dataset.usp = r.key;
      row.innerHTML = '<span>' + r.icon + r.text + '</span>';
      list.appendChild(row);
    });
  }

  // The AaaS choice moves from above the artwork to just after the voucher box, right
  // before the price it changes. Vorher puts it back where the layer left it.
  function placeAaasPanel() {
    var panel = document.getElementById('aaas-mode');
    var coupon = document.querySelector('aside .coupon-form-container');
    var items = document.querySelector('aside .cart-items-container');
    if (!panel || !coupon || !items) return;
    if (root.getAttribute('data-tidy') === 'on') {
      if (coupon.nextElementSibling !== panel) coupon.insertAdjacentElement('afterend', panel);
    } else if (items.previousElementSibling !== panel) {
      items.insertAdjacentElement('beforebegin', panel);
    }
  }

  function ensureSwitch() {
    if (document.querySelector('.tidy-switch')) return;
    var box = document.createElement('div');
    box.className = 'tidy-switch';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Vergleich');
    [['off', 'Vorher'], ['on', 'Nachher']].forEach(function (pair) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = pair[1];
      b.dataset.mode = pair[0];
      b.addEventListener('click', function () { setMode(pair[0]); });
      box.appendChild(b);
    });
    document.body.appendChild(box);
    syncSwitch();
  }

  function setMode(mode) {
    root.setAttribute('data-tidy', mode);
    placeAaasPanel();
    syncSwitch();
  }

  function syncSwitch() {
    var mode = root.getAttribute('data-tidy');
    document.querySelectorAll('.tidy-switch button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
    });
  }

  // The checkout is a Vue app and re-renders its own subtree, so the additions are
  // re-applied whenever it does.
  var queued = false;
  function apply() {
    queued = false;
    ensureUspBar();
    ensureProofLine();
    ensureMobileUspRows();
    placeAaasPanel();
    ensureSwitch();
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  }

  if (/[?&]vorher\b/.test(location.search)) root.setAttribute('data-tidy', 'off');
  apply();
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
})();
