# -*- coding: utf-8 -*-
import re, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from data import (WORKS, THEMES, HERO, HERO_ROOM, ROOMS, INTERLEAVE, CLOSE_ROOM,
                  LADDER, LADDER_WORK, TECH, GALLERIES)

OUT = pathlib.Path(__file__).resolve().parent.parent / "scale.html"
NL = chr(10)

def usd(n): return "$" + format(n, ",d")
def eur(n): return format(n, ",d").replace(",", ".") + " &euro;"
def art(code): return f"https://img.lumas.com/showimg_{code}_desktop.webp"
def com(slug): return f"https://www.lumas.com/pictures/{slug}/"
def de(slug):  return f"https://www.lumas.de/pictures/{slug}/"

# ── typographic pass: no orphans, no widows, ever ──────────────────────────
# CSS text-wrap balance/pretty even the lines out, but neither stops a short word
# being stranded at the end of a line. Non-breaking spaces do, so they are applied
# at build time to every copy string.
#
# The pair rule never chains: a short word binds forward only when the next word is
# long enough to end the pair. That keeps every unbreakable run to two words, so a
# binding can never overflow its column.
SHORT = {
    "a","an","and","as","at","but","by","for","if","in","is","it","its","not","of","on","or","so","the",
    "to","up","was","we","you","your","that","this","with","from","into","over","than","then","when",
    "am","auf","aus","bei","das","dem","den","der","des","die","ein","eine","einer","es","f&uuml;r","im",
    "in","ist","man","mit","nach","nicht","noch","nur","oder","sich","sie","so","um","und","von","vor",
    "was","wenn","wie","wird","wo","zu","zum","zur","der","dass","dir","du","deine","deiner",
}

_ENT = {"&auml;": "a", "&ouml;": "o", "&uuml;": "u", "&szlig;": "s",
        "&Auml;": "A", "&Ouml;": "O", "&Uuml;": "U", "&rsquo;": "'", "&nbsp;": " "}
_WORD = re.compile(r"[^\W\d_]+", re.UNICODE)

def _plain(tok):
    """Entity-decoded, punctuation-free form, so f&uuml;r tests as fuer -> fur."""
    for k, v in _ENT.items():
        tok = tok.replace(k, v)
    return tok

def _is_short(tok):
    m = _WORD.search(_plain(tok))
    return bool(m) and m.group(0).lower() in SHORT

def _runlen(text):
    return len(_plain(text).replace("&nbsp;", " "))

def _bind(t):
    """Bind short words forward, then bind the final two words. Two rules keep it safe:
    every unbreakable run is capped so it still fits the narrowest column, and a run is
    unwound until it ends on a long word, so a run can never itself end stranded."""
    CAP, TAIL_CAP = 18, 20
    toks = t.split(" ")
    out, i = [], 0
    while i < len(toks):
        run = [toks[i]]
        i += 1
        while i < len(toks) and _is_short(run[-1]) and _runlen("&nbsp;".join(run) + " " + toks[i]) <= CAP:
            run.append(toks[i])
            i += 1
        # a run must not end on a short word: give the tail back and let it start the next run
        while len(run) > 1 and _is_short(run[-1]):
            i -= 1
            run.pop()
        out.append("&nbsp;".join(run))
    joined = " ".join(out)
    if " " in joined.rstrip():
        head, _, tail = joined.rstrip().rpartition(" ")
        if head and _runlen(head.rpartition(" ")[2] + " " + tail) <= TAIL_CAP:
            joined = head + "&nbsp;" + tail
    return joined

def typo(t):
    """No orphans, no widows. CSS text-wrap balance/pretty even the lines out but
    neither stops a short word being stranded at a line end; non-breaking spaces do.
    Markup is preserved by binding only the text between tags."""
    if not t.strip():
        return t
    parts = re.split(r"(<[^>]*>)", t)
    return "".join(part if part.startswith("<") else _bind(part) for part in parts)

def bi(en, de_, tag="span", cls=""):
    en, de_ = typo(en), typo(de_)
    e = f'{tag} class="{("en " + cls).strip()}"'
    d = f'{tag} class="{("de " + cls).strip()}"'
    return f'<{e}>{en}</{tag}><{d}>{de_}</{tag}>'

def price(u, e): return bi(usd(u), eur(e))

def edition(copies, last=False):
    en = f"Edition of {copies}" + (", last prints" if last else "")
    d  = f"Edition von {copies}" + (", letzte Exemplare" if last else "")
    return bi(en, d)

def head(eyebrow_en, eyebrow_de, headline_html, dek_html="", extra=""):
    return f"""      <div class="head reveal">
        <p class="eyebrow head__label">{bi(eyebrow_en, eyebrow_de)}</p>
        <div class="head__body">
          {headline_html}
          {dek_html}
          {extra}
        </div>
      </div>"""

# ── 1 · hero: a compact band, then the room ─────────────────────────────────
HR = HERO_ROOM
HERO_SECTION = f"""  <section class="hero-block">
    <div class="hero__frame">
      <figure class="hero__scene scene">
        <a href="{com(HR['slug'])}" data-pdp="{de(HR['slug'])}" data-goal="pdp_click"
           aria-label="{HR['artist']}, {HR['title']}, {HR['w']} &times; {HR['h']} cm, in a room">
          <picture>
            <source media="(max-width:759px)" srcset="assets/rooms-format/lemay-life-goes-on-narrow.jpg" width="1200" height="1030" />
            <img src="assets/rooms-format/lemay-life-goes-on-hero.jpg" width="2400" height="1095" alt="{HR['artist']}, {HR['title']}, {HR['w']} by {HR['h']} centimetres, on the wall of a living room" />
          </picture>
        </a>
      </figure>

      <!-- Type sits directly on the photograph. The veil below is the minimum that carries
           ivory at 4.5:1 over this room (measured: p95 of the text zone is 200, a .50 veil
           brings it to 100 -> 5.05:1). It is masked to fade out by 46% of the frame, so it
           never reaches the artwork, which starts at 46.5%. -->
      <div class="hero__veil" aria-hidden="true"></div>
      <div class="hero__panel">
        <p class="eyebrow reveal">{bi("Museum format", "Museumsformat")}</p>
        <h1 class="d1 reveal">
          <span class="h1-a">{bi("A photograph shows the work. Not what it does to the room.", "Ein Foto zeigt das Werk, nicht seine Wirkung im Raum.")}</span><span class="h1-b">{bi("There are walls you walk past. And walls you stop at.", "Es gibt W&auml;nde, an denen man vorbeigeht. Und W&auml;nde, an denen man stehen bleibt.")}</span>
        </h1>
        <p class="lede reveal">{bi("Editions from 120 &times; 180 cm. Large enough that the room stops being a room with a picture in it.",
                                   "Editionen ab 120 &times; 180 cm. Gro&szlig; genug, dass der Raum aufh&ouml;rt, ein Raum mit einem Bild darin zu sein.")}</p>
        <p class="hero__acts reveal">
          <a class="btn btn-primary-inverse" href="#scale" data-goal="cta_primary">{bi("See it to scale", "Gr&ouml;&szlig;e vergleichen")}</a>
          <a class="ghost" href="#editions" data-goal="cta_primary">{bi("Browse the editions", "Editionen ansehen")}</a>
        </p>
      </div>
    </div>

    <p class="wrap scene__cap">
      <span class="meta__artist">{HR['artist']}</span>
      <span class="meta__title">{HR['title']}</span>
      <span class="meta__size">{HR['w']} &times; {HR['h']} <span class="unit">cm</span></span>
      <span class="meta__sub">{edition(HR['copies'], HR['lastPrints'])}</span>
      <span class="meta__price">{price(HR['usd'], HR['eur'])}</span>
      <a class="ghost" href="{com(HR['slug'])}" data-pdp="{de(HR['slug'])}" data-goal="pdp_click">{bi("Secure your edition", "Edition sichern")}</a>
    </p>
  </section>"""

# ── 2 · three rooms ─────────────────────────────────────────────────────────
def room_spread(r, i):
    flip = " room-spread--r" if i % 2 else ""
    return f"""      <article class="room-spread{flip}">
        <div class="room-spread__inner">
          <figure class="scene room-spread__fig reveal">
            <a href="{com(r['slug'])}" data-pdp="{de(r['slug'])}" data-goal="pdp_click"
               aria-label="{r['artist']}, {r['title']}, {r['w']} &times; {r['h']} cm, in a room">
              <img src="{r['photo']}" loading="lazy" alt="{r['artist']}, {r['title']}, {r['w']} by {r['h']} centimetres, hanging in a room" />
            </a>
          </figure>
          <div class="room-spread__meta reveal">
            <p class="meta__artist">{r['artist']}</p>
            <h3 class="d3 room__title">{r['title']}</h3>
            <p class="meta__size">{r['w']} &times; {r['h']} <span class="unit">cm</span></p>
            <p class="meta__note">{bi(r['note_en'], r['note_de'])}</p>
            <p class="meta__sub">{bi(r['place_en'], r['place_de'])} &middot; {edition(r['copies'])}</p>
            <p class="line">
              <span class="meta__price">{price(r['usd'], r['eur'])}</span>
              <a class="ghost" href="{com(r['slug'])}" data-pdp="{de(r['slug'])}" data-goal="pdp_click">{bi("Secure your edition", "Edition sichern")}</a>
            </p>
          </div>
        </div>
      </article>"""

ROOMS_SECTION = f"""  <section class="section rooms">
    <div class="wrap">
{head("In the room", "Im Raum",
      '<h2 class="d2">' + bi("Three rooms that were finished the day the work went up.",
                             "Drei R&auml;ume, die an dem Tag fertig waren, an dem das Werk h&auml;ngen blieb.") + '</h2>',
      '<p class="caption head__meta">' + bi("Each work shown at the size it was hung, in centimetres.",
                                            "Jedes Werk in der Gr&ouml;&szlig;e gezeigt, in der es h&auml;ngt, in Zentimetern.") + '</p>')}
    </div>
{NL.join(room_spread(r, i) for i, r in enumerate(ROOMS))}
  </section>"""

# ── 3 · wall comparator: the photograph proves it, the diagram explains it ──
def pct(a, wall): return round(a / wall * 100)

CHIPS = [(250, "2.5&nbsp;m", "2,5&nbsp;m"), (350, "3.5&nbsp;m", "3,5&nbsp;m"), (500, "5&nbsp;m", "5&nbsp;m")]

def chip(cm, en, de_):
    pressed = "true" if cm == 350 else "false"
    return ('          <button type="button" class="chip" data-wall="%d" aria-pressed="%s">%s</button>'
            % (cm, pressed, bi(en, de_)))

chips_block = '<div class="chips" role="group">' + NL + NL.join(chip(*c) for c in CHIPS) + NL + '        </div>'

FIGURE_SVG = ('<svg class="figure__svg" viewBox="0 0 50 175" aria-hidden="true" focusable="false">'
              '<circle cx="25" cy="11" r="9.5"/>'
              '<path d="M25 22c-8 0-12.4 3.5-13 10L14 90h22l2-58c-.6-6.5-5-10-13-10Z"/>'
              '<rect x="6.6" y="30" width="5" height="58" rx="2.5"/>'
              '<rect x="38.4" y="30" width="5" height="58" rx="2.5"/>'
              '<path d="M14.5 88h9.6l.8 87h-9.4Z"/>'
              '<path d="M25.9 88h9.6l-1 87h-9.4Z"/>'
              '</svg>')

COMPARATOR = f"""  <section class="section scale" id="scale">
    <div class="wrap">
{head("To scale", "Im Ma&szlig;stab",
      '<h2 class="d2">' + bi("Your wall, to scale.", "Deine Wand, im Ma&szlig;stab.") + '</h2>',
      '<p class="body head__dek">' + bi("Choose your wall width. The work stays the same size. The room changes around it.",
                                        "W&auml;hle deine Wandbreite. Das Werk bleibt gleich gro&szlig;. Der Raum ver&auml;ndert sich darum herum.") + '</p>',
      chips_block)}

      <div class="scale__grid">
        <figure class="scene scale__photo reveal">
          <a href="{com(HERO['slug'])}" data-pdp="{de(HERO['slug'])}" data-goal="pdp_click"
             aria-label="{HERO['artist']}, {HERO['title']}, {HERO['w']} &times; {HERO['h']} cm, above a kitchen counter">
            <img src="{HERO['photo']}" loading="lazy" alt="{HERO['artist']}, {HERO['title']}, {HERO['w']} by {HERO['h']} centimetres, above a kitchen counter" />
          </a>
          <figcaption class="scale__photocap">
            <span class="body">{bi(f"{HERO['w']} &times; {HERO['h']} cm above a kitchen counter. Not the wall you would plan a work for, which is exactly why it lands. The diagram beside it is the same work, on a wall you choose.",
                                   f"{HERO['w']} &times; {HERO['h']} cm &uuml;ber einer K&uuml;chenzeile. Nicht die Wand, f&uuml;r die du ein Werk planen w&uuml;rdest, und genau deshalb funktioniert es. Das Diagramm daneben zeigt dasselbe Werk an einer Wand deiner Wahl.")}</span>
            <span class="caption dim">{bi(HERO['place_en'], HERO['place_de'])}</span>
          </figcaption>
        </figure>

        <div class="scale__diagram reveal">
          <div class="stage" style="--wall:350;--aw:{HERO['w']};--ah:{HERO['h']}">
            <div class="stage__wall"></div>
            <div class="stage__floor"></div>
            <a class="stage__art" href="{com(HERO['slug'])}" data-pdp="{de(HERO['slug'])}" data-goal="pdp_click"
               aria-label="{HERO['artist']}, {HERO['title']}, {HERO['w']} &times; {HERO['h']} cm">
              <img src="{art(HERO['img'])}" width="{HERO['w']*10}" height="{HERO['h']*10}" alt="{HERO['artist']}, {HERO['title']}" />
            </a>
            <div class="figure">{FIGURE_SVG}<span class="figure__cm caption">175&nbsp;cm</span></div>
            <div class="stage__dim"><span class="stage__dimlabel caption">{bi("3.5&nbsp;m", "3,5&nbsp;m")}</span></div>
          </div>
          <p class="caption" id="scale-caption">
            <span class="en">{HERO['w']} &times; {HERO['h']} cm &middot; covers <b class="scale__pct">{pct(HERO['w'],350)}%</b> of a <b class="scale__wall">3.5&nbsp;m</b> wall. Reference figure: 175&nbsp;cm.</span><span class="de">{HERO['w']} &times; {HERO['h']} cm &middot; nimmt <b class="scale__pct">{pct(HERO['w'],350)}&nbsp;%</b> einer <b class="scale__wall">3,5-m</b>-Wand ein. Referenzfigur: 175&nbsp;cm.</span>
          </p>
          <p class="line scale__credit">
            <span class="meta__artist">{HERO['artist']}</span>
            <span class="meta__title">{HERO['title']}</span>
            <span class="meta__sub">{edition(HERO['copies'])}</span>
            <span class="meta__price">{price(HERO['usd'], HERO['eur'])}</span>
            <a class="ghost" href="{com(HERO['slug'])}" data-pdp="{de(HERO['slug'])}" data-goal="pdp_click">{bi("Secure your edition", "Edition sichern")}</a>
          </p>
        </div>
      </div>
    </div>
  </section>"""

# ── 4 · size ladder ─────────────────────────────────────────────────────────
def ladder_cell(sku, w, h, u, e, copies):
    return f"""        <li class="step reveal" style="--aw:{w};--ah:{h}">
          <p class="meta__size">{w} &times; {h} <span class="unit">cm</span></p>
          <a class="step__stage" href="{com(LADDER_WORK['slug'])}" data-pdp="{de(LADDER_WORK['slug'])}" data-goal="pdp_click"
             aria-label="{LADDER_WORK['artist']}, {LADDER_WORK['title']}, {w} &times; {h} cm">
            <span class="stage__wall"></span>
            <span class="stage__floor"></span>
            <span class="stage__art"><img src="{art(LADDER_WORK['img'])}" width="{w*10}" height="{h*10}" loading="lazy" alt="{LADDER_WORK['artist']}, {LADDER_WORK['title']}" /></span>
            <span class="figure">{FIGURE_SVG}</span>
          </a>
          <p class="line">
            <span class="meta__price">{price(u, e)}</span>
            <span class="meta__sub">{edition(copies)}</span>
          </p>
        </li>"""

LADDER_SECTION = f"""  <section class="section ladder">
    <div class="wrap">
{head("The same work, four sizes", "Ein Werk, vier Formate",
      '<h3 class="d3">' + bi("Below 120 cm, a wide wall never quite settles.", "Unter 120 cm kommt eine breite Wand nie ganz zur Ruhe.") + '</h3>',
      '<p class="caption head__meta">' + bi(f"{LADDER_WORK['artist']} &middot; {LADDER_WORK['title']} &middot; shown against a 4 m wall",
                                            f"{LADDER_WORK['artist']} &middot; {LADDER_WORK['title']} &middot; gezeigt an einer 4-m-Wand") + '</p>')}
      <ol class="steps">
{NL.join(ladder_cell(*s) for s in LADDER)}
      </ol>
      <p class="body ladder__note reveal">{bi("A work is judged against the wall it hangs on, not against other pictures. On four metres, 67 &times; 50 reads as a note someone left on the way out. The same image at 243 &times; 180 is the reason you came into the room.",
                                              "Ein Werk wird an der Wand gemessen, an der es h&auml;ngt, nicht an anderen Bildern. Auf vier Metern wirken 67 &times; 50 wie eine Notiz, die jemand im Hinausgehen hinterlassen hat. Dasselbe Bild mit 243 &times; 180 ist der Grund, warum du in den Raum gekommen bist.")}</p>
    </div>
  </section>"""

# ── 5 · editorial strip ─────────────────────────────────────────────────────
STRIP = f"""  <section class="strip inverse">
    <div class="strip__inner reveal">
      <p class="eyebrow">{bi("On format", "Zum Format")}</p>
      <p class="d2 strip__display">{bi("Format is a decision, not an upgrade.", "Das Format ist Entscheidung, kein Upgrade.")}</p>
      <p class="lede strip__body">{bi("In museum format a photograph stops being an image on a wall and becomes part of the room you live in. It shifts with the daylight, and you are still finding things in it years later. That is why we produce these editions in small numbers, and why the size is chosen before the frame.",
                                      "Im Museumsformat h&ouml;rt eine Fotografie auf, ein Bild an der Wand zu sein, und wird Teil des Raums, in dem du lebst. Sie ver&auml;ndert sich im Tageslicht, und du entdeckst noch nach Jahren Neues darin. Deshalb produzieren wir diese Editionen in kleiner Zahl. Und deshalb wird die Gr&ouml;&szlig;e vor dem Rahmen gew&auml;hlt.")}</p>
      <a class="ghost" href="#craft">{bi("How we print at this scale", "Herstellung im Gro&szlig;format")}</a>
    </div>
  </section>"""

# ── 6 · one room as the bridge, then the filterable catalogue ──────────────
IL = INTERLEAVE
BRIDGE = f"""  <figure class="bridge scene reveal">
    <a href="{com(IL['slug'])}" data-pdp="{de(IL['slug'])}" data-goal="pdp_click"
       aria-label="{IL['artist']}, {IL['title']}, {IL['w']} &times; {IL['h']} cm, in a room">
      <img src="{IL['photo']}" loading="lazy" alt="{IL['artist']}, {IL['title']}, {IL['w']} by {IL['h']} centimetres, in a living room" />
    </a>
    <figcaption class="wrap bridge__cap">
      <span class="meta__artist">{IL['artist']}</span>
      <span class="meta__title">{IL['title']}</span>
      <span class="meta__size">{IL['w']} &times; {IL['h']} <span class="unit">cm</span></span>
      <span class="meta__sub">{bi(IL['place_en'], IL['place_de'])} &middot; {edition(IL['copies'])}</span>
      <span class="meta__price">{price(IL['usd'], IL['eur'])}</span>
      <a class="ghost" href="{com(IL['slug'])}" data-pdp="{de(IL['slug'])}" data-goal="pdp_click">{bi("Secure your edition", "Edition sichern")}</a>
    </figcaption>
  </figure>"""

def tile(sku, artist, title, w, h, u, e, copies, tech, code, slug, theme):
    t_en, t_de = TECH[tech]
    wide = " tile--wide" if w > 260 else ""
    return f"""        <li class="tile{wide} reveal" data-theme="{theme}" style="--aw:{w}">
          <a class="tile__hit" href="{com(slug)}" data-pdp="{de(slug)}" data-goal="pdp_click">
            <span class="tile__figbox"><img src="{art(code)}" width="{w*10}" height="{h*10}" alt="{artist}, {title}" loading="lazy" /></span>
          </a>
          <p class="meta__size">{w} &times; {h} <span class="unit">cm</span></p>
          <p class="meta__artist">{artist}</p>
          <p class="meta__title">{title}</p>
          <p class="meta__sub">{bi(f"Edition of {copies} &middot; {t_en}", f"Edition von {copies} &middot; {t_de}")}</p>
          <p class="line">
            <span class="meta__price">{price(u, e)}</span>
            <a class="ghost tile__cta" href="{com(slug)}" data-pdp="{de(slug)}" data-goal="pdp_click">
              <span class="cta-v1">{bi("View work", "Werk ansehen")}</span><span class="cta-v2">{bi("Add to cart", "In den Warenkorb")}</span>
            </a>
          </p>
        </li>"""

def theme_chip(key, en, de_, *_):
    pressed = "true" if key == "all" else "false"
    return ('          <button type="button" class="chip" data-theme-filter="%s" aria-pressed="%s">%s</button>'
            % (key, pressed, bi(en, de_)))

def theme_dek(key, en, de_, dek_en, dek_de):
    return '        <p class="dek dek--%s">%s</p>' % (key, bi(dek_en, dek_de))

theme_chips = NL.join(theme_chip(*t) for t in THEMES)
theme_deks  = NL.join(theme_dek(*t) for t in THEMES)

EDITIONS = f"""  <section class="section editions" id="editions" data-filter="all">
    <div class="wrap">
{head("Available at scale", "Verf&uuml;gbar im Gro&szlig;format",
      '<h2 class="d2">' + bi("Twenty works at 120 cm and above.", "Zwanzig Werke ab 120 cm.") + '</h2>',
      '<p class="body head__dek">' + bi('Each is a numbered edition. Dimensions are given for the printed sheet; framing adds <span class="slot">[4 cm]</span> on each side.',
                                        'Jedes Werk ist eine nummerierte Edition. Die Ma&szlig;e gelten f&uuml;r das Blatt; die Rahmung erg&auml;nzt <span class="slot">[4 cm]</span> pro Seite.') + '</p>')}

      <div class="filter">
        <div class="chips" role="group" aria-label="Filter by subject">
{theme_chips}
        </div>
        <p class="caption dim filter__count"><span class="en"><b id="grid-count">{len(WORKS)}</b> works</span><span class="de"><b id="grid-count-de">{len(WORKS)}</b> Werke</span></p>
      </div>
      <div class="filter__deks">
{theme_deks}
      </div>

      <ol class="grid">
{NL.join(tile(*w) for w in WORKS)}
      </ol>
      <div class="empty" hidden>
        <p class="body">{bi("Nothing at this scale is currently available. Register to hear about the next release.",
                            "Derzeit ist kein Werk in diesem Format verf&uuml;gbar. Lass dich &uuml;ber die n&auml;chste Edition informieren.")}</p>
        <a class="btn" href="https://www.lumas.com/newsletter/" data-goal="cta_primary">{bi("Notify me", "Benachrichtigen")}</a>
      </div>
    </div>
  </section>"""

# ── 7 · craft and logistics ─────────────────────────────────────────────────
CRAFT = f"""  <section class="band" id="craft">
    <div class="wrap band__inner">
      <div class="craft reveal">
        <div class="col">
          <h3 class="ui-label">{bi("Edition", "Edition")}</h3>
          <p class="body">{bi("Editions of 75 to 150 numbered prints, set per work and stated on every one. Signed by the artist. No reprints, at any size.",
                              "Editionen von 75 bis 150 nummerierten Exemplaren, pro Werk festgelegt und an jedem Werk ausgewiesen. Vom K&uuml;nstler signiert. Keine Neuauflage, in keinem Format.")}</p>
        </div>
        <div class="col">
          <h3 class="ui-label">{bi("Print &amp; mount", "Druck &amp; Kaschierung")}</h3>
          <p class="body">{bi('Each work is printed in the process its artist chose: Lambda colour photograph, fine-art pigment print, or black-and-white photographic print. Mounted on <span class="slot">[ ]</span> to stop the long edge waving, the failure large prints are prone to.',
                              'Jedes Werk wird in dem Verfahren gedruckt, das der K&uuml;nstler gew&auml;hlt hat: Lambda Farb-Fotoabzug, Fine-Art-Pigmentdruck oder fotografischer S/W-Abzug. Kaschiert auf <span class="slot">[ ]</span>, damit die lange Kante nicht wellt: der typische Fehler gro&szlig;er Drucke.')}</p>
        </div>
        <div class="col">
          <h3 class="ui-label">{bi("Frame", "Rahmen")}</h3>
          <p class="body">{bi('<span class="slot">[ ]</span> cm profile depth, chosen for the weight the format carries. Museum glass optional.',
                              '<span class="slot">[ ]</span> cm Profiltiefe, abgestimmt auf das Gewicht des Formats. Museumsglas optional.')}</p>
        </div>
      </div>

      <hr class="rule band__rule" />

      <div class="logistics reveal">
        <h3 class="d3 logistics__head">{bi("Getting it there, and getting it up.", "Ankommen. Und an die Wand.")}</h3>
        <div class="logistics__cols">
          <div class="col">
            <h4 class="ui-label">{bi("What arrives", "Was ankommt")}</h4>
            <ul class="ticks">
              <li>{bi("Crated, two-person delivery to the room you choose.", "Verkistet, Lieferung durch zwei Personen in den Raum deiner Wahl.")}</li>
              <li>{bi("Delivery window confirmed by phone before dispatch.", "Der Liefertermin wird vor dem Versand telefonisch best&auml;tigt.")}</li>
              <li>{bi(f"Or collect from any of our {GALLERIES} galleries.", f"Oder Abholung in einer unserer {GALLERIES} Galerien.")}</li>
            </ul>
          </div>
          <div class="col">
            <h4 class="ui-label">{bi("How it hangs", "Wie es h&auml;ngt")}</h4>
            <ul class="ticks">
              <li>{bi("Ships with the hanging hardware the weight requires.", "Wird mit der f&uuml;r das Gewicht passenden Aufh&auml;ngung geliefert.")}</li>
              <li>{bi("Hanging instructions for solid and plasterboard walls.", "Anleitung f&uuml;r Massiv- und Trockenbauw&auml;nde.")}</li>
              <li>{bi('Installation service available in <span class="slot">[ ]</span> cities.', 'Montageservice in <span class="slot">[ ]</span> St&auml;dten verf&uuml;gbar.')}</li>
            </ul>
          </div>
        </div>
        <p class="caption band__slotnote">{bi("[[TXT-01]] &middot; Weights, mounting and the large-format delivery process are awaiting verification. Bracketed figures are unbound.",
                                              "[[TXT-01]] &middot; Gewichte, Montage und der Ablauf der Gro&szlig;formatlieferung sind noch zu verifizieren. Werte in Klammern sind ungebunden.")}</p>
      </div>
    </div>
  </section>"""

# ── 8 · close ───────────────────────────────────────────────────────────────
CR = CLOSE_ROOM
CLOSE = f"""  <section class="section close">
    <div class="wrap close__inner">
      <figure class="scene close__fig reveal">
        <a href="{com(CR['slug'])}" data-pdp="{de(CR['slug'])}" data-goal="pdp_click"
           aria-label="{CR['artist']}, {CR['title']}, {CR['w']} &times; {CR['h']} cm, in a salon">
          <img src="{CR['photo']}" loading="lazy" alt="{CR['artist']}, {CR['title']}, {CR['w']} by {CR['h']} centimetres, in a vaulted salon" />
        </a>
        <figcaption class="close__cap">
          <span class="meta__artist">{CR['artist']}</span>
          <span class="meta__title">{CR['title']}</span>
          <span class="meta__sub">{CR['w']} &times; {CR['h']} cm &middot; {bi(CR['place_en'], CR['place_de'])}</span>
        </figcaption>
      </figure>
      <div class="close__side">
        <p class="eyebrow reveal">{bi("Before you decide", "Vor der Entscheidung")}</p>
        <h2 class="d2 reveal">{bi("Stand in front of one.", "Stell dich davor.")}</h2>
        <p class="body reveal">{bi("Scale is easier to trust in person than on a screen. Several of these works hang at full size in our galleries, and you are welcome to stand in front of one for as long as you like.",
                                   "Ma&szlig;stab &uuml;berzeugt im Raum schneller als am Bildschirm. Mehrere dieser Werke h&auml;ngen in unseren Galerien im Originalformat, und du darfst so lange davorstehen, wie du m&ouml;chtest.")}</p>
        <a class="btn reveal" href="https://www.lumas.com/galleries/" data-gallery-de="https://www.lumas.de/galerien/" data-goal="cta_primary">{bi("Find a gallery", "Galerie finden")}</a>
      </div>
    </div>
  </section>"""

FOOTER = f"""  <footer class="foot wrap">
    <p>{bi("LUMAS &middot; Prototype &middot; Museum format, to scale &middot; Works and prices live from lumas.com &middot; August 2026",
           "LUMAS &middot; Prototyp &middot; Museumsformat, im Ma&szlig;stab &middot; Werke und Preise live von lumas.de &middot; August 2026")}</p>
    <nav>
      <a href="index.html">{bi("All pages", "Alle Seiten")}</a>
      <a href="art-in-the-room.html">{bi("Art in the room", "Kunst im Raum")}</a>
      <a href="museum-format.html">{bi("Museum format", "Museumsformat")}</a>
      <a href="gallery.html">{bi("The gallery, always open", "Die Galerie, immer offen")}</a>
      <a href="collector-advantage.html">{bi("The collector advantage", "Der Sammlervorteil")}</a>
      <a href="our-story.html">{bi("Why these editions exist", "Warum es diese Editionen gibt")}</a>
    </nav>
  </footer>"""

CONTROLS = """  <aside class="proto" aria-label="Prototype controls">
    <p class="proto__title ui-label">Prototype</p>
    <div class="proto__row">
      <span class="proto__key ui-label">Lang</span>
      <button type="button" class="proto__btn" data-set="lang" data-val="en" aria-pressed="true">EN</button>
      <button type="button" class="proto__btn" data-set="lang" data-val="de" aria-pressed="false">DE</button>
    </div>
    <div class="proto__row">
      <span class="proto__key ui-label">H1</span>
      <button type="button" class="proto__btn" data-set="h1" data-val="a" aria-pressed="true">A</button>
      <button type="button" class="proto__btn" data-set="h1" data-val="b" aria-pressed="false">B</button>
    </div>
    <div class="proto__row">
      <span class="proto__key ui-label">Tile CTA</span>
      <button type="button" class="proto__btn" data-set="cta" data-val="v1" aria-pressed="true">V1</button>
      <button type="button" class="proto__btn" data-set="cta" data-val="v2" aria-pressed="false">V2</button>
    </div>
  </aside>"""

CSS = """  /* page-local composition only. Tokens, type and the image rule live in lumas.css */

  /* bilingual: both languages ship in the DOM, CSS chooses. No JS gate. */
  [data-lang="en"] .de{display:none}
  [data-lang="de"] .en{display:none}
  [data-h1="a"] .h1-b,[data-h1="b"] .h1-a{display:none}
  [data-cta="v1"] .cta-v2,[data-cta="v2"] .cta-v1{display:none}

  .ui-label{font-family:var(--font-body-bold);font-size:1.1rem;line-height:1.5;letter-spacing:.18em;text-transform:uppercase;color:var(--color-text-secondary);margin:0}
  .slot{color:var(--color-text-secondary);border-bottom:.1rem dashed var(--color-border-strong);padding-bottom:.1rem}
  .dim{color:var(--color-text-secondary)}
  /* 1.1rem is reserved for uppercase labels. Small prose runs at 1.3rem, so the page
     never shows two different sizes of the same kind of text. The only exceptions are
     the annotations inside the scale drawings, which belong to the drawing. */
  .head__meta,#scale-caption,.filter__count,.band__slotnote{font-size:1.3rem;letter-spacing:0}
  .unit{font-size:.55em}
  .line{display:flex;flex-wrap:wrap;align-items:baseline;gap:var(--sp-2) var(--sp-6);margin:0}

  /* ── hero: a compact band, then the room ───────────────────────────── */
  /* ── hero: one block. The photograph is full-bleed and the type sits on a
     charcoal text frame overlaid on it, always clear of the artwork (which
     occupies 46%-84% of this crop). Below 1000px the frame stacks under the
     image and reads as one unit. */
  .hero-block{padding-bottom:var(--sp-10)}
  .hero__frame{position:relative}
  .hero__scene a{display:block}
  .hero__scene picture{display:block}
  .hero__scene img{display:block;width:100%;height:auto;max-height:none}
  .hero__panel{
    padding:var(--sp-8) var(--gutter) var(--sp-10);
    display:flex;flex-direction:column;gap:var(--sp-5);align-items:flex-start;
  }
  .hero__panel .d1{max-width:21ch}
  .hero__panel .lede{max-width:38ch}
  .hero__acts{display:flex;flex-wrap:wrap;align-items:center;gap:var(--sp-5) var(--sp-8);margin:0;padding-top:var(--sp-2)}
  .hero__veil{display:none}
  /* below 1000px the type is charcoal on white, so the inverse CTA has to come back
     to the standard fill or it is ivory-on-white */
  @media (max-width:999px){
    .hero__panel .btn-primary-inverse{background-color:var(--color-surface-inverse);color:var(--color-text-inverse)}
  }

  @media (min-width:1000px){
    /* the veil: strongest under the type, gone before the artwork */
    .hero__veil{
      display:block;position:absolute;inset:0 auto 0 0;width:46%;pointer-events:none;
      background:linear-gradient(to top,
        rgba(28,26,24,.60) 0%,
        rgba(28,26,24,.56) 55%,
        rgba(28,26,24,.48) 70%,
        rgba(28,26,24,.18) 86%,
        rgba(28,26,24,0) 100%);
      -webkit-mask-image:linear-gradient(to right,#000 0%,#000 74%,transparent 100%);
      mask-image:linear-gradient(to right,#000 0%,#000 74%,transparent 100%);
    }
    .hero__panel{
      position:absolute;left:0;bottom:0;width:min(44%,68rem);
      padding:var(--sp-10) var(--sp-12) var(--sp-10) var(--gutter);
      color:var(--color-text-inverse);
    }
    /* over a photograph the on-dark alpha rhythm drops below 4.5:1, so hierarchy
       comes from size and family here, not from transparency */
    .hero__panel .eyebrow,.hero__panel .lede{color:var(--color-text-inverse)}
    .hero__panel .ghost{color:var(--color-text-inverse);border-bottom-color:var(--color-border-inverse)}
  }
  @media (min-width:1500px){
    .hero__panel{width:min(42%,74rem)}
  }
  .scene__cap,.bridge__cap{display:flex;flex-wrap:wrap;align-items:baseline;gap:var(--sp-2) var(--sp-6);margin-top:var(--sp-5)}

  /* ── section head: label beside the headline, never stacked above ──── */
  .head{display:grid;gap:var(--sp-4)}
  @media (min-width:900px){
    .head{grid-template-columns:minmax(0,3fr) minmax(0,9fr);gap:var(--sp-12);align-items:start}
    .head__label{padding-top:.9rem}
  }
  .head__label{margin:0}
  .head__body>*+*{margin-top:var(--sp-5)}
  .head__dek{color:var(--text-secondary);max-width:52ch}
  .head__meta{margin-top:var(--sp-3)}

  /* ── the three rooms ───────────────────────────────────────────────── */
  .rooms{padding-bottom:clamp(4.8rem,6vw,8rem)}
  .room-spread{padding-block:clamp(4.8rem,6vw,8rem)}
  .room-spread__inner{max-width:var(--maxw);margin-inline:auto;padding-inline:var(--gutter);display:grid;gap:var(--sp-8)}
  @media (min-width:1000px){
    /* the photograph runs to the page edge on its own side, which buys it ~13% */
    .room-spread__inner{
      grid-template-columns:minmax(0,1fr) minmax(32rem,26%);
      gap:var(--sp-12);align-items:center;padding-inline:0 var(--gutter);
    }
    .room-spread--r .room-spread__inner{
      grid-template-columns:minmax(32rem,26%) minmax(0,1fr);
      padding-inline:var(--gutter) 0;
    }
    .room-spread--r .room-spread__fig{order:2}
  }
  .room-spread__fig{margin:0}
  .room-spread__fig a{display:block}
  .room-spread__fig img{display:block;width:100%;height:auto;max-height:none}
  .room-spread__meta{display:flex;flex-direction:column;align-items:flex-start;gap:var(--sp-3)}
  .room__title{margin:0}
  .room-spread__meta .meta__size{margin-top:calc(var(--sp-1) * -1)}
  .room-spread__meta .meta__note{margin-top:var(--sp-3)}
  .room-spread__meta .line{margin-top:var(--sp-3)}

  /* ── the scale stage. 1 unit = 1 cm, span = 500 cm across. ─────────── */
  .scale__grid{display:grid;gap:var(--sp-10);margin-top:var(--sp-10)}
  @media (min-width:1100px){
    .scale__grid{grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:var(--sp-12);align-items:start}
  }
  .scale__photo{margin:0}
  .scale__photo a{display:block}
  .scale__photo img{display:block;width:100%;height:auto;max-height:none}
  .scale__photocap{margin-top:var(--sp-4);display:flex;flex-direction:column;gap:var(--sp-2)}
  .scale__photocap .body{max-width:40ch}
  .scale__diagram{display:flex;flex-direction:column;gap:var(--sp-4)}
  .scale__diagram .stage{margin-top:0}

  .chips{display:flex;flex-wrap:wrap;gap:var(--sp-2)}
  .chip{
    font-family:var(--font-body-bold);font-size:1.2rem;line-height:1.5;letter-spacing:.08em;text-transform:uppercase;
    padding:var(--sp-2) var(--sp-4);border-radius:var(--radius-xs);border:.1rem solid var(--color-border-strong);
    background:transparent;color:var(--color-text-primary);cursor:pointer;
    transition:background-color var(--motion-fast) var(--motion-easing),color var(--motion-fast) var(--motion-easing),border-color var(--motion-fast) var(--motion-easing);
  }
  @media (hover:hover) and (pointer:fine){.chip:hover{background-color:var(--color-surface-raised);border-color:transparent}}
  .chip[aria-pressed="true"]{background-color:var(--color-surface-inverse);color:var(--color-text-inverse);border-color:var(--color-surface-inverse)}

  .stage{
    --span:500;--wallh:260;
    position:relative;margin-block:var(--sp-2) var(--sp-6);
    aspect-ratio:var(--span) / var(--wallh);
  }
  .stage__wall{
    position:absolute;bottom:0;left:50%;transform:translateX(-50%);
    width:calc(var(--wall) / var(--span) * 100%);height:100%;
    background:var(--surface-sunken);border:.1rem solid var(--color-border-default);border-bottom:0;
    transition:width var(--dur-reveal) var(--ease-brand);
  }
  .stage__floor{position:absolute;left:0;right:0;bottom:0;border-top:.1rem solid var(--color-border-strong)}
  .stage__art{
    position:absolute;left:50%;transform:translateX(-50%);display:block;text-decoration:none;
    width:calc(var(--aw) / var(--span) * 100%);
    bottom:calc((150 - var(--ah) / 2) / var(--wallh) * 100%);
    box-shadow:var(--shadow-frame);
  }
  .stage__art img{display:block;width:100%;height:auto;max-height:none}
  .figure{position:absolute;bottom:0;left:calc(50% + (var(--aw) / 2 + 30) / var(--span) * 100%);height:calc(175 / var(--wallh) * 100%)}
  .figure__svg{display:block;height:100%;width:auto;fill:var(--border-strong);opacity:.85}
  .figure__cm{position:absolute;left:calc(100% + .8rem);bottom:0;white-space:nowrap;color:var(--text-secondary)}
  .stage__dim{
    position:absolute;left:50%;transform:translateX(-50%);top:calc(100% + 1.2rem);
    width:calc(var(--wall) / var(--span) * 100%);height:1px;background:var(--border-strong);
    transition:width var(--dur-reveal) var(--ease-brand);
  }
  .stage__dim::before,.stage__dim::after{content:"";position:absolute;top:-.4rem;width:1px;height:.9rem;background:var(--border-strong)}
  .stage__dim::before{left:0}.stage__dim::after{right:0}
  .stage__dimlabel{position:absolute;left:50%;transform:translateX(-50%);top:.8rem;background:var(--surface-page);padding-inline:.8rem;color:var(--text-secondary)}
  #scale-caption{margin:var(--sp-4) 0 0;font-variant-numeric:tabular-nums}
  #scale-caption b{font-weight:400;color:var(--text-primary)}

  /* ── the ladder: one work, four sizes, one 4 m wall each ───────────── */
  .ladder .steps{list-style:none;margin:var(--sp-16) 0 0;padding:0;display:grid;gap:var(--sp-12) var(--sp-6)}
  @media (min-width:640px){.ladder .steps{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media (min-width:1100px){.ladder .steps{grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--sp-6)}}
  .step{display:flex;flex-direction:column;gap:var(--sp-3)}
  .step .meta__size{color:var(--color-text-primary)}
  .step__stage{
    --span:400;--wallh:260;
    position:relative;display:block;text-decoration:none;
    aspect-ratio:var(--span) / var(--wallh);
  }
  .step__stage .stage__wall{width:100%;left:0;transform:none}
  .step__stage .stage__art{
    position:absolute;left:50%;transform:translateX(-50%);display:block;
    width:calc(var(--aw) / var(--span) * 100%);
    bottom:calc((150 - var(--ah) / 2) / var(--wallh) * 100%);
    box-shadow:none;
  }
  .step__stage .figure{left:auto;right:2%;height:calc(175 / var(--wallh) * 100%)}
  .ladder__note{margin-top:var(--sp-12);max-width:62ch}

  /* ── editorial strip ───────────────────────────────────────────────── */
  .strip{padding-block:clamp(8rem,10vw,12rem)}
  .strip__inner{max-width:76rem;margin-inline:auto;padding-inline:var(--gutter);text-align:center;display:flex;flex-direction:column;gap:var(--sp-6);align-items:center}
  .strip__display{letter-spacing:-.0084em;max-width:20ch}
  .strip__body{max-width:58ch}
  .strip .ghost{margin-top:var(--sp-2)}

  /* ── the bridge photograph: from the dark strip into the catalogue ─── */
  .bridge{margin:0}
  .bridge a{display:block}
  .bridge img{display:block;width:100%;height:auto;max-height:none}

  /* ── filter rail: LUMAS's own subject sections ─────────────────────── */
  .filter{margin-top:var(--sp-12);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:var(--sp-4) var(--sp-8)}
  .filter__count{margin:0;font-variant-numeric:tabular-nums;white-space:nowrap}
  .filter__count b{font-weight:400;color:var(--text-primary)}
  .filter__deks{margin-top:var(--sp-5);min-height:2.4rem}
  .dek{margin:0;font-size:1.5rem;line-height:1.5;color:var(--color-text-secondary);max-width:56ch;display:none}
  .editions[data-filter="all"]    .dek--all,
  .editions[data-filter="nature"] .dek--nature,
  .editions[data-filter="cities"] .dek--cities,
  .editions[data-filter="form"]   .dek--form,
  .editions[data-filter="ideas"]  .dek--ideas{display:block}

  /* ── the catalogue: tile width tracks the work's real width ────────── */
  .grid{
    --cols:1;--gap:var(--sp-12);
    list-style:none;margin:var(--sp-10) 0 0;padding:0;
    display:grid;grid-auto-flow:row dense;
    grid-template-columns:repeat(var(--cols),minmax(0,1fr));
    gap:var(--sp-16) var(--gap);
  }
  @media (min-width:760px){.grid{--cols:2;--gap:var(--sp-12)}}
  @media (min-width:1200px){.grid{--cols:3;--gap:var(--sp-16)}}
  .tile{display:flex;flex-direction:column;gap:var(--sp-2)}
  .tile .meta__size{color:var(--color-text-primary)}
  .tile .meta__note{margin:0}
  /* a shared floor line across the row, so widths stay comparable and captions align.
     The box has the ratio, never the image: the image is width-set, height auto. */
  .tile__hit{display:flex;align-items:flex-end;justify-content:flex-start;text-decoration:none;
    aspect-ratio:260 / 195;margin-bottom:var(--sp-3)}
  .tile--wide .tile__hit{aspect-ratio:auto}
  .tile__figbox{display:block;width:calc(var(--aw) / 260 * 100%)}
  .tile__figbox img{display:block;width:100%;height:auto;max-height:none}
  /* the 5.5 m work needs the whole row, but stays on the grid's own px-per-cm */
  .tile--wide{grid-column:1 / -1}
  .tile--wide .tile__figbox{
    width:min(100%, calc(var(--aw) / 260 * ((100% - (var(--cols) - 1) * var(--gap)) / var(--cols))));
  }
  .tile .meta__artist,.tile .meta__title,.tile .meta__sub{margin:0}
  .tile .line{margin-top:var(--sp-3)}

  /* filtering hides, it never rebuilds: with JS off every work stays visible */
  .editions[data-filter="nature"] .tile:not([data-theme="nature"]),
  .editions[data-filter="cities"] .tile:not([data-theme="cities"]),
  .editions[data-filter="form"]   .tile:not([data-theme="form"]),
  .editions[data-filter="ideas"]  .tile:not([data-theme="ideas"]){display:none}

  .empty{margin-top:var(--sp-16);display:flex;flex-direction:column;align-items:flex-start;gap:var(--sp-6)}

  /* ── craft + logistics band ────────────────────────────────────────── */
  .band{background:var(--surface-raised);padding-block:clamp(6.4rem,8vw,10rem)}
  .craft{display:grid;gap:var(--sp-10)}
  @media (min-width:820px){.craft{grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--sp-12)}}
  .col>*+*{margin-top:var(--sp-4)}
  .band__rule{margin-block:clamp(4.8rem,6vw,8rem)}
  .logistics__head{max-width:16ch}
  .logistics__cols{margin-top:var(--sp-10);display:grid;gap:var(--sp-10)}
  @media (min-width:820px){
    .logistics{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,7fr);gap:var(--sp-16);align-items:start}
    .logistics__head{grid-column:1}
    .logistics__cols{grid-column:2;margin-top:0;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--sp-12)}
    .band__slotnote{grid-column:2}
  }
  .ticks{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
  .ticks li{padding-block:var(--sp-4);border-top:.1rem solid var(--color-border-default);font-size:1.5rem;line-height:1.5}
  .ticks li:last-child{border-bottom:.1rem solid var(--color-border-default)}
  .band__slotnote{margin-top:var(--sp-8);color:var(--text-secondary)}

  /* ── close ─────────────────────────────────────────────────────────── */
  .close__inner{display:grid;gap:var(--sp-8)}
  @media (min-width:900px){.close__inner{grid-template-columns:minmax(0,7fr) minmax(0,4fr);gap:var(--sp-16);align-items:center}}
  .close__fig{margin:0}
  .close__fig a{display:block}
  .close__fig img{display:block;width:100%;height:auto;max-height:none}
  .close__cap{margin-top:var(--sp-4);display:flex;flex-direction:column;gap:var(--sp-1)}
  .close__side{display:flex;flex-direction:column;align-items:flex-start;gap:var(--sp-5)}
  .close__side .btn{margin-top:var(--sp-2)}

  /* ── prototype controls (not part of the design) ───────────────────── */
  .proto{
    position:fixed;right:1.6rem;bottom:1.6rem;z-index:60;
    background:var(--color-surface-card);border:.1rem solid var(--color-border-default);
    padding:1.2rem 1.6rem;display:flex;flex-direction:column;gap:.8rem;
  }
  .proto__title{color:var(--color-text-tertiary)}
  .proto__row{display:flex;align-items:center;gap:.6rem}
  .proto__key{min-width:6.4rem}
  .proto__btn{
    font-family:var(--font-body-bold);font-size:1rem;letter-spacing:.18em;text-transform:uppercase;
    padding:.5rem .9rem;border:.1rem solid var(--color-border-strong);background:transparent;color:var(--color-text-primary);cursor:pointer;border-radius:var(--radius-xs);
    transition:background-color var(--motion-fast) var(--motion-easing),color var(--motion-fast) var(--motion-easing);
  }
  .proto__btn[aria-pressed="true"]{background-color:var(--color-surface-inverse);color:var(--color-text-inverse);border-color:var(--color-surface-inverse)}
  @media (max-width:760px){.proto{left:.8rem;right:.8rem;bottom:.8rem;flex-direction:row;flex-wrap:wrap;gap:.8rem 1.6rem;padding:1rem 1.2rem}.proto__key{min-width:0}}
  @media print{.proto{display:none}}"""

JS = """
(function(){
  /* reveals enhance, never gate: no-IO and reduced-motion fall straight through */
  var els = document.querySelectorAll('.reveal');
  function showAll(){ els.forEach(function(e){ e.classList.add('in'); }); }
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches){
    showAll();
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e, i){
        if (!e.isIntersecting) return;
        setTimeout(function(){ e.target.classList.add('in'); }, Math.min(i,4) * 60);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    els.forEach(function(e){ io.observe(e); });
    addEventListener('load', function(){ setTimeout(showAll, 2500); });
    document.addEventListener('visibilitychange', function(){ if (document.hidden) showAll(); });
  }

  /* wall comparator */
  var stage = document.querySelector('.stage');
  /* scope to the wall chips: the catalogue filter reuses the same .chip component */
  var chips = Array.prototype.slice.call(document.querySelectorAll('.scale .chip[data-wall]'));
  var LABEL = { 250:['2.5\\u00a0m','2,5\\u00a0m'], 350:['3.5\\u00a0m','3,5\\u00a0m'], 500:['5\\u00a0m','5\\u00a0m'] };
  /* German compounds the measure into the noun: "einer 3,5-m-Wand" */
  var CAPLABEL = { 250:['2.5\\u00a0m','2,5-m'], 350:['3.5\\u00a0m','3,5-m'], 500:['5\\u00a0m','5-m'] };
  function setWall(cm){
    var aw = parseFloat(getComputedStyle(stage).getPropertyValue('--aw')) || 180;
    stage.style.setProperty('--wall', cm);
    var pct = Math.round(aw / cm * 100);
    document.querySelectorAll('#scale-caption .scale__pct').forEach(function(el, i){
      el.innerHTML = i === 0 ? pct + '%' : pct + '\\u00a0%';
    });
    document.querySelectorAll('#scale-caption .scale__wall').forEach(function(el, i){ el.innerHTML = CAPLABEL[cm][i]; });
    document.querySelectorAll('.stage__dimlabel .en').forEach(function(el){ el.innerHTML = LABEL[cm][0]; });
    document.querySelectorAll('.stage__dimlabel .de').forEach(function(el){ el.innerHTML = LABEL[cm][1]; });
    chips.forEach(function(c){ c.setAttribute('aria-pressed', String(+c.dataset.wall === cm)); });
  }
  chips.forEach(function(c){ c.addEventListener('click', function(){ setWall(+c.dataset.wall); }); });

  /* subject filter: LUMAS's own rails, applied by attribute so nothing is rebuilt */
  var editions = document.querySelector('.editions');
  var themeChips = Array.prototype.slice.call(document.querySelectorAll('[data-theme-filter]'));
  function setFilter(key){
    editions.setAttribute('data-filter', key);
    themeChips.forEach(function(c){ c.setAttribute('aria-pressed', String(c.dataset.themeFilter === key)); });
    var n = key === 'all'
      ? editions.querySelectorAll('.tile').length
      : editions.querySelectorAll('.tile[data-theme="' + key + '"]').length;
    ['grid-count','grid-count-de'].forEach(function(id){
      var el = document.getElementById(id); if (el) el.textContent = n;
    });
  }
  themeChips.forEach(function(c){ c.addEventListener('click', function(){ setFilter(c.dataset.themeFilter); }); });

  /* prototype switches: language, H1 variant, tile CTA variant */
  var root = document.documentElement;
  function applyLang(v){
    root.setAttribute('data-lang', v);
    root.setAttribute('lang', v === 'de' ? 'de' : 'en');
    document.querySelectorAll('[data-pdp]').forEach(function(a){
      if (!a.dataset.pdpEn) a.dataset.pdpEn = a.getAttribute('href');
      a.setAttribute('href', v === 'de' ? a.dataset.pdp : a.dataset.pdpEn);
    });
    document.querySelectorAll('[data-gallery-de]').forEach(function(a){
      if (!a.dataset.galleryEn) a.dataset.galleryEn = a.getAttribute('href');
      a.setAttribute('href', v === 'de' ? a.dataset.galleryDe : a.dataset.galleryEn);
    });
  }
  var SET = { lang: applyLang,
              h1: function(v){ root.setAttribute('data-h1', v); },
              cta: function(v){ root.setAttribute('data-cta', v); } };
  document.querySelectorAll('.proto__btn').forEach(function(b){
    b.addEventListener('click', function(){
      SET[b.dataset.set](b.dataset.val);
      document.querySelectorAll('.proto__btn[data-set="' + b.dataset.set + '"]').forEach(function(o){
        o.setAttribute('aria-pressed', String(o === b));
      });
    });
  });
})();
document.addEventListener('click', function(e){
  var g = e.target.closest('[data-goal]');
  if (g) console.log('[goal]', g.dataset.goal, g.href || '');
});
"""

HTML = f"""<!doctype html>
<html lang="en" data-lang="en" data-h1="a" data-cta="v1">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="robots" content="noindex,nofollow" />
<title>Museum format, to scale | LUMAS</title>
<meta name="description" content="Large-scale editions shown in the rooms they were hung in, with the size made measurable: a wall comparator at 2.5, 3.5 and 5 metres, one work at four sizes, and twelve editions at 120 cm and above." />
<script>document.documentElement.classList.add('js')</script>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="assets/lumas.css" />
<style>
{CSS}
</style>
</head>
<body>
<!-- HYPOTHESIS: rooms first, measurement second - showing the format in real interiors before explaining it converts the XL film's promise into carts, where the old format page returned 0 ATC on 5,494 impressions - KPI: ATC-rate proxy = pdp_click rate -->

<main>

{HERO_SECTION}

{ROOMS_SECTION}

{COMPARATOR}

{LADDER_SECTION}

{STRIP}

{BRIDGE}

{EDITIONS}

{CRAFT}

{CLOSE}

{FOOTER}

</main>

{CONTROLS}

<script>{JS}</script>
</body>
</html>
"""

OUT.write_text(HTML, encoding="utf-8")
print("wrote", OUT, len(HTML), "bytes")
