/* Art-advisory placements: the seven proposed entry points to /art-advisory/,
   added to the captured lumas.de pages at serve time, plus a review bar for the
   stakeholder walk-through. `?spot=N` jumps to placement N. */
(function () {
  'use strict';

  var LP = '/art-advisory/';
  var CTA = 'Beratung buchen';
  var params = new URLSearchParams(location.search);
  // the published static copy names the shop path it was captured from (_publish.py)
  var PATH = (window.aaStatic && window.aaStatic.page) || location.pathname;
  var PDP_PATH = '/pictures/marta_contreras_simo/winda/';
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // the shop switches to its drawer header at 1024px and below; follow the toggle, not a width
  var isDesktop = function () {
    var toggle = document.querySelector('site-header .navigation-mobile-toggle');
    return !toggle || getComputedStyle(toggle).display === 'none';
  };

  var HERO = 'https://media.lumas.de/art-advisory/hero-beratung-820x820';
  var GALLERY_PHOTO = 'https://media.lumas.de/art-advisory/gallery-hamburg-520x520';
  var FACES = [
    'https://media.lumas.de/galerien/muenchen/galerieleitung-muenchen-168x168',
    'https://media.lumas.de/galerien/berlin-mitte/galerieleitung-b1-168x168',
    'https://media.lumas.de/galerien/hamburg/galerieleitung-hamburg-168x168',
    'https://media.lumas.de/galerien/wien/galerieleitung-wien-168x168'
  ];

  var SPOTS = [
    { n: 1, page: '/', title: 'Header icon', target: '.aa-header-link',
      note: 'Between search and WhatsApp, on every page. Hovering shows a tooltip like the WhatsApp icon’s. On phones it sits left of WhatsApp; below 385 px wide it gives way to the logo, and the Galleries menu card covers those phones.' },
    { n: 2, page: '/', title: 'Galleries menu, Service', target: '.aa-menu-card, .aa-service-item', open: 'galleries',
      note: '“Persönliche Beratung” is the first Service entry, and a card with real Art Consultant portraits fills the empty columns on the right. On phones the card sits at the top of the Galleries menu.' },
    { n: 3, page: '/', title: 'Homepage tile', target: '.aa-tile',
      note: 'Replaces Art Cloud: about 14 clicks a day, no orders afterwards, and a third of its clicks are dead clicks (GA4 and Clarity, 6 to 20 Oct). Tracked as data-cta “art_advisory”.' },
    { n: 4, page: PDP_PATH, title: 'PDP, below the buy box', target: '.aa-pdp',
      note: 'Test variant: one quiet line in the empty CMS slot below the shipping info, never above or beside the cart button. Primary metric is add-to-cart rate, so the test shows whether it helps or hurts buying.' },
    { n: 5, page: '/warum-lumas/', title: 'Warum LUMAS, point 09', target: '.aa-reason',
      note: 'New point 09 after WhiteWall. The old points 09 to 12 become 10 to 13, three rows swap sides to keep the zigzag, and the heading becomes “Dreizehn gute Gründe”.' },
    { n: 6, page: '/galerien/', title: 'Galleries page', target: '.aa-galleries-band',
      note: 'Straight under the intro that ends “beraten dich gern”, before the locations list that many internal links land on.' },
    { n: 7, page: '/', title: 'Footer, Hilfe', target: '.aa-footer-link',
      note: 'Under Hilfe, after Kontakt.' }
  ];

  // ---- helpers ---------------------------------------------------------------
  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function whenPresent(selector, cb, timeout) {
    var found = document.querySelector(selector);
    if (found) return cb(found);
    var obs = new MutationObserver(function () {
      var f = document.querySelector(selector);
      if (f) { obs.disconnect(); cb(f); }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () { obs.disconnect(); }, timeout || 10000);
  }

  function picture(base, alt, w, h, cls) {
    return '<picture><source srcset="' + base + '.webp" type="image/webp">' +
      '<img src="' + base + '.jpg" alt="' + alt + '" width="' + w + '" height="' + h + '"' +
      (cls ? ' class="' + cls + '"' : '') + ' loading="lazy"></picture>';
  }

  function faces(count) {
    return '<span class="aa-faces" aria-hidden="true">' + FACES.slice(0, count).map(function (f) {
      return '<img src="' + f + '.webp" alt="" width="44" height="44" loading="lazy">';
    }).join('') + '</span>';
  }

  // No orphans or widows: bind short function words to the next word and the last two words
  // of each placement with no-break spaces. Runs are capped so a binding never overflows a
  // narrow column. Prototype only: the CMS versions rely on text-wrap classes and rewording.
  var BIND_FORWARD = new Set(('der die das den dem des ein eine einen einem einer eines in im an am auf aus bei mit ' +
    'nach von vor zu zum zur für über unter um durch per bis ohne und oder aber als wie ob dein deine deiner deinen ' +
    'deinem unser unsere unserer unseren ihr ihre ihren ihrem jedes jede jeden welche welcher welches').split(' '));
  var RUN_CAP = 22, TAIL_CAP = 26;

  function bindWords(text, bindTail) {
    var words = text.split(/ +/);
    var out = '', run = 0;
    words.forEach(function (w, i) {
      out += w;
      run += w.length;
      var next = words[i + 1];
      if (next === undefined) return;
      var isTail = bindTail && i === words.length - 2 && run + 1 + next.length <= TAIL_CAP;
      var isFunction = BIND_FORWARD.has(w.toLowerCase()) && run + 1 + next.length <= RUN_CAP;
      if (w && (isTail || isFunction)) { out += '\u00a0'; run += 1; }
      else { out += ' '; run = 0; }
    });
    return out;
  }

  function typeset(root) {
    root.querySelectorAll('h2, h3, h4, p, .aa-menu-card__title, .aa-menu-card__text').forEach(function (block) {
      var nodes = [];
      var walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
      var n;
      while ((n = walker.nextNode())) if (n.data.trim()) nodes.push(n);
      nodes.forEach(function (node, i) {
        var lead = node.data.match(/^\s*/)[0], trail = node.data.match(/\s*$/)[0];
        node.data = lead + bindWords(node.data.trim(), i === nodes.length - 1) + trail;
      });
    });
  }

  // The shop's own calendar glyph (#events) with a check mark, so it reads as "book". Stroke 1.25
  // (not the sprite's 1.17): its straight edges render lighter than the curved icons beside it.
  function iconSprite() {
    if (document.getElementById('aa-consult')) return;
    document.body.prepend(el('<svg xmlns="http://www.w3.org/2000/svg" style="display:none">' +
      '<symbol id="aa-consult" viewBox="0 0 20 20"><path d="M6.67 1.67V5M13.33 1.67V5M15.83 3.33H4.17c-.92 0-1.67.75-1.67 1.67v11.67c0 .92.75 1.66 1.67 1.66h11.66c.92 0 1.67-.74 1.67-1.66V5c0-.92-.75-1.67-1.67-1.67M2.5 8.33h15M7.5 13.33l1.67 1.67 3.33-3.33" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25"/></symbol></svg>'));
  }

  // ---- 1 header icon -----------------------------------------------------------
  function headerIcon() {
    // before the icon group that starts with WhatsApp, so the group's own spacing stays intact
    var wa = document.querySelector('site-header aside whats-app-contact');
    var group = wa && wa.closest('site-header aside > *');
    if (!group || document.querySelector('.aa-header-link')) return;
    group.parentNode.insertBefore(el('<a class="aa-header-link" href="' + LP + '" aria-label="Persönliche Beratung buchen" ' +
      'data-tooltip="Persönliche Beratung buchen"><svg aria-hidden="true"><use href="#aa-consult"></use></svg></a>'), group);
  }

  // ---- 2 galleries dropdown ------------------------------------------------------
  function menuCard() {
    var card = el('<a class="aa-menu-card" href="' + LP + '">' + faces(4) +
      '<span class="aa-menu-card__title">Kunstberatung</span>' +
      '<span class="aa-menu-card__text">Ein Art Consultant berät dich persönlich zu Größe, Platzierung und Rahmung. Kostenlos, per Video oder in der Galerie.</span>' +
      '<span class="aa-menu-card__cta">' + CTA + '</span></a>');
    typeset(card);
    return card;
  }

  function galleriesMenu(root) {
    root.querySelectorAll('.menu.galleries').forEach(function (menu) {
      if (menu.querySelector('.aa-menu-card')) return;
      var serviceHeading = menu.querySelector('dl.services dt');
      if (serviceHeading) {
        serviceHeading.after(el('<dd class="aa-service-item"><a href="' + LP + '"><svg><use href="#aa-consult"></use></svg>Persönliche Beratung</a></dd>'));
      }
      menu.prepend(menuCard());
    });
  }

  function galleriesEverywhere() {
    var tpl = document.getElementById('main-navigation');
    if (tpl && tpl.content) galleriesMenu(tpl.content);
    galleriesMenu(document);
    // site-header renders the template into <nav> and may redraw it later
    var header = document.querySelector('site-header');
    if (header) new MutationObserver(function () { galleriesMenu(document); })
      .observe(header, { childList: true, subtree: true });
  }

  // ---- 3 homepage tile (replaces Art Cloud) -------------------------------------
  function homepageTile() {
    whenPresent('.block-tiles[data-section="campaign_tiles"] a[data-cta="artcloud"]', function (a) {
      var cell = a.parentElement;
      cell.classList.add('aa-tile');
      cell.innerHTML =
        '<a data-cta="art_advisory" href="' + LP + '">' +
          picture(HERO, 'Beratung mit einem Art Consultant in der LUMAS Galerie', 820, 820, 'width-full height-full') +
        '</a>' +
        '<div class="mb-2"><h4 class="text-2rem mb-1 text-wrap-balance">Persönliche Kunstberatung | Kostenlos und unverbindlich</h4>' +
        '<div class="mb-1"><a class="underline" data-cta="art_advisory" href="' + LP + '">' + CTA + '</a></div></div>';
      typeset(cell);
    });
  }

  // ---- 4 PDP, below the buy box ----------------------------------------------------
  function pdpLine() {
    whenPresent('.pdp-info-banner', function (slot) {
      if (slot.querySelector('.aa-pdp')) return;
      var line = el('<div class="aa-pdp" data-ab-variant="art-advisory-pdp-b">' + faces(3) +
        '<p>Fragen zu Größe, Rahmung oder Platzierung? Unsere Art Consultants beraten dich kostenlos, per Video oder in der Galerie. ' +
        '<a class="underline" data-cta="art_advisory_pdp" href="' + LP + '">' + CTA + '</a></p></div>');
      typeset(line);
      slot.prepend(line);
    });
  }

  // ---- 5 Warum LUMAS, new point 09 ----------------------------------------------------
  function labelsOnWhyPage() {
    var main = document.querySelector('main') || document;
    return Array.prototype.filter.call(main.querySelectorAll('p'), function (p) {
      return /^\s*(0[1-9]|1[0-9])(\s|$)/.test(p.textContent) && p.textContent.trim().length < 60;
    });
  }

  function markWhyRows() {
    labelsOnWhyPage().forEach(function (p) {
      var row = p.closest('.row.flex');
      if (row) row.setAttribute('data-aa-row', p.textContent.trim().slice(0, 2));
    });
  }

  function flipRow(row) {
    row.classList.toggle('flex-wrap');
    row.classList.toggle('flex-wrap-reverse');
    row.appendChild(row.firstElementChild);
  }

  function whyLumas() {
    var row08 = document.querySelector('[data-aa-row="08"]');
    if (!row08 || document.querySelector('.aa-reason')) return;
    labelsOnWhyPage().forEach(function (p) {
      p.textContent = p.textContent.replace(/^(\s*)(\d\d)/, function (m, ws, num) {
        var n = parseInt(num, 10);
        return n >= 9 ? ws + String(n + 1).padStart(2, '0') : m;
      });
    });
    ['09', '10', '11'].forEach(function (old) {
      var row = document.querySelector('[data-aa-row="' + old + '"]');
      if (row && row.children.length === 2) flipRow(row);
    });
    var reason = el(
      '<div class="row mb-3 flex items-center justify-center flex-wrap-reverse aa-reason">' +
        '<div class="col-md-6 text-align-viewport">' +
          '<p class="mb-3"> 09 – Persönliche Beratung </p>' +
          '<h3 class="mb-2"> Im Gespräch zum richtigen Werk </h3>' +
          '<p class="lead mb-3"> Welche Größe trägt deine Wand, welche Rahmung passt zum Raum? Unsere Art Consultants kennen jedes Werk an ihren Wänden ' +
          'und nehmen sich Zeit für deine Fragen: in der Galerie, per Video oder am Telefon. Kostenlos und unverbindlich. </p>' +
          '<a class="btn btn-secondary" data-cta="art_advisory_why" href="' + LP + '">' + CTA + '</a>' +
        '</div>' +
        '<div class="col-md-6 text-center mb-3"><figure>' +
          picture(HERO, 'Beratung mit einem Art Consultant in der LUMAS Galerie', 820, 600, 'max-w-full width-full height-auto') +
        '</figure></div>' +
      '</div>');
    typeset(reason);
    row08.after(reason);
    var heading = Array.prototype.find.call(document.querySelectorAll('main .like-h2'), function (s) {
      return /Zwölf gute Gründe/.test(s.textContent);
    });
    if (heading) heading.textContent = heading.textContent.replace('Zwölf', 'Dreizehn');
  }

  // ---- 6 Galerien page band ---------------------------------------------------------
  function markGalleriesIntro() {
    var lead = Array.prototype.find.call(document.querySelectorAll('main p.lead'), function (p) {
      return /beraten dich gern/.test(p.textContent);
    });
    var row = lead && lead.closest('.row');
    if (row) row.setAttribute('data-aa-intro', '');
    return row;
  }

  function galleriesBand() {
    var row = document.querySelector('[data-aa-intro]');
    if (!row || document.querySelector('.aa-galleries-band')) return;
    var band = el(
      '<div class="row mb-3 aa-galleries-band"><div class="col-md-10 col-md-offset-1">' +
        '<div class="bgcolor_brand-color-light aa-band-inner"><div class="row flex items-center flex-wrap">' +
          '<div class="col-md-4 aa-band-photo">' + picture(GALLERY_PHOTO, 'LUMAS Galerie Hamburg', 520, 520) + '</div>' +
          '<div class="col-md-8 aa-band-text">' + faces(4) +
            '<h2 class="like-h3 text-left mb-1 text-wrap-balance">Lieber mit Termin?</h2>' +
            '<p class="lead mb-2 text-wrap-pretty">Buche eine persönliche Beratung mit dem Art Consultant deiner Galerie. ' +
            'Auch per Video oder am Telefon, kostenlos und unverbindlich.</p>' +
            '<a class="btn btn-secondary" data-cta="art_advisory_galleries" href="' + LP + '">' + CTA + '</a>' +
          '</div>' +
        '</div></div>' +
      '</div></div>');
    typeset(band);
    row.after(band);
  }

  // ---- 7 footer, Hilfe -----------------------------------------------------------------
  function markFooterHelp() {
    var head = Array.prototype.find.call(document.querySelectorAll('.footer-service .headline'), function (h) {
      return h.textContent.trim() === 'Hilfe';
    });
    var list = head && head.nextElementSibling;
    if (list) list.setAttribute('data-aa-help', '');
    return list;
  }

  function footerLink() {
    var list = document.querySelector('[data-aa-help]');
    if (!list || list.querySelector('.aa-footer-link')) return;
    var contact = list.querySelector('a[href$="/kontakt/"]');
    var item = el('<li><a class="aa-footer-link" href="' + LP + '">Persönliche Beratung</a></li>');
    if (contact) contact.closest('li').after(item); else list.appendChild(item);
  }

  // ---- review bar ----------------------------------------------------------------------
  var activeSpot = null;

  function spotHref(spot) {
    return spot.page + '?spot=' + spot.n;
  }

  function openGalleriesMenu() {
    // by its menu, not its link: the published copy rewrites shop hrefs to file names
    var details = Array.prototype.find.call(document.querySelectorAll('site-header nav details'), function (d) {
      return d.querySelector('.menu.galleries');
    });
    if (!details) return;
    if (!isDesktop()) {
      var toggle = document.querySelector('site-header .navigation-mobile-toggle');
      if (toggle && !document.querySelector('site-header nav details[open]')) toggle.click();
    }
    details.open = true;
  }

  function focusSpot(spot) {
    if (spot.open === 'galleries') openGalleriesMenu();
    setTimeout(function () {
      var targets = document.querySelectorAll(spot.target);
      var first = Array.prototype.find.call(targets, function (t) { return t.getBoundingClientRect().height > 0; });
      if (first && !first.closest('site-header')) {
        first.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      } else if (first) {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }, spot.open ? 350 : 0);
  }

  function reviewBar() {
    var current = SPOTS.filter(function (s) { return String(s.n) === params.get('spot'); })[0] || null;
    activeSpot = current;
    var bar = el(
      '<nav class="aa-review" aria-label="Art-advisory placements">' +
        '<div class="aa-review__top">' +
          '<span class="aa-review__label">Placements</span>' +
          '<span class="aa-review__spots">' + SPOTS.map(function (s) {
            return '<a class="aa-review__spot" href="' + spotHref(s) + '" data-spot="' + s.n + '" title="' + s.title + '"' +
              (current && current.n === s.n ? ' aria-current="true"' : '') + '>' + s.n + '</a>';
          }).join('') + '</span>' +
          '<button class="aa-review__hide" type="button" aria-expanded="true" aria-label="Collapse review bar">−</button>' +
        '</div>' +
        '<p class="aa-review__note" aria-live="polite"></p>' +
      '</nav>');
    document.body.appendChild(bar);

    var note = bar.querySelector('.aa-review__note');
    function setNote(spot) {
      note.innerHTML = spot
        ? '<strong>' + spot.n + ' · ' + spot.title + '.</strong> ' + spot.note
        : 'Seven entry points to /art-advisory/. Pick a number to jump to one.';
    }
    setNote(current);

    bar.querySelectorAll('.aa-review__spot').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var spot = SPOTS[a.getAttribute('data-spot') - 1];
        if (spot.page !== PATH) return;           // other page: follow the link
        e.preventDefault();
        bar.querySelectorAll('.aa-review__spot').forEach(function (x) { x.removeAttribute('aria-current'); });
        a.setAttribute('aria-current', 'true');
        history.replaceState(null, '', '?spot=' + spot.n);
        setNote(spot);
        focusSpot(spot);
      });
    });

    var hide = bar.querySelector('.aa-review__hide');
    function setCollapsed(collapsed) {
      bar.classList.toggle('is-collapsed', collapsed);
      hide.textContent = collapsed ? '+' : '−';
      hide.setAttribute('aria-expanded', String(!collapsed));
      hide.setAttribute('aria-label', collapsed ? 'Expand review bar' : 'Collapse review bar');
      try { sessionStorage.setItem('aa-review-collapsed', collapsed ? '1' : ''); } catch (e) { /* storage blocked */ }
    }
    hide.addEventListener('click', function () { setCollapsed(!bar.classList.contains('is-collapsed')); });
    try { if (sessionStorage.getItem('aa-review-collapsed')) setCollapsed(true); } catch (e) { /* storage blocked */ }

    // keep clear of the shop's sticky USP footer
    function placeBar() {
      var sticky = document.querySelector('.sticky-footer');
      var h = sticky && getComputedStyle(sticky).display !== 'none' ? sticky.getBoundingClientRect().height : 0;
      bar.style.setProperty('--aa-review-bottom', (h + 12) + 'px');
    }
    placeBar();
    addEventListener('resize', placeBar);
    setTimeout(placeBar, 1500);
  }

  // ---- run --------------------------------------------------------------------------
  function run() {
    markWhyRows();
    markGalleriesIntro();
    markFooterHelp();
    iconSprite();
    headerIcon();
    galleriesEverywhere();
    if (PATH === '/') homepageTile();
    if (PATH === PDP_PATH) pdpLine();
    if (PATH === '/warum-lumas/') whyLumas();
    if (PATH === '/galerien/') galleriesBand();
    footerLink();
    reviewBar();
    if (activeSpot && activeSpot.page === PATH) setTimeout(function () { focusSpot(activeSpot); }, 600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
