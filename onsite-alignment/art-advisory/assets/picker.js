/* LUMAS Advisory · version B picker ────────────────────────────────────────
   Two routes to the same booking, because the two people arriving here want
   opposite things:

     · "soonest"  I do not mind where, just book me in. Answered from the
                  availability snapshot, so the button names a real time rather
                  than promising one.
     · "choose"   I want a particular gallery. Answered with a map, because a
                  list of eighteen cities is a reading task and a map is a
                  glance.

   Microsoft Bookings still owns the calendar: every route ends by handing off
   to it, and nothing here is a confirmed appointment.                        */
(function () {
  'use strict';

  var root = document.querySelector('[data-picker]');
  if (!root) return;

  var track = window.track || function () {};

  var routeBtns = [].slice.call(root.querySelectorAll('[data-route]'));
  var modeBtns  = [].slice.call(root.querySelectorAll('[data-how]'));
  var soonPane  = root.querySelector('[data-pane="soonest"]');
  var mapPane   = root.querySelector('[data-pane="choose"]');
  var soonBody  = root.querySelector('[data-soonest]');
  var mapHost   = root.querySelector('[data-map]');
  var offHost   = root.querySelector('[data-offmap]');
  var detail    = root.querySelector('[data-detail]');
  var meta      = root.querySelector('[data-meta]');

  var data = null;      // galleries.json
  var avail = null;     // availability.json, for the soonest route only
  var route = 'soonest';
  var how = 'gallery';
  var selected = null;

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function byslug(slug) {
    return data.galleries.filter(function (g) { return g.slug === slug; })[0];
  }

  /* The galleries all sit in Europe/Berlin, so "now" is that clock and not the
     viewer's: someone in New York asking for the soonest slot means the
     gallery's next opening, not theirs. */
  function berlinNow() {
    var f = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date()).reduce(function (a, p) { a[p.type] = p.value; return a; }, {});
    return { date: f.year + '-' + f.month + '-' + f.day,
             minutes: Number(f.hour) * 60 + Number(f.minute) };
  }

  function mins(hhmm) { var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; }

  function niceDay(iso) {
    var now = berlinNow();
    if (iso === now.date) return 'today';
    var t = new Date(now.date + 'T12:00:00'); t.setDate(t.getDate() + 1);
    var tomorrow = t.toISOString().slice(0, 10);
    if (iso === tomorrow) return 'tomorrow';
    return new Date(iso + 'T12:00:00')
      .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  /* Earliest free slot across every gallery that has a calendar. */
  function soonest() {
    if (!avail) return null;
    var now = berlinNow();
    var best = null;
    Object.keys(avail.galleries).forEach(function (slug) {
      var g = avail.galleries[slug];
      Object.keys(g.days).sort().forEach(function (day) {
        if (day < now.date) return;
        g.days[day].forEach(function (t) {
          if (day === now.date && mins(t) <= now.minutes) return;
          if (!best || day < best.day || (day === best.day && mins(t) < mins(best.time))) {
            best = { day: day, time: t, slug: slug, city: g.city, url: g.bookingUrl };
          }
        });
      });
    });
    return best;
  }

  function renderSoonest() {
    if (!avail) {
      soonBody.innerHTML = '<p class="soon__none">Live times are not loading. ' +
        'Choose a gallery instead and its calendar will show you what is free.</p>';
      return;
    }
    var isVideo = how === 'video';
    var s = soonest();
    if (!s) {
      soonBody.innerHTML = '<p class="soon__none">Nothing free in the next two weeks. ' +
        'Choose a gallery and its calendar will have more.</p>';
      return;
    }
    var href = isVideo ? data.videoPilotUrl : s.url;
    var g = byslug(s.slug);
    soonBody.innerHTML =
      '<div class="soon">' +
        '<div class="soon__when">' +
          '<span class="soon__time">' + esc(s.time) + '</span>' +
          '<span class="soon__day">' + esc(niceDay(s.day)) + '</span>' +
        '</div>' +
        '<div class="soon__where">' +
          '<p class="soon__city">' + esc(isVideo ? 'Video call' : s.city) + '</p>' +
          '<p class="caption txt-secondary">' +
            (isVideo ? 'with the ' + esc(s.city) + ' gallery'
                     : (g && g.consultant ? 'with ' + esc(g.consultant) : 'Central European Time')) +
          '</p>' +
        '</div>' +
        '<a class="btn btn--primary soon__cta" href="' + esc(href) + '" target="_blank" rel="noopener" ' +
          'data-goal="advisor_booking_click" data-advisor="' + esc(s.slug) + '" data-how="' + how + '">' +
          'Take this time</a>' +
      '</div>';
  }

  /* ── map ─────────────────────────────────────────────────────────────── */

  function drawMap() {
    var m = data.map;
    var paths = '';
    Object.keys(m.neighbours).forEach(function (n) {
      paths += '<path class="mp__n" d="' + m.neighbours[n] + '"/>';
    });
    Object.keys(m.home).forEach(function (n) {
      paths += '<path class="mp__h" d="' + m.home[n] + '"/>';
    });

    var pins = data.galleries.filter(function (g) { return g.onMap; }).map(function (g) {
      var bookable = how === 'video' ? g.bookable : true;
      return '<g class="mp__pin' + (g.bookable ? '' : ' mp__pin--muted') +
               (bookable ? '' : ' mp__pin--off') + '" data-pin="' + esc(g.slug) + '" ' +
               'transform="translate(' + g.x + ',' + g.y + ')" ' +
               'tabindex="0" role="button" aria-label="' + esc(g.city) + '">' +
        '<circle class="mp__hit" r="20"/>' +
        '<circle class="mp__dot" r="7"/>' +
        '<text class="mp__label" x="' + g.lx + '" y="' + g.ly + '" ' +
          'text-anchor="' + esc(g.anchor) + '">' + esc(g.short) + '</text>' +
      '</g>';
    }).join('');

    mapHost.innerHTML =
      '<svg class="mp" viewBox="' + m.viewBox + '" role="img" ' +
        'aria-label="Map of the LUMAS galleries in Germany, Austria and Switzerland">' +
        '<g class="mp__land">' + paths + '</g>' +
        '<g class="mp__pins">' + pins + '</g>' +
      '</svg>';

    var off = data.galleries.filter(function (g) {
      return !g.onMap && (how !== 'video' || g.bookable);
    });
    var onMap = data.galleries.filter(function (g) {
      return g.onMap && (how !== 'video' || g.bookable);
    });

    /* At 390px the map is 279px wide, which puts the two Berlins about a pixel
     * apart and Frankfurt on top of its own airport. No touch target fixes
     * that, so on a phone the pins stay as orientation and this list does the
     * selecting. CSS hides it above 699px, where the labels work. */
    offHost.innerHTML =
      '<p class="offmap offmap--all"><span class="caption">Choose</span>' +
        onMap.map(function (g) {
          return '<button type="button" class="offmap__b" data-pin="' + esc(g.slug) + '">' +
            esc(g.short) + '</button>';
        }).join('') +
      '</p>' +
      (off.length
        ? '<p class="offmap"><span class="caption">Also in</span>' + off.map(function (g) {
            return '<button type="button" class="offmap__b" data-pin="' + esc(g.slug) + '">' +
              esc(g.city) + '</button>';
          }).join('') + '</p>'
        : '');
  }

  function renderDetail() {
    if (!selected) {
      detail.innerHTML = '<p class="pick__hint">' +
        '<span class="pick__tap">Tap a pin to see which gallery it is. </span>' +
        '<span class="pick__point">Pick a gallery on the map. </span>' +
        (how === 'video'
          ? 'Any of them can take the call, and you can visit them later.'
          : 'Eighteen galleries, and the one you choose keeps its own calendar.') + '</p>';
      return;
    }
    var g = byslug(selected);
    var isVideo = how === 'video';
    var href = g.bookable ? (isVideo ? data.videoPilotUrl : g.bookingUrl) : g.galleryUrl;
    var cta = g.bookable ? (isVideo ? 'Book a video call' : 'Book 30 minutes') : 'Contact the gallery';

    detail.innerHTML =
      '<article class="pick">' +
        (g.portrait
          ? '<span class="pick__ph"><img src="' + esc(g.portrait) + '" width="168" height="168" alt="" loading="lazy"></span>'
          : '<span class="pick__ph pick__ph--empty" aria-hidden="true"></span>') +
        '<div class="pick__body">' +
          '<p class="pick__city">' + esc(g.city) + '</p>' +
          (g.consultant ? '<p class="pick__with">with ' + esc(g.consultant) + '</p>' : '') +
          (g.address ? '<p class="pick__addr">' + esc(g.address) + '</p>' : '') +
        '</div>' +
        '<a class="btn btn--primary pick__cta" href="' + esc(href) + '" target="_blank" rel="noopener" ' +
          'data-goal="' + (g.bookable ? 'advisor_booking_click' : 'gallery_open') + '" ' +
          'data-advisor="' + esc(g.slug) + '" data-how="' + how + '">' + cta + '</a>' +
      '</article>';
  }

  function select(slug) {
    var g = byslug(slug);
    if (!g) return;
    if (how === 'video' && !g.bookable) return;   // pin is inert in video mode
    selected = slug;
    [].forEach.call(mapHost.querySelectorAll('[data-pin]'), function (p) {
      p.classList.toggle('is-on', p.dataset.pin === slug);
    });
    [].forEach.call(offHost.querySelectorAll('[data-pin]'), function (p) {
      p.classList.toggle('is-on', p.dataset.pin === slug);
    });
    track('booking_gallery_select', { gallery: slug, mode: how });
    renderDetail();
  }

  function renderMeta() {
    meta.innerHTML = how === 'video'
      ? 'Video calls run as a pilot on the ' +
        esc((byslug(data.videoPilotGallery) || {}).city || 'Hamburg') +
        ' calendar, so every gallery opens that booking page for now. ' +
        'Tell them in the booking who you would like to speak to.'
      : 'Each gallery keeps its own calendar. Picking one opens its booking page, ' +
        'which is where the times live.';
  }

  function render() {
    if (!data) return;
    soonPane.hidden = route !== 'soonest';
    mapPane.hidden  = route !== 'choose';
    if (route === 'soonest') renderSoonest();
    else { drawMap(); if (selected && how === 'video' && !byslug(selected).bookable) selected = null; renderDetail(); }
    renderMeta();
  }

  function setRoute(v) {
    route = v;
    routeBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.route === v)); });
    track('booking_route_switch', { route: v, mode: how });
    render();
  }

  function setHow(v) {
    how = v;
    modeBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.how === v)); });
    track('booking_mode_switch', { mode: v });
    render();
  }

  routeBtns.forEach(function (b) { b.addEventListener('click', function () { setRoute(b.dataset.route); }); });
  modeBtns.forEach(function (b) { b.addEventListener('click', function () { setHow(b.dataset.how); }); });

  root.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var pin = e.target.closest('[data-pin]');
    if (pin) { select(pin.dataset.pin); return; }
    var cta = e.target.closest('[data-advisor]');
    if (cta) track(cta.getAttribute('data-goal'), { advisor: cta.dataset.advisor, mode: cta.dataset.how });
  });

  // A pin is a button, so it answers the keyboard like one.
  root.addEventListener('keydown', function (e) {
    var pin = e.target.closest && e.target.closest('[data-pin]');
    if (pin && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(pin.dataset.pin); }
  });

  document.querySelectorAll('[data-mode="video"]').forEach(function (a) {
    a.addEventListener('click', function () { setHow('video'); });
  });

  Promise.all([
    fetch('assets/data/galleries.json').then(function (r) { return r.json(); }),
    // The soonest route needs times; the map route does not, so a failure here
    // costs the fast lane and leaves the rest of the widget working.
    fetch('assets/data/availability.json').then(function (r) { return r.json(); })
      .catch(function () { return null; })
  ]).then(function (v) {
    data = v[0];
    avail = v[1];
    render();
  }).catch(function () {
    soonBody.innerHTML = '<p class="soon__none">The gallery list is not loading. ' +
      'Every gallery is still reachable from lumas.de.</p>';
  });
})();
