/* Wipe the snow off: one soft layer of snow over the work, wiped away where the finger goes, like snow off a window.
   The path is soft-edged and wider when the finger is quick; powder sprays off the way the hand is going. A tap
   clears a soft round patch. Once about half is clear the rest slides off. The touch area reaches a little past the
   work, so a swipe may start just outside it. */
(function () {
  'use strict';
  const { register, util } = window.GAL.gestures;
  const { cover, away, pointer, deferred, burst } = util;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const PAD = 28;   /* the touch area reaches this far past the work */
  const N = 24;     /* the grid that keeps count of what is clear */
  const NEED = 0.5; /* share of the work clear before the rest slides off */

  register('snow', (o) => {
    const { w, h } = o.rect;
    const el = cover(o.host, 'g-snowfield');
    const cv = document.createElement('canvas');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    el.append(cv);
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.scale(dpr, dpr);
    /* fresh snow: bright on top, a cool shade below, soft drifts and a few glints */
    const base = g.createLinearGradient(0, 0, 0, h);
    base.addColorStop(0, '#fbfdff');
    base.addColorStop(1, '#e6eef7');
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = (0.12 + Math.random() * 0.22) * Math.min(w, h);
      const shade = g.createRadialGradient(x, y + r * 0.25, 0, x, y + r * 0.25, r);
      shade.addColorStop(0, 'rgba(176,196,222,0.28)');
      shade.addColorStop(1, 'rgba(176,196,222,0)');
      g.fillStyle = shade;
      g.fillRect(x - r, y - r, r * 2, r * 2.5);
      const lit = g.createRadialGradient(x, y - r * 0.2, 0, x, y - r * 0.2, r * 0.8);
      lit.addColorStop(0, 'rgba(255,255,255,0.9)');
      lit.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = lit;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.fillStyle = 'rgba(255,255,255,0.95)';
    for (let i = 0; i < Math.round((w * h) / 1400); i++) { g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 0.6 + Math.random() * 0.9, 0, 6.2832); g.fill(); }

    const R = Math.max(26, Math.min(w, h) * 0.22);
    const left = new Float32Array(N * N).fill(1);
    const opened = deferred();
    let off = null;
    let pad = null;
    let last = null;
    let finishing = false;

    /* one soft stamp of the cloth: clear on the canvas, and in the count */
    const stamp = (x, y, r, s) => {
      const grad = g.createRadialGradient(x, y, 0, x, y, r * 1.2);
      grad.addColorStop(0, `rgba(0,0,0,${s})`);
      grad.addColorStop(0.5, `rgba(0,0,0,${s})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.save();
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = grad;
      g.fillRect(x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4);
      g.restore();
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const d = Math.hypot(((i + 0.5) / N) * w - x, ((j + 0.5) / N) * h - y) / r;
          if (d >= 1.2) continue;
          const f = d < 0.6 ? 1 : 1 - (d - 0.6) / 0.6;
          left[j * N + i] = Math.max(0, left[j * N + i] - s * f);
        }
      }
    };
    const clear = () => left.reduce((n, v) => n + (v < 0.2 ? 1 : 0), 0) / (N * N);
    const check = () => { if (!finishing && clear() >= NEED) { finishing = true; opened.resolve(); } };
    /* powder off the cloth, thrown the way the hand is going */
    const spray = (x, y, ux, uy, n) => burst(o.host, 'g-puff', n, () => ({ x: clamp(x + ux * R * 0.8 + (Math.random() - 0.5) * R, 0, w), y: clamp(y + uy * R * 0.8 + (Math.random() - 0.5) * R, 0, h) }),
      () => [ux * (40 + Math.random() * 70) + (Math.random() - 0.5) * 24, uy * (40 + Math.random() * 70) - 10 - Math.random() * 24, 0.6 + Math.random() * 0.8]);

    /* wipe from the last point to this one: stamps along the way, wider when quick */
    const wipe = (x, y, t) => {
      if (!last) { last = { x, y, t }; stamp(x, y, R, 0.5); return; }
      const dx = x - last.x;
      const dy = y - last.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 1) return;
      const v = dist / Math.max(16, t - last.t);
      const r = R * (1 + clamp(v * 0.3, 0, 0.4));
      const n = Math.max(1, Math.ceil(dist / (r / 3)));
      for (let k = 1; k <= n; k++) stamp(last.x + (dx * k) / n, last.y + (dy * k) / n, r, 0.55);
      spray(x, y, dx / dist, dy / dist, Math.min(6, 1 + Math.round(dist / 12)));
      last = { x, y, t };
      check();
    };

    return {
      activate() {
        pad = document.createElement('div');
        pad.className = 'g-pad';
        pad.style.cssText = `position:absolute;left:${-PAD}px;top:${-PAD}px;right:${-PAD}px;bottom:${-PAD}px;touch-action:none;`;
        o.host.append(pad);
        let down = null;
        off = pointer(pad, {
          down: (q) => { const t = performance.now(); down = { x: q.x - PAD, y: q.y - PAD, t }; last = null; wipe(q.x - PAD, q.y - PAD, t); },
          move: (q) => { if (down) wipe(q.x - PAD, q.y - PAD, performance.now()); },
          up: (q) => {
            if (!down) return;
            const x = q.x - PAD;
            const y = q.y - PAD;
            /* a tap: a soft round patch, knocked clear */
            if (Math.hypot(x - down.x, y - down.y) < 10 && performance.now() - down.t < 350) {
              stamp(x, y, R * 1.9, 1);
              burst(o.host, 'g-puff', 14, () => ({ x: clamp(x + (Math.random() - 0.5) * R, 0, w), y: clamp(y + (Math.random() - 0.5) * R, 0, h) }), () => [(Math.random() - 0.5) * 90, -20 - Math.random() * 50, 0.7 + Math.random() * 0.8]);
            }
            down = null;
            last = null;
            check();
          },
        });
        return opened.promise;
      },
      /* the rest of the snow slides off */
      finish() {
        burst(o.host, 'g-puff', 18, (i) => ({ x: ((i + 0.5) / 18) * w, y: h * 0.9 }), () => [(Math.random() - 0.5) * 50, 20 + Math.random() * 50, 0.8 + Math.random() * 0.8]);
        return away(el, [{ transform: 'translateY(0)', opacity: 1 }, { transform: `translateY(${h * 0.3}px)`, opacity: 0 }], 560);
      },
      destroy() { if (off) off(); if (pad) pad.remove(); el.remove(); },
    };
  });
})();
