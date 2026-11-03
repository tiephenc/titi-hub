/**
 * TITI FM — the record player's music, composed live in the browser.
 *
 * A small generative lo-fi engine built on WebAudio: a jazzy chord loop on a
 * soft electric piano, a round bass, a swung drum kit, a sparse pentatonic
 * melody and vinyl crackle, all through a warm low-pass. No audio files, so
 * no licensing questions, and every listen is slightly different.
 *
 * Also hosts two ambient sounds (rain, the cat) that follow the Sound setting.
 * Nothing here ever starts by itself: every sound begins with a click.
 */

const BPM = 74;
const EIGHTH = 60 / BPM / 2;
const SWING = 0.17;

// Two progressions, alternating every four bars.
const PROGRESSIONS = [
  [
    { bass: 38, notes: [53, 57, 60, 64] }, // Dm9
    { bass: 43, notes: [53, 57, 59, 64] }, // G13
    { bass: 36, notes: [52, 55, 59, 62] }, // Cmaj9
    { bass: 45, notes: [52, 55, 60, 64] }, // Am7
  ],
  [
    { bass: 41, notes: [52, 57, 60, 64] }, // Fmaj7
    { bass: 40, notes: [50, 55, 59, 62] }, // Em7
    { bass: 38, notes: [53, 57, 60, 65] }, // Dm7
    { bass: 43, notes: [53, 55, 60, 62] }, // Gsus
  ],
];
const PENTA = [72, 74, 76, 79, 81, 84];

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

let ctx = null;
let master = null;
let musicBus = null;
let ambientBus = null;
let noiseBuf = null;
let crackleSrc = null;
let rainSrc = null;
let rainGain = null;
let timer = 0;
let playing = false;
let step = 0;
let nextTime = 0;
let volume = 0.6;
const listeners = new Set();

function ensure() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 1.5;
    master.connect(ctx.destination);

    // Music: everything goes through a warm low-pass and a gentle compressor.
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2600;
    lp.Q.value = 0.4;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(lp).connect(comp).connect(master);

    ambientBus = ctx.createGain();
    ambientBus.gain.value = 1;
    ambientBus.connect(master);

    // One second of white noise, reused by drums, crackle and rain.
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  } catch {
    ctx = null;
  }
  return ctx;
}

/** Resume a context the browser suspended until the visitor interacted. */
export function wake() {
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
}

function emit() {
  listeners.forEach((fn) => fn({ playing, volume }));
}

export function onMusicChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const isPlaying = () => playing;

/* ---------------------------------------------------------- instruments */

function env(gainNode, t, peak, attack, release) {
  const g = gainNode.gain;
  g.setValueAtTime(0.0001, t);
  g.exponentialRampToValueAtTime(peak, t + attack);
  g.exponentialRampToValueAtTime(0.0001, t + attack + release);
}

function epiano(note, t, dur, vel) {
  const f = midi(note);
  const out = ctx.createGain();
  env(out, t, 0.11 * vel, 0.012, dur);
  const a = ctx.createOscillator();
  a.type = "sine";
  a.frequency.value = f;
  const b = ctx.createOscillator();
  b.type = "triangle";
  b.frequency.value = f * 2.001;
  const bg = ctx.createGain();
  bg.gain.value = 0.18;
  // Tape wobble.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.6;
  const lg = ctx.createGain();
  lg.gain.value = 4;
  lfo.connect(lg).connect(a.detune);
  a.connect(out);
  b.connect(bg).connect(out);
  out.connect(musicBus);
  [a, b, lfo].forEach((o) => {
    o.start(t);
    o.stop(t + dur + 0.1);
  });
}

function bass(note, t, dur) {
  const o = ctx.createOscillator();
  o.type = "triangle";
  o.frequency.value = midi(note);
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 320;
  const g = ctx.createGain();
  env(g, t, 0.32, 0.02, dur);
  o.connect(f).connect(g).connect(musicBus);
  o.start(t);
  o.stop(t + dur + 0.1);
}

function kick(t) {
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(120, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
  const g = ctx.createGain();
  env(g, t, 0.55, 0.004, 0.22);
  o.connect(g).connect(musicBus);
  o.start(t);
  o.stop(t + 0.3);
}

function noise(t, dur, type, freq, q, peak) {
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  env(g, t, peak, 0.003, dur);
  s.connect(f).connect(g).connect(musicBus);
  s.start(t, Math.random() * 0.5);
  s.stop(t + dur + 0.05);
}

const snare = (t) => noise(t, 0.16, "bandpass", 1800, 0.7, 0.16);
const hat = (t, open) => noise(t, open ? 0.12 : 0.035, "highpass", 7000, 0.5, open ? 0.05 : 0.035);

function bell(note, t, dur, vel) {
  const o = ctx.createOscillator();
  o.type = "triangle";
  o.frequency.value = midi(note);
  const g = ctx.createGain();
  env(g, t, 0.05 * vel, 0.01, dur);
  o.connect(g).connect(musicBus);
  o.start(t);
  o.stop(t + dur + 0.1);
}

function startCrackle() {
  // Sparse clicks over a whisper of hiss, looped.
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    d[i] = (Math.random() * 2 - 1) * 0.012;
    if (Math.random() < 0.0004) d[i] = (Math.random() * 2 - 1) * 0.7;
  }
  crackleSrc = ctx.createBufferSource();
  crackleSrc.buffer = buf;
  crackleSrc.loop = true;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 900;
  const g = ctx.createGain();
  g.gain.value = 0.5;
  crackleSrc.connect(hp).connect(g).connect(musicBus);
  crackleSrc.start();
}

/* ----------------------------------------------------------- the sequencer */

function scheduleStep(n, t) {
  const bar = Math.floor(n / 8);
  const s = n % 8;
  const prog = PROGRESSIONS[Math.floor(bar / 4) % 2];
  const chord = prog[bar % 4];
  const tt = t + (s % 2 ? EIGHTH * SWING : 0);

  if (s === 0) {
    chord.notes.forEach((note, i) => epiano(note, tt + i * 0.018, EIGHTH * 7, 0.9 - i * 0.08));
    bass(chord.bass, tt, EIGHTH * 3);
  }
  if (s === 3 && Math.random() < 0.6) chord.notes.slice(1).forEach((note, i) => epiano(note + 12, tt + i * 0.012, EIGHTH * 2, 0.35));
  if (s === 4) bass(chord.bass + (Math.random() < 0.5 ? 7 : 12), tt, EIGHTH * 2.5);

  if (s === 0 || s === 5 || (s === 3 && Math.random() < 0.25)) kick(tt);
  if (s === 2 || s === 6) snare(tt);
  hat(tt, s === 7 && Math.random() < 0.3);

  if (bar % 2 === 1 && Math.random() < 0.32) {
    const note = PENTA[Math.floor(Math.random() * PENTA.length)];
    bell(note, tt, EIGHTH * (2 + Math.floor(Math.random() * 3)), 0.8);
  }
}

function tick() {
  const ahead = document.hidden ? 1.6 : 0.4;
  while (nextTime < ctx.currentTime + ahead) {
    scheduleStep(step, nextTime);
    step += 1;
    nextTime += EIGHTH;
  }
}

/* ------------------------------------------------------------------ API */

export function playMusic() {
  if (playing || !ensure()) return false;
  wake();
  playing = true;
  step = 0;
  nextTime = ctx.currentTime + 0.12;
  musicBus.gain.cancelScheduledValues(ctx.currentTime);
  musicBus.gain.setValueAtTime(0.0001, ctx.currentTime);
  musicBus.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), ctx.currentTime + 1.2);
  startCrackle();
  tick();
  timer = setInterval(tick, 90);
  emit();
  return true;
}

export function stopMusic() {
  if (!playing) return;
  playing = false;
  clearInterval(timer);
  const now = ctx.currentTime;
  musicBus.gain.cancelScheduledValues(now);
  musicBus.gain.setValueAtTime(Math.max(0.0001, musicBus.gain.value), now);
  musicBus.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  const src = crackleSrc;
  setTimeout(() => {
    try {
      src?.stop();
    } catch {
      /* already stopped */
    }
  }, 700);
  crackleSrc = null;
  emit();
}

export function toggleMusic() {
  if (playing) stopMusic();
  else playMusic();
  return playing;
}

export function setMusicVolume(v) {
  volume = Math.max(0, Math.min(1, Number(v)));
  if (ctx && playing) {
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setTargetAtTime(Math.max(0.0001, volume), ctx.currentTime, 0.08);
  }
  emit();
}

/** Rain ambience: filtered noise, only while Sound is on. */
export function setRainSound(on) {
  if (!on) {
    if (rainGain && ctx) rainGain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    return;
  }
  if (!ensure()) return;
  wake();
  if (!rainSrc) {
    rainSrc = ctx.createBufferSource();
    rainSrc.buffer = noiseBuf;
    rainSrc.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1400;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 300;
    rainGain = ctx.createGain();
    rainGain.gain.value = 0;
    rainSrc.connect(hp).connect(lp).connect(rainGain).connect(ambientBus);
    rainSrc.start();
  }
  rainGain.gain.setTargetAtTime(0.045, ctx.currentTime, 0.6);
}

/** A small synthetic meow. */
export function meow() {
  if (!ensure()) return;
  wake();
  const t = ctx.currentTime + 0.01;
  const o = ctx.createOscillator();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(520, t);
  o.frequency.linearRampToValueAtTime(880, t + 0.18);
  o.frequency.linearRampToValueAtTime(600, t + 0.45);
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.setValueAtTime(900, t);
  f.frequency.linearRampToValueAtTime(1500, t + 0.2);
  f.Q.value = 3;
  const g = ctx.createGain();
  env(g, t, 0.07, 0.05, 0.45);
  o.connect(f).connect(g).connect(ambientBus);
  o.start(t);
  o.stop(t + 0.6);
}

/** A sip of coffee. */
export function sipSound() {
  if (!ensure()) return;
  wake();
  const t = ctx.currentTime + 0.01;
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.setValueAtTime(600, t);
  f.frequency.exponentialRampToValueAtTime(2200, t + 0.25);
  f.Q.value = 4;
  const g = ctx.createGain();
  env(g, t, 0.08, 0.04, 0.25);
  s.connect(f).connect(g).connect(ambientBus);
  s.start(t);
  s.stop(t + 0.35);
}

/** Water poured on a plant. */
export function waterSound() {
  if (!ensure()) return;
  wake();
  const t = ctx.currentTime + 0.01;
  for (let i = 0; i < 6; i++) {
    const o = ctx.createOscillator();
    o.type = "sine";
    const tt = t + i * 0.07 + Math.random() * 0.03;
    o.frequency.setValueAtTime(900 + Math.random() * 700, tt);
    o.frequency.exponentialRampToValueAtTime(1800 + Math.random() * 600, tt + 0.05);
    const g = ctx.createGain();
    env(g, tt, 0.03, 0.005, 0.07);
    o.connect(g).connect(ambientBus);
    o.start(tt);
    o.stop(tt + 0.12);
  }
}
