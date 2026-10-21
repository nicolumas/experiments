/* Die Galerie der unausgesprochenen Dinge: the music and the sound of the moments.

   An original tune ("Kunstvolle Weihnachten", 32-bar AABA in F major, swing at 108 bpm) in the language of the
   Christmas jazz standards: a singable line of long notes, the warm changes (I, VI7, ii, V and the minor iv), a
   music-box intro. All synthesised in the browser with Web Audio: no audio files, no licence question.

   The band: vibraphone (melody) with a celesta an octave above, electric piano (comping, rootless voicings,
   voice-led), plucked upright bass (Karplus-Strong, walking or in two), brushes on 2 and 4, sleigh bells playing
   the ride pattern, and a soft string pad under it all day. Glockenspiel and harp colour the moments.

   The music follows the picture: thinner while you play a gesture (the band leaves you room and builds up as you
   progress), fuller when you travel, and at every reveal a run lands on the next bar line while the tune plays on
   (it never starts over, so you hear the whole song through the day). The finale is a cadence on the theme with a turn nobody expects (bVI, bVII, I).

   Loaded after engine.js; replaces engine's G.audio and keeps every method the gestures call:
   init, start, stop, on, ctx, pluck, bell, air, thud, note, chime.
   New cues: setScene, travel, progress, peak, door, finale, duck. See README "Music" for how main.js calls them. */
(() => {
  'use strict';

  const G = (window.GAL = window.GAL || {});
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const ftom = (f) => 69 + 12 * Math.log2(Math.max(20, f) / 440);
  const NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const nameOf = (m) => `${NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
  const PCN = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  const midiOf = (s) => {
    const m = /^([A-G](?:#|b)?)(-?\d)$/.exec(s);
    if (!m) throw new Error(`bad note ${s}`);
    return 12 * (+m[2] + 1) + PCN[m[1]];
  };
  const pcOf = (m) => ((m % 12) + 12) % 12;
  const hash = (n) => { let x = (n + 0x9e3779b9) | 0; x = Math.imul(x ^ (x >>> 16), 0x85ebca6b); x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };

  /* ------------------------------------------------------------ time */

  const BPM = 108;
  const SPB = 60 / BPM;
  const BAR = SPB * 4;
  const SWING = 0.62; /* the off-beat eighth sits at 62 % of the beat: light, bouncy swing */
  const posT = (p) => (Math.floor(p / 2) + (p % 2 ? SWING : 0)) * SPB; /* p: swung eighths from the bar line */
  const LOOKAHEAD = 0.32;
  const BAND_LEVEL = 0.62; /* the band sits about 4 dB under the moments */
  const ROLL_PEAK = 0.75; /* the sleigh-bell roll swells for 0.75 s into the bar line */

  /* ------------------------------------------------------------ harmony */

  /* tones: root, third (or fourth), fifth, seventh (or sixth). color: the tensions the voicings use. */
  const QUAL = {
    maj9: { tones: [0, 4, 7, 11], color: [2], voice: [4, 7, 11, 2], guide: [4, 11, 2], sym: 'maj9' },
    69: { tones: [0, 4, 7, 9], color: [2], voice: [4, 9, 2, 7], guide: [4, 9, 2], sym: '6/9' },
    m9: { tones: [0, 3, 7, 10], color: [2], voice: [3, 7, 10, 2], guide: [3, 10, 2], sym: 'm9' },
    m11: { tones: [0, 3, 7, 10], color: [2, 5], voice: [3, 5, 7, 10], guide: [3, 10, 5], sym: 'm11' },
    13: { tones: [0, 4, 7, 10], color: [2, 9], voice: [10, 2, 4, 9], guide: [4, 10, 9], sym: '13' },
    sus: { tones: [0, 5, 7, 10], color: [2], voice: [10, 2, 5, 7], guide: [5, 10, 2], sym: '9sus4' },
    9: { tones: [0, 4, 7, 10], color: [2], voice: [4, 10, 2, 7], guide: [4, 10, 2], sym: '9' },
    '7b9': { tones: [0, 4, 7, 10], color: [1], voice: [4, 10, 1, 7], guide: [4, 10, 1], sym: '7b9' },
    m6: { tones: [0, 3, 7, 9], color: [2], voice: [3, 9, 2, 7], guide: [3, 9, 2], sym: 'm6' },
  };
  const chordCache = new Map();
  function chord(sym) {
    if (chordCache.has(sym)) return chordCache.get(sym);
    const [r, q] = sym.split(':');
    const Q = QUAL[q];
    const root = PCN[r];
    const abs = (iv) => iv.map((i) => (root + i) % 12);
    const c = { sym, name: `${r}${Q.sym}`, root, tones: abs(Q.tones), color: abs(Q.color), voice: abs(Q.voice), guide: abs(Q.guide), fifth: (root + Q.tones[2]) % 12, third: (root + Q.tones[1]) % 12 };
    c.all = [...c.tones, ...c.color];
    chordCache.set(sym, c);
    return c;
  }
  /* "F:maj9" one chord on beat 1; "G:m9 C:13" beats 1 and 3; "F:69 G:m9@2 C:13@3" explicit beats (0-based) */
  function parseChords(str) {
    const toks = str.trim().split(/\s+/);
    return toks.map((tok, i) => {
      const [sym, at] = tok.split('@');
      const beat = at != null ? +at : (toks.length === 2 ? i * 2 : i);
      return [beat, chord(sym)];
    });
  }
  /* "A5 3 G5 1 r 2 ..." note and length in swung eighths, from the bar line */
  function parseMel(str) {
    const out = [];
    if (!str) return out;
    const toks = str.trim().split(/\s+/);
    let p = 0;
    for (let i = 0; i < toks.length; i += 2) {
      const d = +toks[i + 1];
      if (toks[i] !== 'r') out.push([p, d, midiOf(toks[i])]);
      p += d;
    }
    return out;
  }
  const F_MAJOR = [5, 7, 9, 10, 0, 2, 4];
  const inSet = (set) => (m) => set.includes(pcOf(m));
  const ladderOf = (pcs, lo, hi) => { const out = []; for (let m = lo; m <= hi; m++) if (pcs.includes(pcOf(m))) out.push(m); return out; };
  /* the chord tone a third (or a fourth) under a melody note, so a second voice always sits in the harmony */
  function thirdBelowIn(m, ch) {
    for (let x = m - 3; x >= m - 5; x--) if (ch.all.includes(pcOf(x))) return x;
    return null;
  }

  /* ------------------------------------------------------------ the tune */

  /* A: bars 1-6 shared by every A section. The hook rises a sixth (C up to A) and steps home; the line then climbs
     chromatically (F, F sharp, G, A, B flat) and, in bar 6, sighs through the minor iv (D to D flat). */
  const A_HEAD = [
    ['F:maj9', 'C5 2 A5 4 G5 1 F5 1'],
    ['D:7b9', 'F#5 2 G5 2 A5 4'],
    ['G:m9', 'Bb5 4 A5 2 G5 2'],
    ['C:13', 'A5 3 G5 1 E5 4'],
    ['F:maj9 F:9', 'C5 2 A5 2 C6 4'],
    ['Bb:maj9 Bb:m6', 'D6 4 Db6 4'],
  ];
  /* the second chorus plays bars 2, 4 and 6 of its middle A with small turns */
  const A_HEAD_VAR = {
    1: 'F#5 1 G5 1 A5 2 C6 2 A5 2',
    3: 'A5 2 C6 2 Bb5 1 G5 1 E5 2',
    5: 'D6 2 F6 2 Db6 2 F6 2',
  };
  const A1_END = [['A:m9 D:7b9', 'C6 3 B5 1 A5 2 F#5 2'], ['G:m9 C:13', 'G5 3 A5 1 Bb5 2 E5 2']];
  const A2_END = [['G:m11 C:13', 'C6 3 Bb5 1 A5 2 G5 2'], ['F:69 F:9', 'A5 4 F5 4']];
  const A3_END = [['G:m11 C:13', 'C6 3 Bb5 1 A5 2 G5 2'], ['F:69 G:m9@2 C:13@3', 'F5 6']];
  /* B: the bridge goes to the IV, through its minor, and walks home down the circle (iii, VI7, ii, V) */
  const B_SEC = [
    ['Bb:maj9', 'F5 2 Bb5 2 D6 4'],
    ['Bb:m6', 'Db6 3 C6 1 Bb5 4'],
    ['A:m9', 'E5 2 A5 2 C6 4'],
    ['D:7b9', 'C6 3 Bb5 1 A5 2 F#5 2'],
    ['G:m9', 'D5 2 G5 2 Bb5 4'],
    ['C:13', 'Bb5 3 A5 1 G5 4'],
    ['A:m9 D:7b9', 'E6 4 D6 2 C6 2'],
    ['G:m9 C:13', 'Bb5 2 A5 2 G5 2 E5 2'],
  ];

  function buildSong() {
    const song = [];
    const add = (ch, mel, extra) => song.push({ chords: parseChords(ch), mel: parseMel(mel), ...extra });
    /* intro: a music box over the Christmas turnaround (I, VI7, ii, V); the bass comes in on bar 3 */
    add('F:69 D:7b9', '', { sec: 'I', n: 0, ch: -1, noBass: true, soft: true, glockLine: parseMel('A6 2 F6 2 F#6 2 D6 2') });
    add('G:m9 C:13', '', { sec: 'I', n: 1, ch: -1, noBass: true, soft: true, glockLine: parseMel('Bb6 2 G6 2 E6 2 C6 2') });
    add('F:69 D:7b9', '', { sec: 'I', n: 2, ch: -1, glockLine: parseMel('A6 2 C7 2 A6 2 F#6 2') });
    add('G:m9 C:13', '', { sec: 'I', n: 3, ch: -1, fill: true, glockLine: parseMel('Bb6 2 A6 2 G6 2 E6 2') });
    for (const chn of [0, 1]) {
      const sec = (name, bars, fn) => bars.forEach(([c, m], n) => add(c, m, { sec: name, n, ch: chn, ...(fn ? fn(n) : {}) }));
      sec('A1', [...A_HEAD, ...A1_END], () => ({ glock: chn === 1 }));
      sec('A2', [...A_HEAD.map(([c, m], n) => [c, chn === 1 && A_HEAD_VAR[n] ? A_HEAD_VAR[n] : m]), ...A2_END], (n) => ({ fill: n === 7 }));
      sec('B', B_SEC, (n) => ({ stop: chn === 1 && n < 4, fill: n === 7 }));
      sec('A3', [...A_HEAD, ...A3_END], (n) => ({ glock: chn === 1, fill: n === 7 }));
    }
    return song;
  }
  const SONG = buildSong();
  const LOOP_START = 4;
  const CHORUS_TOP = [4, 36];
  const chordAtBeat = (bar, beat) => { let c = bar.chords[0][1]; for (const [b, ch] of bar.chords) if (b <= beat) c = ch; return c; };
  const changesAt = (bar) => bar.chords.map(([b]) => b);

  /* ------------------------------------------------------------ arrangement per place and time of day */

  const SCENES = {
    start: { energy: 0.55, strings: 0.3, glock: 0, sleigh: 1, drums: 0.85, ep: 3100, verb: 0.9, gesture: false },
    birch: { energy: 0.56, strings: 0.3, glock: 0, sleigh: 1, drums: 0.85, ep: 3100, verb: 0.9, gesture: false },
    lake: { energy: 0.6, strings: 0.35, glock: 0.25, sleigh: 0.9, drums: 0.9, ep: 2900, verb: 1, gesture: false },
    mountain: { energy: 0.66, strings: 0.35, glock: 0.45, sleigh: 1, drums: 1, ep: 3300, verb: 1, gesture: false },
    village: { energy: 0.56, strings: 0.75, glock: 0.15, sleigh: 0.7, drums: 0.8, ep: 2300, verb: 1.15, gesture: false },
    shore: { energy: 0.62, strings: 0.85, glock: 0.3, sleigh: 0.85, drums: 0.9, ep: 2500, verb: 1.1, gesture: false },
    street: { energy: 0.78, strings: 1, glock: 0.35, sleigh: 1, drums: 1, ep: 2700, verb: 1.05, gesture: false },
    gallery: { energy: 0.62, strings: 0.8, glock: 0.2, sleigh: 0.45, drums: 0.75, ep: 2400, verb: 1.2, gesture: false },
    end: { energy: 0.5, strings: 0.7, glock: 0.15, sleigh: 0.4, drums: 0.7, ep: 2300, verb: 1.2, gesture: false },
  };
  const PHASE_OFFSET = { listen: -0.18, travel: 0.16, peak: 0.34, after: 0.14, hush: -0.3 };
  const LADDER = 12;

  /* ------------------------------------------------------------ small DSP helpers for the drum buffers */

  function biquad(d, type, f, Q, sr) {
    const w = (2 * Math.PI * f) / sr;
    const al = Math.sin(w) / (2 * Q);
    const cw = Math.cos(w);
    let b0;
    let b1;
    let b2;
    if (type === 'lp') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2; }
    else if (type === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2; }
    else { b0 = al; b1 = 0; b2 = -al; }
    const a0 = 1 + al;
    const a1 = -2 * cw;
    const a2 = 1 - al;
    let x1 = 0; let x2 = 0; let y1 = 0; let y2 = 0;
    for (let i = 0; i < d.length; i++) {
      const x = d[i];
      const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      d[i] = y;
    }
    return d;
  }
  function normalize(d, peak) {
    let m = 0;
    for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i]));
    if (m > 0) for (let i = 0; i < d.length; i++) d[i] *= peak / m;
    return d;
  }
  function gauss() { let u = 0; let v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  /* a damped sine added into d from sample i0 (recurrence, no Math.sin per sample) */
  function ring(d, i0, f, amp, tau, sr) {
    const w = (2 * Math.PI * f) / sr;
    const r = Math.exp(-1 / (tau * sr));
    const c2 = 2 * r * Math.cos(w);
    const r2 = r * r;
    const n = Math.min(d.length - i0, Math.ceil(tau * 7 * sr));
    let y2 = 0;
    let y1 = amp * r * Math.sin(w);
    for (let i = 1; i < n; i++) {
      d[i0 + i] += y1;
      const y = c2 * y1 - r2 * y2;
      y2 = y1; y1 = y;
    }
  }

  /* ------------------------------------------------------------ the engine (one per AudioContext: live, or offline for tests) */

  class Engine {
    constructor(ctx, { offline = false } = {}) {
      this.ctx = ctx;
      this.offline = offline;
      this.sr = ctx.sampleRate;
      this.kb = new Map(); /* Karplus-Strong buffers, by kind and pitch */
      this.buf = {};
      this.log = null;
      this.sceneId = 'birch';
      this.scene = SCENES.birch;
      this.phase = 'listen';
      this.phaseUntil = 0;
      this.phaseNext = 'listen';
      this.prog = { step: -1, k: 0, lastT: -99, lastNoteT: -99 };
      this.seq = { running: false, hold: false, bar: 0, beat: 0, barT: 0, t: 0, started: false };
      this.hist = [];
      this.barE = 0.5;
      this.lastBass = 41;
      this.lastVoicing = null;
      this.lastGuide = null;
      this.jump = null;
      this.feature = null;
      this.peaks = 0;
      this.resumeAt = 0;
      this.buildGraph();
      this.makeDrumBuffers(offline);
    }

    /* --------------------------------------------------------- graph */

    buildGraph() {
      const c = this.ctx;
      const gain = (v = 1) => { const n = c.createGain(); n.gain.value = v; return n; };
      const filt = (type, f, Q = 0.7) => { const n = c.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = Q; return n; };
      const peakEQ = (f, Q, dB) => { const n = filt('peaking', f, Q); n.gain.value = dB; return n; };
      this.gainNode = gain;

      /* master: fade, rumble filter, gentle glue compressor, safety limiter */
      this.master = gain(0);
      const hp = filt('highpass', 30, 0.6);
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 2; comp.attack.value = 0.02; comp.release.value = 0.3;
      const lim = c.createDynamicsCompressor();
      lim.threshold.value = -4; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12;
      const out = gain(0.92);
      this.master.connect(hp).connect(comp).connect(lim).connect(out).connect(c.destination);

      /* a light room: generated impulse response, darker as it decays */
      this.verb = c.createConvolver();
      this.verb.buffer = this.makeIR();
      this.verbIn = gain(1);
      this.verbOut = gain(0.5);
      this.verbIn.connect(this.verb).connect(this.verbOut).connect(this.master);

      /* the band (sequenced) goes through the duck; the moments (cues) and the gesture sounds do not */
      this.duckDry = gain(1);
      this.duckWet = gain(1);
      this.sceneWet = gain(this.scene.verb);
      const bandDry = gain(1);
      const bandWet = gain(1);
      bandDry.connect(this.duckDry).connect(this.master);
      bandWet.connect(this.duckWet).connect(this.sceneWet).connect(this.verbIn);
      const cueDry = gain(1);
      const cueWet = gain(1);
      cueDry.connect(this.master);
      cueWet.connect(this.verbIn);

      /* the electric piano's slow tremolo and the strings' vibrato, shared */
      this.lfos = [];
      const lfo = (hz, depth) => { const o = c.createOscillator(); o.frequency.value = hz; const g = gain(depth); o.connect(g); o.start(); this.lfos.push(o); return g; };
      this.vib = lfo(5.1, 6);
      const trem = lfo(4.4, 0.07);
      const motor = lfo(5.2, 0.14);

      const mk = (dry, wet, band) => {
        const bus = (vol, send, pan, chain = []) => {
          const input = gain(vol);
          let last = input;
          for (const n of chain) { last.connect(n); last = n; }
          const p = c.createStereoPanner ? c.createStereoPanner() : null;
          if (p) { p.pan.value = pan; last.connect(p); last = p; }
          last.connect(dry);
          const s = gain(send);
          last.connect(s);
          s.connect(wet);
          input.chain = chain;
          return input;
        };
        const epLP = filt('lowpass', band ? this.scene.ep : 3000, 0.4);
        const epTrem = gain(band ? 0.93 : 1);
        if (band) trem.connect(epTrem.gain);
        const strLevel = gain(band ? this.scene.strings : 1);
        const vibTrem = gain(0.86);
        motor.connect(vibTrem.gain);
        const lvl = band ? BAND_LEVEL : 1;
        const b = {
          vib: bus(0.62 * lvl, 0.3, -0.04, [vibTrem]),
          cel: bus(0.5 * lvl, 0.32, 0.12),
          glock: bus(0.32 * lvl, 0.4, 0.26),
          ep: bus(0.45 * lvl, 0.22, -0.12, [filt('highpass', 150, 0.6), epLP, epTrem]),
          bass: bus(0.85 * lvl, 0.05, 0, [filt('highpass', 48, 0.7), peakEQ(720, 1, 4), filt('lowpass', 1600, 0.5)]),
          drums: bus(0.37 * lvl, 0.16, -0.2, [filt('highpass', 260, 0.6)]),
          sleigh: bus(0.46 * lvl, 0.2, 0.32, [filt('lowpass', 8200, 0.5)]),
          strings: bus(0.5 * lvl, 0.42, 0, [filt('highpass', 190, 0.6), filt('lowpass', 1900, 0.35), strLevel]),
          harp: bus(0.5 * lvl, 0.3, -0.22),
        };
        b.epLP = epLP;
        b.strLevel = strLevel;
        return b;
      };
      this.band = mk(bandDry, bandWet, true);
      this.cue = mk(cueDry, cueWet, false);

      /* gesture sounds (the old API) */
      this.sfx = gain(0.5);
      this.sfx.connect(this.master);
      const sfxSend = gain(0.3);
      this.sfx.connect(sfxSend).connect(this.verbIn);

      /* electric piano tone: a few soft harmonics, filtered per note */
      const real = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0]);
      const imag = new Float32Array([0, 1, 0.42, 0.16, 0.08, 0.035, 0.02, 0.01]);
      this.epWave = c.createPeriodicWave(real, imag);

      const n = c.createBuffer(1, this.sr * 2, this.sr);
      const nd = n.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      this.noise = n;
    }

    makeIR() {
      const c = this.ctx;
      const sr = this.sr;
      const len = Math.floor(sr * 1.7);
      const ir = c.createBuffer(2, len, sr);
      const pre = Math.floor(sr * 0.013);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        let lp = 0;
        for (let i = pre; i < len; i++) {
          const t = (i - pre) / sr;
          const a = 0.8 - 0.62 * Math.min(1, t / 1.3);
          lp += a * ((Math.random() * 2 - 1) - lp);
          d[i] = lp * Math.exp(-t / 0.24) * Math.min(1, t / 0.008);
        }
        for (const [ms, g] of [[8, 0.42], [15, 0.3], [23, 0.26], [34, 0.2], [47, 0.15], [61, 0.1]]) {
          const k = pre + Math.floor(((ms + ch * 2.7) * sr) / 1000);
          d[k] += g * (ch ? -0.9 : 1);
        }
      }
      return ir;
    }

    /* brushes, hi-hat foot, sleigh bells: computed once, off the critical path when live */
    makeDrumBuffers(sync) {
      const sr = this.sr;
      const mk = (sec) => this.ctx.createBuffer(1, Math.ceil(sec * sr), sr);
      const jobs = [
        () => {
          const b = mk(0.24);
          const d = b.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
          biquad(d, 'bp', 2900, 0.65, sr);
          biquad(d, 'hp', 700, 0.7, sr);
          for (let i = 0; i < d.length; i++) {
            const t = i / sr;
            d[i] = d[i] * (1 - Math.exp(-t / 0.0016)) * (0.72 * Math.exp(-t / 0.042) + 0.28 * Math.exp(-t / 0.11)) + 0.18 * Math.sin(2 * Math.PI * 196 * t) * Math.exp(-t / 0.035) * (1 - Math.exp(-t / 0.002));
          }
          this.buf.tap = b;
          normalize(d, 0.55);
        },
        () => {
          for (const k of [0, 1]) {
            const b = mk(SPB * 2 + 0.3);
            const d = b.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
            biquad(d, 'bp', 1700 + k * 400, 0.5, sr);
            biquad(d, 'hp', 520, 0.7, sr);
            const ph = Math.random() * 6;
            for (let i = 0; i < d.length; i++) {
              const t = i / sr;
              const x = t / SPB;
              const env = x < 1 ? 0.22 + 0.78 * Math.pow(x, 1.6) : Math.max(0, 1 - (x - 1) * 0.62) * (x > 2 ? Math.max(0, 1 - (t - 2 * SPB) / 0.3) : 1);
              d[i] *= env * (0.78 + 0.22 * Math.sin(2 * Math.PI * 10.5 * t + ph));
            }
            normalize(d, 0.5);
            this.buf[`sweep${k}`] = b;
          }
        },
        () => {
          const b = mk(0.09);
          const d = b.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
          biquad(d, 'hp', 6400, 0.8, sr);
          for (let i = 0; i < d.length; i++) { const t = i / sr; d[i] *= (1 - Math.exp(-t / 0.0007)) * Math.exp(-t / 0.013); }
          normalize(d, 0.5);
          this.buf.chick = b;
        },
        ...[0, 1, 2].map((k) => () => {
          const b = mk(0.42);
          const d = b.getChannelData(0);
          const hit = (t0, count, spread) => {
            for (let j = 0; j < count; j++) {
              const t = t0 + Math.abs(gauss()) * spread;
              const i0 = Math.floor(t * sr);
              const f0 = 2500 + Math.random() * 2700;
              const a = 0.4 + Math.random() * 0.6;
              ring(d, i0, f0, a, 0.02 + Math.random() * 0.03, sr);
              ring(d, i0, f0 * 1.47, a * 0.55, 0.014 + Math.random() * 0.02, sr);
              ring(d, i0, f0 * 2.09, a * 0.3, 0.01 + Math.random() * 0.012, sr);
            }
          };
          hit(0.004, 20, 0.035 + k * 0.006);
          hit(0.105 + k * 0.012, 7, 0.03);
          biquad(d, 'lp', 8500, 0.6, sr);
          normalize(d, 0.5);
          this.buf[`sleigh${k}`] = b;
        }),
        () => {
          const b = mk(1.0);
          const d = b.getChannelData(0);
          for (let j = 0; j < 90; j++) {
            const t = Math.pow(Math.random(), 0.7) * 0.8;
            const env = (t < 0.75 ? 0.25 + 0.75 * Math.pow(t / 0.75, 1.4) : 1) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 12 * t));
            const f0 = 2500 + Math.random() * 2800;
            const a = env * (0.4 + Math.random() * 0.6);
            const i0 = Math.floor(t * sr);
            ring(d, i0, f0, a, 0.02 + Math.random() * 0.03, sr);
            ring(d, i0, f0 * 1.47, a * 0.5, 0.015 + Math.random() * 0.02, sr);
          }
          biquad(d, 'lp', 8500, 0.6, sr);
          normalize(d, 0.5);
          this.buf.roll = b;
        },
      ];
      if (sync) { jobs.forEach((j) => j()); return; }
      const next = () => { const j = jobs.shift(); if (!j) return; j(); setTimeout(next, 0); };
      setTimeout(next, 0);
    }

    /* Karplus-Strong string with fractional-delay tuning: kind 'bass' (dark, woody) or 'harp' (bright) */
    ks(kind, freq) {
      const key = `${kind}${Math.round(freq * 10)}`;
      const hit = this.kb.get(key);
      if (hit) return hit;
      const sr = this.sr;
      const bass = kind === 'bass';
      const len = bass ? 1.5 : clamp(0.6 + 420 / freq, 0.7, 2.4);
      const t60 = bass ? 1.7 : len * 0.95;
      const n = Math.floor(sr * len);
      const buf = this.ctx.createBuffer(1, n, sr);
      const d = buf.getChannelData(0);
      /* loop filter: a one-pole lowpass (the bass loses its upper partials fast, like a gut-and-steel upright
         plucked with the finger; the harp keeps them longer). Its phase delay at the fundamental is subtracted
         from the period and the rest is a fractional allpass, so every string is in tune. */
      const rho = bass ? 0.3 : 0.18;
      const w = (2 * Math.PI * freq) / sr;
      const lpDelay = Math.atan2(rho * Math.sin(w), 1 - rho * Math.cos(w)) / w;
      const P = sr / freq - lpDelay;
      let N = Math.floor(P);
      let frac = P - N;
      if (frac < 0.15) { N -= 1; frac += 1; }
      const C = (1 - frac) / (1 + frac);
      const lpGain = Math.hypot(1 - rho * Math.cos(w), rho * Math.sin(w)) / (1 - rho);
      const g = Math.pow(10, -3 / (t60 * freq)) * lpGain;
      if (bass) {
        /* a round finger pluck: a smooth bump where the finger pulls the string, a touch of noise for the skin */
        const at = 0.22;
        for (let i = 0; i < N; i++) {
          const x = i / N;
          const bump = x < at ? Math.sin((Math.PI / 2) * (x / at)) : Math.cos((Math.PI / 2) * ((x - at) / (1 - at)));
          d[i] = bump * bump;
        }
        let lpn = 0;
        for (let i = 0; i < N; i++) { lpn += 0.3 * ((Math.random() * 2 - 1) - lpn); d[i] += lpn * 0.5; }
      } else {
        let lp = 0;
        for (let i = 0; i < N; i++) { lp += 0.62 * ((Math.random() * 2 - 1) - lp); d[i] = lp; }
        const pp = Math.max(1, Math.round(N * 0.13));
        for (let i = N - 1; i >= pp; i--) d[i] -= d[i - pp];
      }
      let mean = 0;
      for (let i = 0; i < N; i++) mean += d[i];
      mean /= N;
      for (let i = 0; i < N; i++) d[i] -= mean;
      let lpy = 0;
      let apx = 0;
      let apy = 0;
      for (let i = N; i < n; i++) {
        lpy = (1 - rho) * d[i - N] + rho * lpy;
        const x = lpy * g;
        const y = C * x + apx - C * apy;
        apx = x;
        apy = y;
        d[i] = y;
      }
      const fade = Math.floor(sr * 0.03);
      for (let i = n - fade; i < n; i++) d[i] *= (n - i) / fade;
      normalize(d, 0.5);
      this.kb.set(key, buf);
      return buf;
    }

    /* --------------------------------------------------------- voices (t is AudioContext time) */

    env(g, t, peak, attack, tau, end, rel) {
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + attack);
      g.gain.setTargetAtTime(0, t + attack, tau);
      if (end != null) g.gain.setTargetAtTime(0, Math.max(end, t + attack), rel);
    }

    /* celesta: a sweet struck bar; partial 2 and 4 fade fast, the damper closes at the note's end */
    cel(m, t, dur, vel, out) {
      const c = this.ctx;
      const f = mtof(m);
      const k = Math.pow(2, -(m - 72) / 18);
      const tau = clamp(0.62 * k, 0.14, 0.95);
      const end = t + Math.max(0.09, dur);
      for (const [r, a, tm] of [[1, 1, 1], [2, 0.17, 0.4], [4, 0.07, 0.12]]) {
        if (f * r > 16000) continue;
        const o = c.createOscillator();
        o.frequency.value = f * r;
        const g = c.createGain();
        this.env(g, t, vel * a * 0.5, 0.004, tau * tm, end, 0.1);
        o.connect(g).connect(out);
        o.start(t);
        o.stop(end + 0.8);
      }
    }

    /* vibraphone: the singing lead. A warm fundamental, the bar's fourth partial for the strike, and a pedal that
       lets each note ring into the next */
    vibes(m, t, dur, vel, out) {
      const c = this.ctx;
      const f = mtof(m);
      const k = Math.pow(2, -(m - 72) / 24);
      const tau = clamp(1.9 * k, 0.9, 2.6);
      const end = t + Math.max(0.14, dur) + 0.1;
      for (const [r, a, tm] of [[1, 1, 1], [4, 0.2, 0.16], [9.9, 0.04, 0.05]]) {
        if (f * r > 16000) continue;
        const o = c.createOscillator();
        o.frequency.value = f * r;
        const g = c.createGain();
        this.env(g, t, vel * a * 0.44, 0.003, tau * tm, end, 0.24);
        o.connect(g).connect(out);
        o.start(t);
        o.stop(end + 1.7);
      }
    }

    /* glockenspiel: brighter, inharmonic, rings on */
    glock(m, t, vel, out, ringMul = 1) {
      const c = this.ctx;
      const f = mtof(m);
      const k = Math.pow(2, -(m - 72) / 24);
      const tau = clamp(1.1 * k, 0.3, 1.5) * ringMul;
      for (const [r, a, tm] of [[1, 1, 1], [2.76, 0.3, 0.28], [5.4, 0.13, 0.1]]) {
        if (f * r > 17000) continue;
        const o = c.createOscillator();
        o.frequency.value = f * r;
        const g = c.createGain();
        this.env(g, t, vel * a * 0.5, 0.002, tau * tm);
        o.connect(g).connect(out);
        o.start(t);
        o.stop(t + tau * tm * 7 + 0.05);
      }
    }

    /* electric piano: soft harmonics through a per-note filter that closes after the attack */
    ep(m, t, dur, vel, out) {
      const c = this.ctx;
      const f = mtof(m);
      const o = c.createOscillator();
      o.setPeriodicWave(this.epWave);
      o.frequency.value = f;
      o.detune.value = (Math.random() - 0.5) * 5;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = 0.5;
      lp.frequency.setValueAtTime(Math.min(12000, f * (3 + 7 * vel)), t);
      lp.frequency.setTargetAtTime(f * 2.2 + 300, t + 0.01, 0.2);
      const g = c.createGain();
      const end = t + Math.max(0.12, dur);
      this.env(g, t, vel * 0.22, 0.005, 1.1, end, 0.07);
      o.connect(lp).connect(g).connect(out);
      o.start(t);
      o.stop(end + 0.5);
    }

    /* soft string section voice: two detuned saws, slow bow */
    str(m, t, dur, vel, out, attack = 0.5) {
      const c = this.ctx;
      const f = mtof(m);
      const g = c.createGain();
      const end = t + Math.max(attack + 0.1, dur);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel * 0.07, t + attack);
      g.gain.setTargetAtTime(0, end, 0.32);
      g.connect(out);
      for (const det of [-7, 7]) {
        const o = c.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = f;
        o.detune.value = det;
        this.vib.connect(o.detune);
        o.onended = () => { try { this.vib.disconnect(o.detune); } catch (e) { /* already gone */ } };
        o.connect(g);
        o.start(t);
        o.stop(end + 2);
      }
    }

    bass(m, t, dur, vel, out) {
      const c = this.ctx;
      const s = c.createBufferSource();
      s.buffer = this.ks('bass', mtof(m));
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel, t + 0.004);
      g.gain.setTargetAtTime(0, t + dur, 0.035);
      s.connect(g).connect(out);
      s.start(t);
      s.stop(t + dur + 0.3);
    }

    harp(m, t, vel, out, pan) {
      const c = this.ctx;
      const s = c.createBufferSource();
      s.buffer = this.ks('harp', mtof(m));
      const g = c.createGain();
      g.gain.value = vel;
      let last = s.connect(g);
      if (pan != null && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); last = last.connect(p); }
      last.connect(out);
      s.start(Math.max(t, c.currentTime));
    }

    hit(name, t, vel, out, rate = 1) {
      const b = this.buf[name];
      if (!b) return;
      const c = this.ctx;
      const s = c.createBufferSource();
      s.buffer = b;
      s.playbackRate.value = rate;
      const g = c.createGain();
      g.gain.value = vel;
      s.connect(g).connect(out);
      s.start(Math.max(t, c.currentTime));
    }

    /* rootless voicing, moved as little as possible from the last one */
    voicing(ch, prev, lo = 53, hi = 74) {
      const pcs = ch.voice;
      let best = null;
      let bestScore = Infinity;
      for (let rot = 0; rot < pcs.length; rot++) {
        const order = pcs.slice(rot).concat(pcs.slice(0, rot));
        for (let base = lo; base < lo + 12; base++) {
          if (pcOf(base) !== order[0]) continue;
          const v = [base];
          for (let i = 1; i < order.length; i++) { let n = v[i - 1] + 1; while (pcOf(n) !== order[i]) n++; v.push(n); }
          if (v[v.length - 1] > hi) continue;
          const center = v.reduce((a, b) => a + b, 0) / v.length;
          let score = Math.abs(center - 62.5) * 0.6;
          if (prev && prev.length === v.length) for (let i = 0; i < v.length; i++) score += Math.abs(v[i] - prev[i]);
          if (score < bestScore) { bestScore = score; best = v; }
        }
      }
      return best;
    }
    /* three string voices on the guide tones (third, seventh, colour), close and voice-led, around G4 */
    guide(ch, prev) {
      const [a, b, c] = ch.guide;
      let best = null;
      let bestScore = Infinity;
      for (const order of [[a, b, c], [a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a]]) {
        for (let base = 58; base < 70; base++) {
          if (pcOf(base) !== order[0]) continue;
          const v = [base];
          for (let i = 1; i < 3; i++) { let n = v[i - 1] + 1; while (pcOf(n) !== order[i]) n++; v.push(n); }
          if (v[2] > 81) continue;
          let score = Math.abs(v[1] - 67) * 0.5 + (v[2] - v[0]) * 0.15;
          if (prev) for (let i = 0; i < 3; i++) score += Math.abs(v[i] - prev[i]);
          if (score < bestScore) { bestScore = score; best = v; }
        }
      }
      return best || [67];
    }

    /* --------------------------------------------------------- the band */

    startMusic(at, fromBar) {
      const s = this.seq;
      if (fromBar != null) s.bar = fromBar;
      s.running = true;
      s.beat = 0;
      s.barT = at;
      s.t = at;
      s.started = true;
    }

    phaseAt(t) {
      if (this.phaseUntil && t >= this.phaseUntil) { this.phase = this.phaseNext; this.phaseUntil = 0; }
      return this.phase;
    }
    setPhase(p, until = 0, next = null) { this.phase = p; this.phaseUntil = until; this.phaseNext = next || (this.scene.gesture ? 'listen' : 'after'); }
    energyTarget(t) {
      const ph = this.phaseAt(t);
      let off = PHASE_OFFSET[ph] || 0;
      if (ph === 'listen') off += 0.3 * this.prog.k;
      return clamp(this.scene.energy + off, 0.2, 1);
    }

    peekNext(bi, barT) {
      if (this.jump && Math.abs(barT + BAR - this.jump.at) < 0.003) return this.jump.to;
      return bi + 1 >= SONG.length ? LOOP_START : bi + 1;
    }

    tick() {
      const s = this.seq;
      const c = this.ctx;
      const now = c.currentTime;
      if (s.hold) {
        if (this.resumeAt && now >= this.resumeAt - LOOKAHEAD) {
          s.hold = false;
          this.startMusic(this.resumeAt, CHORUS_TOP[0]);
          this.resumeAt = 0;
        } else return;
      }
      if (!s.running) return;
      /* fell behind (the tab was throttled): skip ahead on the grid instead of playing a burst */
      if (s.t < now - 0.04) {
        while (s.t < now + 0.03) this.advance();
      }
      let guard = 0;
      while (s.t < now + LOOKAHEAD && guard++ < 16) {
        try { this.scheduleBeat(s.bar, s.beat, s.barT); } catch (err) { if (!this.warned) { this.warned = true; console.error(err); } }
        this.advance();
      }
    }
    /* one beat on; at the bar line, take the jump to the top of the tune if a reveal asked for it */
    advance() {
      const s = this.seq;
      s.beat++;
      if (s.beat === 4) {
        s.beat = 0;
        s.bar = this.peekNext(s.bar, s.barT);
        s.barT += BAR;
        if (this.jump && Math.abs(s.barT - this.jump.at) < 0.003) { this.jump = null; this.landed = s.barT; }
        if (this.jump && this.jump.at < s.barT) this.jump = null;
      }
      s.t = s.barT + s.beat * SPB;
    }

    chordAt(t) {
      for (let i = this.hist.length - 1; i >= 0; i--) {
        const h = this.hist[i];
        if (t >= h.barT - 0.001) return chordAtBeat(SONG[h.bi], clamp(Math.floor((t - h.barT) / SPB), 0, 3));
      }
      return chord('F:maj9');
    }
    running() { return this.seq.running && !this.seq.hold && this.hist.length > 0; }
    /* the next 16th on the band's grid, if it is close; otherwise now */
    quant(t, grid = SPB / 4, max = 0.15) {
      if (!this.running()) return t;
      const o = this.seq.barT;
      const q = o + Math.ceil((t - o) / grid - 1e-6) * grid;
      return q - t <= max ? q : t;
    }

    onBar(bi, barT) {
      const bar = SONG[bi];
      this.hist.push({ bi, barT });
      if (this.hist.length > 6) this.hist.shift();
      const target = this.energyTarget(barT);
      if (this.landed != null && Math.abs(this.landed - barT) < 0.003) this.barE = Math.max(target, 0.9);
      else this.barE += (target - this.barE) * 0.55;
      if (bar.soft) this.barE = Math.min(this.barE, 0.5);
      const E = this.barE;
      this.melMode = E < 0.47 ? 'skeleton' : 'full';
      this.feat = this.feature && barT >= this.feature.from - 0.003 && barT < this.feature.until ? this.feature.kind : null;
      this.comp = this.compFor(bar, bi, E);
      if (this.log) this.log.push({ type: 'bar', t: barT, bi, sec: bar.sec, n: bar.n, ch: bar.ch, chords: bar.chords.map(([b, c]) => [b, c.name]), E: +E.toFixed(2), phase: this.phase, scene: this.sceneId, feat: this.feat });
    }

    compFor(bar, bi, E) {
      const changes = changesAt(bar);
      let pat;
      if (bar.stop) pat = [[0, 2, 1]];
      else if (E < 0.5) pat = changes.map((b, i) => [b * 2, ((changes[i + 1] ?? 4) - b) * 2, 0.78]);
      else if (changes.length === 1) {
        const pal = [
          [[0, 3, 0.9], [3, 3, 0.74]],
          [[1, 2, 0.84], [5, 3, 0.8]],
          [[0, 2, 0.86], [3, 1, 0.7], [6, 2, 0.78]],
          [[0, 4, 0.86], [5, 3, 0.74]],
        ];
        pat = pal[Math.floor(hash(bi * 7 + bar.ch) * pal.length)];
      } else {
        const pal = [
          [[0, 3, 0.9], [4, 3, 0.84]],
          [[0, 3, 0.86], [3, 4, 0.84]],
          [[0, 4, 0.86], [4, 2, 0.8], [7, 1, 0.66]],
        ];
        pat = pal[Math.floor(hash(bi * 11 + bar.ch) * pal.length)];
      }
      /* an off-beat hit anticipates the chord of the next beat (inside the bar); every chord change gets struck */
      const hits = pat.map(([p, d, v]) => ({ p, d, v }));
      const assign = (h) => {
        const beatOf = h.p === 7 ? 3 : Math.min(3, Math.floor((h.p + 1) / 2));
        h.chord = chordAtBeat(bar, beatOf);
        const nextChange = changes.find((b) => b > beatOf);
        if (nextChange != null) h.d = Math.min(h.d, nextChange * 2 - h.p);
        h.d = Math.max(1, Math.min(h.d, 8 - h.p));
      };
      hits.forEach(assign);
      for (const b of changes) {
        const ch = chordAtBeat(bar, b);
        if (!hits.some((h) => h.chord === ch && h.p >= b * 2 - 1 && h.p <= b * 2 + 1)) { const h = { p: b * 2, d: 2, v: 0.78 }; assign(h); hits.push(h); }
      }
      hits.sort((a, b) => a.p - b.p);
      return hits;
    }

    scheduleBeat(bi, beat, barT) {
      const bar = SONG[bi];
      if (beat === 0) this.onBar(bi, barT);
      const E = this.barE;
      const B = this.band;
      const t = barT + beat * SPB;
      const preLanding = this.jump && this.jump.at > barT + 0.001 && this.jump.at - barT <= BAR + 0.003;
      const jit = (ms) => (Math.random() - 0.5) * ms * 0.001;
      const lo = beat * 2;
      const hi = beat * 2 + 2;
      const feat = this.feat;

      /* melody */
      if (!preLanding) {
        for (const [p, d, m] of bar.mel) {
          if (p < lo || p >= hi) continue;
          if (this.melMode === 'skeleton' && !(p === 0 || d >= 3)) continue;
          const tt = barT + posT(p) + jit(8);
          const dur = barT + posT(p + d) - tt - 0.03;
          let v = (p % 2 ? 0.5 : 0.6) + (d >= 3 ? 0.07 : 0) + (E - 0.6) * 0.15;
          if (this.melMode === 'skeleton') v *= 0.62;
          this.vibes(m, tt, dur, v, B.vib);
          if (this.melMode === 'full') this.cel(m + 12, tt + 0.004, dur, v * 0.42, B.cel);
          const gl = (bar.glock ? this.scene.glock : 0) + (feat === 'glock' ? 0.55 : 0);
          if (gl > 0.02) this.glock(m + 12, tt, v * 0.55 * Math.min(1, gl), B.glock, 0.6);
          if (feat === 'harp') this.harp(m - 12, tt, v * 0.55, B.harp);
          if (feat === 'thirds') { const h3 = thirdBelowIn(m, chordAtBeat(bar, Math.floor(p / 2))); if (h3) this.vibes(h3, tt + 0.006, dur, v * 0.55, B.vib); }
          if (feat === 'strings' && d >= 2) this.str(m, tt, dur, 0.85, B.strings, 0.12);
          if (this.log) this.log.push({ type: 'mel', t: tt, bi, p, d, m, name: nameOf(m), chord: chordAtBeat(bar, Math.floor(p / 2)).name, chordTones: chordAtBeat(bar, Math.floor(p / 2)).tones, mode: this.melMode });
        }
        if (bar.glockLine) for (const [p, d, m] of bar.glockLine) if (p >= lo && p < hi) this.glock(m, barT + posT(p), 0.42, B.glock, 0.8);
      }
      /* a bell toll at the top of each chorus and of the bridge */
      if (beat === 0 && bar.n === 0 && (bar.sec === 'A1' || bar.sec === 'B')) {
        const root = bar.chords[0][1].root;
        let m = 77;
        while (pcOf(m) !== root) m--;
        [m, m + 7].forEach((x, i) => this.glock(x, t + i * 0.012, 0.3 - i * 0.08, B.glock, 1.8));
      }
      /* sparkles after a morning reveal: three falling chord tones on beat 4 of every other bar */
      if (feat === 'sparkle' && beat === 3 && bar.n % 2 === 1) {
        const ch = chordAtBeat(bar, 3);
        const tones = ladderOf(ch.all, 86, 98).reverse().slice(0, 3);
        tones.forEach((m, i) => this.glock(m, t + i * (SPB / 3), 0.32 - i * 0.06, B.glock, 0.7));
      }

      /* comping */
      for (const h of this.comp) {
        if (h.p < lo || h.p >= hi) continue;
        if (h.p === 0 && this.anticipated === barT) continue;
        if (preLanding && h.p >= 6) continue;
        const v = h.v * (0.55 + 0.4 * E);
        this.epChord(h.chord, barT + posT(h.p) + jit(10), barT + posT(h.p + h.d) - 0.04, v, B.ep, h.d >= 6 ? 'pad' : 'hit');
      }
      /* push the next bar's chord on the and of 4 when the band is lively */
      if (beat === 3 && E >= 0.8 && !bar.stop && !preLanding) {
        const nbi = this.peekNext(bi, barT);
        const nbar = SONG[nbi];
        if (!nbar.stop && hash(nbi * 13 + bi) < 0.45 && !this.comp.some((h) => h.p === 7)) {
          const tt = barT + posT(7);
          this.epChord(nbar.chords[0][1], tt, barT + BAR + posT(3) - 0.04, 0.7 * (0.55 + 0.4 * E), B.ep, 'hit');
          this.anticipated = barT + BAR;
        }
      }

      /* bass */
      this.bassBeat(bar, bi, beat, barT, E, preLanding);

      /* strings: the guide tones of each chord, voice-led */
      if (this.scene.strings > 0.02 || feat === 'strings') {
        const changes = changesAt(bar);
        if (changes.includes(beat)) {
          const ch = chordAtBeat(bar, beat);
          const v = this.guide(ch, this.lastGuide);
          this.lastGuide = v;
          const next = changes.find((b) => b > beat) ?? 4;
          const dur = (next - beat) * SPB + 0.12;
          for (const m of v) this.str(m, t, dur, feat === 'strings' ? 0.8 : 0.62, B.strings, 0.45);
        }
      }

      /* brushes and sleigh bells */
      this.drumsBeat(bar, bi, beat, t, E);
    }

    epChord(ch, t, end, v, out, kind) {
      const vo = this.voicing(ch, this.lastVoicing);
      this.lastVoicing = vo;
      vo.forEach((m, i) => this.ep(m, t + i * 0.004, end - t, v * (i === vo.length - 1 ? 1.05 : 0.92), out));
      if (this.log) this.log.push({ type: 'comp', t, chord: ch.name, notes: vo.map(nameOf), kind });
    }

    bassBeat(bar, bi, beat, barT, E, preLanding) {
      if (bar.noBass) return;
      const B = this.band;
      const t = barT + beat * SPB + (Math.random() - 0.5) * 0.006;
      const two = E < 0.55 || bar.stop;
      const ch = chordAtBeat(bar, beat);
      const changes = changesAt(bar);
      const isStart = changes.includes(beat);
      const near = (pc, from) => { let best = null; for (let m = 31; m <= 50; m++) if (pcOf(m) === pc && (best == null || Math.abs(m - from) < Math.abs(best - from))) best = m; return best; };
      /* the chord on the next beat, possibly in the next bar */
      const nbi = this.peekNext(bi, barT);
      const nextCh = beat < 3 ? chordAtBeat(bar, beat + 1) : SONG[nbi].chords[0][1];
      const nextChanges = beat < 3 ? changes.includes(beat + 1) : true;
      let m;
      let dur;
      if (two) {
        if (bar.stop && beat > 0) return;
        if (beat % 2 === 1) {
          /* a light pickup on the and of 4 into the next chord */
          if (beat === 3 && !bar.stop && hash(bi * 5) < 0.4) {
            const tgt = near(nextCh.root, this.lastBass);
            const pm = tgt + (tgt > this.lastBass ? -1 : 1);
            this.bass(clamp(pm, 31, 50), barT + posT(7), SPB * 0.32, 0.5, B.bass);
            this.lastBass = clamp(pm, 31, 50);
          }
          return;
        }
        m = isStart ? near(ch.root, this.lastBass) : near(ch.fifth, this.lastBass);
        dur = bar.stop ? SPB * 3.6 : SPB * 1.9;
      } else {
        dur = SPB * 0.9;
        if (isStart) m = near(ch.root, this.lastBass);
        else if (nextChanges) {
          const tgt = near(nextCh.root, this.lastBass);
          if (hash(bi * 3 + beat + (bar.ch + 1) * 101) < 0.68) m = tgt + (tgt >= this.lastBass ? -1 : 1);
          else m = tgt - 5 >= 31 ? tgt - 5 : tgt + 7;
        } else {
          const tgt = near(nextCh.root, this.lastBass);
          const dir = tgt >= this.lastBass ? 1 : -1;
          const cands = [];
          for (let x = 31; x <= 50; x++) if ([ch.third, ch.fifth, ...ch.color, ch.tones[3]].includes(pcOf(x))) cands.push(x);
          const want = this.lastBass + dir * 3.5;
          m = cands.reduce((a, b) => (Math.abs(b - want) < Math.abs(a - want) && b !== this.lastBass ? b : a), cands[0]);
        }
      }
      m = clamp(m, 31, 50);
      const v = (beat === 0 ? 0.92 : 0.82) * (0.85 + 0.15 * E);
      this.bass(m, t, dur, v, B.bass);
      this.lastBass = m;
      if (this.log) this.log.push({ type: 'bass', t, m, name: nameOf(m), chord: ch.name });
    }

    drumsBeat(bar, bi, beat, t, E) {
      const B = this.band;
      const sc = this.scene;
      const jit = () => (Math.random() - 0.5) * 0.006;
      const dr = sc.drums;
      const intro = bar.soft;
      if (!intro) {
        if (beat % 2 === 0 && !bar.stop) this.hit(`sweep${(beat / 2 + bi) % 2}`, t - 0.015, (0.42 + 0.38 * E) * dr, B.drums);
        if (beat % 2 === 1) {
          this.hit('tap', t + jit(), (0.42 + 0.5 * E) * dr * (bar.stop ? 0.8 : 1), B.drums);
          if (E > 0.42) this.hit('chick', t + 0.005, 0.45 * dr, B.drums);
        }
        if (beat === 3 && E > 0.62 && !bar.fill && hash(bi * 17) < 0.35) this.hit('tap', t + SWING * SPB + jit(), 0.22 * dr, B.drums);
        if (beat === 3 && bar.fill) {
          [0, 1, 2].forEach((i) => this.hit('tap', t + (i * SPB) / 3 + jit(), (0.28 + i * 0.16) * dr, B.drums));
          this.hit('roll', t + SPB - ROLL_PEAK, 0.5 * sc.sleigh, B.sleigh);
        }
      }
      /* sleigh bells: on 2 and 4 when quiet, the jazz ride pattern when lively */
      const pat = bar.stop || E < 0.45 || intro ? 'soft' : E < 0.72 ? 'light' : 'ride';
      const sv = sc.sleigh * (intro ? 0.8 : 1);
      const v = () => `sleigh${Math.floor(Math.random() * 3)}`;
      const g = (x) => x * sv * (0.9 + Math.random() * 0.2);
      if (pat === 'soft') { if (beat % 2 === 1) this.hit(v(), t + jit(), g(0.55), B.sleigh); }
      else if (pat === 'light') {
        if (beat % 2 === 1) this.hit(v(), t + jit(), g(0.75), B.sleigh);
        if (beat === 3) this.hit(v(), t + SWING * SPB + jit(), g(0.32), B.sleigh);
      } else {
        this.hit(v(), t + jit(), g(beat % 2 ? 0.85 : 0.5), B.sleigh);
        if (beat % 2 === 1) this.hit(v(), t + SWING * SPB + jit(), g(0.36), B.sleigh);
      }
    }

    /* --------------------------------------------------------- the moments */

    setScene(id) {
      const sc = SCENES[id];
      if (!sc) return;
      this.sceneId = id;
      this.scene = sc;
      const now = this.ctx.currentTime;
      this.band.epLP.frequency.setTargetAtTime(sc.ep, now, 0.8);
      this.band.strLevel.gain.setTargetAtTime(sc.strings, now, 1.2);
      this.sceneWet.gain.setTargetAtTime(sc.verb, now, 1);
      if (!this.phaseUntil) this.phase = sc.gesture ? (this.phase === 'peak' || this.phase === 'after' ? this.phase : 'listen') : 'after';
      else this.phaseNext = sc.gesture ? 'listen' : 'after';
    }

    duckTo(level, at, tc) {
      for (const g of [this.duckDry.gain, this.duckWet.gain]) {
        if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(at);
        else { g.cancelScheduledValues(at); g.setValueAtTime(g.value, at); }
        g.setTargetAtTime(level, at, tc);
      }
    }
    duck(amount = 0.5, ms = 1200) {
      const now = this.ctx.currentTime;
      this.duckTo(1 - clamp(amount, 0, 1), now, 0.05);
      const g = this.duckDry.gain;
      g.setTargetAtTime(1, now + ms / 1000, 0.35);
      this.duckWet.gain.setTargetAtTime(1, now + ms / 1000, 0.35);
    }

    /* travel: a harp glissando sweeps across (left to right, as the world drifts), the band walks,
       and a small celesta figure greets the arrival on the beat */
    travel(durS) {
      const c = this.ctx;
      const now = c.currentTime;
      const D = Math.max(0.6, durS);
      if (now - (this.travelT || -9) < 0.8) return;
      this.travelT = now;
      this.setPhase('travel', now + D, this.scene.gesture ? 'listen' : 'after');
      this.prog.step = -1;
      this.prog.k = 0;
      const ch = this.chordAt(now + 0.1);
      const notes = ladderOf(ch.tones, 65, 86);
      const n = notes.length;
      const t0 = this.quant(now + 0.02, SPB / 2, 0.3);
      const span = Math.min(1.05, D * 0.45);
      notes.forEach((m, i) => {
        const x = i / (n - 1);
        this.harp(m, t0 + span * Math.pow(x, 0.85), 0.42 + 0.3 * x, this.cue.harp, -0.7 + 1.4 * x);
      });
      const arrive = this.quant(now + D - 0.12, SPB, SPB);
      const ach = this.chordAt(arrive + 0.05);
      const top = ladderOf(ach.tones, 79, 93).reverse();
      [0, 1].forEach((i) => top[i] && this.cel(top[i], arrive + i * SPB * SWING, 0.5, 0.36 - i * 0.06, this.cue.cel));
      if (this.log) this.log.push({ type: 'cue', cue: 'travel', t: now, gliss: notes.map(nameOf), arrive: +(arrive - now).toFixed(3), chord: ch.name });
    }

    /* progress: each new step climbs the current chord, on the band's 16th grid */
    progress(k) {
      const c = this.ctx;
      const now = c.currentTime;
      const P = this.prog;
      let step;
      if (typeof k !== 'number' || !isFinite(k)) {
        if (now - P.lastT > 5) P.step = -1;
        step = P.step + 1;
        P.k = clamp(step / (LADDER - 1), 0, 1);
      } else {
        k = clamp(k, 0, 1);
        if (k < P.k - 0.25 || (k === 0 && P.step > 0)) P.step = -1;
        P.k = k;
        step = Math.round(k * (LADDER - 1));
      }
      P.lastT = now;
      if (step <= P.step || step > LADDER - 1) return;
      const from = Math.max(P.step + 1, step - 3);
      P.step = step;
      let t = this.quant(now + 0.01);
      for (let s = from; s <= step; s++) {
        t = Math.max(t, P.lastNoteT + 0.095);
        const ch = this.chordAt(t);
        const lad = ladderOf(ch.all, 67, 100).slice(0, LADDER);
        const m = lad[s];
        const x = s / (LADDER - 1);
        this.cel(m, t, 0.35, 0.36 + 0.3 * x, this.cue.cel);
        if (s < LADDER / 2) this.harp(m - 12, t, 0.12, this.cue.harp);
        if (s >= LADDER - 3) this.glock(m + 12, t, 0.12 + 0.1 * x, this.cue.glock, 0.6);
        if (this.log) this.log.push({ type: 'cue', cue: 'progress', t, step: s, m, name: nameOf(m), chord: ch.name });
        P.lastNoteT = t;
      }
    }

    /* the chord the song will be playing at time t: from the bars already played, or by following the song ahead */
    chordAtFuture(t) {
      const s = this.seq;
      if (!s.running || t < s.barT) return this.chordAt(t);
      let bi = s.bar;
      let bt = s.barT;
      while (bt + BAR <= t + 0.001) { bi = this.peekNext(bi, bt); bt += BAR; }
      return chordAtBeat(SONG[bi], clamp(Math.floor((t - bt) / SPB), 0, 3));
    }

    /* peak: a rising run lands on the next bar line in that bar's chord, the band lifts, and the tune plays on.
       Returns the seconds until that landing. */
    peak(kind) {
      const c = this.ctx;
      const now = c.currentTime;
      const s = this.seq;
      const C = this.cue;
      /* a second call before the landing joins the first */
      if (this.peakAt && this.peakAt > now) return this.peakAt - now;
      let L;
      if (this.running()) {
        L = s.beat === 0 ? s.barT : s.barT + BAR;
        while (L < now + 0.95) L += BAR;
        this.peaks++;
        this.landed = L;
        this.feature = { kind: { birch: 'sparkle', lake: 'harp', mountain: 'glock', village: 'strings', shore: 'thirds' }[kind] || 'sparkle', from: L, until: L + 8 * BAR };
        this.setPhase('peak', L + 8 * BAR, 'after');
        this.duckTo(0.74, now, 0.12);
        this.duckTo(1, L - 0.03, 0.05);
      } else L = now + 1.0;
      const ch = this.chordAtFuture(L + 0.02);
      /* a first spark, right away */
      const ch0 = this.chordAt(now + 0.02);
      const spark = ladderOf(ch0.tones, 84, 96);
      this.glock(spark[spark.length - 1], now + 0.015, 0.3, C.glock, 0.8);
      this.hit('sleigh1', now + 0.01, 0.5, C.sleigh);
      /* the run climbs the landing chord */
      const tops = ladderOf(ch.tones, 86, { birch: 93, lake: 89, mountain: 96, village: 93, shore: 93 }[kind] || 93);
      const land = tops.length ? tops[tops.length - 1] : 89;
      const runEnd = L - 0.06;
      const span = Math.min(1.45, runEnd - now - 0.12);
      const runStart = runEnd - span;
      const pool = ladderOf(ch.tones, kind === 'lake' ? 53 : 60, land - 1);
      const count = clamp(Math.round(span / (kind === 'village' ? 0.16 : kind === 'lake' ? 0.07 : 0.095)), 5, kind === 'lake' ? 18 : 14);
      const run = pool.slice(-count);
      const times = run.map((_, i) => runStart + span * Math.pow(i / run.length, 0.78));
      run.forEach((m, i) => {
        const x = i / Math.max(1, run.length - 1);
        if (kind === 'lake' || kind === 'shore') this.harp(m, times[i], 0.2 + 0.18 * x, C.harp, -0.5 + x);
        if (kind !== 'lake') this.cel(m, times[i], 0.3, 0.28 + 0.26 * x, C.cel);
        if (kind === 'mountain') this.glock(m + 12, times[i], 0.1 + 0.12 * x, C.glock, 0.5);
      });
      if (kind === 'village') {
        /* the strings rise with the lanterns */
        const v = this.guide(ch, null);
        for (const m of v) this.str(m, now + 0.05, L - now + 1.6, 0.8, C.strings, Math.max(0.3, L - now - 0.05));
      }
      /* the landing: high celesta, a glockenspiel sparkle, the piano opens up, a shake of bells */
      this.cel(land, L, 1.2, 0.62, C.cel);
      if (kind === 'shore') { const h3 = thirdBelowIn(land, ch); if (h3) this.cel(h3, L + 0.004, 1.2, 0.44, C.cel); }
      ladderOf(ch.tones, land - 4, land + 12).slice(0, 4).forEach((m, i) => this.glock(m, L + 0.06 + i * 0.075, 0.32 - i * 0.05, C.glock, 0.9));
      this.voicing(ch, null, 60, 79).forEach((m) => this.ep(m, L, BAR * 0.9, 0.42, C.ep));
      this.hit('roll', L - ROLL_PEAK, 0.55, C.sleigh);
      if (kind === 'mountain') {
        ladderOf(ch.tones, 84, 96).reverse().forEach((m, i) => this.glock(m, L + SPB + i * (SPB / 3), 0.26 - i * 0.025, C.glock, 0.6));
        let b = 28;
        while (pcOf(b) !== ch.root) b++;
        this.bass(b, L, BAR * 0.8, 0.6, C.bass);
      }
      this.peakAt = L;
      if (this.log) this.log.push({ type: 'cue', cue: 'peak', kind, t: now, landing: +(L - now).toFixed(3), chord: ch.name, run: run.map(nameOf), land: nameOf(land) });
      return L - now;
    }

    /* the shop door: a small brass bell on a spring, tuned to the key, then a warm welcome chord */
    door() {
      const c = this.ctx;
      const now = c.currentTime + 0.01;
      if (now - (this.doorT || -9) < 1.5) return;
      this.doorT = now;
      const strikes = [[0, 1], [0.072, 0.82], [0.158, 0.86], [0.262, 0.6], [0.4, 0.5], [0.585, 0.32], [0.81, 0.2], [1.08, 0.12]];
      strikes.forEach(([dt, a], i) => {
        const f = mtof(i % 2 ? 93 : 96) * (1 + (Math.random() - 0.5) * 0.004);
        for (const [r, amp, tau] of [[1, 1, 0.55], [2.01, 0.38, 0.22], [3.03, 0.16, 0.09]]) {
          const o = c.createOscillator();
          o.frequency.value = f * r;
          const g = c.createGain();
          this.env(g, now + dt, a * amp * 0.11, 0.0015, tau);
          o.connect(g).connect(this.cue.glock);
          o.start(now + dt);
          o.stop(now + dt + tau * 7);
        }
      });
      const vo = this.voicing(chord('F:maj9'), null, 57, 76);
      vo.forEach((m, i) => this.cel(m + 12, now + 0.55 + i * 0.09, 1.4, 0.34, this.cue.cel));
      vo.forEach((m) => this.ep(m, now + 0.5, 1.8, 0.38, this.cue.ep));
      this.duck(0.55, 1900);
      this.setPhase('hush', now + 2.6, 'after');
      if (this.log) this.log.push({ type: 'cue', cue: 'door', t: now });
    }

    /* finale: the hook, VI7 and a ii-V, then the turn (Db, Eb) and home to F. Returns seconds until the arrival. */
    finale() {
      const c = this.ctx;
      const now = c.currentTime;
      const C = this.cue;
      const s = this.seq;
      /* already playing: report the time to its arrival instead of starting again */
      if (this.finaleAt && now < this.finaleAt + 5) return Math.max(0, this.finaleAt - now);
      s.hold = true;
      this.jump = null;
      this.duckTo(0, now, 0.12);
      const T0 = now + 0.4;
      const spb = 60 / 100;
      /* beat -> time with a ritardando into the last chord */
      const stretch = (b) => (b < 8 ? 1 : b < 12 ? 1 + (b - 7) * 0.07 : 1.35);
      const bt = (b) => {
        let tt = T0;
        const whole = Math.floor(b);
        for (let i = 0; i < whole; i++) tt += spb * stretch(i);
        return tt + (b - whole) * spb * stretch(whole);
      };
      const sw = (b) => b + (b % 1 ? SWING - 0.5 : 0);
      const chords = [[0, 'F:maj9'], [4, 'D:7b9'], [6, 'G:m9'], [7, 'C:13'], [8, 'Db:maj9'], [10, 'Eb:69'], [12, 'F:maj9']];
      const mel = [[0, 1, 'C5'], [1, 2, 'A5'], [3, 0.5, 'G5'], [3.5, 0.5, 'F5'], [4, 1, 'F#5'], [5, 1, 'G5'], [6, 1, 'Bb5'], [7, 0.5, 'A5'], [7.5, 0.5, 'G5'], [8, 1, 'F5'], [9, 1, 'Ab5'], [10, 1, 'G5'], [11, 1, 'Bb5'], [12, 4, 'C6']];
      const bassLine = [[0, 'F2'], [2, 'A2'], [4, 'D2'], [6, 'G1'], [7, 'C2'], [8, 'Db2'], [10, 'Eb2'], [12, 'F1']];
      let prevV = null;
      let prevG = null;
      chords.forEach(([b, sym], i) => {
        const ch = chord(sym);
        const end = i + 1 < chords.length ? bt(chords[i + 1][0]) : bt(12) + 4.2;
        const v = this.voicing(ch, prevV, 53, 74);
        prevV = v;
        const last = b === 12;
        v.forEach((m, j) => this.ep(m, bt(b) + j * (last ? 0.03 : 0.004), end - bt(b) - 0.03, last ? 0.62 : 0.5, C.ep));
        const g = this.guide(ch, prevG) || [];
        if (g.length) prevG = g;
        g.forEach((m) => this.str(m, bt(b), end - bt(b) + (last ? 0.6 : 0.1), last ? 1 : 0.75, C.strings, last ? 0.35 : 0.3));
      });
      bassLine.forEach(([b, n], i) => {
        const m = midiOf(n);
        const end = i + 1 < bassLine.length ? bt(bassLine[i + 1][0]) : bt(12) + 3.5;
        this.bass(m, bt(b), end - bt(b) - 0.04, 0.85, C.bass);
        if (b === 12) this.harp(m + 12, bt(b), 0.4, C.harp);
      });
      mel.forEach(([b, d, n]) => {
        const m = midiOf(n);
        const t = bt(sw(b));
        const dur = bt(sw(b) + d) - t - 0.03;
        this.vibes(m, t, dur, b >= 12 ? 0.74 : 0.64, C.vib);
        this.cel(m + 12, t + 0.004, dur, b >= 12 ? 0.3 : 0.22, C.cel);
        this.glock(m + 12, t, b >= 12 ? 0.3 : 0.18, C.glock, 0.7);
        if (b >= 8) this.vibes(thirdBelowAny(m, b), t + 0.005, dur, 0.42, C.vib);
      });
      /* the arrival: a sparkle climbing through F major 9 */
      const A = bt(12);
      this.finaleAt = A;
      ladderOf(chord('F:maj9').all, 84, 101).forEach((m, i) => this.glock(m, A + 0.18 + i * 0.085, 0.32 - i * 0.012, C.glock, 1.1));
      this.cel(89, A + 1.2, 2.2, 0.42, C.cel);
      this.hit('roll', A - ROLL_PEAK, 0.65, C.sleigh);
      [1, 3, 5, 7, 9, 11].forEach((b) => this.hit(`sleigh${b % 3}`, bt(b), 0.38, C.sleigh));
      [1, 3, 5, 7, 9].forEach((b) => this.hit('tap', bt(b), 0.32, C.drums));
      [0, 1, 2].forEach((i) => this.hit('tap', bt(11 + i / 3), 0.2 + i * 0.12, C.drums));
      /* the band comes back softly at the top, in the evening arrangement */
      this.resumeAt = A + 3.4;
      this.setScene('end');
      this.setPhase('after');
      this.duckTo(1, this.resumeAt - 0.05, 0.9);
      if (this.log) this.log.push({ type: 'cue', cue: 'finale', t: now, arrive: +(A - now).toFixed(3), chords: chords.map(([b, sym]) => [b, chord(sym).name]), mel: mel.map(([b, d, n]) => [b, d, n]) });
      return A - now;
    }

    /* --------------------------------------------------------- the old gesture API, re-voiced */

    pluck(freq, { gain = 0.3, when = 0, bus = 'sfx', pan = 0 } = {}) {
      const out = bus === 'music' ? this.band.harp : this.sfx;
      this.harp(ftom(freq), this.ctx.currentTime + when, gain * 0.9, out, pan);
    }
    bell(freq, { gain = 0.08, when = 0 } = {}) {
      this.glock(ftom(freq), this.ctx.currentTime + when, gain * 1.6, this.sfx);
    }
    air({ dur = 0.6, f = 900, q = 0.7, gain = 0.12, attack = 0.15, when = 0 } = {}) {
      const c = this.ctx;
      const t0 = c.currentTime + when;
      /* long, wide air reads as wind: keep it a faint breath of snow under the music */
      const wind = dur >= 1.2 && q <= 1.2;
      const s = c.createBufferSource();
      s.buffer = this.noise;
      s.loop = true;
      const fl = c.createBiquadFilter();
      fl.type = 'bandpass';
      fl.frequency.value = wind ? Math.min(f, 700) : f;
      fl.Q.value = q;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = wind ? 1400 : 7000;
      const g = c.createGain();
      const peak = gain * (wind ? 0.3 : 0.8);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + Math.min(attack, dur * 0.6));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(fl).connect(lp).connect(g).connect(this.sfx);
      s.start(t0, Math.random());
      s.stop(t0 + dur + 0.05);
    }
    thud() {
      const c = this.ctx;
      const t = c.currentTime;
      const s = c.createBufferSource();
      s.buffer = this.noise;
      const fl = c.createBiquadFilter();
      fl.type = 'lowpass';
      fl.frequency.value = 220;
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.32, t + 0.006);
      g.gain.setTargetAtTime(0, t + 0.006, 0.05);
      s.connect(fl).connect(g).connect(this.sfx);
      s.start(t, Math.random());
      s.stop(t + 0.4);
      const root = this.chordAt(t).root;
      let m = 41;
      while (pcOf(m) !== root) m--;
      this.bass(m, t, 0.9, 0.55, this.sfx);
    }
    chime(oct = 1) {
      const t = this.ctx.currentTime;
      const ch = this.chordAt(t + 0.05);
      const tones = ladderOf(ch.all, 65 + 12 * oct, 100).slice(0, 4);
      tones.forEach((m, i) => this.cel(m, t + i * 0.085, 0.6, 0.3, this.sfx));
      if (tones.length) this.glock(tones[tones.length - 1] + 12, t + 0.3, 0.12, this.sfx, 0.8);
    }
  }
  /* a third below inside the finale's own keys (Db and Eb major for the turn) */
  function thirdBelowAny(m, b) {
    const key = b >= 12 ? F_MAJOR : b >= 10 ? [3, 5, 7, 8, 10, 0, 2] : [1, 3, 5, 6, 8, 10, 0];
    const sc = ladderOf(key, m - 12, m);
    const i = sc.indexOf(m);
    return i >= 2 ? sc[i - 2] : m - 4;
  }

  /* ------------------------------------------------------------ the public object */

  const A = {
    ctx: null,
    on: false,
    eng: null,
    timer: null,
    scene: 'birch',
    /* must run inside the first tap (iOS): creates the context and unlocks it with a silent buffer */
    init() {
      if (this.ctx) return true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try {
        this.ctx = new AC({ latencyHint: 'interactive' });
      } catch (e) {
        try { this.ctx = new AC(); } catch (e2) { return false; }
      }
      const c = this.ctx;
      try {
        const b = c.createBuffer(1, 1, c.sampleRate);
        const s = c.createBufferSource();
        s.buffer = b;
        s.connect(c.destination);
        s.start(0);
      } catch (e) { /* not needed outside iOS */ }
      this.eng = new Engine(c);
      this.eng.setScene(this.scene);
      document.addEventListener('visibilitychange', () => this.visibility());
      /* iOS can interrupt the context (a call, the lock screen): resume on the next touch */
      const wake = () => { if (this.on && c.state !== 'running') { c.resume().then(() => this.realign()).catch(() => {}); } };
      window.addEventListener('pointerdown', wake, { passive: true });
      window.addEventListener('keydown', wake);
      return true;
    },
    get master() { return this.eng ? this.eng.master : null; },
    fade(to, sec) {
      const g = this.eng.master.gain;
      const now = this.ctx.currentTime;
      if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(now);
      else { g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); }
      g.linearRampToValueAtTime(to, now + sec);
    },
    start() {
      if (!this.init()) return;
      const first = !this.eng.seq.started;
      this.on = true;
      const go = () => {
        if (!this.on) return;
        this.fade(1, first ? 2.4 : 1.2);
        if (!this.eng.seq.running && !this.eng.seq.hold) this.eng.startMusic(this.ctx.currentTime + 0.15, first ? 0 : null);
        if (!this.timer) this.timer = setInterval(() => { if (this.on) this.eng.tick(); }, 40);
        this.eng.tick();
        if (first) this.prewarm();
      };
      if (this.ctx.state !== 'running') this.ctx.resume().then(go, go); else go();
    },
    stop() {
      if (!this.ctx || !this.eng) return;
      this.on = false;
      this.fade(0, 0.7);
      setTimeout(() => {
        if (this.on) return;
        this.eng.seq.running = false;
        clearInterval(this.timer);
        this.timer = null;
        this.ctx.suspend().catch(() => {});
      }, 800);
    },
    /* the band restarts the current bar on the grid after a pause */
    realign() {
      if (!this.on || !this.eng) return;
      const s = this.eng.seq;
      if (s.hold) return;
      s.running = false;
      this.eng.startMusic(this.ctx.currentTime + 0.15, null);
      this.fade(1, 1.2);
    },
    visibility() {
      if (!this.ctx || !this.on) return;
      if (document.hidden) {
        this.fade(0, 0.25);
        setTimeout(() => { if (document.hidden && this.on) { this.eng.seq.running = false; this.ctx.suspend().catch(() => {}); } }, 320);
      } else {
        this.ctx.resume().then(() => this.realign()).catch(() => {});
      }
    },
    /* build the bass strings ahead of time, a few per frame */
    prewarm() {
      const ms = [];
      for (let m = 31; m <= 50; m++) ms.push(m);
      const step = () => { const m = ms.shift(); if (m == null || !this.eng) return; this.eng.ks('bass', mtof(m)); setTimeout(step, 16); };
      setTimeout(step, 300);
    },
    live() { return !!(this.ctx && this.eng && this.on); },

    /* gesture sounds (unchanged signatures) */
    pluck(freq, o) { if (this.live()) this.eng.pluck(freq, o); },
    bell(freq, o) { if (this.live()) this.eng.bell(freq, o); },
    air(o) { if (this.live()) this.eng.air(o); },
    thud() { if (this.live()) this.eng.thud(); },
    chime(oct = 1) { if (this.live()) this.eng.chime(oct); },
    /* gesture notes: a climb through the chord the band is playing (F major pentatonic from F4 without it) */
    note(i, oct = 0) {
      if (this.eng && this.eng.running()) {
        const lad = ladderOf(this.eng.chordAt(this.ctx.currentTime + 0.03).all, 65 + 12 * oct, 95 + 12 * oct);
        if (lad.length) return mtof(lad[((i % lad.length) + lad.length) % lad.length]);
      }
      const n = F_PENTA_STEPS[((i % 5) + 5) % 5] + 12 * (Math.floor(i / 5) + oct);
      return 349.2282 * Math.pow(2, n / 12);
    },

    /* the moments */
    setScene(id) { if (!SCENES[id]) return; this.scene = id; if (this.eng) this.eng.setScene(id); },
    travel(durMs = 2700) { if (this.live()) this.eng.travel(durMs / 1000 / (G.SPEED || 1)); },
    progress(k) { if (this.live()) this.eng.progress(k); },
    peak(kind) { return this.live() ? Math.round(this.eng.peak(kind) * 1000) : 0; },
    door() { if (this.live()) this.eng.door(); },
    finale() { return this.live() ? Math.round(this.eng.finale() * 1000) : 0; },
    duck(amount = 0.5, ms = 1200) { if (this.live()) this.eng.duck(amount, ms); },
    state() {
      if (!this.eng) return null;
      const e = this.eng;
      const s = e.seq;
      const bar = SONG[s.bar];
      return { on: this.on, scene: e.sceneId, phase: e.phase, energy: +e.barE.toFixed(2), bar: s.bar, section: bar.sec, n: bar.n, chorus: bar.ch, chord: e.chordAt(this.ctx.currentTime).name, ctx: this.ctx.state };
    },

    /* tests: render the band and any cues into an OfflineAudioContext, driven exactly like the live scheduler */
    async renderOffline({ seconds = 40, sampleRate = 44100, scene = 'birch', music = true, fromBar = 0, phase = null, script = [], log = true, fadeIn = false, solo = null } = {}) {
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const ctx = new OAC(2, Math.ceil(seconds * sampleRate), sampleRate);
      const e = new Engine(ctx, { offline: true });
      if (solo) for (const k of ['vib', 'cel', 'glock', 'ep', 'bass', 'drums', 'sleigh', 'strings', 'harp']) if (!solo.includes(k)) e.band[k].gain.value = 0;
      e.log = log ? [] : null;
      e.setScene(scene);
      if (phase) e.setPhase(phase);
      if (fadeIn) { e.master.gain.setValueAtTime(0, 0); e.master.gain.linearRampToValueAtTime(1, 2.4); } else e.master.gain.value = 1;
      if (music) e.startMusic(0.1, fromBar);
      const events = script.slice().sort((a, b) => a[0] - b[0]);
      let ei = 0;
      const results = [];
      const errors = [];
      const run = () => {
        while (ei < events.length && events[ei][0] <= ctx.currentTime + 1e-6) {
          try { results.push(events[ei][1](e)); } catch (err) { errors.push(String(err)); }
          ei++;
        }
        try { e.tick(); } catch (err) { errors.push(String(err)); }
      };
      const step = 0.05;
      for (let k = 1; k * step < seconds - 0.06; k++) {
        ctx.suspend(+(k * step).toFixed(4)).then(() => { try { run(); } finally { ctx.resume(); } });
      }
      run();
      const buffer = await ctx.startRendering();
      if (errors.length) console.error(`renderOffline: ${errors[0]}`);
      return { buffer, log: e.log, results, errors };
    },
    /* the written chart, for review */
    chart() {
      return SONG.map((b, i) => ({ i, sec: b.sec, n: b.n, ch: b.ch, chords: b.chords.map(([beat, c]) => `${c.name}${beat ? `@${beat + 1}` : ''}`).join(' '), mel: b.mel.map(([p, d, m]) => `${nameOf(m)}:${p}/${d}`).join(' ') }));
    },
    BPM,
    SCENES: Object.keys(SCENES),
  };
  const F_PENTA_STEPS = [0, 2, 4, 7, 9];

  G.audio = A;
})();
