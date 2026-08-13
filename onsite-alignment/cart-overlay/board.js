/* Shared behaviour for the cart-overlay boards.
   Each page picks its sets with <body data-sets="…">; there are no toggles —
   device and state stay overridable by URL (?dev=se&st=error) and every frame
   opens full-size with its own controls. */
/* ── options ──────────────────────────────────────────────────── */
const MOBILE_DEVICES = [
  { id:'i15', label:'iPhone 15', w:390, vh:734 },
  { id:'px7', label:'Pixel 7',   w:412, vh:787 },
  { id:'se',  label:'iPhone SE', w:375, vh:553 }
];
const STATES = [['default','Default'],['loading','Loading'],['empty','Empty'],['error','Error']];
const ZOOMS  = [['fit','Fit row'],['m','Medium'],['l','Large'],['s','Small']];
/* Medium keeps five phone frames on one 1600px row and still reads at arm's length. */
const ZOOM_MAP = { s:{ m:.52 }, m:{ m:.72 }, l:{ m:1 } };

/* Round 1 — page 1. Baseline (the current invoice-style cart) and aggressive
   (needs ~1.15× the tallest phone viewport) are out of the running. Both are
   still selectable in the prototype file if you want to look back at them. */
const R1_VARIANTS = [
  ['conservative', 'Conservative refinement',  'tidier hierarchy, trust bullets'],
  ['recommended',  'Recommended — confidence', 'reservation framing, dominant CTA']
];
const R1_MARKETS = [['de','DE'],['us','US']];

/* Round 2 — page 2. Five disclosure treatments plus the other surfaces. */
/* C (bordered trust box), D (collapsed total) and E (full breakdown) are out.
   They remain selectable in the page-2 prototype via ?d=C|D|E. */
const R2_DISCLOSURE = [
  ['A','A — local-shipping note',  '"Der Betrag beinhaltet lokale Versandkosten."'],
  ['B','B — insured-delivery text','shield line under the total']
];
/* The other surfaces — mobile page, cart page, desktop drawer / panel /
   checkout — deliberately live in the page-2 file rather than on this board.
   Mixing a 1440px page into a row of phone frames made both unreadable. */

const params = new URLSearchParams(location.search);
const state = {
  dev:  MOBILE_DEVICES.some(d => d.id === params.get('dev')) ? params.get('dev') : 'i15',
  st:   STATES.some(x => x[0] === params.get('st')) ? params.get('st') : 'default',
  zoom: ZOOMS.some(x => x[0] === params.get('zoom')) ? params.get('zoom') : 'fit'
};

/* The tiles are iframes of files that change often — without this, the browser
   serves a cached copy and edits to the prototypes appear to do nothing. */
const BUST = Date.now().toString(36);
const dev = () => MOBILE_DEVICES.find(d => d.id === state.dev);

/* ── tile builder ─────────────────────────────────────────────── */
let counter = 0;
/* The prototypes' own fit readout is hidden in embedded mode, so tiles reserve
   no room for it — the fit numbers live in the full-size prototypes. */
const FIT_BAR = 0;

/* One word per frame. Everything else the reader needs is in the set header. */
function tile({ href, w, vh, scale, label }) {
  const tw = Math.round(w * scale);
  const th = Math.round((vh + FIT_BAR) * scale);
  return `
  <a class="tile" href="${href}" target="_blank" rel="noopener"
     style="--tw:${tw}px;--th:${th}px">
    <span class="tag">${label}</span>
    <span class="viewport">
      <iframe src="${href}&chrome=0&b=${BUST}" width="${w}" height="${vh + FIT_BAR}"
        style="transform:scale(${scale})" loading="lazy" title="${label}"></iframe>
      <span class="uilabel open">Open</span>
    </span>
  </a>`;
}

function render() {
  const d = dev();
  counter = 0;

  /* Three sets, one comparison each: conservative DE vs US, recommended DE vs US,
     then the two disclosure treatments. A pair per row is the most a reader can
     hold at once — six frames side by side was too much at a glance. */
  const SETS = [
    { title: 'Conservative refinement',
      q: 'Tidier hierarchy and trust bullets — does a cleaner cart carry the decision on its own?',
      tiles: R1_MARKETS.map(([m, label]) => ({
        href: `variants.html?m=${m}&v=conservative&s=${state.st}&dev=${d.id}&pay=brand`,
        label })) },
    { title: 'Recommended — confidence',
      q: 'Reservation framing and a dominant CTA — does reassurance beat tidiness?',
      tiles: R1_MARKETS.map(([m, label]) => ({
        href: `variants.html?m=${m}&v=recommended&s=${state.st}&dev=${d.id}&pay=brand`,
        label })) },
    { title: 'Total disclosure',
      q: 'A states that the total includes local shipping · B adds the insured-delivery promise under it.',
      tiles: R2_DISCLOSURE.map(([code]) => ({
        href: `disclosure.html?s=mob-sheet&d=${code}&st=${state.st}&dev=${d.id}`,
        label: code })) }
  ];

  /* Only the sets this page asks for */
  const want = (document.body.dataset.sets || '1,2,3').split(',').map(n => +n.trim());
  const SHOWN = SETS.filter((_, i) => want.includes(i + 1));

  /* Fit a PAIR to the window, so each frame lands at or near full size.
     Measure a probe row rather than the window — it accounts for page padding
     and survives contexts where innerWidth reads 0. */
  const host = document.getElementById('sets');
  host.innerHTML = '<div class="strip" id="probe"></div>';
  const avail = document.getElementById('probe').clientWidth || document.documentElement.clientWidth || 1440;
  const gap = 64;
  const perRow = 2;
  const fit = (avail - gap * (perRow - 1)) / (perRow * d.w);
  const scale = state.zoom === 'fit' ? Math.min(1, Math.max(.4, fit)) : ZOOM_MAP[state.zoom].m;

  host.innerHTML = SHOWN.map((set, i) => `
    <div class="set">
      <div class="set-head">
        <span class="line"><span class="n">${String(want[i]).padStart(2, '0')}</span><h2>${set.title}</h2></span>
        <p class="b-sm t-sec q">${set.q}</p>
      </div>
      <div class="strip">
        ${set.tiles.map(s => tile({ href: s.href, w: d.w, vh: d.vh, scale, label: s.label })).join('')}
      </div>
    </div>`).join('');

  const q = new URLSearchParams({ dev: state.dev, st: state.st, zoom: state.zoom });
  history.replaceState(null, '', '?' + q);
}



/* re-fit the row when the window changes width */
let resizeTimer;
window.addEventListener('resize', () => {
  if (state.zoom !== 'fit') return;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(render, 150);
});

render();
