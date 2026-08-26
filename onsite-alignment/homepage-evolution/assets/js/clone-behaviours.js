/**
 * LUMAS homepage clone - behaviour layer.
 *
 * The clone ships the real markup and the real stylesheets, but none of the shop's
 * webpack bundles. This file re-implements the interactions those bundles provided,
 * matching the original configuration where it is known:
 *   - hero stage: slick with {arrows:true, autoplay:true, autoplaySpeed:4000}
 *   - product rails: native overflow-x scrollers driven by .prev/.next buttons
 *   - accordeon carousel (Top 20 artists), edition finder chips, promo banner, back-to-top
 */
(function () {
  'use strict';

  var TRANSITION_MS = 300; // slick default `speed`

  /* ------------------------------------------------------------------ helpers */

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function parseSlickConfig(el) {
    var raw = el.getAttribute('data-slick');
    if (!raw) return {};
    try { return JSON.parse(raw); } catch (e) { return {}; }
  }

  /* --------------------------------------------------------------- hero stage */

  /**
   * The page ships two hero stages - a desktop one (.hidden-xs.hidden-sm) and a mobile one
   * (.hidden-md.hidden-lg). Only the visible one was slick-initialised when the DOM was
   * captured, so the other arrives as bare slides that would otherwise stack vertically.
   * Rebuild the slick scaffolding for any stage that declares itself a slider but has none.
   */
  function ensureStageMarkup(root) {
    if (root.querySelector('.slick-list')) return;
    if (root.getAttribute('data-overflow') !== 'slider') return;
    var slides = Array.prototype.slice.call(root.children);
    if (slides.length < 2) return;

    var list = document.createElement('div');
    list.className = 'slick-list draggable';
    var track = document.createElement('div');
    track.className = 'slick-track';
    list.appendChild(track);

    slides.forEach(function (s, i) {
      s.className = (s.className ? s.className + ' ' : '') + 'slick-slide';
      s.setAttribute('data-slick-index', String(i));
      track.appendChild(s);
    });

    function arrow(dir, label) {
      var b = document.createElement('button');
      b.className = 'slick-' + dir + ' slick-arrow';
      b.type = 'button';
      b.setAttribute('aria-label', label);
      b.textContent = label;
      return b;
    }

    root.innerHTML = '';
    if (root.getAttribute('data-navigation') === 'arrows') root.appendChild(arrow('prev', 'Previous'));
    root.appendChild(list);
    if (root.getAttribute('data-navigation') === 'arrows') root.appendChild(arrow('next', 'Next'));
    root.classList.add('slick-initialized', 'slick-slider');
  }

  /**
   * Rebuild one slick stage as a working infinite carousel.
   *
   * Only the hero qualifies: it is the single slider on the page that ships arrows and
   * an autoplay config, and the only one whose captured transform is non-zero. Every
   * other .slick-slider is a multi-item tile row already sitting at offset 0 with its
   * own per-slide widths - touching those would destroy their layout.
   */
  function initStage(root) {
    var list = root.querySelector('.slick-list');
    var track = root.querySelector('.slick-track');
    var prev = root.querySelector('.slick-prev');
    var next = root.querySelector('.slick-next');
    if (!list || !track || !prev || !next) return;

    var real = Array.prototype.filter.call(
      track.querySelectorAll('.slick-slide'),
      function (s) { return !s.classList.contains('slick-cloned'); }
    );
    if (real.length < 2) return;

    var cfg = parseSlickConfig(root);
    // the slide width the shop rendered with, before we touch anything
    var slideW = real[0].getBoundingClientRect().width || list.clientWidth;

    var slides = real.map(function (s) {
      s.className = 'text-center slick-slide';
      s.removeAttribute('aria-hidden');
      return s;
    });

    // How many slides share the viewport. The shop declares this on the element as
    // data-columns, which is authoritative - measuring instead is unreliable, because a
    // freshly scaffolded track lets its slides share the width before any layout runs,
    // and a hidden stage measures 0 (an unguarded ratio there is Infinity, which would
    // spin the clone loop below forever).
    var declared = parseInt(root.getAttribute('data-columns'), 10);
    var perView = declared > 0 ? declared : 1;
    if (!declared && slideW > 0 && list.clientWidth > 0) {
      perView = Math.max(1, Math.min(4, Math.round(list.clientWidth / slideW)));
    }
    track.innerHTML = '';
    var lead = [], trail = [];
    for (var i = 0; i < perView; i++) {
      var l = slides[slides.length - 1 - (i % slides.length)].cloneNode(true);
      var t = slides[i % slides.length].cloneNode(true);
      l.classList.add('slick-cloned');
      t.classList.add('slick-cloned');
      lead.unshift(l);
      trail.push(t);
    }
    var all = lead.concat(slides, trail);
    all.forEach(function (s) { track.appendChild(s); });

    var first = lead.length;    // index of the first real slide
    var index = first;
    var width = slideW;
    var animating = false;

    function layout() {
      // a hidden stage measures 0; it re-lays out on resize once it becomes visible
      width = list.clientWidth ? list.clientWidth / perView : 0;
      track.style.width = (width * all.length) + 'px';
      all.forEach(function (s) { s.style.width = width + 'px'; });
      position(false);
    }

    function position(animate) {
      track.style.transition = animate ? ('transform ' + TRANSITION_MS + 'ms ease') : 'none';
      track.style.transform = 'translate3d(' + (-index * width) + 'px, 0px, 0px)';
      all.forEach(function (s, i) {
        s.classList.toggle('slick-current', i === index);
        s.classList.toggle('slick-active', i === index);
      });
    }

    function go(delta) {
      if (animating) return;
      animating = true;
      index += delta;
      position(true);
      window.setTimeout(function () {
        // jump from a clone back onto the matching real slide, without animating
        if (index < first) { index += slides.length; position(false); }
        else if (index >= first + slides.length) { index -= slides.length; position(false); }
        animating = false;
      }, TRANSITION_MS);
    }

    prev.addEventListener('click', function (e) { e.preventDefault(); go(-1); });
    next.addEventListener('click', function (e) { e.preventDefault(); go(1); });

    // autoplay, paused while the pointer is over the stage (slick's pauseOnHover default)
    var timer = null;
    function start() {
      if (cfg.autoplay === false || slides.length < 2) return;
      stop();
      timer = window.setInterval(function () { go(1); }, cfg.autoplaySpeed || 4000);
    }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);

    window.addEventListener('resize', layout);
    layout();
    start();
  }

  /* ------------------------------------------------------- product rails etc. */

  // the accordeon rail keeps its arrows inside the scroller, so they must never be
  // mistaken for a content card when measuring the scroll step
  function railItems(scroller) {
    return Array.prototype.filter.call(scroller.children, function (c) {
      return !/arrow|(^|\s)(prev|next)(\s|$)/.test((c.className || '').toString());
    });
  }

  function scrollerStep(scroller) {
    var items = railItems(scroller);
    var w = items.length ? items[0].getBoundingClientRect().width : 0;
    if (!w) return Math.round(scroller.clientWidth * 0.8);
    // advance by whole cards, but never more than one viewport of the rail
    var perView = Math.max(1, Math.floor(scroller.clientWidth / w));
    return Math.min(Math.round(w * perView), scroller.clientWidth);
  }

  function wireScroller(scroller, prev, next) {
    if (!scroller) return;

    // The shop ships .prev disabled and toggles both ends as the rail scrolls;
    // without that the buttons stay stuck in their server-rendered state.
    function sync() {
      var max = scroller.scrollWidth - scroller.clientWidth - 2;
      if (prev && 'disabled' in prev) prev.disabled = scroller.scrollLeft <= 2;
      if (next && 'disabled' in next) next.disabled = scroller.scrollLeft >= max;
    }

    function by(dir) {
      scroller.scrollBy({ left: dir * scrollerStep(scroller), behavior: 'smooth' });
    }

    if (prev) prev.addEventListener('click', function (e) { e.preventDefault(); by(-1); });
    if (next) next.addEventListener('click', function (e) { e.preventDefault(); by(1); });

    var raf = null;
    scroller.addEventListener('scroll', function () {
      if (raf) return;
      raf = window.requestAnimationFrame(function () { raf = null; sync(); });
    }, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  function initProductRails() {
    document.querySelectorAll('.product-carousel-container').forEach(function (wrap) {
      var scroller = wrap.querySelector('.product-carousel');
      // .prev/.next are direct controls of this rail, not buttons inside a card
      var prev = wrap.querySelector(':scope > button.prev, :scope > .prev');
      var next = wrap.querySelector(':scope > button.next, :scope > .next');
      wireScroller(scroller, prev, next);
    });
  }

  function initAccordeonCarousels() {
    document.querySelectorAll('accordeon-carousel').forEach(function (acc) {
      wireScroller(
        acc.querySelector('.carousel-list'),
        acc.querySelector('.carousel-arrow-left'),
        acc.querySelector('.carousel-arrow-right')
      );
    });
  }

  /* ----------------------------------------------------------- edition finder */

  function initEditionFinder() {
    document.querySelectorAll('edition-finder').forEach(function (ef) {
      ef.querySelectorAll('.chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          // one selection per step group
          var group = chip.parentElement;
          group.querySelectorAll('.chip').forEach(function (c) {
            if (c !== chip) c.setAttribute('aria-pressed', 'false');
          });
          var on = chip.getAttribute('aria-pressed') === 'true';
          chip.setAttribute('aria-pressed', on ? 'false' : 'true');
        });
      });
    });
  }

  /* ----------------------------------------------------------------- chrome  */

  /**
   * The shop's <site-header> writes its own `desktop` / `mobile` class at runtime, and
   * site-header.css scopes the mobile chrome to max-width:1024px. The captured DOM is a
   * desktop render, so without this the header stays in desktop mode on a phone and its
   * mega-menu overflows the viewport.
   */
  function initResponsiveHeader() {
    var header = document.querySelector('site-header');
    if (!header) return;
    var mq = window.matchMedia('(max-width: 1024px)');
    function apply() {
      header.classList.toggle('mobile', mq.matches);
      header.classList.toggle('desktop', !mq.matches);
    }
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else if (mq.addListener) mq.addListener(apply);
    apply();
  }

  function markCssReady() {
    // these components stay visibility:hidden until their own JS flags the css as loaded
    document.querySelectorAll('[data-css-path]').forEach(function (el) {
      el.setAttribute('data-css-ready', '');
    });
  }

  function initPromoBanner() {
    document.querySelectorAll('promotion-banner .close').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var banner = btn.closest('promotion-banner');
        if (banner) banner.style.display = 'none';
      });
    });
  }

  function initBackToTop() {
    var btn = document.querySelector('.btn-back-top');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function initStickyFooterClose() {
    document.querySelectorAll('.sticky-footer .close, .sticky-footer [class*="close"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var bar = btn.closest('.sticky-footer');
        if (bar) bar.classList.remove('show');
      });
    });
  }

  /* -------------------------------------------------------------------- boot */

  ready(function () {
    markCssReady();
    initResponsiveHeader();
    // give the hidden (mobile/desktop counterpart) hero its slick scaffolding first,
    // then rebuild only sliders that ship their own arrow controls
    document.querySelectorAll('.block-tiles.stage').forEach(ensureStageMarkup);
    document.querySelectorAll('.slick-slider').forEach(initStage);
    initProductRails();
    initAccordeonCarousels();
    initEditionFinder();
    initPromoBanner();
    initBackToTop();
    initStickyFooterClose();
    document.documentElement.classList.add('clone-ready');
  });
})();
