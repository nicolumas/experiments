/*
 * The chosen homepage logo strips, exactly as the CMS will render them:
 *
 *   "Bekannt aus" (homepage-main-presse)        ivory band, moved above Trustpilot
 *   "Weltweites Vertrauen ..." (homepage-main-kunden)   on white, where it is today
 *
 * Both are prototype/cms/*.twig rendered with the cms-page skill's own token
 * substitution, so everything on screen is shop CSS only. This script does no
 * styling: it makes the same edits to the page that the install note makes to
 * homepage-main (move the press include, wrap it in mt-5 pt-5, delete the hairline
 * above Trustpilot) and swaps both blocks' content for the new fragments.
 */
(function () {
  'use strict';

  // ../cms/ next to this script: /_press/cms/ when served, <slug>/cms/ when published
  var CMS_BASE = new URL('../cms/', document.currentScript.src);

  function fragment(name) {
    return fetch(new URL(name + '.html', CMS_BASE)).then(function (response) {
      return response.text();
    });
  }

  // a block today = its heading row + the row holding its logo slider
  function rows(slider) {
    var logos = slider.closest('.row');
    return [logos.previousElementSibling, logos];
  }

  function nodes(html) {
    var holder = document.createElement('div');
    holder.innerHTML = html;
    return Array.prototype.slice.call(holder.childNodes);
  }

  function install(pressHtml, clientsHtml) {
    // today the press block is the first logo slider, the clients' block the second
    var sliders = document.querySelectorAll('.slider-object');
    var oldPress = rows(sliders[0]);
    var oldClients = rows(sliders[1]);

    // press: out of the bottom wrapper, in above Trustpilot in place of the hairline
    var trustpilot = document.querySelector('iframe[src*="trustpilot"]').closest('.row');
    var hairline = trustpilot.previousElementSibling;
    var wrapper = document.createElement('div');
    wrapper.className = 'mt-5 pt-5';
    wrapper.innerHTML = pressHtml;
    trustpilot.before(wrapper);
    if (hairline && hairline.tagName === 'HR') hairline.remove();
    oldPress.forEach(function (row) {
      row.remove();
    });

    // clients: new content in place
    oldClients[0].before.apply(oldClients[0], nodes(clientsHtml));
    oldClients.forEach(function (row) {
      row.remove();
    });
  }

  // Production's Vue app re-renders the page in place after DOMContentLoaded and
  // replaces anything inserted earlier, so this runs after load.
  function start() {
    Promise.all([fragment('homepage-main-presse'), fragment('homepage-main-kunden')]).then(function (html) {
      install(html[0], html[1]);
    });
  }

  if (document.readyState === 'complete') start();
  else addEventListener('load', start);
})();
