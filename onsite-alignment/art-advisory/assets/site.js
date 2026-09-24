/* LUMAS Advisory prototype — shared behaviour (rebuilt 2026-08-03)
   Event stubs map 1:1 to GA4/ABlyft goals; console-only in prototype mode. */
(function () {
  'use strict';

  // ── Event stub layer ──────────────────────────────────
  function track(event, params) {
    (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: event }, params || {}));
    if (console && console.info) console.info('[track]', event, params || {});
  }
  window.track = track;

  // ── ?v= variant switch (control | v1 | v2 …) ───────────
  var variant = new URLSearchParams(location.search).get('v') || 'control';
  document.documentElement.setAttribute('data-variant', variant);

  document.addEventListener('DOMContentLoaded', function () {
    // Goal / CTA tracking
    document.querySelectorAll('[data-goal]').forEach(function (el) {
      el.addEventListener('click', function () {
        track(el.getAttribute('data-goal'), {
          cta: el.getAttribute('data-cta') || null,
          advisor: el.getAttribute('data-advisor') || null,
          variant: variant
        });
      });
    });

    // ── Carousels ────────────────────────────────────────
    document.querySelectorAll('[data-carousel]').forEach(function (root) {
      var track_ = root.querySelector('.carousel__track');
      var prev = root.querySelector('.carousel__btn--prev');
      var next = root.querySelector('.carousel__btn--next');
      var count = root.querySelector('[data-count]');
      var dots = root.querySelector('[data-dots]');
      if (!track_) return;
      var slides = Array.prototype.slice.call(track_.querySelectorAll('.slide'));

      // Build dot pagination when a [data-dots] container is present
      var dotEls = [];
      if (dots) {
        slides.forEach(function (_, i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'carousel__dot';
          b.setAttribute('aria-label', 'Go to image ' + (i + 1));
          b.addEventListener('click', function () {
            track_.scrollTo({ left: step() * i, behavior: 'smooth' });
            track('carousel_dot', { id: root.getAttribute('data-carousel'), index: i });
          });
          dots.appendChild(b);
          dotEls.push(b);
        });
      }

      function step() {
        var s = slides[0];
        if (!s) return track_.clientWidth * 0.8;
        var gap = parseFloat(getComputedStyle(track_).columnGap || getComputedStyle(track_).gap || '24') || 24;
        return s.getBoundingClientRect().width + gap;
      }
      function currentIndex() {
        return Math.round(track_.scrollLeft / step());
      }
      function update() {
        var i = currentIndex();
        var atEnd = track_.scrollLeft + track_.clientWidth >= track_.scrollWidth - 4;
        if (prev) prev.disabled = i <= 0;
        if (next) next.disabled = atEnd;
        if (count) count.textContent = String(Math.min(i + 1, slides.length)).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
        if (dotEls.length) dotEls.forEach(function (d, di) { d.setAttribute('aria-current', di === i ? 'true' : 'false'); });
      }
      if (prev) prev.addEventListener('click', function () { track_.scrollBy({ left: -step(), behavior: 'smooth' }); track('carousel_prev', { id: root.getAttribute('data-carousel') }); });
      if (next) next.addEventListener('click', function () { track_.scrollBy({ left: step(), behavior: 'smooth' }); track('carousel_next', { id: root.getAttribute('data-carousel') }); });
      track_.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
      window.addEventListener('resize', update);
      update();
    });

    // ── Enquiry modal ────────────────────────────────────
    var dlg = document.getElementById('enquiry');
    if (dlg) {
      var openModal = function (cta) {
        if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
        track('trade_enquiry_open', { cta: cta || null, variant: variant });
      };
      document.querySelectorAll('[data-open-enquiry]').forEach(function (b) {
        b.addEventListener('click', function () { openModal(b.getAttribute('data-cta')); });
      });
      dlg.querySelectorAll('[data-close-enquiry]').forEach(function (b) {
        b.addEventListener('click', function () { dlg.close(); });
      });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); }); // backdrop click
      var form = dlg.querySelector('[data-enquiry-form]');
      var success = dlg.querySelector('.modal__success');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!form.checkValidity()) { form.reportValidity(); return; }
          var type = form.querySelector('[name="type"]');
          track('trade_enquiry_submit', { variant: variant, type: type ? type.value : null });
          form.hidden = true;
          if (success) success.hidden = false;
        });
      }
      dlg.addEventListener('close', function () { // restore the form after a completed submission
        if (form && success && success.hidden === false) { form.reset(); form.hidden = false; success.hidden = true; }
      });
    }

    // ── Visualisation modal (advisory) ───────────────────
    var vis = document.getElementById('visualisation');
    if (vis) {
      document.querySelectorAll('[data-open-visualisation]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (typeof vis.showModal === 'function') vis.showModal(); else vis.setAttribute('open', '');
          track('visualisation_open', { cta: b.getAttribute('data-cta') || null, variant: variant });
        });
      });
      vis.querySelectorAll('[data-close-visualisation]').forEach(function (b) { b.addEventListener('click', function () { vis.close(); }); });
      vis.addEventListener('click', function (e) { if (e.target === vis) vis.close(); });
      var vform = vis.querySelector('[data-visualisation-form]');
      var vsucc = vis.querySelector('.modal__success');
      if (vform) {
        vform.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!vform.checkValidity()) { vform.reportValidity(); return; }
          track('visualisation_submit', { variant: variant });
          vform.hidden = true; if (vsucc) vsucc.hidden = false;
        });
      }
      vis.addEventListener('close', function () { if (vform && vsucc && vsucc.hidden === false) { vform.reset(); vform.hidden = false; vsucc.hidden = true; } });
    }

    // ── Before / after wall slider (visualisation demo) ──
    // The two plates are the same render with and without the artwork, so the
    // "before" layer is clipped rather than resized — nothing can drift.
    document.querySelectorAll('[data-ba]').forEach(function (root) {
      var before = root.querySelector('[data-ba-before]');
      var handle = root.querySelector('[data-ba-handle]');
      var range  = root.querySelector('[data-ba-range]');
      if (!before || !handle || !range) return;

      var reported = false;
      function paint(pct) {
        pct = Math.max(0, Math.min(100, pct));
        before.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
        handle.style.left = pct + '%';
      }
      function setFromPointer(clientX) {
        var r = root.getBoundingClientRect();
        var pct = ((clientX - r.left) / r.width) * 100;
        range.value = pct;
        paint(pct);
        if (!reported) { reported = true; track('visualisation_compare', { variant: variant }); }
      }

      range.addEventListener('input', function () {
        paint(parseFloat(range.value));
        if (!reported) { reported = true; track('visualisation_compare', { variant: variant }); }
      });
      root.addEventListener('pointerdown', function (e) { setFromPointer(e.clientX); });
      root.addEventListener('pointermove', function (e) { if (e.buttons === 1) setFromPointer(e.clientX); });

      paint(parseFloat(range.value));
    });

    // ── Reveal on scroll (reveal in-view immediately) ─────
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    var vh = window.innerHeight || document.documentElement.clientHeight;
    reveals.forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.95) el.classList.add('in');
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      reveals.forEach(function (el) { if (!el.classList.contains('in')) io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('in'); });
    }
  });
})();

/* ── Booker ────────────────────────────────────────────────────────────────
   One question — when — then the answer: which consultants are free.

   The earlier version asked for the format first, then printed a gallery ×
   time matrix and left the reader to find their own time in it. A visitor
   arrives wanting "now" or "four o'clock", not a particular gallery's diary,
   so the question is asked once and the result is a short list of people,
   each with the single soonest time they can actually see you.

   Slots are real: assets/data/availability.json is a snapshot of the Microsoft
   Bookings calendars behind lumas.de/booking/galerie/. That file is regenerated
   live and deliberately carries no staff names, so the consultant behind each
   gallery is mapped here instead.
   A gallery slot hands off to that gallery's real booking form. A video slot
   opens a REQUEST, because Bookings has no video service configured yet.     */
(function () {
  const root = document.querySelector('[data-booker]');
  if (!root) return;

  // Slug → the person, so the answer is a face and a name rather than a branch.
  // Keys match availability.json; portraits are the same files the carousel uses.
  const CONSULTANTS = {
    'berlin-mitte':  { name: 'Maike Hahn',                   portrait: 'assets/team/berlin.webp' },
    'berlin-kudamm': { name: 'Lioba Wachter',                portrait: 'assets/team/berlin-kudamm.webp' },
    'munich':        { name: 'Giselle Huber',                portrait: 'assets/team/munich.webp' },
    'hamburg':       { name: 'Nereisse De Lacoudraye Harter', portrait: 'assets/team/hamburg.webp' },
    'frankfurt':     { name: 'Lenka Heller-Salfer',          portrait: 'assets/team/frankfurt.webp' },
    'stuttgart':     { name: 'Alexander Rukatukl',           portrait: 'assets/team/stuttgart.webp' },
    'hannover':      { name: 'Claudia Brauckmann',           portrait: 'assets/team/hannover.webp' },
    'dortmund':      { name: 'Lisa Kipper',                  portrait: 'assets/team/dortmund.webp' },
    'mannheim':      { name: 'Larissa Thoma',                portrait: 'assets/team/mannheim.webp' },
    'vienna':        { name: 'Bastian Bernstetter',          portrait: 'assets/team/vienna.webp' },
    'zurich':        { name: 'Claudia Tvrdon',               portrait: 'assets/team/zurich.webp' }
  };

  const results = root.querySelector('[data-results]');
  const status  = root.querySelector('[data-status]');
  const meta    = root.querySelector('[data-meta]');
  const cityBtn  = root.querySelector('[data-city-btn]');
  const cityList = root.querySelector('[data-city-list]');
  const cityVal  = root.querySelector('#bk-city-value');
  const howBtns  = [...root.querySelectorAll('[data-how-btn]')];
  const fromSel = root.querySelector('[data-from]');
  const atWrap  = root.querySelector('[data-at-wrap]');
  const dateInp = root.querySelector('[data-when-date]');
  const chips   = [...root.querySelectorAll('[data-when]')];

  let data = null;
  let when = 'now';
  let pickedDate = '';
  let how = 'gallery';
  let city = '';

  const pad  = (n) => String(n).padStart(2, '0');
  const iso  = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const mins = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  const mode = () => how;

  // The galleries all sit in Europe/Berlin, so "now" is that clock, not the
  // viewer's. A collector in New York asking for "today" means the gallery's day.
  const berlinNow = () => {
    const f = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date()).reduce((a, p) => (a[p.type] = p.value, a), {});
    return { date: `${f.year}-${f.month}-${f.day}`, minutes: Number(f.hour) * 60 + Number(f.minute) };
  };

  // Slots land on the hour and the half hour, so the picker offers nothing that
  // could never match.
  for (let h = 8; h <= 20; h++) {
    for (const m of ['00', '30']) {
      const v = `${pad(h)}:${m}`;
      fromSel.insertAdjacentHTML('beforeend', `<option value="${v}">${v}</option>`);
    }
  }

  const dayName = (day) =>
    new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  function targetDate() {
    const now = berlinNow();
    if (when === 'today' || when === 'now') return now.date;
    if (when === 'tomorrow') {
      const d = new Date(`${now.date}T12:00:00`); d.setDate(d.getDate() + 1); return iso(d);
    }
    return pickedDate || now.date;
  }

  function floor() {
    const now = berlinNow();
    if (when === 'now') return now.minutes;               // only what is still ahead today
    if (targetDate() === now.date) return Math.max(mins(fromSel.value), now.minutes);
    return mins(fromSel.value);
  }

  // Everyone free on the chosen day at or after the chosen time, soonest first.
  function matches() {
    const day = targetDate();
    const from = floor();
    const out = [];
    Object.entries(data.galleries).forEach(([slug, g]) => {
      if (city && slug !== city) return;
      const slots = (g.days[day] || []).filter((t) => mins(t) >= from);
      if (slots.length) out.push({ slug, g, slots, person: CONSULTANTS[slug] });
    });
    out.sort((a, b) => mins(a.slots[0]) - mins(b.slots[0]) || a.g.city.localeCompare(b.g.city));
    return out;
  }

  // When the asked-for time has nothing, offer the nearest real opening rather
  // than a dead end. This is the whole point of asking for a time first.
  function nextOpening() {
    const fromDay = targetDate();
    const fromMin = floor();
    let best = null;
    Object.entries(data.galleries).forEach(([slug, g]) => {
      if (city && slug !== city) return;
      Object.keys(g.days).sort().forEach((day) => {
        if (day < fromDay) return;
        g.days[day].forEach((t) => {
          if (day === fromDay && mins(t) < fromMin) return;
          const key = `${day} ${t}`;
          if (!best || key < best.key) best = { key, day, time: t, slug, g, person: CONSULTANTS[slug] };
        });
      });
    });
    return best;
  }

  // One card, one action. The card itself is the link (gallery) or the button
  // (video), so there is nothing interactive nested inside it.
  function cardHtml(row) {
    const day = targetDate();
    const t = row.slots[0];
    const inner = `
      <img class="bk-card__face" src="${row.person.portrait}" width="40" height="40" alt="" loading="lazy">
      <span class="bk-card__id">
        <span class="bk-card__name">${row.person.name}</span>
        <span class="caption bk-card__where">${row.g.city}</span>
      </span>
      <span class="bk-card__time"><span class="visually-hidden">Book </span>${t}</span>`;
    return mode() === 'gallery'
      ? `<a class="bk-card" href="${row.g.bookingUrl}" target="_blank" rel="noopener"
            data-goal="advisor_booking_click" data-advisor="${row.slug}" data-slot="${day} ${t}">${inner}</a>`
      : `<button class="bk-card" type="button" data-video-slot data-city="${row.g.city}"
            data-advisor="${row.slug}" data-slot="${day} ${t}" data-goal="video_request_open">${inner}</button>`;
  }

  function render() {
    if (!data) return;
    atWrap.hidden = when === 'now';

    const day  = targetDate();
    const rows = matches();
    const now  = berlinNow();
    const whenWord = day === now.date ? 'today'
      : when === 'tomorrow' ? 'tomorrow'
      : `on ${new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`;

    results.innerHTML = '';
    root.querySelectorAll('.bk-empty, .bk-note').forEach((n) => n.remove());

    if (!rows.length) {
      const next = nextOpening();
      status.textContent = when === 'now'
        ? `Nobody is free for the rest of ${whenWord === 'today' ? 'today' : whenWord}.`
        : `Nobody is free from ${fromSel.value} ${whenWord}.`;
      meta.textContent = '';
      if (next) {
        results.insertAdjacentHTML('afterend', `
          <div class="bk-empty">
            <p class="bk-empty__lead">The next opening is <strong>${dayName(next.day)} at ${next.time}</strong>,
            with ${next.person.name} in ${next.g.city}.</p>
            <p class="bk-empty__act"><button class="btn btn--ghost" type="button"
               data-jump="${next.day}" data-jump-time="${next.time}">Show that time</button></p>
          </div>`);
      } else {
        results.insertAdjacentHTML('afterend',
          `<div class="bk-empty"><p class="bk-empty__lead">Nothing is open in the days we can see.
           Call the galleries on +49 30 3030 6969 and we will find you a time.</p></div>`);
      }
      return;
    }

    const soonest = rows[0].slots[0];
    const uniform = rows.every((r) => r.slots[0] === soonest);
    const who = `${rows.length} ${rows.length === 1 ? 'consultant' : 'consultants'}`;
    status.textContent = uniform
      ? `${who} can see you at ${soonest} ${whenWord}.`
      : `${who} ${rows.length === 1 ? 'is' : 'are'} free ${whenWord}, the soonest at ${soonest}.`;

    results.innerHTML = rows.map(cardHtml).join('');

    meta.innerHTML = mode() === 'gallery'
      ? `Times are the galleries’ own booking calendars, in Central European Time. Picking one opens that gallery’s booking form.`
      : `Times are the consultants’ real gallery calendars, in Central European Time.`;

    if (mode() === 'video') {
      meta.insertAdjacentHTML('afterend',
        `<p class="bk-note">A video call is booked as a request: we confirm by email, usually within the hour.
         <!-- FIXME (production): Bookings has one service per gallery, in-gallery only. Add a
              "Kunstberatung per Videocall" service and this becomes a direct booking like the other tab. --></p>`);
    }
  }

  function setWhen(v) {
    when = v;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.when === v)));
    render();
  }

  chips.forEach((c) => c.addEventListener('click', () => setWhen(c.dataset.when)));
  dateInp.addEventListener('change', () => {
    pickedDate = dateInp.value;
    when = 'date';
    chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
    render();
  });
  // Naming a time is itself an answer to "when", so it lifts "now" into "today".
  fromSel.addEventListener('change', () => { if (when === 'now') setWhen('today'); else render(); });
  function setHow(v) {
    how = v;
    howBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.howBtn === v)));
    track('booking_mode_switch', { mode: how });
    render();
  }
  howBtns.forEach((b) => b.addEventListener('click', () => setHow(b.dataset.howBtn)));

  /* ── City listbox ──────────────────────────────────────────────────────
     A native <select> draws its open list with the OS, so this is a real
     listbox: button + role="listbox" + roving focus on the options.        */
  const opts = () => [...cityList.querySelectorAll('[role="option"]')];

  function openList(focusSelected) {
    cityList.hidden = false;
    cityBtn.setAttribute('aria-expanded', 'true');
    const o = opts();
    (o.find((x) => x.getAttribute('aria-selected') === 'true') || o[0])?.focus();
    if (!focusSelected) o[0]?.focus();
  }
  function closeList(refocus) {
    cityList.hidden = true;
    cityBtn.setAttribute('aria-expanded', 'false');
    if (refocus) cityBtn.focus();
  }
  function chooseCity(opt) {
    city = opt.dataset.value;
    opts().forEach((o) => o.setAttribute('aria-selected', String(o === opt)));
    cityVal.textContent = opt.textContent;
    closeList(true);
    render();
  }

  cityBtn.addEventListener('click', () => (cityList.hidden ? openList(true) : closeList(true)));
  cityBtn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); openList(true);
    }
  });
  cityList.addEventListener('click', (e) => {
    const opt = e.target.closest('[role="option"]');
    if (opt) chooseCity(opt);
  });
  cityList.addEventListener('keydown', (e) => {
    const o = opts();
    const i = o.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); closeList(true); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); o[Math.min(i + 1, o.length - 1)]?.focus(); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); o[Math.max(i - 1, 0)]?.focus(); }
    else if (e.key === 'Home')      { e.preventDefault(); o[0]?.focus(); }
    else if (e.key === 'End')       { e.preventDefault(); o[o.length - 1]?.focus(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i > -1) chooseCity(o[i]); }
    else if (e.key === 'Tab') closeList(false);
  });
  document.addEventListener('click', (e) => {
    if (!cityList.hidden && !e.target.closest('[data-city]')) closeList(false);
  });

  // Hero "Book a video call" preselects the format without changing the question.
  document.querySelectorAll('[data-mode="video"]').forEach((a) => a.addEventListener('click', () => {
    setHow('video');
  }));

  root.addEventListener('click', (e) => {
    // The empty state's offer of the nearest real opening.
    const jump = e.target.closest('[data-jump]');
    if (!jump) return;
    const nowDate = berlinNow().date;
    pickedDate = jump.dataset.jump;
    dateInp.value = pickedDate;
    fromSel.value = jump.dataset.jumpTime;
    when = pickedDate === nowDate ? 'today' : 'date';
    chips.forEach((c) => c.setAttribute('aria-pressed', String(when === 'today' && c.dataset.when === 'today')));
    track('booking_next_opening', { slot: `${jump.dataset.jump} ${jump.dataset.jumpTime}` });
    render();
  });

  // A video slot is a request, so it confirms in place rather than handing off.
  results.addEventListener('click', (e) => {
    const slot = e.target.closest('[data-video-slot]');
    if (!slot) return;
    const card = slot;
    track('video_request_open', { slot: slot.dataset.slot, city: slot.dataset.city });
    root.querySelectorAll('.bk-req').forEach((n) => n.remove());
    root.querySelectorAll('.bk-card[aria-pressed="true"]').forEach((n) => n.removeAttribute('aria-pressed'));
    slot.setAttribute('aria-pressed', 'true');
    const [day, time] = slot.dataset.slot.split(' ');
    const who = CONSULTANTS[slot.dataset.advisor];
    card.insertAdjacentHTML('afterend', `
      <form class="bk-req" data-req>
        <p class="bk-req__head">Video call · ${dayName(day)} at ${time} CET · with ${who ? who.name : `the ${slot.dataset.city} gallery`}</p>
        <div class="bk-req__fields">
          <label class="visually-hidden" for="bk-req-name">Your name</label>
          <input id="bk-req-name" name="name" type="text" placeholder="Your name" required autocomplete="name">
          <label class="visually-hidden" for="bk-req-mail">Your email</label>
          <input id="bk-req-mail" name="email" type="email" placeholder="Your email" required autocomplete="email">
          <button class="btn btn--primary" type="submit">Request this time</button>
        </div>
        <p class="caption txt-secondary bk-req__note">We confirm by email, usually within the hour. Nothing is charged.</p>
      </form>`);
    results.querySelector('#bk-req-name').focus();
  });

  results.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-req]');
    if (!form) return;
    e.preventDefault();
    track('video_request_submit', { slot: results.querySelector('.bk-card[aria-pressed="true"]')?.dataset.slot });
    form.innerHTML = '<p class="bk-req__head">Requested. We will confirm by email, usually within the hour.</p>';
  });

  fetch('assets/data/availability.json')
    .then((r) => r.json())
    .then((json) => {
      data = json;
      cityList.insertAdjacentHTML('beforeend',
        `<li class="lmsel__opt" role="option" tabindex="-1" data-value="" aria-selected="true">Any city</li>`);
      Object.entries(data.galleries)
        .sort((a, b) => a[1].city.localeCompare(b[1].city))
        .forEach(([slug, g]) => cityList.insertAdjacentHTML('beforeend',
          `<li class="lmsel__opt" role="option" tabindex="-1" data-value="${slug}">${g.city}</li>`));
      const now = berlinNow();
      dateInp.min = now.date;
      fromSel.value = `${pad(Math.min(20, Math.max(8, Math.ceil(now.minutes / 60))))}:00`;
      render();
    })
    .catch(() => {
      status.textContent = 'Live times are not loading. Every gallery’s booking form is still one click away below.';
    });
})();
