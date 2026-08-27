# -*- coding: utf-8 -*-
# Real catalogue data, LUMAS webshop feed mirror (com + de), pulled 2026-08-25.
# Image codes are images.fallback from the variant feed (NOT the sku), each verified
# HTTP 200 and ratio-checked against the work's cm ratio.
# Room photographs: design-team renders from DESKTOP/CODE/XXL, artwork identified by the
# code in the filename or by visual match against the catalogue image.

TECH = {
    "lambda":  ("Lambda colour photograph", "Lambda Farb-Fotoabzug"),
    "pigment": ("Fine-art pigment print", "Fine-Art-Pigmentdruck"),
    "bw":      ("Black-and-white photographic print", "Fotografischer S/W-Abzug"),
}

# sku, artist, title, w, h, usd, eur, copies, tech, imgcode, slug, theme
# Themes are LUMAS's own rails on lumas.de/format/xxl-kunst/ (Naturwunder / Metropolen /
# Farbe und Form / Grosse Ideen). The taxonomy is theirs; the copy is not, because the live
# page's voice ("beeindruckend", "garantiert fuer Staunen") is what this deck bans.
WORKS = [
    ("IME142", "Isabelle Menin",        "The Beautiful Morning",  238, 180, 4940, 3980, 150, "lambda",  "ime142", "isabelle_menin/the_beautiful_morning",   "nature"),
    ("RNE131", "Rafael Neff",           "La Scala, Milan, Italy", 260, 180, 4070, 2970,  50, "lambda",  "rne131", "rafael_neff/la_scala_milan_italy",       "cities"),
    ("NHA21",  "Niki Hare",             "It's Not One Thing",     224, 120, 2500, 2010, 150, "lambda",  "nha21",  "niki_hare/its_not_one_thing",            "form"),
    ("WUH52",  "Wolfgang Uhlig",        "Mar Tirreno",            250, 150, 5590, 4080,  75, "lambda",  "wuh52",  "wolfgang_uhlig/mar_tirreno-1",           "ideas"),
    ("WUH116", "Wolfgang Uhlig",        "Amoreira",               240, 180, 4450, 3250, 150, "pigment", "wuh116", "wolfgang_uhlig/amoreira",                "nature"),
    ("CWD19",  "Christopher Woodcock",  "NoMad, New York",        222, 160, 2640, 1930, 100, "lambda",  "cwd13",  "christopher_woodcock/nomad_new_york",    "cities"),
    ("AMN50",  "André Monet",           "Kate",                   134, 180, 2660, 1940, 150, "lambda",  "amn25",  "andre_monet/kate-2",                     "form"),
    ("JIR01",  "Jirko Bannas",          "Astronaut",              240, 180, 3540, 2580, 150, "lambda",  "jir01",  "jirko_bannas/astronaut",                 "ideas"),
    ("ECH51",  "Erik Chmil",            "52 or 53",               240, 160, 3690, 2690,  75, "lambda",  "ech49",  "erik_chmil/52_or_53",                    "nature"),
    ("GUA50",  "Guachinarte",           "Desert Fallingwater",    120, 184, 2270, 1660, 100, "lambda",  "gua50",  "guachinarte/desert_fallingwater",        "cities"),
    ("BHU47",  "Beatrice Hug",          "Purple Heart",           240,  80, 2030, 1480,  75, "lambda",  "bhu27",  "beatrice_hug/purple_heart",              "form"),
    ("HHL31",  "Heiko Hellwig",         "Butterfly III",          180, 180, 3130, 2280,  75, "lambda",  "hhl17",  "heiko_hellwig/butterfly_iii-1",          "ideas"),
    ("HDZ184", "Horst &amp; Daniel Zielske", "The variety of life", 550, 180, 8040, 5870, 75, "lambda", "hdz184", "horst_daniel_zielske/the_variety_of_life-1", "ideas"),
    ("JFO34",  "Juan Fortes",           "Florescence VII",        260, 148, 3380, 2470, 150, "lambda",  "jfo16",  "juan_fortes/florescence_vii",            "nature"),
    ("JHA23",  "Jens Hausmann",         "Case study house",       240, 120, 2770, 2020, 150, "lambda",  "jha23",  "jens_hausmann/case_study_house",         "cities"),
    ("ASI07",  "Andrew Soria",          "Forgotten Vegas",        240, 120, 2960, 2160,  75, "lambda",  "asi07",  "andrew_soria/forgotten_vegas",           "form"),
    ("PFU56",  "Peter Funch",           "Panorama 01",            240,  82, 2220, 1790, 250, "lambda",  "pfu56",  "peter_funch/panorama01",                 "ideas"),
    ("ASO01",  "Alex Strohl",           "Norway I",               180, 120, 1570, 1260, 150, "lambda",  "aso01",  "alex_strohl/norway_i",                   "nature"),
    ("GCR01",  "Gabriele Croppi",       "Manhattan Bridge",       230,  90, 2500, 1830, 100, "bw",      "gcr01",  "gabriele_croppi/manhattan_bridge",       "cities"),
    ("IME133", "Isabelle Menin",        "Les fonds angéliques",   243, 180, 5450, 3980, 150, "lambda",  "ime133", "isabelle_menin/les_fonds_angliques",     "form"),
]

# Filter rail: LUMAS's own sections, in LUMAS's own order, with copy written to this deck's voice.
THEMES = [
    ("all",    "All",              "Alle",
     "Every work here has a side of 120 cm or more.",
     "Jedes Werk hier hat eine Kantenlänge von 120 cm oder mehr."),
    ("nature", "Nature",           "Natur",
     "Landscape and flora at a size that lets you stand close and keep finding things.",
     "Landschaft und Flora, groß genug, um nah heranzugehen und immer wieder Neues zu finden."),
    ("cities", "Cities",           "Metropolen",
     "Cities, and the buildings people travel to photograph.",
     "Städte, und die Bauten, für die Menschen reisen, um sie zu fotografieren."),
    ("form",   "Colour and form",  "Farbe und Form",
     "Colour and form, where the subject is what the surface does to the light.",
     "Farbe und Form, wo das Motiv ist, was die Fläche mit dem Licht macht."),
    ("ideas",  "Ideas",            "Große Ideen",
     "Works that were an idea before they were a picture.",
     "Werke, die eine Idee waren, bevor sie ein Bild wurden."),
]

# ── the hero photograph ─────────────────────────────────────────────────────
HERO_ROOM = {
    "artist": "Ysabel Lemay", "title": "Life goes on", "w": 260, "h": 180,
    "usd": 7670, "eur": 5590, "copies": 100, "lastPrints": True,
    "photo": "assets/rooms-format/lemay-life-goes-on-panorama.jpg",
    "slug": "ysabel_lemay-3/life_goes_on",
}

# ── three rooms ─────────────────────────────────────────────────────────────
ROOMS = [
    {"artist": "Luc Dratwa", "title": "New York Five", "w": 240, "h": 160,
     "usd": 3980, "eur": 2900, "copies": 150, "slug": "luc_dratwa/new_york_five",
     "photo": "assets/rooms-format/dratwa-new-york-five-library.jpg",
     "place_en": "A library in concrete", "place_de": "Eine Bibliothek aus Beton",
     "note_en": "Two metres forty of Manhattan at the end of a room made of concrete and books. At this size the skyline stops being a picture of a city. It behaves like a window, and you catch yourself looking out of it.",
     "note_de": "Zwei Meter vierzig Manhattan am Ende eines Raums aus Beton und Büchern. In dieser Größe ist die Skyline kein Bild einer Stadt mehr. Sie verhält sich wie ein Fenster, und du ertappst dich dabei, hinauszusehen."},
    {"artist": "Claudio Gotsch", "title": "Ying &amp; Yang", "w": 150, "h": 105,
     "usd": 1460, "eur": 1180, "copies": 100, "slug": "claudio_gotsch/ying_yang",
     "photo": "assets/rooms-format/gotsch-ying-yang-kitchen.jpg",
     "place_en": "A kitchen in raw plaster", "place_de": "Eine Küche im Rohputz",
     "note_en": "A kitchen is not a gallery, and that is the point. At 150 × 105 the two of them hold the wall above the counter, close enough to read every hair. You will see them more often than anything you hang in a hallway.",
     "note_de": "Eine Küche ist keine Galerie, und genau das ist der Punkt. Mit 150 × 105 halten die beiden die Wand über der Arbeitsfläche, nah genug, um jedes Haar zu erkennen. Du wirst sie öfter sehen als alles, was im Flur hängt."},
    {"artist": "Guachinarte", "title": "Hollywood Hills", "w": 240, "h": 120,
     "usd": 2960, "eur": 2160, "copies": 100, "slug": "guachinarte/hollywood_hills",
     "photo": "assets/rooms-format/guachinarte-hollywood-hills-room.jpg",
     "place_en": "A room of concrete and glass", "place_de": "Ein Raum aus Beton und Glas",
     "note_en": "Two metres forty across, on the one uninterrupted surface the room has. The wall was always the largest thing here. Now it is the reason the chairs face this way.",
     "note_de": "Zwei Meter vierzig breit, an der einzigen ununterbrochenen Fläche, die der Raum hat. Die Wand war hier immer das Größte. Jetzt ist sie der Grund, warum die Sessel in diese Richtung stehen."},
]

# ── the wall comparator: photograph and diagram, one work, one size ─────────
HERO = {
    "sku": "IME98", "artist": "Isabelle Menin", "title": "Only In Your Heart 03",
    "w": 180, "h": 90, "usd": 1810, "eur": 1460, "copies": 150,
    "img": "ime97", "slug": "isabelle_menin/only_in_your_heart_03", "tech": "lambda",
    "photo": "assets/rooms-format/menin-only-in-your-heart-kitchen.jpg",
    "place_en": "A collector's kitchen", "place_de": "Die Küche eines Sammlers",
}

# ── the room that interrupts the grid ───────────────────────────────────────
INTERLEAVE = {
    "artist": "Guachinarte", "title": "Palm Springs", "w": 252, "h": 160,
    "usd": 3730, "eur": 3000, "copies": 150, "slug": "guachinarte/palm_springs",
    "photo": "assets/rooms-format/guachinarte-palm-springs-walnut.jpg",
    "place_en": "A living room in walnut", "place_de": "Ein Wohnraum in Nussbaum",
    "note_en": "Two and a half metres of desert on a wall of walnut. It does the same work as the window opposite, and it does it at four in the afternoon in January.",
    "note_de": "Zweieinhalb Meter Wüste auf einer Wand aus Nussbaum. Sie leistet dasselbe wie das Fenster gegenüber, auch um vier Uhr nachmittags im Januar.",
}

# ── the closing photograph ──────────────────────────────────────────────────
CLOSE_ROOM = {
    "artist": "Marta Contreras Simó", "title": "Alika&amp;Siara", "w": 120, "h": 120,
    "usd": 1230, "eur": 1000, "copies": 150, "slug": "marta_contreras_simo/alikasiara",
    "photo": "assets/rooms-format/contreras-simo-alika-siara-milan.jpg",
    "place_en": "A vaulted salon in Milan", "place_de": "Ein Gewölbesalon in Mailand",
}

# ── size ladder: Isabelle Menin, The Tender Land 2, four real sizes ─────────
LADDER_WORK = {"artist": "Isabelle Menin", "title": "The Tender Land 2",
               "img": "ime75", "slug": "isabelle_menin/the_tender_land_2"}
LADDER = [
    ("IME78",  67,  50,  620,  500, 150),
    ("IME77",  94,  70,  850,  680, 150),
    ("IME76", 135, 100, 1510, 1220, 150),
    ("IME75", 243, 180, 4390, 3200,  75),
]

GALLERIES = 19  # counted from https://www.lumas.com/galleries/ on 2026-08-25
