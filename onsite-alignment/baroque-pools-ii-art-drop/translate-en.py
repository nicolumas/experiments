#!/usr/bin/env python3
"""Regenerate the English review copy from the German canonical.

    python3 translate-en.py

Edit baroque-pools-ii-art-drop.html (German) and re-run. Never hand-edit the
English file: it is a build artefact and will be overwritten. If a new German
string appears, add it to T below; the script fails loudly if any German
survives the pass.

Two rules learned the hard way on the previous drop page:

  * Entries are WHOLE STRINGS, not word fragments. A bare-word rule once turned
    AUSFÜHRUNGEN into EXECUTIONEN and produced "CERTIFICATE · CERTIFICATE".
    Replacement runs longest-key-first so a long alt text is always consumed
    before any shorter key inside it can match.
  * The validator scans user-facing ATTRIBUTES (alt, aria-label, title,
    placeholder, data-fallback), not just text nodes. Stripping tags wholesale
    hid a half-translated alt for weeks.
"""
import re, sys, pathlib

SRC = pathlib.Path(__file__).with_name('baroque-pools-ii-art-drop.html')
OUT = pathlib.Path(__file__).with_name('baroque-pools-ii-art-drop-en.html')

T = {
# --- document ---------------------------------------------------------------
'<html lang="de">': '<html lang="en">',
'Baroque Pools II von Tomislav Marcijuš. Limitiert auf 100 Exemplare, 80 × 66 cm. LUMAS Art Drop, 15. – 17. August 2026.':
  'Baroque Pools II by Tomislav Marcijuš. Limited to 100 copies, 80 × 66 cm. LUMAS Art Drop, 15 – 17 August 2026.',
'Zum Inhalt springen': 'Skip to content',

# --- site chrome ------------------------------------------------------------
'>Kunstwerke<': '>Artworks<',
'>Galerien<': '>Galleries<',
'>Über uns<': '>About us<',
'aria-label="Hauptnavigation"': 'aria-label="Main navigation"',
'aria-label="Menü"': 'aria-label="Menu"',
'aria-label="Suchen"': 'aria-label="Search"',
'aria-label="Wunschliste"': 'aria-label="Wishlist"',
'aria-label="Konto"': 'aria-label="Account"',
'aria-label="Warenkorb"': 'aria-label="Basket"',
'aria-label="Telefon"': 'aria-label="Phone"',
'aria-label="LUMAS — zur Startseite"': 'aria-label="LUMAS — home"',
'aria-label="Sprache: Deutsch"': 'aria-label="Language: English"',
'>DE<': '>EN<',
'placeholder="Suche"': 'placeholder="Search"',
'>Suche<': '>Search<',

# --- banner + countdown labels ---------------------------------------------
'Verkauf bis 17. August 2026, 23:59 Uhr': 'Sale until 17 August 2026, 23:59',
'EARLY ACCESS AM 14. AUGUST, 09:00 UHR': 'EARLY ACCESS ON 14 AUGUST, 09:00',
'EARLY ACCESS · VERKAUF BIS 17. AUGUST': 'EARLY ACCESS · ON SALE UNTIL 17 AUGUST',
'VERKAUF BIS 17. AUGUST, 23:59 UHR': 'ON SALE UNTIL 17 AUGUST, 23:59',
'VERKAUF ENDET IN': 'SALE ENDS IN',
'EDITION BEENDET': 'EDITION CLOSED',

# --- 1 proof ---------------------------------------------------------------
'Baroque Pools II im Rahmen Barcelona mit Schattenfuge an einer dunklen Holzvertäfelung, von einer Bilderleuchte angestrahlt; darunter ein schwarz-goldener Schreibtisch mit Messinglampe, links Blütenzweige am Fenster.':
  'Baroque Pools II in the Floater frame Barcelona on dark wood panelling, lit by a picture light; below it a black-and-brass desk with a brass lamp, blossom branches at the window on the left.',
'>15.–17. AUGUST<': '>15–17 AUGUST<',

# --- 2 the work ------------------------------------------------------------
'Baroque Pools II von Tomislav Marcijuš: ein barocker Festsaal mit vergoldeter Stuckdecke und Deckenfresken, durch den sich türkisfarbene Brandungswellen wälzen; darin schwimmen winzige Badende.':
  'Baroque Pools II by Tomislav Marcijuš: a baroque ballroom with a gilded stucco ceiling and ceiling frescoes, with turquoise breakers rolling through it; tiny bathers swim among them.',
'ARTWORK · BAROQUE POOLS II · 66:80': 'ARTWORK · BAROQUE POOLS II · 66:80',
'Tomislav Marcijuš’ „Baroque Pools II“; ein barocker Saal, den die&nbsp;Brandung erobert.<br>Drei Tage verfügbar&nbsp;— dann schließt die Edition.':
  'Tomislav Marcijuš’ “Baroque Pools II”; a baroque hall taken by the&nbsp;surf.<br>Available for three days&nbsp;— then the edition closes.',
'AUSFÜHRUNGEN': 'FINISHES',
'TECHNIK': 'TECHNIQUE',
'Lambda Color Print': 'Lambda Color Print',
'ZERTIFIKAT': 'CERTIFICATE',
'VERKAUFSZEITRAUM': 'SALE PERIOD',
'Limitiert auf 100 Exemplare': 'Limited to 100 copies',
'Kaschierung unter Acrylglas / Rahmen Barcelona mit Schattenfuge, Schwarz-Gold':
  'Mounted under acrylic glass / Floater frame Barcelona, black-gold',
'Signiert und nummeriert': 'Signed and numbered',
'15. – 17. August 2026': '15 – 17 August 2026',

# --- CTAs ------------------------------------------------------------------
'JETZT KAUFEN': 'BUY NOW',
'MEHR DETAILS': 'MORE DETAILS',
'NICHT MEHR VERFÜGBAR': 'NO LONGER AVAILABLE',
# The signup submit is an envelope icon, so these are accessible names, not
# visible labels. NL_SUBMIT_LABEL in the script sets them per phase; the
# aria-label in the markup is the REVEAL default and has to match.
"'Für Early Access anmelden'": "'Sign up for Early Access'",
"'Zum Newsletter anmelden'": "'Sign up for the newsletter'",
'aria-label="Für Early Access anmelden"': 'aria-label="Sign up for Early Access"',

# --- newsletter ------------------------------------------------------------
'E-Mail-Adresse': 'Email address',
'Bitte gib eine gültige E-Mail-Adresse ein.': 'Please enter a valid email address.',
'Wir melden uns einmal — am 14. August, neun Uhr, bevor die Edition öffentlich verfügbar ist. LUMAS schützt deine Daten (':
  'We will contact you once — on 14 August at nine, before the edition opens to the public. LUMAS protects your data (',
'LUMAS schützt deine Daten (': 'LUMAS protects your data (',
'Datenschutzerklärung': 'Privacy policy',
'Du bist dabei.': 'You are in.',
'Deine Einladung zum Early Access erreicht dich am 14. August um 09:00 Uhr.':
  'Your Early Access invitation reaches you on 14 August at 09:00.',
'Wir melden uns, sobald der nächste Art Drop startet.':
  'We will be in touch as soon as the next Art Drop begins.',
'Werk zur Wunschliste hinzufügen →': 'Add work to wishlist →',
'Die Edition ist beendet': 'The edition has closed',
'Baroque Pools II war auf 100 Exemplare limitiert. Melde dich an, um den nächsten Art Drop nicht zu verpassen.':
  'Baroque Pools II was limited to 100 copies. Sign up so you do not miss the next Art Drop.',

# --- 3 own it --------------------------------------------------------------
'Gefertigt in zwei exquisiten Ausführungen, handsigniert und limitiert.':
  'Crafted in two exquisite finishes, hand-signed and limited.',
'Ecke von Baroque Pools II ohne Rahmen: die Kaschierung unter Acrylglas läuft ohne Fassung bis an die Bildkante, das Werk steht wenige Millimeter von der Wand ab.':
  'Corner of Baroque Pools II without a frame: the acrylic-glass lamination runs to the edge of the image with no surround, and the work stands a few millimetres off the wall.',
'FINISH DETAIL · KASCHIERUNG UNTER ACRYLGLAS · 4:3':
  'FINISH DETAIL · MOUNTED UNDER ACRYLIC GLASS · 4:3',
'Stärke 2 mm glänzend, rahmenlos — die hochglänzende Oberfläche trägt Farbtiefe und Kontrast bis an die Bildkante.':
  '2 mm gloss, frameless — the high-gloss surface carries depth of colour and contrast right to the edge of the image.',
# customer-facing labels, verified on the live PDP variant data (de + com)
'Kaschierung unter Acrylglas': 'Mounted under acrylic glass',
'Ecke des Rahmens Barcelona in Schwarz-Gold: vergoldete Innenfläche, schwarze Außenkante und die Schattenfuge, in der Baroque Pools II frei steht.':
  'Corner of the Floater frame Barcelona in black-gold: gilded inner face, black outer edge, and the shadow gap Baroque Pools II floats in.',
'FINISH DETAIL · RAHMEN BARCELONA · 4:3': 'FINISH DETAIL · FLOATER FRAME BARCELONA · 4:3',
'Rahmen Barcelona mit Schattenfuge': 'Floater frame Barcelona',
'Schwarz-Gold, Profilbreite 12 mm, mit Acrylglas glänzend. Das Werk steht frei in der Schattenfuge. Außenmaß 83,8 × 69,8 cm.':
  'Black-gold, 12 mm profile, with gloss acrylic glass. The work floats free inside the shadow gap. Outer dimensions 83.8 × 69.8 cm.',
'Zertifikat der Edition: Lambda Color Print, Motiv 80 × 66 cm, Limited Edition of 100 Pieces, TMR05 — mit LUMAS Hologramm und der handschriftlichen Signatur von Tomislav Marcijuš.':
  'Certificate for the edition: Lambda Color Print, image 80 × 66 cm, Limited Edition of 100 Pieces, TMR05 — with the LUMAS hologram and the handwritten signature of Tomislav Marcijuš.',
'CERTIFICATE · ZERTIFIKAT · 4:3': 'CERTIFICATE · 4:3',
'Jedes Exemplar wird von Tomislav Marcijuš signiert und trägt ein nummeriertes Zertifikat. Nach 100 Exemplaren wird die Edition geschlossen.':
  'Every copy is signed by Tomislav Marcijuš and carries a numbered certificate. After 100 copies the edition closes.',

# --- 4 voice ---------------------------------------------------------------
'Über den Künstler': 'About the artist',
'Tomislav Marcijuš, Schwarzweiß-Porträt vor dunklem Grund: dunkle Cap, kurzer Bart, weißes Hemd.':
  'Tomislav Marcijuš, black-and-white portrait against a dark ground: dark cap, short beard, white shirt.',
'ARTIST PORTRAIT · TOMISLAV MARCIJUŠ · 3:4': 'ARTIST PORTRAIT · TOMISLAV MARCIJUŠ · 3:4',
'„Ich finde meine Kunst in alltäglichen Dingen, in Details, die oft unbemerkt bleiben – in Gesprächen und Kindheitserinnerungen.“':
  '“I find my art in everyday things, in details that often go unnoticed — in conversations and childhood memories.”',
'Tomislav Marcijuš ist ein kroatischer bildender Künstler und Fotograf, bekannt für seine poetische und emotional vielschichtige Bildsprache. Seine Praxis kreist um Erinnerung, Zugehörigkeit, Familie und Zeit — und verwebt persönliche Erfahrungen mit kulturellen und historischen Schichten.':
  'Tomislav Marcijuš is a Croatian visual artist and photographer known for his poetic, emotionally layered imagery. His practice circles memory, belonging, family and time — weaving personal experience through cultural and historical layers.',

# --- 5 envision ------------------------------------------------------------
'Ein Bildraum, der jede Wand zur Bühne macht.': 'A pictorial space that turns any wall into a stage.',
'Mit 80 × 66 cm findet er über einem Sideboard genauso seinen Platz wie an einer freien Wand — und zieht den Blick in die Tiefe.':
  'At 80 × 66 cm it sits as easily above a sideboard as on an empty wall — and pulls the eye into the depth.',
'Baroque Pools II im Raum — Bildergalerie': 'Baroque Pools II in the room — image gallery',
'Baroque Pools II in einem Wohnzimmer mit Rundbogenfenster, gerahmt über einer niedrigen Nussbaum-Konsole; davor ein Bouclé-Sofa mit grüner Decke und ein cognacfarbener Ledersessel.':
  'Baroque Pools II in a living room with an arched window, framed above a low walnut console; in front of it a bouclé sofa with a green throw and a cognac leather armchair.',
'Baroque Pools II in einem Salon mit Marmorkamin und goldgerahmtem Spiegel, daneben ein Bouclé-Sessel und eine Messing-Stehleuchte.':
  'Baroque Pools II in a salon with a marble fireplace and a gold-framed mirror, beside it a bouclé armchair and a brass floor lamp.',
'Baroque Pools II im schwarz-goldenen Rahmen Barcelona in einem Entree mit Marmorkonsole und weißen Lilien; im Hintergrund öffnet sich eine Flügeltür zum Wohnraum.':
  'Baroque Pools II in the black-gold Floater frame Barcelona in an entrance hall with a marble console and white lilies; a double door opens onto the living room behind.',
'Ein Mann mit weißen Handschuhen hängt Baroque Pools II über einem dunklen Nussbaum-Sideboard auf, hinter ihm fällt Tageslicht durch einen Vorhang.':
  'A man in white gloves hangs Baroque Pools II above a dark walnut sideboard, daylight falling through a curtain behind him.',
'Baroque Pools II in einer taupefarbenen Wandnische über einer Marmorkonsole, flankiert von zwei Stoffleuchten, davor weiße Hortensien.':
  'Baroque Pools II in a taupe alcove above a marble console, flanked by two fabric wall lights, white hydrangeas in front.',
'Baroque Pools II aufgestellt auf einem langen Nussbaum-Sideboard in einem hellen Wohnzimmer, seitlich einfallendes Nachmittagslicht, links ein weißer Ledersessel.':
  'Baroque Pools II standing on a long walnut sideboard in a bright living room, afternoon light falling from the side, a white leather chair on the left.',
'Baroque Pools II an einer hellen Wand in einer Küche mit burgunderrotem Marmor-Kochblock und Messinghockern, davor rosa Blütenzweige.':
  'Baroque Pools II on a pale wall in a kitchen with a burgundy marble island and brass stools, pink blossom branches in front.',
'Eine Frau im schwarzen Kleid richtet Baroque Pools II an einer Kalkputzwand aus, darunter ein Sideboard aus Wurzelholz mit Messingvasen.':
  'A woman in a black dress straightens Baroque Pools II on a lime-plaster wall, a burr-wood sideboard with brass vases beneath it.',
'Baroque Pools II auf einer Holzvertäfelung über einem dunklen Schreibtisch mit Messing-Kuppelleuchte, links und rechts Blütenzweige.':
  'Baroque Pools II on wood panelling above a dark desk with a brass dome lamp, blossom branches to the left and right.',
'Baroque Pools II in einem cremefarbenen Flur mit Kassettenwänden, flankiert von zwei Messing-Wandleuchten, rechts weiße Rosen.':
  'Baroque Pools II in a cream corridor with panelled walls, flanked by two brass wall lights, white roses on the right.',
'Eine Frau in Weiß richtet Baroque Pools II an einer Kalkputzwand aus, dahinter dunkle Holzregale und ein blauer Sessel.':
  'A woman in white straightens Baroque Pools II on a lime-plaster wall, dark wooden shelving and a blue armchair behind her.',
'ROOM SHOT · WOHNZIMMER · 16:9': 'ROOM SHOT · LIVING ROOM · 16:9',
'ROOM SHOT · SALON · 16:9': 'ROOM SHOT · SALON · 16:9',
'ROOM SHOT · ENTREE · 16:9': 'ROOM SHOT · ENTRANCE HALL · 16:9',
'ROOM SHOT · WANDNISCHE · 16:9': 'ROOM SHOT · ALCOVE · 16:9',
'ROOM SHOT · ARBEITSZIMMER · 16:9': 'ROOM SHOT · STUDY · 16:9',
'ROOM SHOT · KÜCHE · 16:9': 'ROOM SHOT · KITCHEN · 16:9',
'ROOM SHOT · WOHNRAUM · 16:9': 'ROOM SHOT · LIVING SPACE · 16:9',
'ROOM SHOT · BIBLIOTHEK · 16:9': 'ROOM SHOT · LIBRARY · 16:9',
'ROOM SHOT · FLUR · 16:9': 'ROOM SHOT · CORRIDOR · 16:9',
'aria-label="Vorheriges Bild"': 'aria-label="Previous image"',
'aria-label="Nächstes Bild"': 'aria-label="Next image"',

# --- 6 inspiration ---------------------------------------------------------
'Woher Baroque Pools kommt': 'Where Baroque Pools comes from',
'Zwischen barocker Theatralik, stiller Intimität und digitaler Illusion entstehen Szenen, die vertraut wirken und doch nie existiert haben.':
  'Between baroque theatricality, quiet intimacy and digital illusion, scenes emerge that feel familiar and yet never existed.',
'Die Arbeiten greifen Marcijuš’ langjährige fotografische Auseinandersetzung mit Badehäusern, Kirchen und Villeninterieurs auf, insbesondere in Italien, und verdichten diese Begegnungen zu spekulativen Szenarien. Wasser fungiert dabei zugleich als ordnende wie als auflösende Kraft: Es mildert die Strenge barocker Formen, verleiht ihnen Leichtigkeit und eröffnet neue Möglichkeiten der Bewegung.':
  'The works draw on Marcijuš’ long photographic engagement with bathhouses, churches and villa interiors, particularly in Italy, and condense those encounters into speculative scenarios. Water acts as both an ordering and a dissolving force: it softens the severity of baroque forms, lends them lightness and opens new possibilities of movement.',

# --- 7 reassure ------------------------------------------------------------
'Kauf bei LUMAS': 'Buying at LUMAS',
'330.000 zufriedene Kunden': '330,000 satisfied customers',
'seit 2004': 'since 2004',
'>19 Galerien weltweit<': '>19 galleries worldwide<',
'Werke vor Ort ansehen': 'See works in person',
'60 Tage Rückgaberecht': '60-day right of return',
'ohne Angabe von Gründen': 'no reason required',

# --- 8 act -----------------------------------------------------------------
'Drei Tage. 100 Exemplare.': 'Three days. 100 copies.',
'Melde dich an und erhalte am 14. August um 09:00 Uhr Zugang,<br>bevor die Edition öffentlich verfügbar ist.':
  'Sign up and get access on 14 August at 09:00,<br>before the edition opens to the public.',
'Die Edition ist bis zum 17. August, 23:59 Uhr verfügbar.': 'The edition is available until 17 August, 23:59.',
'Die Edition ist beendet.': 'The edition has closed.',
'</span> von <span': '</span> of <span',
'verkauft': 'sold',

# --- 9 continue ------------------------------------------------------------
'Die Serie Baroque Pools': 'The Baroque Pools series',
'Vier weitere Kapitel, jedes limitiert auf 100 Exemplare.': 'Four further chapters, each limited to 100 copies.',
'aria-label="Weitere Werke von Tomislav Marcijuš"': 'aria-label="More works by Tomislav Marcijuš"',
'aria-label="Vorherige Werke"': 'aria-label="Previous works"',
'aria-label="Weitere Werke"': 'aria-label="More works"',
'Baroque Pools I von Tomislav Marcijuš: Blick von oben in ein steinernes Beckenrund in einem barocken Innenhof, zwei Schwimmende im blassgrünen Wasser.':
  'Baroque Pools I by Tomislav Marcijuš: an overhead view into a stone pool basin in a baroque courtyard, two swimmers in pale green water.',
'Baroque Pools III von Tomislav Marcijuš: ein vergoldeter Saal unter einer Glaskuppel, dessen Parkett von türkisfarbenem Wasser gefüllt ist, darin viele Badende.':
  'Baroque Pools III by Tomislav Marcijuš: a gilded hall beneath a glass dome, its floor filled with turquoise water and many bathers.',
'Baroque Pools IV von Tomislav Marcijuš: ein hell freskierter Saal mit Rundbogenfenstern, durch den eine Welle bricht, davor Badende.':
  'Baroque Pools IV by Tomislav Marcijuš: a pale frescoed hall with arched windows, a wave breaking through it, bathers in front.',
'Baroque Pools V von Tomislav Marcijuš: ein weißer Stucksaal, über dessen Boden schäumendes Wasser läuft, darin Badende.':
  'Baroque Pools V by Tomislav Marcijuš: a white stucco hall with foaming water running across its floor, bathers within.',
'aria-label="Baroque Pools I zur Wunschliste hinzufügen"': 'aria-label="Add Baroque Pools I to wishlist"',
'aria-label="Baroque Pools III zur Wunschliste hinzufügen"': 'aria-label="Add Baroque Pools III to wishlist"',
'aria-label="Baroque Pools IV zur Wunschliste hinzufügen"': 'aria-label="Add Baroque Pools IV to wishlist"',
'aria-label="Baroque Pools V zur Wunschliste hinzufügen"': 'aria-label="Add Baroque Pools V to wishlist"',
'WERK · ': 'WORK · ',

# --- script strings --------------------------------------------------------
"segs.push([pad(d), 'TAGE']);": "segs.push([pad(d), 'DAYS']);",
"segs.push([pad(h), 'STD'], [pad(m), 'MIN'], [pad(s), 'SEK']);":
  "segs.push([pad(h), 'HRS'], [pad(m), 'MIN'], [pad(s), 'SEC']);",
"'EARLY ACCESS IN'": "'EARLY ACCESS IN'",
"'de-DE'": "'en-GB'",
"' Bild-Platzhalter · '": "' image placeholders · '",
"'echte Zeit'": "'real time'",
"'kein Stock-Feed'": "'no stock feed'",
"'Stock ok'": "'stock ok'",
"'Kaufphase ansehen'": "'View buy phase'",
"'Reveal ansehen'": "'View reveal'",
}

BANNER = """<!DOCTYPE html>
<!-- ============================================================================
     ENGLISH REVIEW COPY — generated by translate-en.py from
     baroque-pools-ii-art-drop.html. Do not hand-edit: this file is overwritten
     on every regeneration.
     NOT a market build. Pricing stays EUR at the DE/AT/FR/EU level and links
     point at lumas.de. CH/UK/US/CA carry a different price set — see README.
============================================================================ -->"""


def main():
    s = SRC.read_text(encoding='utf-8')
    for de, en in sorted(T.items(), key=lambda kv: -len(kv[0])):
        s = s.replace(de, en)
    s = re.sub(r'(\d{2,4}) €', r'€\1', s)          # 499 € -> €499
    s = re.sub(r'>(\d{2,4}) €', r'>€\1', s)        # and the >499 €< case
    s = s.replace('<!DOCTYPE html>', BANNER, 1)
    OUT.write_text(s, encoding='utf-8')

    # fail loudly if any German survived
    body = re.sub(r'<script.*?</script>|<style.*?</style>|<!--.*?-->', '', s, flags=re.S)
    # user-facing *attributes* count as copy too. Stripping tags wholesale used to
    # hide alt/aria-label/placeholder from this check.
    attrs = ' '.join(m.group(2) for m in re.finditer(
        r'\b(alt|aria-label|title|placeholder|data-fallback)="([^"]*)"', body))
    visible = re.sub(r'<[^>]+>', ' ', body) + ' ' + attrs
    # "Marcijuš" is the artist's name and stays in both languages: š is not in
    # the umlaut class below, so it does not trip the check.
    GERMAN = re.compile(
        r'[äöüßÄÖÜ]'                                  # umlauts
        r'|^(?:der|die|das|den|dem|des|und|oder|mit|von|vom|zum|zur|auf|aus|bei'
        r'|nicht|wird|werden|sind|eine|einen|einem|einer|dich|deine|Uhr|Werk'
        r'|Werke|Exemplare|Exemplar|Zertifikat|ZERTIFIKAT|Ausfuehrung|Rahmen'
        r'|Wasser|Saal|Frau|Mann|Wand|Raum|Tage|Kunst|Bild)$'
        r'|EN$(?<=ONEN)', re.I)                        # AUSFÜHRUNG->EXECUTIONEN class of bug
    leftovers = sorted({w for w in re.findall(r'[A-Za-zÄÖÜäöüß]{3,}', visible)
                        if GERMAN.search(w)})
    print('wrote', OUT.name, len(s), 'chars')
    if leftovers:
        print('UNTRANSLATED GERMAN:', leftovers, file=sys.stderr)
        sys.exit(1)
    print('no untranslated German found')


main()
