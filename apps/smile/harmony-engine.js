/**
 * harmony-engine.js
 *
 * Multi-user audio engine. Each slot gets a sawtooth oscillator pitched to its
 * harmony interval, fed through two bandpass formant filters — same voice
 * synthesis as the hand mode (VoiceSynth).
 *
 * Face mode  → mood score (-1…+1) maps to vowel openness (sad=mmm, happy=ahhh)
 * Hand mode  → openness (0…1) maps directly to vowel openness + volume
 */

const SLOT_CONFIG = [
  { degree: 0, octave: -1 }, // root,    bass
  { degree: 2, octave:  0 }, // third,   mid
  { degree: 4, octave:  0 }, // fifth,   mid
  { degree: 6, octave:  1 }, // seventh, high
];

const SCALES = {
  major:  [0, 2, 4, 5, 7, 9, 11, 12],
  dorian: [0, 2, 3, 5, 7, 9, 10, 12],
  minor:  [0, 2, 3, 5, 7, 8, 10, 12],
};

const ROOT_HZ = 130.81; // C3

function pickScale(avg) {
  if (avg >  0.25) return SCALES.major;
  if (avg < -0.25) return SCALES.minor;
  return SCALES.dorian;
}

function slotFreq(slot, scale) {
  const { degree, octave } = SLOT_CONFIG[slot % 4];
  const semitones = scale[Math.min(degree, scale.length - 1)] + octave * 12;
  return ROOT_HZ * Math.pow(2, semitones / 12);
}

// Normalise score to 0–1 openness depending on mode
function toOpenness(score, mode) {
  return mode === 'hand'
    ? Math.max(0, Math.min(1, score))       // hand: already 0–1
    : (score + 1) / 2;                      // face: -1…+1 → 0…1
}

export class HarmonyEngine {
  constructor() {
    this.ctx      = null;
    this._master  = null;
    this._reverb  = null;
    this._voices  = new Map();
    this._volume  = 1.0;
    this.mySlot   = null;
    this._lastUsers = [];
  }

  start() {
    this.ctx    = new (window.AudioContext || window.webkitAudioContext)();
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
    this._lastUsers = [];
  }

  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this._master) this._master.gain.setTargetAtTime(this._volume, this.ctx.currentTime, 0.05);
  }

  /** Called from WS state updates (all users) */
  updateUsers(users) {
    this._lastUsers = users;
    this._apply(users);
  }

  /** Called locally for immediate feedback on own slot — no WS wait */
  updateLocal(slot, score, mode) {
    if (slot === null) return;
    // Merge local update into last known state
    const others = this._lastUsers.filter(u => u.slot !== slot);
    this._apply([...others, { slot, score, mode }]);
  }

  _apply(users) {
    if (!this.ctx) return;
    const scale = pickScale(users.reduce((s, u) => s + u.score, 0) / (users.length || 1));
    const activeSlots = new Set(users.map(u => u.slot));

    for (const slot of this._voices.keys()) {
      if (!activeSlots.has(slot)) this._removeVoice(slot);
    }
    for (const user of users) {
      if (!this._voices.has(user.slot)) this._addVoice(user.slot);
      this._updateVoice(user, scale);
    }
  }

  _addVoice(slot) {
    const ctx = this.ctx;

    const osc = ctx.createOscillator();
    osc.type  = 'sawtooth';
    osc.frequency.value = 220;

    // Two formant bandpass filters — same approach as VoiceSynth
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass'; f1.frequency.value = 280; f1.Q.value = 8;

    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass'; f2.frequency.value = 900; f2.Q.value = 10;

    const merge = ctx.createGain();
    merge.gain.value = 1;

    const amp  = ctx.createGain();
    amp.gain.value = 0;

    const dry  = ctx.createGain(); dry.gain.value  = 0.7;
    const send = ctx.createGain(); send.gain.value = 0.3;

    osc.connect(f1); osc.connect(f2);
    f1.connect(merge); f2.connect(merge);
    merge.connect(amp);
    amp.connect(dry);  dry.connect(this._master);
    amp.connect(send); send.connect(this._reverb);

    osc.start();
    this._voices.set(slot, { osc, f1, f2, amp });
  }

  _removeVoice(slot) {
    const v = this._voices.get(slot);
    if (!v) return;
    const t = this.ctx.currentTime;
    v.amp.gain.setTargetAtTime(0, t, 0.3);
    setTimeout(() => { try { v.osc.stop(); } catch (_) {} }, 1000);
    this._voices.delete(slot);
  }

  _updateVoice(user, scale) {
    const v = this._voices.get(user.slot);
    if (!v) return;
    const t  = this.ctx.currentTime;
    const sm = 0.08;

    const open = toOpenness(user.score, user.mode);

    // Pitch — slot determines harmony interval
    v.osc.frequency.setTargetAtTime(slotFreq(user.slot, scale), t, sm);

    // Formants — same interpolation as VoiceSynth
    v.f1.frequency.setTargetAtTime(280 + open * 520,  t, sm); // 280→800
    v.f2.frequency.setTargetAtTime(900 + open * 500,  t, sm); // 900→1400
    v.f1.Q.setTargetAtTime(8  - open * 3, t, sm);
    v.f2.Q.setTargetAtTime(10 - open * 2, t, sm);

    // Volume — near-silent when closed, loud when open
    let vol = 0.01 + Math.pow(open, 1.4) * 0.6;
    if (user.slot === this.mySlot) vol *= 1.3;
    v.amp.gain.setTargetAtTime(vol, t, sm);
  }

  _makeReverb(duration) {
    const ctx = this.ctx;
    const len = ctx.sampleRate * duration;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.8);
    }
    const conv = ctx.createConvolver();
    conv.buffer = buf;
    return conv;
  }
}
