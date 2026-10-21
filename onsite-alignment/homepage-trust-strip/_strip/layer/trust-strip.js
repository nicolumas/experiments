/*
 * ═══ PROTO HEADER ═══
 * ID:          PROTO-2026-064
 * Hypothesis:  For homepage visitors (all devices, DE first), adding a compact line of
 *              verifiable facts (edition, galleries, collectors, Trustpilot score) directly
 *              under the hero will raise revenue per homepage visitor, because first-time
 *              visitors meet proof of authenticity and scale before they decide whether to
 *              look further, so more of them continue into artworks.
 * Prior:       no insight ledger exists. Memory: 56% of mobile HP sessions never pass 10%
 *              scroll (Clarity, Oct 2026), so every pixel the strip adds above the fold is
 *              paid for by the first artwork row. HP-referred PDP views fell 21% after the
 *              24 Jul layout rollout. Homepage already shows Trustpilot lower down (carousel).
 * Goals:       primary global_revenue_order-placed_capped-3447 (RPV)
 *              secondary visits pdp
 *              guardrails homepage_click_hero-cta, homepage_scroll_50pct, global_custom_purchase,
 *              homepage_click_trust-strip [NEW]
 * Variants:    control (production) | variant (this strip)
 * Status:      exploration
 * ═══
 *
 * The variant layer. Renders the same DOM the Twig partial would render on the server
 * (see README.md, "Implementation"), and inserts it between the hero carousel and the
 * claim block. Copy comes from window.TRUST_STRIP so the review bar can edit it; in
 * production every string is a glossary key and the score is bound to
 * TrustpilotRatingReader, never typed.
 */
(function () {
  'use strict';

  var DEFAULT_COPY = {
    facts: ['19 Galerien weltweit', '330.000 Sammler:innen'],
    // live TrustScore from the TrustBox data API (21 Oct 2026: 4.7 from 5,993 reviews);
    // production binds TrustpilotRatingReader. null shows a labelled placeholder.
    score: '4,7',
    profileUrl: 'https://de.trustpilot.com/review/lumas.de',
    label: 'Über LUMAS',
  };

  // the shop sets window.spriteSvgPath on every page (asset('images/sprite.svg'))
  var SPRITE = window.spriteSvgPath || '/assets/white/images/sprite.svg';

  function track(eventName, params) {
    // prototype stub: maps 1:1 to a dataLayer push in production
    if (window.console) console.info('[track]', eventName, params || {});
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"]/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
    });
  }

  // leading figures ("19", "330.000") carry the fact, so they get the stronger tone
  function factHtml(fact) {
    var match = /^([\d.,]+\+?)(\s+)(.*)$/.exec(fact);
    if (!match) return escapeHtml(fact);
    return '<span class="trust-strip-figure">' + escapeHtml(match[1]) + '</span>' + match[2] + escapeHtml(match[3]);
  }

  function ratingHtml(copy) {
    var hasScore = copy.score !== null && copy.score !== '';
    var score = hasScore
      ? '<span class="trust-strip-figure">' + escapeHtml(copy.score) + '</span>'
      : '<span class="trust-strip-placeholder" title="Platzhalter: Score kommt live aus TrustpilotRatingReader">Score</span>';
    var spoken = hasScore ? 'Trustpilot: ' + copy.score + ' von 5' : 'Trustpilot-Bewertung (Platzhalter)';

    // ABLYFT-GOAL: homepage_click_trust-strip [NEW custom goal, guardrail only: the strip should not pull visitors off-site]
    return (
      '<a class="trust-strip-rating" href="' + escapeHtml(copy.profileUrl) + '" target="_blank" rel="noopener noreferrer"' +
      ' aria-label="' + escapeHtml(spoken) + '">' +
      '<svg class="trust-strip-rating-logo" viewBox="0 0 1132.8 278.2" aria-hidden="true" focusable="false">' +
      '<use href="' + SPRITE + '#trustpilot-logo"></use></svg>' +
      score +
      '</a>'
    );
  }

  function render(copy) {
    var items = copy.facts
      .filter(function (fact) { return fact && fact.trim(); })
      .map(function (fact) { return '<li class="trust-strip-fact">' + factHtml(fact.trim()) + '</li>'; });
    items.push('<li class="trust-strip-fact trust-strip-fact-rating">' + ratingHtml(copy) + '</li>');

    return (
      '<div class="trust-strip" data-section="trust_strip">' +
      '<ul class="trust-strip-facts" aria-label="' + escapeHtml(copy.label) + '">' + items.join('') + '</ul>' +
      '</div>'
    );
  }

  // A fact that wraps to the start of a new line must not carry a separator in front of it.
  function markLineStarts(list) {
    var facts = list.querySelectorAll('.trust-strip-fact');
    var previousTop = null;
    for (var i = 0; i < facts.length; i++) {
      var top = facts[i].offsetTop;
      facts[i].classList.toggle('is-line-start', previousTop === null || top > previousTop + 2);
      previousTop = top;
    }
  }

  function mount() {
    var claim = document.querySelector('#main-content .quote_de.claim');
    if (!claim) return null;

    var existing = document.querySelector('.trust-strip');
    if (existing) existing.remove();

    var copy = Object.assign({}, DEFAULT_COPY, window.TRUST_STRIP || {});
    claim.insertAdjacentHTML('beforebegin', render(copy));

    var strip = document.querySelector('.trust-strip');
    var list = strip.querySelector('.trust-strip-facts');
    markLineStarts(list);
    if (window.ResizeObserver) new ResizeObserver(function () { markLineStarts(list); }).observe(list);

    strip.querySelector('.trust-strip-rating').addEventListener('click', function () {
      track('trust_strip_click', { page_type: 'homepage', element: 'trustpilot' });
    });

    // impression is the exposure event analysts filter on: the strip actually rendered
    if (window.IntersectionObserver) {
      var seen = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          track('trust_strip_view', { page_type: 'homepage', ab_test_name: 'ab_homepage_trust_strip_v1' });
          seen.disconnect();
        }
      }, { threshold: 0.5 });
      seen.observe(strip);
    }
    return strip;
  }

  function unmount() {
    var existing = document.querySelector('.trust-strip');
    if (existing) existing.remove();
  }

  window.TrustStrip = { mount: mount, unmount: unmount };
})();
