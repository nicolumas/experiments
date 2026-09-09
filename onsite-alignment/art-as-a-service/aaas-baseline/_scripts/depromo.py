"""Strip time-limited campaign chrome (Archive Sale / Art Week) from the baseline.

A campaign is transient; the baseline should not bake one in. This matters beyond
cosmetics: Art Week's -20% changes the very gross price the AaaS monthly rent is a
percentage of, so a discounted baseline would misprice every rent calculation.

Idempotent - safe to re-run after localize3.py.
"""
import os, re, json
from bs4 import BeautifulSoup

OUT = ("/Users/nicolatracey/LUMAS ART Dropbox/Nicola Tracey/Mac (2)/Desktop/CODE/"
       "lumassprykerng/prototype/aaas-baseline")
PAGES = ["pdp.html", "checkout.html", "account.html"]
CAMPAIGN_HREF = re.compile(r"/(artweek|archive-sale)/", re.I)
CAMPAIGN_TEXT = re.compile(r"archive\s*sale|art\s*week|artweek|"
                           r"20\s*%\s*auf alle editionen|heute letzter tag", re.I)

report = {}
for page in PAGES:
    p = os.path.join(OUT, page)
    if not os.path.exists(p):
        continue
    soup = BeautifulSoup(open(p, encoding="utf-8").read(), "html.parser")
    n = {}

    # 1. the two promo bars at the top of every page
    els = soup.find_all("promotion-banner")
    n["promotion_banner"] = len(els)
    for e in els:
        e.decompose()

    # 2. the CMS slot holding the ART WEEK block in the PDP buy box
    els = soup.select(".pdp-info-banner")
    n["pdp_info_banner"] = len(els)
    for e in els:
        e.decompose()

    # 3. campaign pricing is rendered client-side off these flags; clearing them
    #    makes <pdp-price> render the plain regular price with no strikethrough
    c = 0
    for e in soup.select("[discountable]"):
        if e.get("discountable") != "0":
            e["discountable"] = "0"; c += 1
    for e in soup.select("[data-is-discountable]"):
        if e.get("data-is-discountable") != "0":
            e["data-is-discountable"] = "0"; c += 1
    n["discount_flags_cleared"] = c

    # 4. navigation entries pointing at the campaigns (incl. the "SALE" nav item)
    c = 0
    for a in soup.find_all("a", href=True):
        if CAMPAIGN_HREF.search(a["href"]):
            (a.find_parent("li") or a).decompose(); c += 1
    n["campaign_links"] = c

    # 5. anything left whose visible text still names a campaign
    c = 0
    for el in soup.find_all(["div", "span", "p", "section", "aside", "strong", "li"]):
        if not el.parent:
            continue
        txt = el.get_text(" ", strip=True)
        if txt and len(txt) < 200 and CAMPAIGN_TEXT.search(txt):
            el.decompose(); c += 1
    n["residual_text_blocks"] = c

    html = str(soup)

    # 6. CMS content-infusion config that would inject an Art Week block
    html, c = re.subn(r',?\s*\{[^{}]*content-infusion-artweek[^{}]*\}', '', html)
    n["cms_config_entries"] = c

    # 7. the strikethrough price itself. <pdp-price> renders "€439 statt €549"
    #    from data-strike JSON on the size buttons plus a matching embedded payload.
    #    Emptying both drops the campaign markup entirely, leaving the regular price.
    html, c = re.subn(r"data-strike='[^']*'", "data-strike='{}'", html)
    n["data_strike_cleared"] = c

    def drop_strike(s):
        key, out, i, removed = '"strike":{', [], 0, 0
        while True:
            j = s.find(key, i)
            if j == -1:
                out.append(s[i:])
                return "".join(out), removed
            out.append(s[i:j])
            out.append('"strike":null')
            k, depth = j + len(key) - 1, 0
            while k < len(s):                     # brace-match past nested objects
                if s[k] == "{":
                    depth += 1
                elif s[k] == "}":
                    depth -= 1
                    if depth == 0:
                        break
                k += 1
            i, removed = k + 1, removed + 1

    html, c = drop_strike(html)
    n["embedded_strike_removed"] = c
    html, c2 = re.subn(r'"isDiscountable":\s*1', '"isDiscountable":0', html)
    n["isDiscountable_cleared"] = c2

    open(p, "w", encoding="utf-8").write(html)

    # verify nothing campaign-shaped survives in the served markup
    final = open(p, encoding="utf-8").read()
    n["remaining_mentions"] = len(CAMPAIGN_TEXT.findall(re.sub(r"<[^>]+>", " ", final)))
    report[page] = n

print(json.dumps(report, indent=1))
