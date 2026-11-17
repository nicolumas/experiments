/* Wipe the frost: the work appears where the finger goes; done once enough of the glass is clear. */
(function () {
  'use strict';
  const { register, util } = window.GAL.gestures;
  const { cover, away, pointer, deferred, burst } = util;

  register('frost', (o) => {
    const { w, h } = o.rect;
    const el = cover(o.host, 'g-frost');
    const cv = document.createElement('canvas');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    el.append(cv);
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.scale(dpr, dpr);
    /* pale ice with fine crystals */
    const ice = g.createLinearGradient(0, 0, w, h);
    ice.addColorStop(0, 'rgba(246,249,252,0.99)');
    ice.addColorStop(1, 'rgba(220,231,243,0.99)');
    g.fillStyle = ice;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.75)';
    g.lineWidth = 1;
    for (let i = 0; i < Math.round((w * h) / 900); i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const L = 4 + Math.random() * 10;
      for (let k = 0; k < 3; k++) {
        const a = (k * Math.PI) / 3 + Math.random() * 0.3;
        g.beginPath();
        g.moveTo(x - Math.cos(a) * L, y - Math.sin(a) * L);
        g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L);
        g.stroke();
      }
    }
    const R = Math.max(14, Math.min(w, h) * 0.09);
    const opened = deferred();
    let last = null;
    let moves = 0;
    let off = null;
    let need = 0.55;
    /* the share of the glass already clear, sampled on a coarse grid */
    const cleared = () => {
      const d = g.getImageData(0, 0, cv.width, cv.height).data;
      const N = 30;
      let clear = 0;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const x = Math.floor(((i + 0.5) / N) * cv.width);
        const y = Math.floor(((j + 0.5) / N) * cv.height);
        if (d[(y * cv.width + x) * 4 + 3] < 40) clear++;
      }
      return clear / (N * N);
    };
    const wipe = (p) => {
      g.save();
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.globalCompositeOperation = 'destination-out';
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.lineWidth = R * 2;
      g.beginPath();
      g.moveTo((last || p).x, (last || p).y);
      g.lineTo(p.x + 0.01, p.y);
      g.stroke();
      g.restore();
      last = p;
      if (moves % 3 === 0) burst(o.host, 'g-glint', 1, { x: p.x + (Math.random() - 0.5) * R, y: p.y + (Math.random() - 0.5) * R }, () => [0, -8, 0.7 + Math.random() * 0.7]);
      if (++moves % 6 === 0 && cleared() >= need) opened.resolve();
    };
    return {
      activate() {
        need = 0.55 - 0.25 * Math.max(0, Math.min(1, o.boost || 0));
        off = pointer(o.host, { down: (p) => { last = null; wipe(p); }, move: wipe, up: () => { last = null; if (cleared() >= need) opened.resolve(); } });
        return opened.promise;
      },
      /* the last of the frost melts: a soft blur as it goes */
      finish: () => away(el, [{ opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(3px)' }], 520),
      destroy() { if (off) off(); el.remove(); },
    };
  });
})();
