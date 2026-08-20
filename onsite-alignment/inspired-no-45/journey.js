/* ============================================================================
   INSPIRED No. 45 · The Long Night — the scroll journey

   Scroll is the only control. Everything else is reaction:
     · IntersectionObserver reveals, with staggered delays in the markup
     · parallax on full-bleed backgrounds
     · six beats whose progress is driven by scroll position:
         the studio turning into a work
         five water works dissolving one into the next
         two hundred years of light flooding the frame
         a lenticular edition turning as you pass it
         one step forward into a crowd
         a wall before and after
   ========================================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = window.matchMedia('(max-width: 900px)');

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smoothstep(x) { x = clamp01(x); return x * x * (3 - 2 * x); }

  /* ---------------------------------------------------- entry sequence */
  setTimeout(function () { document.body.classList.add('loaded'); }, 80);
  setTimeout(function () { document.body.classList.add('entry-mark'); }, 520);
  setTimeout(function () { document.body.classList.add('entry-rest'); }, 1050);

  /* --------------------------------------------------------- reveals */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('revealed');
      io.unobserve(e.target);
    });
    /* any element already above the fold is past its moment: show it at once,
       so a fast scroll or a deep link can never land on a section that has not
       woken up yet */
  }, { threshold: 0, rootMargin: '0px 0px -4% 0px' });
  var reveals = [].slice.call(document.querySelectorAll('.reveal'));
  reveals.forEach(function (el) { io.observe(el); });

  /* The fade is a reward for having scrolled to something. If you arrived by
     jumping (a flick of the trackpad, a deep link, the browser restoring a
     position) the moment has passed, so the element is simply already there.
     Watching an empty band fade up for nine tenths of a second reads as a
     section that failed to load. */
  var lastY = window.scrollY;

  function catchUpReveals() {
    var y = window.scrollY;
    var jumped = Math.abs(y - lastY) > window.innerHeight * 1.1;
    lastY = y;
    var vh = window.innerHeight;
    for (var i = 0; i < reveals.length; i++) {
      var el = reveals[i];
      if (el.classList.contains('revealed')) continue;
      var r = el.getBoundingClientRect();
      if (r.top > vh * 0.94) continue;          /* not due yet */
      if (jumped || r.bottom < 0) el.classList.add('instant');
      el.classList.add('revealed');
      io.unobserve(el);
    }
  }

  /* --------------------------------------------------------- parallax */
  var parallax = [];
  document.querySelectorAll('[data-parallax]').forEach(function (el) {
    parallax.push({
      el: el,
      speed: parseFloat(el.getAttribute('data-parallax')) || 0.3,
      anchor: el.closest('section') || el.parentElement,
    });
  });

  function updateParallax() {
    if (reduced) return;
    var vh = window.innerHeight;
    parallax.forEach(function (p) {
      var r = p.anchor.getBoundingClientRect();
      if (r.bottom < -120 || r.top > vh + 120) return;
      var c = (r.top + r.height / 2 - vh / 2) / vh;
      p.el.style.transform = 'translate3d(0,' + (-c * p.speed * vh * 0.4).toFixed(2) + 'px,0)';
    });
  }

  /* --------------------------------------------- progress of a pinned beat */
  function progress(section) {
    var r = section.getBoundingClientRect();
    var depth = r.height - window.innerHeight;
    if (depth <= 0) return r.top <= 0 ? 1 : 0;
    return clamp01(-r.top / depth);
  }

  var ED = 'Edition of 100, signed. Available in three sizes.';

  /* ================================== beat 0 · the cover pulls back ------ */
  /* It opens on a detail filling the frame and pulls back until the whole work
     is there. The issue line arrives once it has settled. */
  var hero = document.getElementById('hero');
  var heroImg = document.getElementById('hero-img');
  var heroByline = document.getElementById('hero-byline');

  function updateHero() {
    var p = progress(hero);
    var t = smoothstep(clamp01(p / 0.72));
    heroImg.style.setProperty('--z', (2.9 - 1.9 * t).toFixed(3));
    heroByline.classList.toggle('on', t > 0.62);
  }

  /* ============================================== beat 1 · the studio ---- */
  var studio = document.getElementById('studio');
  var studioLines = studio.querySelectorAll('.s2-line');
  var studioStack = document.getElementById('studio-stack');
  var studioCta = document.getElementById('studio-cta');
  var studioCap = document.getElementById('studio-cap');
  var studioAt = [0.05, 0.24, 0.44, 0.66];
  var studioTurned = null;
  var STUDIO_CAP = [
    ['In the studio, Brooklyn', 'Pigment, water and a table at three in the morning.'],
    ['Marianna Gefen', ED],
  ];

  function updateStudio() {
    var p = progress(studio);
    studioLines.forEach(function (l, i) { l.classList.toggle('show', p >= studioAt[i]); });
    var turned = p >= 0.62;
    studioStack.classList.toggle('turned', turned);
    if (turned !== studioTurned) {
      studioTurned = turned;
      var c = STUDIO_CAP[turned ? 1 : 0];
      studioCap.querySelector('.who').textContent = c[0];
      studioCap.querySelector('.what').textContent = c[1];
    }
    studioCta.classList.toggle('show', p >= 0.82);
  }

  /* =============================================== beat 2 · the water ---- */
  /* The works are different shapes, so a moment where two are part-visible
     would read as one showing through the other rather than as a dissolve.
     Each one holds, then fades out completely through the black before the
     next arrives. The night carries the cut. */
  var water = document.getElementById('water');
  var waterArts = [].slice.call(water.querySelectorAll('.s3-art'));
  var waterMeta = document.getElementById('water-meta');
  var waterCaps = [
    ['Kevin Boyle · The Shape of Water', ED],
    ['A wave, held against the light', ED],
    ['Water rendered as though painted', ED],
    ['Trees standing in the flood', ED],
    ['A horizon that shows nothing, and everything', ED],
  ];
  var waterShown = -1;

  /* Each work's true ratio comes from its width and height attributes, so the
     caption can be placed without ever measuring the DOM. Measuring on the
     first frame gave the wrong answer, because the beat had not been laid out
     yet and the answer was then cached. */
  var waterRatio = waterArts.map(function (fig) {
    var img = fig.querySelector('img');
    return (+img.getAttribute('width') || 1) / (+img.getAttribute('height') || 1);
  });
  var waterStage = waterArts.length ? waterArts[0].parentNode : null;

  function placeWaterMeta(i) {
    if (!waterStage) return;
    var boxW = waterStage.clientWidth;
    var boxH = waterStage.clientHeight;
    var h = Math.min(window.innerHeight * 0.58, boxW / waterRatio[i]);
    waterMeta.style.top = (boxH / 2 + h / 2 + 18) + 'px';
  }

  function updateWater() {
    if (narrow.matches) {                    /* unrolled into a plain series */
      if (waterShown !== -2) {
        waterShown = -2;
        waterArts.forEach(function (f) { f.style.opacity = ''; f.style.transform = ''; });
        waterMeta.classList.add('show');
      }
      return;
    }

    var span = waterArts.length - 1;
    var t = clamp01((progress(water) - 0.06) / 0.88) * span;

    for (var i = 0; i < waterArts.length; i++) {
      var u = Math.abs(t - i);
      var o = u <= 0.32 ? 1 : u >= 0.46 ? 0 : 1 - smoothstep((u - 0.32) / 0.14);
      waterArts[i].style.opacity = o.toFixed(3);
      waterArts[i].style.transform =
        'translateY(-50%) scale(' + (0.988 + 0.012 * o).toFixed(4) + ')';
    }

    waterMeta.classList.add('show');
    var lead = Math.min(span, Math.max(0, Math.round(t)));
    if (lead !== waterShown) {
      waterShown = lead;
      waterMeta.querySelector('.who').textContent = waterCaps[lead][0];
      waterMeta.querySelector('.what').textContent = waterCaps[lead][1];
      /* the caption belongs under the work that is actually on screen, not
         under the tallest one in the stack */
      placeWaterMeta(lead);
    }
  }

  /* ========================= beat 3 · two hundred years, and the flood --- */
  var light = document.getElementById('light');
  var lightCol = document.getElementById('light-col');
  var yearEl = document.getElementById('light-year');
  var noteEl = document.getElementById('light-note');
  var dotEl = document.getElementById('light-dot');
  var fieldEl = document.getElementById('light-field');

  /* The essay's argument is not a list of dates, it is a sequence of ways of
     making a picture. Each beat names the technique that the works arriving
     beside it were made with, so the words and the images are about the same
     thing. */
  var LIGHT = [
    ['Patience, and nearness', 0.00,
     'Reportage asked for no staging. It asked for patience and for closeness, and it caught people more truthfully than any studio could.'],
    ['Out of the studio', 0.17,
     'A camera small enough to carry changed what could be photographed. The picture is taken where life happens, in available light, without permission.'],
    ['Colour, and the good life', 0.26,
     'Colour film brought the world into the picture in its own tones. Attractive people doing attractive things in attractive places, and with them the visual memory of an era.'],
    ['The icon, reduced', 0.52,
     'What made these pictures last was not the camera. It was the radical reduction of one gaze, until a single moment stood for a whole decade.'],
    ['Chemistry that cannot repeat', 0.63,
     'Expired Polaroid stock, shot in the desert. The emulsion decides as much as the photographer does, so every picture is chemically unrepeatable: a one-off in the age of the copy.'],
    ['The city, taken apart', 0.74,
     'A skyline broken into vibrating lines. The subject is no longer the building but the nervousness of looking at it, a city seen at the speed we now live in.'],
    ['Grown, not found', 0.88,
     'Digital painting over photography, until worlds appear that never existed and still breathe photographically. The question of taken or made stops being the interesting one.'],
    ['And the stream', 0.96,
     'Billions of pictures are made every day. The stream has become infinite, while the edition stays finite.'],
  ];

  /* The works are ordered so that each group arrives beside the technique it
     belongs to. Laid out so every work stays whole and inside the frame: left
     plus width never passes 96%, top plus height never passes 90%, and heights
     come from each work's true aspect ratio. */
  var TILES = [
    { src: 'lebeck-street.jpg',   l: 47, t:  6, w: 12, at: 0.05, alt: 'A woman crossing a cobbled street, photographed unposed' },
    { src: 'lebeck-salon.jpg',    l: 61, t:  8, w: 15, at: 0.10, alt: 'A crowded salon in black and white' },
    { src: 'lebeck-balloons.jpg', l: 78, t:  8, w: 14, at: 0.15, alt: 'A dog with balloons on a rooftop' },
    { src: 'aarons-porsche.jpg',  l: 44, t: 34, w: 18, at: 0.28, alt: 'A white sports car in front of a house with palms' },
    { src: 'aarons-tennis.jpg',   l: 64, t: 32, w: 14, at: 0.33, alt: 'A tennis court inside a palazzo courtyard' },
    { src: 'aarons-desert.jpg',   l: 80, t: 30, w: 16, at: 0.38, alt: 'A desert house with a pool at dusk' },
    { src: 'aarons-pool.jpg',     l: 47, t: 64, w: 14, at: 0.43, alt: 'Sunlight on pool water' },
    { src: 'aarons-pool-b.jpg',   l: 63, t: 66, w: 10, at: 0.47, alt: 'Palms reflected in a pool' },
    { src: 'stern-marilyn.jpg',   l: 75, t: 62, w: 12, at: 0.54, alt: 'An icon portrait in yellow' },
    { src: 'bowie.jpg',           l: 88, t: 62, w: 11, at: 0.58, alt: 'A black and white portrait' },
    { src: 'schneider-grid.jpg',  l: 53, t: 20, w: 15, at: 0.65, alt: 'A grid of expired Polaroids from the Californian desert' },
    { src: 'schneider-palms.jpg', l: 69, t: 20, w: 12, at: 0.70, alt: 'Palms and a rollercoaster on expired film' },
    { src: 'wild-paris.jpg',      l: 44, t: 48, w: 16, at: 0.76, alt: 'A Paris street broken into vibrating lines' },
    { src: 'wild-skyline.jpg',    l: 83, t: 20, w: 12, at: 0.80, alt: 'A skyline seen through a window' },
    { src: 'wild-stripes.jpg',    l: 62, t: 50, w: 7,  at: 0.84, alt: 'A city taken apart into colour bands' },
    { src: 'pop-sunglasses.jpg',  l: 71, t: 46, w: 12, at: 0.90, alt: 'A pop portrait in sunglasses' },
    { src: 'menin-bloom.jpg',     l: 85, t: 46, w: 11, at: 0.94, alt: 'A bloom exploding around a head' },
  ];

  var tileEls = [];
  (function buildField() {
    var plate = document.createElement('div');
    plate.className = 's5-plate';
    plate.style.cssText = 'left:56%;top:26%;width:20%;aspect-ratio:5/4';
    fieldEl.appendChild(plate);
    tileEls.push({ el: plate, at: 0.02 });

    TILES.forEach(function (t) {
      var fig = document.createElement('figure');
      fig.className = 's5-tile';
      fig.style.cssText = 'left:' + t.l + '%;top:' + t.t + '%;width:' + t.w + '%';
      var img = document.createElement('img');
      img.loading = 'lazy';
      img.src = 'assets/img/' + t.src;
      img.alt = t.alt;
      fig.appendChild(img);
      fieldEl.appendChild(fig);
      tileEls.push({ el: fig, at: t.at, counts: true });
    });
  })();

  var countEl = document.getElementById('light-count');
  var lightIdx = -1;
  var lastCount = -1;

  function updateLight() {
    var p = progress(light);
    var i = 0;
    for (var k = 0; k < LIGHT.length; k++) if (p >= LIGHT[k][1]) i = k;
    if (i !== lightIdx) {
      var first = lightIdx === -1;
      lightIdx = i;
      var paint = function () {
        yearEl.textContent = LIGHT[i][0];
        noteEl.textContent = LIGHT[i][2];
        lightCol.classList.remove('s5-swap');
      };
      if (first) paint();
      else { lightCol.classList.add('s5-swap'); setTimeout(paint, 200); }
    }
    dotEl.style.left = (p * 100).toFixed(1) + '%';

    var n = 0;
    tileEls.forEach(function (t) {
      var on = p >= t.at;
      t.el.classList.toggle('show', on);
      if (on && t.counts) n++;
    });
    if (n !== lastCount) {
      lastCount = n;
      countEl.textContent = n ? n + (n === 1 ? ' edition' : ' editions') : '';
    }
  }

  /* ==================================== beat 4 · the work that turns ----- */
  var phase = document.getElementById('phase');
  var phaseImgs = document.getElementById('phase-stage').querySelectorAll('img');
  var phaseHint = document.getElementById('phase-hint');
  var HINTS = ['from the left', 'head on', 'from the right'];

  function updatePhase() {
    var p = progress(phase);
    /* hold at the extremes so the turn happens in the middle of the beat */
    var t = clamp01((p - 0.18) / 0.64) * (phaseImgs.length - 1);
    var k = Math.floor(t);
    var frac = t - k;
    for (var i = 0; i < phaseImgs.length; i++) {
      phaseImgs[i].style.opacity = i <= k ? 1 : i === k + 1 ? frac.toFixed(3) : 0;
    }
    phaseHint.textContent = p > 0.1 && p < 0.9
      ? 'You are seeing it ' + HINTS[Math.min(k + (frac > 0.5 ? 1 : 0), HINTS.length - 1)]
      : 'Keep scrolling, the work turns with you';
  }

  /* ==================================== beat 5 · one step forward -------- */
  /* The essay says his pictures demand movement: a step back for the icon, a
     step forward for the crowd. Scrolling is that step. */
  var alan = document.getElementById('alan');
  var alanImg = document.getElementById('alan-img');
  var alanFar = document.getElementById('alan-far');
  var alanNear = document.getElementById('alan-near');

  function updateAlan() {
    var t = clamp01((progress(alan) - 0.14) / 0.62);
    alanImg.style.setProperty('--z', (1 + t * t * 1.9).toFixed(3));
    alanFar.classList.toggle('on', t < 0.45);
    alanNear.classList.toggle('on', t >= 0.45);
  }

  /* ========================================= beat 6 · the wall ----------- */
  var wall = document.getElementById('wall');
  var wallLines = wall.querySelectorAll('.s9-line');
  var wallStack = document.getElementById('wall-stack');
  var wallAt = [0.06, 0.28, 0.48, 0.7];

  function updateWall() {
    var p = progress(wall);
    wallLines.forEach(function (l, i) { l.classList.toggle('show', p >= wallAt[i]); });
    wallStack.classList.toggle('hung', p >= 0.66);
  }

  /* ------------------------- the header over every light surface ---------- */
  var header = document.getElementById('site-header');
  var lightSections = [].slice.call(
    document.querySelectorAll('[data-surface="light"], [data-surface="bone"]'));

  function updateNav() {
    var probe = 92;
    var vh = window.innerHeight;
    var overHeader = false;
    var mostly = false;
    for (var i = 0; i < lightSections.length; i++) {
      var r = lightSections[i].getBoundingClientRect();
      if (r.top <= probe && r.bottom >= probe) overHeader = true;
      if (r.top <= vh * 0.5 && r.bottom >= vh * 0.5) mostly = true;
    }
    header.classList.toggle('nav-dark', overHeader);
    document.body.classList.toggle('on-light', mostly);
  }

  /* ------------------------------------------------------ reading progress */
  var bar = document.getElementById('progress');
  function updateProgress() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0).toFixed(2) + '%';
  }

  /* ----------------------------------------------------------------- loop */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      catchUpReveals();
      updateHero();
      updateStudio();
      updateWater();
      updateLight();
      updatePhase();
      updateAlan();
      updateWall();
      updateParallax();
      updateNav();
      updateProgress();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    if (waterShown >= 0) placeWaterMeta(waterShown);
    onScroll();
  });
  window.addEventListener('load', onScroll);

  /* The layout can change without anybody scrolling: an access gate that hides
     the page and then reveals it, fonts arriving late, images settling. While
     the page is collapsed every section has zero height, so each beat computes
     against nothing and would keep that answer until the first scroll. Watch
     the document instead of waiting to be scrolled. */
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () {
      if (waterShown >= 0) placeWaterMeta(waterShown);
      onScroll();
    });
    ro.observe(document.documentElement);
  }

  onScroll();

  document.getElementById('back-to-top').addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.querySelector('.s0-chevron').addEventListener('click', function () {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  });
})();
