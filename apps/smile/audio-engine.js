/**
 * audio-engine.js
 *
 * Self-contained melody engine driven by a "mood score" (-1 to +1).
 * Negative = minor/dark, positive = major/bright.
 *
 * Designed to be extensible:
 *   - Swap `currentVoice` to change synthesis style
 *   - Add new Voice classes and register them in VOICES
 *   - Override `scaleForMood()` to experiment with other scales
 */

// ── Scale definitions ────────────────────────────────────────────────────────

const SCALES = {
  // semitone intervals from root
  major:        [0, 2, 4, 5, 7, 9, 11],
  minor:        [0, 2, 3, 5, 7, 8, 10],
  dorian:       [0, 2, 3, 5, 7, 9, 10],
  phrygian:     [0, 1, 3, 5, 7, 8, 10],
  pentatonicMaj:[0, 2, 4, 7, 9],
  pentatonicMin:[0, 3, 5, 7, 10],
};

/** Return a scale interpolated between minor and major based on mood (-1…+1) */
function scaleForMood(mood) {
  // mood < -0.3  → minor
  // mood > +0.3  → major
  // in between   → dorian (neutral middle)
  if (mood < -0.3) return SCALES.minor;
  if (mood >  0.3) return SCALES.major;
  return SCALES.dorian;
}

// ── Note helpers ─────────────────────────────────────────────────────────────

const ROOT_MIDI = 60; // C4

function midiToHz(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function pickNote(scale, mood) {
  // Weight towards higher scale degrees when happy, lower when sad
  const weights = scale.map((_, i) => {
    const normalised = i / (scale.length - 1); // 0..1
    const bias = (mood + 1) / 2;               // 0..1
    return 0.2 + Math.abs(normalised - (1 - bias));
  });
  // Invert so closer-to-bias = higher weight
  const inverted = weights.map(w => 1 / (w + 0.01));
  const total = inverted.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < inverted.length; i++) {
    r -= inverted[i];
    if (r <= 0) return ROOT_MIDI + scale[i];
  }
  return ROOT_MIDI + scale[scale.length - 1];
}

// ── Voice: simple sine with envelope ─────────────────────────────────────────

class SineVoice {
  constructor(ctx, out) { this.ctx = ctx; this.out = out; }

  play(freq, duration, mood) {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(this.out);

    // Volume and timbre shift with mood
    const vol = 1.05 + Math.abs(mood) * 0.45;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const osc = ctx.createOscillator();
    osc.type = mood > 0.2 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }
}

// ── Voice: slightly richer with subtle detuned copy ──────────────────────────

class WarmVoice {
  constructor(ctx, out) { this.ctx = ctx; this.out = out; }

  play(freq, duration, mood) {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const vol = 0.75 + Math.abs(mood) * 0.30;

    for (const detune of [0, 5, -5]) {
      const gain = ctx.createGain();
      gain.connect(this.out);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol / 3, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detune, now);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    }
  }
}

// ── Registered voices ────────────────────────────────────────────────────────

export const VOICES = {
  sine: SineVoice,
  warm: WarmVoice,
  // add new Voice classes here and they'll appear automatically if you build a UI for them
};

// ── MelodyEngine ─────────────────────────────────────────────────────────────

export class MelodyEngine {
  constructor({ voiceName = 'warm' } = {}) {
    this.ctx = null;
    this.voiceName = voiceName;
    this.voice = null;
    this.mood = 0;           // -1 … +1
    this._timer = null;
    this._running = false;
    this._noteDuration = 0.5; // seconds
    this._bpm = 80;
    this._volume = 1.0;
    this._masterGain = null;
  }

  start() {
    if (this._running) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this._masterGain = this.ctx.createGain();
    this._masterGain.gain.value = this._volume;
    this._masterGain.connect(this.ctx.destination);
    this.voice = new VOICES[this.voiceName](this.ctx, this._masterGain);
    this._running = true;
    this._scheduleNext();
  }

  stop() {
    this._running = false;
    clearTimeout(this._timer);
    if (this.ctx) { this.ctx.close(); this.ctx = null; }
  }

  /** Update mood in real time (-1 = very sad, 0 = neutral, +1 = very happy) */
  setMood(score) {
    this.mood = Math.max(-1, Math.min(1, score));
    // Tempo speeds up slightly when happy
    this._bpm = 60 + Math.round((this.mood + 1) * 30); // 60–120 bpm
  }

  setVolume(value) {
    this._volume = Math.max(0, Math.min(1, value));
    if (this._masterGain) this._masterGain.gain.setTargetAtTime(this._volume, this.ctx.currentTime, 0.05);
  }

  setVoice(name) {
    if (!VOICES[name]) throw new Error(`Unknown voice: ${name}`);
    this.voiceName = name;
    if (this.ctx) this.voice = new VOICES[name](this.ctx);
  }

  _scheduleNext() {
    if (!this._running) return;
    const beatMs = (60 / this._bpm) * 1000;
    this._playNote();
    this._timer = setTimeout(() => this._scheduleNext(), beatMs);
  }

  _playNote() {
    const scale = scaleForMood(this.mood);
    const midi  = pickNote(scale, this.mood);
    const freq  = midiToHz(midi);
    const dur   = (60 / this._bpm) * 0.85; // slightly staccato
    this.voice.play(freq, dur, this.mood);
  }
}
