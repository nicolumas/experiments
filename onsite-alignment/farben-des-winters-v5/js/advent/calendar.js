/* The calendar: the living room in the evening with today's door, large, on the wall; all 24 doors open behind a
   link. Opened doors show their work bare; today's door glows and starts the ride; missed doors stay closed until
   tapped; upcoming doors are greyed. It re-reads the time whenever the tab comes back, so a page left
   open over midnight shows the new day. GAL.calendar.init(deps) once, then show() / hide(). */
(function (root) {
  'use strict';

  const G = (root.GAL = root.GAL || {});
  const SUNDAYS = [6, 13, 20];
  let D = null;
  let el = null;
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

  /* deps: { sched, t, track, lang(), now(), opened(), busy(), plate(), wallRect(), onRide(entry, door), onCard(entry, from),
     onDirect(entry), onMissed(entry), demo, search } */
  let reopenSheet = false;
  function init(deps) {
    D = deps;
    el = document.getElementById('calendar');
    document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'hidden' && el && !el.hidden) show(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && el && !el.hidden) closeSheet(); });
  }

  function title(today, state, now) {
    const A = G.advent;
    if (!today) {
      /* today's door may open later in the day (the drop opens at 05:00) */
      const later = laterToday(now);
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
  const laterToday = (now) => D.sched.find((e) => e.date === G.advent.berlinIso(now) && now < G.advent.opensAtMs(e));
  const workSrc = (e) => (e.work ? `assets/art/${e.work.code}.webp` : e.image);

  /* the closed leaf of a door that can be opened, with its number; today's also gives off a few sparks */
  const leaf = (e, sparks) => [h('span', { class: 'leaf' }, h('span', { class: 'n' }, String(e.day))),
    ...(sparks ? [0, 1, 2, 3].map((i) => h('i', { class: 'spark', style: `--s:${i}` })) : [])];

  /* one door of the overview: opened shows its work; today and an open drop glow; missed stays closed but opens on a
     tap; upcoming is greyed */
  function door(e, state, today) {
    const label = D.t('door', { n: e.day });
    const cls = `door is-${state}${SUNDAYS.includes(e.day) ? ' is-sunday' : ''}${e.day === 24 ? ' is-24' : ''}`;
    const isToday = today && today.day === e.day;
    /* the 24th is the living room, never a card: on the day, its door always leads back into it */
    if (e.type === 'finale') {
      const live = isToday && (state === 'open' || state === 'opened');
      return live ? h('button', { class: cls, type: 'button', 'data-day': e.day, 'data-state': state, 'aria-label': label, onclick: () => { closeSheet(); D.onRide(e); } }, h('span', { class: 'n' }, String(e.day)))
        : h('div', { class: cls, 'data-day': e.day, 'data-state': state, 'aria-label': label, role: 'img' }, h('span', { class: 'n' }, String(e.day)));
    }
    if (state === 'opened') {
      const src = workSrc(e);
      const inner = src ? h('img', { src, alt: '', loading: 'lazy', draggable: 'false' }) : h('span', { class: 'n' }, String(e.day));
      return h('button', { class: cls, type: 'button', 'data-day': e.day, 'data-state': state, 'aria-label': `${label}${e.work ? `, ${e.work.title}` : ''}`, onclick: () => { reopenSheet = true; D.onCard(e, 'calendar'); } }, inner);
    }
    if (state === 'open') {
      const btn = h('button', { class: cls, type: 'button', 'data-day': e.day, 'data-state': state, 'aria-label': label }, leaf(e, isToday));
      btn.addEventListener('click', () => (isToday ? D.onRide(e, btn) : (reopenSheet = true, D.onDirect(e))));
      return btn;
    }
    if (state === 'missed') {
      const btn = h('button', { class: cls, type: 'button', 'data-day': e.day, 'data-state': state, 'aria-label': label }, leaf(e, false));
      btn.addEventListener('click', () => {
        if (btn.classList.contains('opening')) return;
        btn.classList.add('opening');
        reopenSheet = true;
        setTimeout(() => D.onMissed(e), RM() ? 0 : 420 / (G.SPEED || 1));
      });
      return btn;
    }
    return h('div', { class: cls, 'data-day': e.day, 'data-state': state, 'aria-label': label, 'aria-disabled': 'true', role: 'img' }, h('span', { class: 'n' }, String(e.day)));
  }

  /* today's door, large, on the living-room wall: closed and glowing, or showing its work once opened */
  function bigDoor(today, state, now) {
    const lockedOn = today ? null : laterToday(now) || (now < G.advent.opensAtMs(D.sched[0]) ? D.sched[0] : null);
    if (lockedOn) return h('div', { class: 'door today-door is-locked', 'data-day': lockedOn.day, 'data-state': 'locked', role: 'img', 'aria-label': D.t('door', { n: lockedOn.day }) }, h('span', { class: 'n' }, String(lockedOn.day)));
    if (!today) return null;
    const label = D.t('door', { n: today.day });
    if (state === 'open' || today.type === 'finale') {
      const btn = h('button', { class: `door today-door is-${state === 'open' ? 'open' : 'opened'}${today.type === 'finale' ? ' is-24' : ''}`, type: 'button', 'data-day': today.day, 'data-state': state, 'aria-label': label }, leaf(today, true), h('i', { class: 'knob' }));
      btn.addEventListener('click', () => D.onRide(today, btn));
      return btn;
    }
    const src = workSrc(today);
    return h('button', { class: 'door today-door is-opened', type: 'button', 'data-day': today.day, 'data-state': state, 'aria-label': `${label}${today.work ? `, ${today.work.title}` : ''}`, onclick: () => D.onCard(today, 'calendar') },
      src ? h('img', { src, alt: '', draggable: 'false' }) : h('span', { class: 'n' }, String(today.day)));
  }

  function show() {
    const A = G.advent;
    const now = D.now();
    const opened = D.opened();
    const today = A.todayEntry(D.sched, now);
    const state = today ? A.doorState(today, now, opened) : null;
    const date = new Intl.DateTimeFormat(D.lang() === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', timeZone: 'Europe/Berlin' }).format(now);
    const big = bigDoor(today, state, now);
    const direct = state === 'open' && today.type !== 'finale' && !D.busy();
    const stage = h('div', { class: `cal-stage${big ? '' : ' no-door'}` },
      big,
      h('div', { class: 'cal-label' },
        h('p', { class: 'eyebrow' }, D.t('calEyebrow', { date })),
        h('p', { class: 'cal-title' }, title(today, state, now)),
        h('p', { class: 'cal-links' },
          h('button', { class: 'link cal-all', type: 'button', onclick: openSheet }, D.t('allDoors')),
          direct ? h('button', { class: 'link cal-direct', type: 'button', onclick: () => D.onDirect(today) }, D.t('direct')) : null)));
    /* the stage sits on the living-room wall */
    const w = D.wallRect ? D.wallRect() : null;
    if (w) {
      const top = Math.max(w.y, 64);
      stage.style.cssText = `left:${Math.max(w.x, 0)}px;top:${top}px;width:${Math.min(w.x + w.w, innerWidth) - Math.max(w.x, 0)}px;--wall-h:${w.y + w.h - top}px`;
    }
    const sheet = h('div', { class: 'cal-sheet', hidden: true, role: 'dialog', 'aria-modal': 'true', 'aria-label': D.t('allDoorsTitle') });
    const picker = D.demo && new URLSearchParams(D.search).has('demo') ? demoBar(now) : null;
    /* the room lives: warm light breathes round today's door */
    const glow = h('div', { class: 'cal-glow' });
    el.replaceChildren(h('img', { class: 'cal-plate', src: D.plate(), alt: '' }), stage, sheet, picker);
    if (big) big.prepend(glow);
    el.hidden = false;
    if (reopenSheet) { reopenSheet = false; openSheet(); }
    D.track('gal_calendar', { gal_today: state === 'open' || state === 'opened' ? today.day : null, gal_opened: opened.size });
  }

  /* the demo's day switcher (demo builds only): a day back, a day on, and starting again with nothing opened */
  function demoBar(now) {
    const lang = D.lang() === 'de' ? '&lang=de' : '';
    const day = Math.min(24, Math.max(1, +G.advent.berlinIso(now).slice(8, 10) || 1));
    const go = (n) => `?day=${n}&demo${lang}`;
    const date = new Intl.DateTimeFormat(D.lang() === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', timeZone: 'Europe/Berlin' }).format(now);
    const reset = () => {
      try { localStorage.removeItem('lumasAdvent.demo.v1'); localStorage.removeItem('lumasAdvent.demo.notify'); } catch (e) { /* nothing stored */ }
      location.href = go(1);
    };
    return h('nav', { class: 'cal-demo', 'aria-label': 'Demo' },
      h('span', { class: 'cal-demo-tag' }, 'Demo'),
      day > 1 ? h('a', { class: 'cal-demo-prev', href: go(day - 1), 'aria-label': D.t('demoPrev') }, '←') : h('span', { class: 'cal-demo-prev', 'aria-hidden': 'true' }, '←'),
      h('span', { class: 'cal-demo-day' }, date),
      day < 24 ? h('a', { class: 'cal-demo-next', href: go(day + 1), 'aria-label': D.t('demoNext') }, '→') : h('span', { class: 'cal-demo-next', 'aria-hidden': 'true' }, '→'),
      h('button', { class: 'cal-demo-reset', type: 'button', onclick: reset }, D.t('demoReset')));
  }

  /* all 24 doors, behind a link */
  function openSheet() {
    const sheet = el && el.querySelector('.cal-sheet');
    if (!sheet) return;
    const A = G.advent;
    const now = D.now();
    const opened = D.opened();
    const today = A.todayEntry(D.sched, now);
    sheet.replaceChildren(h('div', { class: 'cal-sheet-panel' },
      h('div', { class: 'cal-sheet-head' },
        h('p', { class: 'cal-sheet-title' }, D.t('allDoorsTitle')),
        h('button', { class: 'link cal-sheet-close', type: 'button', onclick: closeSheet }, D.t('close'))),
      h('div', { class: 'cal-grid' }, D.sched.map((e, i) => { const d = door(e, A.doorState(e, now, opened), today); d.style.setProperty('--i', i); return d; }))));
    sheet.hidden = false;
    D.track('gal_calendar_all', { gal_opened: opened.size });
    const close = sheet.querySelector('.cal-sheet-close');
    if (close) close.focus({ preventScroll: true });
  }
  function closeSheet() {
    const sheet = el && el.querySelector('.cal-sheet');
    if (sheet) sheet.hidden = true;
  }
  function hide() { if (el) el.hidden = true; }

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
