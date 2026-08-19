/* ============================================================================
   experiments · access gate

   DETERRENT, NOT SECURITY. This is a static site on GitHub Pages: there is no
   server-side auth. The passphrase below is readable in this file, and every
   asset (HTML, images) is still fetchable by direct URL regardless of the gate.
   It stops casual browsing and accidental sharing. It does not protect anything
   from someone who looks.

   For real protection the section has to move behind Cloudflare Access or a
   CloudFront Function doing Basic Auth.

   Change the passphrase here; it applies to every page that loads this file.
============================================================================ */
(function () {
  var PASS = 'lumas2026';
  var KEY  = 'oa-unlocked';

  try { if (sessionStorage.getItem(KEY) === '1') return; } catch (e) { return; }

  var hide = document.createElement('style');
  hide.textContent =
    'html.oa-locked body > *:not(#oa-gate){display:none !important}' +
    'html.oa-locked{background:#1C1A18}' +
    '#oa-gate{position:fixed;inset:0;z-index:2147483647;background:#1C1A18;color:#F4EDE2;' +
      'display:flex;align-items:center;justify-content:center;padding:24px;' +
      'font-family:"Helvetica Now Display",Archivo,Helvetica,Arial,sans-serif}' +
    '#oa-gate form{width:100%;max-width:340px;display:flex;flex-direction:column;gap:14px;text-align:left}' +
    '#oa-gate p{margin:0;font-size:11px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:#908C87}' +
    '#oa-gate input{height:52px;padding:0 16px;border:1px solid #5A5752;border-radius:4px;' +
      'background:#FFF;color:#1C1A18;font:inherit;font-size:16px}' +
    '#oa-gate input:focus{outline:2px solid #F4EDE2;outline-offset:2px}' +
    '#oa-gate button{height:52px;border:0;border-radius:4px;background:#F4EDE2;color:#1C1A18;' +
      'font:inherit;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}' +
    '#oa-gate .err{color:#F4EDE2;font-size:13px;letter-spacing:0;text-transform:none;font-weight:400}';
  document.documentElement.appendChild(hide);
  document.documentElement.className += ' oa-locked';

  function mount() {
    var g = document.createElement('div');
    g.id = 'oa-gate';
    g.innerHTML =
      '<form novalidate>' +
        '<p>LUMAS · Experiments</p>' +
        '<label class="sr" for="oa-pass" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Passphrase</label>' +
        '<input id="oa-pass" type="password" autocomplete="current-password" placeholder="Passphrase" autofocus>' +
        '<button type="submit">Enter</button>' +
        '<p class="err" hidden>Not quite. Try again.</p>' +
      '</form>';
    document.body.appendChild(g);

    var form = g.querySelector('form');
    var input = g.querySelector('input');
    var err = g.querySelector('.err');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (input.value.trim().toLowerCase() === PASS) {
        try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
        g.remove();
        hide.remove();
        document.documentElement.className =
          document.documentElement.className.replace(/\boa-locked\b/, '').trim();
      } else {
        err.hidden = false;
        input.value = '';
        input.focus();
      }
    });
    input.focus();
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
