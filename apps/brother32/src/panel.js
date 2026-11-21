// Brother 32's front panel: knobs, switches and patch-bay jacks, in panel order.

const pct = (v) => `${Math.round(v * 100)}%`
const bip = (v) => (Math.abs(v) < 0.005 ? '0' : `${v > 0 ? '+' : '−'}${Math.round(Math.abs(v) * 100)}`)
const hz = (f) => (f >= 1000 ? `${(f / 1000).toFixed(f >= 10000 ? 1 : 2)}k` : f >= 100 ? `${Math.round(f)}` : f >= 10 ? f.toFixed(1) : f.toFixed(2)) + ' Hz'
const time = (s) => (s >= 1 ? `${s.toFixed(1)} s` : `${Math.round(s * 1000)} ms`)

// Curves shared with the worklet (keep these in step with voice.worklet.js)
export const curve = {
  bpm: (x) => 20 * 2 ** (x * 3.9), // 20 to 300 bpm, four steps a beat
  vcoOct: (x) => (x - 0.5) * 6, // ±3 octaves around C2
  cutoff: (x) => 20 * 2 ** (x * 10),
  lfo: (x) => 0.05 * 2 ** (x * 13), // 0.05 Hz to 400 Hz
  env: (x) => 0.001 * 2 ** (x * 13.3), // 1 ms to 10 s
  glide: (x) => x * x * 1.5, // 0 to 1.5 s
}
const C2 = 65.406
const noteName = (semis) => {
  const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
  const n = Math.round(semis)
  return `${names[((n % 12) + 12) % 12]}${2 + Math.floor(n / 12)}`
}
export { noteName }

export const SECTIONS = [
  {
    id: 'vco',
    title: 'Oscillator',
    controls: [
      { id: 'vcoFreq', label: 'Frequency', def: 0.5, format: (x) => hz(C2 * 2 ** curve.vcoOct(x)) },
      { id: 'pw', label: 'Pulse width', def: 0.5, format: (x) => `${Math.round((0.05 + x * 0.9) * 100)}%` },
      { id: 'vcoWave', label: 'VCO wave', type: 'switch', def: 'saw', options: [['saw', 'Saw'], ['pulse', 'Pulse']] },
      { id: 'vcoModAmt', label: 'VCO mod amount', def: 0, format: pct },
      { id: 'vcoModSrc', label: 'VCO mod source', type: 'switch', def: 'lfo', options: [['eg', 'EG'], ['lfo', 'LFO']] },
      { id: 'vcoModDest', label: 'VCO mod dest', type: 'switch', def: 'freq', options: [['freq', 'Freq'], ['pw', 'Pulse W']] },
      { id: 'glide', label: 'Glide', def: 0, format: (x) => time(curve.glide(x)) },
    ],
  },
  {
    id: 'mix',
    title: 'Mixer',
    controls: [{ id: 'mix', label: 'VCO ↔ noise', def: 0, format: (x) => (x < 0.01 ? 'VCO' : x > 0.99 ? 'Noise' : `${Math.round(x * 100)}% n`) }],
  },
  {
    id: 'vcf',
    title: 'Filter',
    controls: [
      { id: 'cutoff', label: 'Cutoff', def: 0.42, format: (x) => hz(curve.cutoff(x)) },
      { id: 'resonance', label: 'Resonance', def: 0.45, format: pct },
      { id: 'vcfMode', label: 'VCF mode', type: 'switch', def: 'lp', options: [['hp', 'High pass'], ['lp', 'Low pass']] },
      { id: 'vcfModAmt', label: 'VCF mod amount', min: -1, def: 0.45, format: bip },
      { id: 'vcfModSrc', label: 'VCF mod source', type: 'switch', def: 'eg', options: [['eg', 'EG'], ['lfo', 'LFO']] },
    ],
  },
  {
    id: 'eg',
    title: 'Envelope and VCA',
    controls: [
      { id: 'attack', label: 'Attack', def: 0.05, format: (x) => time(curve.env(x)) },
      { id: 'decay', label: 'Decay', def: 0.5, format: (x) => time(curve.env(x)) },
      { id: 'sustain', label: 'Sustain', type: 'switch', def: 'off', options: [['on', 'On'], ['off', 'Off']] },
      { id: 'vcaMode', label: 'VCA mode', type: 'switch', def: 'eg', options: [['on', 'On'], ['eg', 'Fast env']] },
      { id: 'volume', label: 'Volume', def: 0.7, format: pct },
    ],
  },
  {
    id: 'lfo',
    title: 'LFO',
    controls: [
      { id: 'lfoRate', label: 'LFO rate', def: 0.3, format: (x) => hz(curve.lfo(x)) },
      { id: 'lfoWave', label: 'LFO wave', type: 'switch', def: 'tri', options: [['tri', 'Triangle'], ['sq', 'Square']] },
    ],
  },
  {
    id: 'util',
    title: 'Sequencer and utilities',
    controls: [
      { id: 'tempo', label: 'Tempo', def: 0.69, format: (x) => `${Math.round(curve.bpm(x))} bpm` },
      { id: 'gateLen', label: 'Gate length', def: 0.5, format: pct },
      { id: 'vcMix', label: 'VC mix', def: 0.5, format: pct },
      { id: 'atten', label: 'Attenuator', def: 1, format: pct },
      { id: 'assign', label: 'Assign out', type: 'switch', def: 'accent', options: [['accent', 'Accent'], ['clock', 'Clock'], ['lfoSaw', 'LFO saw']] },
    ],
  },
]

export const CONTROLS = SECTIONS.flatMap((s) => s.controls)
export const DEFAULTS = Object.fromEntries(CONTROLS.map((c) => [c.id, c.def]))

// A step: note in semitones above C2, gate on / tie (held into the next step) / rest,
// accent, glide into it, and how many times it repeats (ratchet).
export const MAX_STEPS = 32
const s = (note, gate = 'on', extra = {}) => ({ note, gate, accent: false, glide: false, ratchet: 1, ...extra })
export const DEFAULT_PATTERN = {
  length: 16,
  steps: [
    s(0, 'on', { accent: true }), s(0), s(12, 'on', { glide: true }), s(0, 'rest'),
    s(10), s(0, 'tie'), s(0), s(7, 'on', { accent: true }),
    s(0), s(3, 'on', { glide: true }), s(0, 'rest'), s(12, 'on', { ratchet: 2 }),
    s(0), s(5), s(7, 'on', { accent: true, glide: true }), s(10),
    ...Array.from({ length: 16 }, () => s(0)),
  ],
}

// The patch bay. type: audio, cv or gate.
export const JACKS = [
  { id: 'extAudio', label: 'Ext audio', dir: 'in', type: 'audio', help: 'Replaces the noise in the mixer' },
  { id: 'mixCv', label: 'Mix CV', dir: 'in', type: 'cv', help: 'Adds to the VCO ↔ noise mix: 5 V moves it all the way' },
  { id: 'vcaCv', label: 'VCA CV', dir: 'in', type: 'cv', help: 'Replaces the envelope as the VCA control: 0 to 5 V' },
  { id: 'cutoffCv', label: 'VCF cutoff', dir: 'in', type: 'cv', help: '1 V per octave, added to the cutoff' },
  { id: 'resCv', label: 'VCF res', dir: 'in', type: 'cv', help: 'Adds to the resonance: 5 V is full' },
  { id: 'linFm', label: 'VCO lin FM', dir: 'in', type: 'audio', help: 'Linear frequency modulation, through zero' },
  { id: 'pitchCv', label: 'VCO 1V/oct', dir: 'in', type: 'cv', help: 'Replaces the keyboard and sequencer pitch: 1 V per octave, 0 V is C2' },
  { id: 'vcoModCv', label: 'VCO mod', dir: 'in', type: 'cv', help: 'Replaces the VCO mod source; the amount knob still applies' },

  { id: 'lfoRateCv', label: 'LFO rate', dir: 'in', type: 'cv', help: '+1 V doubles the LFO rate' },
  { id: 'mix1', label: 'Mix 1', dir: 'in', type: 'cv', help: 'First input of the VC mixer (5 V when unpatched)' },
  { id: 'mix2', label: 'Mix 2', dir: 'in', type: 'cv', help: 'Second input of the VC mixer (0 V when unpatched)' },
  { id: 'vcMixCtrl', label: 'VC mix ctrl', dir: 'in', type: 'cv', help: 'Adds to the VC mix knob: 5 V moves it all the way' },
  { id: 'gateIn', label: 'Gate', dir: 'in', type: 'gate', help: 'Plays the envelope while high, alongside the sequencer and keyboard' },
  { id: 'tempoIn', label: 'Tempo', dir: 'in', type: 'gate', help: 'A clock: each rising gate moves the sequencer on a step' },
  { id: 'runStop', label: 'Run / stop', dir: 'in', type: 'gate', help: 'A rising gate starts or stops the sequencer' },
  { id: 'resetIn', label: 'Reset', dir: 'in', type: 'gate', help: 'A rising gate sends the sequencer back to step 1' },

  { id: 'holdIn', label: 'Hold', dir: 'in', type: 'gate', help: 'While high, the sequencer stays on its current step' },
  { id: 'attenIn', label: 'Atten', dir: 'in', type: 'cv', help: 'Into the attenuator (5 V when unpatched)' },
  { id: 'multIn', label: 'Mult', dir: 'in', type: 'cv', help: 'Copied to both Mult outputs' },
  { id: 'vcaOut', label: 'VCA', dir: 'out', type: 'audio', help: 'The finished sound, before the volume knob' },
  { id: 'noiseOut', label: 'Noise', dir: 'out', type: 'audio', help: 'White noise, ±5 V' },
  { id: 'vcfOut', label: 'VCF', dir: 'out', type: 'audio', help: 'The filter, before the VCA' },
  { id: 'sawOut', label: 'VCO saw', dir: 'out', type: 'audio', help: 'Sawtooth, ±5 V' },
  { id: 'pulseOut', label: 'VCO pulse', dir: 'out', type: 'audio', help: 'Pulse, ±5 V' },

  { id: 'lfoTriOut', label: 'LFO tri', dir: 'out', type: 'cv', help: 'Triangle, ±5 V' },
  { id: 'lfoSqOut', label: 'LFO sq', dir: 'out', type: 'cv', help: 'Square, 0 to 5 V' },
  { id: 'vcMixOut', label: 'VC mix', dir: 'out', type: 'cv', help: 'Mix 1 and Mix 2, blended by the VC mix knob and its CV' },
  { id: 'mult1', label: 'Mult 1', dir: 'out', type: 'cv', help: 'A copy of the Mult input' },
  { id: 'mult2', label: 'Mult 2', dir: 'out', type: 'cv', help: 'A copy of the Mult input' },
  { id: 'assignOut', label: 'Assign', dir: 'out', type: 'cv', help: 'Accent (5 V on accented steps), a clock pulse each step, or a rising LFO ramp: set by the Assign switch' },
  { id: 'egOut', label: 'EG', dir: 'out', type: 'cv', help: 'The envelope, 0 to 5 V' },
  { id: 'kbOut', label: 'KB', dir: 'out', type: 'cv', help: 'The keyboard and sequencer pitch after glide, 1 V per octave' },
  { id: 'gateOut', label: 'Gate', dir: 'out', type: 'gate', help: 'The keyboard and sequencer gate, 5 V' },
  { id: 'attenOut', label: 'Atten', dir: 'out', type: 'cv', help: 'The attenuator: its input times the Attenuator knob' },
]
