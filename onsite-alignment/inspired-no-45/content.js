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

const ed100 = 'Edition of 100, signed. Available in three sizes.';
const ed250 = '250 copies and 25 APs, numbered and signed.';

export const CONSTELLATIONS = [

  /* ══════════════════════════ 0 · SCHWELLE ═══════════════════════════════ */
  {
    id: 'schwelle', n: '', title: 'Inspired', eyebrow: 'Issue No. 45',
    sub: 'A night in which the works make the light.',
    at: [0, 0, 0], tint: '#0a0a0d', view: [0, 0, -2200],
    items: [
      { kind: 'title', id: 't-schwelle', ox: 0, oy: -60, oz: 0, w: 1300 },

      { kind: 'type', id: 'f-fenster', ox: -520, oy: 620, oz: -180, w: 640, size: 'lead',
        text: 'It begins with a window.' },

      { kind: 'work', id: 'window-plane', ox: 800, oy: -180, oz: 620, w: 720,
        caption: ed100,
        story: {
          eyebrow: 'A word to begin with',
          head: 'Art can transform, and it can connect.',
          body: [
            'We are glad to present the new issue of Inspired, an invitation into the many-sided world of LUMAS.',
            'This issue follows exactly that claim: we open the doors of studios, follow creative processes, give art rooms of its own and start conversations. Online and in our 19 galleries.',
          ],
          sig: 'Stefanie Harig and Marc Ullrich',
        } },

      { kind: 'work', id: 'cover-burra', ox: -860, oy: -400, oz: 1040, w: 800,
        caption: ed100,
        story: {
          eyebrow: 'The cover',
          head: 'Taken, or made.',
          body: [
            'The easier pictures are to make, the more valuable what stands behind one becomes: an authorship, a position, a hand.',
            'In front of work like this the question of whether it was photographed or painted no longer arises. The machine does not make the art.',
          ],
        } },

      { kind: 'hint', id: 'hint-move', ox: 60, oy: 980, oz: 240, w: 760,
        text: 'Drag to move through the room. Scroll to go deeper in.' },
    ],
  },

  /* ══════════════════════════ I · NACHTARBEIT ════════════════════════════ */
  {
    id: 'nacht', n: 'I', title: 'Night Work', eyebrow: 'Interview',
    sub: 'Marianna Gefen in conversation with LUMAS curator Christin Feyerabend.',
    at: [-3900, -220, 4600], tint: '#0a0c15', view: [-3900, -220, 2300],
    items: [
      { kind: 'title', id: 't-nacht', ox: 0, oy: -120, oz: -1250, w: 1300 },

      { kind: 'pull', id: 'p-nacht', ox: 1460, oy: -700, oz: -240, w: 900,
        text: 'When the city goes quiet I shut myself in with water and colour.' },

      { kind: 'work', id: 'gefen-04', ox: -260, oy: -140, oz: 0, w: 620,
        artist: 'Marianna Gefen', caption: ed100, feature: true,
        story: {
          eyebrow: 'Interview',
          head: 'The locked-in phase.',
          body: [
            'By bike through Brooklyn, a stop at my favourite café between the apartment and the studio. That is my time to get into the right frame of mind and plan the day over a coffee.',
            'Before I start painting there is a decisive transition. I prepare pigments and water, make the last adjustments. If the focus is missing it helps to listen to music, or to play bass, to find my way back into my own concentration.',
            'When the city goes quiet I shut myself in with water and colour, often until three or four in the morning. That solitude at night is essential to me.',
            'That is when the real work begins. Only me and the flowing movements, working together in complete concentration.',
          ],
          sig: 'Marianna Gefen',
          also: ['gefen-03', 'gefen-05'],
        } },

      { kind: 'scene', id: 'studio-desk', ox: -1600, oy: 280, oz: -540, w: 600,
        caption: 'In the studio, Brooklyn.' },
      { kind: 'work', id: 'gefen-01', ox: 1340, oy: 440, oz: 640, w: 540, caption: ed100 },
      { kind: 'work', id: 'gefen-03', ox: -1440, oy: -580, oz: 720, w: 520, caption: ed100 },
      { kind: 'work', id: 'gefen-05', ox: 280, oy: 660, oz: 1000, w: 520, caption: ed100 },
      { kind: 'scene', id: 'studio-brush', ox: 1540, oy: -260, oz: 1160, w: 500,
        caption: 'Pigment and water.' },
      { kind: 'work', id: 'gefen-02', ox: -600, oy: -760, oz: 1360, w: 480, caption: ed100 },
      { kind: 'work', id: 'gefen-06', ox: -1520, oy: 500, oz: 1520, w: 540, caption: ed100 },

      { kind: 'work', id: 'quote-define', ox: 860, oy: 820, oz: 1680, w: 660,
        caption: 'From the Voices in this issue.' },

      { kind: 'voice', id: 'v-ullrich', ox: -1760, oy: -840, oz: 1940, w: 640,
        who: 'Marc Ullrich // Founder of LUMAS',
        text: 'Every one of the more than 5,000 works in our portfolio comes out of close exchange between artists, curators and our laboratory. What happens behind the scenes only reveals itself in the finished work.' },
    ],
  },

  /* ══════════════════════ II · DIE FORM DES WASSERS ══════════════════════ */
  {
    id: 'wasser', n: 'II', title: 'The Shape of Water', eyebrow: 'Kevin Boyle',
    sub: 'Currents with no fixed course, seen from the air.',
    at: [3600, 380, 8200], tint: '#070c12', view: [3600, 380, 5900],
    items: [
      { kind: 'title', id: 't-wasser', ox: 0, oy: -140, oz: -1350, w: 1400 },

      { kind: 'pull', id: 'p-wasser', ox: -1600, oy: 540, oz: -400, w: 860,
        text: 'Seen from the air, water loses its shape.' },

      { kind: 'work', id: 'boyle-river', ox: 260, oy: -120, oz: 140, w: 1420,
        artist: 'Kevin Boyle', title: 'The Shape of Water', caption: ed100, feature: true,
        story: {
          eyebrow: 'Kevin Boyle',
          head: 'No intervention, no construction, only an angle you cannot get from the ground.',
          body: [
            'Kevin Boyle photographs glacial rivers from above: currents with no fixed course, splitting into hundreds of arms, branching, reordering and finding each other again.',
            'For the series The Shape of Water he flew repeatedly over the braided rivers south of Skaftafell on the south coast of Iceland, in weather that tends to forbid flying there rather than allow it. What comes out reads as abstract and is documentary.',
            'Boyle was born in Winnipeg in 1973 and works in Vancouver. He began with the abandoned settlements of the Canadian prairie, photographing by moonlight, and has arrived at landscapes that never repeat themselves: the pattern in the picture has not existed since the next thaw.',
            'In 2026 he was named a Hasselblad Master in the architecture category.',
          ],
          pull: 'The pattern in the picture has not existed since the next thaw.',
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
    sub: 'Selected works by artists who matter.',
    at: [-2100, -820, 12600], tint: '#0d0906', view: [-2100, -820, 10300],
    items: [
      { kind: 'title', id: 't-master', ox: 0, oy: -140, oz: -1300, w: 1300 },

      { kind: 'work', id: 'master-hirst-a', ox: 360, oy: -280, oz: 80, w: 940,
        artist: 'Damien Hirst', caption: ed250, feature: true,
        story: {
          eyebrow: 'Master · Damien Hirst',
          head: 'Beauty with an expiry date.',
          body: [
            'Cherry blossom is a motif for postcards. Damien Hirst made 107 paintings of it.',
            'Between 2018 and 2020 he worked on the picture himself again, in thick paint dabbed on in thousands of points, after decades in which formaldehyde, skulls and dot grids spoke for him. The subject stayed the same.',
            'In 2021 the Fondation Cartier in Paris showed the complete series. Hirst, born in Bristol in 1965, called it kitsch, decorative and excessive. That was not an apology, it was the intention.',
          ],
          pull: 'Kitsch, decorative and excessive. That was not an apology, it was the intention.',
          also: ['master-hirst-b'],
        } },

      { kind: 'work', id: 'master-richter', ox: -1660, oy: 240, oz: 560, w: 840,
        artist: 'Daniel Richter', caption: ed250,
        story: {
          eyebrow: 'Master · Daniel Richter',
          head: 'Recognisable and strange at once.',
          body: [
            'Daniel Richter is among the most important German painters of his generation. He came to painting through punk and record sleeves, studied under Werner Büttner and assisted Albert Oehlen.',
            'His scenes deal in politics and history without ever pinning themselves down.',
          ],
        } },

      { kind: 'work', id: 'master-hirst-b', ox: 1820, oy: 580, oz: 1100, w: 600, artist: 'Damien Hirst', caption: ed250 },
      { kind: 'scene', id: 'master-room', ox: -1480, oy: -720, oz: 1280, w: 620, caption: 'A Master edition at home.' },

      { kind: 'scene', id: 'master-murakami', ox: -340, oy: 720, oz: 1460, w: 860,
        artist: 'Takashi Murakami', caption: 'In front of the work.',
        story: {
          eyebrow: 'Master · Takashi Murakami',
          head: 'Their grin is not good cheer. It is a façade.',
          body: [
            'Takashi Murakami, born in Tokyo in 1962, took a doctorate in traditional Japanese painting and developed Superflat from it, a theory that dissolves the difference between high culture and anime, gallery and merchandise.',
            'The smiling flowers are its best known part.',
          ],
        } },

      { kind: 'work', id: 'master-doig', ox: 1580, oy: -660, oz: 1900, w: 800,
        artist: 'Peter Doig', caption: ed250,
        story: {
          eyebrow: 'Master · Peter Doig',
          head: 'Not a symbol that can be resolved, but one that stays.',
          body: [
            'Peter Doig, born in Edinburgh in 1959 and raised in Trinidad and Canada, paints spaces between memory and the present: an archway, sailing boats, a picture within a picture.',
            'The lion has prowled through his work for over a decade: resistance, an almost Christ-like presence.',
          ],
        } },

      { kind: 'monolith', id: 'm-richter', ox: -1600, oy: 780, oz: 2180, w: 720,
        story: {
          eyebrow: 'Master · Gerhard Richter',
          head: 'Landscape with cloud.',
          body: [
            'Gerhard Richter\u2019s work is that of an inimitable hand that never settles, reinvented consistently across decades and unmistakable all the same. A quality that has made him one of the most significant and most sought-after living artists for decades.',
            'Landscape with cloud steps out of that body of work like a quiet proof.',
          ],
        } },

      { kind: 'voice', id: 'v-bamberg', ox: 1860, oy: 840, oz: 2340, w: 640,
        who: 'Christoph Bamberg // Curator, LUMAS',
        text: 'The moment somebody sees their favourite on the gallery wall for the first time is a very personal one. The experience of art cannot deceive.' },
    ],
  },

  /* ═════════════════ IV · ZWEIHUNDERT JAHRE LICHT ════════════════════════ */
  /* The one constellation with a direction of its own: a corridor of dates
     that compresses as it approaches the present, because the article says
     the history reads like a single acceleration. */
  {
    id: 'licht', n: 'IV', title: 'Two Hundred Years of Light', eyebrow: '1826 to today',
    sub: 'Photography turns two hundred, and faces perhaps its most interesting era.',
    at: [4200, 120, 17400], tint: '#09080b', view: [4200, 120, 15000],
    items: [
      { kind: 'title', id: 't-licht', ox: 0, oy: -160, oz: -1400, w: 1500 },

      { kind: 'year', id: 'y-1826', ox: -1220, oy: 300, oz: -680, year: '1826', w: 640,
        text: 'Joseph Nicéphore Niépce points a pewter plate coated in asphalt at the courtyard of his estate. And waits eight hours.' },

      { kind: 'plate', id: 'plate-niepce', ox: 440, oy: -200, oz: -420, w: 660,
        caption: 'The first lasting picture. Blurred, coarse, barely legible.',
        story: {
          eyebrow: 'Zweihundert Jahre Licht',
          head: 'Not painted by human hand, but written by light itself.',
          body: [
            'What Niépce gets is blurred, coarse, barely legible. And yet it is a revolution: the first lasting picture not painted by human hand, but written by light itself.',
            'Two hundred years later, the descendants of that pewter plate hang in museums, galleries and living rooms all over the world.',
          ],
        } },

      { kind: 'year', id: 'y-1839', ox: -1290, oy: 360, oz: 80, year: '1839', w: 640,
        text: 'Daguerre shortens the exposure and turns the portrait into a business model.' },
      { kind: 'work', id: 'lebeck-street', ox: 640, oy: -440, oz: 340, w: 560, caption: ed100 },

      { kind: 'year', id: 'y-1841', ox: -1360, oy: 420, oz: 780, year: '1841', w: 640,
        text: 'Talbot invents reproduction with the negative. And with it, incidentally, the idea of the edition.' },
      { kind: 'work', id: 'lebeck-salon', ox: 1600, oy: 260, oz: 920, w: 660, caption: ed100 },
      { kind: 'work', id: 'lebeck-balloons', ox: 220, oy: 720, oz: 1200, w: 600, caption: ed100 },

      { kind: 'year', id: 'y-1925', ox: -1440, oy: 480, oz: 1420, year: '1925', w: 640,
        text: 'The Leica frees the camera from the studio.' },
      { kind: 'work', id: 'aarons-porsche', ox: 720, oy: -580, oz: 1580, w: 760, caption: ed100 },
      { kind: 'work', id: 'aarons-tennis', ox: 1880, oy: 420, oz: 1840, w: 640, caption: ed100 },

      { kind: 'year', id: 'y-1936', ox: -1520, oy: 540, oz: 2000, year: '1936', w: 640,
        text: 'Colour film brings the world into the picture in its own tones.' },
      { kind: 'work', id: 'aarons-desert', ox: 340, oy: -240, oz: 2160, w: 700, caption: ed100 },
      { kind: 'work', id: 'aarons-pool', ox: 1540, oy: 800, oz: 2340, w: 640, caption: ed100 },

      { kind: 'year', id: 'y-1949', ox: -1610, oy: 600, oz: 2500, year: '1949', w: 640,
        text: 'Heinrich Heidersberger builds a light cannon out of a cooking pot. Technically a piece of tinkering, artistically a breakthrough.' },
      { kind: 'work', id: 'aarons-pool-b', ox: 780, oy: -660, oz: 2640, w: 680, caption: ed100 },
      { kind: 'work', id: 'stern-marilyn', ox: 1940, oy: -160, oz: 2840, w: 540, caption: ed100 },
      { kind: 'work', id: 'bowie', ox: 200, oy: 340, oz: 3000, w: 520, caption: ed100 },

      { kind: 'year', id: 'y-1975', ox: -1700, oy: 660, oz: 3140, year: '1975', w: 640,
        text: 'Digitisation separates the picture from its material.' },

      { kind: 'work', id: 'schneider-grid', ox: 920, oy: -420, oz: 3260, w: 740,
        artist: 'Stefanie Schneider', caption: ed100, feature: true,
        story: {
          eyebrow: 'Stefanie Schneider',
          head: 'A one-off in the age of the copy.',
          body: [
            'Stefanie Schneider photographs the Californian desert on expired Polaroid stock. Each of her pictures is chemically unrepeatable.',
            'Perhaps the most radical photographic answer to the question of the original.',
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
          head: 'The sentence stays the same. Only the handwriting is made of lines now.',
          body: [
            'WHAT NOW, in nails and thread. Niki Hare, born in 1971, works in Tewkesbury on her word paintings: sentences that come out of her unfiltered, painted fast, because a feeling will not wait for the layers to dry.',
            'This edition carries that into another material. A single continuous polyester thread, as tear-resistant as nylon, runs through the entire motif, strung between nails in a stainless Luma-titanium alloy.',
          ],
        } },

      { kind: 'work', id: 'alan-populus', ox: 1720, oy: 320, oz: 4340, w: 620,
        artist: 'Craig Alan', title: 'Populus', caption: ed100, feature: true,
        story: {
          eyebrow: 'Craig Alan',
          head: 'Icons assembled out of individuals.',
          body: [
            'From a distance a pop-art portrait: yellow hair, red mouth, the dot pattern of old comic books. Up close it falls apart. Every dot is a figure, painted one by one, with a posture, clothes and a gesture.',
            'The idea came to Craig Alan at a wedding. He saw the guests from above and realised that together they formed the shape of an eye.',
            'His pictures demand movement: a step back for the icon, a step forward for the crowd. Both at once is impossible. That is exactly the point.',
          ],
          pull: 'A step back for the icon, a step forward for the crowd.',
        } },

      { kind: 'scene', id: 'crieger-wall', ox: 800, oy: 780, oz: 4480, w: 700,
        artist: 'Axel Crieger', caption: 'Black and white, cinematic, and always a shade too perfect to have been true.',
        story: {
          eyebrow: 'Axel Crieger',
          head: 'Stills from films that were never shot.',
          body: [
            'With Axel Crieger, Audrey Hepburn has breakfast not at Tiffany’s but at Katz’s Delicatessen. Aristotle Onassis shrugs in front of a sunken yacht.',
            'Crieger does not work with a camera but with what has already been photographed. From existing pictures of historical and cinematic figures he builds new ones, until the seams have disappeared.',
            'Entertainment Weekly called it the grammar of glamour. As with Warhol, the myth is not explained but enlarged.',
          ],
        } },

      { kind: 'year', id: 'y-2026', ox: -1800, oy: 720, oz: 4600, year: '2026', w: 640,
        text: 'Artificial intelligence makes pictures that look photographic without ever having seen light. Again some are calling the end of the medium.' },

      { kind: 'pull', id: 'p-licht', ox: 1280, oy: -740, oz: 4780, w: 1000,
        text: 'The easier pictures are to make, the more valuable what stands behind one becomes.' },

      { kind: 'work', id: 'galeano-clouds', ox: 440, oy: 80, oz: 5080, w: 1080,
        artist: 'Andrés Galeano', caption: ed100, feature: true,
        story: {
          eyebrow: 'Andrés Galeano',
          head: 'What was documentation becomes memory.',
          body: [
            'Andrés Galeano rarely photographs. He collects, sorts and reorders pictures other people made and then forgot.',
            'His material comes from found estates and from archives, among them that of the former Catalan weather service: some 6,000 glass plates holding nothing but clouds, taken by Josep Pons i Girbau for an international cloud atlas. After Franco entered Barcelona in 1939 the service was closed and the archive seized.',
            'Out of holdings like these Galeano builds grid pictures: hundreds of skies side by side, not one of them exposed by him. What was meant as an instrument of measurement becomes the motif.',
            'The question running through his work is not what a picture shows, but what happens to pictures when nobody remembers what they were made for.',
          ],
          pull: 'Hundreds of skies side by side, not one of them exposed by him.',
        } },

      { kind: 'pull', id: 'p-licht-2', ox: -1340, oy: -580, oz: 5340, w: 960,
        text: 'Two hundred years after Niépce, photography is not at its destination but at its beginning. Eight hours, if that is what it takes.' },

      { kind: 'voice', id: 'v-wikonkal', ox: 2140, oy: 720, oz: 5260, w: 640,
        who: 'Eva Wikonkal // Gallery director, LUMAS Hungary',
        text: 'What happens behind the scenes only reveals itself in the finished work, in precision and quality.' },
    ],
  },

  /* ══════════════════ V · DIE MITTERNACHTSSONNE ══════════════════════════ */
  {
    id: 'sonne', n: 'V', title: 'The Midnight Sun', eyebrow: 'Daniel Kordan',
    sub: 'A day spent hunting a light that does not set.',
    at: [-4400, -520, 22600], tint: '#17101e', view: [-4400, -520, 20200],
    items: [
      { kind: 'title', id: 't-sonne', ox: 0, oy: -160, oz: -1400, w: 1500 },

      { kind: 'work', id: 'kordan-journal-a', ox: 80, oy: 60, oz: 240, w: 1340,
        artist: 'Daniel Kordan', caption: 'From the expedition journal.', feature: true,
        story: {
          eyebrow: 'Daniel Kordan',
          head: 'A day spent hunting the midnight sun.',
          body: [
            'There are latitudes where the day does not end. The sun sinks towards the horizon, touches it and rises again. The light worth waiting for sits between eleven at night and three in the morning.',
            'What comes about in those hours cannot be repeated. The iceberg drifts on, the fog lifts, the colour turns. Four hours in which everything has to come together.',
          ],
          pull: 'The sun touches the horizon and rises again.',
          also: ['kordan-ice', 'kordan-tree'],
        } },

      { kind: 'work', id: 'kordan-ice', ox: -1760, oy: -540, oz: -160, w: 880, artist: 'Daniel Kordan', caption: ed100 },
      { kind: 'work', id: 'kordan-tree', ox: 1720, oy: -620, oz: 400, w: 820, artist: 'Daniel Kordan', caption: ed100 },
      { kind: 'work', id: 'kordan-mist', ox: 1600, oy: 640, oz: 1260, w: 760, artist: 'Daniel Kordan', caption: ed100 },
      { kind: 'work', id: 'kordan-ice-b', ox: -1700, oy: 680, oz: 1440, w: 760, artist: 'Daniel Kordan', caption: ed100 },
      { kind: 'work', id: 'kordan-tree-b', ox: 540, oy: -840, oz: 1800, w: 720, artist: 'Daniel Kordan', caption: ed100 },
      { kind: 'work', id: 'kordan-journal-b', ox: -840, oy: 240, oz: 2080, w: 700, artist: 'Daniel Kordan', caption: 'From the expedition journal.' },
      { kind: 'work', id: 'kordan-mist-b', ox: 1240, oy: -240, oz: 2300, w: 740, artist: 'Daniel Kordan', caption: ed100 },
      { kind: 'scene', id: 'kordan-train', ox: -1580, oy: -320, oz: 2480, w: 620, caption: 'On the way there.' },
    ],
  },

  /* ═════════════════ VI · WERKE, DIE SICH BEWEGEN ════════════════════════ */
  {
    id: 'bewegung', n: 'VI', title: 'Works That Move', eyebrow: 'Multi-Phase',
    sub: 'Art changes the way you look, and with it what becomes visible.',
    at: [2600, 700, 27200], tint: '#130709', view: [2600, 700, 24900],
    items: [
      { kind: 'title', id: 't-bewegung', ox: 0, oy: -140, oz: -1350, w: 1400 },

      { kind: 'pull', id: 'p-bewegung', ox: -1660, oy: 520, oz: -500, w: 840,
        text: 'Walk past this work. It sees you coming.' },

      { kind: 'phase', id: 'phase-stack', ox: 180, oy: -120, oz: 180, w: 980,
        frames: ['phase-left', 'phase-head', 'phase-head-b', 'phase-right'],
        caption: ed100, feature: true,
        story: {
          eyebrow: 'Multi-Phase',
          head: 'A living dialogue between the picture and the person looking.',
          body: [
            'In our Multi-Phase editions, lenticular technique opens new dimensions depending on where you stand.',
            'Art in motion. These editions are sought after: whoever finds them early secures the work.',
          ],
          pull: 'Move sideways past this work and it turns with you.',
        } },

      { kind: 'work', id: 'hug-magenta', ox: -1760, oy: -440, oz: 840, w: 600,
        artist: 'Beatrice Hug', title: 'SPHAERA', caption: ed100,
        story: {
          eyebrow: 'Beatrice Hug',
          head: 'SPHAERA.',
          body: [
            'Beatrice Hug\u2019s works from the SPHAERA series in particular are among the positions that rarely stay available for long.',
          ],
          also: ['hug-red', 'hug-yellow'],
        } },

      { kind: 'work', id: 'hug-red', ox: 1820, oy: 280, oz: 1140, w: 600, artist: 'Beatrice Hug', title: 'SPHAERA', caption: ed100 },
      { kind: 'work', id: 'hug-yellow', ox: -660, oy: 800, oz: 1540, w: 580, artist: 'Beatrice Hug', title: 'SPHAERA', caption: ed100 },
      { kind: 'work', id: 'hug-blue', ox: 1600, oy: -700, oz: 1860, w: 560, artist: 'Beatrice Hug', caption: ed100 },
      { kind: 'work', id: 'phase-shout', ox: -1600, oy: 420, oz: 2140, w: 640, caption: ed100 },

      { kind: 'voice', id: 'v-johnson', ox: 820, oy: 880, oz: 2360, w: 640,
        who: 'Hannah Johnson // Gallery director, LUMAS Vienna',
        text: 'We see it every day: the experience of art shows plainly what we feel.' },
    ],
  },

  /* ══════════════════════ VII · ES WOHNT HIER ════════════════════════════ */
  {
    id: 'zuhause', n: 'VII', title: 'It Lives Here', eyebrow: 'A visit',
    sub: 'To Miriam and Christian. It started with a mistake.',
    at: [-2200, -180, 31800], tint: '#0e0b08', view: [-2200, -180, 29500],
    items: [
      { kind: 'title', id: 't-zuhause', ox: 0, oy: -140, oz: -1350, w: 1400 },

      { kind: 'scene', id: 'home-couple', ox: 300, oy: -160, oz: 200, w: 780,
        caption: 'Miriam and Christian, Berlin.', feature: true,
        story: {
          eyebrow: 'Zu Besuch',
          head: 'The mistake hangs in the living room today.',
          body: [
            'It was not buying the work. It was waiting. In 2014 Miriam and Christian are in the LUMAS gallery in Berlin looking for a housewarming present for a close friend. Then the date moves, once, then again, and by the time it is finally fixed the friend has long since bought a work himself.',
            'So they unpacked it themselves. On trial, they said. The trial has been running twelve years.',
            'They are reluctant to say collection, it sounds like a display case, like something finished. Christian prefers: the walls tell you where we have been. And he does not mean it geographically.',
            'They rehang all the same, about once a year, usually in winter. Not because anything hangs wrong, but because works show themselves differently in new company.',
            'And after all these years the first work still hangs where it hung on trial. Some mistakes simply turn out to be right.',
          ],
          pull: 'You think you are choosing pictures. In fact the pictures show you who you have become.',
          also: ['home-a', 'home-d'],
        } },

      { kind: 'pull', id: 'p-home', ox: -1660, oy: 480, oz: -280, w: 900,
        text: 'Anyone who collects over years ends up collecting themselves.' },

      { kind: 'scene', id: 'home-a', ox: -1540, oy: -540, oz: 740, w: 700, caption: 'Single room view.' },
      { kind: 'scene', id: 'home-d', ox: 1740, oy: 360, oz: 960, w: 620, caption: 'Single room view.' },
      { kind: 'scene', id: 'home-e', ox: -540, oy: 780, oz: 1300, w: 660, caption: 'Single room view.' },
      { kind: 'scene', id: 'palace', ox: 1460, oy: -640, oz: 1540, w: 720, caption: 'Single room view.' },
      { kind: 'scene', id: 'home-f', ox: -1720, oy: 320, oz: 1800, w: 560, caption: 'Single room view.' },
      { kind: 'scene', id: 'home-c', ox: 640, oy: 740, oz: 2040, w: 600, caption: 'Single room view.' },

      { kind: 'scene', id: 'gallery-opening', ox: -440, oy: -440, oz: 2340, w: 760,
        caption: 'Opening night.',
        story: {
          eyebrow: 'Places where art lives',
          head: 'LUMAS is more than a place where art hangs.',
          body: [
            'In 19 galleries worldwide, from Berlin through Vienna and Zurich to New York, art becomes an experience you share. Our galleries regularly open their doors for openings, artist talks and signings.',
            'Moments in which collectors meet the people behind the works and experience an edition before it finds its place at home.',
          ],
          also: ['gallery-touch', 'gallery-front'],
        } },

      { kind: 'scene', id: 'gallery-touch', ox: 1520, oy: 500, oz: 2580, w: 620, caption: 'Art to look at. And to touch.' },
      { kind: 'scene', id: 'gallery-front', ox: -1600, oy: -280, oz: 2760, w: 600, caption: 'A LUMAS gallery.' },

      { kind: 'scene', id: 'airport', ox: 540, oy: -200, oz: 3020, w: 780,
        caption: 'Terminal 3, Frankfurt Airport.',
        story: {
          eyebrow: 'When an airport becomes a gallery',
          head: 'Anyone waiting for a flight here waits among the works.',
          body: [
            'In the new Terminal 3 at Frankfurt Airport there is not simply a gallery, the whole terminal has become one. Signed editions by international artists accompany travellers through the waiting areas, casually and at eye level.',
            'For many it is a first encounter with LUMAS, for some the beginning of a collection.',
          ],
        } },

      { kind: 'scene', id: 'hanging', ox: -1220, oy: 580, oz: 3240, w: 760, caption: 'From the studio to your wall.' },

      { kind: 'end', id: 'the-end', ox: 340, oy: 40, oz: 3760, w: 1200,
        title: 'liberation of arts',
        sub: 'Berlin · Hamburg · Munich · Cologne · Frankfurt · Stuttgart · Düsseldorf · Dortmund · Hanover · Mannheim · New York · London · Paris · Miami · Budapest · Vienna · Zurich' },
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
