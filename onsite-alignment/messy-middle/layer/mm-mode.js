/* Idea 3: A site that reads the mode.
 * PROTO HEADER
 *   ID:          PROTO-2026-MM3
 *   Hypothesis:  [ASSUMPTION] If lumas.de routes each visitor to the help that fits their mode (coming back: their
 *                works; evaluating: the cart in sight and true edition facts; exploring: what collectors choose;
 *                decided: nothing extra), revenue per visitor rises within each mode group, because help is used
 *                when it meets a need (AI Advisor: 44% open from zero results vs 0.7% from a side tab).
 *   Prior:       Decoding Decisions (Google 2020): qualify shoppers as exploring or evaluating; buyer paths 1-24 Nov 2026.
 *   Goals:       primary ATC · secondary mm_mode distribution [UNBOUND]
 *   Variants:    control = ?mm=none | routed (default)
 *   Status:      exploration
 *
 * Signals the shop already has, in priority order:
 *   decided    lands on cart, checkout or account, or ?mm-mode=decided
 *   evaluating something in the cart
 *   returning  works viewed in an earlier visit (the last-seen cookie in production, mm-recent here)
 *   exploring  none of the above: first visit (in production also: paid source and an artist or listing landing)
 * The mode goes on <html data-mm-mode> and into every mm_* event, so GA4 could report revenue per mode.
 */
(function () {
  const B = window.MM;
  if (!B) return;
  const qs = new URLSearchParams(location.search);

  // ?mm-mode= puts the demo into a mode with matching data, then the signals decide as they would live.
  const want = qs.get('mm-mode');
  if (want) {
    B.resetAll();
    if (want === 'returning' || want === 'evaluating') B.seedHistory();
    if (want === 'evaluating') B.store.set('mm-cart', [{ ...B.SEED[0], ts: Date.now() }]);
    if (want === 'decided') B.session.set('mm-decided', '1');
    B.session.set('mm-visit', String(Date.now()));
  }

  function detect() {
    const p = B.path();
    if (B.session.get('mm-decided') || /^\/(cart|checkout|customer|login|order-tracking)\b/.test(p)) return 'decided';
    if (B.cart().length) return 'evaluating';
    if (B.earlierWorks().length) return 'returning';
    return 'exploring';
  }
  function apply() {
    const m = B.on('mode') ? detect() : 'off';
    B.mode = m;
    document.documentElement.dataset.mmMode = m;
    return m;
  }
  const first = apply();
  B.track('mode', { mm_mode: first, mm_page: B.path() });
  // A fresh add to cart moves the visitor into evaluating for the rest of the visit.
  document.addEventListener('mm-cart-add', () => { const was = B.mode; if (apply() !== was) B.track('mode_change', { mm_from: was, mm_to: B.mode }); });
})();
