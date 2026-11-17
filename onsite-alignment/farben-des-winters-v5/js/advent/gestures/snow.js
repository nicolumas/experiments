/* Brush off the snow, made for a finger. The clump you touch is yours: it follows the finger 1:1 and flies off the
   way you throw it (a flick is enough; a slow short drag settles back). A quick swipe brushes off every other clump it
   crosses, the way it was going. A tap knocks off the clump under the finger. The touch area reaches a little past the
   work, so a swipe may start just outside it. One swipe down through the work clears it all; three taps do too. */
(function () {
  'use strict';
  const { register, util } = window.GAL.gestures;
  const { cover, away, pointer, deferred, burst } = util;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* no haptics here */ } };
  const PAD = 28;          /* the touch area reaches this far past the work */
  const FLICK = 0.35;      /* px/ms: let go faster than this (and past NUDGE) and the clump flies */
  const BRUSH = 0.5;       /* px/ms: cross another clump faster than this and it is brushed off */
  const NUDGE = 24;        /* px: anything shorter is a nudge and settles back */

  register('snow', (o) => {
    const { w, h } = o.rect;
    const bands = [0, 1, 2].map((i) => cover(o.host, 'g-snow', `top:${(i * 100) / 3 - (i ? 3 : 0)}%;height:${100 / 3 + (i ? 3 : 0) + (i < 2 ? 3 : 0)}%`));
    const opened = deferred();
    let off = null;
    let pad = null;
    let drag = null;
    const live = () => bands.filter((b) => b.isConnected && !b.dataset.falling);
    const bandAt = (y) => live().find((b) => y >= b.offsetTop && y < b.offsetTop + b.offsetHeight) || null;
    /* where a touch starts: the clump under it, or the nearest one when it starts just outside the work */
    const grabAt = (y) => bandAt(clamp(y, 0, h - 1)) || live().sort((a, b) => Math.abs(a.offsetTop + a.offsetHeight / 2 - y) - Math.abs(b.offsetTop + b.offsetHeight / 2 - y))[0] || null;
    const powder = (x, y, n, dir = 0) => burst(o.host, 'g-puff', n, { x, y }, () => [dir * (20 + Math.random() * 30) + (Math.random() - 0.5) * 36, -8 - Math.random() * 30, 0.5 + Math.random() * 0.5]);
    const done = () => { if (!live().length) opened.resolve(); };

    /* the clump goes: along (ux, uy), from wherever it is now */
    const send = (b, ux, uy) => {
      const side = Math.abs(ux) > Math.abs(uy) * 0.8 ? (ux > 0 ? 'right' : 'left') : uy < 0 ? 'up' : 'down';
      b.dataset.falling = side;
      const m = new DOMMatrix(getComputedStyle(b).transform);
      const far = Math.max(w, h) * 1.4;
      away(b, [
        { transform: `translate(${m.m41}px, ${m.m42}px) rotate(${Math.atan2(m.m12, m.m11)}rad)`, opacity: 1 },
        { transform: `translate(${m.m41 + ux * far}px, ${m.m42 + uy * far + h * 0.2}px) rotate(${(ux >= 0 ? 1 : -1) * 16}deg)`, opacity: 0 },
      ], 380);
      const y = b.offsetTop + b.offsetHeight * 0.6;
      const dir = Math.sign(ux);
      burst(o.host, 'g-puff', 14, (i) => ({ x: ((i + 0.5) / 14) * w, y }), () => [(dir || Math.random() - 0.5) * (30 + Math.random() * 60), -10 - Math.random() * 50, 0.8 + Math.random() * 0.8]);
      buzz(12);
      done();
    };
    const unit = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
    /* the held clump: 1:1 with the finger, a little tilt, resisting being lifted */
    const hold = (b, dx, dy) => {
      b.style.transition = 'none';
      b.style.zIndex = '2';
      b.style.transform = `translate(${dx}px, ${dy > 0 ? dy : dy * 0.3}px) rotate(${clamp(dx * 0.05, -9, 9)}deg)`;
    };
    const settle = (b) => {
      if (!b || b.dataset.falling) return;
      b.style.transition = 'transform 280ms cubic-bezier(.2, .8, .2, 1)';
      b.style.transform = '';
      b.style.zIndex = '';
    };
    /* the finger's speed over the last 100 ms (px/ms); very close samples count as 16 ms apart */
    const speed = () => {
      const s = drag.samples;
      const a = s[0];
      const z = s[s.length - 1];
      const dt = Math.max(16, z.t - a.t);
      return { vx: (z.x - a.x) / dt, vy: (z.y - a.y) / dt };
    };

    const fall = (el, k) => away(el, [
      { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
      { transform: `translateY(18px) rotate(${k % 2 ? -3 : 3}deg)`, opacity: 1, offset: 0.25 },
      { transform: `translateY(${h * 1.4}px) rotate(${k % 2 ? -8 : 8}deg)`, opacity: 0 },
    ], 520);

    return {
      activate() {
        pad = document.createElement('div');
        pad.className = 'g-pad';
        pad.style.cssText = `position:absolute;left:${-PAD}px;top:${-PAD}px;right:${-PAD}px;bottom:${-PAD}px;touch-action:none;`;
        o.host.append(pad);
        off = pointer(pad, {
          down: (q) => {
            const x = q.x - PAD;
            const y = q.y - PAD;
            const now = performance.now();
            drag = { x0: x, y0: y, x, y, t0: now, held: grabAt(y), samples: [{ x, y, t: now }] };
            if (drag.held) powder(clamp(x, 0, w), clamp(y, 0, h), 3);
          },
          move: (q) => {
            if (!drag) return;
            const x = q.x - PAD;
            const y = q.y - PAD;
            const now = performance.now();
            const step = { dx: x - drag.x, dy: y - drag.y, dt: Math.max(16, now - drag.samples[drag.samples.length - 1].t) };
            drag.samples.push({ x, y, t: now });
            while (drag.samples.length > 2 && now - drag.samples[0].t > 100) drag.samples.shift();
            drag.x = x;
            drag.y = y;
            if (drag.held && !drag.held.dataset.falling) hold(drag.held, x - drag.x0, y - drag.y0);
            /* brushing past the other clumps at speed knocks them off the way the hand is going */
            const other = bandAt(y);
            if (other && other !== drag.held && x > -4 && x < w + 4 && Math.hypot(step.dx, step.dy) / step.dt > BRUSH) send(other, ...unit(step.dx, step.dy));
            if (Math.hypot(step.dx, step.dy) > 2 && x > 0 && x < w && y > 0 && y < h && Math.random() < 0.5) powder(x, y, 2, Math.sign(step.dx));
          },
          up: (q) => {
            if (!drag) return;
            const x = q.x - PAD;
            const y = q.y - PAD;
            const b = drag.held;
            const dist = Math.hypot(x - drag.x0, y - drag.y0);
            const { vx, vy } = speed();
            const v = Math.hypot(vx, vy);
            if (b && !b.dataset.falling) {
              if (dist < 10 && performance.now() - drag.t0 < 350) send(b, 0, 1);
              else if ((v > FLICK && dist > NUDGE) || Math.abs(x - drag.x0) > w * 0.35 || y - drag.y0 > h * 0.35) send(b, ...unit(v > FLICK ? vx : x - drag.x0, v > FLICK ? vy : y - drag.y0));
              else settle(b);
            }
            drag = null;
          },
        });
        return opened.promise;
      },
      finish: () => Promise.all(live().map((b, k) => fall(b, k))).then(() => new Promise((r) => setTimeout(r, 560 / (window.GAL.SPEED || 1)))),
      destroy() { if (off) off(); if (pad) pad.remove(); bands.forEach((b) => b.remove()); },
    };
  });
})();
