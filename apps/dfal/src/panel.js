// DFAL's front panel: every knob, switch and jack, in panel order.
// Knob values are kept as the knob shows them; voice.worklet.js turns them into sound.
// Ranges, jacks and normals follow the DFAM owner's manual (Moog, 2017); page
// numbers refer to it. Values the manual doesn't give are marked "estimate".

const pct = (v) => `${Math.round(v * 100)}%`
const bip = (v) => (Math.abs(v) < 0.005 ? '0' : `${v > 0 ? '+' : '−'}${Math.round(Math.abs(v) * 100)}`)
const hz = (f) => (f >= 1000 ? `${(f / 1000).toFixed(f >= 10000 ? 1 : 2)}k` : f >= 100 ? `${Math.round(f)}` : f.toFixed(1)) + ' Hz'
const time = (s) => (s >= 1 ? `${s.toFixed(1)} s` : `${Math.round(s * 1000)} ms`)

// Curves shared with the worklet (keep these in step with voice.worklet.js)
export const curve = {
  tempo: (x) => 0.7 * 2 ** (x * 9.97), // 0.7 Hz to 700 Hz (p. 23)
  decay: (x) => 0.01 * 2 ** (x * 9.97), // 10 ms to 10 s (p. 19)
  vco: (x) => 4.9 * 2 ** (x * 10), // ten octaves (p. 13), about 5 Hz to 5 kHz (placement is an estimate)
  cutoff: (x) => 20 * 2 ** (x * 10), // 20 Hz to 20 kHz (p. 18)
}
// Knob positions read as clock positions: 7 o'clock is 0, 12 is 0.5, 5 o'clock is 1

export const SECTIONS = [
  {
    id: 'clock',
    title: 'Sequencer',
    controls: [{ id: 'tempo', label: 'Tempo', def: 0.38, format: (x) => hz(curve.tempo(x)) }],
  },
  {
    id: 'vco',
    title: 'Oscillators',
    controls: [
      { id: 'vcoDecay', label: 'VCO decay', def: 0.2, format: (x) => time(curve.decay(x)) },
      { id: 'seqPitch', label: 'Seq pitch mod', type: 'switch', def: 'both', options: [['both', 'VCO 1 & 2'], ['off', 'Off'], ['vco2', 'VCO 2']] },
      { id: 'vco1Eg', label: 'VCO 1 EG amount', min: -1, def: 0.6, format: bip },
      { id: 'vco1Freq', label: 'VCO 1 frequency', def: 0.35, format: (x) => hz(curve.vco(x)) },
      { id: 'vco1Wave', label: 'VCO 1 wave', type: 'switch', def: 'tri', options: [['sq', 'Square'], ['tri', 'Triangle']] },
      { id: 'fm', label: '1 → 2 FM amount', def: 0, format: pct },
      { id: 'vco2Eg', label: 'VCO 2 EG amount', min: -1, def: 0.2, format: bip },
      { id: 'vco2Freq', label: 'VCO 2 frequency', def: 0.45, format: (x) => hz(curve.vco(x)) },
      { id: 'vco2Wave', label: 'VCO 2 wave', type: 'switch', def: 'sq', options: [['sq', 'Square'], ['tri', 'Triangle']] },
      { id: 'sync', label: 'Hard sync', type: 'switch', def: 'off', options: [['off', 'Off'], ['on', 'On']] },
    ],
  },
  {
    id: 'mix',
    title: 'Mixer',
    controls: [
      { id: 'vco1Level', label: 'VCO 1', def: 0.8, format: pct },
      { id: 'noiseLevel', label: 'Noise / ext', def: 0.1, format: pct },
      { id: 'vco2Level', label: 'VCO 2', def: 0.3, format: pct },
    ],
  },
  {
    id: 'vcf',
    title: 'Filter',
    controls: [
      { id: 'vcfMode', label: 'VCF mode', type: 'switch', def: 'lp', options: [['hp', 'High pass'], ['lp', 'Low pass']] },
      { id: 'cutoff', label: 'Cutoff', def: 0.4, format: (x) => hz(curve.cutoff(x)) },
      { id: 'resonance', label: 'Resonance', def: 0.2, format: pct },
      { id: 'vcfEg', label: 'VCF EG amount', min: -1, def: 0.6, format: bip },
      { id: 'vcfDecay', label: 'VCF decay', def: 0.3, format: (x) => time(curve.decay(x)) },
      { id: 'vcfMod', label: 'Noise / VCF mod', def: 0, format: pct }, // turns one way only (p. 20)
    ],
  },
  {
    id: 'vca',
    title: 'Amplifier',
    controls: [
      { id: 'vcaAttack', label: 'VCA EG attack', type: 'switch', def: 'fast', options: [['fast', 'Fast'], ['slow', 'Slow']] },
      { id: 'vcaDecay', label: 'VCA decay', def: 0.32, format: (x) => time(curve.decay(x)) },
      { id: 'volume', label: 'Volume', def: 0.7, format: pct },
    ],
  },
]

export const CONTROLS = SECTIONS.flatMap((s) => s.controls)
export const DEFAULTS = Object.fromEntries(CONTROLS.map((c) => [c.id, c.def]))

export const STEP_COUNT = 8
export const PITCH_RANGE = 60 // semitones either way: the pitch knobs span ±5 V, about ten octaves (p. 22)
export const formatPitch = (s) => (Math.abs(s) < 0.05 ? '0' : `${s > 0 ? '+' : '−'}${Math.abs(s).toFixed(Number.isInteger(Math.round(s * 10) / 10) ? 0 : 1)}`)
export const DEFAULT_STEPS = [
  { pitch: 0, vel: 1 },
  { pitch: 0, vel: 0.35 },
  { pitch: 3, vel: 0.65 },
  { pitch: 0, vel: 0.3 },
  { pitch: 7, vel: 0.9 },
  { pitch: 0, vel: 0.4 },
  { pitch: 5, vel: 0.75 },
  { pitch: -2, vel: 0.5 },
]

// The patch bay: 15 inputs and 9 outputs (p. 24), listed row by row, three to a
// row as on the panel, with outputs on the right. type: audio, cv or gate.
export const JACKS = [
  { id: 'trig', label: 'Trigger', dir: 'in', type: 'gate', help: 'Fires all three envelopes at the current step velocity, without advancing. Normalled to the sequencer clock, so patching it takes over firing. 0 to 5 V' },
  { id: 'vcaCv', label: 'VCA CV', dir: 'in', type: 'cv', help: 'Summed with the VCA envelope; can clip the VCA. 0 to 8 V' },
  { id: 'vcaOut', label: 'VCA', dir: 'out', type: 'audio', help: 'The main output, after the VOLUME knob. ±5 V' },

  { id: 'velocity', label: 'Velocity', dir: 'in', type: 'cv', help: 'Sets the envelopes\' maximum level, replacing the step velocity knobs. 0 to 5 V' },
  { id: 'vcaDecayCv', label: 'VCA decay', dir: 'in', type: 'cv', help: 'Summed with the VCA DECAY knob; set the knob to the middle for the widest range. ±5 V' },
  { id: 'vcaEgOut', label: 'VCA EG', dir: 'out', type: 'cv', help: 'The VCA envelope, scaled by velocity. 0 to 8 V' },

  { id: 'extAudio', label: 'Ext audio', dir: 'in', type: 'audio', help: 'Replaces the noise in the mixer; NOISE / EXT LEVEL sets its level. 10 V peak to peak' },
  { id: 'vcfDecayCv', label: 'VCF decay', dir: 'in', type: 'cv', help: 'Summed with the VCF DECAY knob. ±5 V' },
  { id: 'vcfEgOut', label: 'VCF EG', dir: 'out', type: 'cv', help: 'The VCF envelope, scaled by velocity. 0 to 8 V' },

  { id: 'noiseCv', label: 'Noise level', dir: 'in', type: 'cv', help: 'Added to the NOISE / EXT LEVEL knob; can clip. 0 to 8 V' },
  { id: 'vcoDecayCv', label: 'VCO decay', dir: 'in', type: 'cv', help: 'Summed with the VCO DECAY knob. ±5 V' },
  { id: 'vcoEgOut', label: 'VCO EG', dir: 'out', type: 'cv', help: 'The VCO envelope, scaled by velocity. 0 to 8 V' },

  { id: 'vcfModCv', label: 'VCF mod', dir: 'in', type: 'cv', help: 'Replaces the noise as the cutoff modulator; the NOISE / VCF MOD knob sets how much (full turn for 1 V/oct). ±5 V' },
  { id: 'vco1Cv', label: 'VCO 1 CV', dir: 'in', type: 'cv', help: '1 V/oct, summed with the knob, EG and sequencer pitch. ±5 V' },
  { id: 'vco1Out', label: 'VCO 1', dir: 'out', type: 'audio', help: 'Oscillator 1. ±5 V' },

  { id: 'fmCv', label: '1 → 2 FM amt', dir: 'in', type: 'cv', help: 'Summed with the 1 → 2 FM AMOUNT knob (linear FM). 0 to 8 V' },
  { id: 'vco2Cv', label: 'VCO 2 CV', dir: 'in', type: 'cv', help: '1 V/oct, summed with the knob, EG and sequencer pitch. ±5 V' },
  { id: 'vco2Out', label: 'VCO 2', dir: 'out', type: 'audio', help: 'Oscillator 2. ±5 V' },

  { id: 'tempoCv', label: 'Tempo', dir: 'in', type: 'cv', help: '1 V/oct on the clock, summed with the TEMPO knob, up to audio rate. ±5 V' },
  { id: 'runStop', label: 'Run / stop', dir: 'in', type: 'gate', help: 'A gate: the sequencer runs while it is high and stops when it falls. 0 to 5 V' },
  { id: 'adv', label: 'Adv / clock', dir: 'in', type: 'gate', help: 'Each rising edge moves on a step while the sequencer runs; the TEMPO knob is ignored. 0 to 5 V' },

  { id: 'trigOut', label: 'Trigger', dir: 'out', type: 'gate', help: 'A pulse each time the envelopes fire, about 1 ms. 0 to 5 V' },
  { id: 'velOut', label: 'Velocity', dir: 'out', type: 'cv', help: 'The current step velocity. 0 to 5 V' },
  { id: 'pitchOut', label: 'Pitch', dir: 'out', type: 'cv', help: 'The current step pitch, even with SEQ PITCH MOD off. ±5 V' },
]

export const IN_JACKS = JACKS.filter((j) => j.dir === 'in').map((j) => j.id)
export const OUT_JACKS = JACKS.filter((j) => j.dir === 'out').map((j) => j.id)
