/* The advent calendar's pure logic: Berlin dates, door states, prices, schedule checks, the 24th's wall, the reminder.
   Runs in the browser (window.GAL.advent) and in Node (module.exports) so it can be unit-tested.
   Every calendar date is in December 2026, which is CET (UTC+01:00) throughout, so the offset is written literally. */
(function (root) {
  'use strict';

  const TZ = '+01:00';
  const GESTURES = ['snow', 'frost', 'paper', 'lanterns', 'ribbon', 'candle'];
  const WORLDS = ['birch', 'lake', 'mountain', 'village', 'shore'];
  const TYPES = ['work', 'giftcard', 'drop', 'finale'];
  const SUNDAYS = [6, 13, 20];
  const pad = (n) => String(n).padStart(2, '0');
  /* the world a day actually rides: the 24th rides the village home */
  const rideWorld = (e) => (e.type === 'finale' ? 'village' : e.world);

  const berlinFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });
  const berlinIso = (ms) => berlinFmt.format(new Date(ms));

  const opensAtMs = (entry) => Date.parse(`${entry.date}T${entry.opensAt || '00:00'}:00${TZ}`);
  /* the drop opens to calendar visitors before its official start (early access) */
  const earlyAccess = (entry, nowMs) => !!entry.earlyUntil && nowMs < Date.parse(`${entry.earlyUntil}:00${TZ}`);
  const endsAtMs = (entry) => (entry.endsAt ? Date.parse(`${entry.endsAt}:00${TZ}`) : Date.parse(`${entry.date}T23:59:59.999${TZ}`));
  const endOfDayMs = (entry) => Date.parse(`${entry.date}T23:59:59.999${TZ}`);

  /* locked: not yet; open: can be opened now (today's door, or a drop still running); opened: opened on this device;
     missed: its time passed unopened */
  function doorState(entry, nowMs, opened) {
    if (opened.has(entry.day)) return 'opened';
    if (nowMs < opensAtMs(entry)) return 'locked';
    if (nowMs <= (entry.type === 'drop' ? endsAtMs(entry) : endOfDayMs(entry))) return 'open';
    return 'missed';
  }
  const offerLive = (entry, nowMs) => nowMs >= opensAtMs(entry) && nowMs <= endsAtMs(entry);

  function todayEntry(sched, nowMs) {
    const iso = berlinIso(nowMs);
    const e = sched.find((x) => x.date === iso);
    return e && nowMs >= opensAtMs(e) ? e : null;
  }
  const nextEntry = (sched, entry) => sched.find((x) => x.day === entry.day + 1) || null;

  const offerPrice = (ab, pct) => Math.round(ab * (100 - pct)) / 100;
  function fmtPrice(n, lang) {
    const whole = Number.isInteger(n);
    const s = n.toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 });
    return `€ ${s}`;
  }

  function validateSchedule(sched) {
    const errs = [];
    if (!Array.isArray(sched) || sched.length !== 24) return ['the schedule needs 24 days'];
    sched.forEach((e, i) => {
      const day = i + 1;
      const at = `day ${day}`;
      if (e.day !== day) errs.push(`${at}: day is ${e.day}`);
      if (e.date !== `2026-12-${pad(day)}`) errs.push(`${at}: date is ${e.date}`);
      if (!TYPES.includes(e.type)) errs.push(`${at}: unknown type ${e.type}`);
      if (e.type !== 'finale' && !GESTURES.includes(e.gesture)) errs.push(`${at}: unknown gesture ${e.gesture}`);
      if (!WORLDS.includes(e.world)) errs.push(`${at}: unknown world ${e.world}`);
      if (i > 0 && e.gesture === sched[i - 1].gesture) errs.push(`${at}: same gesture as day ${day - 1}`);
      if (i > 0 && rideWorld(e) === rideWorld(sched[i - 1])) errs.push(`${at}: same world as day ${day - 1}`);
      if (SUNDAYS.includes(day) && e.gesture !== 'candle') errs.push(`${at}: advent sunday needs the candle`);
      if (e.type === 'work' || e.type === 'drop') {
        for (const k of ['code', 'sku', 'path', 'ab', 'r', 'title', 'artist']) if (!e.work || e.work[k] == null) errs.push(`${at}: ${e.type} needs ${k}`);
        if (e.work && typeof e.work.signed !== 'boolean') errs.push(`${at}: ${e.type} needs signed`);
        if (e.work && (!e.work.story || typeof e.work.story !== 'object')) errs.push(`${at}: ${e.type} needs story`);
      }
      if (e.type === 'work' && !(e.offerPct > 0)) errs.push(`${at}: work needs offerPct`);
      if (e.type === 'drop' && !e.endsAt) errs.push(`${at}: drop needs endsAt`);
      if (e.type === 'giftcard') for (const k of ['image', 'r']) if (e[k] == null) errs.push(`${at}: giftcard needs ${k}`);
    });
    if (sched[23] && sched[23].type !== 'finale') errs.push('day 24: must be the finale');
    return errs;
  }

  /* the 24th: the five opened works with the best revenue rank; too few, and the schedule's best fill the wall.
     A drop that has ended is no longer for sale, so it never hangs. */
  function wallPicks(sched, openedDays, max = 5, nowMs = null) {
    const art = (e) => (e.type === 'work' || e.type === 'drop') && e.work && !(e.type === 'drop' && nowMs !== null && !offerLive(e, nowMs));
    const byRank = (a, b) => (a.work.revenueRank ?? 999) - (b.work.revenueRank ?? 999);
    const opened = sched.filter((e) => art(e) && openedDays.includes(e.day)).sort(byRank).slice(0, max);
    const fill = sched.filter((e) => art(e) && e.day < 24 && !opened.includes(e)).sort(byRank);
    return opened.concat(fill).slice(0, max);
  }

  function icsFor(entry, lang, pageUrl) {
    const [y, m, d] = entry.date.split('-');
    const open = entry.opensAt || '00:00';
    const time = open > '09:00' ? open : '09:00';
    const [hh, mm] = time.split(':');
    const end = `${pad(+hh + (+mm + 15 >= 60 ? 1 : 0))}${pad((+mm + 15) % 60)}`;
    const summary = lang === 'de' ? `LUMAS Adventskalender: Tür ${entry.day}` : `LUMAS advent calendar: door ${entry.day}`;
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LUMAS//Adventskalender//DE', 'BEGIN:VEVENT',
      `UID:lumas-advent-2026-${entry.day}@lumas.de`, `DTSTAMP:20261116T000000Z`,
      `DTSTART;TZID=Europe/Berlin:${y}${m}${d}T${hh}${mm}00`, `DTEND;TZID=Europe/Berlin:${y}${m}${d}T${end}00`,
      `SUMMARY:${summary}`, `URL:${pageUrl}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${summary}`, 'TRIGGER:PT0M', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR', '',
    ].join('\r\n');
  }

  const progressKey = (demo) => (demo ? 'lumasAdvent.demo.v1' : 'lumasAdvent.v1');
  function loadOpened(storage, demo) {
    try {
      const v = JSON.parse(storage.getItem(progressKey(demo)) || '[]');
      return new Set(Array.isArray(v) ? v.filter(Number.isInteger) : []);
    } catch (e) { return new Set(); }
  }
  function saveOpened(storage, demo, day) {
    try {
      const s = loadOpened(storage, demo);
      s.add(day);
      storage.setItem(progressKey(demo), JSON.stringify([...s].sort((a, b) => a - b)));
    } catch (e) { /* storage blocked: progress is simply not kept */ }
  }

  function simulatedNow(search, sched, demoAllowed) {
    if (!demoAllowed) return null;
    const q = new URLSearchParams(search);
    if (q.get('now')) { const t = Date.parse(`${q.get('now')}:00${TZ}`); return Number.isNaN(t) ? null : t; }
    if (q.get('day')) { const e = sched.find((x) => x.day === +q.get('day')); return e ? opensAtMs(e) + 60000 : null; }
    return null;
  }

  /* lumas.de serves English under /en/ with the same path for a work; other pages have their own English path, so
     they come as { de, en } */
  const localUrl = (base, path, lang) => `${base}${lang === 'en' ? '/en' : ''}${path}`;
  const forLang = (v, lang) => (v && typeof v === 'object' ? v[lang] || v.de : v);

  const api = {
    berlinIso, opensAtMs, endsAtMs, doorState, offerLive, todayEntry, nextEntry, offerPrice, fmtPrice,
    validateSchedule, wallPicks, icsFor, progressKey, loadOpened, saveOpened, simulatedNow, rideWorld, GESTURES, WORLDS,
    localUrl, forLang, earlyAccess,
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.GAL = root.GAL || {}).advent = api;
})(typeof window !== 'undefined' ? window : globalThis);
