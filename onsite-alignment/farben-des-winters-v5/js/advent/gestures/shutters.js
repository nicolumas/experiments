/* Open the shutters: two wooden shutters in front of the gallery window; tap each and it swings open. */
(function () {
  'use strict';
  const { register, util } = window.GAL.gestures;
  const { cover, away, deferred } = util;

  register('shutters', (o) => {
    const opened = deferred();
    let open = 0;
    /* behind the work (z -1 inside an isolated host), so it only ever shows around its edges */
    o.host.style.isolation = 'isolate';
    const spill = document.createElement('div');
    spill.className = 'g-spill';
    o.host.prepend(spill);
    const leaves = ['l', 'r'].map((side) => {
      const el = cover(o.host, `g-shutter g-shutter-${side}`);
      el.setAttribute('data-shutter', '');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', o.lang === 'en' ? 'Shutter' : 'Fensterladen');
      el.tabIndex = -1;
      el.addEventListener('click', () => {
        if (el.tabIndex < 0 || el.classList.contains('open')) return;
        el.classList.add('open');
        spill.classList.add('on');
        if (++open === 2) opened.resolve();
      });
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
      return el;
    });
    return {
      activate() { leaves.forEach((el) => { el.tabIndex = 0; }); return opened.promise; },
      finish() {
        leaves.forEach((el) => el.classList.add('open'));
        return new Promise((r) => setTimeout(r, 520 / (window.GAL.SPEED || 1))).then(() => Promise.all(leaves.map((el) => away(el, [{ opacity: 1 }, { opacity: 0 }], 220))));
      },
      destroy() {
        leaves.forEach((el) => el.remove());
        away(spill, [{ opacity: 1 }, { opacity: 0 }], 900);
      },
    };
  });
})();
