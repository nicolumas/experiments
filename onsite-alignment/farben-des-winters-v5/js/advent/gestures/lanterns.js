/* Light the lanterns: three paper lanterns over a veiled work; once all three burn they rise and lift the veil. */
(function () {
  'use strict';
  const { register, util } = window.GAL.gestures;
  const { cover, away, deferred, burst } = util;

  register('lanterns', (o) => {
    const veil = cover(o.host, 'g-veil');
    const opened = deferred();
    const spots = [[0.22, -0.16], [0.5, -0.24], [0.78, -0.14]];
    let lit = 0;
    const lanterns = spots.map(([x, y]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'g-lantern';
      b.setAttribute('data-lantern', '');
      b.setAttribute('aria-label', o.lang === 'en' ? 'Lantern' : 'Laterne');
      b.style.left = `${x * 100}%`;
      b.style.top = `${y * 100}%`;
      b.disabled = true;
      b.addEventListener('click', () => {
        if (b.classList.contains('lit')) return;
        b.classList.add('lit');
        burst(o.host, 'g-spark', 5, { x: b.offsetLeft, y: b.offsetTop - 6 }, () => [(Math.random() - 0.5) * 30, -30 - Math.random() * 40, 0.8 + Math.random() * 0.5]);
        if (++lit === lanterns.length) opened.resolve();
      });
      o.host.append(b);
      return b;
    });
    return {
      activate() { lanterns.forEach((b) => { b.disabled = false; }); return opened.promise; },
      finish() {
        lanterns.forEach((b) => b.classList.add('lit'));
        return Promise.all([
          ...lanterns.map((b, i) => away(b, [{ transform: 'translate(-50%, 0)', opacity: 1 }, { transform: `translate(-50%, ${-160 - i * 30}px)`, opacity: 0 }], 900)),
          away(veil, [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-115%)', opacity: 0 }], 900),
        ]);
      },
      destroy() { lanterns.forEach((b) => b.remove()); veil.remove(); },
    };
  });
})();
