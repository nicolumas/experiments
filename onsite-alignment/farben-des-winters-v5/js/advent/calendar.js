/* The calendar: the evening street with 24 doors. Opened doors show their work bare; today's door glows and starts
   the ride; missed and future doors stay closed. It re-reads the time whenever the tab comes back, so a page left
   open over midnight shows the new day. GAL.calendar.init(deps) once, then show() / hide(). */
(function (root) {
  'use strict';

  const G = (root.GAL = root.GAL || {});
  const SUNDAYS = [6, 13, 20];
  let D = null;
  let el = null;
  let snow = null;
  const RM = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const h = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) e.append(kid.nodeType ? kid : document.createTextNode(kid));
    return e;
  };

  /* deps: { sched, t, track, lang(), now(), opened(), busy(), plate(), windowRect(), onRide(entry, door), onCard(entry, from), onDirect(entry), demo, search } */
  function init(deps) {
    D = deps;
    el = document.getElementById('calendar');
    document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'hidden' && el && !el.hidden) show(); });
  }

  function title(today, state, now) {
    const A = G.advent;
    if (!today) {
      /* today's door may open later in the day (the drop opens at 05:00) */
      const later = D.sched.find((e) => e.date === A.berlinIso(now));
      if (later) {
        const [hh, mm] = (later.opensAt || '00:00').split(':');
        return D.t('calOpensAt', { n: later.day, time: D.lang() === 'de' ? (mm === '00' ? String(+hh) : `${+hh}:${mm}`) : `${hh}:${mm}` });
      }
      return now < A.opensAtMs(D.sched[0]) ? D.t('calBefore') : D.t('calAfter');
    }
    if (state === 'open') return D.t('calToday', { n: today.day });
    const next = A.nextEntry(D.sched, today);
    return next ? D.t('calOpened', { n: today.day, m: next.day }) : D.t('calAfter');
  }

  function door(e, state, today) {
    const label = D.t('door', { n: e.day });
    const cls = `door is-${state}${SUNDAYS.includes(e.day) ? ' is-sunday' : ''}${e.day === 24 ? ' is-24' : ''}`;
    /* the 24th is the gallery, never a card: on the day, its door always leads back into it */
    if (e.type === 'finale') {
      const live = today && today.day === e.day && (state === 'open' || state === 'opened');
      return live ? h('button', { class: cls, type: 'button', 'data-day': e.day, 'data-state': state, 'aria-label': label, onclick: () => D.onRide(e) }, h('span', { class: 'n' }, String(e.day)))
        : h('div', { class: cls, 'data-day': e.day, 'data-state': state, 'aria-label': label, role: 'img' }, h('span', { class: 'n' }, String(e.day)));
    }
    if (state === 'opened') {
      const src = e.work ? `assets/art/${e.work.code}.webp` : e.image;
      const inner = src ? h('img', { src, alt: '', loading: 'lazy', draggable: 'false' }) : h('span', { class: 'n' }, String(e.day));
      return h('button', { class: cls, type: 'button', 'data-day': e.day, 'data-state': state, 'aria-label': `${label}${e.work ? `, ${e.work.title}` : ''}`, onclick: () => D.onCard(e, 'calendar') }, inner);
    }
    /* today's door rides; a door still open from an earlier day (the drop on 22.12.) opens its card */
    if (state === 'open') {
      const isToday = today && today.day === e.day;
      const btn = h('button', { class: cls, type: 'button', 'data-day': e.day, 'data-state': state, 'aria-label': label },
        h('span', { class: 'leaf' }, h('span', { class: 'n' }, String(e.day))),
        [0, 1, 2, 3].map((i) => h('i', { class: 'spark', style: `--s:${i}` })));
      btn.addEventListener('click', () => (isToday ? D.onRide(e, btn) : D.onDirect(e)));
      return btn;
    }
    return h('div', { class: cls, 'data-day': e.day, 'data-state': state, 'aria-label': label, role: 'img' }, h('span', { class: 'n' }, String(e.day)));
  }

  function show() {
    const A = G.advent;
    const now = D.now();
    const opened = D.opened();
    const today = A.todayEntry(D.sched, now);
    const state = today ? A.doorState(today, now, opened) : null;
    const date = new Intl.DateTimeFormat(D.lang() === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', timeZone: 'Europe/Berlin' }).format(now);
    const panel = h('div', { class: 'cal-panel' },
      h('p', { class: 'eyebrow' }, D.t('calEyebrow', { date })),
      h('p', { class: 'cal-title' }, title(today, state, now)),
      h('div', { class: 'cal-grid' }, D.sched.map((e, i) => { const d = door(e, A.doorState(e, now, opened), today); d.style.setProperty('--i', i); return d; })),
      state === 'open' && today.type !== 'finale' && !D.busy() ? h('button', { class: 'link cal-direct', type: 'button', onclick: () => D.onDirect(today) }, D.t('direct')) : null);
    let picker = null;
    if (D.demo && new URLSearchParams(D.search).has('demo')) {
      const lang = D.lang() === 'en' ? '&lang=en' : '';
      picker = h('nav', { class: 'cal-demo', 'aria-label': 'Demo' }, D.sched.map((e) => h('a', { href: `?day=${e.day}&demo${lang}` }, String(e.day))));
    }
    /* the street lives: the shop window glows, snow falls */
    const w = D.windowRect ? D.windowRect() : null;
    const glow = w ? h('div', { class: 'cal-glow', style: `left:${w.x}px;top:${w.y}px;width:${w.w}px;height:${w.h}px` }) : null;
    const cv = RM() ? null : h('canvas', { class: 'cal-snow', 'aria-hidden': 'true' });
    el.replaceChildren(h('img', { class: 'cal-plate', src: D.plate(), alt: '' }), glow, cv, panel, picker);
    el.hidden = false;
    startSnow(cv);
    D.track('gal_calendar', { gal_today: state === 'open' || state === 'opened' ? today.day : null, gal_opened: opened.size });
  }
  function hide() { if (el) el.hidden = true; stopSnow(); }

  /* light snow over the street, only while the calendar is up */
  function startSnow(cv) {
    stopSnow();
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = innerWidth;
    const H = innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    const g = cv.getContext('2d');
    const flakes = Array.from({ length: Math.round((W * H) / 9000) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 0.8 + Math.random() * 2.2, v: 18 + Math.random() * 34, ph: Math.random() * 6.28 }));
    let last = performance.now();
    const draw = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,0.85)';
      for (const f of flakes) {
        f.y += f.v * dt;
        f.x += Math.sin(t / 1400 + f.ph) * 0.3;
        if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W; }
        g.beginPath();
        g.arc(f.x, f.y, f.r, 0, 6.2832);
        g.fill();
      }
      snow = requestAnimationFrame(draw);
    };
    draw(last);
  }
  function stopSnow() { if (snow) cancelAnimationFrame(snow); snow = null; }

  /* through the door: the leaf swings open, warm light pours out and fills the screen; resolves when it has */
  function throughDoor(btn) {
    const portal = document.getElementById('portal');
    if (RM() || !portal) return Promise.resolve();
    const speed = G.SPEED || 1;
    btn.classList.add('opening');
    const r = btn.getBoundingClientRect();
    const size = Math.hypot(innerWidth, innerHeight) * 2.2;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    portal.style.cssText = `left:${cx - size / 2}px;top:${cy - size / 2}px;width:${size}px;height:${size}px`;
    portal.classList.add('on');
    const a = portal.animate([
      { transform: `scale(${(r.width * 0.6) / size})`, opacity: 0 },
      { transform: `scale(${(r.width * 1.4) / size})`, opacity: 1, offset: 0.35 },
      { transform: 'scale(1)', opacity: 1 },
    ], { duration: 1100 / speed, delay: 260 / speed, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    return a.finished.catch(() => {});
  }
  /* after the ride has started behind it, the light clears */
  function clearPortal() {
    const portal = document.getElementById('portal');
    if (!portal || !portal.classList.contains('on')) return;
    const a = portal.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700 / (G.SPEED || 1), easing: 'ease-out', fill: 'forwards' });
    a.finished.catch(() => {}).then(() => { portal.getAnimations().forEach((x) => x.cancel()); portal.classList.remove('on'); });
  }

  G.calendar = { init, show, hide, throughDoor, clearPortal, visible: () => !!el && !el.hidden };
})(window);
