// Brother 32's voice and sequencer, sample by sample, on the audio thread.
// One VCO (saw and pulse, with PWM and linear FM) and noise feed a mixer, a
// four-pole ladder filter (low or high pass) and a VCA, shaped by an
// attack-decay envelope with a sustain switch and a triangle/square LFO.
// A 32-step sequencer (notes, rests, ties, accents, glides, ratchets) and a
// keyboard play it. Every patch-bay jack is a signal here, in volts.
//
// Messages in: params, pattern, octave, key, run, reset, routes, and the patch
// bus's own (see bus-worklet.js). Messages out: step, running, sig.

import { BusIO } from '../../dfal/src/bus-worklet.js'

const curve = {
  bpm: (x) => 20 * 2 ** (x * 3.9),
  vcoOct: (x) => (x - 0.5) * 6,
  cutoff: (x) => 20 * 2 ** (x * 10),
  lfo: (x) => 0.05 * 2 ** (x * 13),
  env: (x) => 0.001 * 2 ** (x * 13.3),
  glide: (x) => x * x * 1.5,
}
const C2 = 65.406
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x)
const LN1000 = Math.log(1000)

function blep(t, dt) {
  if (t < dt) {
    t /= dt
    return t + t - t * t - 1
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt
    return t * t + t + t + 1
  }
  return 0
}

class Edge {
  constructor() {
    this.high = false
  }
  // Returns 1 on a rising edge, -1 on a falling edge, else 0
  edge(v) {
    if (!this.high && v > 1.5) {
      this.high = true
      return 1
    }
    if (this.high && v < 0.7) {
      this.high = false
      return -1
    }
    return 0
  }
}

const SMOOTHED = ['vcoFreq', 'pw', 'vcoModAmt', 'glide', 'mix', 'cutoff', 'resonance', 'vcfModAmt', 'attack', 'decay', 'volume',
  'lfoRate', 'tempo', 'gateLen', 'vcMix', 'atten']

class BrotherVoice extends AudioWorkletProcessor {
  constructor({ processorOptions }) {
    super()
    const { ins, outs, outTypes, params, pattern, octave } = processorOptions
    this.io = new BusIO(this.port, ins, outs, outTypes)
    this.IN = this.io.IN
    this.OUT = this.io.OUT
    this.x = new Float64Array(ins.length)
    this.o = new Float64Array(outs.length)
    this.p = { ...params }
    this.s = { ...params }
    this.pattern = pattern
    this.octave = octave || 0
    this.routes = ins.map(() => [])
    this.patched = new Uint8Array(ins.length)
    this.edges = Object.fromEntries(['gateIn', 'tempoIn', 'runStop', 'resetIn', 'holdIn'].map((k) => [k, new Edge()]))

    // Sequencer
    this.running = false
    this.step = -1
    this.phase = 0
    this.extPeriod = 0.25 * sampleRate // samples between external clocks, measured
    this.sinceClock = 0
    this.clockPulse = 0
    this.stepGlide = false

    // Keyboard
    this.keys = [] // held notes, latest last
    this.retrig = 0

    // Voice
    this.kbV = 0
    this.target = 0
    this.ph = 0
    this.lfoPh = 0
    this.env = 0
    this.stage = 'idle' // attack, decay, hold, release, idle
    this.prevGate = false
    this.lad = new Float64Array(4)
    this.y = new Float64Array(4)
    this.dcX = 0
    this.dcY = 0

    this.port.onmessage = ({ data }) => this.message(data)
  }

  message(m) {
    if (this.io.message(m)) return
    switch (m.type) {
      case 'params':
        Object.assign(this.p, m.params)
        break
      case 'pattern':
        this.pattern = m.pattern
        if (this.step >= m.pattern.length) this.step = -1
        break
      case 'octave':
        this.octave = m.octave
        break
      case 'routes':
        this.routes = m.routes.map((list) => list.map((id) => this.OUT[id]))
        this.patched = Uint8Array.from(m.patched)
        break
      case 'key':
        this.keys = this.keys.filter((n) => n !== m.note)
        if (m.on) {
          this.keys.push(m.note)
          this.retrig = 2 // a new key always restarts the envelope
        }
        break
      case 'run':
        this.setRunning(m.on)
        break
      case 'reset':
        this.step = -1
        this.phase = this.running ? 1 : 0
        this.port.postMessage({ type: 'step', step: -1, t: currentTime })
        break
    }
  }

  setRunning(on) {
    if (on === this.running) return
    this.running = on
    if (on) this.phase = 1
    this.port.postMessage({ type: 'running', on })
  }

  advance(t) {
    const len = this.pattern.length
    this.step = (this.step + 1) % len
    const st = this.pattern.steps[this.step]
    if (st.gate !== 'rest') {
      this.target = (st.note + this.octave * 12) / 12
      this.stepGlide = st.glide
    }
    this.clockPulse = Math.round(sampleRate * 0.005)
    this.port.postMessage({ type: 'step', step: this.step, t })
  }

  process(_inputs, outputs) {
    const out = outputs[0][0]
    const N = out.length
    const sr = sampleRate
    const { IN, OUT, x, o, p, s, edges } = this
    const t0 = currentTime

    for (let n = 0; n < N; n++) {
      const t = t0 + n / sr
      for (const k of SMOOTHED) s[k] += (p[k] - s[k]) * 0.004

      for (let i = 0; i < x.length; i++) {
        const r = this.routes[i]
        let v = 0
        for (let j = 0; j < r.length; j++) v += o[r[j]]
        x[i] = v
      }
      this.io.addRemote(x, t)
      const pat = this.patched

      // ---- Sequencer
      if (pat[IN.runStop] && edges.runStop.edge(x[IN.runStop]) === 1) this.setRunning(!this.running)
      if (pat[IN.resetIn] && edges.resetIn.edge(x[IN.resetIn]) === 1) {
        this.step = -1
        this.phase = 1
      }
      if (pat[IN.holdIn]) edges.holdIn.edge(x[IN.holdIn])
      const hold = pat[IN.holdIn] && edges.holdIn.high
      let clocked = false
      if (pat[IN.tempoIn]) {
        // External clock: each rising edge is a step; the gap between edges sets gate lengths
        this.sinceClock++
        if (edges.tempoIn.edge(x[IN.tempoIn]) === 1) {
          if (this.sinceClock > 8) this.extPeriod = this.sinceClock
          this.sinceClock = 0
          clocked = true
        }
        this.phase = Math.min(0.9999, this.sinceClock / this.extPeriod)
      } else if (this.running) {
        this.phase += curve.bpm(s.tempo) / 15 / sr
        if (this.phase >= 1) {
          this.phase -= Math.floor(this.phase)
          clocked = true
        }
      }
      if (clocked && (this.running || pat[IN.tempoIn]) && !(hold && this.step >= 0)) this.advance(t)
      else if (clocked) this.clockPulse = Math.round(sr * 0.005)

      let seqGate = false
      let accent = false
      if ((this.running || pat[IN.tempoIn]) && this.step >= 0) {
        const st = this.pattern.steps[this.step]
        if (st.gate === 'tie') seqGate = true
        else if (st.gate === 'on') {
          const r = st.ratchet || 1
          const sub = this.phase * r
          seqGate = sub - Math.floor(sub) < clamp(s.gateLen, 0.05, 0.95)
        }
        accent = seqGate && st.accent
      }

      // ---- Keyboard: a held key plays over the sequence
      const live = this.keys.length > 0
      if (live) this.target = (this.keys[this.keys.length - 1] + this.octave * 12) / 12
      if (pat[IN.gateIn]) edges.gateIn.edge(x[IN.gateIn])
      let gate = seqGate || live || (pat[IN.gateIn] && edges.gateIn.high)
      if (this.retrig > 0) {
        this.retrig--
        gate = false
      }

      // ---- Glide (on the keyboard / sequencer pitch)
      const gT = Math.max(curve.glide(s.glide), this.stepGlide && !live ? 0.08 : 0)
      this.kbV = gT > 0.0005 ? this.kbV + (this.target - this.kbV) * (1 - Math.exp(-4.6 / (gT * sr))) : this.target

      // ---- Envelope
      if (gate && !this.prevGate) this.stage = 'attack'
      if (!gate && this.prevGate && p.sustain === 'on' && (this.stage === 'hold' || this.stage === 'attack')) this.stage = 'release'
      this.prevGate = gate
      const A = curve.env(s.attack)
      const D = curve.env(s.decay)
      if (this.stage === 'attack') {
        this.env += (1.3 - this.env) * (1 - Math.exp(-1.466 / (A * sr)))
        if (this.env >= 1) {
          this.env = 1
          this.stage = p.sustain === 'on' ? 'hold' : 'decay'
        }
      } else if (this.stage === 'decay' || this.stage === 'release') {
        this.env *= Math.exp(-LN1000 / (D * sr))
        if (this.env < 1e-5) {
          this.env = 0
          this.stage = 'idle'
        }
      } else if (this.stage === 'hold' && p.sustain !== 'on') this.stage = 'decay'

      // ---- LFO
      const lfoHz = curve.lfo(s.lfoRate) * 2 ** clamp(x[IN.lfoRateCv], -8, 8)
      this.lfoPh += lfoHz / sr
      this.lfoPh -= Math.floor(this.lfoPh)
      const tri = 1 - 4 * Math.abs(this.lfoPh - 0.5) // starts at -1
      const sq = this.lfoPh < 0.5 ? 1 : -1
      const lfo = p.lfoWave === 'sq' ? sq : tri

      // ---- VCO
      const modSig = pat[IN.vcoModCv] ? x[IN.vcoModCv] / 5 : p.vcoModSrc === 'eg' ? this.env : lfo
      const pitchV = pat[IN.pitchCv] ? x[IN.pitchCv] : this.kbV
      const oct = curve.vcoOct(s.vcoFreq) + pitchV + (p.vcoModDest === 'freq' ? s.vcoModAmt * modSig * 2 : 0)
      const f = clamp(C2 * 2 ** clamp(oct, -10, 10) * (1 + x[IN.linFm] / 5), -sr * 0.45, sr * 0.45)
      const dt = f / sr
      this.ph += dt
      this.ph -= Math.floor(this.ph)
      const ph = this.ph
      const adt = Math.abs(dt)
      const pw = clamp(0.05 + s.pw * 0.9 + (p.vcoModDest === 'pw' ? s.vcoModAmt * modSig * 0.45 : 0), 0.03, 0.97)
      const saw = 2 * ph - 1 - blep(ph, adt)
      const pulse = (ph < pw ? 1 : -1) + blep(ph, adt) - blep((ph - pw + 1) % 1, adt)

      // ---- Mixer
      const noise = Math.random() * 2 - 1
      const other = pat[IN.extAudio] ? x[IN.extAudio] / 5 : noise
      const m = clamp(s.mix + x[IN.mixCv] / 5, 0, 1)
      const mixed = (p.vcoWave === 'saw' ? saw : pulse) * (1 - m) + other * m

      // ---- Filter: four-pole ladder, zero-delay feedback
      const vcfSig = p.vcfModSrc === 'eg' ? this.env : lfo
      const fOct = s.vcfModAmt * vcfSig * 6 + clamp(x[IN.cutoffCv], -10, 10)
      const fc = clamp(curve.cutoff(s.cutoff) * 2 ** fOct, 10, sr * 0.42)
      const res = clamp(s.resonance + x[IN.resCv] / 5, 0, 1.1)
      const g = Math.tan((Math.PI * fc) / sr)
      const G = g / (1 + g)
      const k = res * 4.1
      const L = this.lad
      const b = 1 / (1 + g)
      const S = G * G * G * b * L[0] + G * G * b * L[1] + G * b * L[2] + b * L[3]
      const G4 = G * G * G * G
      const uIn = mixed * (1 + res * 0.6) + noise * 1e-4
      const u = Math.tanh(uIn - (k * (G4 * uIn + S)) / (1 + k * G4))
      let xi = u
      const y = this.y
      for (let st = 0; st < 4; st++) {
        const v = (xi - L[st]) * G
        y[st] = v + L[st]
        L[st] = y[st] + v
        xi = y[st]
      }
      const filt = p.vcfMode === 'hp' ? u - 4 * y[0] + 6 * y[1] - 4 * y[2] + y[3] : y[3]

      // ---- VCA
      const vcaCtl = pat[IN.vcaCv] ? clamp(x[IN.vcaCv] / 5, 0, 2) : p.vcaMode === 'on' ? 1 : this.env * (accent ? 1.35 : 1)
      const voice = filt * vcaCtl

      // ---- Utilities
      const vcm = clamp(s.vcMix + x[IN.vcMixCtrl] / 5, 0, 1)
      const m1 = pat[IN.mix1] ? x[IN.mix1] : 5
      const m2 = pat[IN.mix2] ? x[IN.mix2] : 0

      // ---- Outputs, in volts
      o[OUT.vcaOut] = clamp(voice * 5, -10, 10)
      o[OUT.noiseOut] = noise * 5
      o[OUT.vcfOut] = clamp(filt * 2.5, -10, 10)
      o[OUT.sawOut] = saw * 5
      o[OUT.pulseOut] = pulse * 5
      o[OUT.lfoTriOut] = tri * 5
      o[OUT.lfoSqOut] = sq > 0 ? 5 : 0
      o[OUT.vcMixOut] = m1 * (1 - vcm) + m2 * vcm
      o[OUT.mult1] = x[IN.multIn]
      o[OUT.mult2] = x[IN.multIn]
      o[OUT.assignOut] = p.assign === 'clock' ? (this.clockPulse > 0 ? 5 : 0) : p.assign === 'lfoSaw' ? this.lfoPh * 5 : accent ? 5 : 0
      o[OUT.egOut] = this.env * 5
      o[OUT.kbOut] = this.kbV
      o[OUT.gateOut] = gate ? 5 : 0
      o[OUT.attenOut] = (pat[IN.attenIn] ? x[IN.attenIn] : 5) * s.atten
      if (this.clockPulse > 0) this.clockPulse--

      const sp = Math.tanh(voice * s.volume * 1.6) * 0.9
      this.dcY = sp - this.dcX + 0.9995 * this.dcY
      this.dcX = sp
      out[n] = this.dcY

      this.io.collect(o, t)
    }
    return true
  }
}

registerProcessor('brother-voice', BrotherVoice)
