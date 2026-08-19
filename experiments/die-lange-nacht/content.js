/* ============================================================================
   INSPIRED Nr. 45  ·  Die lange Nacht
   The magazine as a field of constellations.

   Editorial source: Magazine_Fall-26_V1_DE-v4.pdf (work in progress).
   Imagery: extracted from that PDF, colour-managed to sRGB.

   Attribution policy: the PDF still carries placeholder captions
   ("Artist Name Artwork Title"). Works are only credited where the running
   text of the spread names the artist unambiguously. Everything else keeps
   the magazine's own line, "Auflage 100, signiert", and waits for the final
   caption pass. Nothing here is invented.

   Geometry
     Constellations sit at absolute positions in a wide dark field.
     Everything inside one is placed relative to its centre:
       ox  lateral   (negative = left)
       oy  vertical  (negative = up)
       oz  depth     (negative = nearer the entrance of the field)
       w   world width; height follows the work's true aspect ratio.
           Nothing is ever cropped.

   You move in all three. Works sit above you, below you, and behind you.
   ========================================================================= */

const ed100 = 'Auflage 100, signiert. Drei Größen erhältlich.';
const ed250 = '250 Exemplare und 25 APs, nummeriert und signiert.';

export const CONSTELLATIONS = [

  /* ══════════════════════════ 0 · SCHWELLE ═══════════════════════════════ */
  {
    id: 'schwelle', n: '', title: 'Inspired', eyebrow: 'Ausgabe Nr. 45',
    sub: 'Eine Nacht, in der die Werke das Licht machen.',
    at: [0, 0, 0], tint: '#0a0a0d', view: [0, 0, -2200],
    items: [
      { kind: 'title', id: 't-schwelle', ox: 0, oy: -60, oz: 0, w: 1300 },

      { kind: 'type', id: 'f-fenster', ox: -520, oy: 620, oz: -180, w: 640, size: 'lead',
        text: 'Es beginnt mit einem Fenster.' },

      { kind: 'work', id: 'window-plane', ox: 800, oy: -180, oz: 620, w: 720,
        caption: ed100,
        story: {
          eyebrow: 'Zum Geleit',
          head: 'Kunst kann transformieren und Verbindungen schaffen.',
          body: [
            'Mit Freude präsentieren wir Ihnen die neue Ausgabe von Inspired, eine Einladung in die facettenreiche Welt von LUMAS.',
            'Genau diesem Anspruch folgt auch diese Ausgabe: Wir öffnen Türen zu Ateliers, begleiten kreative Prozesse, eröffnen der Kunst Räume und initiieren Dialoge. Online und in unseren 19 Galerien.',
          ],
          sig: 'Stefanie Harig und Marc Ullrich',
        } },

      { kind: 'work', id: 'cover-burra', ox: -860, oy: -400, oz: 1040, w: 800,
        caption: ed100,
        story: {
          eyebrow: 'Das Titelbild',
          head: 'Aufnahme oder Erschaffung.',
          body: [
            'Je leichter Bilder entstehen, desto wertvoller wird das, was hinter einem Bild steht: eine Autorschaft, eine Haltung, eine Handschrift.',
            'Vor Arbeiten wie dieser stellt sich die Frage, ob fotografiert oder gemalt wurde, gar nicht mehr. Nicht die Maschine macht die Kunst.',
          ],
        } },

      { kind: 'hint', id: 'hint-move', ox: 60, oy: 980, oz: 240, w: 760,
        text: 'Ziehen bewegt Sie durch den Raum. Scrollen führt tiefer hinein.' },
    ],
  },

  /* ══════════════════════════ I · NACHTARBEIT ════════════════════════════ */
  {
    id: 'nacht', n: 'I', title: 'Nachtarbeit', eyebrow: 'Interview',
    sub: 'Marianna Gefen im Gespräch mit LUMAS Kuratorin Christin Feyerabend.',
    at: [-3900, -220, 4600], tint: '#0a0c15', view: [-3900, -220, 2300],
    items: [
      { kind: 'title', id: 't-nacht', ox: 0, oy: -120, oz: -1250, w: 1300 },

      { kind: 'pull', id: 'p-nacht', ox: 1460, oy: -700, oz: -240, w: 900,
        text: 'Wenn die Stadt still wird, schließe ich mich mit Wasser und Farben ein.' },

      { kind: 'work', id: 'gefen-04', ox: -260, oy: -140, oz: 0, w: 620,
        artist: 'Marianna Gefen', caption: ed100, feature: true,
        story: {
          eyebrow: 'Interview',
          head: 'Die Locked-In-Phase.',
          body: [
            'Mit dem Fahrrad durch Brooklyn, ein Stopp im Lieblingscafé zwischen Wohnung und Studio. Das ist meine Zeit, um mich mental einzustimmen und bei einer Tasse Kaffee den Tag zu planen.',
            'Bevor ich anfange zu malen, beginnt eine entscheidende Übergangsphase. Ich bereite Pigmente und Wasser vor, nehme letzte Anpassungen vor. Wenn der Fokus fehlt, hilft es mir, Musik zu hören oder Bass zu spielen, um wieder in die eigene Konzentration zu finden.',
            'Wenn die Stadt still wird, schließe ich mich mit Wasser und Farben ein, oft bis drei oder vier Uhr morgens. Diese nächtliche Einsamkeit ist für mich essenziell.',
            'Dann beginnt für mich die eigentliche Arbeit. Nur ich und die fließenden Bewegungen, die in vollkommener Konzentration zusammenwirken.',
          ],
          sig: 'Marianna Gefen',
          also: ['gefen-03', 'gefen-05'],
        } },

      { kind: 'scene', id: 'studio-desk', ox: -1600, oy: 280, oz: -540, w: 600,
        caption: 'Im Atelier, Brooklyn.' },
      { kind: 'work', id: 'gefen-01', ox: 1340, oy: 440, oz: 640, w: 540, caption: ed100 },
      { kind: 'work', id: 'gefen-03', ox: -1440, oy: -580, oz: 720, w: 520, caption: ed100 },
      { kind: 'work', id: 'gefen-05', ox: 280, oy: 660, oz: 1000, w: 520, caption: ed100 },
      { kind: 'scene', id: 'studio-brush', ox: 1540, oy: -260, oz: 1160, w: 500,
        caption: 'Pigment und Wasser.' },
      { kind: 'work', id: 'gefen-02', ox: -600, oy: -760, oz: 1360, w: 480, caption: ed100 },
      { kind: 'work', id: 'gefen-06', ox: -1520, oy: 500, oz: 1520, w: 540, caption: ed100 },

      { kind: 'work', id: 'quote-define', ox: 860, oy: 820, oz: 1680, w: 660,
        caption: 'Aus den VOICES dieser Ausgabe.' },

      { kind: 'voice', id: 'v-ullrich', ox: -1760, oy: -840, oz: 1940, w: 640,
        who: 'Marc Ullrich // LUMAS Gründer',
        text: 'Jedes der über 5.000 Werke in unserem Portfolio entsteht in engem Austausch zwischen Künstlerinnen, Kuratorinnen und unserem Labor. Was im Hintergrund geschieht, offenbart sich erst im fertigen Werk.' },
    ],
  },

  /* ══════════════════════ II · DIE FORM DES WASSERS ══════════════════════ */
  {
    id: 'wasser', n: 'II', title: 'Die Form des Wassers', eyebrow: 'Kevin Boyle',
    sub: 'Ströme ohne festen Lauf, aus der Luft gesehen.',
    at: [3600, 380, 8200], tint: '#070c12', view: [3600, 380, 5900],
    items: [
      { kind: 'title', id: 't-wasser', ox: 0, oy: -140, oz: -1350, w: 1400 },

      { kind: 'pull', id: 'p-wasser', ox: -1600, oy: 540, oz: -400, w: 860,
        text: 'Aus der Luft verliert Wasser seine Form.' },

      { kind: 'work', id: 'boyle-river', ox: 260, oy: -120, oz: 140, w: 1420,
        artist: 'Kevin Boyle', title: 'The Shape of Water', caption: ed100, feature: true,
        story: {
          eyebrow: 'Kevin Boyle',
          head: 'Kein Eingriff, keine Konstruktion, nur ein Blickwinkel, den man vom Boden aus nicht bekommt.',
          body: [
            'Kevin Boyle fotografiert Gletscherflüsse von oben: Ströme ohne festen Lauf, die sich in hunderte Arme teilen, verzweigen, neu ordnen und wieder zusammenfinden.',
            'Für die Serie The Shape of Water flog er mehrfach über die verflochtenen Flussläufe südlich von Skaftafell an der Südküste Islands, bei Wetter, das Flüge dort eher verhindert als erlaubt. Was entsteht, liest sich abstrakt und ist dokumentarisch.',
            'Boyle wurde 1973 in Winnipeg geboren und arbeitet in Vancouver. Er begann mit den verlassenen Ortschaften der kanadischen Prärie, fotografiert bei Mondlicht, und ist bei Landschaften angekommen, die sich in dieser Form nie wiederholen: Das Muster im Bild existiert seit der nächsten Schneeschmelze nicht mehr.',
            '2026 wurde er als Hasselblad Master in der Kategorie Architektur ausgezeichnet.',
          ],
          pull: 'Das Muster im Bild existiert seit der nächsten Schneeschmelze nicht mehr.',
        } },

      { kind: 'work', id: 'sea-horizon', ox: -2000, oy: -540, oz: 1520, w: 1300, caption: ed100 },
      { kind: 'work', id: 'wave-crest', ox: 1760, oy: 660, oz: 1260, w: 820, caption: ed100 },
      { kind: 'work', id: 'trees-water', ox: -700, oy: 800, oz: 2140, w: 620, caption: ed100 },
      { kind: 'work', id: 'wave-painted', ox: 1600, oy: -700, oz: 2300, w: 760, caption: ed100 },
    ],
  },

  /* ══════════════════════════ III · MASTER ═══════════════════════════════ */
  {
    id: 'master', n: 'III', title: 'Master', eyebrow: 'LUMAS Master',
    sub: 'Ausgewählte Werke bedeutender Künstlerpersönlichkeiten.',
    at: [-2100, -820, 12600], tint: '#0d0906', view: [-2100, -820, 10300],
    items: [
      { kind: 'title', id: 't-master', ox: 0, oy: -140, oz: -1300, w: 1300 },

      { kind: 'work', id: 'master-hirst-a', ox: 360, oy: -280, oz: 80, w: 940,
        artist: 'Damien Hirst', caption: ed250, feature: true,
        story: {
          eyebrow: 'Master · Damien Hirst',
          head: 'Schönheit, die ein Ablaufdatum hat.',
          body: [
            'Kirschblüten sind ein Motiv für Postkarten. Damien Hirst hat daraus 107 Gemälde gemacht.',
            'Zwischen 2018 und 2020 arbeitete er wieder selbst am Bild, in dicker Farbe, aufgetupft in tausenden Punkten, nach Jahrzehnten, in denen Formaldehyd, Schädel und Punktraster für ihn sprachen. Der Gegenstand blieb derselbe.',
            '2021 zeigte die Fondation Cartier in Paris die komplette Serie. Hirst, 1965 in Bristol geboren, nannte sie kitschig, dekorativ und maßlos. Das war keine Entschuldigung, sondern die Absicht.',
          ],
          pull: 'Kitschig, dekorativ und maßlos. Das war keine Entschuldigung, sondern die Absicht.',
          also: ['master-hirst-b'],
        } },

      { kind: 'work', id: 'master-richter', ox: -1660, oy: 240, oz: 560, w: 840,
        artist: 'Daniel Richter', caption: ed250,
        story: {
          eyebrow: 'Master · Daniel Richter',
          head: 'Erkennbar und fremd zugleich.',
          body: [
            'Daniel Richter gehört zu den wichtigsten deutschen Malern seiner Generation. Er kam über Punk und Plattencover zur Malerei, studierte bei Werner Büttner, assistierte Albert Oehlen.',
            'Seine Szenen verhandeln Politik und Geschichte, ohne sich festlegen zu lassen.',
          ],
        } },

      { kind: 'work', id: 'master-hirst-b', ox: 1820, oy: 580, oz: 1100, w: 600, artist: 'Damien Hirst', caption: ed250 },
      { kind: 'scene', id: 'master-room', ox: -1480, oy: -720, oz: 1280, w: 620, caption: 'Eine Master Edition im Raum.' },

      { kind: 'scene', id: 'master-murakami', ox: -340, oy: 720, oz: 1460, w: 860,
        artist: 'Takashi Murakami', caption: 'Vor dem Werk.',
        story: {
          eyebrow: 'Master · Takashi Murakami',
          head: 'Ihr Grinsen ist keine gute Laune, sondern eine Fassade.',
          body: [
            'Takashi Murakami, 1962 in Tokio geboren, promovierte in traditioneller japanischer Malerei und entwickelte daraus Superflat, eine Theorie, die den Unterschied zwischen Hochkultur und Anime, Galerie und Merchandise aufhebt.',
            'Die lächelnden Blumen sind ihr bekanntester Teil.',
          ],
        } },

      { kind: 'work', id: 'master-doig', ox: 1580, oy: -660, oz: 1900, w: 800,
        artist: 'Peter Doig', caption: ed250,
        story: {
          eyebrow: 'Master · Peter Doig',
          head: 'Kein Symbol, das sich auflösen lässt, sondern eines, das bleibt.',
          body: [
            'Peter Doig, 1959 in Edinburgh geboren, aufgewachsen in Trinidad und Kanada, malt Räume zwischen Erinnerung und Gegenwart: ein Torbogen, Segelboote, ein Bild im Bild.',
            'Der Löwe streift seit über einem Jahrzehnt durch sein Werk, Widerstand, fast christushafte Präsenz.',
          ],
        } },

      { kind: 'monolith', id: 'm-richter', ox: -1600, oy: 780, oz: 2180, w: 720,
        story: {
          eyebrow: 'Master · Gerhard Richter',
          head: 'Landschaft mit Wolke.',
          body: [
            'Gerhard Richters Werk ist das einer unnachahmlichen, nie festgelegten Handschrift, konsequent neu erfunden über Jahrzehnte, und doch unverwechselbar. Eine Qualität, die ihn seit Jahrzehnten zu einem der bedeutendsten und marktstärksten lebenden Künstler macht.',
            'Landschaft mit Wolke tritt aus diesem Œuvre hervor wie ein stiller Beweis.',
          ],
        } },

      { kind: 'voice', id: 'v-bamberg', ox: 1860, oy: 840, oz: 2340, w: 640,
        who: 'Christoph Bamberg // LUMAS Kurator',
        text: 'Der Moment, wenn jemand seinen Favoriten das erste Mal in der Galerie an der Wand sieht, ist ein sehr persönlicher. Das Kunsterlebnis kann nicht täuschen.' },
    ],
  },

  /* ═════════════════ IV · ZWEIHUNDERT JAHRE LICHT ════════════════════════ */
  /* The one constellation with a direction of its own: a corridor of dates
     that compresses as it approaches the present, because the article says
     the history reads like a single acceleration. */
  {
    id: 'licht', n: 'IV', title: 'Zweihundert Jahre Licht', eyebrow: '1826 bis heute',
    sub: 'Die Fotografie feiert Jubiläum und steht vor ihrer vielleicht spannendsten Epoche.',
    at: [4200, 120, 17400], tint: '#09080b', view: [4200, 120, 15000],
    items: [
      { kind: 'title', id: 't-licht', ox: 0, oy: -160, oz: -1400, w: 1500 },

      { kind: 'year', id: 'y-1826', ox: -1220, oy: 300, oz: -680, year: '1826', w: 640,
        text: 'Joseph Nicéphore Niépce richtet eine mit Asphalt beschichtete Zinnplatte auf den Hof seines Anwesens. Und wartet acht Stunden.' },

      { kind: 'plate', id: 'plate-niepce', ox: 440, oy: -200, oz: -420, w: 660,
        caption: 'Das erste beständige Bild. Verschwommen, grobkörnig, kaum lesbar.',
        story: {
          eyebrow: 'Zweihundert Jahre Licht',
          head: 'Nicht von Menschenhand gemalt, sondern vom Licht selbst geschrieben.',
          body: [
            'Was Niépce erhält, ist verschwommen, grobkörnig, kaum lesbar. Und doch ist es eine Revolution: das erste beständige Bild, das nicht von Menschenhand gemalt, sondern vom Licht selbst geschrieben wurde.',
            'Zweihundert Jahre später hängt die Nachfahrin dieser Zinnplatte in Museen, Galerien und Wohnzimmern auf der ganzen Welt.',
          ],
        } },

      { kind: 'year', id: 'y-1839', ox: -1290, oy: 360, oz: 80, year: '1839', w: 640,
        text: 'Daguerre verkürzt die Belichtungszeit und macht das Portrait zum Geschäftsmodell.' },
      { kind: 'work', id: 'lebeck-street', ox: 640, oy: -440, oz: 340, w: 560, caption: ed100 },

      { kind: 'year', id: 'y-1841', ox: -1360, oy: 420, oz: 780, year: '1841', w: 640,
        text: 'Talbot erfindet mit dem Negativ die Vervielfältigung. Und damit, nebenbei, die Idee der Edition.' },
      { kind: 'work', id: 'lebeck-salon', ox: 1600, oy: 260, oz: 920, w: 660, caption: ed100 },
      { kind: 'work', id: 'lebeck-balloons', ox: 220, oy: 720, oz: 1200, w: 600, caption: ed100 },

      { kind: 'year', id: 'y-1925', ox: -1440, oy: 480, oz: 1420, year: '1925', w: 640,
        text: 'Die Leica befreit die Kamera aus dem Studio.' },
      { kind: 'work', id: 'aarons-porsche', ox: 720, oy: -580, oz: 1580, w: 760, caption: ed100 },
      { kind: 'work', id: 'aarons-tennis', ox: 1880, oy: 420, oz: 1840, w: 640, caption: ed100 },

      { kind: 'year', id: 'y-1936', ox: -1520, oy: 540, oz: 2000, year: '1936', w: 640,
        text: 'Der Farbfilm holt die Welt in ihren eigenen Tönen ins Bild.' },
      { kind: 'work', id: 'aarons-desert', ox: 340, oy: -240, oz: 2160, w: 700, caption: ed100 },
      { kind: 'work', id: 'aarons-pool', ox: 1540, oy: 800, oz: 2340, w: 640, caption: ed100 },

      { kind: 'year', id: 'y-1949', ox: -1610, oy: 600, oz: 2500, year: '1949', w: 640,
        text: 'Heinrich Heidersberger baut aus einem Kochtopf eine Lichtkanone. Technisch eine Bastelei, künstlerisch ein Befreiungsschlag.' },
      { kind: 'work', id: 'aarons-pool-b', ox: 780, oy: -660, oz: 2640, w: 680, caption: ed100 },
      { kind: 'work', id: 'stern-marilyn', ox: 1940, oy: -160, oz: 2840, w: 540, caption: ed100 },
      { kind: 'work', id: 'bowie', ox: 200, oy: 340, oz: 3000, w: 520, caption: ed100 },

      { kind: 'year', id: 'y-1975', ox: -1700, oy: 660, oz: 3140, year: '1975', w: 640,
        text: 'Die Digitalisierung löst das Bild vom Material.' },

      { kind: 'work', id: 'schneider-grid', ox: 920, oy: -420, oz: 3260, w: 740,
        artist: 'Stefanie Schneider', caption: ed100, feature: true,
        story: {
          eyebrow: 'Stefanie Schneider',
          head: 'Ein Unikat im Zeitalter der Kopie.',
          body: [
            'Stefanie Schneider fotografiert die kalifornische Wüste auf abgelaufenem Polaroid-Material. Jedes ihrer Bilder ist chemisch unwiederholbar.',
            'Die vielleicht radikalste fotografische Antwort auf die Frage nach dem Original.',
          ],
          also: ['schneider-palms'],
        } },

      { kind: 'work', id: 'schneider-palms', ox: 2040, oy: 580, oz: 3440, w: 600, artist: 'Stefanie Schneider', caption: ed100 },
      { kind: 'work', id: 'wild-skyline', ox: 200, oy: -720, oz: 3580, w: 620, caption: ed100 },
      { kind: 'work', id: 'wild-paris', ox: 1200, oy: 260, oz: 3700, w: 620, caption: ed100 },
      { kind: 'work', id: 'menin-bloom', ox: 2180, oy: -440, oz: 3840, w: 560, caption: ed100 },
      { kind: 'work', id: 'wild-stripes', ox: 500, oy: 660, oz: 3940, w: 300, caption: ed100 },
      { kind: 'work', id: 'pop-sunglasses', ox: 1660, oy: 800, oz: 4060, w: 520, caption: ed100 },

      { kind: 'work', id: 'hare-whatnow', ox: 320, oy: -280, oz: 4200, w: 700,
        artist: 'Niki Hare', title: 'WHAT NOW', caption: ed100,
        story: {
          eyebrow: 'Niki Hare',
          head: 'Der Satz bleibt derselbe. Nur die Handschrift besteht jetzt aus Linien.',
          body: [
            'WHAT NOW, in Nägeln und Faden. Niki Hare, 1971 geboren, arbeitet in Tewkesbury an ihren Wordpaintings: Sätze, die ungefiltert aus ihrem Inneren kommen, schnell gemalt, weil ein Gefühl nicht wartet, bis die Schichten trocken sind.',
            'Diese Edition überträgt das in ein anderes Material. Ein einziger fortlaufender Polyesterfaden, so reißfest wie Nylon, zieht sich durch das gesamte Motiv, gespannt zwischen Nägeln aus einer rostfreien Luma-Titan-Legierung.',
          ],
        } },

      { kind: 'work', id: 'alan-populus', ox: 1720, oy: 320, oz: 4340, w: 620,
        artist: 'Craig Alan', title: 'Populus', caption: ed100, feature: true,
        story: {
          eyebrow: 'Craig Alan',
          head: 'Ikonen, zusammengesetzt aus lauter Einzelnen.',
          body: [
            'Von Weitem ein Pop-Art-Porträt: gelbes Haar, roter Mund, das Rasterpunktmuster alter Comichefte. Aus der Nähe zerfällt es. Jeder Punkt ist eine Figur, einzeln gemalt, mit Haltung, Kleidung und Geste.',
            'Die Idee kam Craig Alan auf einer Hochzeit. Er sah die Gäste von oben und erkannte, dass sie gemeinsam die Form eines Auges bildeten.',
            'Seine Bilder verlangen Bewegung: einen Schritt zurück für die Ikone, einen Schritt vor für die Menge. Beides gleichzeitig geht nicht. Genau darum geht es.',
          ],
          pull: 'Einen Schritt zurück für die Ikone, einen Schritt vor für die Menge.',
        } },

      { kind: 'scene', id: 'crieger-wall', ox: 800, oy: 780, oz: 4480, w: 700,
        artist: 'Axel Crieger', caption: 'Schwarzweiß, cineastisch, und stets eine Spur zu perfekt, um wahr gewesen zu sein.',
        story: {
          eyebrow: 'Axel Crieger',
          head: 'Standbilder aus Filmen, die nie gedreht wurden.',
          body: [
            'Bei Axel Crieger frühstückt Audrey Hepburn nicht bei Tiffany, sondern bei Katz’s Delicatessen. Aristoteles Onassis steht achselzuckend vor einer gesunkenen Yacht.',
            'Crieger arbeitet nicht mit der Kamera, sondern mit dem, was bereits fotografiert wurde. Aus vorhandenen Aufnahmen historischer und filmischer Figuren baut er neue Bilder, so lange, bis die Nahtstellen verschwunden sind.',
            'Entertainment Weekly hat das die Grammatik des Glamours genannt. Wie bei Warhol wird der Mythos dabei nicht erklärt, sondern vergrößert.',
          ],
        } },

      { kind: 'year', id: 'y-2026', ox: -1800, oy: 720, oz: 4600, year: '2026', w: 640,
        text: 'Künstliche Intelligenz erzeugt Bilder, die fotografisch aussehen, ohne je Licht gesehen zu haben. Wieder rufen manche das Ende des Mediums aus.' },

      { kind: 'pull', id: 'p-licht', ox: 1280, oy: -740, oz: 4780, w: 1000,
        text: 'Je leichter Bilder entstehen, desto wertvoller wird das, was hinter einem Bild steht.' },

      { kind: 'work', id: 'galeano-clouds', ox: 440, oy: 80, oz: 5080, w: 1080,
        artist: 'Andrés Galeano', caption: ed100, feature: true,
        story: {
          eyebrow: 'Andrés Galeano',
          head: 'Was Dokumentation war, wird Erinnerung.',
          body: [
            'Andrés Galeano fotografiert selten. Er sammelt, sortiert und ordnet neu, Bilder, die andere gemacht und dann vergessen haben.',
            'Sein Material stammt aus gefundenen Nachlässen und aus Archiven, etwa dem des früheren katalanischen Wetterdienstes: rund 6.000 Glasplatten mit nichts als Wolken, aufgenommen von Josep Pons i Girbau für einen internationalen Wolkenatlas. Nach Francos Einmarsch in Barcelona 1939 wurde der Dienst geschlossen, das Archiv beschlagnahmt.',
            'Aus solchen Beständen baut Galeano Rasterbilder: hunderte Himmel nebeneinander, kein einziger von ihm selbst belichtet. Was als Messinstrument gedacht war, wird zum Motiv.',
            'Die Frage, die sein Werk durchzieht, ist nicht, was ein Bild zeigt, sondern was mit Bildern geschieht, wenn niemand mehr weiß, wozu sie gemacht wurden.',
          ],
          pull: 'Hunderte Himmel nebeneinander, kein einziger von ihm selbst belichtet.',
        } },

      { kind: 'pull', id: 'p-licht-2', ox: -1340, oy: -580, oz: 5340, w: 960,
        text: 'Zweihundert Jahre nach Niépce ist die Fotografie nicht am Ziel, sondern am Anfang. Notfalls auch acht Stunden.' },

      { kind: 'voice', id: 'v-wikonkal', ox: 2140, oy: 720, oz: 5260, w: 640,
        who: 'Eva Wikonkal // Galerieleitung LUMAS Ungarn',
        text: 'Was im Hintergrund geschieht, offenbart sich erst im fertigen Werk, in Präzision und Qualität.' },
    ],
  },

  /* ══════════════════ V · DIE MITTERNACHTSSONNE ══════════════════════════ */
  {
    id: 'sonne', n: 'V', title: 'Die Mitternachtssonne', eyebrow: 'Daniel Kordan',
    sub: 'Ein Tag auf der Jagd nach einem Licht, das nicht untergeht.',
    at: [-4400, -520, 22600], tint: '#17101e', view: [-4400, -520, 20200],
    items: [
      { kind: 'title', id: 't-sonne', ox: 0, oy: -160, oz: -1400, w: 1500 },

      { kind: 'work', id: 'kordan-journal-a', ox: 80, oy: 60, oz: 240, w: 1340,
        artist: 'Daniel Kordan', caption: 'Aus dem Expeditionsjournal.', feature: true,
        story: {
          eyebrow: 'Daniel Kordan',
          head: 'Ein Tag auf der Jagd nach der Mitternachtssonne.',
          body: [
            'Es gibt Breitengrade, an denen der Tag nicht endet. Die Sonne sinkt zum Horizont, berührt ihn und steigt wieder. Zwischen 23 Uhr und drei Uhr morgens liegt das Licht, auf das gewartet wird.',
            'Was in diesen Stunden entsteht, lässt sich nicht wiederholen. Der Eisberg treibt weiter, der Nebel hebt sich, die Farbe kippt. Vier Stunden, in denen alles zusammenkommen muss.',
          ],
          pull: 'Die Sonne berührt den Horizont und steigt wieder.',
          also: ['kordan-ice', 'kordan-tree'],
        } },

      { kind: 'work', id: 'kordan-ice', ox: -1760, oy: -540, oz: -160, w: 880, artist: 'Daniel Kordan', caption: ed100 },
      { kind: 'work', id: 'kordan-tree', ox: 1720, oy: -620, oz: 400, w: 820, artist: 'Daniel Kordan', caption: ed100 },
      { kind: 'work', id: 'kordan-mist', ox: 1600, oy: 640, oz: 1260, w: 760, artist: 'Daniel Kordan', caption: ed100 },
      { kind: 'work', id: 'kordan-ice-b', ox: -1700, oy: 680, oz: 1440, w: 760, artist: 'Daniel Kordan', caption: ed100 },
      { kind: 'work', id: 'kordan-tree-b', ox: 540, oy: -840, oz: 1800, w: 720, artist: 'Daniel Kordan', caption: ed100 },
      { kind: 'work', id: 'kordan-journal-b', ox: -840, oy: 240, oz: 2080, w: 700, artist: 'Daniel Kordan', caption: 'Aus dem Expeditionsjournal.' },
      { kind: 'work', id: 'kordan-mist-b', ox: 1240, oy: -240, oz: 2300, w: 740, artist: 'Daniel Kordan', caption: ed100 },
      { kind: 'scene', id: 'kordan-train', ox: -1580, oy: -320, oz: 2480, w: 620, caption: 'Auf dem Weg dorthin.' },
    ],
  },

  /* ═════════════════ VI · WERKE, DIE SICH BEWEGEN ════════════════════════ */
  {
    id: 'bewegung', n: 'VI', title: 'Werke, die sich bewegen', eyebrow: 'Multi-Phase',
    sub: 'Kunst verändert den Blick. Und mit ihm das, was sichtbar wird.',
    at: [2600, 700, 27200], tint: '#130709', view: [2600, 700, 24900],
    items: [
      { kind: 'title', id: 't-bewegung', ox: 0, oy: -140, oz: -1350, w: 1400 },

      { kind: 'pull', id: 'p-bewegung', ox: -1660, oy: 520, oz: -500, w: 840,
        text: 'Gehen Sie an diesem Werk vorbei. Es sieht Sie kommen.' },

      { kind: 'phase', id: 'phase-stack', ox: 180, oy: -120, oz: 180, w: 980,
        frames: ['phase-left', 'phase-head', 'phase-head-b', 'phase-right'],
        caption: ed100, feature: true,
        story: {
          eyebrow: 'Multi-Phase',
          head: 'Ein dynamischer Dialog zwischen Motiv und Betrachter.',
          body: [
            'In unseren Multi-Phase Editionen sorgt die innovative Lentikular-Technik dafür, dass sich je nach Perspektive neue Dimensionen erschließen.',
            'Kunst in Bewegung. Diese Editionen sind begehrt: Wer früh entdeckt, sichert sich das Werk.',
          ],
          pull: 'Bewegen Sie sich seitlich an diesem Werk vorbei, und es dreht sich mit.',
        } },

      { kind: 'work', id: 'hug-magenta', ox: -1760, oy: -440, oz: 840, w: 600,
        artist: 'Beatrice Hug', title: 'SPHAERA', caption: ed100,
        story: {
          eyebrow: 'Beatrice Hug',
          head: 'SPHAERA.',
          body: [
            'Besonders Beatrice Hugs Arbeiten aus der Serie SPHAERA gehören zu den Positionen, die selten lange verfügbar bleiben.',
          ],
          also: ['hug-red', 'hug-yellow'],
        } },

      { kind: 'work', id: 'hug-red', ox: 1820, oy: 280, oz: 1140, w: 600, artist: 'Beatrice Hug', title: 'SPHAERA', caption: ed100 },
      { kind: 'work', id: 'hug-yellow', ox: -660, oy: 800, oz: 1540, w: 580, artist: 'Beatrice Hug', title: 'SPHAERA', caption: ed100 },
      { kind: 'work', id: 'hug-blue', ox: 1600, oy: -700, oz: 1860, w: 560, artist: 'Beatrice Hug', caption: ed100 },
      { kind: 'work', id: 'phase-shout', ox: -1600, oy: 420, oz: 2140, w: 640, caption: ed100 },

      { kind: 'voice', id: 'v-johnson', ox: 820, oy: 880, oz: 2360, w: 640,
        who: 'Hannah Johnson // Galerieleitung LUMAS Wien',
        text: 'Wir sehen jeden Tag: Das Kunsterlebnis zeigt ganz klar, was wir fühlen.' },
    ],
  },

  /* ══════════════════════ VII · ES WOHNT HIER ════════════════════════════ */
  {
    id: 'zuhause', n: 'VII', title: 'Es wohnt hier', eyebrow: 'Zu Besuch',
    sub: 'Bei Miriam und Christian. Angefangen hat es mit einem Fehler.',
    at: [-2200, -180, 31800], tint: '#0e0b08', view: [-2200, -180, 29500],
    items: [
      { kind: 'title', id: 't-zuhause', ox: 0, oy: -140, oz: -1350, w: 1400 },

      { kind: 'scene', id: 'home-couple', ox: 300, oy: -160, oz: 200, w: 780,
        caption: 'Miriam und Christian, Berlin.', feature: true,
        story: {
          eyebrow: 'Zu Besuch',
          head: 'Der Fehler hängt heute im Wohnzimmer.',
          body: [
            'Er bestand nicht darin, dieses Werk zu kaufen. Er bestand darin, zu warten. 2014 suchen Miriam und Christian in der LUMAS Galerie in Berlin ein Geschenk zur Wohnungseinweihung eines engen Freundes. Dann verschiebt sich die Einweihung, einmal, noch einmal, und als der Termin endlich steht, hat der Freund sich längst selbst ein Werk gekauft.',
            'Also packten sie es aus. Zur Probe, hieß es. Die Probe dauert jetzt zwölf Jahre.',
            'Sammlung benutzen sie ungern, das klinge nach Vitrine, nach Abgeschlossenheit. Christian sagt lieber: Die Wände erzählen, wo wir gerade waren. Und meint das nicht geografisch.',
            'Umgehängt wird trotzdem, ungefähr einmal im Jahr, meistens im Winter. Nicht weil etwas falsch hinge, sondern weil sich die Werke in neuer Nachbarschaft anders zeigen.',
            'Und das erste Werk hängt nach all den Jahren immer noch dort, wo es zur Probe hing. Manche Fehler haben einfach recht behalten.',
          ],
          pull: 'Man glaubt, man sucht Bilder aus. Dabei zeigen die Bilder einem, wer man inzwischen ist.',
          also: ['home-a', 'home-d'],
        } },

      { kind: 'pull', id: 'p-home', ox: -1660, oy: 480, oz: -280, w: 900,
        text: 'Wer über Jahre sammelt, sammelt am Ende auch sich selbst.' },

      { kind: 'scene', id: 'home-a', ox: -1540, oy: -540, oz: 740, w: 700, caption: 'Einzelne Raumansicht.' },
      { kind: 'scene', id: 'home-d', ox: 1740, oy: 360, oz: 960, w: 620, caption: 'Einzelne Raumansicht.' },
      { kind: 'scene', id: 'home-e', ox: -540, oy: 780, oz: 1300, w: 660, caption: 'Einzelne Raumansicht.' },
      { kind: 'scene', id: 'palace', ox: 1460, oy: -640, oz: 1540, w: 720, caption: 'Einzelne Raumansicht.' },
      { kind: 'scene', id: 'home-f', ox: -1720, oy: 320, oz: 1800, w: 560, caption: 'Einzelne Raumansicht.' },
      { kind: 'scene', id: 'home-c', ox: 640, oy: 740, oz: 2040, w: 600, caption: 'Einzelne Raumansicht.' },

      { kind: 'scene', id: 'gallery-opening', ox: -440, oy: -440, oz: 2340, w: 760,
        caption: 'Vernissage.',
        story: {
          eyebrow: 'Orte, an denen Kunst lebt',
          head: 'LUMAS ist mehr als ein Ort, an dem Kunst hängt.',
          body: [
            'In 19 Galerien weltweit, von Berlin über Wien und Zürich bis New York, wird Kunst zum Erlebnis, das man teilt. Regelmäßig öffnen unsere Galerien ihre Türen für Vernissagen, Künstlergespräche und Signierstunden.',
            'Momente, in denen Sammlerinnen und Sammler den Menschen hinter den Werken begegnen und eine Edition erleben, bevor sie zu Hause ihren Platz findet.',
          ],
          also: ['gallery-touch', 'gallery-front'],
        } },

      { kind: 'scene', id: 'gallery-touch', ox: 1520, oy: 500, oz: 2580, w: 620, caption: 'Kunst zum Gucken. Und Anfassen.' },
      { kind: 'scene', id: 'gallery-front', ox: -1600, oy: -280, oz: 2760, w: 600, caption: 'LUMAS Galerie.' },

      { kind: 'scene', id: 'airport', ox: 540, oy: -200, oz: 3020, w: 780,
        caption: 'Terminal 3, Frankfurt Airport.',
        story: {
          eyebrow: 'Wenn ein Flughafen zur Galerie wird',
          head: 'Wer hier auf seinen Flug wartet, wartet zwischen den Werken.',
          body: [
            'Im neuen Terminal 3 des Frankfurt Airport steht nicht nur eine Galerie, das gesamte Terminal ist eine geworden. Signierte Editionen internationaler Künstlerinnen und Künstler begleiten die Reisenden durch die Wartebereiche, beiläufig und auf Augenhöhe.',
            'Für viele ist es die erste Begegnung mit LUMAS, für manche der Beginn einer Sammlung.',
          ],
        } },

      { kind: 'scene', id: 'hanging', ox: -1220, oy: 580, oz: 3240, w: 760, caption: 'Aus dem Atelier an Ihre Wand.' },

      { kind: 'end', id: 'the-end', ox: 340, oy: 40, oz: 3760, w: 1200,
        title: 'liberation of arts',
        sub: 'Berlin · Hamburg · München · Köln · Frankfurt · Stuttgart · Düsseldorf · Dortmund · Hannover · Mannheim · New York · London · Paris · Miami · Budapest · Wien · Zürich' },
    ],
  },
];

/* Flattened and absolute. The engine only ever sees this. */
export const OBJECTS = CONSTELLATIONS.flatMap((c) =>
  c.items.map((it) => ({
    ...it,
    con: c.id,
    conTitle: c.title,
    conEyebrow: c.eyebrow,
    conSub: c.sub,
    conN: c.n,
    x: c.at[0] + it.ox,
    y: c.at[1] + it.oy,
    z: c.at[2] + it.oz,
  })),
);

/* Soft walls. You may wander, but not into nothing. */
export const BOUNDS = {
  x: [-8400, 8800],
  y: [-4400, 11000],
  z: [-4200, 38000],
};
