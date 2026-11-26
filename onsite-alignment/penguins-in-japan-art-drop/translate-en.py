#!/usr/bin/env python3
"""Regenerate the English review copy from the German canonical.

    python3 translate-en.py

Edit penguins-art-drop.html (German) and re-run. Never hand-edit the English
file: it is a build artefact and will be overwritten. If a new German string
appears, add it to T below; the script exits non-zero if any German survives.

This drop is DE only (brief: "Sale Period 21. - 22.12.2026 -> DE only"), so the
English file is a review copy for non-German stakeholders, not a market build.
Prices stay EUR and every link still points at lumas.de.

Two rules learned the expensive way on the previous builds:

  * The validator scans user-facing ATTRIBUTES (alt, aria-label, title,
    placeholder, data-fallback) as well as text nodes. Stripping tags wholesale
    once hid a half-translated alt for weeks.
  * Entries are whole strings, not word fragments. A bare word rule turned
    AUSFÜHRUNGEN into EXECUTIONEN and produced "CERTIFICATE · CERTIFICATE".

NB = U+00A0. The German source uses real non-breaking spaces (not &nbsp;) in
units, dimensions and prices, so the keys below have to carry them too. Watch
for this when copying a key by hand: a plain space silently fails to match, and
the only symptom is an untranslated string in the report. _flex() makes every
space in a key match either kind, which is why most keys can be written plainly.
"""
import pathlib
import re
import subprocess
import sys

SRC = pathlib.Path(__file__).with_name('penguins-art-drop.html')
OUT = pathlib.Path(__file__).with_name('penguins-art-drop-en.html')

NB = ' '


def _flex(key):
    """Match a key whether its spaces are plain or non-breaking.

    fix-typography.py rewrites the source with real U+00A0 between bound words,
    which used to make every long key in T miss silently. Rather than keeping two
    copies of every sentence, the key is compiled into a pattern where each
    space matches either kind.
    """
    return re.compile(''.join(
        '[  ]' if ch in '  ' else re.escape(ch) for ch in key))


T = {
    '<html lang="de">': '<html lang="en">',

    # --- head ------------------------------------------------------------
    'Penguins in Japan von Robert Jahns. Fotografischer Abzug unter Acrylglas, 80 × 60 cm, handsigniert, limitiert auf 400 Exemplare. LUMAS Art Drop, 21. und 22. Dezember 2026.':
        'Penguins in Japan by Robert Jahns. Photographic print under acrylic glass, 80 × 60 cm, hand-signed, limited to 400 pieces. LUMAS Art Drop, 21 and 22 December 2026.',

    # --- chrome ----------------------------------------------------------
    'Zum Inhalt springen': 'Skip to content',
    '>Kunstwerke<': '>Artworks<',
    '>Bestseller<': '>Bestsellers<',
    '>Inspiration<': '>Inspiration<',
    '>Galerien<': '>Galleries<',
    '>Über uns<': '>About us<',
    '>Suche<': '>Search<',
    'placeholder="Suche"': 'placeholder="Search"',
    'aria-label="Hauptnavigation"': 'aria-label="Main navigation"',
    'aria-label="Menü"': 'aria-label="Menu"',
    'aria-label="Suchen"': 'aria-label="Search"',
    'aria-label="Wunschliste"': 'aria-label="Wishlist"',
    'aria-label="Konto"': 'aria-label="Account"',
    'aria-label="Warenkorb"': 'aria-label="Basket"',
    'aria-label="Telefon"': 'aria-label="Phone"',
    'aria-label="LUMAS, zur Startseite"': 'aria-label="LUMAS, home"',
    'aria-label="Sprache: Deutsch"': 'aria-label="Language: English"',
    '>DE<': '>EN<',

    # --- the offer, in every slot it appears -----------------------------
    # Dates are printed, durations are not. "48H ONLY" is the campaign name and
    # the PDP's own product copy; the purchasable public window is about 36
    # hours, so the page says two days and prints 21 and 22 December instead.
    'ART DROP · 21. UND 22. DEZEMBER · 400 EXEMPLARE, HANDSIGNIERT':
        'ART DROP · 21 AND 22 DECEMBER · 400 PIECES, HAND-SIGNED',
    'EARLY ACCESS · DER DROP ENDET AM 22. DEZEMBER UM 23:59 UHR':
        'EARLY ACCESS · THE DROP ENDS ON 22 DECEMBER AT 23:59',
    'NUR AM 21. UND 22. DEZEMBER · DANACH IST DIE EDITION NICHT MEHR ERHÄLTLICH':
        'ONLY ON 21 AND 22 DECEMBER · AFTER THAT THE EDITION IS NO LONGER AVAILABLE',
    'DER ART DROP IST VORBEI · PENGUINS IN JAPAN IST NICHT MEHR ERHÄLTLICH':
        'THE ART DROP IS OVER · PENGUINS IN JAPAN IS NO LONGER AVAILABLE',
    'Art Drop am 21. und 22. Dezember 2026, bis 23:59 Uhr':
        'Art Drop on 21 and 22 December 2026, until 23:59',
    'EARLY ACCESS IN': 'EARLY ACCESS IN',
    'DER DROP ENDET IN': 'THE DROP ENDS IN',
    'DER DROP IST VORBEI': 'THE DROP IS OVER',
    '>NUR ZWEI TAGE<': '>ONLY TWO DAYS<',
    '>21.–22. DEZEMBER<': '>21–22 DECEMBER<',
    '>NICHT MEHR ERHÄLTLICH<': '>NO LONGER AVAILABLE<',
    '21. und 22. Dezember 2026': '21 and 22 December 2026',
    'Nur am 21. und 22. Dezember, bis 23:59 Uhr. Danach ist die Edition nicht mehr erhältlich.':
        'Only on 21 and 22 December, until 23:59. After that the edition is no longer available.',
    '€ 299, nur am 21. und 22. Dezember bis 23:59 Uhr. Danach ist Penguins in Japan nicht mehr erhältlich.':
        '€ 299, only on 21 and 22 December until 23:59. After that Penguins in Japan is no longer available.',
    'Zwei Tage. 400 Exemplare.': 'Two days. 400 pieces.',
    'Der Art Drop ist vorbei.': 'The Art Drop is over.',
    'Der Art Drop ist vorbei': 'The Art Drop is over',
    'Penguins in Japan war auf 400 Exemplare limitiert und nur am 21. und 22. Dezember erhältlich.':
        'Penguins in Japan was limited to 400 pieces and available only on 21 and 22 December.',
    'Penguins in Japan war auf 400 Exemplare limitiert. Melde dich an, um den nächsten Art Drop nicht zu verpassen.':
        'Penguins in Japan was limited to 400 pieces. Sign up so you do not miss the next Art Drop.',
    '>Preis<': '>Price<',

    # --- the work --------------------------------------------------------
    'Limitierte Edition': 'Limited edition',
    'Mit Penguins in Japan lässt Robert Jahns Wirklichkeit und Fantasie verschmelzen. Vor der Kulisse des Fuji zieht eine Pinguinfamilie durch ein verschneites japanisches Dorf. Warmes Fensterlicht, zartrosa Abendhimmel und Spuren im Schnee lassen die surreale Szene verblüffend natürlich wirken.':
        'In Penguins in Japan, Robert Jahns lets reality and imagination merge. Against the backdrop of Mount Fuji, a family of penguins walks through a snow-covered Japanese village. Warm light in the windows, a pale pink evening sky and tracks in the snow make the surreal scene look startlingly real.',
    '>WERK<': '>WORK<',
    '>EDITION<': '>EDITION<',
    '>FORMAT<': '>FORMAT<',
    '>AUSFÜHRUNG<': '>FINISH<',
    '>SIGNATUR<': '>SIGNATURE<',
    '>VERFÜGBAR<': '>AVAILABLE<',
    'Handsigniert, limitiert auf 400 Exemplare': 'Hand-signed, limited to 400 pieces',
    'Fotografischer Abzug unter glänzendem Acrylglas, rahmenlos':
        'Photographic print under glossy acrylic glass, frameless',
    'Mit Echtheitszertifikat, handsigniert und nummeriert':
        'With a certificate of authenticity, hand-signed and numbered',
    'WERK SICHERN': 'SECURE THE WORK',
    'WEITERE WERKE VON ROBERT JAHNS': 'MORE WORKS BY ROBERT JAHNS',

    # --- newsletter ------------------------------------------------------
    'E-Mail-Adresse': 'Email address',
    'FÜR EARLY ACCESS ANMELDEN': 'SIGN UP FOR EARLY ACCESS',
    'ZUM NEWSLETTER ANMELDEN': 'SIGN UP FOR THE NEWSLETTER',
    'JETZT ANMELDEN': 'SIGN UP NOW',
    'Bitte gib eine gültige E-Mail-Adresse ein.': 'Please enter a valid email address.',
    'Wir melden uns einmal, am 21. Dezember um 08:00 Uhr, bevor die Edition öffentlich verfügbar ist. LUMAS schützt deine Daten (':
        'We will contact you once, on 21 December at 08:00, before the edition opens to the public. LUMAS protects your data (',
    'LUMAS schützt deine Daten (': 'LUMAS protects your data (',
    'Datenschutzerklärung': 'Privacy policy',
    'Du bist dabei.': 'You are in.',
    'Deine Einladung zum Early Access erreicht dich am 21. Dezember um 08:00 Uhr.':
        'Your Early Access invitation reaches you on 21 December at 08:00.',
    'Wir melden uns, sobald der nächste Art Drop startet.':
        'We will be in touch as soon as the next Art Drop begins.',
    'Wir melden uns, sobald es losgeht.': 'We will be in touch as soon as it starts.',
    'Mehr von Robert Jahns ansehen →': 'See more by Robert Jahns →',
    'Melde dich an und erhalte am 21. Dezember um 08:00 Uhr Zugang,':
        'Sign up and get access on 21 December at 08:00,',
    'bevor die Edition öffentlich verfügbar ist.': 'before the edition opens to the public.',

    # --- the one execution -------------------------------------------------
    'Eine Ausführung, von Hand gefertigt.': 'One finish, made by hand.',
    'Für diesen Art Drop gibt es genau eine Ausführung, und sie ist entschieden, bevor du sie siehst: 80 × 60 cm, kaschiert unter glänzendem Acrylglas, rahmenlos.':
        'This Art Drop comes in exactly one finish, and it is settled before you see it: 80 × 60 cm, laminated under glossy acrylic glass, frameless.',
    'Glänzendes Acrylglas': 'Glossy acrylic glass',
    'Der fotografische Abzug wird unter glänzendes Acrylglas kaschiert. Die Oberfläche gibt dem Motiv Tiefe und Leuchtkraft, besonders in den Schneeflächen und im Abendhimmel.':
        'The photographic print is laminated under glossy acrylic glass. The surface gives the image depth and luminosity, most of all in the fields of snow and the evening sky.',
    'Rahmenlos, handgefertigt': 'Frameless, handmade',
    'Die Edition kommt ohne Rahmen an die Wand. Nichts steht zwischen dem Bild und dem Raum, und das Format bleibt, wie der Künstler es angelegt hat: 80 × 60 cm.':
        'The edition goes on the wall without a frame. Nothing stands between the image and the room, and the format stays as the artist set it: 80 × 60 cm.',
    'Handsigniert und nummeriert': 'Hand-signed and numbered',
    'Jedes der 400 Exemplare ist vom Künstler handsigniert und trägt seine Editionsnummer. Das Echtheitszertifikat liegt bei.':
        'Each of the 400 pieces is hand-signed by the artist and carries its edition number. The certificate of authenticity is included.',
    'MEHR DETAILS': 'MORE DETAILS',

    # --- voice -----------------------------------------------------------
    'Der Künstler': 'The artist',
    'Er baut Welten, die es nicht gibt, und lässt sie echt aussehen.':
        'He builds worlds that do not exist, and makes them look real.',
    '„In meinen Werken stecken viele Emotionen und in jeder neuen Kreation steckt ein Stück meiner Seele.“':
        '“There is a lot of emotion in my works, and a piece of my soul in every new creation.”',
    'Robert Jahns lebt und arbeitet in Hamburg. Mit 15 entdeckte er Fotografie und Bildbearbeitung, daraus wurde ein Stil, den er seit vielen Jahren beibehält: farbstarke Fotomontagen, die Mensch, Natur und Bewegung zusammenführen. Bekannt wurde er mit Serien wie NYC Balloons und Dreams, in denen Städte Szenen zeigen, die dort niemand erwartet.':
        'Robert Jahns lives and works in Hamburg. At 15 he discovered photography and image editing, and out of that came a style he has kept for many years: strongly coloured photomontages that bring together people, nature and movement. He became known for series such as NYC Balloons and Dreams, in which cities hold scenes nobody expects to find there.',
    'Auszeichnungen': 'Awards',
    'Im Überblick': 'At a glance',
    'Influencer of the Year, Fotografie, German Influencer Awards':
        'Influencer of the Year, Photography, German Influencer Awards',
    'Platz 1 weltweit, Kategorie Kunst, Top 100 Photographers on the Web':
        'First worldwide, Art category, Top 100 Photographers on the Web',
    'Platz 1 Deutschland, Top 100 Photographers on the Web':
        'First in Germany, Top 100 Photographers on the Web',
    '>Arbeitet<': '>Works<',
    '>in Hamburg<': '>in Hamburg<',
    '>Technik<': '>Technique<',
    'Digitale Fotomontage': 'Digital photomontage',
    '>Serien<': '>Series<',
    '>Finalist<': '>Finalist<',

    # --- rooms -----------------------------------------------------------
    'Rahmenlos an der Wand, 80 × 60 cm.': 'Frameless on the wall, 80 × 60 cm.',
    'Der zartrosa Abendhimmel bringt Wärme in kühle Räume, die Schneeflächen halten das Bild ruhig. Fünf Hängungen, damit du siehst, wie sich das Licht darin verändert.':
        'The pale pink evening sky brings warmth into cool rooms, and the fields of snow keep the image quiet. Five hangings, so you can see how the light in it changes.',

    # --- inspiration -----------------------------------------------------
    'Über das Werk': 'About the work',
    'Ein Dorf im Schnee, der Fuji dahinter, und eine Pinguinfamilie, die dort niemand erwartet.':
        'A village in the snow, Mount Fuji behind it, and a family of penguins nobody expects to find there.',
    'Robert Jahns baut seine Bilder am Rechner, aus Aufnahmen, die so nie zusammengehört haben. Warmes Fensterlicht, zartrosa Abendhimmel, Spuren im Schnee: jedes Detail stimmt, nur die Bewohner nicht. Genau an dieser Stelle setzt seine Arbeit an. Man sieht eine Winterszene, die es geben könnte, und merkt erst im zweiten Blick, dass sie es nicht gibt.':
        'Robert Jahns builds his images on the computer, out of photographs that never belonged together. Warm light in the windows, a pale pink evening sky, tracks in the snow: every detail is right except the residents. That is exactly where his work begins. You see a winter scene that could exist, and only on second look realise that it does not.',
    '„Meine Kunst finde ich in meinen Gedanken und meiner Leidenschaft.“':
        '“I find my art in my thoughts and my passion.”',
    'Die Idee steht bei ihm vor dem Bild. Er visualisiert die Szene zuerst im Kopf und baut sie dann Ebene für Ebene auf, und die Farbe trägt dabei die Stimmung: hier ein Abendhimmel, der ein verschneites Dorf eher warm als kalt erscheinen lässt.':
        'The idea comes before the image for him. He visualises the scene in his head first and then builds it layer by layer, and colour carries the mood: here an evening sky that makes a snow-covered village read as warm rather than cold.',

    # --- assure (the trust row under the buy box) -------------------------
    'Streng limitiert': 'Strictly limited',
    '400 Exemplare, handsigniert und nummeriert': '400 pieces, hand-signed and numbered',
    'Versichert versandt': 'Shipped insured',
    'sicher verpackt für den Transport': 'securely packed for transport',
    '60 Tage Rückgaberecht': '60-day right of return',
    'ohne Angabe von Gründen': 'no reason required',
    '</span> von <span': '</span> of <span',
    '>verkauft<': '>sold<',

    # --- continue: more works by the artist --------------------------------
    'Weitere Werke von Robert Jahns': 'More works by Robert Jahns',
    'aria-label="Vorherige Werke"': 'aria-label="Previous works"',
    'aria-label="Weitere Werke"': 'aria-label="More works"',
    'zur Wunschliste hinzufügen': 'add to wishlist',
    'WERK · ': 'WORK · ',
    'von Robert Jahns:': 'by Robert Jahns:',
    'von Robert Jahns.': 'by Robert Jahns.',
    'Central Park Penguins von Robert Jahns: Pinguine im verschneiten Central Park vor der Skyline von Manhattan.':
        'Central Park Penguins by Robert Jahns: penguins in a snow-covered Central Park against the Manhattan skyline.',
    'San Francisco Emperor Penguins von Robert Jahns: Kaiserpinguine vor der Golden Gate Bridge.':
        'San Francisco Emperor Penguins by Robert Jahns: emperor penguins in front of the Golden Gate Bridge.',
    'Cape Town Penguins von Robert Jahns: Pinguine an der Küste von Kapstadt vor dem Tafelberg.':
        'Cape Town Penguins by Robert Jahns: penguins on the coast at Cape Town below Table Mountain.',
    'Neuschwanstein von Robert Jahns: das Schloss in winterlicher Landschaft.':
        'Neuschwanstein by Robert Jahns: the castle in a winter landscape.',
    'Whale in Venice von Robert Jahns: ein Wal taucht in einem Kanal von Venedig auf.':
        'Whale in Venice by Robert Jahns: a whale surfacing in a Venetian canal.',
    'Angkor Wat von Robert Jahns: die Tempelanlage, gespiegelt im Wasser.':
        'Angkor Wat by Robert Jahns: the temple complex mirrored in the water.',
    'Colorful Zebras von Robert Jahns: Zebras mit farbigen Streifen in einer weiten Landschaft.':
        'Colorful Zebras by Robert Jahns: zebras with coloured stripes in a wide landscape.',
    'London Balloons II von Robert Jahns: bunte Ballons über den Dächern von London.':
        'London Balloons II by Robert Jahns: coloured balloons above the rooftops of London.',
    'Tower Bridge Balloons von Robert Jahns: Ballons über der Tower Bridge.':
        'Tower Bridge Balloons by Robert Jahns: balloons above Tower Bridge.',

    # --- rooms carousel ---------------------------------------------------
    'aria-label="Vorheriges Bild"': 'aria-label="Previous image"',
    'aria-label="Nächstes Bild"': 'aria-label="Next image"',
    'aria-label="Penguins in Japan im Raum, Bildergalerie"':
        'aria-label="Penguins in Japan in the room, image gallery"',

    # --- alt text ---------------------------------------------------------
    'Penguins in Japan von Robert Jahns, rahmenlos unter Acrylglas, an der Wand eines Wohnraums.':
        'Penguins in Japan by Robert Jahns, frameless under acrylic glass, on the wall of a living room.',
    'Penguins in Japan von Robert Jahns, rahmenlos an der Wand eines Wohnraums.':
        'Penguins in Japan by Robert Jahns, frameless on the wall of a living room.',
    'Penguins in Japan von Robert Jahns: eine Pinguinfamilie zieht durch ein verschneites japanisches Dorf, dahinter der Fuji vor zartrosa Abendhimmel, warmes Licht in den Fenstern.':
        'Penguins in Japan by Robert Jahns: a family of penguins walks through a snow-covered Japanese village, Mount Fuji behind it against a pale pink evening sky, warm light in the windows.',
    'Nahaufnahme der Kante des glänzenden Acrylglases, unter das der fotografische Abzug kaschiert ist.':
        'Close-up of the edge of the glossy acrylic glass the photographic print is laminated under.',
    'Seitenansicht der rahmenlosen Edition an der Wand, die Kante steht frei.':
        'Side view of the frameless edition on the wall, the edge standing clear.',
    'Die Handsignatur von Robert Jahns und die Editionsnummer auf der Rückseite der Edition.':
        'The hand signature of Robert Jahns and the edition number on the back of the edition.',
    'Porträt von Robert Jahns.': 'Portrait of Robert Jahns.',

    # --- fallback labels (and the placeholder panels they name) -----------
    'WERK · PENGUINS IN JAPAN': 'WORK · PENGUINS IN JAPAN',
    'HERO · RAUM MIT WERK · 16:9': 'HERO · ROOM WITH WORK · 16:9',
    'HERO MOBIL · RAUM MIT WERK · 3:4': 'HERO MOBILE · ROOM WITH WORK · 3:4',
    'RAUM 1 · 3:2': 'ROOM 1 · 3:2',
    'RAUM 2 · 3:2': 'ROOM 2 · 3:2',
    'RAUM 3 · 3:2': 'ROOM 3 · 3:2',
    'RAUM 4 · 3:2': 'ROOM 4 · 3:2',
    'RAUM 5 · 3:2': 'ROOM 5 · 3:2',
    'DETAIL · ACRYLGLASKANTE · 3:2': 'DETAIL · ACRYLIC EDGE · 3:2',
    'DETAIL · RAHMENLOSE KANTE · 3:2': 'DETAIL · FRAMELESS EDGE · 3:2',
    'DETAIL · SIGNATUR UND NUMMER · 3:2': 'DETAIL · SIGNATURE AND NUMBER · 3:2',
    'PORTRÄT · ROBERT JAHNS · 4:3': 'PORTRAIT · ROBERT JAHNS · 4:3',

    # --- script strings --------------------------------------------------
    "const PRICE = '€ 299';": "const PRICE = '€ 299';",
    'Set to an integer (0-400) to display "<n> von 400 verkauft".':
        'Set to an integer (0-400) to display "<n> of 400 sold".',
    "segs.push([pad(d), 'TAGE']);": "segs.push([pad(d), 'DAYS']);",
    "segs.push([pad(h), 'STD'], [pad(m), 'MIN'], [pad(s), 'SEK']);":
        "segs.push([pad(h), 'HRS'], [pad(m), 'MIN'], [pad(s), 'SEC']);",
    "'de-DE'": "'en-GB'",
    "' Bild-Platzhalter · '": "' image placeholders · '",
    "' offene Texte · '": "' open copy items · '",
    "'echte Zeit'": "'real time'",
    "'kein Stock-Feed'": "'no stock feed'",
    "'Stock ok'": "'stock ok'",
    "'Kaufphase ansehen'": "'View buy phase'",
    "'Ankündigung ansehen'": "'View announce phase'",
}

BANNER = """<!DOCTYPE html>
<!-- ============================================================================
     ENGLISH REVIEW COPY — generated by translate-en.py from penguins-art-drop.html.
     Do not hand-edit: this file is overwritten on every regeneration.
     NOT a market build. This drop is DE only; pricing stays EUR and links
     point at lumas.de.
============================================================================ -->"""

# Words that mean the pass missed something. Kept narrow on purpose: a broad
# rule fires on brand and place names.
# "Edition" is deliberately absent: it is the same word in both languages, and
# listing it made the validator fail on correct English.
GERMAN = re.compile(
    r'[äöüßÄÖÜ]'
    r'|^(?:der|die|das|den|dem|des|und|oder|mit|von|vom|zum|zur|auf|aus|bei'
    r'|nicht|wird|werden|sind|eine|einen|einem|einer|dich|deine|Uhr|Werk|Werke'
    r'|Exemplare|Signatur|Ausführung|Abzug|Rahmen|rahmenlos|Dorf|Schnee'
    r'|Pinguine|Galerien|Kunstwerke|Suche|Sammler|Dezember|Raum|Räume|Bild)$'
    r'|EN$(?<=ONEN)', re.I)

# Legitimately German, or shared, in an English page: proper nouns and names.
ALLOW = {'jahns', 'robert', 'hamburg', 'lumas', 'penguins', 'japan', 'fuji',
         'art', 'drop', 'december', 'balloons', 'london', 'tower', 'bridge',
         'angkor', 'wat', 'neuschwanstein', 'venice', 'whale', 'central',
         'park', 'cape', 'town', 'san', 'francisco', 'emperor', 'colorful',
         'zebras', 'nyc', 'dreams', 'influencer', 'year', 'photography',
         'german', 'awards', 'top', 'photographers', 'web', 'instagrammer',
         'shorty', 'finalist', 'series', 'technique', 'works'}


def main():
    s = SRC.read_text(encoding='utf-8')
    # longest key first, so a long sentence is replaced before a short substring
    # of it can chop the sentence into a half-translated hybrid
    for de, en in sorted(T.items(), key=lambda kv: -len(kv[0])):
        s = _flex(de).sub(lambda _m, e=en: e, s)
    s = s.replace('<!DOCTYPE html>', BANNER, 1)
    OUT.write_text(s, encoding='utf-8')

    body = re.sub(r'<script.*?</script>|<style.*?</style>|<!--.*?-->', '', s, flags=re.S)
    # user-facing attributes count as copy too
    attrs = ' '.join(m.group(2) for m in re.finditer(
        r'\b(alt|aria-label|title|placeholder|data-fallback)="([^"]*)"', body))
    visible = re.sub(r'<[^>]+>', ' ', body) + ' ' + attrs
    leftovers = sorted({w for w in re.findall(r'[A-Za-zÄÖÜäöüß]{3,}', visible)
                        if GERMAN.search(w) and w.lower() not in ALLOW})

    print('wrote', OUT.name, len(s), 'chars')
    # the English copy needs the same line-break binding as the German
    subprocess.run([sys.executable,
                    str(pathlib.Path(__file__).with_name('fix-typography.py')),
                    str(OUT)], check=True)
    if leftovers:
        print('UNTRANSLATED GERMAN:', leftovers, file=sys.stderr)
        sys.exit(1)
    print('no untranslated German found')


main()
