"""Generate the AaaS-layered pages from the untouched baseline clone.

The baseline in ../aaas-baseline stays pristine; this only ever reads from it. Each
generated page is the baseline page plus exactly two added tags (aaas.css, aaas.js),
so `diff` against the baseline shows the layer and nothing else.

Assets are not duplicated - the mirrored host folders are referenced in place.

    python3 _build.py
"""
import os, re, shutil
from bs4 import BeautifulSoup

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.abspath(os.path.join(HERE, "..", "aaas-baseline"))
HOSTS = ("cdn_lumas_com", "img_lumas_com", "at_lumas_com", "media_lumas_com")

# placeholder identity on purpose: no real customer data belongs in a shared prototype
ACCOUNT = {
    "data-aaas-account": "",
    "data-name": "Alex",
    "data-gross": "2990",
    "data-months-paid": "14",
    "data-image": "../aaas-baseline/img_lumas_com/showimg_mcs01_full.jpg",
    "data-title": "Alika&Siara",
    "data-artist": "Marta Contreras Simó",
    "data-format": "150 x 150 cm · Kaschierung unter Acrylglas, Stärke 2 mm matt",
    "data-order": "AT-4051288",
    "data-start": "12.07.2025",
    "data-end": "12.07.2028",
    "data-next": "12.10.2026",
}


def repoint_assets(html):
    """Reference the baseline's mirrored assets in place instead of copying 57 MB."""
    alt = "|".join(HOSTS)
    html = re.sub(r'(?<![\w./-])(' + alt + r')/', r'../aaas-baseline/\1/', html)
    html = re.sub(r'(?<![\w./-])(' + alt + r')\\/', r'..\\/aaas-baseline\\/\1\\/', html)
    # A handful of asset URLs stayed absolute through the capture, all of them
    # <use href> references into sprite.svg. Cross-origin <use> is blocked by the
    # browser, so the Trustpilot stars, its wordmark and the quantity +/- icons
    # rendered as empty boxes. Scoped to /assets/ on purpose: rewriting every
    # at.lumas.com URL would turn the page's navigation into local file paths.
    html = html.replace("https://at.lumas.com/assets/",
                        "../aaas-baseline/at_lumas_com/assets/")
    return html


SUCCESS = {
    "data-aaas-success": "",
    "data-gross": "2990",
    "data-order": "2011090008440231",
    "data-image": "../aaas-baseline/img_lumas_com/showimg_mcs01_full.jpg",
    "data-artist": "Marta Contreras Simó",
    "data-title": "Alika&Siara",
    "data-sku": "MCS45",
}


def _ver(name):
    """Version the layer on file mtime. Without this the browser keeps serving a
    cached aaas.css/aaas.js and edits silently never appear."""
    p = os.path.join(HERE, name)
    return int(os.path.getmtime(p)) if os.path.exists(p) else 0


def preload_artwork(soup):
    """Start the main artwork downloading in the head.

    The clone pulls the shop's whole CSS/JS payload before the preview renders,
    so on a cold visit the wall texture paints first and the artwork slot sits
    empty for a beat. A preload puts the image in flight with the stylesheets
    instead of after them. It is the same file the page already requests, so
    nothing extra is fetched.
    """
    if not soup.head:
        return
    # The artwork is not an <img> in the HTML at all: it arrives as a path inside
    # the preview's JSON config, so the browser cannot even start fetching it
    # until the shop's whole JS bundle has parsed and built the element. That is
    # why the slot sits empty on a cold visit. Pull the "full" path out of the
    # config and preload it.
    m = re.search(r'"full":"([^"]*showimg_[^"]*_full\.jpg)"', str(soup))
    if not m:
        return
    src = m.group(1).replace("\\/", "/")
    link = soup.new_tag("link", rel="preload", href=src)
    link.attrs["as"] = "image"
    link.attrs["fetchpriority"] = "high"
    soup.head.insert(0, link)

    # The preload only wins the download; the artwork still cannot appear until
    # the Vue preview mounts, which is a second or two into a cold visit. So the
    # same file is also seeded straight into the empty preview container, where
    # it paints as soon as it arrives and Vue overwrites it on mount.
    holder = soup.select_one("div.pdp-preview-desktop")
    if holder is not None and not holder.contents:
        seed = soup.new_tag("img", src=src)
        seed.attrs["class"] = "aaas-seed"
        seed.attrs["alt"] = ""
        seed.attrs["aria-hidden"] = "true"
        holder.append(seed)


def inject_layer(soup):
    for old in soup.select('link[href^="aaas.css"], script[src^="aaas.js"]'):
        old.decompose()
    if soup.head:
        soup.head.append(soup.new_tag(
            "link", rel="stylesheet", href="aaas.css?v=%d" % _ver("aaas.css")))
    if soup.body:
        s = soup.new_tag("script", src="aaas.js?v=%d" % _ver("aaas.js"))
        s.attrs["defer"] = ""
        soup.body.append(s)


def build(src_name, out_name, transform=None):
    src = os.path.join(BASE, src_name)
    if not os.path.exists(src):
        print("  missing:", src_name)
        return
    soup = BeautifulSoup(open(src, encoding="utf-8").read(), "html.parser")
    if transform:
        transform(soup)
    preload_artwork(soup)
    inject_layer(soup)
    html = repoint_assets(str(soup))
    out = os.path.join(HERE, out_name)
    open(out, "w", encoding="utf-8").write(html)
    print("  %-22s %7.1f KB" % (out_name, os.path.getsize(out) / 1024))


def _swap_main(soup, attrs, title):
    """Replace the page's main content with a render host, keeping the real chrome."""
    host = (soup.find("main")
            or soup.select_one(".content-container")
            or soup.body)
    for child in list(host.children):
        child.extract()
    holder = soup.new_tag("div")
    for k, v in attrs.items():
        holder.attrs[k] = v
    host.append(holder)
    if soup.title:
        soup.title.string = title


def make_account(soup):
    _swap_main(soup, ACCOUNT, "Deine Miete | LUMAS")


def make_success(soup):
    _swap_main(soup, SUCCESS, "Bestellung bestätigt | LUMAS")


print("building AaaS layer from baseline:")
build("pdp.html", "pdp.html")
build("checkout.html", "checkout.html")
build("account.html", "success.html", make_success)
build("account.html", "account-rental.html", make_account)

INDEX = """<!doctype html>
<html lang="de">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Art as a Service - Prototyp</title>
<style>
 /* colours are set explicitly: without a background this page renders
    dark-on-dark for anyone whose browser is in dark mode */
 :root{color-scheme:light}
 html,body{background:#fff;color:#1c1a18}
 body{font:16px/1.6 system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif;
      max-width:760px;margin:0 auto;padding:56px 24px}
 h1{font-weight:400;font-size:30px;margin:0 0 6px}
 p.sub{color:#5a5752;margin:0 0 36px}
 a.card{display:block;border:1px solid rgba(0,0,0,.16);padding:20px 22px;margin-bottom:12px;
        text-decoration:none;color:#1c1a18;background:#fff}
 a.card:hover{border-color:#1c1a18}
 a.card b{display:block;font-weight:600;margin-bottom:3px}
 a.card span{color:#5a5752;font-size:14px}
 .note{margin-top:32px;font-size:13.5px;color:#5a5752;
       border-top:1px solid rgba(0,0,0,.16);padding-top:18px}
 ol{color:#5a5752;font-size:14px;padding-left:20px}
 ol b{color:#1c1a18}
</style>
<h1>Art as a Service</h1>
<p class="sub">Mietstrecke, aufgesetzt auf den unveränderten Klon von at.lumas.com.</p>
<a class="card" href="pdp.html"><b>Produktseite</b><span>Einstieg "Oder mieten ab ..." und die Konditionen im Drawer</span></a>
<a class="card" href="checkout.html"><b>Checkout</b><span>Kontakt, Adresse und Zahlung, wie im Live-Checkout</span></a>
<a class="card" href="success.html"><b>Bestellbestätigung</b><span>Beträge, Termine und der Weg ins Konto. Zeigt Miete oder Kauf, je nach zuletzt gewähltem Modus</span></a>
<a class="card" href="account-rental.html"><b>Kundenkonto: Deine Miete</b><span>Laufzeit, Abbuchungen, Übernahmepreis</span></a>
<p class="note">Am besten der Reihe nach durchklicken:</p>
<ol>
 <li>Auf der Produktseite <b>In den Warenkorb</b>, dann im Warenkorb auf <b>Mieten</b> umschalten.</li>
 <li>Über <b>Zur Kasse</b> in den Checkout, dort die vier Schritte durchgehen.</li>
 <li>Nach der Bestätigung führt der Weg ins Kundenkonto.</li>
</ol>
<p class="note">Alle Beträge sind aus den verbindlichen Konditionen in GLOB-2053 gerechnet:
3,75 % Monatsmiete, Bereitstellungsentgelt in Höhe einer Monatsmiete, 36 Monate Mindestlaufzeit,
80 % Anrechnung bei Übernahme.</p>
"""
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(INDEX)
print("  index.html")
