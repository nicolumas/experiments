/* Die Farben des Winters (v4): the sled ride.
   One continuous winter day on a sled, from the birch slope in the morning to the shore at last light, then the LUMAS
   gallery in the evening. One touch: tap to jump, hold to float. Flecks in the colours of the next work float over the
   hills; at each viewpoint the sled stops and the blank canvas on the hill fills with the real work.
   Plain JS, no dependencies. Music: js/audio.js. Data: data.js. */
(() => {
  'use strict';

  /* ------------------------------------------------------------ basics */

  const G = (window.GAL = window.GAL || {});
  const q = new URLSearchParams(location.search);
  let LANG = (G.LANG = q.get('lang') === 'en' ? 'en' : 'de');
  const RM = (G.RM = matchMedia('(prefers-reduced-motion: reduce)').matches);
  const SPEED = (G.SPEED = q.has('fast') ? 3 : 1);
  const AUTO = q.has('auto');
  const DATA = window.GAL_DATA;
  document.documentElement.lang = LANG;
  const $ = (s) => document.querySelector(s);
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(kid));
    return el;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const TAU = Math.PI * 2;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms / SPEED));
  const anim = (el, frames, opts = {}) => new Promise((resolve) => {
    const duration = RM ? 1 : (opts.duration ?? 400) / SPEED;
    const a = el.animate(frames, { easing: 'cubic-bezier(.23,1,.32,1)', ...opts, duration, delay: RM ? 0 : (opts.delay ?? 0) / SPEED, fill: 'forwards' });
    const last = frames[frames.length - 1];
    let done = false;
    const finish = () => { if (done) return; done = true; for (const [k, v] of Object.entries(last)) if (k !== 'offset') el.style[k] = v; a.cancel(); resolve(); };
    a.finished.then(finish, finish);
    setTimeout(finish, duration + (opts.delay ?? 0) / SPEED + 300);
  });

  /* ------------------------------------------------------------ copy */

  const COPIES = {
    de: {
      startEyebrow: 'Kunstvolle Weihnachten',
      title: 'Die Farben des Winters',
      startLede: 'Ein Wintertag auf dem Schlitten. Unterwegs stehen fünf Werke im Schnee, eines für jedes Gefühl, das sich schwer sagen lässt. Sammle ihre Farben ein. Am Abend wählst du in der Galerie das eine, das es für dich sagt: ein handsigniertes Werk.',
      nameLabel: 'Für wen suchst du nach Worten?', namePh: 'Name, optional',
      budgetLabel: 'Dein Budget', budget_low: 'Bis € 250', budget_mid: 'Bis € 1.000', budget_high: 'Ohne Limit',
      go: 'Losfahren', allWorks: 'Alle Werke ohne Spiel', musicNote: 'Mit leiser Musik. Du kannst sie oben jederzeit ausschalten.',
      tGallery: 'Zur Galerie', tBook: 'Werke', tMusic: 'Musik', musicOn: 'Musik an', musicOff: 'Musik aus',
      howTo: 'Tippen zum Springen. Halten zum Schweben.',
      feel: { gratitude: 'Dankbarkeit', admiration: 'Bewunderung', memory: 'Erinnerung', hope: 'Hoffnung', love: 'Liebe' },
      place: { birch: 'Am Birkenhang, morgens', lake: 'Am See, vormittags', mountain: 'Am Berg, mittags', village: 'Im Dorf, zur blauen Stunde', shore: 'Am Meer, im letzten Licht' },
      ded: { birch: 'Für alles, was nie selbstverständlich war.', lake: 'Für einen Moment, der geblieben ist.', mountain: 'Für jemanden, zu dem du aufschaust.', village: 'Für alles, was noch kommt.', shore: 'Für das, was zwei Menschen verbindet.' },
      onward: 'Weiterfahren', tapOn: 'oder tippen',
      handsigned: 'Handsigniert', edition: 'Edition von {n}', from: 'ab', smallest: 'kleinste Größe', toWork: 'Zum Werk', about: 'Über das Werk',
      streetEyebrow: 'Am Abend', streetLine: 'In der Galerie brennt noch Licht.', streetSub: 'Deine fünf Werke warten drinnen.', enter: 'Eintreten',
      window: ['Kunstvolle', 'Weihnachten'],
      galleryEyebrow: 'In der Galerie', galleryLine: 'Welches Werk sagt es?', gallerySub: 'Tipp auf ein Werk.',
      choose: 'Dieses Werk sagt es', back: 'Zurück',
      found: { birch: 'Gefunden am Birkenhang, im ersten Licht des Tages.', lake: 'Gefunden am See, als das Eis in der Sonne lag.', mountain: 'Gefunden oben am Berg, in der Mittagssonne.', village: 'Gefunden im Dorf, als die Lichter angingen.', shore: 'Gefunden am Meer, im letzten Licht.' },
      signedBy: 'Handsigniert von {artist}. Edition von {n}.', tapMore: 'Tippen zum Weiterlesen',
      endEyebrow: 'Eine Nachricht ohne Worte', tagTo: 'Für {name}', tagNoName: 'Ohne Worte', secure: 'Werk sichern', again: 'Noch einmal fahren',
      bookTitle: 'Deine Werke von heute', bookEmpty: 'Noch keines. Jeder Aussichtspunkt zeigt dir ein Werk.', allTitle: 'Alle Werke dieses Winters', close: 'Schließen',
    },
    en: {
      startEyebrow: 'Artful Christmas',
      title: 'The Colours of Winter',
      startLede: 'One winter day on a sled. On the way, five works stand in the snow, one for each feeling that is hard to put into words. Gather their colours. In the evening, at the gallery, you choose the one that says it for you: a hand-signed work.',
      nameLabel: 'Who are you looking for words for?', namePh: 'Name, optional',
      budgetLabel: 'Your budget', budget_low: 'Up to € 250', budget_mid: 'Up to € 1,000', budget_high: 'No limit',
      go: 'Set off', allWorks: 'All works without the game', musicNote: 'With quiet music. You can switch it off at the top at any time.',
      tGallery: 'To the gallery', tBook: 'Works', tMusic: 'Music', musicOn: 'Music on', musicOff: 'Music off',
      howTo: 'Tap to jump. Hold to float.',
      feel: { gratitude: 'Gratitude', admiration: 'Admiration', memory: 'Memory', hope: 'Hope', love: 'Love' },
      place: { birch: 'The birch slope, morning', lake: 'The lake, late morning', mountain: 'The mountain, noon', village: 'The village, blue hour', shore: 'The sea, last light' },
      ded: { birch: 'For everything that was never a given.', lake: 'For a moment that stayed.', mountain: 'For someone you look up to.', village: 'For everything still to come.', shore: 'For what connects two people.' },
      onward: 'Ride on', tapOn: 'or tap',
      handsigned: 'Hand-signed', edition: 'Edition of {n}', from: 'from', smallest: 'smallest size', toWork: 'View the work', about: 'About the work',
      streetEyebrow: 'In the evening', streetLine: 'The gallery still has its lights on.', streetSub: 'Your five works are waiting inside.', enter: 'Step inside',
      window: ['Artful', 'Christmas'],
      galleryEyebrow: 'In the gallery', galleryLine: 'Which work says it?', gallerySub: 'Tap a work.',
      choose: 'This work says it', back: 'Back',
      found: { birch: 'Found on the birch slope, in the first light of the day.', lake: 'Found by the lake, while the ice lay in the sun.', mountain: 'Found high on the mountain, in the midday sun.', village: 'Found in the village, as the lights came on.', shore: 'Found by the sea, in the last light.' },
      signedBy: 'Hand-signed by {artist}. Edition of {n}.', tapMore: 'Tap to read on',
      endEyebrow: 'A message without words', tagTo: 'For {name}', tagNoName: 'Without words', secure: 'Secure your edition', again: 'Ride again',
      bookTitle: 'Your works today', bookEmpty: 'None yet. Every viewpoint shows you a work.', allTitle: 'All works this winter', close: 'Close',
    },
  };
  COPIES.de.tGalleryShort = 'Galerie';
  COPIES.en.tGalleryShort = 'Gallery';
  COPIES.de.langSwitch = 'EN'; COPIES.de.langLabel = 'English';
  COPIES.en.langSwitch = 'DE'; COPIES.en.langLabel = 'Deutsch';
  let COPY = COPIES[LANG];
  const t = (key, vars = {}) => String(key.split('.').reduce((o, k) => o?.[k], COPY) ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  const keepTogether = (text) => {
    const words = String(text).split(' ');
    if (words.length < 3) return text;
    let out = '';
    let run = 0;
    words.forEach((word, i) => {
      if (i === 0) { out = word; run = word.length; return; }
      const glue = (i === words.length - 1 || words[i - 1].length <= 3) && run + word.length < 24;
      out += (glue ? ' ' : ' ') + word;
      run = glue ? run + 1 + word.length : word.length;
    });
    return out;
  };
  const fmtNum = (n) => n.toLocaleString(LANG === 'de' ? 'de-DE' : 'en-GB');
  const fromPrice = (n) => `${t('from')} € ${fmtNum(n)}`;
  const cm = (mm) => { const v = Math.round(mm) / 10; const s = Number.isInteger(v) ? String(v) : v.toFixed(1); return LANG === 'de' ? s.replace('.', ',') : s; };
  const size = (w) => `${cm(w.w)} × ${cm(w.h)} cm`;
  const pdp = (w) => DATA.config.pdpBase + w.path;

  window.dataLayer = window.dataLayer || [];
  const track = (event, payload = {}) => window.dataLayer.push({ event, gal_lang: LANG, gal_v: 'ride', ...payload });
  function workLink(w, where, { label = t('toWork'), cls = 'link', sameTab = false } = {}) {
    return h('a', {
      class: cls, href: pdp(w), target: sameTab ? null : '_blank', rel: sameTab ? null : 'noopener',
      onclick: () => {
        window.dataLayer.push({ ecommerce: null });
        window.dataLayer.push({ event: 'select_item', gal_where: where, ecommerce: { item_list_name: 'galerie_ride', items: [{ item_id: w.sku, item_name: w.title, item_brand: w.artist, price: w.ab }] } });
      },
    }, label);
  }
  const buzz = (pattern) => {
    if (RM || !navigator.vibrate) return;
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    try { navigator.vibrate(pattern); } catch (e) { /* not allowed */ }
  };
  const audio = () => G.audio || {};
  const sfx = (fn, ...a) => { try { const A = audio(); if (A[fn]) return A[fn](...a); } catch (e) { /* sound is never allowed to break the ride */ } return undefined; };

  /* ------------------------------------------------------------ the day */

  /* Each world: its plate, its feeling, how the snow behaves, what grows there, who is standing by its work. */
  const WORLDS = [
    { id: 'birch', feeling: 'gratitude', ride: 4600, slope: 0.1, mu: 0.045, hills: [[70, 1080, 0.3], [16, 420, 1.7]], props: ['birches', 'birches', 'firs', 'grass'], tint: [252, 246, 246], shade: [214, 207, 236], cast: ['winter-dog-walker', 'winter-photographer', 'playful-winter-child'],
      life: [{ id: 'cross-country-skier', depth: 'back', at: 0.15, vx: 55 }, { id: 'winter-dog-walker', depth: 'mid', at: 0.5, vx: -26 }, { id: 'snowshoe-walker', depth: 'back', at: 0.7, vx: -22 }] },
    { id: 'lake', feeling: 'memory', ride: 4400, slope: 0.035, mu: 0.007, hills: [[26, 880, 2.2], [9, 300, 0.6]], props: ['firs', 'fence', 'firs'], tint: [246, 250, 254], shade: [186, 206, 232], cast: ['snowball-thrower', 'catching-snowball', 'hot-drink-pause'],
      life: [{ id: 'cross-country-skier', depth: 'back', at: 0.1, vx: 70 }, { id: 'snowball-thrower', depth: 'mid', at: 0.42, vx: 0, pair: 'catching-snowball' }, { id: 'carrying-skis', depth: 'back', at: 0.75, vx: 24 }] },
    { id: 'mountain', feeling: 'admiration', ride: 5200, slope: 0.17, mu: 0.04, hills: [[92, 1250, 1.1], [20, 520, 2.9]], props: ['firs', 'firs', 'firs'], tint: [250, 252, 255], shade: [190, 208, 236], cast: ['downhill-skier', 'snowboarder', 'skier-resting'],
      life: [{ id: 'downhill-skier', depth: 'back', at: 0.05, vx: 150 }, { id: 'snowboarder', depth: 'back', at: 0.4, vx: 130 }, { id: 'carrying-skis', depth: 'mid', at: 0.62, vx: 22 }] },
    { id: 'village', feeling: 'hope', ride: 4600, slope: 0.085, mu: 0.045, hills: [[56, 960, 0.9], [14, 400, 2.4]], props: ['lamp', 'fence', 'firs', 'lamp'], tint: [226, 228, 246], shade: [168, 170, 214], cast: ['carrying-toboggan', 'hot-drink-pause', 'pulling-empty-sled'],
      life: [{ id: 'sledging-child', depth: 'back', at: 0.2, vx: 95 }, { id: 'carrying-toboggan', depth: 'mid', at: 0.46, vx: 28 }, { id: 'hot-drink-pause', depth: 'mid', at: 0.78, vx: 0 }] },
    { id: 'shore', feeling: 'love', ride: 4600, slope: 0.07, mu: 0.045, hills: [[52, 880, 1.6], [15, 360, 0.4]], props: ['grass', 'grass', 'fence'], tint: [252, 244, 236], shade: [214, 196, 206], cast: ['snowshoe-walker', 'winter-dog-walker', 'cross-country-skier'],
      life: [{ id: 'winter-dog-walker', depth: 'back', at: 0.15, vx: 30 }, { id: 'snowshoe-walker', depth: 'mid', at: 0.5, vx: -24 }, { id: 'playful-winter-child', depth: 'mid', at: 0.8, vx: 0 }] },
  ];
  const KIT = {};
  const PLATEAU = 1300;
  const LEAD = 420; /* the quiet start of each world before the hills begin */
  const STREET = 1500;
  const STEP = 4;
  let X = 0;
  for (const w of WORLDS) {
    w.x0 = X;
    w.rideEnd = X + LEAD + w.ride;
    w.canvasX = w.rideEnd + 640;
    w.stopX = w.canvasX - 300;
    w.x1 = w.rideEnd + PLATEAU;
    X = w.x1;
  }
  const COURSE_END = X + STREET;
  const worldAt = (x) => WORLDS.find((w) => x < w.x1) || WORLDS[WORLDS.length - 1];

  /* the snow line: a gentle downhill with hills, flat at every viewpoint and in the street */
  const N = Math.ceil(COURSE_END / STEP) + 2;
  const Y = new Float32Array(N);
  (function buildTerrain() {
    let base = 0;
    for (let i = 0; i < N; i++) {
      const x = i * STEP;
      const w = worldAt(x);
      const inRide = x >= w.x0 + LEAD * 0.4 && x < w.rideEnd;
      const env = inRide ? smooth((x - w.x0 - LEAD * 0.4) / 700) * smooth((w.rideEnd - x) / 600) : 0;
      base += w.slope * env * STEP;
      let hill = 0;
      for (const [A, L, ph] of w.hills) hill += A * Math.sin((TAU * x) / L + ph);
      /* the mountain has a couple of real kickers */
      if (w.id === 'mountain') for (const c of [0.32, 0.58, 0.82]) { const cx = w.x0 + LEAD + w.ride * c; const d = (x - cx) / 160; hill -= 48 * Math.exp(-d * d); }
      Y[i] = base + hill * env;
    }
  })();
  const groundY = (x) => {
    const f = clamp(x / STEP, 0, N - 2);
    const i = Math.floor(f);
    return Y[i] + (Y[i + 1] - Y[i]) * (f - i);
  };
  const slopeAt = (x) => (groundY(x + 6) - groundY(x - 6)) / 12;

  /* ------------------------------------------------------------ assets */

  const IMG = {};
  const loadImg = (key, src) => (IMG[key] = IMG[key] || new Promise((res) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));
  const ready = {};
  function want(key, src) { if (!(key in ready)) { ready[key] = null; loadImg(key, src).then((i) => { ready[key] = i; }); } return ready[key]; }
  const plateImg = (id) => want(`plate:${id}`, `assets/scenes/${id}-w.webp`);
  const layerImg = (id) => want(`layer:${id}`, `assets/layers/${id}.webp`);
  const kitImg = (id) => want(`kit:${id}`, `assets/people/kit/${id}.webp`);
  const artImg = (w) => want(`art:${w.code}`, `assets/art/${w.code}.webp`);
  fetch('assets/people/kit/_meta.json').then((r) => r.json()).then((m) => Object.assign(KIT, m)).catch(() => {});
  const kitAr = (id) => (KIT[id] && KIT[id].ar) || 0.65;
  const MOVE = { 'cross-country-skier': 'ski', 'downhill-skier': 'ski', snowboarder: 'ski', 'skier-resting': 'ski', 'sledging-child': 'sled', 'snowball-thrower': 'stand', 'catching-snowball': 'stand', 'hot-drink-pause': 'stand', 'winter-photographer': 'stand' };
  const moveOf = (id) => MOVE[id] || 'walk';
  const FACES_LEFT = new Set(['winter-dog-walker', 'winter-photographer', 'pulling-empty-sled']);
  const sizeOf = (id) => (id === 'playful-winter-child' ? 0.78 : id === 'sledging-child' ? 0.8 : 1);
  const LAYER_AR = { birches: 684 / 1344, firs: 977 / 759, grass: 968 / 829, lamp: 481 / 1268, fence: 954 / 557, snowbank: 1344 / 257 };
  const LAYER_H = { birches: 360, firs: 170, grass: 96, lamp: 230, fence: 78 };

  /* a work's own colours, for the flecks that carry it (sampled once from the real image) */
  function paletteOf(img) {
    try {
      const c = document.createElement('canvas');
      c.width = 36; c.height = 36;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0, 36, 36);
      const d = g.getImageData(0, 0, 36, 36).data;
      const bins = new Map();
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i]; const gg = d[i + 1]; const b = d[i + 2];
        const mx = Math.max(r, gg, b); const mn = Math.min(r, gg, b);
        const sat = mx ? (mx - mn) / mx : 0;
        if (mx < 95 || sat < 0.2 || (sat < 0.25 && mx > 215)) continue;
        const key = `${r >> 5},${gg >> 5},${b >> 5}`;
        const e = bins.get(key) || { n: 0, r: 0, g: 0, b: 0, s: 0 };
        e.n++; e.r += r; e.g += gg; e.b += b; e.s += sat;
        bins.set(key, e);
      }
      const list = [...bins.values()].map((e) => ({ c: [e.r / e.n, e.g / e.n, e.b / e.n].map(Math.round), w: e.n * (0.4 + e.s / e.n) })).sort((a, b) => b.w - a.w);
      const out = [];
      for (const e of list) { if (out.every((o) => Math.hypot(o[0] - e.c[0], o[1] - e.c[1], o[2] - e.c[2]) > 60)) out.push(e.c); if (out.length >= 5) break; }
      return out.length ? out : [[200, 120, 90]];
    } catch (e) { return [[200, 120, 90], [90, 120, 170]]; }
  }

  /* ------------------------------------------------------------ state */

  const S = {
    phase: 'start', budget: DATA.config.budgets.find((b) => b.default).id, name: '',
    pick: {}, found: [], skipped: false,
  };
  function pickWork(feeling) {
    const pool = DATA.works.filter((w) => w.feeling === feeling);
    const rand = (a) => a[Math.floor(Math.random() * a.length)];
    if (S.budget === 'low') return pool.filter((w) => w.ab <= 250).sort((a, b) => a.ab - b.ab)[0] || pool[0];
    const mid = pool.filter((w) => w.ab > 250 && w.ab <= 1000);
    if (S.budget === 'mid') return rand(mid.length ? mid : pool.filter((w) => w.ab <= 1000));
    const high = pool.filter((w) => w.ab > 1000);
    return Math.random() < 0.7 && high.length ? rand(high) : rand(mid.length ? mid : pool);
  }

  /* the sled */
  const sled = { x: 140, y: 0, vx: 0, vy: 0, ang: 0, ground: true, air: 0, lastGround: 0, sq: 1, sqv: 0, lean: 0, holding: false, holdT: 0, buffered: -9, moving: false, braking: false, stopAt: null, tumble: 0 };
  sled.y = groundY(sled.x);
  let H_SLED = 92;

  /* the world's things: props, flecks, cast, canvases */
  const props = [];
  const flecks = [];
  const cast = [];
  const life = [];
  const balls = [];
  const particles = [];
  const tracks = [];
  const flying = []; /* flecks on their way to the canvas */
  function populate() {
    for (const w of WORLDS) {
      /* props: some behind the snow line, some on it, a few in front of the camera */
      let x = w.x0 + 260;
      while (x < w.x1 - 200) {
        const kind = w.props[Math.floor(Math.random() * w.props.length)];
        const nearCanvas = Math.abs(x - w.canvasX) < 520;
        const depth = nearCanvas ? (Math.random() < 0.5 ? 'back' : 'mid') : Math.random() < 0.12 ? 'front' : Math.random() < 0.55 ? 'mid' : 'back';
        if (!(nearCanvas && depth === 'mid' && Math.abs(x - w.canvasX) < 360)) props.push({ kind, x, depth, s: depth === 'front' ? rnd(1.5, 2.1) : depth === 'back' ? rnd(0.42, 0.62) : rnd(0.8, 1.15), flip: Math.random() < 0.5, w });
        x += rnd(240, 620) * (kind === 'birches' ? 0.9 : 1);
      }
      /* flecks: a few low runs you meet anyway, and arcs over the crests that you only reach with a jump */
      const start = w.x0 + LEAD + 500;
      const end = w.rideEnd - 300;
      for (let fx = start; fx < end; fx += rnd(260, 380)) {
        const crest = slopeAt(fx - 60) < -0.05 && slopeAt(fx + 60) > 0.05;
        const high = crest || Math.random() < 0.38;
        const n = high ? 5 : 3;
        for (let k = 0; k < n; k++) {
          const xx = fx + k * 46;
          const arc = high ? Math.sin(((k + 0.5) / n) * Math.PI) : 0;
          flecks.push({ x: xx, y: groundY(xx) - (high ? 120 + arc * 80 : 44), w, got: false, ph: Math.random() * 6, ci: Math.floor(Math.random() * 5) });
        }
        fx += n * 46;
      }
      w.fleckTotal = flecks.filter((f) => f.w === w).length;
      w.fleckGot = 0;
      /* people waiting by the work */
      w.cast.forEach((id, i) => cast.push({ id, w, slot: i, x: null, state: 'away', hop: 0, hv: 0, ph: Math.random() * 6, delay: rnd(0, 0.9) + i * 0.35, flash: 0 }));
      for (const L of w.life) {
        const x = w.x0 + LEAD + w.ride * L.at;
        life.push({ ...L, w, x, ph: Math.random() * 6, hop: 0, hv: 0, cheered: false });
        if (L.pair) life.push({ id: L.pair, depth: L.depth, vx: 0, w, x: x + 120, ph: Math.random() * 6, hop: 0, hv: 0, cheered: false, catcher: true });
      }
    }
  }
  populate();

  /* ------------------------------------------------------------ view + camera */

  const cv = $('#ride');
  const g = cv.getContext('2d');
  let vw = 0;
  let vh = 0;
  let dpr = 1;
  let portrait = true;
  const cam = { x: 0, y: 0, z: 1, sx: 0, sy: 0, shake: 0 };
  function resize() {
    vw = innerWidth;
    vh = innerHeight;
    portrait = vw / vh < 0.9;
    dpr = Math.min(2, devicePixelRatio || 1);
    H_SLED = portrait ? 92 : 112;
    cv.width = Math.round(vw * dpr);
    cv.height = Math.round(vh * dpr);
    layoutScenes();
  }
  const baseZoom = () => (portrait ? clamp(vw / 520, 0.62, 0.86) : clamp(vh / 980, 0.78, 1.1));
  const toScreen = (x, y) => ({ x: (x - cam.x) * cam.z, y: (y - cam.y) * cam.z });

  /* ------------------------------------------------------------ input: one touch */

  const input = { down: false, any: false };
  function press() {
    if (S.phase === 'ride') {
      input.down = true;
      sled.holding = true;
      sled.holdT = 0;
      sled.buffered = now();
      if (!input.any) { input.any = true; hideHowTo(); }
    } else if (S.phase === 'admire' && S.canGo) S.canGo();
  }
  function release() { input.down = false; sled.holding = false; }
  const now = () => performance.now() / 1000;
  cv.addEventListener('pointerdown', (e) => { e.preventDefault(); press(); });
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if (e.code === 'Space' || e.code === 'ArrowUp' || (e.code === 'Enter' && S.phase === 'admire')) { e.preventDefault(); if (!e.repeat) press(); }
  });
  addEventListener('keyup', (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') release(); });

  /* ------------------------------------------------------------ physics */

  const GRAV = 1250;
  const JUMP = 560;
  const VMIN = 230;
  const VMAX = 760;
  const COYOTE = 0.11;
  const BUFFER = 0.13;
  function jump() {
    sled.ground = false;
    sled.bounced = false;
    sled.vy = Math.min(sled.vy, 0) - JUMP;
    sled.air = 0;
    sled.sqv -= 6;
    sled.buffered = -9;
    puff(sled.x - 10, groundY(sled.x), 10, 0.8);
    sfx('pluck', noteHz(4 + (S.jumps++ % 3)), { gain: 0.16 });
    buzz(6);
  }
  const noteHz = (i, oct = 1) => (audio().note ? audio().note(i, oct) : 440);
  function physics(dt) {
    const w = worldAt(sled.x);
    const gy = groundY(sled.x);
    const sl = slopeAt(sled.x);
    const ang = Math.atan(sl);
    const tnow = now();
    if (sled.ground) {
      /* gravity along the slope, a little friction, air drag, and an invisible push so the sled never stalls */
      let ax = GRAV * Math.sin(ang) * Math.cos(ang) - w.mu * GRAV * Math.cos(ang) * Math.sign(sled.vx) - 0.00042 * sled.vx * sled.vx;
      /* the child paddles with her hands: enough to beat any climb, so the sled never stalls */
      if (!sled.braking && sled.vx < VMIN) ax += 420 + Math.max(0, -GRAV * Math.sin(ang) * Math.cos(ang)) * 1.05;
      if (sled.braking) {
        const left = sled.stopAt - sled.x;
        const want = Math.max(0, Math.sqrt(Math.max(0, left) * 2 * 520));
        ax = (Math.min(want, sled.vx) - sled.vx) * 6;
        if (left < 2 || sled.vx < 4) { sled.vx = 0; ax = 0; }
      }
      sled.vx = clamp(sled.vx + ax * dt, sled.braking ? 0 : 150, VMAX);
      const nx = sled.x + sled.vx * dt;
      const ngy = groundY(nx);
      /* leave the snow when it drops away faster than you would fall */
      const fall = sled.y + sled.vy * dt + 0.5 * GRAV * dt * dt;
      const vyGround = (ngy - gy) / Math.max(dt, 1e-4);
      if (fall < ngy - 4 && sled.vx > 300 && !sled.braking) {
        sled.ground = false;
        sled.air = 0;
        sled.vy = Math.min(sled.vy, vyGround * 0.6);
      } else {
        sled.vy = vyGround;
        sled.y = ngy;
        sled.lastGround = tnow;
      }
      sled.x = nx;
      if (sled.ground && tnow - sled.buffered < BUFFER && !sled.braking) jump();
    } else {
      sled.air += dt;
      const floaty = sled.holding && sled.air < 1.05 && sled.vy > -240;
      sled.vy += GRAV * (floaty ? 0.4 : 1) * dt;
      sled.vx = clamp(sled.vx - 0.00018 * sled.vx * sled.vx * dt, 0, VMAX);
      sled.x += sled.vx * dt;
      sled.y += sled.vy * dt;
      const ng = groundY(sled.x);
      if (tnow - sled.lastGround < COYOTE && tnow - sled.buffered < 0.05 && sled.air < COYOTE) jump();
      if (sled.y >= ng) {
        /* landing: soft and springy. A real drop gives a little rebound before the runners settle, a squash that
           bounces back, a puff of powder, never a jolt */
        const impact = sled.vy - sled.vx * slopeAt(sled.x);
        sled.y = ng;
        sled.lastGround = tnow;
        sled.sqv += clamp(impact / 120, 0, 6.5);
        puff(sled.x, ng, clamp(Math.round(impact / 50), 3, 16), clamp(impact / 700, 0.5, 1.3));
        if (impact > 220) { sfx('pluck', noteHz(2, 0), { gain: clamp(impact / 6000, 0.04, 0.12) }); buzz(6); }
        if (impact > 170 && !sled.bounced && !sled.braking) {
          sled.bounced = true;
          sled.vy = -Math.min(impact * 0.26, 210);
          sled.air = 0.3;
        } else {
          sled.ground = true;
          sled.bounced = false;
          sled.vy = 0;
        }
        sled.vx = Math.max(sled.vx * 0.985, VMIN * 0.9);
        if (tnow - sled.buffered < BUFFER) jump();
      }
    }
    /* how the sled sits: along the snow on the ground, a slow nose-up or nose-down in the air */
    const height = sled.ground ? 0 : Math.max(0, groundY(sled.x) - sled.y);
    const landing = Math.atan(slopeAt(sled.x + sled.vx * 0.12));
    const near = clamp(1 - height / 90, 0, 1);
    const target = sled.ground ? ang : lerp(clamp(sled.vy / 2600, -0.18, 0.22) + landing * 0.4, landing, near);
    sled.ang = lerp(sled.ang, target, 1 - Math.exp(-(sled.ground ? 22 : 5 + near * 10) * dt));
    sled.sq += sled.sqv * dt;
    sled.sqv += (-(sled.sq - 1) * 170 - sled.sqv * 10) * dt;
    sled.lean = lerp(sled.lean, sled.holding && !sled.ground && near < 0.6 ? -0.1 : 0, 1 - Math.exp(-6 * dt));
    /* snow spray and the sled's track */
    if (sled.ground && sled.vx > 120) {
      if (Math.random() < sled.vx / 900) particles.push({ x: sled.x - 18, y: sled.y - 2, vx: -sled.vx * rnd(0.05, 0.25), vy: -rnd(40, 140), r: rnd(1.4, 3.2), life: rnd(0.4, 0.9), age: 0 });
      const lt = tracks[tracks.length - 1];
      if (!lt || sled.x - lt.x > 10) tracks.push({ x: sled.x, y: sled.y });
      if (tracks.length > 400) tracks.shift();
    }
    if (sled.braking && sled.vx > 20) for (let k = 0; k < 2; k++) particles.push({ x: sled.x + 16, y: sled.y - 2, vx: rnd(20, 160), vy: -rnd(60, 200), r: rnd(1.6, 3.6), life: rnd(0.5, 1), age: 0 });
  }
  function puff(x, y, n, k = 1) {
    if (RM) return;
    for (let i = 0; i < n; i++) particles.push({ x: x + rnd(-14, 14), y: y - 2, vx: rnd(-120, 120) * k, vy: -rnd(40, 220) * k, r: rnd(1.5, 3.6), life: rnd(0.5, 1.1), age: 0 });
  }

  /* ------------------------------------------------------------ flecks, collection */

  const W = (id) => WORLDS.find((w) => w.id === id);
  function collect(dt) {
    const cx = sled.x;
    const cy = sled.y - H_SLED * 0.55;
    for (const f of flecks) {
      if (f.got) continue;
      if (Math.abs(f.x - cx) > 60) continue;
      const fy = f.y + Math.sin(now() * 2.2 + f.ph) * 6;
      if (Math.hypot(f.x - cx, fy - cy) < 48) {
        f.got = true;
        f.w.fleckGot++;
        const k = f.w.fleckGot / Math.max(1, f.w.fleckTotal);
        S.chain = (S.chain || 0) + 1;
        sfx('pluck', noteHz(S.chain % 9, 1 + Math.floor(S.chain / 9) % 2), { gain: 0.14, pan: 0.2 });
        if (S.chain % 4 === 0) sfx('progress', k);
        flying.push({ x: f.x, y: fy, c: f.w.pal ? f.w.pal[f.ci % f.w.pal.length] : [220, 160, 90], t: 0, to: 'hud', w: f.w });
        updateRings();
      }
    }
  }

  /* ------------------------------------------------------------ drawing */

  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mixc = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  function look(x) {
    /* the snow's light changes through the day: blend each world's tint into the next across the viewpoint */
    const i = WORLDS.indexOf(worldAt(x));
    const w = WORLDS[i];
    const nx = WORLDS[i + 1];
    const k = nx ? smooth((x - (w.x1 - 700)) / 900) : 0;
    return { tint: nx ? mixc(w.tint, nx.tint, k) : w.tint, shade: nx ? mixc(w.shade, nx.shade, k) : w.shade, w, nx, k };
  }
  function drawBackdrop(L) {
    /* the painted plate of the world, drifting slowly (the far distance), crossfading into the next world's plate */
    const draw = (w, alpha) => {
      const img = plateImg(w.id);
      if (!img || alpha <= 0) return;
      const ar = img.width / img.height;
      let ph = vh * 1.08;
      let pw = ph * ar;
      if (pw < vw * 1.12) { pw = vw * 1.12; ph = pw / ar; }
      const prog = clamp((cam.x - w.x0 + vw / cam.z * 0.3) / (w.x1 - w.x0), 0, 1);
      const x = -(pw - vw) * prog;
      const y = (vh - ph) * 0.5 - vh * 0.06;
      g.globalAlpha = alpha;
      g.drawImage(img, x, y, pw, ph);
      g.globalAlpha = 1;
    };
    draw(L.w, 1);
    if (L.nx && L.k > 0) draw(L.nx, L.k);
  }
  function drawRidge(L) {
    /* a far snow ridge between the plate and the snow line: depth, and it hides where the plate's own snow begins */
    const z = cam.z;
    const base = (groundY(cam.x + vw / z * 0.5) - cam.y) * z - vh * 0.1;
    g.beginPath();
    g.moveTo(0, vh);
    for (let sx = 0; sx <= vw + 8; sx += 8) {
      const wx = cam.x * 0.45 + sx / z;
      const y = base + Math.sin(wx / 260) * 18 + Math.sin(wx / 97 + 1.3) * 7 - (sx / vw) * 6;
      g.lineTo(sx, y);
    }
    g.lineTo(vw, vh);
    g.closePath();
    const grd = g.createLinearGradient(0, base - 30, 0, vh);
    grd.addColorStop(0, rgba(mixc(L.tint, [255, 255, 255], 0.3), 0.96));
    grd.addColorStop(1, rgba(L.tint, 1));
    g.fillStyle = grd;
    g.fill();
  }
  function snowPath(x0, x1) {
    g.beginPath();
    const s0 = toScreen(x0, groundY(x0));
    g.moveTo(s0.x, s0.y);
    for (let x = x0; x <= x1; x += 6 / cam.z) { const s = toScreen(x, groundY(x)); g.lineTo(s.x, s.y); }
  }
  function drawSnow(L) {
    const x0 = cam.x - 20;
    const x1 = cam.x + vw / cam.z + 20;
    snowPath(x0, x1);
    g.lineTo(vw + 20, vh + 20);
    g.lineTo(-20, vh + 20);
    g.closePath();
    const top = toScreen(cam.x, groundY(cam.x + vw / cam.z * 0.5)).y;
    const grd = g.createLinearGradient(0, top - 40, 0, vh);
    grd.addColorStop(0, rgba(mixc(L.tint, [255, 255, 255], 0.7), 1));
    grd.addColorStop(1, rgba(L.tint, 1));
    g.fillStyle = grd;
    g.fill();
    /* gouache shadow strokes that follow the snow line */
    g.save();
    g.lineCap = 'round';
    for (const [off, wdt, a] of [[12, 16, 0.1], [38, 26, 0.045]]) {
      g.strokeStyle = rgba(L.shade, a);
      g.lineWidth = wdt * cam.z;
      g.beginPath();
      let first = true;
      for (let x = x0; x <= x1; x += 10 / cam.z) {
        const s = toScreen(x, groundY(x) + off + Math.sin(x / 140) * 4);
        if (first) { g.moveTo(s.x, s.y); first = false; } else g.lineTo(s.x, s.y);
      }
      g.stroke();
    }
    /* the bright lip of the snow */
    snowPath(x0, x1);
    g.strokeStyle = 'rgba(255,255,255,0.95)';
    g.lineWidth = 2.2 * cam.z;
    g.stroke();
    /* the sled's track */
    if (tracks.length > 2) {
      g.strokeStyle = rgba(L.shade, 0.45);
      g.lineWidth = 1.6 * cam.z;
      g.beginPath();
      tracks.forEach((p, i) => { const s = toScreen(p.x, p.y + 2); if (i === 0) g.moveTo(s.x, s.y); else g.lineTo(s.x, s.y); });
      g.stroke();
    }
    g.restore();
  }
  function drawProp(p, par) {
    const img = layerImg(p.kind);
    if (!img) return;
    const hh = LAYER_H[p.kind] * p.s;
    const ww = hh * LAYER_AR[p.kind];
    let sx;
    let sy;
    const mid = cam.x + vw / cam.z / 2;
    if (p.depth === 'front') {
      sx = vw / 2 + par * (p.x - mid) * cam.z;
      sy = vh + hh * 0.18 * cam.z;
    } else if (p.depth === 'back') {
      sx = vw / 2 + par * (p.x - mid) * cam.z;
      const base = (groundY(cam.x + vw / cam.z * 0.5) - cam.y) * cam.z - vh * 0.1;
      sy = base + Math.sin((cam.x * 0.45 + sx / cam.z) / 260) * 18 + 6;
    } else {
      const s = toScreen(p.x, groundY(p.x) + 6);
      sx = s.x;
      sy = s.y;
    }
    const W2 = ww * cam.z;
    const H2 = hh * cam.z;
    if (sx + W2 < -40 || sx - W2 > vw + 40) return;
    g.save();
    g.translate(sx, sy);
    if (p.flip) g.scale(-1, 1);
    if (p.shake) { g.rotate(Math.sin(p.shake * 40) * p.shake * 0.05); p.shake = Math.max(0, p.shake - 1 / 60); }
    g.drawImage(img, -W2 / 2, -H2, W2, H2);
    g.restore();
  }
  function drawFlecks() {
    const tt = now();
    for (const f of flecks) {
      if (f.got) continue;
      if (f.x < cam.x - 40 || f.x > cam.x + vw / cam.z + 40) continue;
      const s = toScreen(f.x, f.y + Math.sin(tt * 2.2 + f.ph) * 6);
      const c = f.w.pal ? f.w.pal[f.ci % f.w.pal.length] : [230, 190, 120];
      const r = (5.5 + Math.sin(tt * 3 + f.ph) * 0.8) * cam.z;
      const grd = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 3.2);
      grd.addColorStop(0, rgba(c, 0.55));
      grd.addColorStop(1, rgba(c, 0));
      g.fillStyle = grd;
      g.beginPath(); g.arc(s.x, s.y, r * 3.2, 0, TAU); g.fill();
      g.fillStyle = rgba(mixc(c, [255, 255, 255], 0.15), 1);
      g.beginPath();
      g.ellipse(s.x, s.y, r, r * 0.78, f.ph + tt * 0.6, 0, TAU);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.75)';
      g.beginPath(); g.arc(s.x - r * 0.3, s.y - r * 0.3, r * 0.28, 0, TAU); g.fill();
    }
  }
  function canvasBox(w) {
    /* the work stands on the hill at its true ratio; its size is set in screen terms at the viewpoint's zoom */
    const zStop = stopZoom(w);
    const targetH = (portrait ? vh * 0.3 : vh * 0.44) / zStop;
    let hh = targetH;
    let ww = hh * w.work.r;
    const maxW = (portrait ? vw * 0.66 : vw * 0.38) / zStop;
    if (ww > maxW) { ww = maxW; hh = ww / w.work.r; }
    const gy = groundY(w.canvasX);
    return { x: w.canvasX - ww / 2, y: gy - hh - 4, w: ww, h: hh, foot: gy };
  }
  const stopZoom = () => baseZoom() * (portrait ? 1.08 : 1.02);
  function drawCanvases() {
    for (const w of WORLDS) {
      if (!w.work) continue;
      const b = canvasBox(w);
      const s = toScreen(b.x, b.y);
      const W2 = b.w * cam.z;
      const H2 = b.h * cam.z;
      if (s.x > vw + 60 || s.x + W2 < -60) continue;
      /* the shadow on the snow and the thin side edge of the stretched canvas */
      const f = toScreen(w.canvasX, b.foot);
      const sh = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, W2 * 0.7);
      sh.addColorStop(0, 'rgba(90,110,150,0.28)');
      sh.addColorStop(1, 'rgba(90,110,150,0)');
      g.fillStyle = sh;
      g.save(); g.translate(f.x, f.y); g.scale(1, 0.12); g.beginPath(); g.arc(0, 0, W2 * 0.7, 0, TAU); g.restore(); g.fill();
      g.fillStyle = '#c8c1b6';
      g.fillRect(s.x + W2, s.y + 3, Math.max(3, W2 * 0.012), H2 - 3);
      /* behind the canvas, the warm glow when it fills */
      if (w.glow > 0) {
        const cx = s.x + W2 / 2;
        const cy = s.y + H2 / 2;
        const gl = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W2, H2) * 1.1);
        gl.addColorStop(0, `rgba(255,236,200,${0.5 * w.glow})`);
        gl.addColorStop(1, 'rgba(255,236,200,0)');
        g.fillStyle = gl;
        g.fillRect(cx - W2 * 1.2, cy - H2 * 1.2, W2 * 2.4, H2 * 2.4);
      }
      /* blank canvas, then the real work fading in: nothing is ever drawn over it once it is there */
      g.fillStyle = '#FBFAF6';
      g.fillRect(s.x, s.y, W2, H2);
      const img = artImg(w.work);
      if (img && w.dev > 0) {
        g.globalAlpha = smooth(w.dev);
        g.drawImage(img, s.x, s.y, W2, H2);
        g.globalAlpha = 1;
      }
    }
  }
  /* one kit figure, standing on the snow at world point (x, y), facing dir (1 right, -1 left), in its way of moving */
  function drawFigure(p, sx, sy, scale, dir) {
    const img = kitImg(p.id);
    if (!img) return;
    const hh = 84 * sizeOf(p.id) * scale;
    const ww = hh * kitAr(p.id);
    const mv = moveOf(p.id);
    const moving = Math.abs(p.speed || 0) > 4;
    const tt = now() + p.ph;
    let bob = 0;
    let rot = 0;
    let sq = 1;
    if (mv === 'walk' && moving) { const st = Math.sin(tt * 7.5); bob = -Math.abs(st) * hh * 0.035; rot = st * 0.03; }
    else if ((mv === 'ski' || mv === 'sled') && moving) { rot = (p.slope || 0) * 0.8 + 0.04 * dir; }
    else { sq = 1 + Math.sin(tt * 1.6) * 0.008; rot = Math.sin(tt * 0.55) * 0.012; }
    const flip = (dir < 0) !== FACES_LEFT.has(p.id);
    g.save();
    g.translate(sx, sy - p.hop * cam.z * scale);
    g.rotate(rot);
    g.scale(flip ? -1 : 1, sq);
    g.drawImage(img, (-ww / 2) * cam.z, (-hh + bob) * cam.z, ww * cam.z, hh * cam.z);
    g.restore();
    /* the photographer's flash */
    if (p.flash > 0) {
      const lx = sx + dir * ww * 0.28 * cam.z;
      const ly = sy - hh * 0.86 * cam.z;
      const r = 26 * cam.z * scale;
      const gl = g.createRadialGradient(lx, ly, 0, lx, ly, r);
      gl.addColorStop(0, `rgba(255,255,255,${p.flash})`);
      gl.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gl;
      g.beginPath(); g.arc(lx, ly, r, 0, TAU); g.fill();
    }
  }
  /* the people by each work: they come as you approach, then breathe, shift their weight and look at the work */
  function updateCast(dt) {
    for (const p of cast) {
      if (!p.w.work) continue;
      const bx = canvasBox(p.w);
      const spot = p.slot === 0 ? bx.x - 200 : bx.x + bx.w + (p.slot === 1 ? 52 : 132);
      const side = p.slot === 0 ? -1 : 1;
      if (p.x == null) p.x = spot + side * (moveOf(p.id) === 'ski' ? 760 : 420);
      if (p.state === 'away' && sled.x > bx.x - 1300) { p.state = 'coming'; p.t0 = now() + p.delay / SPEED; }
      if (p.state === 'coming' && now() > p.t0) {
        const mv = moveOf(p.id);
        const d = spot - p.x;
        const v = mv === 'ski' ? 260 : mv === 'sled' ? 200 : 70;
        p.speed = Math.sign(d) * Math.min(Math.abs(d) * (mv === 'ski' ? 2.2 : 3), v);
        p.x += p.speed * dt;
        p.slope = slopeAt(p.x);
        if (Math.abs(d) < 2) {
          p.state = 'here';
          p.speed = 0;
          if (mv === 'ski') puff(p.x + side * -10, groundY(p.x), 8, 0.7);
        }
      }
      p.hv += (-p.hop * 90 - p.hv * 9) * dt;
      p.hop += p.hv * dt;
      if (p.hop < 0 && p.hv < 0) { p.hop = 0; p.hv = 0; }
      p.flash = Math.max(0, p.flash - dt * 3);
    }
  }
  function drawCast() {
    for (const p of cast) {
      if (!p.w.work || p.x == null) continue;
      const s = toScreen(p.x, groundY(p.x) + 3);
      if (s.x < -90 || s.x > vw + 90) continue;
      const bx = canvasBox(p.w);
      const dir = p.state === 'coming' && Math.abs(p.speed) > 4 ? Math.sign(p.speed) : p.x < bx.x + bx.w / 2 ? 1 : -1;
      drawFigure(p, s.x, s.y, 1, dir);
    }
  }
  /* passers-by in the landscape: skiers and walkers going about their day, a snowball flying between two friends;
     the ones near the track hop and cheer as the sled goes by */
  function updateLife(dt) {
    for (const p of life) {
      p.x += p.vx * dt;
      p.speed = p.vx;
      p.slope = p.depth === 'mid' ? slopeAt(p.x) : 0;
      if (p.depth === 'mid' && !p.cheered && Math.abs(p.x - sled.x) < 90 && S.phase === 'ride') { p.cheered = true; p.hv = rnd(150, 210); }
      p.hv += (-p.hop * 90 - p.hv * 9) * dt;
      p.hop += p.hv * dt;
      if (p.hop < 0 && p.hv < 0) { p.hop = 0; p.hv = 0; }
      if (p.pair && (p.nextBall ?? 0) < now()) {
        const mate = life.find((m) => m.catcher && m.w === p.w);
        if (mate && Math.abs(p.x - cam.x - vw / cam.z / 2) < vw / cam.z) balls.push({ x0: p.x + 20, x1: mate.x - 18, t: 0, back: (p.balls = (p.balls || 0) + 1) % 2 === 0 });
        p.nextBall = now() + rnd(1.8, 2.8);
      }
    }
    for (let i = balls.length - 1; i >= 0; i--) { balls[i].t += dt / 0.85; if (balls[i].t >= 1) balls.splice(i, 1); }
  }
  function drawLife(depth) {
    const mid = cam.x + vw / cam.z / 2;
    for (const p of life) {
      if (p.depth !== depth) continue;
      let sx;
      let sy;
      let sc = 1;
      if (depth === 'back') {
        sx = vw / 2 + 0.45 * (p.x - mid) * cam.z;
        const base = (groundY(cam.x + vw / cam.z * 0.5) - cam.y) * cam.z - vh * 0.1;
        sy = base + Math.sin((cam.x * 0.45 + sx / cam.z) / 260) * 18 + 8;
        sc = 0.5;
      } else {
        const s = toScreen(p.x, groundY(p.x) + 3);
        sx = s.x;
        sy = s.y;
      }
      if (sx < -80 || sx > vw + 80) continue;
      const dir = p.vx ? Math.sign(p.vx) : p.catcher ? -1 : p.pair ? 1 : sled.x < p.x ? -1 : 1;
      drawFigure(p, sx, sy, sc, dir);
    }
    if (depth === 'mid') {
      for (const b of balls) {
        const a = b.back ? b.x1 : b.x0;
        const c = b.back ? b.x0 : b.x1;
        const x = lerp(a, c, b.t);
        const y = lerp(groundY(a), groundY(c), b.t) - 70 - Math.sin(b.t * Math.PI) * 60;
        const s = toScreen(x, y);
        g.fillStyle = '#fff';
        g.strokeStyle = 'rgba(150,170,205,0.7)';
        g.lineWidth = 1;
        g.beginPath(); g.arc(s.x, s.y, 4.2 * cam.z, 0, TAU); g.fill(); g.stroke();
      }
    }
  }
  /* where the runners touch the snow in the kit drawing, and the tilt they are drawn with */
  const RUNNER = { cx: 0.57, cy: 0.887, tilt: Math.atan(0.1029) };
  function drawSled() {
    const img = kitImg('sledging-child');
    if (!img) return;
    const hh = H_SLED / RUNNER.cy;
    const ww = hh * kitAr('sledging-child');
    const s = toScreen(sled.x, sled.y + 1);
    g.save();
    g.translate(s.x, s.y);
    g.rotate(sled.ang + sled.lean - RUNNER.tilt);
    g.scale(1 / Math.sqrt(sled.sq), sled.sq);
    g.drawImage(img, -RUNNER.cx * ww * cam.z, -RUNNER.cy * hh * cam.z, ww * cam.z, hh * cam.z);
    g.restore();
  }
  /* the screen rects of the works standing in view: nothing small is ever drawn over them */
  function artRects() {
    const out = [];
    for (const w of WORLDS) {
      if (!w.work) continue;
      const b = canvasBox(w);
      const s0 = toScreen(b.x, b.y);
      if (s0.x > vw || s0.x + b.w * cam.z < 0) continue;
      out.push({ x: s0.x - 2, y: s0.y - 2, w: b.w * cam.z + 4, h: b.h * cam.z + 4 });
    }
    return out;
  }
  const inRects = (rs, x, y) => rs.some((r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h);
  function drawParticles(dt) {
    const rs = artRects();
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;
      if (p.age > p.life) { particles.splice(i, 1); continue; }
      p.vy += 520 * dt;
      p.vx *= 0.96;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const s = toScreen(p.x, p.y);
      if (inRects(rs, s.x, s.y)) continue;
      g.fillStyle = `rgba(255,255,255,${0.9 * (1 - p.age / p.life)})`;
      g.beginPath(); g.arc(s.x, s.y, p.r * cam.z, 0, TAU); g.fill();
    }
  }
  function drawFlying(dt) {
    for (let i = flying.length - 1; i >= 0; i--) {
      const f = flying[i];
      f.t += dt / (f.to === 'hud' ? 0.65 : 0.9);
      let sx;
      let sy;
      if (f.to === 'hud') {
        const ring = ringPos(f.w);
        const s0 = toScreen(f.x, f.y);
        const e = smooth(f.t);
        sx = lerp(s0.x, ring.x, e);
        sy = lerp(s0.y, ring.y, e) - Math.sin(e * Math.PI) * 60;
      } else {
        const e = smooth(f.t);
        const a = toScreen(f.x, f.y);
        const b = toScreen(f.tx, f.ty);
        sx = lerp(a.x, b.x, e);
        sy = lerp(a.y, b.y, e) - Math.sin(e * Math.PI) * f.arc;
      }
      if (f.t >= 1) { flying.splice(i, 1); continue; }
      g.fillStyle = rgba(f.c, 0.95);
      g.beginPath(); g.arc(sx, sy, 4.6 * (1 - f.t * 0.4), 0, TAU); g.fill();
    }
  }
  function drawFalling(dt) {
    /* gentle snowfall over the whole picture */
    if (RM) return;
    if (!drawFalling.p) drawFalling.p = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), d: Math.random(), ph: Math.random() * 6 }));
    for (const p of drawFalling.p) {
      p.y += (0.02 + p.d * 0.05) * dt;
      p.x += (Math.sin(now() * 0.6 + p.ph) * 0.004 - (sled.vx / 6000) * (0.4 + p.d)) * dt * 6;
      if (p.y > 1.02) { p.y = -0.02; p.x = Math.random(); }
      if (p.x < -0.02) p.x = 1.02;
      if (p.x > 1.02) p.x = -0.02;
      g.fillStyle = `rgba(255,255,255,${0.5 + p.d * 0.45})`;
      g.beginPath(); g.arc(p.x * vw, p.y * vh, 0.8 + p.d * 2, 0, TAU); g.fill();
    }
  }

  /* ------------------------------------------------------------ the camera */

  function updateCamera(dt) {
    let z = baseZoom() * (1 - 0.07 * clamp((sled.vx - VMIN) / (VMAX - VMIN), 0, 1));
    let tx = sled.x - (vw / z) * (portrait ? 0.3 : 0.32) + sled.vx * 0.16;
    let ty = sled.y - (vh / z) * (S.phase === 'start' && portrait ? 0.24 : portrait ? 0.6 : 0.62);
    if (S.view) {
      /* at a viewpoint: frame the work and the sled together */
      const w = S.view;
      const b = canvasBox(w);
      z = stopZoom(w);
      const left = Math.min(sled.x - 60, b.x - 40);
      const right = b.x + b.w + (portrait ? 40 : 260);
      tx = (left + right) / 2 - vw / z / 2;
      ty = b.y + b.h * (portrait ? 0.5 : 0.56) - (vh / z) * (portrait ? 0.4 : 0.46);
    }
    const k = 1 - Math.exp(-(S.view ? 2.4 : 5) * dt);
    cam.z = lerp(cam.z || z, z, 1 - Math.exp(-2.2 * dt));
    cam.x = lerp(cam.x, tx, k);
    cam.y = lerp(cam.y, ty, 1 - Math.exp(-(S.view ? 2.4 : 3.2) * dt));
    if (cam.shake > 0) {
      cam.shake = Math.max(0, cam.shake - dt * 18);
      cam.x += Math.sin(now() * 77) * cam.shake / cam.z;
      cam.y += Math.cos(now() * 59) * cam.shake / cam.z;
    }
  }

  /* ------------------------------------------------------------ the loop */

  let last = performance.now();
  let slow = 1;
  function frame(tms) {
    const raw = Math.min(0.05, (tms - last) / 1000);
    last = tms;
    const dt = raw * SPEED * slow;
    if (S.phase === 'ride' || S.phase === 'admire' || S.phase === 'start' || S.phase === 'toStreet') {
      if (S.phase === 'ride') { physics(dt); collect(dt); checkViewpoint(); }
      if (S.phase === 'toStreet') physics(dt);
      updateCast(dt);
      updateLife(dt);
      for (const w of WORLDS) {
        if (w.devGo) w.dev = Math.min(1, (w.dev || 0) + dt / 1.9);
        if (w.glowGo) w.glow = Math.max(0, (w.glow ?? 0) + dt * (w.dev < 0.7 ? 1.4 : -0.5));
      }
      updateCamera(raw * SPEED);
      const L = look(cam.x + vw / cam.z * 0.5);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = rgba(L.tint, 1);
      g.fillRect(0, 0, vw, vh);
      drawBackdrop(L);
      drawRidge(L);
      for (const p of props) if (p.depth === 'back') drawProp(p, 0.45);
      drawLife('back');
      drawSnow(L);
      drawFalling(raw * SPEED);
      for (const p of props) if (p.depth === 'mid') drawProp(p, 1);
      drawLife('mid');
      drawCanvases();
      drawCast();
      drawFlecks();
      drawSled();
      drawParticles(dt);
      for (const p of props) if (p.depth === 'front') drawProp(p, 1.35);
      drawFlying(raw * SPEED);
      placeSign();
      placeTapHint();
    }
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------ viewpoints */

  function checkViewpoint() {
    const w = worldAt(sled.x);
    if (w.done || !w.work) return;
    if (sled.x > canvasBox(w).x - 640 && !sled.braking) {
      sled.braking = true;
      sled.stopAt = canvasBox(w).x - 70;
      sled.holding = false;
      sfx('air', { dur: 1.1, f: 1900, q: 0.6, gain: 0.04, attack: 0.08 });
    }
    if (sled.braking && sled.vx === 0 && sled.ground) admire(w);
    /* the next world: its music, its rings */
    if (S.worldId !== w.id) { S.worldId = w.id; sfx('setScene', w.id); updateRings(); track('gal_world', { gal_feeling: w.feeling }); }
  }
  async function admire(w) {
    if (S.phase !== 'ride') return;
    S.phase = 'admire';
    S.view = w;
    w.done = true;
    hideCaption();
    await wait(650);
    /* the colours you gathered fly from the sled into the blank canvas, and the work appears */
    const b = canvasBox(w);
    const n = Math.max(6, Math.min(26, w.fleckGot + 4));
    for (let i = 0; i < n; i++) {
      setTimeout(() => flying.push({ x: sled.x, y: sled.y - H_SLED * 0.6, tx: b.x + rnd(0.1, 0.9) * b.w, ty: b.y + rnd(0.1, 0.9) * b.h, arc: rnd(40, 120), c: w.pal ? w.pal[i % w.pal.length] : [220, 160, 90], t: 0, to: 'canvas' }), (i * 55) / SPEED);
    }
    await wait(1000 + n * 55);
    for (let i = flying.length - 1; i >= 0; i--) if (flying[i].to === 'canvas') flying.splice(i, 1);
    w.devGo = true;
    w.glowGo = true;
    sfx('peak', w.id);
    buzz([12, 50, 22]);
    S.found.push(w);
    setTools();
    track('gal_revealed', { gal_feeling: w.feeling, gal_sku: w.work.sku, gal_flecks: w.fleckGot, gal_total: w.fleckTotal });
    await wait(900);
    for (const p of cast) {
      if (p.w !== w) continue;
      setTimeout(() => { if (p.id === 'winter-photographer') { p.flash = 1; sfx('bell', noteHz(9, 1), { gain: 0.04 }); } else p.hv = rnd(150, 230); }, rnd(0, 600) / SPEED);
    }
    await wait(900);
    showSign(w);
    await wait(500);
    caption(() => ({ eyebrow: `${t(`feel.${w.feeling}`)} · ${t(`place.${w.id}`)}`, line: t(`ded.${w.id}`), row: [h('button', { class: 'btn next', type: 'button', onclick: () => S.canGo && S.canGo() }, t('onward'), h('span', { class: 'arr', 'aria-hidden': 'true' }, '→')), h('span', { class: 'meta' }, t('tapOn'))] }));
    await new Promise((resolve) => {
      let done = false;
      const go = () => { if (done) return; done = true; S.canGo = null; resolve(); };
      S.canGo = go;
      if (AUTO) setTimeout(go, 900 / SPEED);
    });
    hideCaption();
    hideSign();
    S.view = null;
    sled.braking = false;
    sled.stopAt = null;
    sled.vx = 140;
    sled.sqv -= 4;
    puff(sled.x - 20, sled.y, 8, 0.7);
    if (WORLDS.indexOf(w) === WORLDS.length - 1) { S.phase = 'toStreet'; rideToStreet(); return; }
    S.phase = 'ride';
  }

  /* the sign beside the work, planted in the snow */
  let sign = null;
  function showSign(w) {
    hideSign();
    const work = w.work;
    const about = () => h('button', { class: 'more', type: 'button', onclick: () => openWork(work, w.feeling, 'sign') }, t('about'));
    const card = h('div', { class: 'card' },
      h('p', { class: 'a' }, work.artist),
      h('p', { class: 't' }, work.title),
      h('p', { class: 'm wide' }, `${t('handsigned')} · ${t('edition', { n: fmtNum(work.ed) })}`),
      h('div', { class: 'row wide' }, h('span', { class: 'p' }, fromPrice(work.ab)), workLink(work, 'sign')),
      h('p', { class: 'm narrow' }, `${t('handsigned')} · ${fromPrice(work.ab)}`),
      h('div', { class: 'row narrow' }, workLink(work, 'sign'), about()),
      h('div', { class: 'wide' }, about()));
    const el = h('div', { class: 'sign', style: 'opacity:0' }, card, h('span', { class: 'post', style: 'height:16px' }));
    $('#signs').append(el);
    sign = { el, w, t0: performance.now() };
    placeSign();
    anim(el, [{ opacity: 0, transform: el.style.transform + ' translateY(-24px)' }, { opacity: 1, transform: el.style.transform }], { duration: 520, easing: 'cubic-bezier(.34,1.4,.64,1)' }).then(() => { el.style.opacity = '1'; });
  }
  function placeSign() {
    if (!sign) return;
    const b = canvasBox(sign.w);
    const width = portrait ? Math.min(184, vw - 32) : 214;
    sign.el.style.width = `${width}px`;
    const ch = sign.el.firstChild.offsetHeight;
    let x;
    let y;
    if (portrait) {
      const s = toScreen(b.x + b.w, b.foot);
      x = clamp(s.x - width, 16, vw - 16 - width);
      y = s.y + 14;
    } else {
      const s = toScreen(b.x + b.w, b.foot);
      x = Math.min(s.x + 28, vw - 24 - width);
      y = s.y - ch - 10;
    }
    const tf = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    if (sign.el.getAnimations().length === 0) sign.el.style.transform = tf;
  }
  function hideSign() {
    if (!sign) return;
    const el = sign.el;
    sign = null;
    anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 260 }).then(() => el.remove());
  }

  /* ------------------------------------------------------------ the rings: what you have gathered */

  function buildRings() {
    const el = $('#rings');
    el.replaceChildren(...WORLDS.map((w) => h('i', { 'data-id': w.id })));
    el.hidden = false;
    updateRings();
  }
  function updateRings() {
    for (const w of WORLDS) {
      const i = document.querySelector(`#rings [data-id="${w.id}"]`);
      if (!i) continue;
      const c = w.pal ? w.pal[0] : [29, 29, 29];
      i.style.setProperty('--c', rgba(c, 1));
      i.style.setProperty('--p', String(w.done ? 1 : (w.fleckGot || 0) / Math.max(1, w.fleckTotal)));
      i.classList.toggle('now', S.worldId === w.id && !w.done);
      i.classList.toggle('done', !!w.done);
    }
  }
  function ringPos(w) {
    const i = document.querySelector(`#rings [data-id="${w.id}"]`);
    if (!i) return { x: 40, y: 60 };
    const r = i.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  /* ------------------------------------------------------------ the first slope: a hint that leaves once you jump */

  const tap = $('#taphint');
  let howToShown = false;
  function showHowTo() {
    if (howToShown || input.any) return;
    howToShown = true;
    caption(() => ({ eyebrow: `${t('feel.gratitude')} · ${t('place.birch')}`, line: t('howTo') }));
    tap.classList.add('on');
  }
  function hideHowTo() { tap.classList.remove('on'); if (howToShown) hideCaption(); }
  function placeTapHint() {
    if (!tap.classList.contains('on')) return;
    const s = toScreen(sled.x + 10, sled.y - H_SLED * 0.5);
    tap.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
  }

  /* ------------------------------------------------------------ UI */

  const cap = $('#caption');
  let capT = null;
  let capSpec = null;
  /* a caption is given as a function, so a language switch can draw it again in the other language */
  function caption(spec, { instant = false } = {}) {
    capSpec = typeof spec === 'function' ? spec : () => spec;
    const { eyebrow = '', line = '', sub = '', row = [] } = capSpec();
    clearTimeout(capT);
    const apply = () => {
      $('#capEyebrow').textContent = eyebrow;
      $('#capLine').textContent = keepTogether(line);
      $('#capSub').textContent = keepTogether(sub);
      $('#capRow').replaceChildren(...row.filter(Boolean));
      cap.classList.remove('out');
    };
    if (instant || cap.classList.contains('out')) { apply(); return; }
    cap.classList.add('out');
    capT = setTimeout(apply, RM ? 0 : 260);
  }
  const hideCaption = () => { clearTimeout(capT); capSpec = null; cap.classList.add('out'); };
  let shown = 0;
  function setTools({ gallery = true } = {}) {
    $('#btnGallery').hidden = !gallery;
    $('#btnBook').hidden = false;
    const n = $('#bookN');
    n.textContent = String(S.found.length);
    if (S.found.length > shown && !RM) anim(n, [{ transform: 'translateY(70%)', opacity: 0 }, { transform: 'translateY(-12%)', opacity: 1, offset: 0.7 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 520 });
    shown = S.found.length;
  }

  /* ------------------------------------------------------------ the street and the gallery */

  const anchors = {
    street: {
      glass: { w: [0.222, 0.335, 0.633, 0.735], t: [0.112, 0.392, 0.664, 0.69] },
      wall: { w: [0.33, 0.37, 0.628, 0.69], t: [0.3, 0.41, 0.66, 0.665] },
      transom: { w: [0.222, 0.245, 0.633, 0.32], t: [0.112, 0.348, 0.664, 0.388] },
      door: { w: [0.652, 0.335, 0.755, 0.81], t: [0.67, 0.39, 0.85, 0.735] },
    },
    gallery: { wall: { w: [0.09, 0.2, 0.9, 0.7], t: [0.06, 0.13, 0.94, 0.7] } },
  };
  function plateBox(ar) {
    let pw;
    let ph;
    if (vw / vh > ar) { pw = vw; ph = vw / ar; } else { ph = vh; pw = vh * ar; }
    return { x0: (vw - pw) / 2, y0: (vh - ph) / 2, pw, ph };
  }
  const o = () => (portrait ? 't' : 'w');
  function rectOn(box, key, scene) {
    const [x1, y1, x2, y2] = anchors[scene][key][o()];
    return { x: box.x0 + x1 * box.pw, y: box.y0 + y1 * box.ph, w: (x2 - x1) * box.pw, h: (y2 - y1) * box.ph };
  }
  function hangLayout(works, rect, { gapK = 0.07, maxHK = 0.6, fill = 0.9 } = {}) {
    const n = works.length;
    const splits = { 5: [[5], [2, 3], [3, 2], [2, 2, 1], [1, 2, 2], [2, 1, 2]], 4: [[4], [2, 2]], 3: [[3], [1, 2]], 2: [[2]], 1: [[1]] }[n] || [[n]];
    const gap = rect.w * gapK * 0.6;
    let best = null;
    for (const split of splits) {
      let i = 0;
      const rows = split.map((k) => { const r = works.slice(i, i + k); i += k; return r; });
      let hs = rows.map((r) => Math.min(rect.h * maxHK, (rect.w * fill - gap * (r.length - 1)) / r.reduce((s, w) => s + w.r, 0)));
      const vg = gap * (rows.length - 1);
      const sum = hs.reduce((s, x) => s + x, 0);
      if (sum + vg > rect.h * fill) hs = hs.map((x) => (x * (rect.h * fill - vg)) / sum);
      const score = Math.min(...rows.flatMap((r, ri) => r.map((w) => hs[ri] * hs[ri] * w.r)));
      if (!best || score > best.score) best = { score, rows, hs };
    }
    const out = [];
    const totalH = best.hs.reduce((s, x) => s + x, 0) + gap * (best.rows.length - 1);
    let y = rect.y + (rect.h - totalH) / 2;
    best.rows.forEach((r, ri) => {
      const hh = best.hs[ri];
      const rowW = r.reduce((s, w) => s + hh * w.r, 0) + gap * (r.length - 1);
      let x = rect.x + (rect.w - rowW) / 2;
      for (const w of r) { out.push({ work: w, x: x + (hh * w.r) / 2, y: y + hh / 2, w: hh * w.r, h: hh }); x += hh * w.r + gap; }
      y += hh + gap;
    });
    return out;
  }
  const dayWorks = () => WORLDS.map((w) => w.work);

  function buildStreet() {
    const el = $('#street');
    const box = plateBox(portrait ? 752 / 1344 : 1344 / 752);
    const glass = rectOn(box, 'glass', 'street');
    const wall = rectOn(box, 'wall', 'street');
    const transom = rectOn(box, 'transom', 'street');
    const door = rectOn(box, 'door', 'street');
    const decalH = glass.h * 0.3;
    const fs = Math.max(13, glass.w * (portrait ? 0.068 : 0.044));
    const lineTop = glass.h - decalH - fs * 2.5;
    const wallTop = wall.y - glass.y + wall.h * 0.05;
    const wallIn = { x: wall.x - glass.x + wall.w * 0.04, y: wallTop, w: wall.w * 0.92, h: lineTop - 10 - wallTop };
    const shop = h('div', { class: 'shop', style: `left:${glass.x}px;top:${glass.y}px;width:${glass.w}px;height:${glass.h}px` });
    for (const it of hangLayout(dayWorks(), wallIn, { maxHK: 0.75, gapK: 0.1 })) {
      shop.append(h('div', { class: 'hung', style: `left:${it.x - it.w / 2}px;top:${it.y - it.h / 2}px;width:${it.w}px;height:${it.h}px` }, h('img', { src: `assets/art/${it.work.code}.webp`, alt: '' })));
    }
    const decal = h('div', { class: 'decal', style: `height:${decalH}px` });
    decal.innerHTML = '<svg viewBox="0 0 1000 300" preserveAspectRatio="none"><path d="M0 120 C 160 70 300 60 420 105 C 540 150 640 160 760 120 C 860 88 940 80 1000 92 L1000 300 L0 300 Z" fill="#FBFBF9"/><path d="M0 200 C 220 170 420 210 600 196 C 760 184 880 170 1000 182 L1000 300 L0 300 Z" fill="#E7ECF4"/><path d="M40 64 L53 108 L27 108 Z M905 46 L917 86 L893 86 Z M940 48 L954 92 L926 92 Z M500 109 L509 140 L491 140 Z" fill="#2E4A52"/></svg>';
    shop.append(decal);
    const logoH = Math.max(10, transom.h * 0.42);
    const sledW = Math.min(vw * 0.2, door.h * 0.42);
    const sledH = sledW / kitAr('sledging-child');
    const doorBtn = h('button', { class: 'door call', type: 'button', 'aria-label': t('enter'), style: `left:${door.x}px;top:${door.y}px;width:${door.w}px;height:${door.h}px` });
    const sledder = h('div', { class: 'sledder', style: `width:${sledW}px;height:${sledH}px` }, h('img', { src: 'assets/people/kit/sledging-child.webp', alt: '' }));
    el.replaceChildren(
      h('img', { class: 'plate', src: 'assets/scenes/street-' + o() + '.webp', alt: '', style: `left:${box.x0}px;top:${box.y0}px;width:${box.pw}px;height:${box.ph}px` }),
      h('div', { class: 'layer' }, shop,
        h('img', { class: 'shop-logo', src: 'assets/lumas-logo.svg', alt: '', style: `height:${logoH}px;left:${transom.x + transom.w / 2 - logoH * 2.67}px;top:${transom.y + (transom.h - logoH) / 2}px;width:${logoH * 5.33}px` }),
        h('p', { class: 'shop-line', style: `font-size:${fs}px;left:${glass.x}px;width:${glass.w}px;top:${glass.y + lineTop}px` }, COPY.window[0], h('br'), COPY.window[1]),
        doorBtn, sledder));
    return { door, doorBtn, sledder, sledW, sledH, groundY: door.y + door.h + vh * 0.025 };
  }
  async function rideToStreet() {
    /* the last slope runs into town: the snow brightens to white and the street is there */
    const wo = $('#whiteout');
    sfx('setScene', 'street');
    await anim(wo, [{ opacity: 0 }, { opacity: 1 }], { duration: 900, easing: 'ease-in' });
    S.phase = 'street';
    const st = buildStreet();
    S.street = st;
    $('#street').hidden = false;
    $('#rings').hidden = true;
    const from = -st.sledW;
    const to = st.door.x + st.door.w * 0.5 - st.sledW * 0.9;
    st.sledder.style.transform = `translate3d(${from}px, ${st.groundY - st.sledH}px, 0)`;
    anim(wo, [{ opacity: 1 }, { opacity: 0 }], { duration: 900, easing: 'ease-out' });
    track('gal_street');
    await anim(st.sledder, [{ transform: `translate3d(${from}px, ${st.groundY - st.sledH}px, 0)` }, { transform: `translate3d(${to}px, ${st.groundY - st.sledH}px, 0) rotate(-2deg)`, offset: 0.92 }, { transform: `translate3d(${to}px, ${st.groundY - st.sledH}px, 0)` }], { duration: 2600, easing: 'cubic-bezier(.2,.7,.25,1)' });
    await new Promise((resolve) => {
      S.enterGo = resolve;
      caption(() => ({ eyebrow: t('streetEyebrow'), line: t('streetLine'), sub: t('streetSub'), row: [h('button', { class: 'btn', type: 'button', onclick: () => S.enterGo && S.enterGo() }, t('enter'))] }));
      S.street.doorBtn.addEventListener('click', resolve, { once: true });
      if (AUTO) setTimeout(resolve, 900 / SPEED);
    });
    hideCaption();
    sfx('door');
    track('gal_door');
    await enterGallery(st.door);
  }
  async function enterGallery(door) {
    /* warm light from the door fills the screen; when it clears, you stand in the gallery */
    const flash = $('#flash');
    if (door) { flash.style.setProperty('--fx', `${((door.x + door.w / 2) / vw) * 100}%`); flash.style.setProperty('--fy', `${((door.y + door.h * 0.5) / vh) * 100}%`); }
    await anim(flash, [{ opacity: 0 }, { opacity: 1 }], { duration: 900, easing: 'ease-in' });
    S.phase = 'gallery';
    $('#street').hidden = true;
    sfx('setScene', 'gallery');
    buildGallery();
    $('#gallery').hidden = false;
    setTools({ gallery: false });
    anim($('#gallery'), [{ transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 1600 });
    await anim(flash, [{ opacity: 1 }, { opacity: 0 }], { duration: 1100, easing: 'ease-out' });
    caption(() => ({ eyebrow: t('galleryEyebrow'), line: t('galleryLine'), sub: t('gallerySub') }));
    track('gal_gallery', { gal_found: S.found.length });
    if (AUTO && !q.has('hold')) setTimeout(() => choose(S.items[0]), 1200 / SPEED);
  }
  function buildGallery() {
    const el = $('#gallery');
    const box = plateBox(portrait ? 752 / 1344 : 1344 / 752);
    const wall = rectOn(box, 'wall', 'gallery');
    const layer = h('div', { class: 'layer' });
    el.replaceChildren(h('img', { class: 'plate', src: 'assets/scenes/gallery-' + o() + '.webp', alt: '', style: `left:${box.x0}px;top:${box.y0}px;width:${box.pw}px;height:${box.ph}px` }), layer);
    const laid = hangLayout(dayWorks(), wall, { maxHK: portrait ? 0.36 : 0.6, gapK: portrait ? 0.14 : 0.08, fill: 0.88 });
    S.items = laid.map((it, i) => {
      const wld = WORLDS.find((w) => w.work === it.work);
      const pool = h('div', { class: 'pool', style: `left:${it.x - it.w * 0.9}px;top:${it.y - it.h * 0.95}px;width:${it.w * 1.8}px;height:${it.h * 1.9}px;opacity:0` });
      const btn = h('button', { class: 'hang', type: 'button', 'aria-label': `${it.work.title}, ${it.work.artist}`, style: `width:${it.w}px;height:${it.h}px;transform:translate3d(${it.x - it.w / 2}px, ${it.y - it.h / 2}px, 0)` }, h('img', { src: `assets/art/${it.work.code}.webp`, alt: '', draggable: 'false' }));
      layer.append(pool, btn);
      const item = { ...it, f: wld.feeling, id: wld.id, el: btn, pool };
      btn.addEventListener('click', () => focusItem(item));
      btn.addEventListener('pointerenter', () => pool.classList.add('warm'));
      btn.addEventListener('pointerleave', () => pool.classList.remove('warm'));
      /* the lights come on for you, one after another */
      setTimeout(() => { anim(pool, [{ opacity: 0 }, { opacity: 0.6, offset: 0.3 }, { opacity: 0.35, offset: 0.45 }, { opacity: 1 }], { duration: 700 }); sfx('pluck', noteHz(i + 3), { gain: 0.07 }); }, (500 + i * 220) / SPEED);
      return item;
    });
    S.galleryLayer = layer;
  }
  let label = null;
  function placeLabel(item, text, sub) {
    if (label) label.remove();
    label = h('div', { class: 'wall-label', style: 'opacity:0' }, h('p', { class: 'to' }, text), h('p', { class: 'f' }, sub));
    S.galleryLayer.append(label);
    const lw = label.offsetWidth;
    const lh = label.offsetHeight;
    const right = item.x + item.w / 2 + 16;
    const others = S.items.filter((x) => x !== item);
    const clash = (x, y) => others.some((o2) => x < o2.x + o2.w / 2 + 6 && x + lw > o2.x - o2.w / 2 - 6 && y < o2.y + o2.h / 2 + 6 && y + lh > o2.y - o2.h / 2 - 6);
    const spots = [[right, item.y + item.h / 2 - lh], [item.x - lw / 2, item.y + item.h / 2 + 14], [item.x - item.w / 2 - 16 - lw, item.y + item.h / 2 - lh], [item.x - lw / 2, item.y - item.h / 2 - 14 - lh]];
    const fits = (x, y) => x > 8 && y > 64 && x + lw < vw - 8 && y + lh < vh - 8;
    const [x, y] = spots.find(([a, b]) => fits(a, b) && !clash(a, b)) || spots.find(([a, b]) => fits(a, b)) || spots[1];
    label.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    anim(label, [{ opacity: 0, transform: `translate3d(${x}px, ${y + 6}px, 0)` }, { opacity: 1, transform: `translate3d(${x}px, ${y}px, 0)` }], { duration: 420 });
  }
  function focusItem(item) {
    if (S.phase !== 'gallery') return;
    S.focus = item;
    for (const it of S.items) it.el.classList.toggle('lifted', it === item);
    sfx('pluck', noteHz(5), { gain: 0.2 });
    placeLabel(item, item.work.title, `${item.work.artist} · ${t('handsigned')}`);
    caption(() => ({ eyebrow: t(`feel.${item.f}`), line: item.work.title, sub: `${item.work.artist} · ${fromPrice(item.work.ab)}`, row: [h('button', { class: 'btn', type: 'button', onclick: () => choose(item) }, t('choose')), workLink(item.work, 'gallery')] }));
  }
  async function choose(item) {
    if (S.phase !== 'gallery' || !item) return;
    S.phase = 'moment';
    S.chosen = item;
    hideCaption();
    if (label) { label.remove(); label = null; }
    track('gal_choose', { gal_sku: item.work.sku, gal_feeling: item.f });
    try {
      sessionStorage.setItem('galRide.result', JSON.stringify({ sku: item.work.sku, name: S.name }));
    } catch (e) { /* storage blocked */ }
    const chord = sfx('finale') || 0;
    buzz([16, 60, 30]);
    await moment(item, chord);
    S.phase = 'end';
    showEnd(item);
    track('gal_end', { gal_sku: item.work.sku, gal_budget: S.budget });
  }

  /* ------------------------------------------------------------ the moment: the chosen work comes to you */

  const M = { el: null };
  /* where the work rests: the upper part of the screen, whole and at its true ratio, above where the end panel rises */
  function momentRect(item) {
    const ar = item.w / item.h;
    const top = portrait ? 74 : 80;
    const bottom = vh * (portrait ? 0.56 : 0.64);
    const side = portrait ? 36 : vw * 0.12;
    const w = Math.min(vw - side * 2, (bottom - top) * ar);
    const hh = w / ar;
    return { x: (vw - w) / 2, y: top + (bottom - top - hh) / 2, w, h: hh };
  }
  function placeMoment() {
    if (!M.el) return;
    const R = (M.rect = momentRect(M.item));
    Object.assign(M.work.style, { left: `${R.x}px`, top: `${R.y}px`, width: `${R.w}px`, height: `${R.h}px` });
    M.text.style.top = `${R.y + R.h + (portrait ? 26 : 34)}px`;
    M.hush.style.setProperty('--sx', `${R.x + R.w / 2}px`);
    M.hush.style.setProperty('--sy', `${R.y + R.h / 2}px`);
    M.halo.width = Math.round(vw * dpr);
    M.halo.height = Math.round(vh * dpr);
  }
  /* a point on the frame's edge (s from 0 to 1 around it) and the way out of it */
  function edgePoint(R, s) {
    const per = 2 * (R.w + R.h);
    let d = (((s % 1) + 1) % 1) * per;
    if (d < R.w) return [R.x + d, R.y, 0, -1];
    d -= R.w;
    if (d < R.h) return [R.x + R.w, R.y + d, 1, 0];
    d -= R.h;
    if (d < R.w) return [R.x + R.w - d, R.y + R.h, 0, 1];
    d -= R.w;
    return [R.x, R.y + R.h - d, -1, 0];
  }
  /* every colour gathered today leaves its own work and comes to rest behind the chosen one, never on it */
  function momentFlecks(item) {
    const out = [];
    for (const it of S.items) {
      const wld = WORLDS.find((w) => w.work === it.work);
      const pal = (wld && wld.pal) || [[230, 190, 120]];
      const own = it === item;
      const n = own ? 30 : 13;
      for (let i = 0; i < n; i++) {
        out.push({
          c: pal[i % pal.length], sx: it.x + rnd(-0.4, 0.4) * it.w, sy: it.y + rnd(-0.4, 0.4) * it.h,
          s: rnd(0, 1), d: rnd(4, own ? 30 : 54), r: rnd(28, own ? 58 : 80),
          delay: rnd(200, 1300) + (own ? 500 : 0), dur: rnd(1500, 2300), arc: rnd(-0.45, 0.45), ph: rnd(0, TAU),
        });
      }
    }
    return out;
  }
  function drawHalo() {
    if (!M.el || M.el.hidden) return;
    const c = M.ctx;
    const R = M.rect;
    const now = (performance.now() - M.t0) * SPEED;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, vw, vh);
    c.globalCompositeOperation = 'lighter';
    for (const f of M.flecks) {
      const tt = RM ? 1 : clamp((now - f.delay) / f.dur, 0, 1);
      if (tt <= 0) continue;
      const [px, py, nx, ny] = edgePoint(R, f.s);
      const sway = Math.sin(now / 1400 + f.ph) * 3;
      const tx = px + nx * f.d + ny * sway;
      const ty = py + ny * f.d + nx * sway;
      const e = tt < 0.5 ? 4 * tt * tt * tt : 1 - Math.pow(-2 * tt + 2, 3) / 2;
      const mx = (f.sx + tx) / 2 - (ty - f.sy) * f.arc;
      const my = (f.sy + ty) / 2 + (tx - f.sx) * f.arc;
      const x = (1 - e) * (1 - e) * f.sx + 2 * (1 - e) * e * mx + e * e * tx;
      const y = (1 - e) * (1 - e) * f.sy + 2 * (1 - e) * e * my + e * e * ty;
      const bloom = smooth((tt - 0.78) / 0.22);
      const [r, g, b] = f.c;
      if (bloom < 1) {
        c.fillStyle = `rgba(${r},${g},${b},${0.95 * (1 - bloom)})`;
        c.beginPath();
        c.arc(x, y, 3.2, 0, TAU);
        c.fill();
      }
      if (bloom > 0) {
        const breathe = 0.8 + 0.2 * Math.sin(now / 900 + f.ph);
        const rad = f.r * (0.55 + 0.45 * bloom);
        const gr = c.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, `rgba(${r},${g},${b},${0.32 * bloom * breathe})`);
        gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
        c.fillStyle = gr;
        c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
    }
    c.globalCompositeOperation = 'source-over';
    M.raf = requestAnimationFrame(drawHalo);
  }
  /* three quiet beats: where you found it, what it says, who it is for */
  function beatSpec(i) {
    const { item } = M;
    const w = item.work;
    if (i === 0) return { eyebrow: t(`feel.${item.f}`), line: t(`found.${item.id}`) };
    if (i === 1) return { eyebrow: t(`feel.${item.f}`), line: t(`ded.${item.id}`) };
    return { eyebrow: t('endEyebrow'), line: S.name ? t('tagTo', { name: S.name }) : t('tagNoName'), big: true, sub: t('signedBy', { artist: w.artist, n: fmtNum(w.ed) }) };
  }
  function fillBeat() {
    if (!M.el || M.beat < 0) return;
    const b = beatSpec(M.beat);
    M.beatEl.replaceChildren(...[
      h('p', { class: 'eyebrow' }, b.eyebrow),
      h('p', { class: b.big ? 'mline big' : 'mline' }, keepTogether(b.line)),
      b.sub ? h('p', { class: 'msub' }, keepTogether(b.sub)) : null].filter(Boolean));
    [...M.dots.children].forEach((d, k) => d.classList.toggle('on', k <= M.beat));
    M.dots.setAttribute('aria-label', t('tapMore'));
  }
  async function showBeat(i) {
    const el = M.beatEl;
    if (M.beat >= 0) await anim(el, [{ opacity: 1, filter: 'blur(0px)', transform: 'translateY(0px)' }, { opacity: 0, filter: 'blur(2px)', transform: 'translateY(-6px)' }], { duration: 280, easing: 'ease-in' });
    M.beat = i;
    fillBeat();
    await anim(el, [{ opacity: 0, filter: 'blur(3px)', transform: 'translateY(10px)' }, { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0px)' }], { duration: 760 });
  }
  /* wait, unless the visitor taps on: the moment never holds anyone */
  function waitOrTap(ms) {
    return new Promise((resolve) => {
      const done = () => { clearTimeout(tm); M.el.removeEventListener('pointerdown', done); resolve(); };
      const tm = setTimeout(done, Math.max(0, ms) / SPEED);
      M.el.addEventListener('pointerdown', done);
    });
  }
  async function moment(item, chord) {
    const el = $('#moment');
    const src = item.el.querySelector('img');
    const from = src.getBoundingClientRect();
    const hush = h('div', { class: 'hush', style: 'opacity:0' });
    const halo = h('canvas', { class: 'halo', 'aria-hidden': 'true' });
    const work = h('div', { class: 'mwork' }, h('img', { src: src.src, alt: `${item.work.title}, ${item.work.artist}`, draggable: 'false' }));
    const beatEl = h('div', { class: 'mbeat', 'aria-live': 'polite' });
    const dots = h('div', { class: 'mdots', role: 'img' }, h('i', {}), h('i', {}), h('i', {}));
    const text = h('div', { class: 'mtext' }, beatEl, dots);
    el.replaceChildren(hush, halo, work, text);
    Object.assign(M, { el, item, hush, halo, work, text, beatEl, dots, beat: -1, ctx: halo.getContext('2d'), flecks: momentFlecks(item), t0: performance.now() });
    el.hidden = false;
    placeMoment();
    /* the chosen work leaves the wall; the others step back and their lights go out, then the room goes quiet */
    src.style.visibility = 'hidden';
    for (const it of S.items) {
      anim(it.pool, [{ opacity: getComputedStyle(it.pool).opacity }, { opacity: 0 }], { duration: 500 });
      if (it !== item) anim(it.el, [{ opacity: 1 }, { opacity: 0 }], { duration: 420 });
    }
    anim(hush, [{ opacity: 0 }, { opacity: 0.94 }], { duration: 1300, delay: 440, easing: 'ease' });
    const R = M.rect;
    const lifted = `translate(${from.left - R.x}px, ${from.top - R.y}px) scale(${from.width / R.w})`;
    work.style.transform = lifted;
    anim(work, [{ transform: lifted }, { transform: 'translate(0px, 0px) scale(1)' }], { duration: 1600, delay: 200, easing: 'cubic-bezier(.65,0,.35,1)' });
    M.raf = requestAnimationFrame(drawHalo);
    /* the beats follow the music to its last chord; without sound they keep their own time */
    const last = chord > 3000 ? chord : 7600;
    const first = 2000;
    const second = (first + last) / 2;
    const t0 = performance.now();
    const until = (ms) => ms - (performance.now() - t0) * SPEED;
    await waitOrTap(until(first));
    await showBeat(0);
    await waitOrTap(until(second));
    await showBeat(1);
    await waitOrTap(until(last));
    buzz([10, 50, 18]);
    await showBeat(2);
    await waitOrTap(2800);
    anim(text, [{ opacity: 1 }, { opacity: 0 }], { duration: 420 });
  }
  function facts(w) {
    return h('div', { class: 'facts' },
      h('div', { class: 'seal', 'aria-hidden': 'true' }, h('span', {}, h('b', {}, t('handsigned')), t('edition', { n: fmtNum(w.ed) }))),
      h('div', { class: 'pricing' }, h('p', { class: 'p' }, fromPrice(w.ab)), h('p', { class: 'meta' }, `${size(w)}, ${t('smallest')}`)));
  }
  function showEnd(item) {
    const w = item.work;
    $('#end').replaceChildren(
      h('div', { class: 'end-space', style: 'pointer-events:none' }),
      h('div', { class: 'end-body' }, h('div', { class: 'end-cols' },
        h('div', { class: 'end-main' },
          h('p', { class: 'eyebrow' }, `${t('endEyebrow')} · ${t(`feel.${item.f}`)}`),
          h('h2', { class: 'display', id: 'endTitle' }, w.title),
          h('p', { class: 'by' }, `${w.artist} · ${w.year}`),
          w.story[LANG] ? h('p', { class: 'story' }, keepTogether(w.story[LANG])) : null,
          facts(w),
          h('div', { style: 'display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;margin-top:20px' },
            workLink(w, 'end_cta', { label: t('secure'), cls: 'btn', sameTab: true }),
            h('button', { class: 'link', type: 'button', onclick: () => { location.href = location.pathname + location.search; } }, t('again'))),
        ),
        h('div', {}, h('p', { class: 'eyebrow' }, t('bookTitle')), bookList('end_book', true, WORLDS.map((x) => ({ f: x.feeling, w: x.work })))),
      )),
    );
    $('#end').classList.add('show');
  }

  /* ------------------------------------------------------------ sheets */

  function bookList(where, sameTab = false, list = S.found.map((w) => ({ f: w.feeling, w: w.work }))) {
    if (!list.length) return h('p', { class: 'empty-book' }, t('bookEmpty'));
    return h('ul', { class: 'book' }, list.map(({ f, w }) => h('li', {},
      h('div', { class: 'th' }, h('img', { src: `assets/art/${w.code}.webp`, alt: '', loading: 'lazy' })),
      h('div', {}, h('p', { class: 'eyebrow' }, t(`feel.${f}`)), h('p', { class: 'ti' }, w.title), h('p', { class: 'meta' }, `${w.artist} · ${fromPrice(w.ab)}`), workLink(w, where, { sameTab })))));
  }
  function openSheet(build) {
    const sheet = $('#sheet');
    sheet.replaceChildren(h('button', { class: 'sheet-close', type: 'button', onclick: closeSheet }, t('close')), ...build().filter(Boolean));
    sheet.scrollTop = 0;
    sheet.hidden = false;
    $('#scrim').hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('open')));
    S.paused = S.phase === 'ride';
    if (S.paused) slow = 0;
  }
  function closeSheet() {
    const sheet = $('#sheet');
    sheet.classList.remove('open');
    $('#scrim').hidden = true;
    setTimeout(() => { if (!sheet.classList.contains('open')) sheet.hidden = true; }, 540);
    if (S.paused) { S.paused = false; slow = 1; }
  }
  function openWork(w, f, where) {
    track('gal_about', { gal_sku: w.sku, gal_where: where });
    openSheet(() => [
      h('div', { class: 'sheet-art' }, h('img', { src: `assets/art/${w.code}.webp`, alt: `${w.title}, ${w.artist}` })),
      h('p', { class: 'eyebrow' }, `${t(`feel.${f}`)} · ${w.artist}`),
      h('h2', { class: 'display', id: 'sheetTitle', style: 'font-size:30px;margin:6px 0 0' }, w.title),
      w.story[LANG] ? h('p', { class: 'story' }, keepTogether(w.story[LANG])) : null,
      facts(w),
      h('div', { style: 'margin-top:18px' }, workLink(w, `${where}_sheet`, { cls: 'btn' })),
    ]);
  }

  /* ------------------------------------------------------------ start */

  function fillText() {
    document.documentElement.lang = LANG;
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = keepTogether(t(el.dataset.t)); });
    document.title = `${t('title')} | LUMAS`;
    $('#giftName').placeholder = t('namePh');
    document.querySelectorAll('#budgetChips .chip').forEach((c) => { c.textContent = t(`budget_${c.dataset.id}`); });
    $('#btnGallery').textContent = vw && vw < 430 ? t('tGalleryShort') : t('tGallery');
    const lb = $('#btnLang');
    lb.textContent = t('langSwitch');
    lb.setAttribute('aria-label', t('langLabel'));
    lb.setAttribute('lang', LANG === 'de' ? 'en' : 'de');
  }
  /* switch language on the spot: static text, the caption, the sign, the gallery and the ending follow */
  function setLang(l) {
    if (l === LANG) return;
    LANG = G.LANG = l;
    COPY = COPIES[l];
    fillText();
    if (S.reInk) requestAnimationFrame(S.reInk);
    if (capSpec && !cap.classList.contains('out')) caption(capSpec, { instant: true });
    if (sign) { const w = sign.w; sign.el.remove(); sign = null; showSign(w); }
    if (S.phase === 'street') layoutScenes();
    if (S.phase === 'gallery' && S.focus) focusItem(S.focus);
    if (S.phase === 'moment') fillBeat();
    if (S.phase === 'end' && S.chosen && $('#end').classList.contains('show')) showEnd(S.chosen);
    try { const u = new URL(location.href); if (l === 'en') u.searchParams.set('lang', 'en'); else u.searchParams.delete('lang'); history.replaceState(null, '', u); } catch (e) { /* ignore */ }
    track('gal_lang', { gal_to: l });
  }
  function fillStatic() {
    fillText();
    $('#btnLang').addEventListener('click', () => setLang(LANG === 'de' ? 'en' : 'de'));
    const mb = $('#btnMusic');
    mb.setAttribute('aria-label', t('tMusic'));
    mb.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path class="w1" d="M15.5 8.5a5 5 0 0 1 0 7"/><path class="w2" d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
    const chips = $('#budgetChips');
    const ink = h('span', { class: 'chip-ink', 'aria-hidden': 'true' });
    chips.append(ink);
    const moveInk = (chip, instant) => {
      if (!chip) return;
      ink.style.transition = instant || RM ? 'none' : 'transform 420ms cubic-bezier(.34,1.3,.64,1), width 420ms cubic-bezier(.34,1.3,.64,1)';
      ink.style.transform = `translate3d(${chip.offsetLeft}px, ${chip.offsetTop}px, 0)`;
      ink.style.width = `${chip.offsetWidth}px`;
      ink.style.height = `${chip.offsetHeight}px`;
    };
    for (const b of DATA.config.budgets) {
      chips.append(h('button', {
        class: 'chip', type: 'button', role: 'radio', 'aria-checked': String(b.id === S.budget), 'data-id': b.id,
        onclick: (e) => {
          S.budget = b.id;
          chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-checked', String(c.dataset.id === b.id)));
          moveInk(e.currentTarget);
        },
      }, t(`budget_${b.id}`)));
    }
    fillText();
    requestAnimationFrame(() => moveInk(chips.querySelector('[aria-checked="true"]'), true));
    S.reInk = () => moveInk(chips.querySelector('[aria-checked="true"]'), true);
    $('#btnAll').addEventListener('click', () => openSheet(() => {
      const capEur = DATA.config.budgets.find((b) => b.id === S.budget).cap;
      const ws = DATA.works.filter((w) => capEur == null || w.ab <= capEur).sort((a, b) => a.ab - b.ab);
      return [h('h2', { class: 'display', id: 'sheetTitle', style: 'font-size:28px;margin:6px 0 0' }, t('allTitle')), bookList('all', false, ws.map((w) => ({ f: w.feeling, w })))];
    }));
    $('#btnBook').addEventListener('click', () => openSheet(() => [h('h2', { class: 'display', id: 'sheetTitle', style: 'font-size:28px;margin:6px 0 0' }, t('bookTitle')), bookList('book')]));
    $('#scrim').addEventListener('click', closeSheet);
    addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
    mb.addEventListener('click', () => {
      const A = audio();
      const on = !A.on;
      if (on) A.start?.(); else A.stop?.();
      mb.setAttribute('aria-pressed', String(on));
      track('gal_music', { gal_on: on ? 1 : 0 });
    });
    $('#btnGallery').addEventListener('click', skipToGallery);
  }
  async function skipToGallery() {
    if (S.skipped || S.phase === 'gallery' || S.phase === 'moment' || S.phase === 'end' || S.phase === 'street') return;
    S.skipped = true;
    track('gal_skip', { gal_found: S.found.length });
    hideCaption();
    hideSign();
    for (const w of WORLDS) if (!S.found.includes(w)) S.found.push(w);
    S.phase = 'skip';
    await enterGallery(null);
  }
  function layoutScenes() {
    if (S.reInk) S.reInk();
    if (typeof fillText === 'function' && $('#btnLang').textContent) $('#btnGallery').textContent = vw < 430 ? t('tGalleryShort') : t('tGallery');
    if (S.phase === 'street' && S.street) { const st = buildStreet(); S.street = st; if (S.enterGo) st.doorBtn.addEventListener('click', () => S.enterGo && S.enterGo(), { once: true }); st.sledder.style.transform = `translate3d(${st.door.x + st.door.w * 0.5 - st.sledW * 0.9}px, ${st.groundY - st.sledH}px, 0)`; }
    if (M.el) { placeMoment(); return; }
    if ((S.phase === 'gallery' || S.phase === 'end') && $('#gallery').hidden === false) { const f = S.focus; buildGallery(); for (const it of S.items) it.pool.style.opacity = '1'; if (f) { const it = S.items.find((x) => x.work === f.work); if (it) focusItem(it); } }
  }

  async function boot() {
    fillStatic();
    resize();
    addEventListener('resize', () => { clearTimeout(boot.rt); boot.rt = setTimeout(resize, 120); });
    for (const w of WORLDS) w.work = null;
    /* the start: the sled waits at the top of the first slope, the panel on the snow */
    cam.z = baseZoom();
    cam.x = sled.x - (vw / cam.z) * 0.3;
    cam.y = sled.y - (vh / cam.z) * (portrait ? 0.32 : 0.6);
    requestAnimationFrame(frame);
    const panel = $('#start');
    panel.classList.remove('out');
    if (!RM) [...panel.children].forEach((el, i) => anim(el, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 620, delay: 200 + i * 70 }));
    await new Promise((resolve) => { $('#btnGo').addEventListener('click', resolve, { once: true }); if (AUTO) setTimeout(resolve, 500); });
    const A = audio();
    try { if (A.init && A.init()) A.ctx && A.ctx.resume && A.ctx.resume(); } catch (e) { /* no sound */ }
    S.name = $('#giftName').value.trim().slice(0, 24);
    for (const w of WORLDS) {
      w.work = pickWork(w.feeling);
      loadImg(`art:${w.work.code}`, `assets/art/${w.work.code}.webp`).then((img) => { ready[`art:${w.work.code}`] = img; if (img) { w.pal = paletteOf(img); updateRings(); } });
    }
    track('gal_start', { gal_budget: S.budget, gal_named: S.name ? 1 : 0 });
    sfx('setScene', 'birch');
    sfx('start');
    $('#btnMusic').hidden = false;
    $('#btnMusic').setAttribute('aria-pressed', 'true');
    panel.classList.add('out');
    setTools();
    buildRings();
    S.jumps = 0;
    S.phase = 'ride';
    S.worldId = 'birch';
    sled.vx = 60;
    sled.sqv -= 5;
    setTimeout(showHowTo, 1500 / SPEED);
    if (AUTO) autoplay();
  }
  /* ?auto: rides by itself, hopping over every crest where flecks wait */
  function autoplay() {
    setInterval(() => {
      if (S.phase !== 'ride' || !sled.ground) return;
      const ahead = flecks.find((f) => !f.got && f.x > sled.x + 40 && f.x < sled.x + 260 && f.y < groundY(f.x) - 90);
      if (ahead) { press(); setTimeout(release, 380); }
    }, 120);
  }

  window.__ride = { S, sled, WORLDS, cam };
  boot();
})();
