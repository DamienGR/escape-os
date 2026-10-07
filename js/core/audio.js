// Sons synthétisés en Web Audio : aucun fichier audio, aucun son d'origine.
// Activé au premier geste (écran titre), coupé d'un clic dans le HUD.

const AC = window.AudioContext || window.webkitAudioContext;

const SEMITONES = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };

// 'C5' → 523.25 Hz
export function hz(note) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(note);
  if (!m) return Number(note) || 440;
  const shift = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  const n = SEMITONES[m[1]] + shift + (Number(m[3]) - 4) * 12;
  return 440 * 2 ** (n / 12);
}

class Synth {
  constructor() {
    this.ctx = null;
    this.out = null;
    this.enabled = true;
    this.volume = 0.75;
    this.last = new Map();
    this.noiseBuf = null;
  }

  unlock() {
    if (!AC) return;
    if (!this.ctx) {
      this.ctx = new AC();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 14;
      comp.ratio.value = 4;
      this.out = this.ctx.createGain();
      this.out.gain.value = this.enabled ? this.volume : 0;
      this.out.connect(comp).connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.ctx) this.out.gain.setTargetAtTime(on ? this.volume : 0, this.ctx.currentTime, 0.03);
  }

  get on() {
    return Boolean(this.ctx) && this.enabled && this.ctx.state === 'running';
  }

  get now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  // Évite d'empiler le même son trop vite (cliquetis par caractère).
  throttle(name, ms) {
    const now = performance.now();
    if (now - (this.last.get(name) ?? 0) < ms) return false;
    this.last.set(name, now);
    return true;
  }

  noiseBuffer() {
    if (!this.noiseBuf) {
      const len = this.ctx.sampleRate * 2;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    return this.noiseBuf;
  }

  // Un bus coupable d'un coup (modem, ambiances).
  bus(vol = 1) {
    if (!this.on) return null;
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    gain.connect(this.out);
    return {
      node: gain,
      stop: (fade = 0.08) => {
        try {
          gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, fade / 3);
          setTimeout(() => gain.disconnect(), fade * 1000 + 200);
        } catch {
          // déjà déconnecté
        }
      },
    };
  }

  envelope(param, t0, { attack = 0.004, hold = 0, release = 0.08, vol = 0.2 }) {
    param.setValueAtTime(0.0001, t0);
    param.linearRampToValueAtTime(vol, t0 + attack);
    if (hold) param.setValueAtTime(vol, t0 + attack + hold);
    param.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + release);
    return t0 + attack + hold + release;
  }

  filter(node, t0, spec, dur) {
    if (!spec) return node;
    const f = this.ctx.createBiquadFilter();
    f.type = spec.type ?? 'lowpass';
    f.frequency.setValueAtTime(spec.freq ?? 1000, t0);
    if (spec.to) f.frequency.exponentialRampToValueAtTime(spec.to, t0 + dur);
    f.Q.value = spec.q ?? 0.7;
    node.connect(f);
    return f;
  }

  tone({
    freq = 440,
    type = 'sine',
    at = 0,
    attack = 0.004,
    hold = 0,
    release = 0.12,
    vol = 0.12,
    to,
    glide,
    detune = 0,
    filter,
    dest,
  } = {}) {
    if (!this.on) return null;
    const t0 = this.now + at;
    const dur = attack + hold + release;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + (glide ?? dur));
    osc.detune.value = detune;
    const gain = this.ctx.createGain();
    this.filter(osc, t0, filter, dur).connect(gain);
    gain.connect(dest ?? this.out);
    const end = this.envelope(gain.gain, t0, { attack, hold, release, vol });
    osc.start(t0);
    osc.stop(end + 0.05);
    return osc;
  }

  noise({
    at = 0,
    attack = 0.002,
    hold = 0,
    release = 0.06,
    vol = 0.12,
    type = 'bandpass',
    freq = 1200,
    to,
    q = 1,
    rate = 1,
    dest,
  } = {}) {
    if (!this.on) return null;
    const t0 = this.now + at;
    const dur = attack + hold + release;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    src.loop = true;
    src.playbackRate.value = rate;
    const gain = this.ctx.createGain();
    this.filter(src, t0, { type, freq, to, q }, dur).connect(gain);
    gain.connect(dest ?? this.out);
    const end = this.envelope(gain.gain, t0, { attack, hold, release, vol });
    src.start(t0, Math.random() * 1.5);
    src.stop(end + 0.05);
    return src;
  }

  // Suite de notes : [['C5', 0], ['E5', 0.1, 0.3]] (note, départ, durée)
  melody(seq, opts = {}) {
    for (const [note, at, len = opts.len ?? 0.25] of seq) {
      this.tone({ release: len, ...opts, freq: hz(note), at: (opts.at ?? 0) + at });
    }
  }

  // ——— Interface ———

  click() {
    this.noise({ type: 'highpass', freq: 2600, release: 0.02, vol: 0.1 });
    this.tone({ freq: 1900, type: 'square', release: 0.012, vol: 0.02 });
  }

  tap() {
    this.tone({ freq: 1250, release: 0.03, vol: 0.05 });
  }

  key() {
    if (!this.throttle('key', 22)) return;
    this.noise({ type: 'bandpass', freq: 1700 + Math.random() * 1100, q: 1.4, release: 0.03, vol: 0.11 });
    this.tone({ freq: 130 + Math.random() * 40, type: 'triangle', release: 0.025, vol: 0.05 });
  }

  success() {
    this.melody([['G5', 0], ['C6', 0.09, 0.45]], { type: 'triangle', vol: 0.09 });
    this.melody([['G6', 0.09, 0.3]], { vol: 0.03 });
  }

  fail() {
    this.melody([['E4', 0, 0.12], ['C4', 0.11, 0.25]], { type: 'square', vol: 0.035, filter: { freq: 1400 } });
  }

  note() {
    this.melody([['E6', 0, 0.18], ['A6', 0.07, 0.35]], { vol: 0.05 });
  }

  // ——— Saut temporel ———

  crtOff() {
    this.noise({ type: 'lowpass', freq: 320, release: 0.2, vol: 0.2 });
    this.noise({ type: 'highpass', freq: 3200, release: 0.22, vol: 0.05 });
    this.tone({ freq: 7400, attack: 0.001, release: 0.8, vol: 0.012 });
  }

  crtOn() {
    this.tone({ freq: 52, type: 'sawtooth', attack: 0.02, hold: 0.18, release: 0.5, vol: 0.07, filter: { freq: 260 } });
    this.noise({ type: 'bandpass', freq: 900, q: 0.8, attack: 0.01, release: 0.45, vol: 0.06 });
    this.tone({ freq: 7400, attack: 0.3, hold: 0.4, release: 1.2, vol: 0.008 });
  }

  whoosh(dur = 1.8, reverse = false) {
    const [a, b] = reverse ? [3400, 160] : [160, 3400];
    this.noise({ type: 'bandpass', freq: a, to: b, q: 1.6, attack: dur * 0.55, release: dur * 0.45, vol: 0.16 });
    this.tone({
      freq: reverse ? 620 : 70,
      to: reverse ? 70 : 620,
      glide: dur,
      attack: dur * 0.6,
      release: dur * 0.4,
      vol: 0.05,
    });
    for (let i = 0; i < 4; i++) {
      this.tone({
        freq: hz(['E5', 'B5', 'E6', 'G#6'][i]),
        type: 'triangle',
        at: dur * 0.35 + i * 0.09,
        attack: 0.02,
        release: 0.6,
        vol: 0.025,
        detune: reverse ? -12 : 12,
      });
    }
  }

  tick() {
    if (!this.throttle('tick', 30)) return;
    this.tone({ freq: 2600, type: 'square', release: 0.01, vol: 0.02 });
  }

  // ——— Années 60 à 80 ———

  clack() {
    if (!this.throttle('clack', 26)) return;
    this.noise({ type: 'bandpass', freq: 1200 + Math.random() * 800, q: 3, release: 0.045, vol: 0.15 });
    this.noise({ type: 'highpass', freq: 5200, release: 0.012, vol: 0.05 });
    this.tone({ freq: 90 + Math.random() * 25, type: 'square', release: 0.035, vol: 0.035, filter: { freq: 600 } });
  }

  carriage() {
    this.noise({ type: 'bandpass', freq: 500, to: 1500, q: 2, attack: 0.03, hold: 0.07, release: 0.05, vol: 0.05 });
    this.noise({ at: 0.15, type: 'lowpass', freq: 380, release: 0.06, vol: 0.12 });
  }

  bell() {
    this.tone({ freq: 1568, release: 1.3, vol: 0.1 });
    this.tone({ freq: 3170, release: 0.6, vol: 0.035 });
    this.tone({ freq: 4720, release: 0.3, vol: 0.02 });
  }

  printer(lines = 8, rate = 11) {
    const bus = this.bus(1);
    if (!bus) return () => {};
    const dur = lines / rate;
    this.tone({ freq: 48, type: 'sawtooth', attack: 0.05, hold: dur, release: 0.2, vol: 0.04, filter: { freq: 220 }, dest: bus.node });
    for (let i = 0; i < lines; i++) {
      const at = i / rate;
      this.noise({ at, type: 'bandpass', freq: 1800 + Math.random() * 500, q: 0.8, attack: 0.004, hold: 0.03, release: 0.03, vol: 0.12, dest: bus.node });
      this.noise({ at: at + 0.05, type: 'lowpass', freq: 300, release: 0.03, vol: 0.08, dest: bus.node });
    }
    return () => bus.stop();
  }

  cardFeed(count = 8) {
    for (let i = 0; i < count; i++) {
      this.noise({ at: i * 0.055, type: 'highpass', freq: 2200, release: 0.025, vol: 0.12 });
      this.noise({ at: i * 0.055 + 0.01, type: 'bandpass', freq: 700, q: 2, release: 0.03, vol: 0.05 });
    }
    this.noise({ type: 'lowpass', freq: 500, attack: 0.1, hold: count * 0.05, release: 0.2, vol: 0.05 });
  }

  beep(freq = 760, dur = 0.16) {
    this.tone({ freq, type: 'square', attack: 0.002, hold: dur, release: 0.01, vol: 0.05 });
  }

  floppy() {
    for (let i = 0; i < 7; i++) {
      this.tone({
        at: i * 0.13,
        freq: 85 + (i % 3) * 22,
        type: 'square',
        attack: 0.003,
        hold: 0.07,
        release: 0.02,
        vol: 0.05,
        filter: { freq: 800 },
      });
      this.noise({ at: i * 0.13, type: 'bandpass', freq: 2400, q: 5, hold: 0.05, release: 0.02, vol: 0.03 });
    }
  }

  hdd(dur = 1) {
    for (let t = 0; t < dur; t += 0.03 + Math.random() * 0.09) {
      this.noise({ at: t, type: 'bandpass', freq: 2800 + Math.random() * 3200, q: 6, release: 0.012, vol: 0.06 });
    }
  }

  // ——— Carillons de démarrage, tous originaux ———

  chime(kind) {
    if (!this.on) return;
    switch (kind) {
      case 'win31':
        this.melody([['C5', 0], ['E5', 0.08], ['G5', 0.16], ['C6', 0.24, 0.9]], { type: 'triangle', vol: 0.08 });
        this.melody([['C4', 0.24, 1.1], ['G4', 0.24, 1.1]], { type: 'sine', vol: 0.05 });
        break;
      case 'win95':
        for (const note of ['Eb3', 'Bb3', 'F4', 'G4', 'D5']) {
          for (const detune of [-7, 7]) {
            this.tone({ freq: hz(note), type: 'sawtooth', attack: 0.7, hold: 1.2, release: 2.2, vol: 0.018, detune, filter: { freq: 1500 } });
          }
        }
        this.melody([['Bb5', 0.55], ['F5', 0.8], ['G5', 1.05], ['D6', 1.3, 1.6]], { vol: 0.045 });
        break;
      case 'win98':
        for (const note of ['C3', 'G3', 'D4', 'E4', 'B4']) {
          for (const detune of [-6, 6]) {
            this.tone({ freq: hz(note), type: 'sawtooth', attack: 0.5, hold: 1, release: 2, vol: 0.017, detune, filter: { freq: 1700 } });
          }
        }
        this.melody([['E5', 0.3], ['G5', 0.42], ['B5', 0.54], ['D6', 0.66], ['E6', 0.9, 1.5]], { vol: 0.04 });
        break;
      case 'xp':
        this.melody([['G5', 0, 1.2], ['D6', 0.14, 1.2], ['G6', 0.28, 1.4], ['B5', 0.5, 1.6]], { vol: 0.05 });
        for (const note of ['G3', 'D4', 'B4']) {
          this.tone({ freq: hz(note), type: 'triangle', attack: 0.3, hold: 0.6, release: 1.4, vol: 0.03 });
        }
        break;
      case 'ubuntu':
        for (const at of [0, 0.22, 0.44, 0.55, 0.66]) {
          this.tone({ freq: 160, to: 55, glide: 0.25, at, release: 0.3, vol: 0.14 });
        }
        this.melody([['C5', 0.66], ['E5', 0.78], ['G5', 0.9], ['C6', 1.02, 0.8]], { type: 'sine', vol: 0.06, attack: 0.002 });
        break;
      case 'phone':
        this.tone({ freq: 880, release: 0.5, vol: 0.05 });
        this.tone({ freq: 1320, at: 0.08, release: 0.6, vol: 0.04 });
        break;
      case 'agent':
        this.melody([['A5', 0, 1.4], ['E6', 0.12, 1.6], ['C#6', 0.24, 1.8]], { vol: 0.035 });
        break;
      case 'shutdown':
        this.melody([['C5', 0, 0.6], ['G4', 0.25, 0.6], ['E4', 0.5, 0.6], ['C4', 0.75, 1.4]], { type: 'triangle', vol: 0.06 });
        break;
      default:
        break;
    }
  }

  // ——— Années 90 et 2000 ———

  winError() {
    this.tone({ freq: hz('A4'), release: 0.35, vol: 0.06 });
    this.tone({ freq: hz('E5'), release: 0.3, vol: 0.04 });
  }

  ding() {
    this.melody([['C6', 0, 0.5], ['G5', 0.12, 0.7]], { vol: 0.05 });
  }

  dtmf(key, at = 0, dur = 0.12) {
    const map = '123456789*0#';
    const i = map.indexOf(key);
    if (i < 0) return;
    const rows = [697, 770, 852, 941];
    const cols = [1209, 1336, 1477];
    this.tone({ freq: rows[Math.floor(i / 3)], at, attack: 0.003, hold: dur, release: 0.01, vol: 0.06 });
    this.tone({ freq: cols[i % 3], at, attack: 0.003, hold: dur, release: 0.01, vol: 0.06 });
  }

  // Poignée de main d'un modem 56k, recréée : renvoie { duration, stop }.
  modem(number = '0860199898') {
    const bus = this.bus(1);
    if (!bus) return { duration: 8.4, stop() {} };
    const dest = bus.node;
    const tone = (o) => this.tone({ dest, ...o });
    const noise = (o) => this.noise({ dest, ...o });
    // tonalité
    tone({ freq: 350, attack: 0.01, hold: 0.8, release: 0.02, vol: 0.05 });
    tone({ freq: 440, attack: 0.01, hold: 0.8, release: 0.02, vol: 0.05 });
    // numérotation
    [...number].forEach((digit, i) => {
      const at = 1 + i * 0.16;
      const map = '123456789*0#';
      const k = map.indexOf(digit);
      tone({ freq: [697, 770, 852, 941][Math.floor(k / 3)], at, hold: 0.09, release: 0.01, vol: 0.05 });
      tone({ freq: [1209, 1336, 1477][k % 3], at, hold: 0.09, release: 0.01, vol: 0.05 });
    });
    // tonalité de réponse
    tone({ freq: 2100, at: 3, attack: 0.02, hold: 1.1, release: 0.05, vol: 0.04 });
    // négociation : alternances et chuintements
    for (let i = 0; i < 6; i++) {
      tone({ freq: i % 2 ? 1180 : 980, at: 4.2 + i * 0.11, hold: 0.08, release: 0.02, vol: 0.035, type: 'square', filter: { freq: 2500 } });
    }
    for (let t = 4.9; t < 6.6; t += 0.12) {
      noise({ at: t, type: 'bandpass', freq: 700 + Math.random() * 2600, q: 3, hold: 0.09, release: 0.03, vol: 0.09 });
      if (Math.random() > 0.5) tone({ freq: 1200 + Math.random() * 1200, at: t, hold: 0.08, release: 0.02, vol: 0.02, type: 'square' });
    }
    tone({ freq: 1800, to: 2400, at: 6.6, hold: 0.4, release: 0.05, vol: 0.03, type: 'sawtooth', filter: { freq: 3000 } });
    noise({ at: 7, type: 'highpass', freq: 1500, attack: 0.05, hold: 1.1, release: 0.15, vol: 0.07 });
    return { duration: 8.4, stop: () => bus.stop() };
  }

  wizz() {
    if (!this.on) return;
    const t0 = this.now;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const depth = this.ctx.createGain();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 120;
    lfo.frequency.value = 28;
    depth.gain.value = 45;
    lfo.connect(depth).connect(osc.frequency);
    const lp = this.ctx.createBiquadFilter();
    lp.frequency.value = 1400;
    osc.connect(lp).connect(gain).connect(this.out);
    this.envelope(gain.gain, t0, { attack: 0.01, hold: 0.45, release: 0.15, vol: 0.09 });
    osc.start(t0);
    lfo.start(t0);
    osc.stop(t0 + 0.7);
    lfo.stop(t0 + 0.7);
    this.tone({ freq: 380, to: 1500, glide: 0.3, at: 0.45, release: 0.3, vol: 0.05, type: 'triangle' });
  }

  online() {
    this.melody([['G5', 0, 0.3], ['C6', 0.1, 0.3], ['E6', 0.2, 0.6]], { vol: 0.045, type: 'triangle' });
  }

  ringback(count = 1) {
    for (let i = 0; i < count; i++) {
      this.tone({ freq: 440, at: i * 2.2, attack: 0.02, hold: 1.4, release: 0.05, vol: 0.05 });
    }
  }

  unlock2007() {
    this.noise({ type: 'lowpass', freq: 1600, release: 0.04, vol: 0.12 });
    this.tone({ freq: 950, release: 0.05, vol: 0.05 });
  }

  // Ambiance de salle machine : souffle grave et relais.
  ambience() {
    const bus = this.bus(0.6);
    if (!bus) return () => {};
    const dest = bus.node;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    src.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.frequency.value = 180;
    const g = this.ctx.createGain();
    g.gain.value = 0.05;
    src.connect(lp).connect(g).connect(dest);
    src.start();
    const timer = setInterval(() => {
      if (Math.random() < 0.6) this.noise({ type: 'bandpass', freq: 3000, q: 8, release: 0.01, vol: 0.03, dest });
    }, 420);
    return () => {
      clearInterval(timer);
      bus.stop(0.3);
      setTimeout(() => src.stop(), 600);
    };
  }
}

export const audio = new Synth();
