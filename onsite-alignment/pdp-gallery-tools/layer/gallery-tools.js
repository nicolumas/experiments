/*
 * PDP gallery tools: grouping options for the image-stage controls on the cloned PDP.
 *
 * Production's own controls (zoom, wishlist, Art Cloud binoculars, AR, 3D) stay in the page,
 * hidden, and the layer's buttons click them, so every tool keeps its real behaviour. The
 * production gallery is a Vue component that unmounts on the 3D view and redraws on
 * thumbnail changes, so the layer re-mounts itself whenever its nodes are gone.
 *
 * Icons: the PDP Restructure prototype's stroke set, plus Tabler's outline sparkle (MIT) for the AI Advisor.
 */
(function () {
  'use strict';

  var LANG = (document.documentElement.lang || 'de').slice(0, 2) === 'en' ? 'en' : 'de';

  var COPY = {
    de: {
      zoom: 'Zoom', room: 'Im Raum', threeD: '3D-Ansicht', similar: 'Ähnliche Werke',
      advisor: 'AI Advisor', wish: 'Merken', wished: 'Gemerkt', share: 'Teilen',
      advisorToast: 'Hier öffnet sich der AI Advisor. Im Prototyp nicht verbunden.',
      arElsewhere: 'Die AR-Ansicht öffnet sich auf dem iPhone in Safari.'
    },
    en: {
      zoom: 'Zoom', room: 'In your space', threeD: '3D view', similar: 'More similar',
      advisor: 'AI Advisor', wish: 'Save', wished: 'Saved', share: 'Share',
      advisorToast: 'The AI Advisor opens here. Not connected in this prototype.',
      arElsewhere: 'The AR view opens on an iPhone in Safari.'
    }
  }[LANG];

  var VERSIONS = [
    { id: 'A', name: 'Production', note: 'Live lumas.de, untouched.' },
    { id: 'B', name: 'Corner + caption', note: 'Zoom and save in the corner. Explore and the other views in one caption line under the artwork.' },
    { id: 'C', name: 'Rail + caption', note: 'Zoom, room, 3D and save as an icon rail in the corner. Only the two labelled explore links under the artwork.' },
    { id: 'D', name: 'Caption + title', note: 'Five tools in the caption under the artwork. Save moves next to share, beside the title.' },
    { id: 'E', name: 'Tiles + caption', note: 'Im Raum and 3D as tiles in the thumbnail row. Zoom, explore and save in one caption under the artwork.' }
  ];
  var SURFACES = [
    { id: 'ivory', name: 'Ivory', hex: '#F4EDE2', note: 'V2 Figma ivory/100' },
    { id: 'bone', name: 'Bone', hex: '#F0EBE3', note: 'V2 Figma bone/300, matches the reference' },
    { id: 'brandbook', name: 'Brandbook', hex: '#FEFDF9', note: 'Brandbook s03 Ivory' }
  ];

  // the icon set of the PDP Restructure prototype (onsite-alignment/pdp-restructure): stroke glyphs on a
  // 24 grid. The restructure has no AI icon; the sparkle is Tabler's outline "sparkles" (MIT), drawn the same way.
  var P = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" class="gt-i';
  var ICON = {
    zoom: P + '"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg>',
    // AR and 3D use the standard pictograms (Tabler outline: "augmented-reality", the cube in corner
    // brackets used for "view in AR", and "rotate-3d") where a label sits beside them; on their own they
    // are set as the marks "AR" and "3D" (see MARK), which read faster than any glyph at 20px
    room: P + '"><path d="M4 8v-2a2 2 0 0 1 2 -2h2"/><path d="M4 16v2a2 2 0 0 0 2 2h2"/><path d="M16 4h2a2 2 0 0 1 2 2v2"/><path d="M16 20h2a2 2 0 0 0 2 -2v-2"/><path d="M12 12.5l4 -2.5"/><path d="M8 10l4 2.5v4.5l4 -2.5v-4.5l-4 -2.5z"/><path d="M8 10v4.5l4 2.5"/></svg>',
    threeD: P + '"><path d="M12 3a7 7 0 0 1 7 7v4l-3 -3"/><path d="M22 11l-3 3"/><path d="M8 15.5l-5 -3l5 -3l5 3v5.5l-5 3z"/><path d="M3 12.5v5.5l5 3"/><path d="M8 15.545l5 -3.03"/></svg>',
    similar: P + '"><circle cx="12" cy="12" r="9.2"/><path d="M15.5 8.5l-2.2 5-5 2.2 2.2-5z"/></svg>',
    advisor: P + '"><path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z"/></svg>',
    wish: P + ' gt-i-heart"><path d="M12 21C7 16.6 3 13.3 3 9.3 3 6.4 5.2 4.5 7.7 4.5c1.7 0 3.3.9 4.3 2.4 1-1.5 2.6-2.4 4.3-2.4 2.5 0 4.7 1.9 4.7 4.8 0 4-4 7.3-9 11.7z"/></svg>'
  };

  // phones: production's share icon moves into the line under the image (Tabler outline "share", MIT)
  ICON.share = P + '"><path d="M6 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M18 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M8.7 10.7l6.6 -3.4"/><path d="M8.7 13.3l6.6 3.4"/></svg>';

  var MARK = { room: 'AR', threeD: '3D' };

  // ---- production controls the layer drives -----------------------------------
  function q(selector) { return document.querySelector(selector); }
  function arThumbnail() {
    return [].slice.call(document.querySelectorAll('.pdp-thumbnails .thumbnail')).filter(function (t) {
      return /ar_screen/.test(t.getAttribute('style') || '');
    })[0];
  }
  function productionWishButton() {
    return q('.main-presentation wishlist-button button') || q('.artist-holder wishlist-button button');
  }
  function productionShareButton() {
    return q('pdp-share-button[data-viewport="mobile"] button');
  }
  var ACTIONS = {
    share: function () { var b = productionShareButton(); if (b) b.click(); },
    zoom: function () { var b = q('.main-presentation .open-fullscreen'); if (b) b.click(); },
    room: function () {
      var b = q('.open-ar');
      if (b) return b.click();
      var t = arThumbnail();
      if (t) return t.click();
      // phones: production renders its AR button only where AR Quick Look works (iPhone, Safari)
      toast(COPY.arElsewhere);
    },
    threeD: function () { var b = q('.open-3d'); if (b) b.click(); },
    similar: function () { var b = q('.art-cloud-open') || q('.open-art-cloud'); if (b) b.click(); },
    advisor: function () { toast(COPY.advisorToast); },
    wish: function () { var b = productionWishButton(); if (b) b.click(); }
  };
  // production's own wording, for tooltips and accessible names where it has one
  function productionName(tool) {
    var el = {
      zoom: q('.open-fullscreen'), room: q('.open-ar'), threeD: q('.open-3d'),
      similar: q('.art-cloud-open') || q('.open-art-cloud'), wish: productionWishButton(),
      share: productionShareButton()
    }[tool];
    if (!el) return '';
    return (el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
  }
  function available(tool) {
    if (tool === 'advisor') return true;
    // on phones AR is always offered; where the phone cannot open it, the button says where it works
    if (tool === 'room') return !!(q('.open-ar') || arThumbnail() || q('.preview-mobile'));
    if (tool === 'zoom') return !!q('.main-presentation .open-fullscreen');
    if (tool === 'threeD') return !!q('.open-3d');
    if (tool === 'similar') return !!(q('.art-cloud-open') || q('.open-art-cloud'));
    if (tool === 'wish') return !!productionWishButton();
    if (tool === 'share') return !!productionShareButton();
    return false;
  }

  // ---- button factory ----------------------------------------------------------
  // kind: 'icon' restructure square · 'bare' icon alone · 'link' icon + quiet label · 'tile' restructure view tile
  function button(tool, kind) {
    var label = COPY[tool];
    var name = productionName(tool) || label;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'gt-btn gt-' + kind;
    b.dataset.gtAct = tool;
    b.dataset.tip = name;
    if (tool === 'wish') b.setAttribute('aria-pressed', 'false');
    var text = kind === 'icon' || kind === 'bare'
      ? '<span class="gt-vh">' + name + '</span>'
      : '<span class="gt-label">' + (tool === 'wish' ? '<span class="gt-off">' + label + '</span><span class="gt-on">' + COPY.wished + '</span>' : label) + '</span>';
    var glyph = kind === 'icon' && MARK[tool] ? '<span class="gt-mark" aria-hidden="true">' + MARK[tool] + '</span>' : ICON[tool];
    b.innerHTML = glyph + text;
    if (kind === 'link' && name !== label) b.setAttribute('aria-label', name);
    return b;
  }
  function group(cls, tools, kind) {
    var g = document.createElement('div');
    g.className = 'gt-group ' + (cls || '');
    tools.filter(available).forEach(function (t) { g.appendChild(button(t, kind)); });
    return g;
  }
  // append a group only when it has buttons, so an empty group leaves no gap behind
  function add(parent, g) {
    if (g.children.length) parent.appendChild(g);
  }
  function ui(tag, cls) {
    var el = document.createElement(tag);
    el.className = 'gt-ui ' + cls;
    return el;
  }

  // ---- layouts per version -----------------------------------------------------
  // Every version uses at most two places: one on or under the stage, one more.
  function mountDesktop(stage, v) {
    var corner, caption;
    if (v === 'B') {
      corner = ui('div', 'gt-corner');
      add(corner, group('', ['zoom', 'wish'], 'icon'));
      caption = ui('div', 'gt-caption gt-caption-full');
      add(caption, group('gt-explore', ['similar', 'advisor'], 'link'));
      add(caption, group('gt-views', ['room', 'threeD'], 'icon'));
    }
    if (v === 'C') {
      corner = ui('div', 'gt-corner');
      add(corner, group('', ['zoom', 'room', 'threeD', 'wish'], 'icon'));
      caption = ui('div', 'gt-caption gt-caption-center');
      add(caption, group('gt-explore', ['similar', 'advisor'], 'link'));
    }
    if (v === 'D') {
      caption = ui('div', 'gt-caption gt-caption-full');
      add(caption, group('gt-views', ['zoom', 'room', 'threeD'], 'icon'));
      add(caption, group('gt-explore', ['similar', 'advisor'], 'link'));
      var row = q('.pdp-product-info .artist-row');
      if (row) {
        var title = ui('div', 'gt-title');
        add(title, group('', ['wish'], 'icon'));
        row.appendChild(title);
      }
    }
    if (v === 'E') {
      caption = ui('div', 'gt-caption gt-caption-full');
      add(caption, group('gt-views', ['zoom'], 'icon'));
      add(caption, group('gt-explore', ['similar', 'advisor'], 'link'));
      add(caption, group('gt-views', ['wish'], 'icon'));
      // AR and 3D as the restructure's view tiles after the thumbnails (the AR tile replaces
      // production's phone-picture AR thumbnail, so AR is offered once)
      var thumbs = stage.querySelector('.pdp-thumbnails');
      if (thumbs) {
        var tiles = ui('div', 'gt-tiles');
        add(tiles, group('', ['room', 'threeD'], 'tile'));
        thumbs.appendChild(tiles);
      }
    }
    if (corner) stage.appendChild(corner);
    if (caption) stage.appendChild(caption);
  }

  function mountMobile(container, v) {
    var preview = container.querySelector('.preview-mobile');
    var corner, line = ui('div', 'gt-mline');
    if (v === 'B') {
      corner = ui('div', 'gt-mcorner');
      add(corner, group('', ['wish'], 'icon'));
      add(line, group('gt-explore', ['similar', 'advisor'], 'link'));
      add(line, group('gt-views', ['room', 'threeD'], 'icon'));
    }
    if (v === 'C') {
      corner = ui('div', 'gt-mcorner');
      add(corner, group('', ['room', 'threeD', 'wish'], 'icon'));
      add(line, group('gt-explore', ['similar', 'advisor'], 'link'));
      add(line, group('gt-end', ['share'], 'bare'));
    }
    if (v === 'E') {
      // phones have no thumbnail row: AR and 3D close the line under the image
      corner = ui('div', 'gt-mcorner');
      add(corner, group('', ['wish'], 'icon'));
      add(line, group('gt-explore', ['similar', 'advisor'], 'link'));
      add(line, group('gt-views', ['room', 'threeD'], 'icon'));
    }
    if (v === 'D') {
      // the heart stays where production already puts it on phones: beside the title
      add(line, group('gt-views', ['room', 'threeD'], 'icon'));
      add(line, group('gt-explore', ['similar', 'advisor'], 'link'));
    }
    if (corner && preview) preview.appendChild(corner);
    if (preview && preview.nextSibling) container.insertBefore(line, preview.nextSibling);
    else container.appendChild(line);
    watchSlides(preview);
  }

  // phones: the corner icons sit on the ivory margin of the artwork slide, but on a white
  // ground once the carousel is swiped to a room view or a detail photo
  var slideObserver = null;
  function watchSlides(preview) {
    var first = preview && preview.querySelector('.scroll-carousel-wrapper > .slide');
    if (!first || !window.IntersectionObserver) return;
    if (slideObserver) slideObserver.disconnect();
    slideObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { preview.classList.toggle('gt-on-photo', e.intersectionRatio < 0.6); });
    }, { root: preview.querySelector('.scroll-carousel-wrapper'), threshold: [0.6] });
    slideObserver.observe(first);
  }

  // where the layer lives right now: the desktop stage or the mobile preview
  function host() {
    var stage = q('.pdp-preview-desktop .main-presentation');
    if (stage) return { el: stage, mobile: false };
    var m = q('.pdp-mobile-preview-container');
    if (m && m.querySelector('.preview-mobile')) return { el: m, mobile: true };
    return null;
  }

  // Vue may drop any one of the layer's nodes (the strip inside the thumbnails, the
  // columns inside the stage), so remount whenever fewer are attached than were mounted
  // Production also draws some of its own controls after the layer has mounted (the mobile
  // buttons, the wishlist button's inner <button>), so remount when the set of tools changes.
  var mounted = 0, mountedTools = '';
  function toolSet() {
    return ['zoom', 'room', 'threeD', 'similar', 'wish', 'share'].filter(available).join(',');
  }
  function render() {
    [].slice.call(document.querySelectorAll('.gt-ui')).forEach(function (n) { n.remove(); });
    mounted = 0;
    var h = host();
    if (!h || state.v === 'A') return;
    mountedTools = toolSet();
    if (h.mobile) mountMobile(h.el, state.v); else mountDesktop(h.el, state.v);
    mounted = document.querySelectorAll('.gt-ui').length;
    sync();
    place();
  }
  function needsMount() {
    if (state.v === 'A' || !host()) return false;
    return !mounted || document.querySelectorAll('.gt-ui').length < mounted || toolSet() !== mountedTools;
  }

  // what the active thumbnail shows: the artwork, the AR panel, a room view or a detail photo
  // production marks the artwork's own thumbnail with .has-background (it gets the wall)
  function onArtworkSlide() {
    return !!q('.pdp-thumbnails .thumbnail.active.has-background');
  }
  // the slide area itself: .image-wrapper (artwork, detail photos), .room-wrapper (room views)
  // or .ar-container (AR panel), whichever production has mounted for the active thumbnail
  function stageArea(stage) {
    return stage.querySelector(':scope > .image-wrapper, :scope > .room-wrapper, :scope > .ar-container') ||
      [].filter.call(stage.children, function (c) {
        return !c.classList.contains('pdp-thumbnails') && !c.classList.contains('gt-ui') && c.offsetHeight > 200;
      })[0];
  }
  function stageMedia(stage) {
    var ar = stage.querySelector('.ar-container');  // the AR slide replaces the whole image-wrapper
    if (ar) return ar.querySelector('.ar-cta-img') || ar;
    var wrap = stage.querySelector('.image-wrapper');
    if (!wrap) return null;
    return onArtworkSlide() ? wrap.querySelector('.zoom-holder') || wrap : wrap;
  }

  // Vue sets the artwork's size only once its image has loaded, and again on every resize
  var sizeObserver = window.ResizeObserver ? new ResizeObserver(function () { requestAnimationFrame(place); }) : null;
  var watched = null;
  function watchSize(el) {
    if (!sizeObserver || el === watched) return;
    sizeObserver.disconnect();
    sizeObserver.observe(el);
    watched = el;
  }

  // The caption sits in the band production leaves under the artwork, aligned to the
  // artwork's own edges, so it reads like a label under a picture rather than a toolbar.
  // On room views and detail photos there is no band: it moves onto the photo's foot.
  function placeTitle() {
    var title = q('.gt-title'), share = q('.artist-row pdp-share-button');
    if (!title || !share) return;
    var row = title.parentNode.getBoundingClientRect(), r = share.getBoundingClientRect();
    title.style.top = Math.round(r.top - row.top + r.height / 2 - 22) + 'px';
    // the heart glyph sits 16px left of the share glyph; the 44px hit area overhangs it by 12px
    title.style.right = Math.round(row.right - r.left + 16 - 12) + 'px';
  }
  function place() {
    placeTitle();
    var stage = q('.pdp-preview-desktop .main-presentation');
    if (!stage) return;
    var captions = [].slice.call(stage.querySelectorAll('.gt-caption'));
    if (!captions.length) return;
    var area = stageArea(stage);
    var media = stageMedia(stage) || area;
    if (!area || !media) return;
    watchSize(media);
    var s = stage.getBoundingClientRect(), a = area.getBoundingClientRect(), m = media.getBoundingClientRect();
    var onPhoto = !onArtworkSlide() && !stage.querySelector('.ar-container');
    stage.classList.toggle('gt-on-photo', onPhoto);
    var band = a.bottom - m.bottom;
    captions.forEach(function (c) {
      var h = c.offsetHeight;
      // the 44px hit area may overhang a tight band; the visible label (about 20px) still fits
      var top = onPhoto || band < h * 0.75 ? a.bottom - s.top - h - 12 : m.bottom - s.top + (band - h) / 2;
      var gutter = 16;
      var left = onPhoto ? gutter : Math.max(gutter, m.left - s.left);
      c.style.top = Math.round(top) + 'px';
      c.style.left = Math.round(left) + 'px';
      if (c.classList.contains('gt-caption-full') || c.classList.contains('gt-caption-center')) {
        c.style.width = 'auto';
        var natural = c.scrollWidth;
        var span = onPhoto ? a.width - 2 * gutter : m.width;
        if (natural > span) {
          // wider than the artwork: centre the line on the stage instead
          c.style.left = Math.round(Math.max(gutter, (a.width - natural) / 2)) + 'px';
          c.style.width = natural + 'px';
        } else {
          c.style.width = Math.round(span) + 'px';
        }
      }
    });
  }

  // mirror production state onto the layer's buttons
  var lastSlide = null;
  function sync() {
    // a new thumbnail means new media on the stage, so the caption has to move with it.
    // Only then: place() toggles a class, which would otherwise bring the observer straight back here
    var active = q('.pdp-thumbnails .thumbnail.active');
    var slide = active ? [].indexOf.call(active.parentNode.children, active) : -1;
    if (slide !== lastSlide) { lastSlide = slide; requestAnimationFrame(place); setTimeout(place, 350); }

    var wish = productionWishButton();
    var pressed = wish && wish.getAttribute('aria-pressed') === 'true';
    var thumb = arThumbnail();
    var roomOn = !!(thumb && thumb.classList.contains('active'));
    // compare first: setAttribute with an unchanged value still queues a mutation, and the
    // observer that calls sync() would then call it again on every frame
    [].slice.call(document.querySelectorAll('.gt-btn[data-gt-act="wish"]')).forEach(function (b) {
      if (b.getAttribute('aria-pressed') !== String(!!pressed)) b.setAttribute('aria-pressed', String(!!pressed));
    });
    [].slice.call(document.querySelectorAll('.gt-btn[data-gt-act="room"]')).forEach(function (b) {
      b.classList.toggle('gt-current', roomOn);
    });
  }

  // ---- toast -------------------------------------------------------------------
  var toastEl, toastTimer;
  function toast(text) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'gt-toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
    toastEl.classList.add('gt-toast-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('gt-toast-show'); }, 2800);
  }

  // ---- state ---------------------------------------------------------------------
  // The chosen design (C on the Bone stage) is the default and shows without the prototype bar.
  // ?compare brings the bar back to switch versions and stage colours.
  var DEFAULT = { v: 'C', s: 'bone' };
  var COMPARE = new URLSearchParams(location.search).has('compare');
  function readState() {
    var p = new URLSearchParams(location.search);
    var v = (p.get('v') || DEFAULT.v).toUpperCase();
    var s = (p.get('s') || DEFAULT.s).toLowerCase();
    return {
      v: VERSIONS.some(function (x) { return x.id === v; }) ? v : DEFAULT.v,
      s: SURFACES.some(function (x) { return x.id === s; }) ? s : DEFAULT.s
    };
  }
  function query() { return 'v=' + state.v + (state.s === DEFAULT.s ? '' : '&s=' + state.s); }
  function writeState() {
    var p = new URLSearchParams(location.search);
    p.delete('v'); p.delete('s');
    var rest = p.toString();
    history.replaceState(null, '', location.pathname + '?' + (rest ? rest + '&' : '') + query() + location.hash);
  }
  var state = readState();

  function apply() {
    var root = document.documentElement;
    root.classList.toggle('gt-on', state.v !== 'A');
    root.dataset.gtV = state.v;
    root.dataset.gtSurface = state.s;
    render();
  }

  // ---- prototype bar --------------------------------------------------------------
  function langHref(target) {
    var params = '?' + (COMPARE ? 'compare&' : '') + query();
    // the published copy is two static pages (index.html, en.html), named by window.gtStatic
    if (window.gtStatic) return window.gtStatic[target] + params;
    var path = location.pathname.replace(/^\/en(?=\/)/, '');
    return (target === 'en' ? '/en' + path : path) + params;
  }
  function buildBar() {
    var bar = document.createElement('div');
    bar.className = 'gt-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Prototype versions');
    bar.innerHTML =
      '<span class="gt-bar-title">Gallery tools</span>' +
      '<div class="gt-bar-versions" role="group" aria-label="Version">' + VERSIONS.map(function (v) {
        return '<button type="button" data-v="' + v.id + '" title="' + v.note + '"><b>' + v.id + '</b><span>' + v.name + '</span></button>';
      }).join('') + '</div>' +
      '<div class="gt-bar-surfaces" role="group" aria-label="Stage colour">' + SURFACES.map(function (s) {
        return '<button type="button" data-s="' + s.id + '" title="' + s.name + ' ' + s.hex + ' · ' + s.note + '">' +
          '<i style="background:' + s.hex + '"></i><span>' + s.name + '</span></button>';
      }).join('') + '</div>' +
      '<div class="gt-bar-lang" role="group" aria-label="Language"><a data-lang="de">DE</a><a data-lang="en">EN</a></div>' +
      '<p class="gt-bar-note" aria-live="polite"></p>';
    document.body.appendChild(bar);
    bar.addEventListener('click', function (e) {
      var vb = e.target.closest('[data-v]');
      var sb = e.target.closest('[data-s]');
      if (vb) { state.v = vb.dataset.v; update(); }
      if (sb) { state.s = sb.dataset.s; update(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.target.closest('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
      var v = VERSIONS.filter(function (x) { return x.id === e.key.toUpperCase(); })[0];
      if (v) { state.v = v.id; update(); }
    });
    return bar;
  }
  function syncBar() {
    bar.querySelectorAll('[data-v]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === state.v)); });
    bar.querySelectorAll('[data-s]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.s === state.s));
      b.disabled = state.v === 'A';
    });
    bar.querySelectorAll('[data-lang]').forEach(function (a) {
      a.setAttribute('aria-current', String(a.dataset.lang === LANG));
      a.href = langHref(a.dataset.lang);
    });
    var v = VERSIONS.filter(function (x) { return x.id === state.v; })[0];
    bar.querySelector('.gt-bar-note').textContent = v.note;
  }
  var bar;
  function update() { writeState(); apply(); syncBar(); }

  // ---- boot ----------------------------------------------------------------------
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.gt-btn[data-gt-act]');
    if (!b) return;
    ACTIONS[b.dataset.gtAct]();
    setTimeout(sync, 60);
  });

  var queued = false;
  function onMutation() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      if (needsMount()) render(); else sync();
    });
  }

  function whenPresent(selector, cb, tries) {
    if (q(selector)) return cb();
    if ((tries || 0) > 150) return;
    setTimeout(function () { whenPresent(selector, cb, (tries || 0) + 1); }, 100);
  }

  whenPresent('.pdp-preview-desktop .main-presentation, .pdp-mobile-preview-container .preview-mobile', function () {
    if (COMPARE) {
      document.documentElement.classList.add('gt-has-bar');
      bar = buildBar();
      update();
    } else {
      apply();
    }
    var root = q('preview-online') || document.body;
    new MutationObserver(onMutation).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed', 'class'] });
    var resizeTimer;
    window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(place, 120); });
    // the zoom-holder width is set by Vue once the artwork image has loaded
    window.addEventListener('load', place);
    setTimeout(place, 600);
  });
})();
