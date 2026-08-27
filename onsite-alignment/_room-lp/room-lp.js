/* ============================================================================
   LUMAS "Art by room" landing pages — shared behaviour

   One job only: keep --nav-h in sync with the real height of the fixed nav, so
   body padding and every anchor's scroll-margin land in the right place. The
   nav kit deliberately does not set it (see prototype/_nav/README.md).

   Safe to run alongside a page's own syncNavHeight(): both write the same
   measured value to the same custom property.
============================================================================ */
(function () {
  var header = document.querySelector('site-header');
  if (!header) return;

  function sync() {
    var h = header.getBoundingClientRect().height;
    if (h > 0) document.documentElement.style.setProperty('--nav-h', h + 'px');
  }

  sync();
  window.addEventListener('load', sync);
  if (window.ResizeObserver) new ResizeObserver(sync).observe(header);
  else window.addEventListener('resize', sync);
})();
