/* Tear the paper: the work is wrapped like a present; drag across and the paper tears down the middle and falls open. */
(function () {
  'use strict';
  const { register, util } = window.GAL.gestures;
  const { cover, away, pointer, deferred } = util;

  register('paper', (o) => {
    const { w } = o.rect;
    const L = cover(o.host, 'g-paper g-paper-l');
    const R = cover(o.host, 'g-paper g-paper-r');
    const opened = deferred();
    let start = null;
    let off = null;
    const part = (k) => {
      const d = k * w * 0.18;
      L.style.transform = `translateX(${-d}px) rotate(${-k * 4}deg)`;
      R.style.transform = `translateX(${d}px) rotate(${k * 4}deg)`;
    };
    return {
      activate() {
        off = pointer(o.host, {
          down: (p) => { start = p; },
          move: (p) => {
            if (!start) return;
            const k = Math.min(1, Math.abs(p.x - start.x) / (w * 0.6));
            part(k);
            if (k >= 1) opened.resolve();
          },
          up: () => { start = null; if (L.isConnected) { L.style.transition = R.style.transition = 'transform 320ms cubic-bezier(.2,.8,.2,1)'; part(0); setTimeout(() => { L.style.transition = R.style.transition = ''; }, 340); } },
        });
        return opened.promise;
      },
      finish: () => Promise.all([
        away(L, [{ transform: L.style.transform || 'none', opacity: 1 }, { transform: `translate(${-w * 0.7}px, 60px) rotate(-24deg)`, opacity: 0 }]),
        away(R, [{ transform: R.style.transform || 'none', opacity: 1 }, { transform: `translate(${w * 0.7}px, 60px) rotate(24deg)`, opacity: 0 }]),
      ]),
      destroy() { if (off) off(); L.remove(); R.remove(); },
    };
  });
})();
