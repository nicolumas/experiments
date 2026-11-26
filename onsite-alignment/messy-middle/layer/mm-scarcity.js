/* Idea 6: Scarcity only when true.
 * PROTO HEADER
 *   ID:          PROTO-2026-MM6
 *   Hypothesis:  [ASSUMPTION] Replacing the demand indicator's sell-out claims with the one fact that always holds
 *                (an edition's price rises in steps as it sells), and showing it only to visitors who are already
 *                weighing a work, keeps revenue per product-page visitor level or better, because the paper found
 *                scarcity the weakest of six biases and off-putting to explorers, and 501 sizes now say
 *                "bald ausverkauft" with a median of 15 years left to sell out.
 *   Prior:       PDP urgency indicator red-team 17 Nov 2026 (never tested, live 100%); Edition Register decision:
 *                no copy counts; brandbook s14: no extra urgency layer, no "!".
 *   Goals:       primary ATC, revenue per PDP visitor · secondary demand_view [UNBOUND]
 *   Variants:    ?mm-scar=a today (control) | b the true fact, hidden for explorers (default) | c no indicator
 *   Status:      exploration
 */
(function () {
  const B = window.MM;
  if (!B || !B.on('scarcity')) return;
  const qs = new URLSearchParams(location.search);
  const variant = qs.get('mm-scar') || 'b';   // from the link only, so arms can sit side by side
  if (variant === 'a') return;

  // The fact behind every stage: production raises an edition's price at fixed shares of the edition sold
  // (FrontendProductBuilder::getStage). No copy count, no sell-out claim.
  const TRUE_TEXT = {
    discovery: 'Neue Edition zum Startpreis. Der Preis steigt in Stufen, je mehr Exemplare verkauft sind.',
    popular: 'Der Preis dieser Edition steigt in Stufen, je mehr Exemplare verkauft sind.',
    high: 'Der Preis dieser Edition steigt in Stufen, je mehr Exemplare verkauft sind.',
    last: 'Die letzten Exemplare dieser Edition.',
  };

  function stageOf(di) {
    const a = di.querySelector('.active');
    return a ? [...a.classList].find(k => TRUE_TEXT[k]) : 'popular';
  }

  function apply() {
    const hide = variant === 'c' || B.mode === 'exploring';
    document.documentElement.classList.toggle('mm-scar-hidden', hide);
    if (hide) return;
    document.querySelectorAll('demand-indicator').forEach(di => {
      const p = di.querySelector('p');
      if (p && !p.dataset.mmTrue) { p.textContent = TRUE_TEXT[stageOf(di)]; p.dataset.mmTrue = '1'; }
    });
  }

  // The social proof bar can rotate to "Preis steigt in N Editionen", a copy count; one truthful line is enough.
  function quietProofBar() {
    document.querySelectorAll('social-proof-bar').forEach(bar => {
      bar.setAttribute('data-edition-eligible', '');
      bar.setAttribute('data-copies-until-price-rise', '0');
      new MutationObserver(() => {
        bar.classList.toggle('mm-hide-count', /Preis steigt in/.test(bar.textContent));
      }).observe(bar, { childList: true, subtree: true, characterData: true });
    });
  }

  B.ready(() => {
    if (!document.querySelector('demand-indicator')) return;
    quietProofBar();
    apply();
    // production swaps the visible indicator per size; keep every one truthful
    new MutationObserver(apply).observe(document.querySelector('.pdp-container') || document.body, { childList: true, subtree: true });
    B.track('demand_view', { mm_variant: variant, mm_hidden: document.documentElement.classList.contains('mm-scar-hidden') });
  });
  document.addEventListener('mm-cart-add', apply);
})();
