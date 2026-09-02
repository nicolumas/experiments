#!/usr/bin/env node
/**
 * Measured checks for pillow-art-drop.html. Reports numbers, not assurances.
 *
 *   node audit.js [http://localhost:8947/pillow-art-drop.html]
 *
 * Playwright comes from the repo's e2e workspace, so there is nothing to
 * install here. Writes audit-report.json beside this file; check-hero-scrim.py
 * consumes the hero geometry from it and does the pixel test on the photograph.
 *
 * What it checks, and why each one is here:
 *   1  every referenced image actually loads
 *   2  zero horizontal overflow at 320 / 390 / 430 / 768 / 1024 / 1440 / 1920
 *   3  hero lockup above the fold, phones and short desktop windows alike
 *   4  hero geometry and per-line lockup rects, for check-hero-scrim.py
 *   5  AA contrast across 4 phases x {390, 1440} — reveal transitions are
 *      killed first, because a transition still in flight reports every
 *      element at exactly 1:1 and looks like a total failure. The hero lockup
 *      is excluded here and measured by check-hero-scrim.py instead, which
 *      samples the photograph rather than compositing background colours.
 *   6  distinct type combinations (family/size/weight) at 390 and 1440
 *   7  countdown numeral width across all 100 digit pairs
 *   8  carousel slides-per-view measured from rendered widths
 *   9  real line boxes: no line ends on a short function word, no paragraph
 *      ends with a single word alone on the last line
 */
const path = require('path');
const fs = require('fs');

const E2E = path.resolve(
  __dirname,
  '../../../Desktop/CODE/lumassprykerng/tests/e2e/node_modules/@playwright/test'
);
const { chromium } = require(E2E);

const URL_BASE = process.argv[2] || 'http://localhost:8947/pillow-art-drop.html';
const PHASES = ['REVEAL', 'EARLY_ACCESS', 'PUBLIC', 'ENDED'];
const WIDTHS = [320, 390, 430, 768, 1024, 1440, 1920];
// Short desktop windows matter too: at 92vh the hero bottom fell below the
// fold and clipped the last lockup line on anything under ~1010px tall.
const FOLD = [[320, 568], [390, 844], [430, 932],
              [768, 700], [1024, 700], [1440, 800], [1920, 900]];

/* ---------------------------------------------------------------- in-page ---
   Kept as strings so they run in the page, where the layout lives. */

const FREEZE = `
  const s = document.createElement('style');
  s.id = '__audit_freeze';
  s.textContent = '*,*::before,*::after{transition:none !important;animation:none !important}' +
                  '.js .reveal{opacity:1 !important;transform:none !important}';
  document.head.appendChild(s);
  document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in'));
`;

const CONTRAST = `(() => {
  const px = v => parseFloat(v) || 0;
  const parse = c => {
    const m = String(c).match(/[\\d.]+/g);
    if (!m) return null;
    return { r: +m[0], g: +m[1], b: +m[2], a: m.length > 3 ? +m[3] : 1 };
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const lum = c => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  // Effective background: paint from the outermost ancestor inwards, so a
  // semi-transparent fill composites onto whatever is actually behind it.
  // Each element's OWN background counts too - buttons paint their own fill.
  const bgOf = el => {
    const chain = [];
    for (let n = el; n; n = n.parentElement) chain.push(n);
    let acc = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = chain.length - 1; i >= 0; i--) {
      const cs = getComputedStyle(chain[i]);
      const c = parse(cs.backgroundColor);
      if (!c || !c.a) continue;
      const op = px(cs.opacity);
      acc = over({ ...c, a: c.a * (op === 0 ? 0 : op || 1) }, acc);
    }
    return acc;
  };

  const results = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    // .proof__lockup is excluded on purpose: its background is a photograph
    // plus a gradient scrim, which this walker cannot composite. Those four
    // lines are measured against the real pixels by check-hero-scrim.py, which
    // is stricter than this check, not laxer.
    if (el.closest('.dev, .phase-switch, .sr-only, .skip-link, .proof__lockup')) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    // total opacity down the ancestry
    let op = 1;
    for (let a = el; a; a = a.parentElement) op *= px(getComputedStyle(a).opacity) || 1;
    if (op < 0.99) continue;                       // still animating: not a real reading

    const bg = bgOf(el);
    const fg = over(parse(cs.color), bg);
    const size = px(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    // WCAG large text is 24px, or 18.66px at weight >= 700. Not 18px.
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;
    const got = ratio(fg, bg);
    results.push({
      text: n.nodeValue.trim().slice(0, 42),
      sel: el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.'),
      size, weight, large, need, ratio: +got.toFixed(2), pass: got >= need - 0.005,
    });
  }
  return results;
})()`;

const TYPECOMBOS = `(() => {
  const out = new Map();
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement;
    if (!el || el.closest('.dev, .phase-switch, .sr-only, .skip-link')) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    if (!el.getBoundingClientRect().width) continue;
    const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '');
    const key = fam + ' ' + Math.round(parseFloat(cs.fontSize) * 100) / 100 + 'px ' + cs.fontWeight;
    if (!out.has(key)) out.set(key, []);
    const list = out.get(key);
    if (list.length < 3) list.push(n.nodeValue.trim().slice(0, 24));
  }
  return [...out.entries()].map(([k, v]) => ({ combo: k, examples: v }));
})()`;

/* Measures the REAL line boxes of every paragraph and heading, because the
   binding in fix-typography.py is a prediction and this is the check.

   Measured with Ranges over the existing text node, NOT by wrapping words in
   spans: the first version did that and reported a widow the browser was not
   actually rendering, because inserting inline elements changes how
   `text-wrap: balance` distributes the lines. The DOM has to stay untouched.

   Two offences are reported:
     widow   a last line holding a single word
     orphan  a line ending on a short function word
   A non-breaking space is not a split point, so a bound pair can never be
   counted as an offence. */
const LINEBREAKS = `(() => {
  const SHORT = new Set(('der die das den dem des ein eine einen einem einer und '
    + 'oder mit von vom zum zur aus auf bei im am in an ist als wie nur bis für '
    + 'ohne über unter vor nach seit sich wird sind the a an and or of to on at is '
    + 'as for by with from no its it that only until after every each one two three so'
    ).split(' '));
  const out = [];
  document.querySelectorAll('p, h1, h2, h3, h4, blockquote, dd, li').forEach(el => {
    if (el.closest('.dev, .phase-switch, .sr-only, .skip-link')) return;
    if (el.hidden || el.offsetParent === null) return;
    if (el.childNodes.length !== 1 || el.firstChild.nodeType !== 3) return;
    const node = el.firstChild;
    const text = node.nodeValue;
    if (!text || text.trim().split(/[ \u00a0]+/).length < 4) return;

    // word spans by character offset; \u00a0 does NOT end a word
    const words = [];
    const re = /[^ ]+/g;
    let m;
    while ((m = re.exec(text)) !== null) words.push([m.index, m.index + m[0].length, m[0]]);
    if (words.length < 4) return;

    const range = document.createRange();
    const lines = [];
    let top = null;
    for (const [a, b, w] of words) {
      range.setStart(node, a); range.setEnd(node, b);
      const t = Math.round(range.getBoundingClientRect().top);
      if (top === null || Math.abs(t - top) > 3) { lines.push([]); top = t; }
      lines[lines.length - 1].push(w);
    }
    range.detach && range.detach();
    if (lines.length < 2) return;

    const id = el.tagName.toLowerCase() + '.' +
      (el.className || '').toString().split(' ').filter(Boolean)[0];
    const last = lines[lines.length - 1];
    if (last.length === 1 && !/\u00a0/.test(last[0])) {
      out.push({ kind: 'widow', text: text.trim().slice(0, 46), word: last[0], sel: id });
    }
    for (let i = 0; i < lines.length - 1; i++) {
      const tail = lines[i][lines[i].length - 1];
      const clean = tail.replace(/[^\wÄÖÜäöüß]+$/, '').toLowerCase();
      if (SHORT.has(clean)) {
        out.push({ kind: 'orphan', text: text.trim().slice(0, 46), word: tail, sel: id });
      }
    }
  });
  return out;
})()`;

const OVERFLOW = `(() => {
  const d = document.documentElement;
  const off = [];
  if (d.scrollWidth > d.clientWidth) {
    document.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.right > d.clientWidth + 1 || r.left < -1) {
        off.push({ sel: el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ').filter(Boolean).slice(0,2).join('.'),
                   left: Math.round(r.left), right: Math.round(r.right) });
      }
    });
  }
  return { scrollWidth: d.scrollWidth, clientWidth: d.clientWidth,
           overflow: d.scrollWidth - d.clientWidth, offenders: off.slice(0, 12) };
})()`;

const HERO = `(() => {
  const proof = document.querySelector('.proof');
  const img = document.querySelector('.proof__img');
  const lockup = document.querySelector('.proof__lockup');
  const px = v => parseFloat(v) || 0;
  // Every visible line, with its own box and type spec: the scrim ramp is a
  // function of height, so a per-line rect is the only way to know the alpha
  // that actually lands behind each one.
  const lines = [...lockup.children].filter(el => !el.hidden && el.offsetParent !== null).map(el => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      text: el.textContent.trim().slice(0, 40),
      x: r.left, y: r.top, w: r.width, h: r.height,
      color: cs.color,
      fontSize: px(cs.fontSize),
      fontWeight: parseInt(cs.fontWeight, 10) || 400,
    };
  });
  const scrimStyle = getComputedStyle(proof, '::after');
  const pr = proof.getBoundingClientRect(), lr = lockup.getBoundingClientRect();
  return {
    src: (img.currentSrc || img.src).split('/').pop(),
    natural: [img.naturalWidth, img.naturalHeight],
    objectPosition: getComputedStyle(img).objectPosition,
    container: { x: pr.left, y: pr.top, w: pr.width, h: pr.height },
    plate: { x: lr.left, y: lr.top, w: lr.width, h: lr.height },
    scrim: { height: scrimStyle.height, background: scrimStyle.backgroundImage,
             mask: scrimStyle.maskImage || scrimStyle.webkitMaskImage || 'none' },
    lines,
    viewportH: innerHeight,
    lockupBottom: Math.round(lr.bottom),
    aboveFold: lr.bottom <= innerHeight + 0.5,
  };
})()`;

const DIGITPAIRS = `(() => {
  const el = document.querySelector('#cd-close .cd__num') || document.querySelector('.cd__num');
  if (!el) return { error: 'no .cd__num rendered' };
  const before = el.textContent;
  const widths = {};
  for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) {
    el.textContent = '' + a + b;
    widths['' + a + b] = Math.round(el.getBoundingClientRect().width * 100) / 100;
  }
  el.textContent = before;
  const vals = Object.values(widths);
  const min = Math.min(...vals), max = Math.max(...vals);
  const worst = Object.entries(widths).filter(([, w]) => w === max).map(([k]) => k);
  return { min, max, spread: +(max - min).toFixed(2), distinct: new Set(vals).size, widestPairs: worst.slice(0, 4),
           fontSize: parseFloat(getComputedStyle(el).fontSize) };
})()`;

const CAROUSELS = `(() => {
  return [...document.querySelectorAll('[data-carousel]')].map(root => {
    const track = root.querySelector('.carousel__track');
    const slides = [...root.querySelectorAll('.carousel__slide')];
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const w = slides[0] ? slides[0].getBoundingClientRect().width : 0;
    return { name: root.dataset.carousel, slides: slides.length,
             slideWidth: Math.round(w * 100) / 100, gap,
             trackWidth: Math.round(track.clientWidth),
             perView: w ? Math.round((track.clientWidth + gap) / (w + gap)) : 0 };
  });
})()`;

/* ------------------------------------------------------------------ driver --- */

async function main() {
  const browser = await chromium.launch();
  const report = { url: URL_BASE, generated: new Date().toISOString(), checks: {} };

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) console.log('  console error:', m.text()); });

  // --- 1. images ----------------------------------------------------------
  await page.goto(URL_BASE, { waitUntil: 'load' });
  await page.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await sleep(70); }
    // Carousel slides are lazy and sit off-screen HORIZONTALLY, so scrolling the
    // page alone never loads past the first few. Two traps here: the section has
    // to be in view VERTICALLY as well (Chromium will not start a lazy load for
    // a slide whose section is nowhere near the viewport), and the track has
    // scroll-behavior:smooth, so assigning scrollLeft in a loop animates and
    // never arrives — the far slides stayed unloaded until the behaviour was
    // forced to auto and each slide was brought into view individually.
    for (const t of document.querySelectorAll('.carousel__track')) {
      const prev = t.style.scrollBehavior;
      t.style.scrollBehavior = 'auto';
      for (const slide of t.querySelectorAll('.carousel__slide')) {
        slide.scrollIntoView({ block: 'center', inline: 'center' });
        await sleep(110);
      }
      t.scrollLeft = 0;
      t.style.scrollBehavior = prev;
      await sleep(120);
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(3500);
  report.checks.images = await page.evaluate(`(() => {
    const all = [...document.images].map(i => ({ src: (i.currentSrc || i.src),
      ok: i.complete && i.naturalWidth > 0, nat: i.naturalWidth + 'x' + i.naturalHeight }));
    return { total: all.length, failed: all.filter(a => !a.ok).map(a => a.src),
             fallbackBlocks: document.querySelectorAll('.fallback').length,
             placeholderBlocks: document.querySelectorAll('.placeholder').length,
             loaded: all.filter(a => a.ok).map(a => a.src.split('/').pop() + ' ' + a.nat) };
  })()`);

  // --- 1b. every local asset, including the ones only a breakpoint reaches ---
  // document.images only sees currentSrc, so an asset behind <source media>
  // (the <=767 hero portrait, the >=1024 artist portrait) is never requested at
  // the audit viewport and a 404 on it would pass silently. Load each candidate
  // directly instead.
  report.checks.assets = await page.evaluate(`(async () => {
    const names = new Set();
    for (const el of document.querySelectorAll('img[src], img[srcset], source[srcset]')) {
      for (const attr of [el.getAttribute('src'), el.getAttribute('srcset')]) {
        if (!attr) continue;
        for (const part of attr.split(',')) {
          const u = part.trim().split(/\\s+/)[0];
          if (u && !/^(https?:)?\\/\\//.test(u) && !u.startsWith('data:')) names.add(u);
        }
      }
    }
    const results = [];
    for (const n of names) {
      try {
        const im = new Image();
        im.src = n;
        await im.decode();
        results.push({ n, ok: im.naturalWidth > 0, nat: im.naturalWidth + 'x' + im.naturalHeight });
      } catch (e) { results.push({ n, ok: false, nat: 'no decode' }); }
    }
    return results;
  })()`);

  // --- 2. overflow -------------------------------------------------------
  report.checks.overflow = {};
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(260);
    report.checks.overflow[w] = await page.evaluate(OVERFLOW);
  }

  // --- 3 + 4. hero fold and plate geometry -------------------------------
  report.checks.heroFold = {};
  for (const [w, h] of FOLD) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(320);
    report.checks.heroFold[`${w}x${h}`] = await page.evaluate(HERO);
  }
  report.checks.heroGeometry = {};
  for (const w of [320, 390, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width: w, height: w < 768 ? 844 : 900 });
    await page.waitForTimeout(320);
    report.checks.heroGeometry[w] = await page.evaluate(HERO);
  }

  // --- 5. contrast, 4 phases x 2 widths ----------------------------------
  report.checks.contrast = {};
  for (const phase of PHASES) {
    for (const w of [390, 1440]) {
      await page.setViewportSize({ width: w, height: w === 390 ? 844 : 900 });
      await page.goto(`${URL_BASE}?phase=${phase}`, { waitUntil: 'load' });
      await page.evaluate(FREEZE);
      await page.waitForTimeout(500);
      const rows = await page.evaluate(CONTRAST);
      const fails = rows.filter(r => !r.pass);
      const min = rows.reduce((m, r) => (r.ratio < m.ratio ? r : m), rows[0]);
      report.checks.contrast[`${phase}@${w}`] = {
        nodes: rows.length, failures: fails,
        minRatio: min && min.ratio, minAt: min && `${min.sel} "${min.text}" ${min.size}px/${min.weight}`,
      };
    }
  }

  // --- 5b. line breaks: no orphans, no widows ----------------------------
  report.checks.lineBreaks = {};
  for (const w of [320, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width: w, height: w < 768 ? 844 : 900 });
    await page.goto(`${URL_BASE}?phase=PUBLIC`, { waitUntil: 'load' });
    await page.evaluate(FREEZE);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    report.checks.lineBreaks[w] = await page.evaluate(LINEBREAKS);
  }

  // --- 6. type combinations ----------------------------------------------
  report.checks.typeCombos = {};
  for (const w of [390, 1440]) {
    await page.setViewportSize({ width: w, height: w === 390 ? 844 : 900 });
    await page.goto(`${URL_BASE}?phase=PUBLIC`, { waitUntil: 'load' });
    await page.evaluate(FREEZE);
    await page.waitForTimeout(400);
    const combos = await page.evaluate(TYPECOMBOS);
    report.checks.typeCombos[w] = { count: combos.length, combos };
  }

  // --- 7. countdown digits ------------------------------------------------
  report.checks.digitPairs = {};
  for (const w of [390, 1440]) {
    await page.setViewportSize({ width: w, height: w === 390 ? 844 : 900 });
    await page.goto(`${URL_BASE}?phase=PUBLIC`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(700);
    report.checks.digitPairs[w] = await page.evaluate(DIGITPAIRS);
  }

  // --- 8. carousels -------------------------------------------------------
  report.checks.carousels = {};
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(`${URL_BASE}?phase=PUBLIC`, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    report.checks.carousels[w] = await page.evaluate(CAROUSELS);
  }

  fs.writeFileSync(path.join(__dirname, 'audit-report.json'), JSON.stringify(report, null, 2));
  await browser.close();

  /* ------------------------------------------------------------ summary --- */
  const c = report.checks;
  const line = (ok, s) => console.log((ok ? '  PASS  ' : '  FAIL  ') + s);
  console.log('\n=== ' + URL_BASE + ' ===\n');
  line(c.images.failed.length === 0,
    `images: ${c.images.total - c.images.failed.length}/${c.images.total} loaded` +
    (c.images.failed.length ? ' — failed: ' + c.images.failed.join(', ') : '') +
    ` · ${c.images.placeholderBlocks} deliberate placeholder(s)`);

  const badAssets = c.assets.filter(a => !a.ok);
  line(badAssets.length === 0,
    `local assets decode, breakpoint-only ones included: ${c.assets.length - badAssets.length}/${c.assets.length}` +
    (badAssets.length ? ' — ' + badAssets.map(a => a.n + ' (' + a.nat + ')').join(', ')
                      : ' · ' + c.assets.map(a => a.n.replace('.jpg', '') + ' ' + a.nat).join(' · ')));

  const ovf = Object.entries(c.overflow).filter(([, v]) => v.overflow > 0);
  line(ovf.length === 0, 'horizontal overflow: ' +
    (ovf.length ? ovf.map(([w, v]) => `${w}px +${v.overflow}`).join(', ')
                : Object.keys(c.overflow).join(' / ') + ' all 0px'));

  const folds = Object.entries(c.heroFold);
  line(folds.every(([, v]) => v.aboveFold), 'hero lockup above the fold: ' +
    folds.map(([k, v]) => `${k} bottom=${v.lockupBottom}/${v.viewportH}`).join(', '));

  const cRows = Object.entries(c.contrast);
  const cFail = cRows.filter(([, v]) => v.failures.length);
  const worst = cRows.reduce((m, [k, v]) => (v.minRatio < m[1] ? [k, v.minRatio, v.minAt] : m), ['', 99, '']);
  line(cFail.length === 0, `AA contrast, ${cRows.length} phase/width combinations: ` +
    (cFail.length ? cFail.map(([k, v]) => `${k}: ${v.failures.length} fail (${v.failures.map(f => f.sel + ' ' + f.ratio).join('; ')})`).join(' | ')
                  : `all pass, minimum ${worst[1]}:1 at ${worst[0]} — ${worst[2]}`));

  const lb = Object.entries(c.lineBreaks);
  const lbBad = lb.filter(([, v]) => v.length);
  line(lbBad.length === 0, 'line breaks, no orphans or widows at ' +
    lb.map(([w]) => w).join(' / ') + ': ' +
    (lbBad.length
      ? lbBad.map(([w, v]) => `${w}px ${v.length} (` +
          v.slice(0, 4).map(o => `${o.kind} "${o.word}" in ${o.sel}`).join('; ') + ')').join(' | ')
      : 'clean'));

  Object.entries(c.typeCombos).forEach(([w, v]) =>
    line(v.count <= 12, `type combinations at ${w}px: ${v.count} (target <=12)`));

  Object.entries(c.digitPairs).forEach(([w, v]) =>
    line(v.distinct === 1, `countdown numeral at ${w}px (${v.fontSize}px): ` +
      (v.distinct === 1 ? `all 100 digit pairs render at ${v.min}px`
                        : `${v.distinct} distinct widths, spread ${v.spread}px, widest ${v.widestPairs}`)));

  console.log('\n  carousel slides per view (measured from rendered widths):');
  Object.entries(c.carousels).forEach(([w, list]) =>
    console.log(`    ${String(w).padStart(4)}px  ` + list.map(l => `${l.name}=${l.perView} (slide ${l.slideWidth}px, gap ${l.gap}px)`).join('  ')));

  console.log('\n  hero geometry written to audit-report.json — run check-hero-scrim.py next\n');
}

main().catch(e => { console.error(e); process.exit(1); });
