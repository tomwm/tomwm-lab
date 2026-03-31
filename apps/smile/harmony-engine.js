/**
 * harmony-engine.js
 *
 * Multi-user audio engine. Each connected user occupies a "slot" (0–3)
 * corresponding to a harmony voice: root, third, fifth, seventh.
 *
 * Face mode  → score maps note position within the voice's octave range.
 *              Scores slowly shift which scale degree is played → evolving chord.
 * Hand mode  → score = openness = volume. Note is fixed to the slot's interval.
 *              Users collectively shape the chord's loudness with their hands.
 *
 * Extensible: add more scales in SCALES, add slots beyond 4, change voice type.
 */

// ── Scales ────────────────────────────────────────────────────────────────────

const SCALES = {
  major:  [0, 2, 4, 5, 7, 9, 11, 12],
  dorian: [0, 2, 3, 5, 7, 9, 10, 12],
  minor:  [0, 2, 3, 5, 7, 8, 10, 12],
};

function pickScale(avgScore) {
  if (avgScore >  0.25) return SCALES.major;
  if (avgScore < -0.25) return SCALES.minor;
  return SCALES.dorian;
}

// ── Slot configuration ────────────────────────────────────────────────────────
// Each slot: [chord degree index into scale, octave offset]
// Degree 0=root, 2=third, 4=fifth, 6=seventh

const SLOT_CONFIG = [
  { degree: 0, octave: -1 }, // slot 0 → root,    bass
  { degree: 2, octave:  0 }, // slot 1 → third,   mid
  { degree: 4, octave:  0 }, // slot 2 → fifth,   mid
  { degree: 6, octave:  1 }, // slot 3 → seventh, high
];

const ROOT_HZ = 130.81; // C3 as base

function slotFreq(slot, score, scale) {
  const cfg    = SLOT_CONFIG[slot % 4];
  const scale7 = scale;

  // score (-1..+1) nudges ±1 scale degree around the chord tone
  const degreeBase  = cfg.degree;
  const degreeShift = Math.round(score * 1.2); // gentle nudge
  const degree      = Math.max(0, Math.min(scale7.length - 1, degreeBase + degreeShift));

  const semitones = scale7[degree] + cfg.octave * 12;
  return ROOT_HZ * Math.pow(2, semitones / 12);
}

// ── HarmonyEngine ─────────────────────────────────────────────────────────────

export class HarmonyEngine {
  constructor() {
    this.ctx         = null;
    this._master     = null;
    this._reverb     = null;
    this._voices     = new Map(); // slot → VoiceNodes
    this._volume     = 1.0;
    this.mySlot      = null;
  }

  start() {
    this.ctx     = new (window.AudioContext || window.webkitAudioContext)();
    this._master = this.ctx.createGain();
    this._master.gain.value = this._volume;

    this._reverb = this._makeReverb(2.5);
    this._reverb.connect(this._master);
    this._master.connect(this.ctx.destination);
  }

  stop() {
    for (const slot of [...this._voices.keys()]) this._removeVoice(slot);
    this.ctx?.close();
    this.ctx = null;
  }

  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this._master) this._master.gain.setTargetAtTime(this._volume, this.ctx.currentTime, 0.05);
  }

  /**
   * Called whenever the server sends an updated users array.
   * users: [{ slot, score, mode }, …]
   */
  updateUsers(users) {
    if (!this.ctx) return;
    const scale    = pickScale(this._avgScore(users));
    const activeSlots = new Set(users.map(u => u.slot));

    // Remove voices for users who left
    for (const slot of this._voices.keys()) {
      if (!activeSlots.has(slot)) this._removeVoice(slot);
    }

    // Add / update voices
    for (const user of users) {
      if (!this._voices.has(user.slot)) this._addVoice(user.slot);
      this._updateVoice(user, scale);
    }
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  _avgScore(users) {
    if (!users.length) return 0;
    return users.reduce((s, u) => s + u.score, 0) / users.length;
  }

  _addVoice(slot) {
    const ctx = this.ctx;

    const osc  = ctx.createOscillator();
    osc.type   = 'sawtooth';
    osc.frequency.value = 220;

    // Warm low-pass filter
    const filt = ctx.createBiquadFilter();
    filt.type  = 'lowpass';
    filt.frequency.value = 900;
    filt.Q.value = 0.8;

    const dry  = ctx.createGain();
    dry.gain.value = 0;

    const send = ctx.createGain(); // reverb send
    send.gain.value = 0;

    osc.connect(filt);
    filt.connect(dry);
    filt.connect(send);
    dry.connect(this._master);
    send.connect(this._reverb);

    osc.start();

    this._voices.set(slot, { osc, filt, dry, send });
  }

  _removeVoice(slot) {
    const v = this._voices.get(slot);
    if (!v) return;
    const t = this.ctx.currentTime;
    v.dry.gain.setTargetAtTime(0, t, 0.3);
    v.send.gain.setTargetAtTime(0, t, 0.3);
    setTimeout(() => { try { v.osc.stop(); } catch (_) {} }, 1000);
    this._voices.delete(slot);
  }

  _updateVoice(user, scale) {
    const v   = this._voices.get(user.slot);
    if (!v)   return;
    const ctx = this.ctx;
    const t   = ctx.currentTime;
    const sm  = 0.15; // smoothing

    const freq = slotFreq(user.slot, user.score, scale);
    v.osc.frequency.setTargetAtTime(freq, t, sm);

    let dryVol, wetVol;

    if (user.mode === 'hand') {
      // openness (score 0–1) drives volume directly
      const open = Math.max(0, user.score);
      dryVol = Math.pow(open, 1.4) * 0.35;
      wetVol = Math.pow(open, 1.4) * 0.20;
      // Filter opens with the mouth
      v.filt.frequency.setTargetAtTime(400 + open * 2400, t, sm);
    } else {
      // Face mode: always audible, intensity from abs(score)
      const intensity = 0.5 + Math.abs(user.score) * 0.5;
      dryVol = 0.12 * intensity;
      wetVol = 0.08 * intensity;
      v.filt.frequency.setTargetAtTime(800 + Math.abs(user.score) * 600, t, sm);
    }

    // My own voice is slightly louder so I can hear myself
    if (user.slot === this.mySlot) {
      dryVol *= 1.3;
      wetVol *= 1.3;
    }

    v.dry.gain.setTargetAtTime(dryVol, t, sm);
    v.send.gain.setTargetAtTime(wetVol, t, sm);
  }

  _makeReverb(duration) {
    const ctx     = this.ctx;
    const len     = ctx.sampleRate * duration;
    const impulse = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = impulse.getChannelData(c);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.8);
      }
    }
    const conv = ctx.createConvolver();
    conv.buffer = impulse;
    return conv;
  }
}
