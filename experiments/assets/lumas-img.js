/* ============================================================
   LumasImg — shared img.lumas.com URL helper for prototypes
   Vanilla JS, no modules: attaches to window.LumasImg.

   Usage:  <script src="assets/lumas-img.js"></script>
           img.src = LumasImg.full('ime125');

   Known gotchas (hard-won — do not re-derive per prototype):
   - image code ≠ SKU. The bare-image code is the lowercase id in
     showimg_<code>_*.jpg and is often SKU-1 or unrelated (e.g. SKU
     IME119 → code ime117). The real feed's hiResImage carries the
     working code; abstractId is a third, numeric id.
   - codes are LOWERCASE. showimg_IME125_full.jpg 403s.
   - newer/licensed works 403 on _full (and often _desktop). Always
     cull on error or pre-verify; prototype/assets/artworks.verified.json
     holds a pre-checked manifest.
   - the CDN rate-limits bursts: rapid-fire HEADs start returning
     nothing (curl code 000). When verifying many codes, go
     sequentially with ~0.3s delays and back off on failures.
   - framed fallback: the shop's image-with-default-frame endpoint
     needs abstractId AND sku, loads cross-origin with no referer
     check — reliable hotlink when the bare image 403s.
   - framed fallback is STORE-BOUND: abstractIds only resolve on the
     store whose feed they came from (verified 2026-07-17: DE ids
     return 500 on lumas.com, 200 on lumas.de). Default store here is
     'de' (what most prototypes use); pass framed(id, sku, 'com') or
     call LumasImg.setStore('com') when using COM-feed ids.
   ============================================================ */
(function () {
  'use strict';

  var BARE_BASE = 'https://img.lumas.com/showimg_';
  var FRAMED_PATH = '/product/image-with-default-frame/';
  var STORE_HOSTS = {
    de: 'www.lumas.de',
    com: 'www.lumas.com',
    eu: 'eu.lumas.com',
    fr: 'fr.lumas.com',
    at: 'at.lumas.com',
    ch: 'ch.lumas.com',
    uk: 'uk.lumas.com',
    hu: 'hu.lumas.com'
  };
  var defaultStore = 'de';

  function norm(code) {
    return String(code).trim().toLowerCase();
  }

  var LumasImg = {
    /** Bare artwork image, largest size. 403s for newer/licensed works. */
    full: function (code) {
      return BARE_BASE + norm(code) + '_full.jpg';
    },

    /** Bare artwork image, desktop size (also _mobile, _xl exist). */
    desktop: function (code) {
      return BARE_BASE + norm(code) + '_desktop.jpg';
    },

    /** Any size variant: 'full' | 'desktop' | 'mobile' | 'xl'. */
    sized: function (code, size) {
      return BARE_BASE + norm(code) + '_' + (size || 'full') + '.jpg';
    },

    /**
     * Set the default store for framed() (e.g. 'com' when working
     * with COM-feed abstractIds). Returns LumasImg for chaining.
     */
    setStore: function (store) {
      if (STORE_HOSTS[store]) defaultStore = store;
      return LumasImg;
    },

    /**
     * Framed edition render from the shop. Needs BOTH the numeric
     * abstractId and the (uppercase) SKU. No referer check — safe to
     * hotlink from prototypes. STORE-BOUND: the abstractId must come
     * from the same store's feed (DE ids 500 on lumas.com). Optional
     * third arg overrides the default store ('de').
     */
    framed: function (abstractId, sku, store) {
      var host = STORE_HOSTS[store] || STORE_HOSTS[defaultStore];
      return 'https://' + host + FRAMED_PATH +
        '?abstractId=' + encodeURIComponent(abstractId) +
        '&sku=' + encodeURIComponent(sku);
    },

    /**
     * Standard mitigation for 403ing codes: hide/remove the <img> (and
     * optionally its wrapper) when it fails to load.
     *   LumasImg.cull(img);                          // removes the img
     *   LumasImg.cull(img, { onFail: fn });          // custom handler
     *   LumasImg.cull(img, { closest: '.tile' });    // removes wrapper
     */
    cull: function (imgEl, opts) {
      opts = opts || {};
      imgEl.addEventListener('error', function handler() {
        imgEl.removeEventListener('error', handler);
        if (typeof opts.onFail === 'function') {
          opts.onFail(imgEl);
          return;
        }
        var target = opts.closest ? (imgEl.closest(opts.closest) || imgEl) : imgEl;
        if (target.remove) target.remove();
        else target.style.display = 'none';
      });
      return imgEl;
    },

    /**
     * Runtime check: does this code's _full image load? Resolves boolean.
     * Uses an Image() probe (HEAD via fetch is blocked by CORS on
     * img.lumas.com). Add delays between calls when checking many codes
     * — the CDN rate-limits bursts.
     */
    verify: function (code) {
      return new Promise(function (resolve) {
        var probe = new Image();
        probe.onload = function () { resolve(true); };
        probe.onerror = function () { resolve(false); };
        probe.src = LumasImg.full(code);
      });
    }
  };

  window.LumasImg = LumasImg;
})();
