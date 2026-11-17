/* Light the Advent candle (Sundays): hold the candle until it burns, and the work warms into view out of the dark. */
(function () {
  'use strict';
  const { register, util } = window.GAL.gestures;
  const { cover, away, pointer, deferred } = util;

  register('candle', (o) => {
    const dark = cover(o.host, 'g-dark');
    const candle = document.createElement('div');
    candle.className = 'g-candle';
    candle.setAttribute('data-handle', '');
    candle.setAttribute('role', 'button');
    candle.setAttribute('aria-label', o.lang === 'en' ? 'Candle' : 'Kerze');
    candle.innerHTML = '<span class="g-flame"></span>';
    o.host.append(candle);
    let need = 1200;
    const opened = deferred();
    let t0 = 0;
    let raf = 0;
    let off = null;
    const spread = (r) => dark.style.setProperty('--r', r.toFixed(1));
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / need);
      candle.style.setProperty('--k', k.toFixed(3));
      spread(k * 30);
      if (k >= 1) { candle.classList.add('lit'); opened.resolve(); return; }
      raf = requestAnimationFrame(tick);
    };
    return {
      activate() {
        need = ((o.boost || 0) > 0.5 ? 800 : 1200) / (window.GAL.SPEED || 1);
        off = pointer(candle, {
          down: () => { t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); },
          up: () => { cancelAnimationFrame(raf); if (!candle.classList.contains('lit')) { candle.style.setProperty('--k', '0'); spread(0); } },
        });
        return opened.promise;
      },
      finish() {
        candle.classList.add('lit');
        candle.style.setProperty('--k', '1');
        /* the circle of light grows until the dark is gone */
        const from = parseFloat(dark.style.getPropertyValue('--r')) || 0;
        const ms = 1100 / (window.GAL.SPEED || 1);
        const t1 = performance.now();
        return new Promise((resolve) => {
          const grow = () => {
            const e = Math.min(1, (performance.now() - t1) / ms);
            spread(from + (160 - from) * (1 - Math.pow(1 - e, 3)));
            if (e < 1) requestAnimationFrame(grow);
            else Promise.all([away(dark, [{ opacity: 1 }, { opacity: 0 }], 220), away(candle, [{ opacity: 1 }, { opacity: 0 }], 520)]).then(resolve);
          };
          requestAnimationFrame(grow);
        });
      },
      destroy() { cancelAnimationFrame(raf); if (off) off(); candle.remove(); dark.remove(); },
    };
  });
})();
