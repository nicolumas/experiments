/* Diagnosis only, shown with ?audiodebug: a small strip that records what happens to the sound on a real phone
   (the audio context's state changes, the page going away and coming back, taps while the sound is not running,
   resume attempts and whether they worked, the scheduler falling behind), so a screenshot taken right after the music
   cuts out says why. Remove once the cause is fixed. */
(function () {
  'use strict';
  if (!/[?&]audiodebug\b/.test(location.search)) return;
  const t0 = performance.now();
  const log = [];
  const el = document.createElement('pre');
  el.style.cssText = 'position:fixed;left:6px;right:6px;top:64px;z-index:99;margin:0;padding:6px 8px;max-height:46vh;overflow:hidden;'
    + 'background:rgba(29,29,29,.82);color:#fefdf9;font:11px/1.35 ui-monospace,Menlo,monospace;white-space:pre-wrap;pointer-events:none';
  const at = () => ((performance.now() - t0) / 1000).toFixed(1);
  const A = () => (window.GAL && window.GAL.audio) || null;
  const now = () => {
    const a = A();
    if (!a || !a.eng) return 'no sound yet';
    const s = a.eng.seq;
    return `ctx ${a.ctx.state}  on ${a.on}  running ${s.running}  hold ${s.hold}  bar ${s.bar}  gain ${a.eng.master.gain.value.toFixed(2)}  `
      + `vis ${document.visibilityState}  phase ${(window.__ride && window.__ride.S.phase) || '?'}`;
  };
  const add = (msg) => { log.push(`${at()}  ${msg}`); if (log.length > 14) log.shift(); draw(); };
  const draw = () => { el.textContent = `${navigator.userAgent.replace(/^Mozilla\/5\.0 /, '').slice(0, 120)}\n${now()}\n${log.join('\n')}`; };
  const hooked = new WeakSet();
  const hook = () => {
    const a = A();
    if (!a || !a.ctx || hooked.has(a.ctx)) return;
    hooked.add(a.ctx);
    add(`context created, ${a.ctx.state}`);
    a.ctx.addEventListener('statechange', () => add(`context → ${a.ctx.state}`));
    const resume = a.ctx.resume.bind(a.ctx);
    a.ctx.resume = () => {
      const from = a.ctx.state;
      const p = resume();
      p.then(() => add(`resume from ${from} → ${a.ctx.state}`), (e) => add(`resume from ${from} FAILED ${e && e.name}`));
      return p;
    };
    const e = a.eng;
    const tick = e.tick.bind(e);
    e.tick = () => {
      const s = e.seq;
      const n = a.ctx.currentTime;
      if (s.running && !s.hold && s.t < n - 0.04) add(`scheduler behind ${(n - s.t).toFixed(2)} s`);
      return tick();
    };
  };
  document.addEventListener('visibilitychange', () => add(`page ${document.visibilityState}`));
  addEventListener('pagehide', (e) => add(`pagehide${e.persisted ? ' (kept)' : ''}`));
  addEventListener('pageshow', (e) => add(`pageshow${e.persisted ? ' (from back/forward cache)' : ''}`));
  for (const type of ['pointerdown', 'pointerup', 'touchend', 'click']) {
    addEventListener(type, () => { const a = A(); if (a && a.ctx && a.ctx.state !== 'running') add(`${type} while ${a.ctx.state}`); }, true);
  }
  const start = () => { document.body.append(el); draw(); setInterval(() => { hook(); draw(); }, 500); };
  if (document.body) start(); else addEventListener('DOMContentLoaded', start);
})();
