/* Tracking stubs, shared by all arms. Each call is named after the GA4 event it becomes.
   Prototype mode: pushes to window.dataLayer (an empty shim here, GTM is stripped) and logs.
   Parameter names reuse dimensions already registered in GA4 (section, artwork_properties,
   collection_clicked, editorial_clicked, artist_tile_clicked), because the DE property has no
   free event-scoped custom-dimension slot. */
(function () {
  var arm = window.HM_ARM || 'control';
  window.dataLayer = window.dataLayer || [];
  var log = (window.hmTrackLog = []);

  window.hmTrack = function (event, params) {
    var payload = Object.assign({ event: event }, params || {});
    window.dataLayer.push(payload);
    log.push({ t: new Date(), payload: payload });
    if (window.console) console.info('[track]', event, params || {});
    document.dispatchEvent(new CustomEvent('hm-track', { detail: payload }));
  };

  // Arm C is CMS only: no script of its own, so it reports only what the shop's shipped
  // tracking.js sends. A link's data-cta becomes editorial_click (section "Campaign Tiles"
  // outside block-tiles, the tile block's humanised data-section inside one); a grid's works
  // become select_item with the page path as item_list_name. Opening a <details> sends nothing.
  if (arm === 'cms') {
    document.addEventListener('click', function (e) {
      var card = e.target.closest('product-card');
      if (card) {
        var product = JSON.parse(card.getAttribute('data-product') || '{}');
        window.hmTrack('select_item', { ecommerce: { items: [{ item_id: product.first_concrete_sku, item_name: product.abstract_name, item_list_name: location.pathname }] } });
        return;
      }
      var a = e.target.closest('a[href]');
      if (!a) return;
      var tiles = a.closest('.block-tiles[data-section]');
      var cta = a.getAttribute('data-cta');
      if (tiles) {
        var name = tiles.getAttribute('data-section').replace(/_/g, ' ');
        window.hmTrack('editorial_click', { section: name.charAt(0).toUpperCase() + name.slice(1), editorial_clicked: cta || 'Tile' });
      } else if (cta) {
        window.hmTrack('editorial_click', { section: 'Campaign Tiles', editorial_clicked: cta });
      }
    }, true);
    return;
  }

  // Reach of named sections: once per page view, when half of the section's first screen is visible.
  // Same keys in arms A and B (production's own data-section values), so reach is comparable even
  // though the pages differ in length.
  var CONTROL_SECTIONS = {
    campaign_tiles: '[data-section="campaign_tiles"]',
    bestseller: '[data-section="bestseller"]',
    edition_finder: 'edition-finder',
    last_prints: '[data-section="last_prints"]',
    our_sizes: '[data-section="our_sizes"]',
    new_arrivals: '[data-section="new_arrivals"]',
    artist_top20: '[data-section="artist_top20"]',
    our_story: '[data-section="our_story"]',
    newsletter: '.newsletter-signup',
  };
  function sectionNodes() {
    if (arm === 'variant') {
      return Array.prototype.map.call(document.querySelectorAll('#hm-page > section[data-section]'), function (el) {
        return [el.dataset.section, el];
      });
    }
    return Object.keys(CONTROL_SECTIONS).map(function (key) {
      var all = document.querySelectorAll(CONTROL_SECTIONS[key]);
      var shown = Array.prototype.filter.call(all, function (el) { return el.getClientRects().length > 0; });
      return [key, shown[0] || all[0]];
    }).filter(function (p) { return p[1]; });
  }
  var seen = {};
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var key = en.target.getAttribute('data-hm-reach');
      var visible = en.intersectionRect.height;
      var need = Math.min(en.boundingClientRect.height, window.innerHeight) * 0.5;
      if (!seen[key] && visible >= need && visible > 0) {
        seen[key] = true;
        window.hmTrack('homepage_section_view', { section: key, ab_test_variant: arm });
      }
    });
  }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });
  // Re-run after production's Vue mount replaces the nodes (see hm.js).
  var watched = new WeakSet();
  function observe() {
    io.disconnect();
    sectionNodes().forEach(function (p) {
      p[1].setAttribute('data-hm-reach', p[0]);
      watched.add(p[1]);
      io.observe(p[1]);
    });
  }
  window.hmObserveSections = observe;
  var tick = 0;
  new MutationObserver(function () {
    if (tick) return;
    tick = setTimeout(function () {
      tick = 0;
      var stale = sectionNodes().some(function (p) { return !watched.has(p[1]); });
      if (stale) observe();
    }, 50);
  }).observe(document.documentElement, { childList: true, subtree: true });

  // Clicks in the variant. Artwork tiles keep the control's event (carousel_artwork_click) and
  // section keys so per-section clicks compare across arms; select_item carries the edit as
  // item_list_name instead of production's "/".
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-hm-kind]');
    if (!a) return;
    var section = a.getAttribute('data-hm-section');
    var name = a.getAttribute('data-hm-name');
    var expanded = !!a.closest('.hm-more');
    var kind = a.getAttribute('data-hm-kind');
    if (kind === 'artwork') {
      window.hmTrack('carousel_artwork_click', { section: section, artwork_properties: { artwork_id: a.getAttribute('data-hm-id') }, revealed: expanded });
      window.hmTrack('select_item', { ecommerce: { items: [{ item_id: a.getAttribute('data-hm-id'), item_name: name, item_list_name: 'home:' + section + (expanded ? ':revealed' : '') }] } });
    } else if (kind === 'collection') {
      window.hmTrack('collection_click', { section: section, collection_clicked: name });
    } else if (kind === 'artist') {
      window.hmTrack('artist_tile_click', { section: section, artist_tile_clicked: name });
    } else if (kind === 'view_all') {
      window.hmTrack('edit_view_all', { section: section });
    } else {
      window.hmTrack('editorial_click', { section: section, editorial_clicked: name });
    }
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe);
  else observe();
})();
