/* LUMAS Advisory prototype — shared behaviour (rebuilt 2026-08-03)
   Event stubs map 1:1 to GA4/ABlyft goals; console-only in prototype mode. */
(function () {
  'use strict';

  // ── Event stub layer ──────────────────────────────────
  function track(event, params) {
    (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: event }, params || {}));
    if (console && console.info) console.info('[track]', event, params || {});
  }
  window.track = track;

  // ── ?v= variant switch (control | v1 | v2 …) ───────────
  var variant = new URLSearchParams(location.search).get('v') || 'control';
  document.documentElement.setAttribute('data-variant', variant);

  document.addEventListener('DOMContentLoaded', function () {
    // Goal / CTA tracking
    document.querySelectorAll('[data-goal]').forEach(function (el) {
      el.addEventListener('click', function () {
        track(el.getAttribute('data-goal'), {
          cta: el.getAttribute('data-cta') || null,
          advisor: el.getAttribute('data-advisor') || null,
          variant: variant
        });
      });
    });

    // ── Carousels ────────────────────────────────────────
    document.querySelectorAll('[data-carousel]').forEach(function (root) {
      var track_ = root.querySelector('.carousel__track');
      var prev = root.querySelector('.carousel__btn--prev');
      var next = root.querySelector('.carousel__btn--next');
      var count = root.querySelector('[data-count]');
      if (!track_) return;
      var slides = Array.prototype.slice.call(track_.querySelectorAll('.slide'));

      function step() {
        var s = slides[0];
        if (!s) return track_.clientWidth * 0.8;
        var gap = parseFloat(getComputedStyle(track_).columnGap || getComputedStyle(track_).gap || '24') || 24;
        return s.getBoundingClientRect().width + gap;
      }
      function currentIndex() {
        return Math.round(track_.scrollLeft / step());
      }
      function update() {
        var i = currentIndex();
        var atEnd = track_.scrollLeft + track_.clientWidth >= track_.scrollWidth - 4;
        if (prev) prev.disabled = i <= 0;
        if (next) next.disabled = atEnd;
        if (count) count.textContent = String(Math.min(i + 1, slides.length)).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
      }
      if (prev) prev.addEventListener('click', function () { track_.scrollBy({ left: -step(), behavior: 'smooth' }); track('carousel_prev', { id: root.getAttribute('data-carousel') }); });
      if (next) next.addEventListener('click', function () { track_.scrollBy({ left: step(), behavior: 'smooth' }); track('carousel_next', { id: root.getAttribute('data-carousel') }); });
      track_.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
      window.addEventListener('resize', update);
      update();
    });

    // ── Enquiry modal ────────────────────────────────────
    var dlg = document.getElementById('enquiry');
    if (dlg) {
      var openModal = function (cta) {
        if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
        track('trade_enquiry_open', { cta: cta || null, variant: variant });
      };
      document.querySelectorAll('[data-open-enquiry]').forEach(function (b) {
        b.addEventListener('click', function () { openModal(b.getAttribute('data-cta')); });
      });
      dlg.querySelectorAll('[data-close-enquiry]').forEach(function (b) {
        b.addEventListener('click', function () { dlg.close(); });
      });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); }); // backdrop click
      var form = dlg.querySelector('[data-enquiry-form]');
      var success = dlg.querySelector('.modal__success');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!form.checkValidity()) { form.reportValidity(); return; }
          var type = form.querySelector('[name="type"]');
          track('trade_enquiry_submit', { variant: variant, type: type ? type.value : null });
          form.hidden = true;
          if (success) success.hidden = false;
        });
      }
      dlg.addEventListener('close', function () { // restore the form after a completed submission
        if (form && success && success.hidden === false) { form.reset(); form.hidden = false; success.hidden = true; }
      });
    }

    // ── Reveal on scroll (reveal in-view immediately) ─────
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    var vh = window.innerHeight || document.documentElement.clientHeight;
    reveals.forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.95) el.classList.add('in');
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      reveals.forEach(function (el) { if (!el.classList.contains('in')) io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('in'); });
    }
  });
})();
