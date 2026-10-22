/* Published static copy only (added by _publish.py, never by serve.py).
 *
 * Adapted from prototype/advisor-entry-points/_static/static.js. GitHub Pages cannot capture
 * pages or answer /suggest/, so this stands in for serve.py: window.aaStatic (set inline before
 * this file) maps the captured shop paths to their files. Shop links to a captured page open it
 * (keeping the review bar's ?spot=N); every other shop link opens live lumas.de in a new tab.
 */
(function () {
  const S = window.aaStatic;
  const LIVE = 'https://www.lumas.de';
  const IGNORED = ['spot', 'pristine'];

  function pageKey(path) {
    const url = new URL(path, LIVE);
    const params = [...url.searchParams].filter(([k]) => !IGNORED.includes(k))
      .sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : (a[0] < b[0] ? -1 : 1)));   // as _publish.py page_key()
    const query = new URLSearchParams(params).toString();
    return url.pathname + (query ? '?' + query : '');
  }

  // a shop path ("/warum-lumas/?spot=5") -> the captured file, or null
  function captured(path) {
    if (/[?&]pristine\b/.test(path)) return null;   // "without the layer" = the live page
    const url = new URL(path, LIVE);
    const file = S.pages[pageKey(path)];
    if (!file) return null;
    const spot = url.searchParams.get('spot');
    return file + (spot ? '?spot=' + spot : '') + url.hash;
  }
  function live(path) {
    const url = new URL(path, LIVE);
    url.searchParams.delete('pristine');
    url.searchParams.delete('spot');
    return url.href;
  }

  S.go = path => {
    const file = captured(path);
    if (file) location.href = file;
    else window.open(live(path), '_blank', 'noopener');
  };

  // root-relative shop links, including the ones production and the layer render later
  document.addEventListener('click', e => {
    const a = e.target.closest?.('a[href]');
    const href = a?.getAttribute('href');
    if (!href || !href.startsWith('/') || href.startsWith('//') || e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    S.go(href);
  });
  // a search submits to live lumas.de
  window.addEventListener('submit', e => {
    const form = e.target;
    const action = form.getAttribute('action') || '';
    if (e.defaultPrevented || !/\/search\/?$/.test(action)) return;
    e.preventDefault();
    S.go(action + '?' + new URLSearchParams(new FormData(form)).toString());
  });

  // /suggest/?term= has no server here: an empty list keeps the search field quiet
  function isSuggest(url) {
    return /^(?:https?:\/\/[^/]+)?(?:\/en)?\/suggest\/?\?/.test(String(url));
  }
  const realFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (!isSuggest(typeof input === 'string' ? input : input?.url || '')) return realFetch(input, init);
    return Promise.resolve(new Response('[]', { headers: { 'Content-Type': 'application/json' } }));
  };
  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    return open.call(this, method, isSuggest(url) ? 'data:application/json,[]' : url, ...rest);
  };
})();
