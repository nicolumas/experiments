import os, re, sys, json
import requests

BASE = "https://at.lumas.com"
OUT = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(OUT, "raw")
os.makedirs(RAW, exist_ok=True)

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36")

s = requests.Session()
s.headers.update({
    "User-Agent": UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "de-AT,de;q=0.9,en;q=0.8",
    "Upgrade-Insecure-Requests": "1",
})
# mirror the browser's consented, "stay on AT shop" state so overlays don't render
consent = ("{stamp:%27b7qYUfxwu0pC0QLAOuKjT9oB7YENcXZIX5+d+/GR8EKiK8DUbYCv9Q==%27%2C"
           "necessary:true%2Cpreferences:false%2Cstatistics:false%2Cmarketing:true%2C"
           "method:%27explicit%27%2Cver:2%2Cutc:1788809676023%2Cregion:%27de%27}")
for k, v in [("CookieConsent", consent), ("showSEOContent", "true"), ("resolution", "1728,2")]:
    s.cookies.set(k, v, domain="at.lumas.com", path="/")

report = {}

def save(name, resp):
    p = os.path.join(RAW, name)
    with open(p, "w", encoding="utf-8") as f:
        f.write(resp.text)
    report[name] = {"url": resp.url, "status": resp.status_code, "bytes": len(resp.content)}
    return resp.text

PDP_URL = BASE + "/pictures/marta_contreras_simo/alikasiara/"

# 1. PDP (also establishes the session)
r = s.get(PDP_URL, timeout=60)
pdp = save("pdp.html", r)
report["pdp.html"]["has_MCS45"] = pdp.count("MCS45")

# 2. add MCS45 to cart
r = s.post(BASE + "/cart/add/MCS45/", headers={
    "X-Requested-With": "XMLHttpRequest",
    "Referer": PDP_URL,
    "Origin": BASE,
}, timeout=60, allow_redirects=True)
report["cart_add"] = {"status": r.status_code, "bytes": len(r.content),
                      "body_head": r.text[:200].replace("\n", " ")}

# 3. cart page
r = s.get(BASE + "/cart/", headers={"Referer": PDP_URL}, timeout=60)
cart = save("cart.html", r)
report["cart.html"]["has_MCS45"] = cart.count("MCS45")
report["cart.html"]["has_Alika"] = cart.count("Alika")
# is the cart actually populated?
report["cart.html"]["empty_markers"] = len(re.findall(r"(?i)warenkorb ist leer|cart is empty", cart))

# discover checkout entry points from the cart page
links = sorted(set(re.findall(r'href="(/[^"]*(?:checkout|kasse|bestell)[^"]*)"', cart)))
report["checkout_links_found"] = links[:12]

# 4. checkout (guest) - try discovered links then common fallbacks
candidates = links + ["/checkout/", "/checkout/customer/", "/kasse/"]
seen = set()
for path in candidates:
    if path in seen:
        continue
    seen.add(path)
    try:
        r = s.get(BASE + path, headers={"Referer": BASE + "/cart/"}, timeout=60)
    except Exception as e:
        report.setdefault("checkout_tries", []).append({"path": path, "error": str(e)})
        continue
    report.setdefault("checkout_tries", []).append(
        {"path": path, "status": r.status_code, "final": r.url, "bytes": len(r.content)})
    if r.status_code == 200 and len(r.content) > 20000:
        save("checkout.html", r)
        break

# 5. account area (unauthenticated shell only - no credentials are ever entered)
for path in ["/login/", "/kundenkonto/", "/customer/overview/", "/mein-konto/", "/register/"]:
    try:
        r = s.get(BASE + path, timeout=60)
    except Exception as e:
        report.setdefault("account_tries", []).append({"path": path, "error": str(e)})
        continue
    report.setdefault("account_tries", []).append(
        {"path": path, "status": r.status_code, "final": r.url, "bytes": len(r.content)})
    if r.status_code == 200 and len(r.content) > 20000 and "account.html" not in report:
        save("account.html", r)

print(json.dumps(report, indent=1, ensure_ascii=False)[:4000])
