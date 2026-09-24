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
   Time first, place second. Slots are real: assets/data/availability.json is a
   snapshot of the Microsoft Bookings calendars behind lumas.de/booking/galerie/,
   so "available now" means the gallery calendar is genuinely open.
   A gallery slot hands off to that gallery's real booking form. A video slot
   opens a REQUEST, because Bookings has no video service configured yet.     */
(function () {
  const root = document.querySelector('[data-booker]');
  if (!root) return;

  const results = root.querySelector('[data-results]');
  const status  = root.querySelector('[data-status]');
  const meta    = root.querySelector('[data-meta]');
  const citySel = root.querySelector('[data-city]');
  const fromSel = root.querySelector('[data-from]');
  const dateInp = root.querySelector('[data-when-date]');
  const chips   = [...root.querySelectorAll('[data-when]')];
  const modes   = [...root.querySelectorAll('[data-mode-btn]')];

  let data = null;
  let mode = 'gallery';
  let when = 'now';
  let pickedDate = '';

  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const mins = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

  // The galleries all sit in Europe/Berlin, so "now" is that clock, not the
  // viewer's. A collector in New York asking for "today" means the gallery's day.
  const berlinNow = () => {
    const f = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date()).reduce((a, p) => (a[p.type] = p.value, a), {});
    return { date: `${f.year}-${f.month}-${f.day}`, minutes: Number(f.hour) * 60 + Number(f.minute) };
  };

  for (let h = 8; h <= 20; h++) {
    for (const m of ['00', '30']) {
      const v = `${pad(h)}:${m}`;
      fromSel.insertAdjacentHTML('beforeend', `<option value="${v}">${v}</option>`);
    }
  }

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

  function render() {
    if (!data) return;
    const day = targetDate();
    const from = floor();
    const city = citySel.value;
    const rows = [];

    Object.entries(data.galleries).forEach(([slug, g]) => {
      if (city && slug !== city) return;
      const slots = (g.days[day] || []).filter((t) => mins(t) >= from);
      if (slots.length) rows.push({ slug, g, slots });
    });
    rows.sort((a, b) => mins(a.slots[0]) - mins(b.slots[0]) || a.g.city.localeCompare(b.g.city));

    const label = when === 'now' ? 'still free today'
      : when === 'tomorrow' ? 'free tomorrow'
      : when === 'today' ? 'free today'
      : `free on ${new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`;

    if (!rows.length) {
      status.textContent = city
        ? 'Nothing left in that gallery for the time you picked. Try another day, or clear the gallery filter.'
        : 'Nothing left for the time you picked. Try another day.';
      results.innerHTML = '';
      meta.textContent = '';
      return;
    }

    const total = rows.reduce((n, r) => n + r.slots.length, 0);
    status.textContent = `${total} ${total === 1 ? 'appointment' : 'appointments'} ${label}, across ${rows.length} ${rows.length === 1 ? 'gallery' : 'galleries'}.`;

    results.innerHTML = rows.map(({ slug, g, slots }) => {
      const show = slots.slice(0, 8);
      const rest = slots.length - show.length;
      const chipsHtml = show.map((t) => (
        mode === 'gallery'
          ? `<a class="bk-slot" href="${g.bookingUrl}" target="_blank" rel="noopener"
                data-goal="advisor_booking_click" data-advisor="${slug}" data-slot="${day} ${t}">${t}</a>`
          : `<button class="bk-slot" type="button" data-video-slot data-city="${g.city}"
                data-slot="${day} ${t}" data-goal="video_request_open">${t}</button>`
      )).join('');
      return `<div class="bk-row">
        <div>
          <p class="bk-row__city">${g.city}</p>
          <p class="caption bk-row__addr">${g.address}</p>
        </div>
        <div class="bk-row__slots">${chipsHtml}${rest > 0 ? `<a class="bk-slot bk-slot--more" href="${g.bookingUrl}" target="_blank" rel="noopener" data-goal="advisor_booking_click" data-advisor="${slug}">+${rest} more</a>` : ''}</div>
      </div>`;
    }).join('');

    meta.innerHTML = mode === 'gallery'
      ? `Times are the galleries’ own booking calendars, in Central European Time. Picking one opens that gallery’s booking form.`
      : `Times are the consultants’ real gallery calendars, in Central European Time.`;

    const note = root.querySelector('.bk-note');
    if (note) note.remove();
    if (mode === 'video') {
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
  fromSel.addEventListener('change', () => { if (when === 'now') setWhen('today'); else render(); });
  citySel.addEventListener('change', render);
  modes.forEach((b) => b.addEventListener('click', () => {
    mode = b.dataset.modeBtn;
    modes.forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    track('booking_mode_switch', { mode });
    render();
  }));

  // Hero "Book a video call" lands on the video tab, not just the anchor.
  document.querySelectorAll('[data-mode="video"]').forEach((a) => a.addEventListener('click', () => {
    const btn = root.querySelector('[data-mode-btn="video"]');
    if (btn) btn.click();
  }));

  // A video slot is a request, so it confirms in place rather than handing off.
  results.addEventListener('click', (e) => {
    const slot = e.target.closest('[data-video-slot]');
    if (!slot) return;
    const row = slot.closest('.bk-row');
    track('video_request_open', { slot: slot.dataset.slot, city: slot.dataset.city });
    root.querySelectorAll('.bk-req').forEach((n) => n.remove());
    root.querySelectorAll('.bk-slot[aria-pressed="true"]').forEach((n) => n.removeAttribute('aria-pressed'));
    slot.setAttribute('aria-pressed', 'true');
    const [day, time] = slot.dataset.slot.split(' ');
    const nice = new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    row.insertAdjacentHTML('beforeend', `
      <form class="bk-req" data-req>
        <p class="bk-req__head">Video call · ${nice} at ${time} CET · with the ${slot.dataset.city} gallery</p>
        <div class="bk-req__fields">
          <label class="visually-hidden" for="bk-req-name">Your name</label>
          <input id="bk-req-name" name="name" type="text" placeholder="Your name" required autocomplete="name">
          <label class="visually-hidden" for="bk-req-mail">Your email</label>
          <input id="bk-req-mail" name="email" type="email" placeholder="Your email" required autocomplete="email">
          <button class="btn btn--primary" type="submit">Request this time</button>
        </div>
        <p class="caption txt-secondary bk-req__note">We confirm by email, usually within the hour. Nothing is charged.</p>
      </form>`);
    row.querySelector('#bk-req-name').focus();
  });

  results.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-req]');
    if (!form) return;
    e.preventDefault();
    track('video_request_submit', { slot: form.closest('.bk-row').querySelector('[aria-pressed="true"]')?.dataset.slot });
    form.innerHTML = '<p class="bk-req__head">Requested. We will confirm by email, usually within the hour.</p>';
  });

  fetch('assets/data/availability.json')
    .then((r) => r.json())
    .then((json) => {
      data = json;
      Object.entries(data.galleries)
        .sort((a, b) => a[1].city.localeCompare(b[1].city))
        .forEach(([slug, g]) => citySel.insertAdjacentHTML('beforeend', `<option value="${slug}">${g.city}</option>`));
      const now = berlinNow();
      dateInp.min = now.date;
      fromSel.value = `${pad(Math.min(20, Math.max(8, Math.ceil(now.minutes / 60))))}:00`;
      render();
    })
    .catch(() => {
      status.textContent = 'Live times are not loading. Every gallery’s booking form is still one click away below.';
    });
})();
