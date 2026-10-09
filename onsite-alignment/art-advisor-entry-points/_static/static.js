/* Published static copy only (added by _publish.py, never by serve.py).
 *
 * GitHub Pages cannot capture pages, answer /suggest/ or run production's search, so this stands
 * in for serve.py: window.aaStatic (set inline before this file) carries the captured pages and
 * the recorded suggestions. Shop links to a captured page open it; every other shop link opens
 * live lumas.de in a new tab, so the walk-through is never lost.
 */
(function () {
  const S = window.aaStatic;
  const LIVE = 'https://www.lumas.de';
  const IGNORED = ['from', 'pristine'];

  function pageKey(path) {
    const url = new URL(path, LIVE);
    const params = [...url.searchParams].filter(([k]) => !IGNORED.includes(k))
      .map(([k, v]) => [k, k === 'q' ? v.trim().toLowerCase() : v])
      .sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : (a[0] < b[0] ? -1 : 1)));   // as _publish.py page_key()
    const query = new URLSearchParams(params).toString();
    return url.pathname + (query ? '?' + query : '');
  }

  // a shop path ("/en/search/?q=…") -> the captured file, or null
  function captured(path) {
    if (/[?&]pristine\b/.test(path)) return null;   // "without the layer" = the live page
    const url = new URL(path, LIVE);
    const file = S.pages[pageKey(path)];
    if (!file) return null;
    const from = url.searchParams.get('from');
    return file + (from ? '?from=' + from : '') + url.hash;
  }
  function live(path) {
    const url = new URL(path, LIVE);
    url.searchParams.delete('pristine');
    url.searchParams.delete('from');
    return url.href;
  }

  S.go = path => {
    const file = captured(path);
    if (file) location.href = file;
    else window.open(live(path), '_blank', 'noopener');
  };
  // a shop path -> the captured file to fetch (the layer reads the wish list's cards from one)
  S.fileFor = path => captured(path) || path;
  // for the advisor (same origin, one folder down): its product links
  S.shopLink = path => { const file = captured(path); return file ? '../' + file : live(path); };

  // root-relative shop links, including the ones production and the layer render later
  document.addEventListener('click', e => {
    const a = e.target.closest?.('a[href]');
    const href = a?.getAttribute('href');
    if (!href || !href.startsWith('/') || href.startsWith('//') || e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    S.go(href);
  });
  // any search form production would submit to a server path
  window.addEventListener('submit', e => {
    const form = e.target;
    const action = form.getAttribute('action') || '';
    if (e.defaultPrevented || !/\/search\/?$/.test(action)) return;
    e.preventDefault();
    S.go(action + '?' + new URLSearchParams(new FormData(form)).toString());
  });

  // /suggest/?term= from the recorded answers ([] for anything not typed when the copy was made)
  function suggestion(url) {
    const m = String(url).match(/^(?:https?:\/\/[^/]+)?((?:\/en)?)\/suggest\/?\?(.*)$/);
    if (!m) return null;
    const term = (new URLSearchParams(m[2]).get('term') || '').toLowerCase();
    return JSON.stringify(S.suggest[m[1] + '|' + term] || []);
  }
  const realFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const body = suggestion(typeof input === 'string' ? input : input?.url || '');
    if (body === null) return realFetch(input, init);
    return Promise.resolve(new Response(body, { headers: { 'Content-Type': 'application/json' } }));
  };
  const open = XMLHttpRequest.prototype.open;
  const send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._aaSuggest = suggestion(url);
    return open.call(this, method, this._aaSuggest === null ? url : 'data:application/json,' + encodeURIComponent(this._aaSuggest), ...rest);
  };
  XMLHttpRequest.prototype.send = function (...args) {
    return send.apply(this, this._aaSuggest === null ? args : []);
  };
})();
