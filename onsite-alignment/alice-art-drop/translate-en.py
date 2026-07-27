#!/usr/bin/env python3
"""Regenerate the English review copy from the German canonical.

    python3 translate-en.py

Edit index.html (German) and re-run. Never hand-edit the English file:
it is a build artefact and will be overwritten. If a new German string appears,
add it to T below; the script fails loudly if any German survives the pass.
"""
import re, sys, pathlib

SRC = pathlib.Path(__file__).with_name('index.html')
OUT = pathlib.Path(__file__).with_name('en.html')

T = {
'<html lang="de">':'<html lang="en">',
'Alice von Carol Muthiga-Oyekunle. Limitiert auf 300 Exemplare, 60 × 60 cm. LUMAS Art Drop, 08. – 10. August 2026.':'Alice by Carol Muthiga-Oyekunle. Limited to 300 copies, 60 × 60 cm. LUMAS Art Drop, 8 – 10 August 2026.',
'Zum Inhalt springen':'Skip to content',
'In den Worten von Alice Walker, der Inspiration hinter der Edition':'In the words of Alice Walker, the inspiration behind the edition',
'„Auf einer spirituellen Ebene ist es, als sähe ich mit meinem sehenden Auge das, was vor mir liegt, und mit meinem blinden Auge das, was verborgen ist. Es hat das Leben mehr erhellt als verdunkelt.“':'“On a spiritual level, it\'s as though with my sighted eye I see what\'s before me, and with my unsighted eye I see what\'s hidden. It illuminated life more than darkened it.”',
'Alice Walker, die mit dem Pulitzer-Preis ausgezeichnete amerikanische Autorin von „Die Farbe Lila“, ist eine der prägendsten Stimmen aus Carol Muthiga-Oyekunles Jugend. Ihr Zitat, entstanden nach dem Verlust des Augenlichts auf einem Auge bei einem Unfall in der Kindheit, wird für die Künstlerin zum Sinnbild für den Triumph über Widrigkeiten und für die Kraft, mit offenem Herzen und hoffnungsvollem Blick durch die Dunkelheit zu sehen. „Alice“ ist ihre Hommage an diese Haltung.':'Alice Walker, the Pulitzer Prize-winning American author of The Color Purple, is one of the most formative voices from Carol Muthiga-Oyekunle\'s youth. Her quote, born from the loss of sight in one eye after a childhood accident, becomes for the artist a symbol of triumph over adversity and the strength to see through the darkness with an open heart and a hopeful spirit. “Alice” is her tribute to that outlook.',

'>Kunstwerke<':'>Artworks<','>Galerien<':'>Galleries<','>Über uns<':'>About us<',
'aria-label="Hauptnavigation"':'aria-label="Main navigation"',
'aria-label="Menü"':'aria-label="Menu"','aria-label="Suchen"':'aria-label="Search"',
'aria-label="Wunschliste"':'aria-label="Wishlist"','aria-label="Konto"':'aria-label="Account"',
'aria-label="Warenkorb"':'aria-label="Basket"','aria-label="Telefon"':'aria-label="Phone"',
'aria-label="LUMAS — zur Startseite"':'aria-label="LUMAS — home"',
'aria-label="Sprache: Deutsch"':'aria-label="Language: English"','>DE<':'>EN<','zur Wunschliste hinzufügen':'add to wishlist',
'placeholder="Suche"':'placeholder="Search"','>Suche<':'>Search<',
'EARLY ACCESS AM 7. AUGUST, 09:00 UHR':'EARLY ACCESS ON 7 AUGUST, 09:00',
'EARLY ACCESS · VERKAUF BIS 10. AUGUST':'EARLY ACCESS · ON SALE UNTIL 10 AUGUST',
'VERKAUF BIS 10. AUGUST, 23:59 UHR':'ON SALE UNTIL 10 AUGUST, 23:59',
'VERKAUF ENDET IN':'SALE ENDS IN',
'EDITION BEENDET':'EDITION CLOSED',
'Verkauf bis 10. August 2026, 23:59 Uhr':'Sale until 10 August 2026, 23:59',
'ART DROP · NUR DREI TAGE':'ART DROP · THREE DAYS ONLY',
'Eine Kriegerin zwischen Vergangenheit, Gegenwart und Zukunft.<br>Drei Tage sichtbar&nbsp;— dann nie wieder.':'A warrior between past, present and future.<br>Visible for three days&nbsp;— then never again.',
'Digitale Collage, in der Modefotografie auf ausdrucksstarke Farbflächen trifft. Das Haar ist Accessoire, die Kleidung ist Rüstung.':'A digital collage where fashion photography meets bold fields of colour. The hair is an accessory, the clothing is armour.',
'[Detailaufnahme 02 — Bildunterschrift folgt]':'[Detail shot 02 — caption to follow]',
'[Detailaufnahme 03 — Bildunterschrift folgt]':'[Detail shot 03 — caption to follow]',
'[Detailaufnahme 04 — Bildunterschrift folgt]':'[Detail shot 04 — caption to follow]',
'„Ich stelle Frauen in einer Position der Stärke, des Optimismus, der Freude und des Triumphs dar.“':'“I portray women in a position of strength, of optimism, of joy and of triumph.”',
'Carol Muthiga-Oyekunle ist kenianisch-amerikanische Künstlerin und Designerin, sie lebt und arbeitet in Paris. Bestimmend für ihre Arbeit ist der Afrofuturismus: die Geschichte der afrikanischen Diaspora, neu erzählt aus einer technologisierten Zukunft heraus.':'Carol Muthiga-Oyekunle is a Kenyan-American artist and designer who lives and works in Paris. Her work is shaped by afrofuturism: the history of the African diaspora, retold from a technologised future.',
'Sie verwandelt jeden Raum, den sie betritt.':'She transforms every space she enters.',
'Mit 60 × 60 cm passt sie wunderbar in eine Nische – und hat doch die Kraft, den ganzen Raum zu bestimmen.':'At 60 × 60 cm, she fits beautifully into an alcove—yet holds the power to define the entire room.',
'Wohnzimmer':'Living room','Arbeitszimmer':'Study','LUMA Artbox, schwarz':'LUMA Artbox, black',
'Gefertigt in zwei exquisiten Ausführungen, handsigniert und limitiert.':'Crafted in two exquisite finishes, hand-signed &amp; limited.',
'Hochglänzende Oberfläche, die Farbtiefe und Kontrast trägt. Ohne Rahmen, damit die Farben bis an die Kante laufen.':'A high-gloss surface that carries depth of colour and contrast. Frameless, so the colour runs right to the edge.',
'Acrylglas glossy im schwarzen Objektrahmen — das Werk steht frei im Rahmenkörper.':'Glossy acrylic in a black object frame — the work stands free within the frame body.',
'Signiert und nummeriert':'Signed and numbered',
'Jedes Exemplar wird von Carol Muthiga-Oyekunle signiert und trägt ein nummeriertes Zertifikat. Nach 300 Exemplaren wird die Edition geschlossen.':'Every copy is signed by Carol Muthiga-Oyekunle and carries a numbered certificate. After 300 copies the edition closes.',
'Zertifikat, signiert von der Künstlerin':'Certificate, signed by the artist',
'CERTIFICATE · ZERTIFIKAT · 3:2':'CERTIFICATE · 3:2',
'MEHR DETAILS':'MORE DETAILS',
'JETZT KAUFEN':'BUY NOW',
"'Kaufphase ansehen'":"'View buy phase'","'Reveal ansehen'":"'View reveal'",'NICHT MEHR VERFÜGBAR':'NO LONGER AVAILABLE',
'Die Ausführung wählst du auf der Produktseite.':'You choose the execution on the product page.',
'330.000 zufriedene Kunden':'330,000 satisfied customers','seit 2004':'since 2004',
'19 Galerien weltweit':'19 galleries worldwide','Werke vor Ort ansehen':'See works in person',
'60 Tage Rückgaberecht':'60-day right of return','ohne Angabe von Gründen':'no reason required',
'Drei Tage. 300 Exemplare.':'Three days. 300 copies.',
'Melde dich an und erhalte am 7. August um 09:00 Uhr Zugang,<br>bevor die Edition öffentlich verfügbar ist.':'Sign up and get access on 7 August at 09:00,<br>before the edition opens to the public.',
'Die Edition ist bis zum 10. August, 23:59 Uhr verfügbar.':'The edition is available until 10 August, 23:59.',
'</span> von <span':'</span> of <span','verkauft':'sold','ab 299 €':'from €299',
'Werk in einer Galerie ansehen →':'See the work in a gallery →',
'Die Edition ist beendet.':'The edition has closed.',
'Alice war auf 300 Exemplare limitiert. Melde dich an, um den nächsten Art Drop nicht zu verpassen.':'Alice was limited to 300 copies. Sign up so you do not miss the next Art Drop.',
'ZUM NEWSLETTER ANMELDEN':'SIGN UP FOR THE NEWSLETTER','JETZT ANMELDEN':'SIGN UP NOW',
'JETZT FÜR EARLY ACCESS ANMELDEN':'SIGN UP FOR EARLY ACCESS',
'E-Mail-Adresse':'Email address',
'Bitte gib eine gültige E-Mail-Adresse ein.':'Please enter a valid email address.',
'Wir melden uns einmal — am 7. August, neun Uhr, bevor die Edition öffentlich verfügbar ist. LUMAS schützt deine Daten (':'We will contact you once — on 7 August at nine, before the edition opens to the public. LUMAS protects your data (',
'Datenschutzerklärung':'Privacy policy','Du bist dabei.':'You are in.',
'Die Edition ist beendet':'The edition has closed',
'Wir melden uns, sobald der nächste Art Drop startet.':'We will be in touch as soon as the next Art Drop begins.',
'LUMAS schützt deine Daten (':'LUMAS protects your data (',
'Deine Einladung zum Early Access erreicht dich am 7. August um 09:00 Uhr.':'Your Early Access invitation reaches you on 7 August at 09:00.',
'Werk zur Wunschliste hinzufügen →':'Add work to wishlist →',
'Die Edition im Detail':'The edition in detail',
'Limitiert auf 300 Exemplare':'Limited to 300 copies',
'AUSFÜHRUNGEN':'FINISHES','AUSFÜHRUNG':'EXECUTION',
'ZERTIFIKAT':'CERTIFICATE','VERKAUFSZEITRAUM':'SALE PERIOD',
'Carol Muthiga-Oyekunle · 08. – 10. August 2026':'Carol Muthiga-Oyekunle · 8 – 10 August 2026',
'08. – 10. August 2026':'8 – 10 August 2026','DER ABLAUF':'THE SCHEDULE',
'04. AUGUST':'4 AUGUST','07. AUGUST · 09:00':'7 AUGUST · 09:00','08. – 10. AUGUST':'8 – 10 AUGUST',
'Early Access für Newsletter-Abonnenten':'Early Access for newsletter subscribers',
'Öffentlicher Verkauf · Drei Tage':'Public sale · Three days',
'>Fragen<':'>Questions<',
'Was bedeutet „limitierte Edition von 300“?':'What does “limited edition of 300” mean?',
'Alice erscheint in einer Auflage von 300 Exemplaren über alle LUMAS Kanäle hinweg. Ist die Auflage vergriffen, wird die Edition geschlossen und nicht neu aufgelegt.':'Alice is released in an edition of 300 copies across all LUMAS channels. Once sold out, the edition closes and is not reissued.',
'Wann kann ich Alice kaufen?':'When can I buy Alice?',
'Newsletter-Abonnenten erhalten am 7. August ab 09:00 Uhr Zugang. Der öffentliche Verkauf läuft vom 8. August, 09:00 Uhr bis zum 10. August, 23:59 Uhr (CET).':'Newsletter subscribers get access from 7 August, 09:00. The public sale runs from 8 August, 09:00 until 10 August, 23:59 (CET).',
'Was ist der Unterschied zwischen LUMASEC glossy und der LUMA Artbox?':'What is the difference between LUMASEC glossy and the LUMA Artbox?',
'⚠︎ [Verbatim aus der bestehenden Qualitäts-/FAQ-Seite übernehmen — nicht formulieren]':'⚠︎ [Copy verbatim from the existing quality / FAQ page — do not write from scratch]',
'Wie wird geliefert?':'How is it delivered?',
'⚠︎ [Verbatim aus lumas.de/versand übernehmen — keine Lieferzeiten erfinden]':'⚠︎ [Copy verbatim from lumas.de/versand — do not invent delivery times]',
'Kann ich das Werk vor dem Kauf sehen?':'Can I see the work before buying?',
'LUMAS ist online und in 19 Galerien weltweit vertreten. Eine Übersicht der Standorte findest du unter':'LUMAS is present online and in 19 galleries worldwide. An overview of locations is available at',
'Weitere Werke von Carol Muthiga-Oyekunle':'More works by Carol Muthiga-Oyekunle',
'Alice von Carol Muthiga-Oyekunle: Porträt einer Frau in Graustufen, umgeben von einer farbigen Collage aus Blüten- und Korallenformen.':'Alice by Carol Muthiga-Oyekunle: a greyscale portrait of a woman surrounded by a colourful collage of flower and coral forms.',
'Makro-Detail der Collage: überlagerte Blüten-, Korallen- und Musterflächen in Rot, Blau und Orange.':'Macro detail of the collage: overlapping flower, coral and pattern surfaces in red, blue and orange.',
'Carol Muthiga-Oyekunle vor einer ihrer großformatigen Collagen.':'Carol Muthiga-Oyekunle in front of one of her large-format collages.',
'Zertifikat der Edition Alice: Angaben zu Auflage, Format und C-Print, LUMAS Hologramm und die Signatur von Carol Muthiga-Oyekunle.':'Certificate for the Alice edition: edition size, format and C-Print details, LUMAS hologram and the signature of Carol Muthiga-Oyekunle.',
'CERTIFICATE · ZERTIFIKAT · 6:5':'CERTIFICATE · 6:5',
'Alice in LUMASEC glossy über einem hellen Sofa in einem Wohnzimmer mit Meerblick.':'Alice in LUMASEC glossy above a pale sofa in a living room with a sea view.',
'Eine Frau sitzt auf einem Sofa, darüber hängt Alice in LUMASEC glossy.':'A woman sits on a sofa with Alice in LUMASEC glossy hanging above her.',
'Alice in der schwarzen LUMA Artbox über einem Schreibtisch in einem Arbeitszimmer.':'Alice in the black LUMA Artbox above a desk in a study.',
'Alice in der schwarzen LUMA Artbox über einem Sideboard im Wohnzimmer.':'Alice in the black LUMA Artbox above a sideboard in the living room.',
'Eine Frau blickt auf Alice in LUMASEC glossy an einer hellen Wohnzimmerwand.':'A woman looks at Alice in LUMASEC glossy on a pale living-room wall.',
'Alice in LUMASEC glossy, rahmenlos an einer hellen Wand.':'Alice in LUMASEC glossy, frameless on a pale wall.',
'Alice in der schwarzen LUMA Artbox über einem Sideboard.':'Alice in the black LUMA Artbox above a sideboard.',
'Alice im Detail':'Alice in detail','Alice im Raum — Bildergalerie':'Alice in the room — image gallery',
'Vorheriges Detail':'Previous detail','Nächstes Detail':'Next detail',
'Vorheriges Bild':'Previous image','Nächstes Bild':'Next image',
'Vorherige Werke':'Previous works','Weitere Werke':'More works','Ausführung wählen':'Choose execution',
'ROOM SHOT · WOHNZIMMER · 4:3':'ROOM SHOT · LIVING ROOM · 4:3',
'ROOM SHOT · ARBEITSZIMMER · 4:3':'ROOM SHOT · STUDY · 4:3',
'von Carol Muthiga-Oyekunle, gerahmt.':'by Carol Muthiga-Oyekunle, framed.',
'WERK · ':'WORK · ',
"segs.push([pad(d), 'TAGE']);":"segs.push([pad(d), 'DAYS']);",
"segs.push([pad(h), 'STD'], [pad(m), 'MIN'], [pad(s), 'SEK']);":"segs.push([pad(h), 'HRS'], [pad(m), 'MIN'], [pad(s), 'SEC']);",
"'de-DE'":"'en-GB'",
"' Bild-Platzhalter · '":"' image placeholders · '",
"' offene Texte · '":"' open copy items · '",
"'echte Zeit'":"'real time'","'kein Stock-Feed'":"'no stock feed'","'Stock ok'":"'stock ok'",
}

BANNER = """<!DOCTYPE html>
<!-- ============================================================================
     ENGLISH REVIEW COPY — generated by translate-en.py from index.html.
     Do not hand-edit: this file is overwritten on every regeneration.
     NOT a market build. Pricing stays EUR and links point at lumas.de.
============================================================================ -->"""

def main():
    s = SRC.read_text(encoding='utf-8')
    for de, en in sorted(T.items(), key=lambda kv: -len(kv[0])):
        s = s.replace(de, en)
    s = re.sub(r'(\d{2,4}) €', r'€\1', s)          # 299 € -> €299
    s = re.sub(r'>(\d{2,4}) €', r'>€\1', s)        # and the >299 €< case
    s = s.replace('<!DOCTYPE html>', BANNER, 1)
    OUT.write_text(s, encoding='utf-8')

    # fail loudly if any German survived
    visible = re.sub(r'<script.*?</script>|<style.*?</style>|<!--.*?-->', '', s, flags=re.S)
    visible = re.sub(r'<[^>]+>', ' ', visible)
    GERMAN = re.compile(
        r'[äöüßÄÖÜ]'                                  # umlauts
        r'|^(?:der|die|das|den|dem|des|und|oder|mit|von|vom|zum|zur|auf|aus|bei'
        r'|nicht|wird|werden|sind|eine|einen|einem|einer|dich|deine|Uhr|Werk'
        r'|Werke|Exemplare|Zertifikat|ZERTIFIKAT|Ausfuehrung)$'
        r'|EN$(?<=ONEN)', re.I)                        # AUSFÜHRUNG->EXECUTIONEN class of bug
    leftovers = sorted({w for w in re.findall(r'[A-Za-zÄÖÜäöüß]{3,}', visible)
                        if GERMAN.search(w)})
    print('wrote', OUT.name, len(s), 'chars')
    if leftovers:
        print('UNTRANSLATED GERMAN:', leftovers, file=sys.stderr); sys.exit(1)
    print('no untranslated German found')

main()
