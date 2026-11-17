/* The door gestures: a registry, the runner, and the small helpers they share.

   A gesture covers the work in its own way (frost, snow, paper, a veil, ribbon, the dark), and the visitor
   uncovers it. GAL.gestures.prepare(name, opts) draws the covering at once (it rides in with the work);
   .start({ skipped, rm, ui, boost }) takes input, shows the hint and the "Öffnen" fallback, and resolves exactly once:
   'gesture' (opened by hand), 'fallback' (the button) or 'auto' (reduced motion). Nothing it drew stays on the work
   afterwards. run(name, opts) is both in one call. opts: { host, rect: { w, h }, palette, boost 0..1, lang, ui, skipped, rm }. */
(function (root) {
  'use strict';

  const G = (root.GAL = root.GAL || {});
  const EASE = 'cubic-bezier(.2,.8,.2,1)';
  const speed = () => G.SPEED || 1;
  const registry = {};

  const COPY = {
    de: {
      open: 'Öffnen',
      snow: 'Wisch oder tipp den Schnee weg.', frost: 'Wisch das Eis weg.', paper: 'Reiß das Papier auf.',
      lanterns: 'Zünde die drei Laternen an.', ribbon: 'Zieh an der Schleife.',
      candle: 'Halte die Kerze, bis sie brennt.',
    },
    en: {
      open: 'Open',
      snow: 'Swipe or tap the snow away.', frost: 'Wipe the frost away.', paper: 'Tear the paper open.',
      lanterns: 'Light the three lanterns.', ribbon: 'Pull the ribbon.',
      candle: 'Hold the candle until it burns.',
    },
  };

  /* a covering element: everything that hides the work carries data-cover, so "nothing is left" can be checked */
  function cover(host, cls, style = '') {
    const el = document.createElement('div');
    el.className = `g-cover ${cls}`;
    el.setAttribute('data-cover', '');
    if (style) el.style.cssText = style;
    host.append(el);
    return el;
  }
  /* animate an element away and remove it; resolves when it is gone */
  function away(el, frames, ms = 520) {
    return new Promise((resolve) => {
      if (!el || !el.isConnected) { resolve(); return; }
      const a = el.animate(frames, { duration: ms / speed(), easing: EASE, fill: 'forwards' });
      const done = () => { el.remove(); resolve(); };
      a.finished.then(done, done);
    });
  }
  /* pointer input in the host's own coordinates, with capture so a drag may leave the work */
  function pointer(el, { down, move, up }) {
    let active = null;
    const at = (e) => { const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const onDown = (e) => {
      if (active !== null) return;
      active = e.pointerId;
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
      e.preventDefault();
      if (down) down(at(e), e);
    };
    const onMove = (e) => { if (e.pointerId === active && move) move(at(e), e); };
    const onUp = (e) => { if (e.pointerId !== active) return; active = null; if (up) up(at(e), e); };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }
  /* a few particles (powder, glints, sparks) that fly and fade on their own; they never count as covering */
  function burst(host, cls, n, at, fly) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < n; i++) {
      const el = document.createElement('i');
      el.className = `g-fx ${cls}`;
      const { x, y } = typeof at === 'function' ? at(i) : at;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      host.append(el);
      const [dx, dy, s = 1] = fly(i);
      const a = el.animate([
        { transform: 'translate(-50%, -50%) scale(.4)', opacity: 0 },
        { transform: `translate(calc(-50% + ${dx * 0.25}px), calc(-50% + ${dy * 0.25}px)) scale(${s})`, opacity: 1, offset: 0.2 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${s * 0.6})`, opacity: 0 },
      ], { duration: (520 + Math.random() * 360) / speed(), easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
      a.finished.then(() => el.remove(), () => el.remove());
    }
  }

  /* a promise that can be resolved from outside: activate() hands one back, the input resolves it */
  function deferred() {
    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    return { promise, resolve };
  }

  const register = (name, factory) => { registry[name] = factory; };

  function prepare(name, opts) {
    const factory = registry[name];
    if (!factory) throw new Error(`unknown gesture ${name}`);
    const g = factory(opts);
    return { start: (more = {}) => start(g, name, Object.assign(opts, more)), destroy: () => g.destroy() };
  }
  const run = (name, opts) => prepare(name, opts).start();

  function start(g, name, opts) {
    const T = COPY[opts.lang] || COPY.de;
    const ui = opts.ui || opts.host;
    const hint = document.createElement('p');
    hint.className = 'g-hint';
    hint.textContent = T[name];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'g-open';
    btn.textContent = T.open;
    btn.hidden = true;
    let settled = false;
    let timer = null;
    return new Promise((resolve) => {
      const done = (how) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        btn.disabled = true;
        hint.remove();
        btn.remove();
        opts.host.dispatchEvent(new CustomEvent('gesture:done', { detail: how }));
        Promise.resolve(g.finish()).then(() => { g.destroy(); resolve(how); });
      };
      if (opts.rm) { done('auto'); return; }
      ui.append(hint, btn);
      btn.addEventListener('click', () => done('fallback'));
      if (opts.skipped) btn.hidden = false;
      else timer = setTimeout(() => { btn.hidden = false; }, 4000 / speed());
      g.activate().then(() => done('gesture'));
    });
  }

  G.gestures = { register, prepare, run, copy: COPY, util: { cover, away, pointer, deferred, burst, EASE } };
})(window);
