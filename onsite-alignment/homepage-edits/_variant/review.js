/* Review bar (prototype only): switch arms, read the notes, watch the tracking stubs fire.
   Press "v" to cycle through the arms. Add ?nobar to hide it, e.g. for usability sessions. */
(function () {
  if (/[?&]nobar\b/.test(location.search)) return;
  var arm = window.HM_ARM || 'control';
  var ARMS = [['control', 'A Kontrolle'], ['variant', 'B Variante'], ['cms', 'C CMS']];
  var at = ARMS.findIndex(function (a) { return a[0] === arm; });
  var next = ARMS[(at + 1) % ARMS.length][0] + '.html';
  var bar = document.createElement('div');
  bar.className = 'hm-bar';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Prototyp-Steuerung');
  bar.innerHTML =
    '<div class="hm-bar__arms" role="group" aria-label="Testarm">' +
    ARMS.map(function (a) {
      return '<a href="' + a[0] + '.html' + location.hash + '"' + (arm === a[0] ? ' aria-current="page"' : '') + '>' + a[1] + '</a>';
    }).join('') +
    '</div>' +
    '<button type="button" class="hm-bar__log-toggle" aria-expanded="false">Events <span class="hm-bar__count">0</span></button>' +
    '<a class="hm-bar__notes" href="notes.html">Notizen</a>' +
    '<ol class="hm-bar__log" hidden></ol>';
  document.body.appendChild(bar);

  var toggle = bar.querySelector('.hm-bar__log-toggle');
  var list = bar.querySelector('.hm-bar__log');
  var count = bar.querySelector('.hm-bar__count');
  toggle.addEventListener('click', function () {
    var open = list.hidden;
    list.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  });
  function render(payload) {
    var li = document.createElement('li');
    var p = Object.assign({}, payload);
    var ev = p.event; delete p.event;
    li.innerHTML = '<b></b> <code></code>';
    li.firstChild.textContent = ev;
    li.lastChild.textContent = JSON.stringify(p);
    list.insertBefore(li, list.firstChild);
    while (list.children.length > 30) list.removeChild(list.lastChild);
    count.textContent = (window.hmTrackLog || []).length;
  }
  (window.hmTrackLog || []).forEach(function (r) { render(r.payload); });
  document.addEventListener('hm-track', function (e) { render(e.detail); });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'v' || e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    location.href = next + location.hash;
  });
})();
