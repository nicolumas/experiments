"""Stage the AaaS prototype into the GitHub Pages share repo.

    python3 _publish.py            # copy + gate, leaves the commit to you
    python3 _publish.py --dry-run

Published at https://nicolumas.github.io/experiments/onsite-alignment/art-as-a-service/

The layer pages reference the baseline through '../aaas-baseline/', so both trees
have to sit side by side under one folder:

    onsite-alignment/art-as-a-service/
      index.html          generated from aaas-v1/index.html, hrefs prefixed
      aaas-v1/            the layer
      aaas-baseline/      the untouched clone plus its mirrored assets

Every page then gets the section's noindex meta and gate.js, at the depth its own
URL needs. That injection is what makes the published baseline copy differ from
the source clone by more than the two AaaS tags; the source stays pristine.
"""
import os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC_V1 = HERE
SRC_BASE = os.path.abspath(os.path.join(HERE, "..", "aaas-baseline"))
SHARE = os.path.expanduser("~/lumas-prototypes-share/onsite-alignment")
DEST = os.path.join(SHARE, "art-as-a-service")
DRY = "--dry-run" in sys.argv

ROBOTS = '<meta name="robots" content="noindex, nofollow">'


def rsync(src, dst):
    cmd = ["rsync", "-a", "--delete", "--exclude", ".DS_Store",
           src.rstrip("/") + "/", dst.rstrip("/") + "/"]
    if DRY:
        cmd.insert(1, "-n")
    subprocess.run(cmd, check=True)


ROBOTS_TAG = re.compile(r"<meta[^>]*name=[\"']robots[\"'][^>]*>", re.I)


def gate(path):
    """Add gate.js and force the page to noindex, resolving '../assets' from here.

    The cloned shop pages already carry the live site's own
    <meta content="index,follow" name="robots">, so an existing tag has to be
    replaced rather than treated as satisfied: skipping it published the clone
    as indexable, which is exactly what this section must not be."""
    html = open(path, encoding="utf-8").read()
    depth = os.path.relpath(path, DEST).count(os.sep) + 1
    tag = '<script src="%sassets/gate.js"></script>' % ("../" * depth)
    changed = False
    if ROBOTS_TAG.search(html):
        html, n = ROBOTS_TAG.subn(ROBOTS, html)
        changed = n > 0
    add = "" if ROBOTS_TAG.search(html) else ROBOTS
    if "assets/gate.js" not in html:
        add += tag
    if not add:
        if changed and not DRY:
            open(path, "w", encoding="utf-8").write(html)
        return changed
    m = re.search(r"<head[^>]*>", html, re.I) or re.search(r"<html[^>]*>", html, re.I)
    if not m:
        return False
    html = html[:m.end()] + add + html[m.end():]
    if not DRY:
        open(path, "w", encoding="utf-8").write(html)
    return True


# The clone captures the live shop's inline config verbatim, which includes the
# storefront's Google Places browser key. That key is public by design - every
# at.lumas.com page serves it to every visitor - so redacting it here removes an
# exposure, not a secret. It still has to go: the key's HTTP-referrer allowlist
# rejects a wrong referrer but cannot reject a request that sends no Referer
# header at all, so a key harvested out of a public repo bills Maps Platform
# usage to LUMAS. Restricting which APIs the key may call and capping its quota
# is the real fix; this only stops the repo from advertising it.
# Redact on publish rather than in the clone, so the baseline stays pristine.
SECRET_PATTERNS = (
    (re.compile(r"AIzaSy[0-9A-Za-z_-]{33}"), "REDACTED"),
)

# With the key gone the Places call can only fail; the allowlist would reject
# github.io anyway, so autocomplete was already dead in the published copy.
PLACES_FLAG = (re.compile(r"(isGooglePlacesActive\s*:\s*)true"), r"\1false")


def scrub(path):
    """Strip captured credentials from a published page."""
    raw = open(path, encoding="utf-8", errors="surrogateescape").read()
    html = raw
    for pattern, repl in SECRET_PATTERNS:
        html = pattern.sub(repl, html)
    if html == raw:
        return False
    html = PLACES_FLAG[0].sub(PLACES_FLAG[1], html)
    if not DRY:
        open(path, "w", encoding="utf-8", errors="surrogateescape").write(html)
    return True


def top_index():
    """The section hub links '<slug>/index.html', so the prototype's own index
    moves up a level and its links gain the aaas-v1/ prefix."""
    src = open(os.path.join(SRC_V1, "index.html"), encoding="utf-8").read()
    out = re.sub(r'href="(?!https?:|aaas-v1/)([^"]+\.html)"', r'href="aaas-v1/\1"', src)
    if not DRY:
        open(os.path.join(DEST, "index.html"), "w", encoding="utf-8").write(out)
    return out.count('href="aaas-v1/')


if not os.path.isdir(SHARE):
    sys.exit("share repo not found: " + SHARE)

if not DRY:
    os.makedirs(DEST, exist_ok=True)
rsync(SRC_BASE, os.path.join(DEST, "aaas-baseline"))
rsync(SRC_V1, os.path.join(DEST, "aaas-v1"))
print("staged both trees")
print("top index: %d links rewritten" % top_index())

gated = scrubbed = 0
for root, _dirs, files in os.walk(DEST):
    for f in files:
        path = os.path.join(root, f)
        if f.endswith((".html", ".js", ".json")) and scrub(path):
            scrubbed += 1
        if f.endswith(".html") and gate(path):
            gated += 1
print("scrubbed %d files" % scrubbed)
print("gated %d pages%s" % (gated, " (dry run)" if DRY else ""))
