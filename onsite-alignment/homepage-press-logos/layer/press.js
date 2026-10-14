/*
 * "Bekannt aus" press strip: one placement x one treatment at a time.
 *
 *   PressStrip.render({ placement, treatment })
 *
 * Placements: bottom (today), hero (under the hero carousel), claim (under the
 * H1 and the AD quote), quote (in place of the AD quote), tiles (under the three
 * campaign tiles, above the Bestseller rail), proof (above the Trustpilot
 * carousel), sticky (inside the desktop sticky USP bar).
 * Treatments: live (production markup, only moved), row, rules, band, ticker.
 *
 * The logo list is read from production's own block, so the strip shows
 * whatever the store's CMS block lists. Only the names and the optical sizing
 * come from the table below.
 */
(function () {
  'use strict';

  // r = viewBox width / height of the file on media.lumas.de.
  // k = optical correction on top of the area rule: heavy marks (AD's Didone,
  // Vogue) come down, hairline marks (FAZ blackletter, Zeit) go up.
  var LOGOS = {
    wohnen: { name: 'Schöner Wohnen', r: 2.625, k: 1.0 },
    frankfurter: { name: 'Frankfurter Allgemeine Zeitung', r: 7.281, k: 1.1 },
    ad: { name: 'AD Architectural Digest', r: 1.484, k: 0.84 },
    vogue: { name: 'Vogue', r: 3.953, k: 0.9 },
    weltkunst: { name: 'Weltkunst', r: 5.881, k: 1.0 },
    elle: { name: 'Elle Decoration', r: 2.375, k: 0.96 },
    zeit: { name: 'Die Zeit', r: 7.078, k: 1.06 },
  };
  // Height falls with the square root of the aspect ratio would give every
  // mark the same area; 0.45 keeps very wide wordmarks from shrinking too far.
  var AREA_EXPONENT = 0.45;
  var STICKY_PICK = ['ad', 'vogue', 'elle', 'zeit'];
  // read while this script runs; currentScript is null once execution has finished
  var SCRIPT_URL = document.currentScript.src;
  var LABEL = 'Bekannt aus';

  // Production's Vue app compiles the page in place and replaces its nodes, so
  // nothing here is cached: every render finds production's block again, and a
  // marker left at its home position (created after Vue has mounted) is how
  // reset() puts it back. Call render() only after window load.
  var HOME = 'data-press-home';

  function findOriginal() {
    // the press block is the first logo slider; the clients' block follows it
    var slider = document.querySelector('.slider-object');
    if (!slider) return null;
    var logosRow = slider.closest('.row');
    var headingRow = logosRow.previousElementSibling;
    var home = document.querySelector('[' + HOME + ']');
    if (!home) {
      home = document.createElement('template');
      home.setAttribute(HOME, '');
      headingRow.parentNode.insertBefore(home, headingRow);
    }
    return {
      heading: headingRow,
      logos: logosRow,
      home: home,
      items: Array.prototype.map.call(slider.querySelectorAll('img'), function (img) {
        var src = img.getAttribute('src');
        var key = src.split('/').pop().replace(/\.svg$/, '');
        var known = LOGOS[key] || { name: img.alt, r: 3, k: 1 };
        return { key: key, src: src, name: known.name, r: known.r, k: known.k };
      }),
    };
  }

  function el(tag, cls, attrs) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    Object.keys(attrs || {}).forEach(function (name) {
      node.setAttribute(name, attrs[name]);
    });
    return node;
  }

  function logoItem(item, hidden) {
    var li = el('li', 'press__item');
    var img = el('img', 'press__logo', {
      src: item.src,
      alt: hidden ? '' : item.name,
      decoding: 'async',
    });
    var factor = item.k * Math.pow(item.r, -AREA_EXPONENT);
    img.style.setProperty('--f', factor.toFixed(4));
    img.style.setProperty('--r', item.r);
    li.appendChild(img);
    if (hidden) li.setAttribute('aria-hidden', 'true');
    return li;
  }

  function buildStrip(treatment, items) {
    var section = el('section', 'press press--' + treatment, { 'aria-label': LABEL, 'data-press': '' });
    var inner = el('div', 'press__inner');
    var label = el('p', 'press__label');
    label.textContent = LABEL;
    inner.appendChild(label);

    var list = el('ul', 'press__logos', { role: 'list' });
    items.forEach(function (item) {
      list.appendChild(logoItem(item, false));
    });

    if (treatment === 'ticker') {
      // Second copy makes the loop seamless; it is hidden from assistive tech.
      items.forEach(function (item) {
        list.appendChild(logoItem(item, true));
      });
      var viewport = el('div', 'press__viewport');
      viewport.appendChild(list);
      inner.appendChild(viewport);
    } else {
      inner.appendChild(list);
    }
    section.appendChild(inner);
    return section;
  }

  function buildSticky(items) {
    var p = el('p', 'press-sticky', { 'data-press': '' });
    var label = el('span', 'press-sticky__label');
    label.textContent = LABEL;
    p.appendChild(label);
    items
      .filter(function (item) {
        return STICKY_PICK.indexOf(item.key) !== -1;
      })
      .forEach(function (item) {
        var img = el('img', 'press-sticky__logo', { src: item.src, alt: item.name });
        img.style.setProperty('--f', (item.k * Math.pow(item.r, -AREA_EXPONENT)).toFixed(4));
        img.style.setProperty('--r', item.r);
        p.appendChild(img);
      });
    return p;
  }

  function claims() {
    return document.querySelectorAll('.quote_de.claim');
  }

  function insertBefore(node, ref) {
    ref.parentNode.insertBefore(node, ref);
  }

  function insertAfter(node, ref) {
    ref.parentNode.insertBefore(node, ref.nextSibling);
  }

  function anchorFor(placement, o) {
    var c = claims();
    switch (placement) {
      case 'hero':
        return { ref: c[0], where: 'before' };
      case 'claim':
      case 'quote':
        return { ref: c[c.length - 1], where: 'after' };
      case 'tiles':
        // after the tiles row, so the hairline above Bestseller still closes the strip
        return { ref: document.querySelector('[data-section="campaign_tiles"]').closest('.row'), where: 'after' };
      case 'proof':
        return { ref: document.querySelector('iframe[src*="trustpilot"]').closest('.row'), where: 'before' };
      default:
        return { ref: o.heading, where: 'before' };
    }
  }

  function reset() {
    var o = findOriginal();
    if (!o) return;
    // put production's own block back where it came from, then drop ours
    o.home.after(o.heading, o.logos);
    Array.prototype.forEach.call(document.querySelectorAll('[data-press]'), function (node) {
      node.remove();
    });
    o.heading.hidden = false;
    o.logos.hidden = false;
    var root = document.documentElement;
    root.removeAttribute('data-press-placement');
    root.removeAttribute('data-press-treatment');
  }

  function render(state) {
    reset();
    var o = findOriginal();
    if (!o) return null;
    var root = document.documentElement;
    root.setAttribute('data-press-placement', state.placement);
    root.setAttribute('data-press-treatment', state.treatment);

    if (state.placement === 'sticky') {
      var bar = document.querySelector('.sticky-footer-content');
      var sticky = buildSticky(o.items);
      bar.appendChild(sticky);
      return sticky;
    }

    var anchor = anchorFor(state.placement, o);
    var place = anchor.where === 'before' ? insertBefore : insertAfter;

    if (state.treatment === 'live') {
      if (state.placement === 'bottom') return o.logos;
      var wrap = el('div', 'press press--live', { 'data-press': '' });
      wrap.appendChild(o.heading);
      wrap.appendChild(o.logos);
      place(wrap, anchor.ref);
      return wrap;
    }

    o.heading.hidden = true;
    o.logos.hidden = true;

    if (CMS_FRAGMENTS[state.treatment]) {
      var cms = el('div', CMS_WRAPPER[state.placement] || '', { 'data-press': '' });
      cms.innerHTML = fragments[state.treatment];
      place(cms, anchor.ref);
      return cms;
    }

    var strip = buildStrip(state.treatment, o.items);
    place(strip, anchor.ref);
    return strip;
  }

  // The CMS versions: prototype/cms/<name>.twig as the server renders it with the
  // cms-page skill's own token substitution. They carry no .press class, so no layer
  // CSS reaches them: what shows is shop CSS only, the proof that the fragment works.
  var CMS_FRAGMENTS = {
    'cms-row': 'homepage-main-presse',
    'cms-rules': 'homepage-main-presse-rules',
    'cms-band': 'homepage-main-presse-band',
  };
  // the spacing classes homepage-main would put on the include's wrapper there
  var CMS_WRAPPER = { tiles: 'mt-2', proof: 'mt-5 pt-2' };
  // ../cms/ next to this script: /_press/cms/ when served, <slug>/cms/ when published
  var CMS_BASE = new URL('../cms/', SCRIPT_URL);
  var fragments = {};

  function preload() {
    return Promise.all(
      Object.keys(CMS_FRAGMENTS).map(function (treatment) {
        return fetch(new URL(CMS_FRAGMENTS[treatment] + '.html', CMS_BASE))
          .then(function (response) {
            return response.text();
          })
          .then(function (html) {
            fragments[treatment] = html;
          });
      })
    );
  }

  window.PressStrip = { render: render, reset: reset, preload: preload };
})();
