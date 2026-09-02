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
units, dimensions and prices, so the keys below have to carry them too. Watch
for this when copying a key by hand: a plain space silently fails to match, and
the only symptom is an untranslated string in the report.
"""
import pathlib
import re
import subprocess
import sys

SRC = pathlib.Path(__file__).with_name('pillow-art-drop.html')
OUT = pathlib.Path(__file__).with_name('pillow-art-drop-en.html')

NB = ' '


def _flex(key):
    """Match a key whether its spaces are plain or non-breaking.

    fix-typography.py rewrites the source with real U+00A0 between bound words,
    which used to make every long key in T miss silently. Rather than keeping two
    copies of every sentence, the key is compiled into a pattern where each
    space matches either kind.
    """
    return re.compile(''.join(
        '[ \u00a0]' if ch in ' \u00a0' else re.escape(ch) for ch in key))


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

    # --- the offer, in every slot it appears -----------------------------
    'EARLY ACCESS AM 11. SEPTEMBER · EINFÜHRUNGSPREIS 12.–14. SEPTEMBER':
        'EARLY ACCESS ON 11 SEPTEMBER · INTRODUCTORY PRICE 12–14 SEPTEMBER',
    'EARLY ACCESS · EINFÜHRUNGSPREIS BIS 14. SEPTEMBER, DANACH STEIGT DER PREIS':
        'EARLY ACCESS · INTRODUCTORY PRICE UNTIL 14 SEPTEMBER, THEN THE PRICE RISES',
    'EINFÜHRUNGSPREIS NUR BIS 14. SEPTEMBER, 23:59 UHR · DANACH STEIGT DER PREIS':
        'INTRODUCTORY PRICE ONLY UNTIL 14 SEPTEMBER, 23:59 · THEN THE PRICE RISES',
    'EINFÜHRUNGSPREIS BEENDET · PILLOW NO. 1 WEITERHIN ERHÄLTLICH':
        'INTRODUCTORY PRICE ENDED · PILLOW NO. 1 STILL AVAILABLE',
    'EINFÜHRUNGSPREIS ENDET IN': 'INTRODUCTORY PRICE ENDS IN',
    'EINFÜHRUNGSPREIS BEENDET': 'INTRODUCTORY PRICE ENDED',
    'Einführungspreis bis 14. September 2026, 23:59 Uhr':
        'Introductory price until 14 September 2026, 23:59',
    '>EINFÜHRUNGSPREIS<': '>INTRODUCTORY PRICE<',
    '>WEITERHIN ERHÄLTLICH<': '>STILL AVAILABLE<',
    '>Einführungspreis<': '>Introductory price<',
    '>12.–14. SEPTEMBER<': '>12–14 SEPTEMBER<',
    '12. – 14. September 2026, danach höher': '12 – 14 September 2026, higher after that',
    'Nur bis 14. September, 23:59 Uhr. Danach bleibt Pillow No. 1 erhältlich, der Preis steigt.':
        'Only until 14 September, 23:59. After that Pillow No. 1 stays available and the price rises.',
    'Der Einführungspreis ist beendet.': 'The introductory price has ended.',
    'Der Einführungspreis ist beendet': 'The introductory price has ended',
    'Der Einführungspreis von 1.950' + NB + '€ gilt nur bis zum 14. September, 23:59 Uhr. Danach bleibt Pillow No. 1 erhältlich, der Preis steigt.':
        'The introductory price of €1,950 runs only until 14 September, 23:59. After that Pillow No. 1 stays available and the price rises.',
    'Drei Tage Einführungspreis. 999 Unikate.':
        'Three days at the introductory price. 999 one-of-a-kind pieces.',
    '>1.950' + NB + '€<': '>€1,950<',

    # --- the work --------------------------------------------------------
    'Handgefertigtes Unikat': 'Handcrafted, one of a kind',
    'Pillow No. 1: ein Kissen, im Moment des Aufblasens angehalten. Was sich weich anfühlen müsste, ist spiegelpoliertes Messing. Jedes Exemplar wird von Hand verschweißt und aufgeblasen, keine zwei sind gleich.':
        'Pillow No. 1: a pillow, stopped at the moment of inflation. What ought to feel soft is mirror-polished brass. Every piece is welded and inflated by hand, and no two are alike.',
    '>WERK<': '>WORK<',
    # written GRÖSSE rather than relying on text-transform to case the ß:
    # the label is authored uppercase like every other spec label
    '>GRÖSSE<': '>DIMENSIONS<',
    '>SIGNATUR<': '>SIGNATURE<',
    'Unikatsedition, 999 handgefertigte Exemplare': 'Unique edition, 999 handcrafted pieces',
    'Skulptur 44' + NB + '×' + NB + '44' + NB + '×' + NB + '15' + NB + 'cm, Sockel 15,5' + NB + '×' + NB + '15,5' + NB + '×' + NB + '4' + NB + 'cm':
        'Sculpture 44' + NB + '×' + NB + '44' + NB + '×' + NB + '15' + NB + 'cm, base 15.5' + NB + '×' + NB + '15.5' + NB + '×' + NB + '4' + NB + 'cm',
    'Messing, spiegelpoliert, mit Sockel aus geräucherter Eiche':
        'Brass, mirror-polished, with a base of smoked oak',
    'Auf dem Sockel signiert, mit Editionsnummer und Datum':
        'Signed on the base, with edition number and date',
    'WERK SICHERN': 'SECURE THE WORK',
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
    'Melde dich an und erhalte am 11. September um 09:00 Uhr Zugang,':
        'Sign up and get access on 11 September at 09:00,',
    'bevor die Edition öffentlich verfügbar ist.': 'before the edition opens to the public.',
    'Pillow No. 1 bleibt erhältlich, zu einem höheren Preis. Melde dich an, um den nächsten Art Drop nicht zu verpassen.':
        'Pillow No. 1 stays available, at a higher price. Sign up so you do not miss the next Art Drop.',

    # --- craft -----------------------------------------------------------
    'Handgefertigt bis ins letzte Detail.': 'Handcrafted down to the finest detail.',
    'Jedes Pillow wird einzeln verschweißt und aufgeblasen. Die Form entsteht dabei jedes Mal neu, deshalb ist jedes Exemplar ein Unikat.':
        'Every Pillow is welded and inflated one at a time. The form comes out differently each time, which is why every piece is one of a kind.',
    'Messing, spiegelpoliert': 'Brass, mirror-polished',
    'Verschweißt, aufgeblasen und spiegelpoliert. Sechsfach mit Instrumentenlack lackiert und bei 185' + NB + '°C eingebrannt: eine makellose, tief spiegelnde Oberfläche, die Raum und Betrachter neu inszeniert.':
        'Welded, inflated and mirror-polished. Lacquered in six layers with instrument lacquer and kiln-fired at 185' + NB + '°C: a flawless, deeply reflective surface that mirrors and reimagines the room and the viewer.',
    'Sockel aus geräucherter Eiche': 'A base of smoked oak',
    'Der Sockel setzt einen warmen Kontrast zur kühlen Metalloberfläche und verleiht der Skulptur natürliche Erdung. 15,5' + NB + '×' + NB + '15,5' + NB + '×' + NB + '4' + NB + 'cm.':
        'The base sets a warm contrast to the cool metal surface and grounds the sculpture with natural presence. 15.5' + NB + '×' + NB + '15.5' + NB + '×' + NB + '4' + NB + 'cm.',
    'Signiert, datiert, nummeriert': 'Signed, dated, numbered',
    'Als Unikatsedition ist jedes Pillow ein einzigartiges Werk, vom Künstler auf dem Sockel signiert, mit Editionsnummer und Datum.':
        'As part of a unique edition, each Pillow is a one-of-a-kind piece, signed by the artist on the base, with edition number and date.',
    'MEHR DETAILS': 'MORE DETAILS',

    # --- voice -----------------------------------------------------------
    'Der Künstler': 'The artist',
    # Reworded because the old headline widowed "Element." at 320 and 390px and
    # the bound pair would have been 22 characters at 34px, wider than the
    # column. Same claim, from the same approved artist copy.
    'Seine Oberflächen tragen nicht nur ein Bild, sie formen den Raum.':
        'His surfaces do not just carry an image, they shape the room.',
    'Rafael Neff, 1969 in Freienseen geboren, studierte Fotografie in Mainz, Prag und New York und war Meisterschüler von Kevin Clarke. Bekannt wurde er für menschenleere Innenräume, in denen Strandkörbe zu Skulpturen und Bibliotheken zu Kathedralen werden. Seit vielen Jahren arbeitet er zusätzlich mit Messing und Kupfer: hochglanzpolierte Oberflächen, die Reflexion, Tiefe und Präsenz in die Arbeit einschreiben.':
        'Rafael Neff, born in Freienseen in 1969, studied photography in Mainz, Prague and New York and was a master student of Kevin Clarke. He became known for interiors without people, where beach chairs turn into sculptures and libraries into cathedrals. For many years he has also worked in brass and copper: high-gloss polished surfaces that write reflection, depth and presence into the work.',

    # --- rooms -----------------------------------------------------------
    'Sie braucht keine Wand. Nur eine Fläche und Licht.':
        'It needs no wall. Only a surface and light.',
    '44' + NB + '×' + NB + '44' + NB + 'cm auf einem Sockel von 15,5' + NB + 'cm: die Skulptur nimmt wenig Platz und verändert doch, wie ein Raum sich anfühlt.':
        '44' + NB + '×' + NB + '44' + NB + 'cm on a 15.5' + NB + 'cm base: the sculpture takes little space and still changes how a room feels.',

    # --- inspiration -----------------------------------------------------
    'Über das Werk': 'About the work',
    '„Wir Künstler sind Suchende.“': '“We artists are seekers.”',
    'Das Suchen steckt im Verfahren. Neff probiert aus, wird zurückgeworfen, ändert den Ansatz und macht weiter, bis eine Form ihre eigene Eigenständigkeit hat. Bei Pillow No. 1 lässt sich das Ergebnis nicht wiederholen: jedes Exemplar wird einzeln aufgeblasen, und die Form entscheidet sich im Moment des Verschweißens.':
        'The searching is in the method. Neff experiments, is thrown back, changes the approach and carries on until a form has an identity of its own. With Pillow No. 1 the result cannot be repeated: every piece is inflated individually, and the form is decided in the moment of welding.',
    'Ein Kissen trägt die Spur des Abends zuvor. Hier ist diese Spur in Messing verschweißt und bleibt.':
        'A pillow carries the trace of the evening before. Here that trace is welded into brass, and stays.',
    'Weiches gilt als flüchtig. Es gibt nach, es verliert die Form, am Morgen wird es wieder glattgezogen. Rafael Neff hält den Moment davor an: verschweißt, aufgeblasen, spiegelpoliert, sechsfach mit Instrumentenlack lackiert und bei 185' + NB + '°C eingebrannt. Aus der weichen Geste wird eine harte, tief reflektierende Oberfläche, in der Raum und Betrachter erscheinen. Was bleibt, ist die Erinnerung an eine Berührung, in einem Material, das sie überdauert.':
        'Soft things are taken to be fleeting. They give way, they lose their shape, in the morning they are smoothed out again. Rafael Neff stops the moment before: welded, inflated, mirror-polished, lacquered in six layers with instrument lacquer and kiln-fired at 185' + NB + '°C. The soft gesture becomes a hard, deeply reflective surface in which the room and the viewer appear. What remains is the memory of a touch, in a material that outlasts it.',

    # --- assure (the trust row under the buy box) -------------------------
    'Streng limitiert': 'Strictly limited',
    '999 Exemplare, jedes ein Unikat': '999 pieces, every one unique',
    'Versichert versandt': 'Shipped insured',
    'sicher verpackt für den Transport': 'securely packed for transport',

    # --- the artist quote and the CV columns -----------------------------
    '„Wenn ich eine Sache gefunden habe, arbeite ich so lange daran, bis sie perfekt ist: die eine, richtige Ausdrucksform. Erst dann ist es Kunst.“':
        '“Once I have found something, I work on it until it is perfect: the one right form of expression. Only then is it art.”',
    'Auszeichnungen': 'Awards',
    'Ausstellungen, eine Auswahl': 'Exhibitions, a selection',
    'Gold, Internationaler Kalenderpreis': 'Gold, International Calendar Award',
    'Designpreis des Landes Rheinland-Pfalz': 'Rhineland-Palatinate State Design Award',
    'Villa Merton, Frankfurt': 'Villa Merton, Frankfurt',
    'LUMAS Düsseldorf, Hamburg, Berlin': 'LUMAS Düsseldorf, Hamburg, Berlin',
    'LUMAS Wien': 'LUMAS Vienna',
    'Art Cologne, Köln': 'Art Cologne, Cologne',
    'Nr. <span class="editionmark__slot">___</span> / 999':
        'No. <span class="editionmark__slot">___</span> / 999',

    # --- gallery ----------------------------------------------------------
    'In echt sehen': 'See it in person',
    'Pillow No. 1 gibt es auch in unseren Galerien.':
        'Pillow No. 1 is in our galleries too.',
    'Eine spiegelpolierte Oberfläche lässt sich schwer fotografieren, sie verändert sich mit jedem Schritt. LUMAS ist in 19 Galerien weltweit vertreten. Frag dort nach Pillow No. 1, wenn du das Werk vor dem Kauf einmal selbst sehen möchtest.':
        'A mirror-polished surface is hard to photograph: it changes with every step you take. LUMAS is present in 19 galleries worldwide. Ask for Pillow No. 1 there if you would like to see the work yourself before buying.',
    'Galerien ansehen': 'See the galleries',

    # --- trust -----------------------------------------------------------
    '330.000 zufriedene Sammler:innen': '330,000 satisfied collectors',
    'seit 2004': 'since 2004',
    '>19 Galerien weltweit<': '>19 galleries worldwide<',
    'Werke vor Ort ansehen': 'See works in person',
    '60 Tage Rückgaberecht': '60-day right of return',
    'ohne Angabe von Gründen': 'no reason required',
    '</span> von <span': '</span> of <span',
    '>verkauft<': '>sold<',

    # --- rooms carousel ---------------------------------------------------
    'von Rafael Neff.': 'by Rafael Neff.',
    'aria-label="Vorheriges Bild"': 'aria-label="Previous image"',
    'aria-label="Nächstes Bild"': 'aria-label="Next image"',
    'aria-label="Pillow No. 1 im Raum, Bildergalerie"':
        'aria-label="Pillow No. 1 in the room, image gallery"',

    # --- alt text: the work, the details, the artist ----------------------
    'Pillow No. 1 auf einem Sockel und einer weißen Stele in einem Pariser Altbau-Salon, Fischgrätparkett und Nachmittagslicht.':
        'Pillow No. 1 on its base and a white plinth in a Parisian period salon, herringbone parquet and afternoon light.',
    'Pillow No. 1 von Rafael Neff: eine aufgeblasene, spiegelpolierte Messingform auf der Spitze stehend, auf einem Sockel aus geräucherter Eiche.':
        'Pillow No. 1 by Rafael Neff: an inflated, mirror-polished brass form standing on one point, on a base of smoked oak.',
    'Nahaufnahme der spiegelpolierten Messingkante von Pillow No. 1 mit sichtbarer Schweißnaht.':
        'Close-up of the mirror-polished brass edge of Pillow No. 1 with the weld seam visible.',
    'Der Sockel aus geräucherter Eiche, auf dem die Messingform mit einer einzigen Spitze aufsetzt.':
        'The smoked oak base, where the brass form meets it on a single point.',
    'Vier Exemplare von Pillow No. 1 nebeneinander im Atelier: jede Messingform ist anders aufgeblasen und damit ein Unikat.':
        'Four pieces of Pillow No. 1 side by side in the studio: every brass form is inflated differently, so every one is unique.',
    'Rafael Neff im Schwarz-Weiß-Porträt, mit runder Brille und schwarzem Shirt, den Blick nach oben gerichtet.':
        'Rafael Neff in a black-and-white portrait, round glasses and a black shirt, looking upward.',

    # --- alt text: the eleven rooms --------------------------------------
    'Pillow No. 1 auf einer weißen Stele in einem Wohnraum mit Kamin, Bouclé-Sofa und Sisalteppich.':
        'Pillow No. 1 on a white plinth in a living room with a fireplace, bouclé sofa and sisal rug.',
    'Pillow No. 1 auf einem Sockel aus schwarzem Marmor in einem New Yorker Apartment, Fensterfront mit Blick auf einen Park.':
        'Pillow No. 1 on a black marble plinth in a New York apartment, a window wall looking onto a park.',
    'Ein Betrachter sitzt neben Pillow No. 1, die polierte Messingfläche spiegelt ihn und den Raum mit den blauen Samtsofas.':
        'A viewer sits beside Pillow No. 1; the polished brass surface reflects him and the room with its blue velvet sofas.',
    'Pillow No. 1 auf einer dunklen Konsole in einem Salon mit Stuckdecke, Marmorkamin und Blick über die Stadt im Abendlicht.':
        'Pillow No. 1 on a dark console in a salon with a stucco ceiling, marble fireplace and a view over the city at dusk.',
    'Pillow No. 1 auf einem dunklen Sideboard vor einem grauen Sofa, links eine großformatige Schwarz-Weiß-Arbeit.':
        'Pillow No. 1 on a dark sideboard in front of a grey sofa, with a large black-and-white work to the left.',
    'Pillow No. 1 auf einem Nussbaumtisch in einem hellen Wohnraum mit Bouclé-Sesseln, Pampasgras und offenem Kamin.':
        'Pillow No. 1 on a walnut table in a pale living room with bouclé armchairs, pampas grass and an open fireplace.',
    'Pillow No. 1 auf einem Marmortisch in einem Wohnraum mit grünem Sofa, Dachfenster und Blick in den Garten.':
        'Pillow No. 1 on a marble table in a living room with a green sofa, a skylight and a view into the garden.',
    'Pillow No. 1 auf einem dunklen Couchtisch in einem Hochhaus-Apartment mit braunem Samtsofa und Blick über die Dächer.':
        'Pillow No. 1 on a dark coffee table in a high-rise apartment with a brown velvet sofa and a view over the rooftops.',
    'Pillow No. 1 auf einem runden schwarzen Tisch in einem Loft mit Sichtbeton, Ledersesseln und einer Zeichnung an der Wand.':
        'Pillow No. 1 on a round black table in a loft with exposed concrete, leather armchairs and a drawing on the wall.',
    'Pillow No. 1 auf einem Metalltisch vor einer Fensterfront, dahinter ein Marmorkamin und ein Ledersessel.':
        'Pillow No. 1 on a metal table in front of a window wall, with a marble fireplace and a leather armchair behind.',
    'Pillow No. 1 auf einer Stele in einem mediterranen Wohnraum mit Olivenbaum, Holzbalken und Blick in den Garten.':
        'Pillow No. 1 on a plinth in a Mediterranean living room with an olive tree, timber beams and a view into the garden.',

    # --- fallback labels -------------------------------------------------
    'ROOM SHOT · SALON PARIS · 3:2': 'ROOM SHOT · PARIS SALON · 3:2',
    'SKULPTUR · PILLOW NO. 1': 'SCULPTURE · PILLOW NO. 1',
    'ROOM SHOT · STELE · 3:2': 'ROOM SHOT · PLINTH · 3:2',
    'DETAIL · OBERFLÄCHE · 3:2': 'DETAIL · SURFACE · 3:2',
    'DETAIL · SOCKEL · 3:2': 'DETAIL · BASE · 3:2',
    'ATELIER · VIER EXEMPLARE · 16:9': 'STUDIO · FOUR PIECES · 16:9',
    'KÜNSTLERPORTRÄT · RAFAEL NEFF': 'ARTIST PORTRAIT · RAFAEL NEFF',
    'ROOM SHOT · SPIEGELUNG · 16:9': 'ROOM SHOT · REFLECTION · 16:9',
    'ROOM SHOT · NUSSBAUM · 16:9': 'ROOM SHOT · WALNUT · 16:9',
    'ROOM SHOT · GARTENZIMMER · 16:9': 'ROOM SHOT · GARDEN ROOM · 16:9',
    'ROOM SHOT · NEW YORK · 16:9': 'ROOM SHOT · NEW YORK · 16:9',
    'ROOM SHOT · HOCHHAUS · 16:9': 'ROOM SHOT · HIGH RISE · 16:9',
    'ROOM SHOT · BETON · 16:9': 'ROOM SHOT · CONCRETE · 16:9',
    'ROOM SHOT · MEDITERRAN · 4:3': 'ROOM SHOT · MEDITERRANEAN · 4:3',

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
}

BANNER = """<!DOCTYPE html>
<!-- ============================================================================
     ENGLISH REVIEW COPY — generated by translate-en.py from pillow-art-drop.html.
     Do not hand-edit: this file is overwritten on every regeneration.
     NOT a market build. Pricing stays EUR and links point at lumas.de.
============================================================================ -->"""

# Words that mean the pass missed something. Kept narrow on purpose: a broad
# rule fires on brand and place names (Rafael Neff, Freienseen, Mainz).
# "Edition" is deliberately absent: it is the same word in both languages, and
# listing it made the validator fail on correct English.
GERMAN = re.compile(
    r'[äöüßÄÖÜ]'
    r'|^(?:der|die|das|den|dem|des|und|oder|mit|von|vom|zum|zur|auf|aus|bei'
    r'|nicht|wird|werden|sind|eine|einen|einem|einer|dich|deine|Uhr|Werk|Werke'
    r'|Exemplare|Skulptur|Sockel|Signatur|Masse|Vorzugspreis|Kissen|Messing'
    r'|Unikat|Unikate|Galerien|Kunstwerke|Suche|Sammler|hoeher)$'
    r'|EN$(?<=ONEN)', re.I)

# Legitimately German in an English page: proper nouns and place names.
ALLOW = {'neff', 'rafael', 'freienseen', 'mainz', 'lumas', 'pillow', 'clarke',
         'kevin', 'gallen', 'stiftsbibliothek', 'nationalbibliothek', 'wien',
         'margaux', 'chateau', 'bordeaux', 'audemars', 'piguet', 'ulysse',
         'nardin', 'squelette', 'astrolabium', 'galilei', 'galileo', 'poplars',
         'silver', 'ocean', 'royal', 'opera', 'house', 'london', 'complication', 'grande', 'york', 'public',
         'library', 'new', 'september', 'art', 'drop',
         # place names that stay German in English copy
         'düsseldorf', 'köln', 'frankfurt', 'merton', 'gregor', 'kalender'}


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
