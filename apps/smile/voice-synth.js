/**
 * voice-synth.js
 *
 * Continuous formant synthesiser.
 * openness 0 → "mmm" (mouth closed, nasal, muffled, quiet)
 * openness 1 → "ahhh" (mouth open, full vowel, loud)
 *
 * Uses a sawtooth oscillator (voice-like source) fed through two bandpass
 * filters tuned to the first two formant frequencies of each vowel.
 *
 * Extensible: swap _osc.type, change FORMANTS, add more filter bands.
 */

const FORMANTS = {
  //        F1    F2    Q1   Q2
  closed: [ 280,  900,   8,  10 ],
  open:   [ 800, 1200,   5,   8 ],
};

export class VoiceSynth {
  constructor() {
    this.ctx         = null;
    this._osc        = null;
    this._f1         = null;
    this._f2         = null;
    this._ampGain    = null;
    this._masterGain = null;
    this._volume     = 1.0;
    this._openness   = 0;
  }

  start() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    this._masterGain = this.ctx.createGain();
    this._masterGain.gain.value = this._volume;
    this._masterGain.connect(this.ctx.destination);

    // Sawtooth → voice-like harmonic source
    this._osc = this.ctx.createOscillator();
    this._osc.type = 'sawtooth';
    this._osc.frequency.value = 140; // ~low speaking pitch

    // Formant 1
    this._f1 = this.ctx.createBiquadFilter();
    this._f1.type = 'bandpass';
    this._f1.frequency.value = FORMANTS.closed[0];
    this._f1.Q.value         = FORMANTS.closed[2];

    // Formant 2
    this._f2 = this.ctx.createBiquadFilter();
    this._f2.type = 'bandpass';
    this._f2.frequency.value = FORMANTS.closed[1];
    this._f2.Q.value         = FORMANTS.closed[3];

    // Amplitude controlled by openness
    this._ampGain = this.ctx.createGain();
    this._ampGain.gain.value = 0.01; // silent when closed

    // Routing: osc → [f1, f2] → merge → ampGain → master → out
    const merge = this.ctx.createGain();
    merge.gain.value = 1;

    this._osc.connect(this._f1);
    this._osc.connect(this._f2);
    this._f1.connect(merge);
    this._f2.connect(merge);
    merge.connect(this._ampGain);
    this._ampGain.connect(this._masterGain);

    this._osc.start();
  }

  stop() {
    try { this._osc?.stop(); } catch (_) {}
    this.ctx?.close();
    this.ctx = null;
  }

  /** openness: 0 = closed/mmm, 1 = open/ahhh */
  setOpenness(value) {
    if (!this.ctx) return;
    this._openness = value;
    const t  = this.ctx.currentTime;
    const sm = 0.06; // smoothing time constant (seconds)

    const { closed, open } = FORMANTS;
    const lerp = (a, b) => a + (b - a) * value;

    this._f1.frequency.setTargetAtTime(lerp(closed[0], open[0]), t, sm);
    this._f2.frequency.setTargetAtTime(lerp(closed[1], open[1]), t, sm);
    this._f1.Q.setTargetAtTime(lerp(closed[2], open[2]), t, sm);
    this._f2.Q.setTargetAtTime(lerp(closed[3], open[3]), t, sm);

    // Volume: near-silent when closed, loud when open
    const amp = 0.01 + Math.pow(value, 1.5) * 0.85;
    this._ampGain.gain.setTargetAtTime(amp, t, sm);
  }

  setVolume(value) {
    this._volume = Math.max(0, Math.min(1, value));
    if (this._masterGain) {
      this._masterGain.gain.setTargetAtTime(this._volume, this.ctx.currentTime, 0.05);
    }
  }
}
