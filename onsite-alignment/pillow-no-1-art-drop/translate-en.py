#!/usr/bin/env python3
"""Regenerate the English review copy from the German canonical.

    python3 translate-en.py

Edit pillow-art-drop.html (German) and re-run. Never hand-edit the English
file: it is a build artefact and will be overwritten. If a new German string
appears, add it to T below; the script exits non-zero if any German survives.

Two rules learned the expensive way on the previous build:

  * The validator scans user-facing ATTRIBUTES (alt, aria-label, title,
    placeholder, data-fallback) as well as text nodes. Stripping tags wholesale
    once hid a half-translated alt for weeks.
  * Entries are whole strings, not word fragments. A bare word rule turned
    AUSFÜHRUNGEN into EXECUTIONEN and produced "CERTIFICATE · CERTIFICATE".

NB = U+00A0. The German source uses real non-breaking spaces (not &nbsp;) in
units, dimensions and prices, so the keys below have to carry them too.
"""
import pathlib
import re
import sys

SRC = pathlib.Path(__file__).with_name('pillow-art-drop.html')
OUT = pathlib.Path(__file__).with_name('pillow-art-drop-en.html')

NB = ' '

T = {
    '<html lang="de">': '<html lang="en">',

    # --- head ------------------------------------------------------------
    'Pillow No. 1 von Rafael Neff. Messing, spiegelpoliert, 44 × 44 cm, Unikatsedition von 999 Exemplaren. LUMAS Art Drop, 12. – 14. September 2026.':
        'Pillow No. 1 by Rafael Neff. Brass, mirror-polished, 44 × 44 cm, unique edition of 999 pieces. LUMAS Art Drop, 12 – 14 September 2026.',

    # --- chrome ----------------------------------------------------------
    'Zum Inhalt springen': 'Skip to content',
    '>Kunstwerke<': '>Artworks<',
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

    # --- phase banners and countdown labels (script side too) ------------
    'EARLY ACCESS AM 11. SEPTEMBER, 09:00 UHR': 'EARLY ACCESS ON 11 SEPTEMBER, 09:00',
    'EARLY ACCESS · VORZUGSPREIS BIS 14. SEPTEMBER': 'EARLY ACCESS · PRICE ADVANTAGE UNTIL 14 SEPTEMBER',
    'VORZUGSPREIS BIS 14. SEPTEMBER, 23:59 UHR': 'PRICE ADVANTAGE UNTIL 14 SEPTEMBER, 23:59',
    'VORZUGSPREIS ENDET IN': 'PRICE ADVANTAGE ENDS IN',
    'VORZUGSPREIS BEENDET': 'PRICE ADVANTAGE ENDED',
    'Vorzugspreis bis 14. September 2026, 23:59 Uhr': 'Price advantage until 14 September 2026, 23:59',

    # --- proof -----------------------------------------------------------
    '>12.–14. SEPTEMBER<': '>12–14 SEPTEMBER<',

    # --- the work --------------------------------------------------------
    'Pillow No. 1: ein Kissen, im Moment des Aufblasens angehalten. Was sich weich anfühlen müsste, ist spiegelpoliertes Messing, das den Raum um sich herum zurückgibt.':
        'Pillow No. 1: a pillow, stopped at the moment of inflation. What ought to feel soft is mirror-polished brass, giving back the room around it.',
    '>WERK<': '>WORK<',
    '>EDITION<': '>EDITION<',
    '>MASSE<': '>DIMENSIONS<',
    '>MATERIAL<': '>MATERIAL<',
    '>SIGNATUR<': '>SIGNATURE<',
    '>VORZUGSPREIS<': '>PRICE ADVANTAGE<',
    'Unikatsedition, limitiert auf 999 Exemplare': 'Unique edition, limited to 999 pieces',
    f'Skulptur 44{NB}×{NB}44{NB}×{NB}15{NB}cm, Sockel 15,5{NB}×{NB}15,5{NB}×{NB}4{NB}cm':
        f'Sculpture 44{NB}×{NB}44{NB}×{NB}15{NB}cm, base 15.5{NB}×{NB}15.5{NB}×{NB}4{NB}cm',
    'Messing, spiegelpoliert, mit Sockel aus geräucherter Eiche':
        'Brass, mirror-polished, with a base of smoked oak',
    'Vom Künstler signiert, mit Datum und Editionsnummer':
        'Signed by the artist with date and edition number',
    '12. – 14. September 2026': '12 – 14 September 2026',
    'WERK SICHERN': 'SECURE THE WORK',
    'Der Vorzugspreis gilt bis 14. September, 23:59 Uhr. Danach bleibt Pillow No. 1 erhältlich, zu einem höheren Preis.':
        'The price advantage runs until 14 September, 23:59. After that Pillow No. 1 stays available, at a higher price.',
    'Der Vorzugspreis ist beendet.': 'The price advantage has ended.',
    'Der Vorzugspreis ist beendet': 'The price advantage has ended',
    'Pillow No. 1 bleibt erhältlich. Den aktuellen Preis findest du auf der Werkseite.':
        'Pillow No. 1 stays available. The current price is on the product page.',
    'ZUM WERK': 'GO TO THE WORK',

    # --- newsletter ------------------------------------------------------
    'E-Mail-Adresse': 'Email address',
    'JETZT FÜR EARLY ACCESS ANMELDEN': 'SIGN UP FOR EARLY ACCESS',
    'ZUM NEWSLETTER ANMELDEN': 'SIGN UP FOR THE NEWSLETTER',
    'JETZT ANMELDEN': 'SIGN UP NOW',
    'Bitte gib eine gültige E-Mail-Adresse ein.': 'Please enter a valid email address.',
    'Wir melden uns einmal, am 11. September um 09:00 Uhr, bevor die Edition öffentlich verfügbar ist. LUMAS schützt deine Daten (':
        'We will contact you once, on 11 September at 09:00, before the edition opens to the public. LUMAS protects your data (',
    'LUMAS schützt deine Daten (': 'LUMAS protects your data (',
    'Datenschutzerklärung': 'Privacy policy',
    'Du bist dabei.': 'You are in.',
    'Deine Einladung zum Early Access erreicht dich am 11. September um 09:00 Uhr.':
        'Your Early Access invitation reaches you on 11 September at 09:00.',
    'Wir melden uns, sobald der nächste Art Drop startet.':
        'We will be in touch as soon as the next Art Drop begins.',
    'Wir melden uns, sobald es losgeht.': 'We will be in touch as soon as it starts.',
    'Werk zur Wunschliste hinzufügen →': 'Add work to wishlist →',

    # --- own it ----------------------------------------------------------
    'Handgefertigt bis ins letzte Detail.': 'Handcrafted down to the finest detail.',
    'Messing, spiegelpoliert': 'Brass, mirror-polished',
    f'Verschweißt, aufgeblasen und spiegelpoliert. Sechsfach mit Instrumentenlack lackiert und bei 185{NB}°C eingebrannt: eine makellose, tief spiegelnde Oberfläche, die Raum und Betrachter neu inszeniert.':
        f'Welded, inflated and mirror-polished. Lacquered in six layers with instrument lacquer and kiln-fired at 185{NB}°C: a flawless, deeply reflective surface that mirrors and reimagines the room and the viewer.',
    'Sockel aus geräucherter Eiche': 'A base of smoked oak',
    f'Der Sockel setzt einen warmen Kontrast zur kühlen Metalloberfläche und verleiht der Skulptur natürliche Erdung. 15,5{NB}×{NB}15,5{NB}×{NB}4{NB}cm.':
        f'The base sets a warm contrast to the cool metal surface and grounds the sculpture with natural presence. 15.5{NB}×{NB}15.5{NB}×{NB}4{NB}cm.',
    'Signiert, datiert, nummeriert': 'Signed, dated, numbered',
    'Als Unikatsedition ist jedes Pillow ein einzigartiges Werk, vom Künstler mit Datum und Editionsnummer signiert.':
        'As part of a unique edition, each Pillow is a one-of-a-kind piece, signed by the artist with date and edition number.',
    'MEHR DETAILS': 'MORE DETAILS',

    # --- voice -----------------------------------------------------------
    '⚠︎ Platzhalter': '⚠︎ Placeholder',
    'Künstlerporträt Rafael Neff': 'Artist portrait Rafael Neff',
    '4:5 · Asset fehlt': '4:5 · asset missing',
    'Der Künstler': 'The artist',
    'Bei ihm ist die Oberfläche kein Bildträger, sondern ein raumbildendes Element.':
        'In his work the surface is not a carrier for an image, it is an element that shapes the room.',
    'Rafael Neff, 1969 in Freienseen geboren, studierte Fotografie in Mainz, Prag und New York und war Meisterschüler von Kevin Clarke. Bekannt wurde er für menschenleere Innenräume, in denen Strandkörbe zu Skulpturen und Bibliotheken zu Kathedralen werden. Seit vielen Jahren arbeitet er zusätzlich mit Messing und Kupfer: hochglanzpolierte Oberflächen, die Reflexion, Tiefe und Präsenz in die Arbeit einschreiben.':
        'Rafael Neff, born in Freienseen in 1969, studied photography in Mainz, Prague and New York and was a master student of Kevin Clarke. He became known for interiors without people, where beach chairs turn into sculptures and libraries into cathedrals. For many years he has also worked in brass and copper: high-gloss polished surfaces that write reflection, depth and presence into the work.',

    # --- rooms -----------------------------------------------------------
    'Sie braucht keine Wand. Nur eine Fläche und Licht.':
        'It needs no wall. Only a surface and light.',
    f'44{NB}×{NB}44{NB}cm auf einem Sockel von 15,5{NB}cm: die Skulptur nimmt wenig Platz und verändert doch, wie ein Raum sich anfühlt.':
        f'44{NB}×{NB}44{NB}cm on a 15.5{NB}cm base: the sculpture takes little space and still changes how a room feels.',

    # --- inspiration -----------------------------------------------------
    'Über das Werk': 'About the work',
    'Ein Kissen trägt die Spur des Abends zuvor. Hier ist diese Spur in Messing verschweißt und bleibt.':
        'A pillow carries the trace of the evening before. Here that trace is welded into brass, and stays.',
    f'Weiches gilt als flüchtig. Es gibt nach, es verliert die Form, am Morgen wird es wieder glattgezogen. Rafael Neff hält den Moment davor an: verschweißt, aufgeblasen, spiegelpoliert, sechsfach mit Instrumentenlack lackiert und bei 185{NB}°C eingebrannt. Aus der weichen Geste wird eine harte, tief reflektierende Oberfläche, in der Raum und Betrachter erscheinen. Was bleibt, ist die Erinnerung an eine Berührung, in einem Material, das sie überdauert.':
        f'Soft things are taken to be fleeting. They give way, they lose their shape, in the morning they are smoothed out again. Rafael Neff stops the moment before: welded, inflated, mirror-polished, lacquered in six layers with instrument lacquer and kiln-fired at 185{NB}°C. The soft gesture becomes a hard, deeply reflective surface in which the room and the viewer appear. What remains is the memory of a touch, in a material that outlasts it.',

    # --- trust -----------------------------------------------------------
    '330.000 zufriedene Sammler:innen': '330,000 satisfied collectors',
    'seit 2004': 'since 2004',
    '>19 Galerien weltweit<': '>19 galleries worldwide<',
    'Werke vor Ort ansehen': 'See works in person',
    '60 Tage Rückgaberecht': '60-day right of return',
    'ohne Angabe von Gründen': 'no reason required',

    # --- close -----------------------------------------------------------
    'Drei Tage. 999 Unikate.': 'Three days. 999 one-of-a-kind pieces.',
    'Melde dich an und erhalte am 11. September um 09:00 Uhr Zugang,':
        'Sign up and get access on 11 September at 09:00,',
    'bevor die Edition öffentlich verfügbar ist.': 'before the edition opens to the public.',
    '</span> von <span': '</span> of <span',
    '>verkauft<': '>sold<',
    f'Der Vorzugspreis von 1.950{NB}€ gilt bis zum 14. September, 23:59 Uhr.':
        f'The price advantage of €1,950 runs until 14 September, 23:59.',
    'Pillow No. 1 bleibt erhältlich, zu einem höheren Preis. Melde dich an, um den nächsten Art Drop nicht zu verpassen.':
        'Pillow No. 1 stays available, at a higher price. Sign up so you do not miss the next Art Drop.',
    f'>1.950{NB}€<': '>€1,950<',

    # --- continue --------------------------------------------------------
    'Weitere Werke von Rafael Neff': 'More works by Rafael Neff',
    'von Rafael Neff.': 'by Rafael Neff.',
    'zur Wunschliste hinzufügen': 'add to wishlist',
    'aria-label="Vorheriges Bild"': 'aria-label="Previous image"',
    'aria-label="Nächstes Bild"': 'aria-label="Next image"',
    'aria-label="Vorherige Werke"': 'aria-label="Previous works"',
    'aria-label="Weitere Werke"': 'aria-label="More works"',
    'aria-label="Pillow No. 1 im Raum, Bildergalerie"': 'aria-label="Pillow No. 1 in the room, image gallery"',

    # --- alt text --------------------------------------------------------
    'Pillow No. 1 auf einem Sockel und einer weißen Stele in einem Pariser Altbau-Salon, Fischgrätparkett und Nachmittagslicht.':
        'Pillow No. 1 on its base and a white plinth in a Parisian period salon, herringbone parquet and afternoon light.',
    'Pillow No. 1 von Rafael Neff: eine aufgeblasene, spiegelpolierte Messingform auf der Spitze stehend, auf einem Sockel aus geräucherter Eiche.':
        'Pillow No. 1 by Rafael Neff: an inflated, mirror-polished brass form standing on one point, on a base of smoked oak.',
    'Nahaufnahme der spiegelpolierten Messingkante von Pillow No. 1 mit sichtbarer Schweißnaht.':
        'Close-up of the mirror-polished brass edge of Pillow No. 1 with the weld seam visible.',
    'Der Sockel aus geräucherter Eiche, auf dem die Messingform mit einer einzigen Spitze aufsetzt.':
        'The smoked oak base, where the brass form meets it on a single point.',
    'Makro-Detail der eingezogenen Mitte von Pillow No. 1, wo vier Flächen in einem Punkt zusammenlaufen.':
        'Macro detail of the drawn-in centre of Pillow No. 1, where four surfaces meet at one point.',
    'Pillow No. 1 auf einer weißen Stele in einem Wohnraum mit Kamin, Bouclé-Sofa und Sisalteppich.':
        'Pillow No. 1 on a white plinth in a living room with a fireplace, bouclé sofa and sisal rug.',
    'Pillow No. 1 in einem Pariser Altbau-Salon vor einer hellen Wand, daneben ein hohes Fenster.':
        'Pillow No. 1 in a Parisian period salon against a pale wall, beside a tall window.',
    'Pillow No. 1 auf einer Stele in einem mediterranen Wohnraum mit Olivenbaum, Holzbalken und Blick in den Garten.':
        'Pillow No. 1 on a plinth in a Mediterranean living room with an olive tree, timber beams and a view into the garden.',

    # --- fallback labels -------------------------------------------------
    'ROOM SHOT · SALON PARIS · 3:2': 'ROOM SHOT · PARIS SALON · 3:2',
    'SKULPTUR · PILLOW NO. 1 · 3:2': 'SCULPTURE · PILLOW NO. 1 · 3:2',
    'DETAIL · OBERFLÄCHE · 3:2': 'DETAIL · SURFACE · 3:2',
    'DETAIL · SOCKEL · 3:2': 'DETAIL · BASE · 3:2',
    'DETAIL · NAHT · 3:2': 'DETAIL · SEAM · 3:2',
    'ROOM SHOT · WOHNRAUM · 3:2': 'ROOM SHOT · LIVING ROOM · 3:2',
    'ROOM SHOT · MEDITERRAN · 4:3': 'ROOM SHOT · MEDITERRANEAN · 4:3',
    'WERK · ': 'WORK · ',

    # --- script strings --------------------------------------------------
    "const PRICE = '1.950 €';": "const PRICE = '€1,950';",
    'Set to an integer (0-999) to display "<n> von 999 verkauft". */':
        'Set to an integer (0-999) to display "<n> of 999 sold". */',
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
    "'Reveal ansehen'": "'View reveal'",
    'aria-label="Phase (dev)"': 'aria-label="Phase (dev)"',
}

BANNER = """<!DOCTYPE html>
<!-- ============================================================================
     ENGLISH REVIEW COPY — generated by translate-en.py from pillow-art-drop.html.
     Do not hand-edit: this file is overwritten on every regeneration.
     NOT a market build. Pricing stays EUR and links point at lumas.de.
============================================================================ -->"""

# Words that mean the pass missed something. Kept narrow on purpose: a broad
# rule fires on brand and place names (Rafael Neff, Freienseen, Mainz).
GERMAN = re.compile(
    r'[äöüßÄÖÜ]'
    r'|^(?:der|die|das|den|dem|des|und|oder|mit|von|vom|zum|zur|auf|aus|bei'
    r'|nicht|wird|werden|sind|eine|einen|einem|einer|dich|deine|Uhr|Werk|Werke'
    r'|Exemplare|Skulptur|Sockel|Signatur|Masse|Vorzugspreis|Platzhalter'
    r'|Kissen|Messing|Unikate|Galerien|Kunstwerke|Suche|Sammler)$'
    r'|EN$(?<=ONEN)', re.I)
# "Edition" is deliberately absent above: it is the same word in both
# languages, and listing it made the validator fail on correct English.

# Legitimately German in an English page: proper nouns and place names.
ALLOW = {'neff', 'rafael', 'freienseen', 'mainz', 'lumas', 'pillow', 'clarke',
         'kevin', 'gallen', 'stiftsbibliothek', 'nationalbibliothek', 'wien',
         'margaux', 'chateau', 'bordeaux', 'audemars', 'piguet', 'ulysse',
         'nardin', 'squelette', 'astrolabium', 'galilei', 'galileo', 'poplars',
         'silver', 'ocean', 'complication', 'grande', 'york', 'public',
         'library', 'new', 'september', 'art', 'drop'}


def main():
    s = SRC.read_text(encoding='utf-8')
    # longest key first, so a long sentence is replaced before a short substring
    # of it can chop the sentence into a half-translated hybrid
    for de, en in sorted(T.items(), key=lambda kv: -len(kv[0])):
        s = s.replace(de, en)
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
    if leftovers:
        print('UNTRANSLATED GERMAN:', leftovers, file=sys.stderr)
        sys.exit(1)
    print('no untranslated German found')


main()
