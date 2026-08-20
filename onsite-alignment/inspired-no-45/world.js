/* ============================================================================
   INSPIRED Nr. 45 · Die lange Nacht — the engine

   A field of constellations held in a dark volume. You move through it in all
   three axes: drag to travel laterally and vertically, scroll to move deeper
   in or back out. Nothing moves unless you move it.

   Built on CSS 3D so that artworks stay <img> at their true aspect ratio and
   every word stays real, selectable text.
   ========================================================================= */

import { CONSTELLATIONS, OBJECTS, BOUNDS } from './content.js';

const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

/* Sight lines. Works keep to themselves; a constellation's name carries much
   further, so the field always tells you what else is out there. */
const FAR_WORK = 4200;
const FAR_NAME = 13000;
const FAR_YEAR = 2900;   /* a date holds the eye only while you are beside it */
const NEAR = 240;

const state = {
  camX: 0, camY: 0, camZ: -2200,
  tX: 0, tY: 0, tZ: -2200,
  vX: 0, vY: 0,
  rx: 0, ry: 0, tRx: 0, tRy: 0,
  P: 1600, vw: 1440, vh: 900, S: 1,
  running: false,
  open: null,          /* the item whose cluster is open */
  dim: 1,
  flight: null,
  coarse: matchMedia('(pointer: coarse)').matches,
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
};

let MANIFEST = {};
let items = [];
let byId = {};
let clusterNodes = [];
const worldEl = $('#world');

/* ============================================================ construction */

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function captionHTML(o) {
  const name = o.artist ? esc(o.artist) + (o.title ? ', ' + esc(o.title) : '') : '';
  return `<div class="cap">
      ${name ? `<p class="who">${name}</p>` : ''}
      <p class="what">${esc(o.caption || '')}</p>
      ${o.story ? '<span class="more">More on this</span>' : ''}
    </div>`;
}

function buildImagePlate(o, m, extra = '') {
  const node = el('div', 'obj o-art' + (o.kind === 'scene' ? ' is-scene' : '') + (o.feature ? ' is-feature' : ''));
  node.innerHTML = `
    <div class="plate">
      <img class="lq" src="${m.lqip}" alt="" aria-hidden="true">
      ${extra || `<img class="full" alt="${esc(o.artist ? o.artist + '. ' : '')}${esc(o.caption || o.title || '')}">`}
      <div class="edge"></div>
    </div>
    ${captionHTML(o)}`;
  node.style.setProperty('--ar', String(m.ar));
  node.style.setProperty('--glow-c', m.glow);
  return node;
}

/* Type sits inside a wrapper that carries its pool of shade and is
   counter-scaled against the perspective, so a sentence never shrinks past
   reading size and never grows to fill the room. */
function typeNode(cls, html) {
  const node = el('div', 'obj ' + cls);
  node.appendChild(el('div', 'tw', html));
  return node;
}

function buildObject(o) {
  let node = null;
  let meta = { lum: 50 };

  if (o.kind === 'work' || o.kind === 'scene') {
    const m = MANIFEST[o.id];
    if (!m) return null;
    node = buildImagePlate(o, m);
    node.dataset.src = m.src;
    meta = { lum: m.lum, nw: m.w, art: true };
  } else if (o.kind === 'phase') {
    const m = MANIFEST[o.frames[0]];
    const layers = o.frames.map((f, i) =>
      `<img class="full ph ready" data-i="${i}" src="${MANIFEST[f].src}"
         alt="${i === 0 ? esc(o.caption || '') : ''}" style="opacity:${i ? 0 : 1}">`).join('');
    node = buildImagePlate(o, m, layers);
    node.dataset.phase = '1';
    meta = { lum: m.lum, nw: m.w, art: true };
  } else if (o.kind === 'plate') {
    node = el('div', 'obj o-art o-plate');
    node.innerHTML = `<div class="plate"><div class="surface"></div><div class="edge"></div></div>${captionHTML(o)}`;
    node.style.setProperty('--ar', '1.25');
    node.style.setProperty('--glow-c', '#8a7c62');
    meta = { lum: 24, art: true };
  } else if (o.kind === 'title') {
    node = typeNode('o-title', `
      <p class="eyebrow">${esc((o.conN ? o.conN + ' · ' : '') + o.conEyebrow)}</p>
      <h2>${esc(o.conTitle)}</h2>
      <p class="sub">${esc(o.conSub)}</p>`);
    meta = { name: true };
  } else if (o.kind === 'pull' || o.kind === 'type') {
    node = typeNode('o-pull' + (o.size === 'lead' ? ' is-lead' : ''), `<p>${esc(o.text)}</p>`);
  } else if (o.kind === 'year') {
    meta = { year: true };
    node = typeNode('o-year', `<p class="num">${esc(o.year)}</p><div class="bar"></div><p class="note">${esc(o.text)}</p>`);
  } else if (o.kind === 'voice') {
    node = typeNode('o-voice', `<p class="tag">Voices</p><blockquote>${esc(o.text)}</blockquote><p class="who">${esc(o.who)}</p>`);
  } else if (o.kind === 'hint') {
    node = typeNode('o-hint', `<p>${esc(o.text)}</p>`);
  } else if (o.kind === 'monolith') {
    node = typeNode('o-mono', `<div class="frame">
      <p class="eyebrow">${esc(o.story.eyebrow)}</p>
      <h3>${esc(o.story.head)}</h3>
      <span class="more">More on this</span></div>`);
  } else if (o.kind === 'end') {
    node = typeNode('o-end', `<h2>${esc(o.title)}</h2><p class="places">${esc(o.sub)}</p>
      <button class="restart" type="button">Back to the beginning</button>`);
  }
  if (!node) return null;

  node.dataset.id = o.id;
  node.hidden = true;
  return {
    node, data: o, ...meta,
    x: o.x, y: o.y, z: o.z, w: o.w || 620,
    visible: false, loaded: !meta.art,
    cap: node.querySelector('.cap'),
    tw: node.querySelector('.tw'),
  };
}

/* ================================================================== layout */

function measure() {
  state.vw = window.innerWidth;
  state.vh = window.innerHeight;
  state.P = parseFloat(getComputedStyle($('#viewport')).perspective) || 1600;
  state.S = clamp(state.vw / 1500, 0.50, 1);
  for (const it of items) sizeItem(it);
}

function sizeItem(it) {
  /* Never blown up past its own resolution: a low-res source keeps
     its distance instead of turning soft. */
  const w = it.nw ? Math.min(it.w * state.S, it.nw / 0.8) : it.w * state.S;
  it.node.style.width = w + 'px';
  it.sw = w;
  it.sx = it.x * state.S;
  it.sy = it.y * state.S * (state.vw < 900 ? 0.8 : 1);
}

/* ================================================================ the loop */

function frame() {
  if (!state.running) return;
  requestAnimationFrame(frame);
  const P = state.P;

  /* --- camera: nothing moves unless you move it --------------------------- */
  if (state.flight) {
    const f = state.flight;
    f.t = Math.min(1, f.t + 1 / f.dur);
    const k = f.t < 0.5 ? 4 * f.t ** 3 : 1 - Math.pow(-2 * f.t + 2, 3) / 2;
    state.camX = state.tX = lerp(f.x0, f.x1, k);
    state.camY = state.tY = lerp(f.y0, f.y1, k);
    state.camZ = state.tZ = lerp(f.z0, f.z1, k);
    if (f.t >= 1) { state.flight = null; if (f.then) f.then(); }
  } else {
    state.tX = clamp(state.tX + state.vX, BOUNDS.x[0] * state.S, BOUNDS.x[1] * state.S);
    state.tY = clamp(state.tY + state.vY, BOUNDS.y[0] * state.S, BOUNDS.y[1] * state.S);
    state.vX *= 0.90; state.vY *= 0.90;
    state.camX = lerp(state.camX, state.tX, 0.085);
    state.camY = lerp(state.camY, state.tY, 0.085);
    state.camZ = lerp(state.camZ, state.tZ, 0.070);
  }
  state.rx = lerp(state.rx, state.tRx, 0.045);
  state.ry = lerp(state.ry, state.tRy, 0.045);

  worldEl.style.transform =
    `rotateX(${state.rx.toFixed(3)}deg) rotateY(${state.ry.toFixed(3)}deg) ` +
    `translate3d(${(-state.camX).toFixed(2)}px, ${(-state.camY).toFixed(2)}px, ${state.camZ.toFixed(2)}px)`;

  state.dim = lerp(state.dim, state.open ? 0.07 : 1, 0.08);

  const halfW = state.vw * 0.60;
  const halfH = state.vh * 0.60;

  for (const it of items) {
    const d = it.z - state.camZ;
    const far = it.name ? FAR_NAME : it.year ? FAR_YEAR : FAR_WORK;
    if (d < NEAR || d > far) { hide(it); continue; }

    const s = P / (P + d);
    const sx = (it.sx - state.camX) * s;
    const sy = (it.sy - state.camY) * s;
    const half = it.sw * s * 0.6;
    if (Math.abs(sx) - half > halfW || Math.abs(sy) - half > halfH + 200) { hide(it); continue; }

    /* Distance takes light, not substance. A work keeps clean edges and full
       colour in the near band, and simply sits further back in the dark. */
    const inFocus = state.open && (state.open === it || state.open.family.has(it));
    const dimf = state.open ? (inFocus ? 1 : state.dim) : 1;
    const lit = it.name
      ? (0.10 + 0.90 * smooth(far * 0.74, 1100, d)) * dimf
      : it.year
        ? (0.04 + 0.96 * smooth(1600, 700, d)) * dimf
        : (0.34 + 0.66 * smooth(far, far * 0.42, d)) * smooth(NEAR, NEAR + 260, d) * dimf;

    if (!it.visible) { it.node.hidden = false; it.visible = true; }
    it.node.style.transform =
      `translate3d(${it.sx.toFixed(1)}px, ${it.sy.toFixed(1)}px, ${(-it.z).toFixed(1)}px) translate(-50%, -50%)`;
    it.node.style.opacity = (it.art ? smooth(far, far - 500, d) * (0.02 + 0.98 * dimf) : lit).toFixed(3);
    if (it.art) it.node.style.setProperty('--fog', clamp(1 - lit, 0, 0.96).toFixed(3));

    if (!it.loaded) {
      it.loaded = true;
      const img = it.node.querySelector('img.full');
      if (img && it.node.dataset.src) {
        img.decoding = 'async';
        img.addEventListener('load', () => img.classList.add('ready'), { once: true });
        img.src = it.node.dataset.src;
      }
    }

    /* Captions never recede: they are not part of the work. */
    if (it.cap) {
      it.cap.style.width = (it.sw * s).toFixed(1) + 'px';
      it.cap.style.transform = `scale(${(1 / s).toFixed(4)})`;
    }
    /* Type stays readable wherever you stand, within reason. */
    if (it.tw) {
      const cap = it.name ? 1.45 : it.year ? 1.0 : 2.30;
      const k = clamp(Math.pow(1 / s, 0.62), 0.70, cap);
      it.tw.style.setProperty('--tscale', k.toFixed(3));
      if (it.name) {
        const distant = d > 3400;
        if (distant !== it.distant) { it.distant = distant; it.node.classList.toggle('distant', distant); }
      }
    }

    const near = d < 1500 && !state.open;
    if (near !== it.near) { it.near = near; it.node.classList.toggle('near', near); }

    if (it.node.dataset.phase) updatePhase(it, d);
  }

  for (const n of clusterNodes) {
    const d = n.cz - state.camZ;
    if (d < 120) { n.style.visibility = 'hidden'; continue; }
    n.style.visibility = '';
    const cs = P / (P + d);
    n.twEl.style.setProperty('--tscale', clamp(Math.pow(1 / cs, 0.62), 0.72, state.vw < 900 ? 1.25 : 2.4).toFixed(3));
  }

  updateAtmosphere();
  updateCompass();
}

function hide(it) {
  if (it.visible) { it.node.hidden = true; it.visible = false; it.near = false; it.node.classList.remove('near'); }
}

/* Lentikular. Standing to the left of the work is not the same as standing to
   the right of it: the frames cross-fade with your angle, exactly as the
   printed edition does when you walk past it. */
function updatePhase(it, d) {
  const ang = Math.atan2(state.camX - it.sx, Math.max(d, 1));
  const imgs = it.node.querySelectorAll('img.ph');
  const t = clamp((ang + 0.55) / 1.10, 0, 1) * (imgs.length - 1);
  const k = Math.floor(t);
  const frac = t - k;
  for (let i = 0; i < imgs.length; i++) {
    imgs[i].style.opacity = i <= k ? '1' : i === k + 1 ? frac.toFixed(3) : '0';
  }
}

/* ============================================================== atmosphere */

const hex2rgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
let tintCur = [10, 10, 13];

function nearestConstellation() {
  let best = CONSTELLATIONS[0], bd = Infinity;
  for (const c of CONSTELLATIONS) {
    const dx = c.at[0] * state.S - state.camX;
    const dy = c.at[1] * state.S - state.camY;
    const dz = c.at[2] + 900 - state.camZ;
    const dist = dx * dx * 1.4 + dy * dy + dz * dz;
    if (dist < bd) { bd = dist; best = c; }
  }
  return best;
}

let hereCon = null;

function updateAtmosphere() {
  const c = nearestConstellation();
  const tgt = hex2rgb(c.tint);
  for (let k = 0; k < 3; k++) tintCur[k] = lerp(tintCur[k], tgt[k], 0.012);
  document.documentElement.style.setProperty('--night-0',
    `rgb(${tintCur.map((v) => Math.round(v)).join(',')})`);
  if (c !== hereCon) {
    hereCon = c;
    $('#here .name').textContent = (c.n ? c.n + ' · ' : '') + c.title;
    document.querySelectorAll('#map .ch').forEach((b) => b.classList.toggle('here', b.dataset.id === c.id));
    document.querySelectorAll('#plan .dot').forEach((b) => b.classList.toggle('here', b.dataset.id === c.id));
  }
}

/* The plan: a quiet overhead reading of where you are in the field. */
function updateCompass() {
  const you = $('#plan .you');
  if (!you) return;
  const p = planPos(state.camX / state.S, state.camZ);
  you.style.left = p.x + '%';
  you.style.top = p.y + '%';
}

const planRange = { x: [-6600, 7000], z: [-2600, 36400] };
function planPos(x, z) {
  return {
    x: +(((x - planRange.x[0]) / (planRange.x[1] - planRange.x[0])) * 100).toFixed(2),
    y: +(((z - planRange.z[0]) / (planRange.z[1] - planRange.z[0])) * 100).toFixed(2),
  };
}

/* =========================================================== story clusters */
/* A story does not open a panel over the world. It blooms into the world:
   text and related works arranged around the piece, at their own depths, so
   you go on moving in order to read. */

/* The story curls away from the work in one continuous arc, to the right and
   then down and back, so reading it is a single unbroken movement rather than
   a hunt in two directions. */
const CLUSTER_SLOTS = [
  { ox: 1240, oy: -560, oz: -300, w: 900 },   /* head, level with the work   */
  { ox: 1320, oy: 200, oz: -120, w: 640 },
  { ox: 1420, oy: 900, oz: 140, w: 640 },
  { ox: 900, oy: 1520, oz: 460, w: 640 },
  { ox: 60, oy: 1840, oz: 760, w: 640 },
  { ox: -840, oy: 1700, oz: 1020, w: 640 },
];

/* On a narrow screen the arc becomes a descent: the story hangs below the
   work and you read it by drawing the space upward. */
const CLUSTER_SLOTS_NARROW = [
  { ox: 40, oy: 900, oz: -40, w: 880 },
  { ox: 40, oy: 2060, oz: 120, w: 820 },
  { ox: 40, oy: 3220, oz: 280, w: 820 },
  { ox: 40, oy: 4380, oz: 440, w: 820 },
  { ox: 40, oy: 5540, oz: 600, w: 820 },
  { ox: 40, oy: 6700, oz: 760, w: 820 },
];
const slots = () => (state.vw < 900 ? CLUSTER_SLOTS_NARROW : CLUSTER_SLOTS);

function openCluster(it) {
  if (state.open === it) return;
  closeCluster();
  const s = it.data.story;
  if (!s) return;

  const family = new Set([it]);
  const nodes = [];
  const add = (cls, html, slot, wide) => {
    const n = el('div', 'obj cluster ' + cls);
    n.appendChild(el('div', 'tw', html));
    const w = (wide || slot.w) * state.S;
    n.style.width = w + 'px';
    const cx = it.x + slot.ox, cy = it.y + slot.oy, cz = it.z + slot.oz;
    n.cz = cz;
    n.twEl = n.firstChild;
    n.style.transform =
      `translate3d(${(cx * state.S).toFixed(1)}px, ${(cy * state.S).toFixed(1)}px, ${(-cz).toFixed(1)}px) translate(-50%, -50%)`;
    n.style.zIndex = String(200000 - Math.round(cz));
    worldEl.appendChild(n);
    nodes.push(n);
    requestAnimationFrame(() => n.classList.add('in'));
    return n;
  };

  const SL = slots();
  const narrow = state.vw < 900;
  let slot = 0;
  add('c-head', `<p class="eyebrow">${esc(s.eyebrow || '')}</p><h3>${esc(s.head)}</h3>`, SL[slot++]);

  for (const p of s.body) {
    add('c-body', `<p>${esc(p)}</p>`, SL[Math.min(slot++, SL.length - 1)]);
  }
  const last = SL[Math.min(slot, SL.length - 1)];
  if (s.pull) add('c-pull', `<p>${esc(s.pull)}</p>`,
    narrow ? { ox: 40, oy: last.oy + 900, oz: last.oz + 160, w: 820 }
           : { ox: -1500, oy: 1420, oz: 1360, w: 820 });
  if (s.sig) add('c-sig', `<p>${esc(s.sig)}</p>`,
    narrow ? { ox: 40, oy: last.oy + 1700, oz: last.oz + 300, w: 560 }
           : { ox: 1300, oy: -1060, oz: -220, w: 560 });

  add('c-close', '<button type="button">Back into the night</button>',
    narrow ? { ox: 40, oy: last.oy + 2400, oz: last.oz + 440, w: 420 }
           : { ox: 1240, oy: -1360, oz: -320, w: 420 });

  /* related works drawn into the cluster keep their own place in the field */
  for (const rid of s.also || []) if (byId[rid]) family.add(byId[rid]);

  clusterNodes = nodes;
  state.open = it;
  state.open.family = family;
  it.node.classList.add('is-open');
  document.body.classList.add('cluster-open');

  /* settle in front of the work, with the cluster opening to your right */
  const focal = clamp(it.sw * (narrow ? 1.15 : 1.5), 760, 2200);
  const k = (state.P + focal) / state.P;
  travel(
    it.x * state.S + (narrow ? 0 : state.vw * 0.16 * k),
    it.y * state.S + (narrow ? state.vh * 0.26 * k : -state.vh * 0.02),
    it.z - focal, 44);
}

function closeCluster() {
  if (!state.open) return;
  state.open.node.classList.remove('is-open');
  for (const n of clusterNodes) { n.classList.remove('in'); setTimeout(() => n.remove(), 340); }
  clusterNodes = [];
  state.open = null;
  document.body.classList.remove('cluster-open');
}

function travel(x, y, z, dur = 48) {
  state.flight = { t: 0, dur, x0: state.camX, y0: state.camY, z0: state.camZ, x1: x, y1: y, z1: z };
}

/* ==================================================================== input */

function bindInput() {
  const cursor = $('#cursor');
  const vp = $('#viewport');
  let drag = null;

  const setTilt = (px, py) => {
    state.tRy = px * 2.6;
    state.tRx = -py * 1.8;
  };

  vp.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    drag = { x: e.clientX, y: e.clientY, sx: state.tX, sy: state.tY, moved: 0, t: performance.now() };
    vp.setPointerCapture(e.pointerId);
    document.body.classList.add('dragging');
  });

  vp.addEventListener('pointermove', (e) => {
    if (!state.coarse) {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    }
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
      const k = 1.9;
      state.tX = clamp(drag.sx - dx * k, BOUNDS.x[0] * state.S, BOUNDS.x[1] * state.S);
      state.tY = clamp(drag.sy - dy * k, BOUNDS.y[0] * state.S, BOUNDS.y[1] * state.S);
      state.vX = 0; state.vY = 0;
      state.flight = null;
    } else {
      setTilt((e.clientX / state.vw - 0.5) * 2, (e.clientY / state.vh - 0.5) * 2);
    }
  });

  const endDrag = (e) => {
    if (!drag) return;
    const dt = Math.max(performance.now() - drag.t, 1);
    if (drag.moved < 6) handleTap(e);
    drag = null;
    document.body.classList.remove('dragging');
  };
  vp.addEventListener('pointerup', endDrag);
  vp.addEventListener('pointercancel', () => { drag = null; document.body.classList.remove('dragging'); });

  vp.addEventListener('wheel', (e) => {
    state.flight = null;
    state.tZ = clamp(state.tZ + e.deltaY * 1.35, BOUNDS.z[0], BOUNDS.z[1]);
  }, { passive: true });

  function handleTap(e) {
    const restart = e.target.closest('.restart');
    if (restart) { travel(0, 0, -2200, 70); return; }
    if (e.target.closest('.c-close')) { closeCluster(); return; }
    const node = e.target.closest('.obj');
    if (!node) { if (state.open) closeCluster(); return; }
    const it = items.find((x) => x.node === node);
    if (!it) return;
    if (it.data.story) openCluster(it);
    else travel(it.sx, it.sy, it.z - clamp(it.sw * 1.5, 900, 2000), 40);
  }

  vp.addEventListener('pointerover', (e) => {
    const node = e.target.closest('.obj');
    if (node && node.classList.contains('near') && items.find((x) => x.node === node)?.data.story) {
      node.classList.add('hot'); cursor.classList.add('hot');
    }
  });
  vp.addEventListener('pointerout', (e) => {
    const node = e.target.closest('.obj');
    if (node) { node.classList.remove('hot'); cursor.classList.remove('hot'); }
  });

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'escape') { closeCluster(); closeMap(); closeReading(); closeColophon(); return; }
    if (k === 'm') { toggleMap(); e.preventDefault(); return; }
    if (k === 'l') { toggleReading(); e.preventDefault(); return; }
    if (k === 'i') { toggleColophon(); e.preventDefault(); return; }
    const step = 260 * state.S;
    if (k === 'arrowleft' || k === 'a') { state.vX -= step * 0.22; e.preventDefault(); }
    if (k === 'arrowright' || k === 'd') { state.vX += step * 0.22; e.preventDefault(); }
    if (k === 'arrowup') { state.vY -= step * 0.22; e.preventDefault(); }
    if (k === 'arrowdown') { state.vY += step * 0.22; e.preventDefault(); }
    if (k === 'w') { state.tZ = clamp(state.tZ + 520, BOUNDS.z[0], BOUNDS.z[1]); e.preventDefault(); }
    if (k === 's') { state.tZ = clamp(state.tZ - 520, BOUNDS.z[0], BOUNDS.z[1]); e.preventDefault(); }
  });

  window.addEventListener('resize', measure);
  if (state.coarse) document.body.classList.add('is-coarse');
}

/* ============================================================ map and plan */

function buildMap() {
  const wrap = $('#map .chapters');
  const plan = $('#plan');
  CONSTELLATIONS.forEach((c) => {
    const b = el('button', 'ch');
    b.dataset.id = c.id;
    b.innerHTML = `<span class="n">${c.n || '·'}</span><h4>${esc(c.title)}</h4><p>${esc(c.eyebrow)}</p>`;
    b.addEventListener('click', () => goTo(c));
    wrap.appendChild(b);

    const p = planPos(c.at[0], c.at[2]);
    const dot = el('button', 'dot');
    dot.dataset.id = c.id;
    dot.style.left = p.x + '%';
    dot.style.top = p.y + '%';
    dot.innerHTML = `<i></i><span>${esc(c.n || '·')} ${esc(c.title)}</span>`;
    dot.addEventListener('click', (e) => { e.stopPropagation(); goTo(c); });
    plan.appendChild(dot);
  });
  plan.appendChild(el('div', 'you'));
}

function goTo(c) {
  closeMap();
  closeCluster();
  travel(c.view[0] * state.S, c.view[1] * state.S, c.view[2], 62);
}

const mapEl = $('#map');
const toggleMap = () => (mapEl.classList.contains('open') ? closeMap() : openMap());
const openMap = () => { mapEl.classList.add('open'); mapEl.setAttribute('aria-hidden', 'false'); };
const closeMap = () => { mapEl.classList.remove('open'); mapEl.setAttribute('aria-hidden', 'true'); };

/* =========================================================== reading room  */

let readingBuilt = false;
function buildReading() {
  if (readingBuilt) return;
  readingBuilt = true;
  let html = `<button class="exit" type="button">Back into the night</button>
    <p class="kicker">Inspired · Issue No. 45</p>
    <h1>The Long Night</h1>
    <p class="dek">The complete texts and works of this issue, linear and still.
      This view is the low-barrier route to the same issue.</p>`;

  for (const c of CONSTELLATIONS) {
    html += `<section><p class="ch-eyebrow">${esc((c.n ? c.n + ' · ' : '') + c.eyebrow)}</p><h2>${esc(c.title)}</h2>`;
    for (const o of c.items) {
      if (o.kind === 'pull' || o.kind === 'type') { html += `<p class="lede">${esc(o.text)}</p>`; continue; }
      if (o.kind === 'year') { html += `<h3>${esc(o.year)}</h3><p>${esc(o.text)}</p>`; continue; }
      if (o.kind === 'voice') { html += `<article><h3>Voices</h3><p>${esc(o.text)}</p><p><strong>${esc(o.who)}</strong></p></article>`; continue; }
      const m = MANIFEST[o.id] || (o.frames && MANIFEST[o.frames[1]]);
      if (m) {
        html += `<figure><img loading="lazy" src="${m.src}" width="${m.w}" height="${m.h}"
          alt="${esc((o.artist ? o.artist + '. ' : '') + (o.caption || o.title || 'Werk aus dieser Ausgabe'))}">
          <figcaption>${esc([o.artist, o.title, o.caption].filter(Boolean).join(' · '))}</figcaption></figure>`;
      }
      if (o.story) {
        html += `<article><h3>${esc(o.story.head)}</h3>`;
        html += o.story.body.map((p) => `<p>${esc(p)}</p>`).join('');
        if (o.story.sig) html += `<p><strong>${esc(o.story.sig)}</strong></p>`;
        html += `</article>`;
      }
    }
    html += `</section>`;
  }
  const col = $('#reading .col');
  col.innerHTML = html;
  col.querySelector('.exit').addEventListener('click', closeReading);
}
const readingEl = $('#reading');
const toggleReading = () => (readingEl.classList.contains('open') ? closeReading() : openReading());
function openReading() { buildReading(); readingEl.classList.add('open'); document.body.classList.add('reading'); readingEl.scrollTop = 0; }
function closeReading() { readingEl.classList.remove('open'); document.body.classList.remove('reading'); }

const colEl = $('#colophon');
const toggleColophon = () => colEl.classList.toggle('open');
const closeColophon = () => colEl.classList.remove('open');

/* ==================================================================== boot */

async function boot() {
  MANIFEST = await fetch('assets/manifest.json').then((r) => r.json());

  for (const o of OBJECTS) {
    const it = buildObject(o);
    if (!it) continue;
    it.type = !it.art;
    items.push(it);
    byId[o.id] = it;
  }
  /* Painting order is depth order: elements carrying an opacity are flattened
     out of the browser's 3D sort, so the DOM is written back to front. */
  const frag = document.createDocumentFragment();
  for (const it of [...items].sort((a, b) => b.z - a.z)) {
    it.node.style.zIndex = String(200000 - Math.round(it.z));
    frag.appendChild(it.node);
  }
  worldEl.appendChild(frag);

  buildMap();
  measure();
  bindInput();

  $('#keys [data-act="map"]').addEventListener('click', toggleMap);
  $('#keys [data-act="read"]').addEventListener('click', toggleReading);
  $('#keys [data-act="about"]').addEventListener('click', toggleColophon);
  $('#colophon .close').addEventListener('click', closeColophon);
  $('#here').addEventListener('click', toggleMap);

  window.inspired = {
    state, items, CONSTELLATIONS,
    go: (x, y, z) => travel(x * state.S, y * state.S, z, 40),
    jump(x, y, z) { state.camX = state.tX = x * state.S; state.camY = state.tY = y * state.S; state.camZ = state.tZ = z; state.flight = null; },
    chapter: (id) => { const c = CONSTELLATIONS.find((k) => k.id === id); if (c) goTo(c); },
    open: (id) => byId[id] && openCluster(byId[id]),
  };

  $('#overture .enter').addEventListener('click', () => {
    $('#overture').classList.add('gone');
    setTimeout(() => $('#overture')?.remove(), 1400);
    state.running = true;
    requestAnimationFrame(frame);
    /* one slow arrival, so the space is seen to move before you touch it */
    if (!state.reduced) travel(0, 0, -900, 120);
    else { state.tZ = -900; }
  });
}

boot();
