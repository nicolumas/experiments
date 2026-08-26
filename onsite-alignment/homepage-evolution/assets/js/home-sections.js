/**
 * LUMAS homepage - new sections, progressive enhancement.
 *
 * The sections are rendered as static HTML at build time and are fully usable with this
 * file absent: every tool is a real link, every room tile is a link, the sold rail is a
 * native scroller. This layer only adds the motion that makes the tool visuals explain
 * themselves, and it does nothing at all when the user prefers reduced motion.
 *
 * The "artworks just sold" rail deliberately has no code here: it reuses the shop's
 * .product-carousel-container markup, so clone-behaviours.js already drives its arrows,
 * scroll stepping and disabled states.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  /**
   * Run a callback the first time an element is meaningfully on screen, and tell it
   * whenever the element leaves or re-enters, so animations never burn CPU off-screen.
   */
  function whenVisible(el, onEnter, onLeave) {
    if (!('IntersectionObserver' in window)) { onEnter(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) onEnter();
        else if (onLeave) onLeave();
      });
    }, { threshold: 0.25 });
    io.observe(el);
  }

  /* ------------------------------------------------- Art Finder: mood moving across art */

  function initMood(visual) {
    var arts = visual.querySelectorAll('.lx-mood-art');
    var chips = visual.querySelectorAll('.lx-mood-chip');
    var thumb = visual.querySelector('.lx-mood-thumb');
    if (!arts.length) return;

    var steps = Math.max(arts.length, chips.length);
    var i = 0;
    var timer = null;

    function paint() {
      arts.forEach(function (a, n) { a.classList.toggle('is-active', n === i % arts.length); });
      chips.forEach(function (c, n) { c.classList.toggle('is-active', n === i % (chips.length || 1)); });
      if (thumb && chips.length > 1) {
        thumb.style.left = ((i % chips.length) / (chips.length - 1)) * 100 + '%';
      }
    }

    paint();
    if (reduceMotion) return;

    function start() {
      if (timer) return;
      timer = window.setInterval(function () { i += 1; paint(); }, 2200);
    }
    function stop() { window.clearInterval(timer); timer = null; }

    whenVisible(visual, start, stop);
    // pausing on hover lets someone actually read the mood they are looking at
    var card = visual.closest('.lx-tool');
    if (card) {
      card.addEventListener('mouseenter', stop);
      card.addEventListener('mouseleave', start);
    }
  }

  /* ---------------------------------------------------------- Art Cloud + Upload Room */

  /** Both of these are pure CSS animations gated on an `is-live` class. */
  function initOnScreenClass(visual) {
    if (reduceMotion) { visual.classList.add('is-live'); return; }
    whenVisible(
      visual,
      function () { visual.classList.add('is-live'); },
      function () { visual.classList.remove('is-live'); }
    );
  }

  /* --------------------------------------------------------- sold timestamps, humanised */

  /**
   * The shop renders absolute timestamps ("sold on 08/25/2026 21:05"). Relative phrasing
   * reads better and keeps the section feeling live, but only when the parse is certain -
   * otherwise the original text is left exactly as the server wrote it.
   */
  function humaniseSoldTimes() {
    var now = Date.now();
    document.querySelectorAll('.lx-sold-time').forEach(function (el) {
      var raw = (el.getAttribute('datetime') || '').trim();
      var m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
      if (!m) return;
      var then = new Date(+m[3], +m[1] - 1, +m[2], +m[4], +m[5]);
      var mins = Math.floor((now - then.getTime()) / 60000);
      if (isNaN(mins) || mins < 0) return;

      var text;
      if (mins < 60) text = mins <= 1 ? 'just now' : mins + ' minutes ago';
      else if (mins < 1440) {
        var h = Math.round(mins / 60);
        text = h === 1 ? 'an hour ago' : h + ' hours ago';
      } else {
        var d = Math.round(mins / 1440);
        text = d === 1 ? 'yesterday' : d + ' days ago';
      }
      el.textContent = text;
      el.setAttribute('title', raw);
    });
  }

  /* -------------------------------------------------------------------------- boot */

  ready(function () {
    document.querySelectorAll('[data-lx-visual="mood"]').forEach(initMood);
    document.querySelectorAll('[data-lx-visual="cloud"], [data-lx-visual="room"]')
      .forEach(initOnScreenClass);
    humaniseSoldTimes();
    document.documentElement.classList.add('lx-ready');
  });
})();
