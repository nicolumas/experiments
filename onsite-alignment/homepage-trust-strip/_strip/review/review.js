/*
 * Prototype chrome for PROTO-2026-064. Not part of the test.
 *
 *   ?v=control|variant   arm (press V to toggle)
 *   &sticky=0            hide the site-wide sticky USP bar (desktop >= 1260 only)
 *   &m=1                 measurement overlay (press M)
 *   &chrome=0            hide this bar (for screenshots)
 *   &f1= &f2= &f3= &score=   copy overrides, written by the editor
 */
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var state = {
    arm: params.get('v') === 'control' ? 'control' : 'variant',
    sticky: params.get('sticky') !== '0',
    measure: params.get('m') === '1',
    chrome: params.get('chrome') !== '0',
  };

  var DEFAULT_FACTS = ['19 Galerien weltweit', '330.000 Sammler:innen'];
  var DEFAULT_SCORE = '4,7';

  function copyFromUrl() {
    var facts = DEFAULT_FACTS.map(function (fact, i) {
      var value = params.get('f' + (i + 1));
      return value === null ? fact : value;
    });
    var score = params.get('score');
    if (score === null) score = DEFAULT_SCORE;
    return { facts: facts, score: score === '' ? null : score };
  }

  function writeUrl() {
    var next = new URLSearchParams();
    next.set('v', state.arm);
    if (!state.sticky) next.set('sticky', '0');
    if (state.measure) next.set('m', '1');
    if (!state.chrome) next.set('chrome', '0');
    var copy = window.TRUST_STRIP || {};
    (copy.facts || []).forEach(function (fact, i) {
      if (fact !== DEFAULT_FACTS[i]) next.set('f' + (i + 1), fact);
    });
    if ((copy.score || '') !== DEFAULT_SCORE) next.set('score', copy.score || '');
    history.replaceState(null, '', location.pathname + '?' + next.toString());
  }

  // ---- arm + sticky bar --------------------------------------------------
  function applyArm() {
    if (state.arm === 'variant') window.TrustStrip.mount();
    else window.TrustStrip.unmount();
    document.documentElement.setAttribute('data-proto-arm', state.arm);
    drawMeasures();
    syncBar();
  }

  function applySticky() {
    document.documentElement.classList.toggle('proto-no-sticky', !state.sticky);
    syncBar();
  }

  // ---- measurement overlay ----------------------------------------------
  var layer = null;

  function box(el) {
    var r = el.getBoundingClientRect();
    return { top: r.top + scrollY, bottom: r.bottom + scrollY, left: r.left + scrollX, right: r.right + scrollX, width: r.width, height: r.height };
  }

  function visible(selector) {
    return Array.prototype.find.call(document.querySelectorAll(selector), function (el) {
      return el.offsetParent !== null;
    });
  }

  function addSpan(top, height, left, label, side) {
    if (height <= 0) return;
    var span = document.createElement('div');
    span.className = 'proto-measure-span';
    span.style.top = top + 'px';
    span.style.height = height + 'px';
    span.style.left = left + 'px';
    span.innerHTML = '<span class="proto-measure-label proto-measure-label-' + (side || 'right') + '">' + label + '</span>';
    layer.appendChild(span);
  }

  function addBand(rect, label) {
    var band = document.createElement('div');
    band.className = 'proto-measure-band';
    band.style.top = rect.top + 'px';
    band.style.left = rect.left + 'px';
    band.style.width = rect.width + 'px';
    band.style.height = rect.height + 'px';
    if (label) band.innerHTML = '<span class="proto-measure-label proto-measure-label-above">' + label + '</span>';
    layer.appendChild(band);
  }

  function addGap(left, right, top, height, label) {
    var gap = document.createElement('div');
    gap.className = 'proto-measure-gap';
    gap.style.left = left + 'px';
    gap.style.width = right - left + 'px';
    gap.style.top = top + 'px';
    gap.style.height = height + 'px';
    if (label) gap.innerHTML = '<span class="proto-measure-label proto-measure-label-below">' + label + '</span>';
    layer.appendChild(gap);
  }

  function px(value) {
    return Math.round(value) + ' px';
  }

  function drawMeasures() {
    if (layer) layer.remove();
    layer = null;
    if (!state.measure) return;

    layer = document.createElement('div');
    layer.className = 'proto-measure';
    document.body.appendChild(layer);

    var stage = visible('#main-content .stage');
    var claimTitle = visible('#main-content .quote_de.claim h1');
    var strip = document.querySelector('.trust-strip');
    if (!stage || !claimTitle) return;

    var hero = box(stage.querySelector('img') || stage);
    var title = box(claimTitle);
    var x = Math.max(24, scrollX + 24);

    if (!strip) {
      addSpan(hero.bottom, title.top - hero.bottom, x, 'Hero → Claim ' + px(title.top - hero.bottom));
      return;
    }

    var list = strip.querySelector('.trust-strip-facts');
    var facts = list.querySelectorAll('.trust-strip-fact');
    var listBox = box(list);
    var stripBox = box(strip);
    var styles = getComputedStyle(strip);

    addSpan(stripBox.top, listBox.top - stripBox.top, x, 'Hero → Text ' + px(listBox.top - stripBox.top) + ' (Band bündig am Hero)');
    addSpan(listBox.top, listBox.height, x, 'Text ' + px(listBox.height) + ' · Utile ' + styles.fontSize + ' / ' + styles.lineHeight);
    addSpan(listBox.bottom, stripBox.bottom - listBox.bottom, x, 'Band ' + px(stripBox.height) + ' gesamt');
    addSpan(stripBox.bottom, title.top - stripBox.bottom, x, 'Band → Claim ' + px(title.top - stripBox.bottom) + ' (bisheriger Hero-Abstand)');
    addBand({ top: listBox.top, left: listBox.left, width: listBox.width, height: listBox.height });

    for (var i = 1; i < facts.length; i++) {
      var prev = box(facts[i - 1]);
      var cur = box(facts[i]);
      if (Math.abs(prev.top - cur.top) > 2) continue;
      addGap(prev.right, cur.left, cur.top, cur.height, i === 1 ? px(cur.left - prev.right) : '');
    }

    var added = stripBox.height + parseFloat(styles.marginTop) + parseFloat(styles.marginBottom);
    var note = document.createElement('div');
    note.className = 'proto-measure-note';
    note.style.top = title.top - 8 + 'px';
    note.style.right = '24px';
    note.textContent = 'Zusätzliche Höhe: ' + px(added);
    layer.appendChild(note);
  }

  // ---- copy editor --------------------------------------------------------
  function editorHtml() {
    var copy = window.TRUST_STRIP;
    var fields = copy.facts.map(function (fact, i) {
      return '<label class="proto-field"><span>Fakt ' + (i + 1) + '</span>' +
        '<input data-fact="' + i + '" value="' + fact.replace(/"/g, '&quot;') + '"></label>';
    }).join('');
    return (
      '<div class="proto-editor" hidden>' +
      '<p class="proto-editor-note">Vorläufige Inhalte. Zahlen vor Launch verifizieren; der Score kommt in Produktion live aus Trustpilot.</p>' +
      fields +
      '<label class="proto-field"><span>Trustpilot-Score</span>' +
      '<input data-score placeholder="leer = Platzhalter" value="' + (copy.score || '') + '"></label>' +
      '<button type="button" class="proto-link" data-reset>Zurücksetzen</button>' +
      '</div>'
    );
  }

  function onEdit(event) {
    var copy = window.TRUST_STRIP;
    var target = event.target;
    if (target.hasAttribute('data-fact')) copy.facts[+target.getAttribute('data-fact')] = target.value;
    if (target.hasAttribute('data-score')) copy.score = target.value.trim() || null;
    if (state.arm === 'variant') window.TrustStrip.mount();
    drawMeasures();
    writeUrl();
  }

  // ---- bar ----------------------------------------------------------------
  var bar = null;

  function syncBar() {
    if (!bar) return;
    bar.querySelectorAll('[data-arm]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-arm') === state.arm));
    });
    bar.querySelector('[data-sticky]').setAttribute('aria-pressed', String(state.sticky));
    bar.querySelector('[data-measure]').setAttribute('aria-pressed', String(state.measure));
    writeUrl();
  }

  function buildBar() {
    bar = document.createElement('div');
    bar.className = 'proto-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Prototyp-Steuerung');
    bar.innerHTML =
      editorHtml() +
      '<div class="proto-bar-row">' +
      '<span class="proto-bar-tag">PROTO-2026-064</span>' +
      '<div class="proto-segment" role="group" aria-label="Testarm">' +
      '<button type="button" data-arm="control">A · Kontrolle</button>' +
      '<button type="button" data-arm="variant">B · Trust-Strip</button>' +
      '</div>' +
      '<button type="button" class="proto-toggle" data-sticky title="Seitenweite Sticky-Leiste, nur Desktop ab 1260 px">Sticky-Leiste</button>' +
      '<button type="button" class="proto-toggle" data-measure title="Taste M">Maße</button>' +
      '<button type="button" class="proto-toggle" data-edit aria-expanded="false">Texte</button>' +
      '</div>';
    document.body.appendChild(bar);

    bar.addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (!button) return;
      if (button.hasAttribute('data-arm')) { state.arm = button.getAttribute('data-arm'); applyArm(); }
      if (button.hasAttribute('data-sticky')) { state.sticky = !state.sticky; applySticky(); }
      if (button.hasAttribute('data-measure')) { state.measure = !state.measure; drawMeasures(); syncBar(); }
      if (button.hasAttribute('data-edit')) {
        var editor = bar.querySelector('.proto-editor');
        editor.hidden = !editor.hidden;
        button.setAttribute('aria-expanded', String(!editor.hidden));
      }
      if (button.hasAttribute('data-reset')) {
        window.TRUST_STRIP.facts = DEFAULT_FACTS.slice();
        window.TRUST_STRIP.score = DEFAULT_SCORE;
        bar.querySelector('.proto-editor').outerHTML = editorHtml().replace(' hidden', '');
        if (state.arm === 'variant') window.TrustStrip.mount();
        drawMeasures();
        writeUrl();
      }
    });
    bar.addEventListener('input', onEdit);
  }

  function onKey(event) {
    if (event.target.closest('input, textarea, [contenteditable]')) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    var key = event.key.toLowerCase();
    if (key === 'v') { state.arm = state.arm === 'variant' ? 'control' : 'variant'; applyArm(); }
    if (key === 'm') { state.measure = !state.measure; drawMeasures(); syncBar(); }
  }

  function start() {
    window.TRUST_STRIP = copyFromUrl();
    if (state.chrome) buildBar();
    applySticky();
    applyArm();
    document.addEventListener('keydown', onKey);

    var redraw;
    window.addEventListener('resize', function () {
      clearTimeout(redraw);
      redraw = setTimeout(drawMeasures, 150);
    });
    // production's stylesheets and web fonts settle after DOMContentLoaded
    window.addEventListener('load', function () { setTimeout(drawMeasures, 300); });
    if (document.fonts) document.fonts.ready.then(drawMeasures);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
