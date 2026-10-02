/*
 * Stand-in for the LiveChat widget on lumas.de. NOT CONNECTED: no request
 * leaves this page, nothing reaches the support desk. It reproduces the
 * production widget's two states (greeting card, open window) so graphics
 * can be tested in place.
 *
 * Swap graphics and copy in CHAT_CONFIG below, or override from the
 * console / another script before this file loads:
 *   window.CHAT_CONFIG = { avatar: '_chat/my-avatar.png' }
 *
 * URL switches:  ?chat=open   start with the window open
 *                ?chat=closed start with only the launcher bubble
 *                ?chat=off    no widget at all
 */
(function () {
  var CHAT_CONFIG = Object.assign({
    agentName: 'Alexandra - Beratung',
    avatar: '_chat/agent-avatar.jpeg',
    launcherIcon: '',          // image URL; empty = default speech-bubble glyph
    windowBackground: '',      // image URL behind the open window; empty = frosted glass
    greeting: 'Hallo! Lass uns Deine perfekte LUMAS-Edition finden. Wonach suchst Du heute?',
    quickReply: 'Live Chat starten',
    placeholder: 'Nachricht schreiben…',
    demoReply: 'Demo-Chat: nicht mit dem Kundenservice verbunden.',
    accent: '#111111',
    side: 'left'               // production docks bottom-left
  }, window.CHAT_CONFIG || {});

  var mode = new URLSearchParams(location.search).get('chat') || 'card';
  if (mode === 'off') return;

  var ICON = {
    bubble: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 12h12"/></svg>',
    dots: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    smile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>'
  };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function launcherGlyph() {
    return CHAT_CONFIG.launcherIcon
      ? '<img src="' + esc(CHAT_CONFIG.launcherIcon) + '" alt="">'
      : ICON.bubble;
  }

  var root = document.createElement('div');
  root.id = 'demo-chat';
  root.setAttribute('data-side', CHAT_CONFIG.side);
  root.setAttribute('data-state', mode === 'open' ? 'open' : mode === 'closed' ? 'closed' : 'card');
  root.style.setProperty('--demo-chat-accent', CHAT_CONFIG.accent);
  if (CHAT_CONFIG.windowBackground) {
    root.style.setProperty('--demo-chat-window-bg', 'url("' + CHAT_CONFIG.windowBackground + '")');
  }

  root.innerHTML =
    // greeting card (production's minimised state)
    '<section class="dc-card" aria-label="Chat">' +
      '<header class="dc-card-head">' +
        '<span class="dc-agent"><span class="dc-agent-icon">' + launcherGlyph() + '</span>' +
        '<span class="dc-agent-name">' + esc(CHAT_CONFIG.agentName) + '</span></span>' +
        '<button type="button" class="dc-icon-btn" data-act="dismiss" aria-label="Schließen">' + ICON.close + '</button>' +
      '</header>' +
      '<div class="dc-card-body" data-act="open">' +
        '<p>' + esc(CHAT_CONFIG.greeting) + '</p>' +
        '<button type="button" class="dc-card-cta" data-act="open">' + esc(CHAT_CONFIG.quickReply) + '</button>' +
      '</div>' +
    '</section>' +
    // small launcher (after the card is dismissed)
    '<button type="button" class="dc-launcher" data-act="open" aria-label="Chat öffnen">' + launcherGlyph() + '</button>' +
    // open window
    '<section class="dc-window" role="dialog" aria-label="Chat">' +
      '<header class="dc-window-head">' +
        '<button type="button" class="dc-icon-btn dc-soft" aria-label="Menü">' + ICON.dots + '</button>' +
        '<span class="dc-pill"><span class="dc-pill-avatar"><img src="' + esc(CHAT_CONFIG.avatar) + '" alt=""><i></i></span>' +
        '<span class="dc-pill-name">' + esc(CHAT_CONFIG.agentName) + '</span></span>' +
        '<button type="button" class="dc-icon-btn dc-soft" data-act="minimize" aria-label="Minimieren">' + ICON.minus + '</button>' +
      '</header>' +
      '<div class="dc-thread">' +
        '<div class="dc-msg dc-msg-agent"><span class="dc-msg-icon">' + launcherGlyph() + '</span>' +
        '<p>' + esc(CHAT_CONFIG.greeting) + '</p></div>' +
      '</div>' +
      '<div class="dc-quick"><button type="button" data-act="quick">' + esc(CHAT_CONFIG.quickReply) + '</button></div>' +
      '<form class="dc-composer">' +
        '<button type="button" class="dc-icon-btn dc-soft" aria-label="Anhang">' + ICON.plus + '</button>' +
        '<input type="text" placeholder="' + esc(CHAT_CONFIG.placeholder) + '" aria-label="Nachricht">' +
        '<button type="button" class="dc-icon-btn" aria-label="Emoji">' + ICON.smile + '</button>' +
        '<button type="submit" class="dc-icon-btn dc-send" aria-label="Senden">' + ICON.send + '</button>' +
      '</form>' +
      '<footer class="dc-powered">Powered by <b><span class="dc-lc-mark"></span>LiveChat</b> · Demo, nicht verbunden</footer>' +
    '</section>';

  var thread = root.querySelector('.dc-thread');
  var input = root.querySelector('.dc-composer input');
  var sendBtn = root.querySelector('.dc-send');

  function setState(s) { root.setAttribute('data-state', s); if (s === 'open') input.focus({ preventScroll: true }); }
  function addMsg(text, who) {
    var row = document.createElement('div');
    row.className = 'dc-msg dc-msg-' + who;
    row.innerHTML = (who === 'agent' ? '<span class="dc-msg-icon">' + launcherGlyph() + '</span>' : '') +
      '<p>' + esc(text) + '</p>';
    thread.appendChild(row);
    thread.scrollTop = thread.scrollHeight;
  }
  function visitorSays(text) {
    if (!text.trim()) return;
    addMsg(text, 'visitor');
    setTimeout(function () { addMsg(CHAT_CONFIG.demoReply, 'agent'); }, 700);
  }

  root.addEventListener('click', function (e) {
    var act = e.target.closest('[data-act]');
    if (!act) return;
    var a = act.getAttribute('data-act');
    if (a === 'open') setState('open');
    if (a === 'dismiss') { e.stopPropagation(); setState('closed'); }
    if (a === 'minimize') setState('closed');
    if (a === 'quick') { act.parentNode.remove(); visitorSays(CHAT_CONFIG.quickReply); }
  });
  root.querySelector('.dc-composer').addEventListener('submit', function (e) {
    e.preventDefault();
    visitorSays(input.value);
    input.value = '';
    sendBtn.disabled = true;
  });
  input.addEventListener('input', function () { sendBtn.disabled = !input.value.trim(); });
  sendBtn.disabled = true;

  // the page's own "Live-Chat" links call LiveChatWidget.call('maximize');
  // answer them with this stand-in instead of the real widget
  window.LiveChatWidget = {
    call: function (cmd) {
      if (cmd === 'maximize') setState('open');
      if (cmd === 'minimize') setState('closed');
      if (cmd === 'hide') root.hidden = true;
    },
    on: function () {}, once: function () {}, off: function () {}, get: function () {}, init: function () {}
  };
  // header "Contact" menu links straight to direct.lc.chat; keep it on the page
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href*="lc.chat"], a[href*="livechatinc"]');
    if (a) { e.preventDefault(); setState('open'); }
  }, true);

  function mount() { document.body.appendChild(root); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
