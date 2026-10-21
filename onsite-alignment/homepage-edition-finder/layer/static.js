/* PROTO-2026-066 · static mode, published pages only (added by _publish.py, never by serve.py).
   GitHub Pages has no /search/: the finder's count and the previews are answered from
   search-cache.json, captured from live lumas.de for every finder combination and window preset.
   Links into the shop (/artfinder/…, /pictures/…) go to live www.lumas.de. */
(() => {
  'use strict';
  const SHOP = 'https://www.lumas.de';
  const here = new URL('.', location.href).pathname;
  const key = params => {
    const p = new URLSearchParams(params);
    p.delete('is_artfinder');
    // code-point order, as Python's sorted() in _publish.py
    return [...p.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, v]) => `${k}=${v}`).join('&');
  };
  let cache = null;
  const loadCache = () => (cache = cache || fetch(here + 'search-cache.json').then(r => r.json()));

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (url.origin === location.origin && /\/search\/?$/.test(url.pathname)) {
      return loadCache().then(all => {
        const hit = all[key(url.search)];
        return new Response(JSON.stringify(hit || { products: [], numFound: 0 }), {
          status: hit ? 200 : 404,
          headers: { 'Content-Type': 'application/json' }
        });
      });
    }
    if (url.origin === location.origin && /\/suggest\/?$/.test(url.pathname)) {
      return Promise.resolve(new Response('[]', { headers: { 'Content-Type': 'application/json' } }));
    }
    return nativeFetch(input, init);
  };

  // same-origin links outside this folder are shop links that scripts wrote at runtime
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) {
      return;
    }
    const url = new URL(a.getAttribute('href'), location.href);
    if (url.origin === location.origin && !url.pathname.startsWith(here)) {
      a.href = SHOP + url.pathname.replace(/^\/experiments\/onsite-alignment\/[^/]+/, '') + url.search + url.hash;
    }
  }, true);
})();
