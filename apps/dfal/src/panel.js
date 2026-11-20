// DFAL's front panel: every knob, switch and jack, in panel order.
// Knob values are kept as the knob shows them; voice.worklet.js turns them into sound.

const pct = (v) => `${Math.round(v * 100)}%`
const bip = (v) => (Math.abs(v) < 0.005 ? '0' : `${v > 0 ? '+' : '−'}${Math.round(Math.abs(v) * 100)}`)
const hz = (f) => (f >= 1000 ? `${(f / 1000).toFixed(f >= 10000 ? 1 : 2)}k` : f >= 100 ? `${Math.round(f)}` : f.toFixed(1)) + ' Hz'
const time = (s) => (s >= 1 ? `${s.toFixed(1)} s` : `${Math.round(s * 1000)} ms`)

// Curves shared with the worklet (keep these in step with voice.worklet.js)
export const curve = {
  tempo: (x) => 0.5 * 2 ** (x * 9), // 0.5 Hz to 256 Hz
  decay: (x) => 0.004 * 2 ** (x * 11), // 4 ms to 8 s
  vco: (x) => 8 * 2 ** (x * 10), // 8 Hz to 8 kHz
  cutoff: (x) => 20 * 2 ** (x * 10), // 20 Hz to 20 kHz
}

export const SECTIONS = [
  {
    id: 'clock',
    title: 'Sequencer',
    controls: [{ id: 'tempo', label: 'Tempo', def: 0.44, format: (x) => hz(curve.tempo(x)) }],
  },
  {
    id: 'vco',
    title: 'Oscillators',
    controls: [
      { id: 'vcoDecay', label: 'VCO decay', def: 0.32, format: (x) => time(curve.decay(x)) },
      { id: 'seqPitch', label: 'Seq pitch mod', type: 'switch', def: 'both', options: [['both', 'VCO 1 & 2'], ['off', 'Off'], ['vco2', 'VCO 2']] },
      { id: 'vco1Eg', label: 'VCO 1 EG amount', min: -1, def: 0.34, format: bip },
      { id: 'vco1Freq', label: 'VCO 1 frequency', def: 0.28, format: (x) => hz(curve.vco(x)) },
      { id: 'vco1Wave', label: 'VCO 1 wave', type: 'switch', def: 'tri', options: [['sq', 'Square'], ['tri', 'Triangle']] },
      { id: 'fm', label: '1 → 2 FM amount', def: 0, format: pct },
      { id: 'vco2Eg', label: 'VCO 2 EG amount', min: -1, def: 0.12, format: bip },
      { id: 'vco2Freq', label: 'VCO 2 frequency', def: 0.42, format: (x) => hz(curve.vco(x)) },
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
      { id: 'cutoff', label: 'Cutoff', def: 0.52, format: (x) => hz(curve.cutoff(x)) },
      { id: 'resonance', label: 'Resonance', def: 0.25, format: pct },
      { id: 'vcfEg', label: 'VCF EG amount', min: -1, def: 0.42, format: bip },
      { id: 'vcfDecay', label: 'VCF decay', def: 0.3, format: (x) => time(curve.decay(x)) },
      { id: 'vcfMod', label: 'Noise / VCF mod', min: -1, def: 0, format: bip },
    ],
  },
  {
    id: 'vca',
    title: 'Amplifier',
    controls: [
      { id: 'vcaAttack', label: 'VCA EG attack', type: 'switch', def: 'fast', options: [['fast', 'Fast'], ['slow', 'Slow']] },
      { id: 'vcaDecay', label: 'VCA decay', def: 0.38, format: (x) => time(curve.decay(x)) },
      { id: 'volume', label: 'Volume', def: 0.7, format: pct },
    ],
  },
]

export const CONTROLS = SECTIONS.flatMap((s) => s.controls)
export const DEFAULTS = Object.fromEntries(CONTROLS.map((c) => [c.id, c.def]))

export const STEP_COUNT = 8
export const formatPitch = (s) => (Math.abs(s) < 0.05 ? '0' : `${s > 0 ? '+' : '−'}${Math.abs(s).toFixed(Number.isInteger(Math.round(s * 10) / 10) ? 0 : 1)}`)
export const DEFAULT_STEPS = [
  { pitch: 0, vel: 1 },
  { pitch: 0, vel: 0.25 },
  { pitch: 7, vel: 0.6 },
  { pitch: 0, vel: 0.2 },
  { pitch: 12, vel: 0.9 },
  { pitch: 0, vel: 0.35 },
  { pitch: 5, vel: 0.7 },
  { pitch: -5, vel: 0.45 },
]

// The patch bay, three columns of eight like the original. Output jacks are
// the ones with a dark label. type: audio (stays in this window), cv or gate.
export const JACKS = [
  { id: 'trig', label: 'Trigger', dir: 'in', type: 'gate', help: 'A rising gate fires the envelopes, using the current step' },
  { id: 'vcaCv', label: 'VCA CV', dir: 'in', type: 'cv', help: 'Replaces the VCA envelope: 0 to 5 V' },
  { id: 'velocity', label: 'Velocity', dir: 'in', type: 'cv', help: 'Replaces the step velocity: 0 to 5 V' },
  { id: 'vcaEgOut', label: 'VCA EG', dir: 'out', type: 'cv', help: 'The VCA envelope times velocity, 0 to 5 V' },
  { id: 'extAudio', label: 'Ext audio', dir: 'in', type: 'audio', help: 'Replaces the noise in the mixer' },
  { id: 'vcfDecayCv', label: 'VCF decay', dir: 'in', type: 'cv', help: '+1 V doubles the VCF decay' },
  { id: 'noiseCv', label: 'Noise level', dir: 'in', type: 'cv', help: 'Adds to the noise / ext level: 5 V is full' },
  { id: 'vcoDecayCv', label: 'VCO decay', dir: 'in', type: 'cv', help: '+1 V doubles the VCO decay' },

  { id: 'vcfEgOut', label: 'VCF EG', dir: 'out', type: 'cv', help: 'The VCF envelope, 0 to 5 V' },
  { id: 'vcfModCv', label: 'VCF mod', dir: 'in', type: 'cv', help: 'Replaces the noise as the filter modulator; the Noise / VCF mod knob sets how much' },
  { id: 'vco1EgOut', label: 'VCO 1 EG', dir: 'out', type: 'cv', help: 'The VCO envelope times VCO 1 EG amount, ±5 V' },
  { id: 'vco1Cv', label: 'VCO 1 CV', dir: 'in', type: 'cv', help: '1 V per octave; replaces the sequencer pitch' },
  { id: 'fmCv', label: '1 → 2 FM amt', dir: 'in', type: 'cv', help: 'Adds to the FM amount: 5 V is full' },
  { id: 'vco2EgOut', label: 'VCO 2 EG', dir: 'out', type: 'cv', help: 'The VCO envelope times VCO 2 EG amount, ±5 V' },
  { id: 'vco2Cv', label: 'VCO 2 CV', dir: 'in', type: 'cv', help: '1 V per octave; replaces the sequencer pitch' },
  { id: 'vco1Out', label: 'VCO 1', dir: 'out', type: 'audio', help: 'VCO 1, ±5 V' },

  { id: 'vco2Out', label: 'VCO 2', dir: 'out', type: 'audio', help: 'VCO 2, ±5 V' },
  { id: 'vcaOut', label: 'VCA', dir: 'out', type: 'audio', help: 'The finished sound, before the volume knob' },
  { id: 'tempoCv', label: 'Tempo', dir: 'in', type: 'cv', help: '+1 V doubles the tempo' },
  { id: 'runStop', label: 'Run / stop', dir: 'in', type: 'gate', help: 'A rising gate starts or stops the sequencer' },
  { id: 'adv', label: 'Adv / clock', dir: 'in', type: 'gate', help: 'Replaces the tempo clock: each rising gate moves on a step and plays it' },
  { id: 'trigOut', label: 'Trigger', dir: 'out', type: 'gate', help: 'A 5 V, 5 ms pulse each time the envelopes fire' },
  { id: 'velOut', label: 'Velocity', dir: 'out', type: 'cv', help: 'The current step velocity, 0 to 5 V' },
  { id: 'pitchOut', label: 'Pitch', dir: 'out', type: 'cv', help: 'The current step pitch, 1 V per octave' },
]

export const IN_JACKS = JACKS.filter((j) => j.dir === 'in').map((j) => j.id)
export const OUT_JACKS = JACKS.filter((j) => j.dir === 'out').map((j) => j.id)
