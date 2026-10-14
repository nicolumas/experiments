/*
 * Prototype chrome for the "Bekannt aus" options. Not part of any handoff.
 *
 *   ?p=bottom|hero|claim|quote|tiles|proof|sticky   placement   (key P cycles)
 *   ?s=live|row|rules|band|ticker|cms-row|cms-rules|cms-band   treatment (key S cycles)
 *                                                cms-* = the CMS fragment, shop CSS only
 *   ?chrome=0                                 hide this bar (key H toggles)
 *
 * The reach line reads the strip's real position on this page at this width
 * and looks it up on the homepage scroll-depth curve from Clarity
 * (www.lumas.de/, non-bot, 12 to 14 Oct 2026).
 */
(function () {
  'use strict';

  var PLACEMENTS = [
    ['bottom', 'Bottom (today)'],
    ['hero', 'Under the hero'],
    ['claim', 'Under H1 + AD quote'],
    ['quote', 'Instead of the AD quote'],
    ['tiles', 'Under the 3 tiles'],
    ['proof', 'With Trustpilot'],
    ['sticky', 'In the sticky bar'],
  ];
  var TREATMENTS = [
    ['live', 'As live'],
    ['row', 'Quiet row'],
    ['rules', 'Hairlines'],
    ['band', 'Ivory band'],
    ['ticker', 'Ticker'],
    ['cms-row', 'CMS: row'],
    ['cms-rules', 'CMS: hairlines'],
    ['cms-band', 'CMS: band'],
  ];
  // share of homepage views reaching at least x% scroll depth
  var CURVES = {
    desktop: [[0, 100], [5, 98.3], [10, 66.5], [15, 41.6], [20, 37.6], [30, 25.9], [50, 9.8], [75, 5.7], [90, 4.7], [100, 4]],
    mobile: [[0, 100], [5, 98], [10, 44.2], [15, 38.8], [20, 34.8], [30, 17.6], [50, 7.8], [75, 3.05], [90, 1.38], [100, 1]],
  };

  var params = new URLSearchParams(location.search);
  function pick(list, value, fallback) {
    return list.some(function (entry) {
      return entry[0] === value;
    })
      ? value
      : fallback;
  }
  var state = {
    placement: pick(PLACEMENTS, params.get('p'), 'claim'),
    treatment: pick(TREATMENTS, params.get('s'), 'row'),
    chrome: params.get('chrome') !== '0',
  };
  var strip = null;

  function writeUrl() {
    var next = new URLSearchParams();
    next.set('p', state.placement);
    next.set('s', state.treatment);
    if (!state.chrome) next.set('chrome', '0');
    history.replaceState(null, '', location.pathname + '?' + next.toString());
  }

  function interpolate(curve, depth) {
    for (var i = 1; i < curve.length; i++) {
      if (depth <= curve[i][0]) {
        var a = curve[i - 1];
        var b = curve[i];
        return a[1] + ((depth - a[0]) / (b[0] - a[0])) * (b[1] - a[1]);
      }
    }
    return curve[curve.length - 1][1];
  }

  function reach() {
    if (state.placement === 'sticky') {
      return innerWidth >= 1260
        ? 'Sticky bar: every desktop view ≥ 1260 px until it is closed (7 days). Phones and tablets: not shown, they keep the strip at the bottom.'
        : 'Sticky bar exists on desktop ≥ 1260 px only. At this width nobody sees it.';
    }
    if (!strip) return '';
    var device = innerWidth < 980 ? 'mobile' : 'desktop';
    var top = strip.getBoundingClientRect().top + scrollY;
    var seenAt = top + Math.min(strip.offsetHeight, 90);
    var depth = Math.min(100, ((seenAt) / document.documentElement.scrollHeight) * 100);
    var screens = top / innerHeight;
    var share = seenAt <= innerHeight ? interpolate(CURVES[device], 0) : interpolate(CURVES[device], depth);
    return (
      'Starts ' + screens.toFixed(1) + ' screens down (' + depth.toFixed(0) + '% of the page). ' +
      'Roughly ' + Math.round(share) + '% of ' + device + ' homepage views get this far (Clarity, 12–14 Oct).'
    );
  }

  // ---- bar ---------------------------------------------------------------
  var bar = document.createElement('div');
  bar.className = 'press-review';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Prototype options');

  function group(title, list, key) {
    var wrap = document.createElement('div');
    wrap.className = 'press-review__group';
    var label = document.createElement('span');
    label.className = 'press-review__title';
    label.textContent = title;
    wrap.appendChild(label);
    var row = document.createElement('div');
    row.className = 'press-review__options';
    list.forEach(function (entry) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = entry[1];
      button.dataset.key = key;
      button.dataset.value = entry[0];
      button.addEventListener('click', function () {
        state[key] = entry[0];
        apply(true);
      });
      row.appendChild(button);
    });
    wrap.appendChild(row);
    return wrap;
  }

  bar.appendChild(group('Placement', PLACEMENTS, 'placement'));
  bar.appendChild(group('Treatment', TREATMENTS, 'treatment'));

  var foot = document.createElement('div');
  foot.className = 'press-review__foot';
  var readout = document.createElement('p');
  readout.className = 'press-review__reach';
  var show = document.createElement('button');
  show.type = 'button';
  show.className = 'press-review__show';
  show.textContent = 'Show it';
  show.addEventListener('click', scrollToStrip);
  var hide = document.createElement('button');
  hide.type = 'button';
  hide.className = 'press-review__hide';
  hide.setAttribute('aria-label', 'Hide options (H)');
  hide.textContent = '–';
  hide.addEventListener('click', function () {
    state.chrome = false;
    syncChrome();
  });
  foot.appendChild(readout);
  foot.appendChild(show);
  foot.appendChild(hide);
  bar.appendChild(foot);

  var pill = document.createElement('button');
  pill.type = 'button';
  pill.className = 'press-review-pill';
  pill.textContent = 'Options';
  pill.addEventListener('click', function () {
    state.chrome = true;
    syncChrome();
  });

  function scrollToStrip() {
    var target = state.placement === 'sticky' ? null : strip;
    if (!target) return;
    var top = target.getBoundingClientRect().top + scrollY - innerHeight * 0.3;
    scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  function syncButtons() {
    Array.prototype.forEach.call(bar.querySelectorAll('button[data-key]'), function (button) {
      var on = state[button.dataset.key] === button.dataset.value;
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      button.disabled = button.dataset.key === 'treatment' && state.placement === 'sticky';
    });
  }

  function syncChrome() {
    bar.hidden = !state.chrome;
    pill.hidden = state.chrome;
    writeUrl();
  }

  function updateReach() {
    readout.textContent = reach();
  }

  function apply(scroll) {
    strip = window.PressStrip.render(state);
    syncButtons();
    writeUrl();
    requestAnimationFrame(updateReach);
    if (scroll) scrollToStrip();
  }

  function cycle(list, key) {
    var i = list.findIndex(function (entry) {
      return entry[0] === state[key];
    });
    state[key] = list[(i + 1) % list.length][0];
    apply(true);
  }

  document.addEventListener('keydown', function (event) {
    if (event.target.closest('input, textarea, [contenteditable]') || event.metaKey || event.ctrlKey) return;
    var k = event.key.toLowerCase();
    if (k === 'p') cycle(PLACEMENTS, 'placement');
    if (k === 's' && state.placement !== 'sticky') cycle(TREATMENTS, 'treatment');
    if (k === 'h') {
      state.chrome = !state.chrome;
      syncChrome();
    }
  });

  var pending = null;
  function later() {
    clearTimeout(pending);
    pending = setTimeout(updateReach, 150);
  }

  // Production's Vue app re-renders the page in place after DOMContentLoaded;
  // anything inserted before that is replaced by a copy. Start after load.
  function start() {
    document.body.appendChild(bar);
    document.body.appendChild(pill);
    window.PressStrip.preload().then(function () {
      apply(false);
    });
    syncChrome();
    addEventListener('resize', later);
    // lazy rails above the strip change its position as they arrive
    new ResizeObserver(later).observe(document.body);
  }

  if (document.readyState === 'complete') start();
  else addEventListener('load', start);
})();
