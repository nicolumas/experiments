/* Brush off the snow: three swipes, and the snow slides off the work in clumps from the top (two with a good run). */
(function () {
  'use strict';
  const { register, util } = window.GAL.gestures;
  const { cover, away, pointer, deferred, burst } = util;

  register('snow', (o) => {
    const { w, h } = o.rect;
    const bands = [0, 1, 2].map((i) => cover(o.host, 'g-snow', `top:${(i * 100) / 3 - (i ? 3 : 0)}%;height:${100 / 3 + (i ? 3 : 0) + (i < 2 ? 3 : 0)}%`));
    let swipes = 3;
    let done = 0;
    let start = null;
    let off = null;
    const opened = deferred();
    const fall = (el, k) => away(el, [
      { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
      { transform: `translateY(18px) rotate(${k % 2 ? -3 : 3}deg)`, opacity: 1, offset: 0.25 },
      { transform: `translateY(${h * 1.4}px) rotate(${k % 2 ? -8 : 8}deg)`, opacity: 0 },
    ], 520);
    const swipe = () => {
      done++;
      const left = bands.filter((b) => b.isConnected && !b.dataset.falling);
      const n = done >= swipes ? left.length : Math.ceil(left.length / (swipes - done + 1));
      left.slice(0, n).forEach((b, k) => {
        b.dataset.falling = '1';
        fall(b, k);
        /* powder flies off the falling snow */
        const y = b.offsetTop + b.offsetHeight * 0.8;
        burst(o.host, 'g-puff', 12, (i) => ({ x: ((i + 0.5) / 12) * w, y }), () => [(Math.random() - 0.5) * 70, -20 - Math.random() * 50, 0.8 + Math.random() * 0.8]);
      });
      if (done >= swipes) opened.resolve();
    };
    return {
      activate() {
        swipes = (o.boost || 0) > 0.5 ? 2 : 3;
        off = pointer(o.host, {
          down: (p) => { start = p; },
          up: (p) => { if (start && (Math.abs(p.x - start.x) > w * 0.25 || Math.abs(p.y - start.y) > h * 0.25)) swipe(); start = null; },
        });
        return opened.promise;
      },
      finish: () => Promise.all(bands.filter((b) => b.isConnected && !b.dataset.falling).map((b, k) => fall(b, k))).then(() => new Promise((r) => setTimeout(r, 560 / (window.GAL.SPEED || 1)))),
      destroy() { if (off) off(); bands.forEach((b) => b.remove()); },
    };
  });
})();
