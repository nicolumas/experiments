/* The offer card behind a door: a work at today's price (or ended), the art drop, or a gift card; then tomorrow's
   door with a reminder file, the newsletter and the way back to the calendar. GAL.offer.init(deps), show(entry, { from }). */
(function (root) {
  'use strict';

  const G = (root.GAL = root.GAL || {});
  let D = null;
  let el = null;
  let current = null;
  let timer = null;

  const h = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) e.append(kid.nodeType ? kid : document.createTextNode(kid));
    return e;
  };

  /* deps: { t, track, lang(), now(), sched, config, fmtNum(n), size(work), onCalendar() } */
  function init(deps) {
    D = deps;
    el = document.getElementById('offer');
    /* a card left open (over midnight, past a drop's end) is redrawn when the tab comes back */
    document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'hidden') refresh(); });
  }

  const dayOf = (iso, lang) => new Intl.DateTimeFormat(lang === 'de' ? 'de-DE' : 'en-GB', lang === 'de' ? { day: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin' } : { day: 'numeric', month: 'long', timeZone: 'Europe/Berlin' })
    .format(new Date(`${iso.slice(0, 10)}T12:00:00+01:00`)).replace(/(\d\d)\.(\d\d)\.?$/, '$1.$2.');

  function art(entry) {
    const src = entry.work ? `assets/art/${entry.work.code}.webp` : entry.image;
    if (!src) return null;
    const img = h('img', { class: 'offer-art', src, alt: entry.work ? `${entry.work.title}, ${entry.work.artist}` : '', draggable: 'false' });
    img.addEventListener('error', () => img.remove());
    return img;
  }

  function body(entry, from) {
    const A = G.advent;
    const { t, config } = D;
    const lang = D.lang();
    const now = D.now();
    const live = A.offerLive(entry, now);
    /* config.discount false (for now): the work at its normal price, without "today only", struck price or code */
    const deal = live && config.discount !== false;
    const w = entry.work;
    const pdp = w ? config.pdpBase + w.path : null;
    const click = (type) => () => D.track('gal_offer_click', { gal_day: entry.day, gal_type: type });
    const by = w ? `${w.artist}${w.signed ? ` · ${t('signedLower')}` : ''}` : null;
    const parts = [from === 'door' ? null : art(entry)];

    if (entry.type === 'work') {
      const note = !live ? t('offerEnded')
        : entry.date === config.orderDeadline ? t('lastDelivery')
          : entry.note === 'artWeekend' ? t('artWeekend', { date: dayOf(config.artWeekend, lang) }) : null;
      parts.push(
        h('p', { class: 'eyebrow' }, deal ? t('offerEyebrow', { n: entry.day, pct: entry.offerPct }) : t('door', { n: entry.day })),
        h('h2', { class: 'display', id: 'offerTitle' }, w.title),
        h('p', { class: 'by' }, by),
        note ? h('p', { class: 'offer-note' }, note) : null,
        deal ? h('p', { class: 'price' }, `${t('from')} ${A.fmtPrice(A.offerPrice(w.ab, entry.offerPct), lang)} `, h('s', {}, A.fmtPrice(w.ab, lang)))
          : h('p', { class: 'price' }, `${t('from')} ${A.fmtPrice(w.ab, lang)}`),
        deal ? code(entry) : null,
        live ? h('a', { class: 'btn offer-cta', href: pdp, onclick: click('work') }, t('secure'))
          : h('a', { class: 'link offer-cta', href: pdp, onclick: click('work_ended') }, t('toWork')));
    } else if (entry.type === 'drop') {
      const [date, time] = entry.endsAt.split('T');
      parts.push(
        h('p', { class: 'eyebrow' }, t('dropEyebrow', { n: entry.day })),
        h('h2', { class: 'display', id: 'offerTitle' }, w.title),
        h('p', { class: 'by' }, by),
        h('p', { class: 'meta' }, `${t('edition', { n: D.fmtNum(w.ed) })} · ${D.size(w)}`),
        h('p', { class: 'offer-note' }, live ? t('dropUntil', { date: dayOf(date, lang), time }) : t('dropEnded')),
        live ? h('p', { class: 'price' }, A.fmtPrice(w.ab, lang)) : null,
        live ? h('a', { class: 'btn offer-cta', href: pdp, onclick: click('drop') }, t('secure')) : null);
    } else if (entry.type === 'giftcard') {
      parts.push(
        h('p', { class: 'eyebrow' }, t('giftEyebrow', { n: entry.day })),
        h('h2', { class: 'display', id: 'offerTitle' }, t('giftTitle')),
        h('p', { class: 'by' }, t('giftLine')),
        h('a', { class: 'btn offer-cta', href: entry.url, onclick: click('giftcard') }, t('giftCta')));
    }
    parts.push(foot(now, lang));
    return parts;
  }

  function code(entry) {
    const { t } = D;
    if (!entry.voucher) return h('p', { class: 'offer-code' }, t('codeLater'));
    const btn = h('button', { class: 'link', type: 'button' }, t('copyCode'));
    btn.addEventListener('click', () => {
      const done = () => { btn.textContent = t('copied'); };
      try { navigator.clipboard.writeText(entry.voucher).then(done, done); } catch (e) { done(); }
      D.track('gal_code_copy', { gal_day: entry.day });
    });
    return h('p', { class: 'offer-code' }, `${t('code')} `, h('b', {}, entry.voucher), ' ', btn);
  }

  /* the sign-up for tomorrow's door: in the demo build nothing is sent; the live build sends the address to the
     Klaviyo list in config.notify and shows no form until that list is set */
  const NOTIFIED = () => ((G.BUILD && G.BUILD.demo) ? 'lumasAdvent.demo.notify' : 'lumasAdvent.notify');
  const notified = () => { try { return localStorage.getItem(NOTIFIED()) === '1'; } catch (e) { return false; } };
  const markNotified = () => { try { localStorage.setItem(NOTIFIED(), '1'); } catch (e) { /* the thank-you still shows */ } };
  async function subscribe(email, n, lang) {
    const res = await fetch(`https://a.klaviyo.com/client/subscriptions/?company_id=${encodeURIComponent(n.companyId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/vnd.api+json', revision: '2024-10-15' },
      body: JSON.stringify({ data: { type: 'subscription', attributes: { custom_source: 'Advent calendar', profile: { data: { type: 'profile', attributes: { email, properties: { advent_lang: lang } } } } }, relationships: { list: { data: { type: 'list', id: n.listId } } } } }),
    });
    if (!res.ok) throw new Error(`klaviyo ${res.status}`);
  }
  function notifyForm(next, lang) {
    const { t, config } = D;
    const demo = !!(G.BUILD && G.BUILD.demo);
    const n = config.notify || {};
    if (!demo && !(n.companyId && n.listId)) return null;
    const done = () => h('p', { class: 'offer-notified' }, t('notifyDone', { n: next.day }));
    if (notified()) return done();
    const input = h('input', { type: 'email', id: 'notifyEmail', name: 'email', autocomplete: 'email', inputmode: 'email', placeholder: t('notifyPlaceholder'), required: true });
    const btn = h('button', { class: 'btn', type: 'submit' }, t('notifyCta'));
    const msg = h('p', { class: 'msg', role: 'status', 'aria-live': 'polite' });
    const privacy = (config.privacyUrl || {})[lang];
    const form = h('form', { class: 'offer-notify', novalidate: true },
      h('label', { for: 'notifyEmail' }, t('notifyLabel', { n: next.day })),
      h('div', { class: 'row' }, input, btn),
      msg,
      h('p', { class: 'fine' }, t('notifyFine'), privacy ? [' ', h('a', { class: 'link', href: privacy }, t('privacy'))] : null));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        msg.textContent = t('notifyInvalid');
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      msg.textContent = '';
      btn.disabled = true;
      try {
        if (!demo) await subscribe(email, n, lang);
        markNotified();
        D.track('gal_notify', { gal_day: next.day });
        form.replaceWith(done());
      } catch (err) {
        btn.disabled = false;
        msg.textContent = t('notifyFail');
      }
    });
    return form;
  }

  /* tomorrow's door (as seen from today): the sign-up, the reminder file, back to the calendar */
  function foot(now, lang) {
    const A = G.advent;
    const { t, config } = D;
    const today = A.todayEntry(D.sched, now);
    const next = today ? A.nextEntry(D.sched, today) : null;
    const remind = next ? h('button', { class: 'link offer-remind', type: 'button', onclick: () => {
      const blob = new Blob([A.icsFor(next, lang, config.pageUrl)], { type: 'text/calendar' });
      const a = h('a', { href: URL.createObjectURL(blob), download: `lumas-tuer-${next.day}.ics` });
      document.body.append(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      D.track('gal_reminder', { gal_day: next.day });
    } }, t('remind')) : null;
    const form = next ? notifyForm(next, lang) : null;
    return h('div', { class: 'offer-foot' },
      form || (next ? h('p', {}, t('tomorrow', { n: next.day })) : null),
      h('div', { class: 'offer-links' },
        remind,
        h('button', { class: 'link offer-calendar', type: 'button', onclick: () => D.onCalendar() }, t('tCalendar'))));
  }

  /* top: where the card starts, just under the revealed work, so the card never covers it */
  function show(entry, { from = 'calendar', top = null } = {}) {
    current = { entry, from, top };
    const space = h('div', { class: `offer-space${from === 'door' && top === null ? ' tall' : ''}` });
    if (top !== null) space.style.height = `${top}px`;
    const card = h('div', { class: 'offer-body' }, body(entry, from));
    /* the card arrives line by line */
    [...card.children].forEach((c, i) => c.style.setProperty('--i', i));
    el.replaceChildren(space, card);
    el.scrollTop = 0;
    el.classList.add('show');
    /* when the offer ends while the card is open, it shows as ended */
    clearTimeout(timer);
    const left = G.advent.endsAtMs(entry) - D.now() + 1000;
    if (G.advent.offerLive(entry, D.now()) && left < 2147483647) timer = setTimeout(refresh, left);
  }
  function hide() { current = null; clearTimeout(timer); if (el) el.classList.remove('show'); }
  const refresh = () => { if (current) show(current.entry, { from: current.from, top: current.top }); };

  G.offer = { init, show, hide, refresh, visible: () => !!current };
})(window);
