# INSPIRED No. 45 · The Long Night

Two prototypes of the same magazine issue, built from the same asset library,
both in English.

| | | |
|---|---|---|
| **`index.html`** | **The Long Night, as a story** | A scroll-driven editorial journey. Scroll is the only control. |
| `cloud.html` | The Long Night, as a room | The spatial version: a dark field of constellations you navigate in all three axes. |

Run either from the prototype server:

```bash
python3 -m http.server 8941 --directory prototype
```

then open `/inspired/` (the story) or `/inspired/cloud.html` (the room). Each
links to the other.

Source: `Magazine_Fall-26_V1_DE-v4.pdf` (work in progress). 75 images were
extracted from it and colour-managed to sRGB; **69 are used**, each exactly
once. The six that are not:

- **four true duplicates.** A perceptual hash over the whole library found four
  pairs at distance zero: the magazine printed the same three Daniel Kordan
  works on both pages of the spread, and two lenticular frames are identical.
  Worth running that check on any extracted set before laying it out.
- one screen capture of a working document with a UI tooltip baked into it.
- the aircraft window, whose section was cut. The Niépce opening it carried is
  still in the piece, as the first beat of the photography sequence.

---

## 1. Editorial DNA — what this issue is actually about

Read past the section titles and every story in this issue is the same story:
**the image that had to wait, in a world that no longer waits.**

- Niépce points a plate at a window and waits eight hours.
- Kevin Boyle flies over Icelandic glacial rivers in weather that forbids
  flying, for a pattern that will not exist after the next thaw.
- Stefanie Schneider shoots expired Polaroid: chemically unrepeatable.
- Andrés Galeano collects 6,000 cloud plates nobody remembers the purpose of.
- Marianna Gefen only starts working when the city goes quiet, at 3am.
- Daniel Kordan hunts four hours of light that does not set.
- Damien Hirst paints beauty with an expiry date.
- Miriam and Christian buy a work by mistake, hang it "on trial", and the
  trial lasts twelve years.

Against that, the issue names the counter-force explicitly: infinite images,
AI, the stream. And it gives LUMAS's answer in one word: **Verdichtung**.
Condensation. The finite edition against the infinite feed.

That thesis is the spine of the story, and it becomes a literal turn: two
hundred years of light accumulate until the frame is drowning in pictures, and
the next screen asks what an original still is.

## 2. The story (`index.html`)

Built in the grammar of `prototype/lumas-story-of-art.html` so the two read as
one family: the same header and promo bar, the same `.reveal` observer with
staggered delays, the same parallax on full-bleed media, the same pinned
sections whose progress is driven by scroll position, the same footer.

Twenty-five sections, roughly 43,000 px of scroll. Every narrative in the
magazine appears:

| Section | Surface | What it does |
|---|---|---|
| The cover · *pinned* | black | the cover work opens as a detail filling the frame and pulls back as you scroll until the whole work is there, with **Inspired** over it and the issue line arriving underneath once it has settled |
| A word to begin with | **ivory** | the editors' letter, one centred column |
| Night work · *pinned* | black | the studio desk turns into the finished edition while the interview arrives line by line |
| Gefen, the works | black | six editions, the handwritten note, the brush |
| The Shape of Water · *pinned* | blue-black | Boyle centred, fragments left, statement right, five water works arriving one after another |
| Master | **ivory** | Hirst, Murakami, Richter, Doig on a gallery wall, with pull quotes |
| Voices | **bone** | Marc Ullrich, full width, nothing else on screen |
| Two hundred years of photography · *pinned* | black | the signature beat. See below. |
| The new question | **ivory** | the one argument page. The answer is set in italic Utile Display. |
| Andrés Galeano | deep | the cloud grid: hundreds of skies, not one of them his |
| Niki Hare | black | WHAT NOW, in nails and a single continuous thread |
| Craig Alan · *pinned* | black | scroll is the step forward. See below. |
| Axel Crieger | black | stills from films that were never shot |
| The midnight sun | violet | Kordan's journal, then eight works and the train |
| Multi-Phase · *pinned* | red-black | the lenticular edition turns as you scroll past it |
| Formats | **ivory** | museum format up to 550 cm, and the Petites and Darlings |
| It lives here · *pinned* | **bone** | a work is hung on a wall while the collector story lands, then five rooms |
| Voices | black | Christoph Bamberg |
| Places | black | Terminal 3, and three galleries |
| About LUMAS | **ivory** | the six steps, from the artists to your wall |
| Ways in | black | four routes, including the door to the spatial version |
| liberation of arts | black | the cities, and the way to the collection |

### The surfaces

The issue breathes by changing ground: **black** for the night and the image
stream, **ivory** for the gallery wall and the argument, **bone** for the rooms
people actually live in. A section declares `data-surface` and everything
inside follows: type colour, hairlines, and the weight of a shadow, because on
paper a shadow is paper-soft rather than theatrical. The header inverts to dark
type on light over every light section, and the reading-progress hairline
inverts with it.

### Two beats that earn the concept

**Two hundred years of photography.** The scroll carries you through the essay
while **photographs accumulate in the frame**: one dark plate at the start, then
three, then nine, then seventeen crowding each other by the present. The essay
says the image stream has become infinite while the edition stays finite.
Rather than describe that, the beat performs it, and the very next screen asks
the question the flood provokes.

It is keyed to **techniques rather than dates**. A hard year on screen never
quite matched the works arriving beside it, so each beat now names the way of
making a picture that those works share: patience and nearness, out of the
studio, colour and the good life, the icon reduced, chemistry that cannot
repeat, the city taken apart, grown rather than found, and the stream. The works
are ordered so each group arrives beside its own technique, and a running count
of editions replaces the year on the rail.

**Craig Alan.** The magazine says his pictures demand movement: a step back for
the icon, a step forward for the crowd, and that both at once is impossible.
Here scrolling *is* the step. The work zooms until the pop portrait dissolves
into hundreds of individually painted figures, and the caption turns over with
it.

## 3. Why this shape

The spatial version is the more ambitious idea and the harder thing to use.
This one inverts that trade: **scroll is the whole interface**, so there is
nothing to learn, and the magic is spent on moments rather than on navigation.
Each pinned beat is a single, legible transformation you cause by doing the one
thing you were already doing.

Both remain in the repo because they answer different questions. The story is
the shippable shape. The room is where the ideas came from.

## 4. Craft notes

**Artworks are never cropped.** Every edition appears whole, at its true
aspect ratio. Where a frame has to be filled, the image in it is a photograph
of a *place* (a studio, a room, a gallery, a terminal), never a work. The
studio beat makes this explicit: the room photograph is cropped to the frame,
the edition that replaces it is contained inside it on a dark ground. The
opening was restructured away from a full-bleed hero for the same reason.

Two deliberate exceptions, both of which are the point rather than an accident:
the flood, where works overlap as they pile up, and Craig Alan, where the
zoom is the article's own instruction to step closer.

**`overflow-x: clip`, never `hidden`.** `overflow-x: hidden` on `html` or
`body` turns the element into a scroll container and silently breaks every
`position: sticky` inside it. `clip` prevents the sideways scroll without that
side effect. This cost real debugging time; it is the single most useful thing
in this file.

**A surface declares its ink; components inherit it.** The first version wrote
overrides like `[data-surface="bone"] .voice blockquote { color: ink }`, which
requires `.voice` to be a *descendant* of the surface. But a section is written
`<section class="voice" data-surface="bone">`, so the attribute and the class sit
on the **same element**, the descendant selector never matches, and the quote
rendered ivory on ivory: a section that looked completely empty. Nothing warns
you, because the CSS is valid. Surfaces now set inherited custom properties
(`--fg`, `--fg-dim`, `--fg-faint`, `--rule`) and every component reads those, so
same-element and ancestor cases behave identically. There is a contrast audit in
the verification pass that walks every visible string and fails anything under a
1.6 ratio against its own background.

**A reveal only animates if you scrolled to it.** Landing mid-fade, after a
flick of the trackpad or a deep link, showed an empty band for nine tenths of a
second, which reads as a section that failed to load. The engine now measures
the scroll delta: arrive gradually and you get the fade, arrive by jumping and
the content is simply already there.

**Never `ch` on a container.** `max-width: 30ch` on a wrapper resolves against
the *wrapper's* font size, not the display type inside it, so a 59 px headline
got strangled into a 380 px column and wrapped to seven lines. Containers get
absolute measures; `ch` is only ever set on the text element itself.

**No library, no build step.** One stylesheet, one script, plain
IntersectionObserver and one rAF-throttled scroll handler. Self-hosted Utile
Display and Archivo from the shared prototype asset layer.

**Captions belong to what is on the wall.** In the pinned beats the caption
changes with the image, so a credit is never attached to the wrong picture, and
it is positioned under the work that is actually on screen rather than under
the tallest slot in the stack. Its position is computed from each work's true
ratio, taken from the `width`/`height` attributes, rather than measured: the
first frame gives the wrong measurement because the beat has not been laid out
yet, and that wrong answer then gets cached.

**One work at a time.** In the water beat the five works are different shapes,
so any moment where two are part-visible reads as one showing through the other
rather than as a dissolve. Each holds, then fades out completely through the
black before the next arrives. Verified across 21 sample positions: never two
at once, every work whole and inside the frame, caption always 36 px beneath
it.

Verified: no horizontal overflow at any scroll position on desktop or mobile,
header contrast correct against every surface at 21 sample points, all five
pinned beats pinning, no console errors, every image resolving.

## 5. Editorial integrity

The source PDF is a work in progress and still carries placeholder captions
("Artist Name Artwork Title"). **Works are credited only where the running
text of that spread names the artist unambiguously**: Kevin Boyle, Damien
Hirst, Daniel Richter, Peter Doig, Takashi Murakami, Marianna Gefen, Niki
Hare, Stefanie Schneider, Andrés Galeano, Daniel Kordan, Craig Alan, Beatrice
Hug, Axel Crieger. Everything else keeps the magazine's own line, "Edition of
100, signed", and waits for the final caption pass. Nothing was invented to
fill a gap.

Room views are, as the magazine states, montages of photography and
AI-generated picture parts, manually finished. The works themselves are
unchanged.

The English is a translation of the German issue, written to the same voice
rules: sentence case, no exclamation marks, no em dashes.

## 6. Files

```
inspired/
  index.html        the story
  journey.css       its styles, including the surface system
  journey.js        reveals, parallax, six scroll-driven beats
  cloud.html        the spatial version
  world.js          its engine
  content.js        its field of constellations
  inspired.css      its styles
  assets/
    manifest.json   per-image dimensions, aspect ratio, LQIP, glow colour
    img/            75 images extracted from the PDF, colour-managed to sRGB
```

## 7. What I would build next

1. **Sound.** Still the biggest missing dimension: a room tone that changes
   with the surfaces, and silence on the argument page.
2. **Real catalogue links.** Every credited work should reach its PDP from its
   caption.
3. **The accumulation beat as a template.** It is reusable for any LUMAS story
   about abundance versus scarcity.
4. **A shareable anchor per section**, so a newsletter can open on the Kordan
   journal or the Master wall.
5. **A German build from the same markup**, once the copy is final, rather than
   two hand-maintained language versions.
6. **Caption pass.** As soon as the magazine's captions are final, the
   attribution gaps close and the piece stops hedging.
