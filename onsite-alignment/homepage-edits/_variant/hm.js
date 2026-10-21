/* Editorial variant: hang-line rows, image states and the one disclosure mechanic.

   Production's Vue app mounts over <main> from the in-DOM template, which replaces these nodes
   and drops anything attached to them. So events are delegated from document, and layout and
   observers are (re)initialised whenever #hm-page is a new node. */
(function () {
  var root = document.getElementById('hm-page');
  if (!root) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function px(el, prop) { return parseFloat(getComputedStyle(el).getPropertyValue(prop)) || 0; }

  // Publish the fixed header height so sticky rails and anchors clear it.
  function setNavHeight() {
    var header = document.querySelector('site-header') || document.querySelector('header');
    root.style.setProperty('--hm-nav-h', (header ? Math.round(header.getBoundingClientRect().height) : 72) + 'px');
  }

  /* Hang-line rows. CSS alone already justifies each row (flex-grow by aspect ratio); this pass
     chooses the row breaks, the way a typesetter breaks lines: of all ways to split a run of
     works into rows, it keeps the one whose row heights stay closest to the target height
     (squared log error, so a row twice too tall costs as much as one half as tall). Every row is
     then scaled to fill the wall exactly, so the works in it share one height and one caption
     line, and no last row is left short. Tiles marked --row:1 take a row of their own. */
  function breakRows(ratios, width, gap, target) {
    var n = ratios.length, best = [0], from = [0], i, j;
    for (i = 1; i <= n; i++) {
      best[i] = Infinity;
      var sum = 0;
      for (j = i - 1; j >= 0; j--) {
        sum += ratios[j];
        var h = (width - gap * (i - j - 1)) / sum;
        if (h <= 0) break;
        var err = Math.log(h / target), c = best[j] + err * err;
        if (c < best[i]) { best[i] = c; from[i] = j; }
      }
    }
    var ends = [];
    for (i = n; i > 0; i = from[i]) ends.unshift(i);
    return ends;
  }

  function hangRun(tiles, width, gap, target) {
    var ratios = tiles.map(function (t) { return px(t, '--r') || 1; });
    var start = 0;
    breakRows(ratios, width, gap, target).forEach(function (end) {
      var sum = 0, k;
      for (k = start; k < end; k++) sum += ratios[k];
      var h = (width - gap * (end - start - 1)) / sum;
      for (k = start; k < end; k++) {
        tiles[k].style.setProperty('--w', Math.max(0, Math.floor((ratios[k] * h - 0.5) * 100) / 100) + 'px');
      }
      start = end;
    });
  }

  function hangWall(wall) {
    if (wall.closest('[hidden]') || !wall.clientWidth) return;
    var width = wall.clientWidth, gap = px(wall, 'column-gap'), target = px(wall, '--hm-h') * 10 || px(wall, '--hm-h');
    var run = [];
    Array.prototype.forEach.call(wall.children, function (t) {
      if (getComputedStyle(t).display === 'none') return;
      if (getComputedStyle(t).getPropertyValue('--row').trim() === '1') {
        if (run.length) hangRun(run, width, gap, target);
        run = [];
        t.style.removeProperty('--w');
        return;
      }
      run.push(t);
    });
    if (run.length) hangRun(run, width, gap, target);
    wall.classList.add('is-hung');
  }
  function hangAll() { root.querySelectorAll('.hm-wall').forEach(hangWall); }

  // Images reserve their space through aspect-ratio, so layout never waits for them.
  function watchImages(scope) {
    scope.querySelectorAll('img[data-hm-img]').forEach(function (img) {
      var plate = img.parentElement;
      function done() { plate.classList.add('is-loaded'); }
      function fail() { plate.classList.add('is-error'); }
      if (img.complete && img.naturalWidth) done();
      else if (img.complete) fail();
      else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', fail, { once: true }); }
    });
  }

  // Chrome's scroll anchoring keeps the focused element still when content appears above it,
  // which would push freshly revealed works off the top of the screen. Release focus and switch
  // anchoring off for the change; the reveal itself decides what the viewer sees.
  function withoutAnchoring(fn) {
    var els = [document.documentElement, document.body];
    var prev = els.map(function (el) { return el.style.overflowAnchor; });
    els.forEach(function (el) { el.style.overflowAnchor = 'none'; });
    if (document.activeElement && root.contains(document.activeElement)) document.activeElement.blur();
    fn();
    requestAnimationFrame(function () { els.forEach(function (el, i) { el.style.overflowAnchor = prev[i]; }); });
  }

  // Disclosure: reveal the rest of the edit below what has been seen, never above it.
  function expand(button) {
    var edit = button.closest('.hm-edit');
    var more = document.getElementById(button.getAttribute('aria-controls'));
    withoutAnchoring(function () {
      more.hidden = false;
      more.querySelectorAll('.hm-tile').forEach(function (t, i) { t.style.setProperty('--hm-i', Math.min(i, 8)); });
      if (!reduceMotion.matches) more.classList.add('is-entering');
      watchImages(more);
      more.querySelectorAll('.hm-wall').forEach(hangWall);
      button.setAttribute('aria-expanded', 'true');
      button.hidden = true;
      edit.querySelector('.hm-after').hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { more.classList.remove('is-entering'); }); });
      var first = more.querySelector('a');
      if (first) first.focus({ preventScroll: true });
      var navH = px(root, '--hm-nav-h') || 72, top = more.getBoundingClientRect().top;
      if (top < navH) window.scrollBy({ top: top - navH - 16, behavior: 'instant' });
    });
    edit.querySelector('.hm-sr').textContent = button.dataset.hmCount + ' weitere Einträge angezeigt.';
    if (window.hmTrack) window.hmTrack('edit_expand', { section: button.dataset.hmSection });
  }

  function collapse(control) {
    var edit = control.closest('.hm-edit');
    var button = edit.querySelector('.hm-reveal');
    var disclose = edit.querySelector('.hm-disclose');
    withoutAnchoring(function () {
      var before = disclose.getBoundingClientRect().top;
      document.getElementById(button.getAttribute('aria-controls')).hidden = true;
      edit.querySelector('.hm-after').hidden = true;
      button.hidden = false;
      button.setAttribute('aria-expanded', 'false');
      window.scrollBy({ top: disclose.getBoundingClientRect().top - before, behavior: 'instant' });
      button.focus({ preventScroll: true });
    });
    edit.querySelector('.hm-sr').textContent = 'Auswahl eingeklappt.';
    if (window.hmTrack) window.hmTrack('edit_collapse', { section: control.dataset.hmSection });
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('#hm-page')) return;
    var reveal = e.target.closest('.hm-reveal');
    if (reveal) { expand(reveal); return; }
    var col = e.target.closest('.hm-collapse');
    if (col) collapse(col);
  });

  // Edit tiles: jump to an edit, offset by the header, and hand focus to its title.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('#hm-page [data-hm-index]');
    if (!a) return;
    var target = document.getElementById('hm-' + a.dataset.hmIndex);
    if (!target) return;
    e.preventDefault();
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - (px(root, '--hm-nav-h') || 72), behavior: reduceMotion.matches ? 'instant' : 'smooth' });
    history.replaceState(null, '', '#hm-' + a.dataset.hmIndex);
    var heading = target.querySelector('h2');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    if (window.hmTrack) window.hmTrack('page_index_click', { section: target.dataset.section });
  });

  var widths = new WeakMap();
  var ro = new ResizeObserver(function (entries) {
    entries.forEach(function (en) {
      var w = Math.round(en.contentRect.width);
      if (widths.get(en.target) !== w) { widths.set(en.target, w); hangWall(en.target); }
    });
  });

  function init() {
    root = document.getElementById('hm-page');
    if (!root || root.__hmReady) return;
    root.__hmReady = true;
    ro.disconnect();
    setNavHeight();
    watchImages(root);
    hangAll();
    root.querySelectorAll('.hm-wall').forEach(function (w) { ro.observe(w); });
    if (window.hmObserveSections) window.hmObserveSections();
  }

  init();
  var pending = 0;
  new MutationObserver(function () {
    if (pending) return;
    pending = requestAnimationFrame(function () {
      pending = 0;
      var current = document.getElementById('hm-page');
      if (current && !current.__hmReady) init();
    });
  }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('resize', setNavHeight);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(hangAll);
})();
