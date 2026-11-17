/* Pull the ribbon: the work is wrapped and tied with a red bow; pull the bow down and the wrapping drops away. */
(function () {
  'use strict';
  const { register, util } = window.GAL.gestures;
  const { cover, away, pointer, deferred } = util;

  register('ribbon', (o) => {
    const { h } = o.rect;
    const wrap = cover(o.host, 'g-wrap');
    const band = document.createElement('div');
    band.className = 'g-band';
    wrap.append(band);
    const bow = document.createElement('div');
    bow.className = 'g-bow';
    bow.setAttribute('data-handle', '');
    bow.setAttribute('role', 'button');
    bow.setAttribute('aria-label', o.lang === 'en' ? 'Ribbon' : 'Schleife');
    o.host.append(bow);
    const opened = deferred();
    let start = null;
    let off = null;
    const pull = (dy) => {
      const k = Math.max(0, Math.min(1, dy / (h * 0.35)));
      bow.style.transform = `translate(-50%, ${dy}px)`;
      band.style.transform = `scaleY(${1 - k * 0.15})`;
      return k;
    };
    return {
      activate() {
        off = pointer(bow, {
          /* page coordinates: the bow moves with the finger, so its own coordinates would never change */
          down: (p, e) => { start = e.clientY; },
          move: (p, e) => { if (start !== null && pull(Math.max(0, e.clientY - start)) >= 1) opened.resolve(); },
          up: () => { start = null; if (bow.isConnected) bow.animate([{ transform: bow.style.transform }, { transform: 'translate(-50%, 0)' }], { duration: 320, easing: util.EASE }); pull(0); },
        });
        return opened.promise;
      },
      finish: () => Promise.all([
        away(bow, [{ opacity: 1 }, { opacity: 0 }], 220),
        away(wrap, [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(110%)', opacity: 0 }], 520),
      ]),
      destroy() { if (off) off(); bow.remove(); wrap.remove(); },
    };
  });
})();
