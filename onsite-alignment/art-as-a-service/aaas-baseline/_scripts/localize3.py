"""Mirror at.lumas.com pages locally, preserving each asset host's path layout.

Path preservation keeps every relative url() inside the site's own CSS resolving
untouched. Only URLs that were actually downloaded get rewritten, in ONE regex
pass, so navigation links and inline JavaScript are never corrupted.
"""
import os, re, json, shutil
from urllib.parse import urljoin, urlparse, urldefrag
from concurrent.futures import ThreadPoolExecutor
import requests
from bs4 import BeautifulSoup

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
REPO = "/Users/nicolatracey/LUMAS ART Dropbox/Nicola Tracey/Mac (2)/Desktop/CODE/lumassprykerng"
OUT = os.path.join(REPO, "prototype", "aaas-baseline")

BASE = "https://at.lumas.com"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36")
S = requests.Session()
S.headers.update({"User-Agent": UA, "Accept-Language": "de-AT,de;q=0.9",
                  "Referer": BASE + "/"})

HOSTS = ["cdn.lumas.com", "img.lumas.com", "media.lumas.com", "media.lumas.de",
         "at.lumas.com", "fonts.gstatic.com", "use.typekit.net", "p.typekit.net"]
HOST_ALT = "|".join(h.replace(".", r"\.") for h in HOSTS)
ASSET_EXT = r"\.(?:css|js|mjs|woff2?|ttf|eot|otf|png|jpe?g|gif|svg|webp|avif|mp4|webm|ico)"

STRIP = ("cookiebot", "googletagmanager", "google-analytics", "googleadservices",
         "klaviyo", "baqend", "speedkit", "hotjar", "clarity.ms", "facebook.net",
         "doubleclick", "adtribute", "trustedshops", "criteo", "pinterest",
         "tiktok", "snapchat", "adobedtm", "everesttech", "awin", "bing.com")

PAGES = {"pdp.html": BASE + "/pictures/marta_contreras_simo/alikasiara/",
         "checkout.html": BASE + "/checkout/single-page/customer/",
         "account.html": BASE + "/login/"}

def hostdir(h):
    return h.replace(".", "_")

def local_path(url):
    p = urlparse(urldefrag(url)[0])
    path = p.path or "/"
    if path.endswith("/"):
        path += "index.html"
    return hostdir(p.netloc) + "/" + path.lstrip("/")

seen, failed = {}, []

def download(url):
    u = urldefrag(url)[0]
    if u in seen:
        return seen[u]
    if urlparse(u).netloc not in HOSTS:
        return None
    rel = local_path(u)
    dest = os.path.join(OUT, rel)
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        seen[u] = rel
        return rel
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    try:
        r = S.get(u, timeout=90)
        if r.status_code != 200 or not r.content:
            failed.append((u, r.status_code)); return None
        with open(dest, "wb") as f:
            f.write(r.content)
        seen[u] = rel
        return rel
    except Exception as e:
        failed.append((u, str(e)[:50])); return None

# URLs as they appear in markup, and as \/ escaped strings inside inline JSON/JS
RE_PLAIN = re.compile(r'(?:https?:)?//(?:' + HOST_ALT + r')/[^"\'`\s<>)\\]*')
RE_ESCAPED = re.compile(r'https?:\\/\\/(?:' + HOST_ALT + r')(?:\\/[^"\'`\s<>)\\]*)+')

def normalise(raw):
    clean = raw.replace("\\/", "/")
    if clean.startswith("//"):
        clean = "https:" + clean
    return clean.rstrip(",;)'\"`")

def discover(text):
    out = set()
    for rx in (RE_PLAIN, RE_ESCAPED):
        for m in rx.finditer(text):
            c = normalise(m.group(0))
            if re.search(ASSET_EXT + r"(?:\?|$)", c, re.I):
                out.add(c)
    return out

def crawl_css(css_urls):
    queue, done = list(css_urls), set()
    while queue:
        cu = queue.pop()
        if cu in done:
            continue
        done.add(cu)
        rel = seen.get(urldefrag(cu)[0])
        if not rel or not os.path.exists(os.path.join(OUT, rel)):
            continue
        txt = open(os.path.join(OUT, rel), encoding="utf-8", errors="ignore").read()
        refs = [m.group(1).strip("'\" ") for m in re.finditer(r"url\(\s*([^)]+?)\s*\)", txt)]
        refs += [m.group(1) for m in re.finditer(r"@import\s+(?:url\()?['\"]([^'\"]+)", txt)]
        targets = [urljoin(cu, r) for r in refs if not r.startswith("data:")]
        with ThreadPoolExecutor(max_workers=10) as ex:
            list(ex.map(download, targets))

        # root-absolute url(/...) refs would resolve against the server root
        # rather than the mirror, so repoint them relative to this stylesheet
        cssdir = os.path.dirname(os.path.join(OUT, rel))
        def abs_repl(m):
            raw = m.group(1).strip("'\" ")
            if not raw.startswith("/") or raw.startswith("//"):
                return m.group(0)
            tgt = seen.get(urldefrag(urljoin(cu, raw))[0])
            if not tgt:
                return m.group(0)
            return "url(%s)" % os.path.relpath(os.path.join(OUT, tgt), cssdir).replace(os.sep, "/")
        new = re.sub(r"url\(\s*([^)]+?)\s*\)", abs_repl, txt)
        if new != txt:
            open(os.path.join(OUT, rel), "w", encoding="utf-8").write(new)

        queue += [t for t in targets if t.split("?")[0].lower().endswith(".css")]

def webpack_chunks(runtime_url):
    rel = seen.get(urldefrag(runtime_url)[0])
    if not rel:
        return []
    txt = open(os.path.join(OUT, rel), encoding="utf-8", errors="ignore").read()
    urls = []
    for marker, ext in (("r.u=function", "js"), ("miniCssF=function", "css")):
        i = txt.find(marker)
        if i == -1:
            continue
        seg = txt[i:i + 8000]
        dicts = re.findall(r'\{((?:\s*\d+:"[^"]*"\s*,?)+)\}', seg)
        if len(dicts) < 2:
            continue
        names = dict(re.findall(r'(\d+):"([^"]*)"', dicts[0]))
        hashes = dict(re.findall(r'(\d+):"([^"]*)"', dicts[1]))
        # the hash map is the complete chunk list; unnamed chunks are keyed by id
        for cid, h in hashes.items():
            nm = names.get(cid, cid)
            urls.append(f"https://cdn.lumas.com/assets/white/{nm}.{h}.{ext}")
    return urls

def rewrite(html):
    """Single pass: rewrite only URLs we actually mirrored; leave everything else."""
    def make(escaped):
        def repl(m):
            raw = m.group(0)
            clean = normalise(raw)
            rel = seen.get(clean) or seen.get(clean.split("?")[0])
            if not rel:
                return raw
            trailing = raw[len(raw.rstrip(",;)'\"")):]
            return (rel.replace("/", "\\/") if escaped else rel) + trailing
        return repl
    html = RE_ESCAPED.sub(make(True), html)
    html = RE_PLAIN.sub(make(False), html)
    return html

# ---- run -------------------------------------------------------------------
for stale in ("assets",):
    p = os.path.join(OUT, stale)
    if os.path.isdir(p):
        shutil.rmtree(p)

summary = {}
for fname, page_url in PAGES.items():
    src = os.path.join(RAW, fname)
    if not os.path.exists(src):
        continue
    soup = BeautifulSoup(open(src, encoding="utf-8").read(), "html.parser")

    stripped = 0
    for sc in soup.find_all("script", src=True):
        if any(p in sc["src"].lower() for p in STRIP):
            sc.decompose(); stripped += 1
    for lk in soup.find_all("link", href=True):
        if any(p in lk["href"].lower() for p in STRIP):
            lk.decompose(); stripped += 1
    for d in soup.select("dialog.geotargeting-popup"):
        d.decompose(); stripped += 1

    meta = soup.new_tag("meta")
    meta.attrs["name"] = "x-clone-source"
    meta.attrs["content"] = page_url
    if soup.head:
        soup.head.insert(0, meta)

    html = str(soup)

    urls = discover(html)
    with ThreadPoolExecutor(max_workers=10) as ex:
        list(ex.map(download, urls))

    for ru in [u for u in urls if "runtime" in u.lower() and u.split("?")[0].endswith(".js")]:
        extra = webpack_chunks(ru)
        with ThreadPoolExecutor(max_workers=10) as ex:
            list(ex.map(download, extra))
        urls |= set(extra)

    crawl_css([u for u in urls if u.split("?")[0].lower().endswith(".css")])

    html = rewrite(html)
    # webpack builds lazy-chunk URLs from this at runtime; point it at the mirror
    html = re.sub(r'(window\.assetsPublicPath\s*=\s*`)https://cdn\.lumas\.com/assets/(`)',
                  r'\1cdn_lumas_com/assets/\2', html)
    html = re.sub(r'(window\.localAssets\s*=\s*`)/assets/white/(`)',
                  r'\1cdn_lumas_com/assets/white/\2', html)
    with open(os.path.join(OUT, fname), "w", encoding="utf-8") as f:
        f.write(html)
    summary[fname] = {"source": page_url, "stripped": stripped,
                      "bytes": os.path.getsize(os.path.join(OUT, fname))}

total = sum(os.path.getsize(os.path.join(dp, f))
            for dp, _, fs in os.walk(OUT) for f in fs)
print(json.dumps({"pages": summary, "assets": len(seen),
                  "total_mb": round(total / 1048576, 1),
                  "failed": len(failed),
                  "failed_sample": sorted({f"{u} [{c}]" for u, c in failed})[:6]},
                 indent=1, ensure_ascii=False)[:2500])
