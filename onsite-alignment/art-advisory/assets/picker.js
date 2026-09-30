/* LUMAS Advisory · version B picker ────────────────────────────────────────
   No availability on this page. Microsoft Bookings owns the calendar and shows
   the times, so the widget asks only what it can answer: how you want to meet,
   and who with, at region or gallery level. Then it hands off.

   Version A (advisory.html) is untouched: its booker binds to [data-booker],
   this binds to [data-picker], and neither selector exists on the other page. */
(function () {
  'use strict';

  var root = document.querySelector('[data-picker]');
  if (!root) return;

  var track = window.track || function () {};

  var results   = root.querySelector('[data-results]');
  var meta      = root.querySelector('[data-meta]');
  var chipset   = root.querySelector('.chipset');
  var blurbEl   = root.querySelector('[data-region-blurb]');
  var whereQ    = root.querySelector('[data-where-q]');
  var modeBtns  = [].slice.call(root.querySelectorAll('[data-how]'));

  var data = null;
  var how = 'gallery';
  var region = 'all';

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function regionName(id) {
    var r = data.regions.filter(function (x) { return x.id === id; })[0];
    return r ? r.name : null;
  }

  /* In gallery mode an unbookable gallery still belongs in the list: someone who
   * picked that region should see it and be told how to reach it. In video mode
   * it drops out, because the pilot calendar is not that gallery's. */
  function rows() {
    return data.galleries.filter(function (g) {
      if (region !== 'all' && g.region !== region) return false;
      if (how === 'video' && !g.bookable) return false;
      return true;
    }).sort(function (a, b) {
      // what you can actually book leads; the rest is still listed, just after
      if (a.bookable !== b.bookable) return a.bookable ? -1 : 1;
      return a.city.localeCompare(b.city);
    });
  }

  function card(g) {
    var isVideo = how === 'video';
    var href = g.bookable
      ? (isVideo ? data.videoPilotUrl : g.bookingUrl)
      : g.galleryUrl;
    var cta = g.bookable
      ? (isVideo ? 'Book a video call' : 'Book 30 minutes')
      : 'Contact the gallery';

    var portrait = g.portrait
      ? '<span class="pcard__ph"><img src="' + esc(g.portrait) + '" width="168" height="168" alt="" loading="lazy"></span>'
      : '<span class="pcard__ph pcard__ph--empty" aria-hidden="true"></span>';

    return '<article class="pcard' + (g.bookable ? '' : ' pcard--muted') + '">' +
      portrait +
      '<div class="pcard__body">' +
        '<p class="pcard__name">' + esc(g.consultant || g.city) + '</p>' +
        '<p class="caption pcard__where">' + esc(g.city) +
          (g.address ? '<span class="pcard__addr">' + esc(g.address) + '</span>' : '') +
        '</p>' +
      '</div>' +
      '<a class="pcard__cta" href="' + esc(href) + '" target="_blank" rel="noopener" ' +
        'data-goal="' + (g.bookable ? 'advisor_booking_click' : 'gallery_open') + '" ' +
        'data-advisor="' + esc(g.slug) + '" data-how="' + how + '">' + cta +
        ' <span class="arrow">→</span></a>' +
    '</article>';
  }

  function render() {
    if (!data) return;
    var list = rows();
    var isVideo = how === 'video';

    whereQ.textContent = isVideo
      ? 'Which consultant?'
      : 'Which gallery?';

    var r = data.regions.filter(function (x) { return x.id === region; })[0];
    blurbEl.textContent = r ? r.blurb : '';

    if (!list.length) {
      results.innerHTML = '<p class="picker__none">No gallery in that region takes video calls yet. ' +
        'Pick another region, or meet one of them in person.</p>';
      meta.textContent = '';
      return;
    }

    results.innerHTML = list.map(card).join('');

    var bookable = list.filter(function (g) { return g.bookable; }).length;
    if (isVideo) {
      // Said plainly rather than hidden in a footnote: during the pilot every
      // row opens the same calendar, so nobody expects a named person's diary.
      var pilot = data.galleries.filter(function (g) { return g.slug === data.videoPilotGallery; })[0];
      meta.innerHTML = 'Video calls run as a pilot on the ' +
        esc(pilot ? pilot.city : 'Hamburg') + ' calendar, so every consultant here opens that ' +
        'booking page for now. Tell them in the booking who you would like to speak to.';
    } else {
      meta.textContent = bookable === list.length
        ? 'Each gallery keeps its own calendar. Picking one opens its booking page.'
        : 'Galleries without a booking page can still be reached directly.';
    }
  }

  function setHow(v) {
    how = v;
    modeBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.how === v)); });
    track('booking_mode_switch', { mode: v });
    render();
  }

  function setRegion(v) {
    region = v;
    [].forEach.call(chipset.querySelectorAll('[data-region]'), function (c) {
      c.setAttribute('aria-pressed', String(c.dataset.region === v));
    });
    track('booking_region_select', { region: v, mode: how });
    render();
  }

  modeBtns.forEach(function (b) {
    b.addEventListener('click', function () { setHow(b.dataset.how); });
  });

  chipset.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('[data-region]');
    if (c) setRegion(c.dataset.region);
  });

  results.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-advisor]');
    if (a) track(a.getAttribute('data-goal'), { advisor: a.dataset.advisor, mode: a.dataset.how });
  });

  // The hero and footer video links land on the video mode, not just the anchor.
  [].forEach.call(document.querySelectorAll('[data-mode="video"]'), function (a) {
    a.addEventListener('click', function () { setHow('video'); });
  });

  fetch('assets/data/galleries.json')
    .then(function (r) { return r.json(); })
    .then(function (json) {
      data = json;
      data.regions.forEach(function (r) {
        chipset.insertAdjacentHTML('beforeend',
          '<button class="chip" type="button" data-region="' + esc(r.id) + '" aria-pressed="false">' +
            esc(r.name) + '</button>');
      });
      render();
    })
    .catch(function () {
      results.innerHTML = '<p class="picker__none">The gallery list is not loading. ' +
        'Every gallery is still reachable from lumas.de.</p>';
    });
})();
