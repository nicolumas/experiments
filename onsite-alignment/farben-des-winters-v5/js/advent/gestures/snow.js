/* Brush off the snow, made for a finger: the snow under it gives at once and throws powder; brush far enough over a
   clump (or flick) and it slides off the way you brushed; a tap knocks off the clump under the finger. One swipe
   down through the work clears it all; three taps do too. */
(function () {
  'use strict';
  const { register, util } = window.GAL.gestures;
  const { cover, away, pointer, deferred, burst } = util;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* no haptics here */ } };

  register('snow', (o) => {
    const { w, h } = o.rect;
    const bands = [0, 1, 2].map((i) => cover(o.host, 'g-snow', `top:${(i * 100) / 3 - (i ? 3 : 0)}%;height:${100 / 3 + (i ? 3 : 0) + (i < 2 ? 3 : 0)}%`));
    const opened = deferred();
    /* brush this far over a clump and it goes */
    const KNOCK = Math.max(28, Math.min(w, h) * 0.12);
    let off = null;
    let drag = null;
    const live = () => bands.filter((b) => b.isConnected && !b.dataset.falling);
    const bandAt = (y) => live().find((b) => y >= b.offsetTop && y < b.offsetTop + b.offsetHeight) || null;
    const powder = (x, y, n, dir = 0) => burst(o.host, 'g-puff', n, { x, y }, () => [dir * (20 + Math.random() * 30) + (Math.random() - 0.5) * 36, -8 - Math.random() * 30, 0.5 + Math.random() * 0.5]);

    /* the snow under the finger gives a little; let go and it settles back */
    const give = (b, dx, dy) => { b.style.transition = 'none'; b.style.transform = `translate(${clamp(dx * 0.3, -16, 16)}px, ${clamp(dy * 0.3, -6, 12)}px)`; };
    const settle = (b) => {
      if (!b || b.dataset.falling) return;
      b.style.transition = 'transform 260ms cubic-bezier(.2, .8, .2, 1)';
      b.style.transform = '';
    };
    /* a clump goes the way the hand went: to the side for a sideways brush, down for a tap or a downward swipe */
    const knock = (b, dx, dy) => {
      const side = Math.abs(dx) > Math.abs(dy) * 0.8 ? (dx > 0 ? 'right' : 'left') : 'down';
      const sx = side === 'right' ? 1 : side === 'left' ? -1 : 0;
      b.dataset.falling = side;
      const from = getComputedStyle(b).transform;
      away(b, [
        { transform: from === 'none' ? 'translate(0px, 0px)' : from, opacity: 1 },
        { transform: `translate(${sx ? sx * w * 1.1 : clamp(dx, -40, 40)}px, ${sx ? h * 0.3 : h * 1.3}px) rotate(${sx ? sx * 12 : dx >= 0 ? 6 : -6}deg)`, opacity: 0 },
      ], 440);
      const y = b.offsetTop + b.offsetHeight * 0.6;
      burst(o.host, 'g-puff', 14, (i) => ({ x: ((i + 0.5) / 14) * w, y }), () => [(sx || Math.random() - 0.5) * (30 + Math.random() * 60), -10 - Math.random() * 50, 0.8 + Math.random() * 0.8]);
      buzz(12);
      if (!live().length) opened.resolve();
    };
    const fall = (el, k) => away(el, [
      { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
      { transform: `translateY(18px) rotate(${k % 2 ? -3 : 3}deg)`, opacity: 1, offset: 0.25 },
      { transform: `translateY(${h * 1.4}px) rotate(${k % 2 ? -8 : 8}deg)`, opacity: 0 },
    ], 520);

    return {
      activate() {
        off = pointer(o.host, {
          down: (p) => {
            drag = { x0: p.x, y0: p.y, x: p.x, y: p.y, b: bandAt(p.y), bx: p.x, by: p.y, path: 0 };
            if (drag.b) powder(p.x, p.y, 3);
          },
          move: (p) => {
            if (!drag) return;
            const b = bandAt(p.y);
            if (b !== drag.b) { settle(drag.b); drag.b = b; drag.bx = drag.x; drag.by = drag.y; drag.path = 0; }
            const step = Math.hypot(p.x - drag.x, p.y - drag.y);
            const dir = Math.sign(p.x - drag.x);
            drag.path += step;
            drag.x = p.x;
            drag.y = p.y;
            if (!b) return;
            give(b, p.x - drag.bx, p.y - drag.by);
            if (step > 2 && Math.random() < 0.6) powder(p.x, p.y, 2, dir);
            if (drag.path > KNOCK) { knock(b, p.x - drag.bx, p.y - drag.by); drag.b = null; drag.path = 0; }
          },
          up: (p) => {
            if (!drag) return;
            if (Math.hypot(p.x - drag.x0, p.y - drag.y0) < 10) { const b = bandAt(p.y); if (b) knock(b, 0, 1); } else settle(drag.b);
            drag = null;
          },
        });
        return opened.promise;
      },
      finish: () => Promise.all(live().map((b, k) => fall(b, k))).then(() => new Promise((r) => setTimeout(r, 560 / (window.GAL.SPEED || 1)))),
      destroy() { if (off) off(); bands.forEach((b) => b.remove()); },
    };
  });
})();
