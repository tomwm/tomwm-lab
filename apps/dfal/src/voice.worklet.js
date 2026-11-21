// DFAL's voice and sequencer, sample by sample, on the audio thread.
// Two VCOs (triangle or square, linear 1 → 2 FM, hard sync) and noise feed a
// mixer, a four-pole ladder filter (low or high pass) and a VCA. Three
// envelopes (VCO, VCF, VCA) are fired by an 8-step sequencer whose steps each
// set a pitch and a velocity. Every jack in the patch bay is a signal here, in
// volts, so a cable can join any output to any input, even at audio rate.
//
// Behaviour follows the DFAM owner's manual (Moog, 2017); page numbers below
// refer to it. Where the manual says nothing, the value is marked "estimate".
//
// Messages in: params, steps, routes (cables within this window), the patch
// bus's own (see bus-worklet.js), and the buttons: run, trig, adv, reset.
// Messages out: step (the sequencer moved), running, sig (samples to send).

import { BusIO } from './bus-worklet.js'

// Keep in step with panel.js
const curve = {
  tempo: (x) => 0.7 * 2 ** (x * 9.97), // 0.7 to 700 Hz (p. 23)
  decay: (x) => 0.01 * 2 ** (x * 9.97), // 10 ms to 10 s (p. 19, VCF; the same is assumed for VCO and VCA)
  vco: (x) => 4.9 * 2 ** (x * 10), // ten octaves (p. 13); placed so 10:30 is a deep bass (p. 8), estimate
  cutoff: (x) => 20 * 2 ** (x * 10), // 20 Hz to 20 kHz (p. 18)
}
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x)
const LN1000 = Math.log(1000) // decay times are the time to fall by 60 dB (estimate)
const ATTACK = 0.001 // all three envelopes attack in 1 ms; the VCA's SLOW is 100 ms (p. 20)
const SLOW_ATTACK = 0.1
const TRIG_PULSE = 0.001 // the TRIGGER output is roughly 1 ms wide (p. 29)

// Above 1, a VCA or level input soft-clips, as the manual warns (pp. 24, 26)
const softClip = (u) => (u <= 1 ? u : 1 + Math.tanh((u - 1) * 2) * 0.25)

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

// A Schmitt-trigger gate detector
class Edge {
  constructor() {
    this.high = false
  }
  // 1 on a rising edge, -1 on a falling edge, else 0
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

// A decay envelope with a short linear attack. level runs 0 to 1; velocity
// scales it afterwards, so it can be patched while a note rings.
class Env {
  constructor() {
    this.level = 0
    this.rising = false
  }
  fire() {
    this.rising = true
  }
  tick(attack, decay, sr) {
    if (this.rising) {
      this.level += 1 / (attack * sr)
      if (this.level >= 1) {
        this.level = 1
        this.rising = false
      }
    } else this.level *= Math.exp(-LN1000 / (decay * sr))
    return this.level
  }
}

const SMOOTHED = ['tempo', 'vcoDecay', 'vco1Eg', 'vco1Freq', 'fm', 'vco2Eg', 'vco2Freq', 'vco1Level', 'noiseLevel', 'vco2Level',
  'cutoff', 'resonance', 'vcfEg', 'vcfDecay', 'vcfMod', 'vcaDecay', 'volume']

class DfalVoice extends AudioWorkletProcessor {
  constructor({ processorOptions }) {
    super()
    const { ins, outs, outTypes, params, steps } = processorOptions
    this.io = new BusIO(this.port, ins, outs, outTypes)
    this.IN = this.io.IN
    this.OUT = this.io.OUT
    this.x = new Float64Array(ins.length) // input voltages this sample
    this.o = new Float64Array(outs.length) // output voltages, last sample
    this.p = { ...params }
    this.s = { ...params } // smoothed copies of the knob values
    this.steps = steps
    this.routes = ins.map(() => []) // input index -> output indexes patched to it
    this.patched = new Uint8Array(ins.length)
    this.edges = { trig: new Edge(), runStop: new Edge(), adv: new Edge() }

    // Sequencer
    this.running = false
    this.step = 0
    this.phase = 0
    this.pitchV = steps[0].pitch / 12
    this.stepVel = steps[0].vel
    this.pulse = 0 // samples left on the trigger output

    // Voice state
    this.ph1 = 0
    this.ph2 = 0
    this.vcoEg = new Env()
    this.vcfEg = new Env()
    this.vcaEg = new Env()
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
      case 'steps':
        this.steps = m.steps
        if (this.step >= 0) {
          this.pitchV = m.steps[this.step].pitch / 12
          this.stepVel = m.steps[this.step].vel
        }
        break
      case 'routes':
        this.routes = m.routes.map((list) => list.map((id) => this.OUT[id]))
        this.patched = Uint8Array.from(m.patched)
        break
      case 'run':
        this.setRunning(m.on)
        break
      case 'trig':
        this.fire()
        break
      case 'adv':
        this.advance()
        this.report(false)
        break
      case 'reset': // not on the hardware: a lab extra
        this.step = -1
        this.phase = 0
        this.report(false)
        break
    }
  }

  setRunning(on) {
    if (on === this.running) return
    this.running = on
    if (on) this.phase = 1 // play straight away
    this.port.postMessage({ type: 'running', on })
  }

  advance() {
    this.step = (this.step + 1) % this.steps.length
    const st = this.steps[this.step]
    this.pitchV = st.pitch / 12
    this.stepVel = st.vel
  }

  // A clock tick moves on a step. It fires the envelopes through the TRIGGER
  // input's normal, so patching TRIGGER in takes over the firing (p. 24).
  tick() {
    this.advance()
    if (this.patched[this.IN.trig]) this.report(false)
    else this.fire()
  }

  fire() {
    if (this.step < 0) this.advance()
    this.vcoEg.fire()
    this.vcfEg.fire()
    this.vcaEg.fire()
    this.pulse = Math.max(1, Math.round(sampleRate * TRIG_PULSE))
    this.report(true)
  }

  report(fired) {
    this.port.postMessage({ type: 'step', step: this.step, fired, t: this.now ?? currentTime })
  }

  process(_inputs, outputs) {
    const out = outputs[0][0]
    const N = out.length
    const sr = sampleRate
    const { IN, OUT, x, o, p, s, edges } = this
    const t0 = currentTime

    for (let n = 0; n < N; n++) {
      const t = t0 + n / sr
      this.now = t

      // Knob smoothing, about 5 ms
      for (const k of SMOOTHED) s[k] += (p[k] - s[k]) * 0.004

      // ---- Inputs: cables from this window (last sample's outputs) plus other windows
      for (let i = 0; i < x.length; i++) {
        const r = this.routes[i]
        let v = 0
        for (let j = 0; j < r.length; j++) v += o[r[j]]
        x[i] = v
      }
      this.io.addRemote(x, t)
      const pat = this.patched

      // ---- Sequencer
      // RUN/STOP in is a gate: high runs, low stops (p. 29). The button still toggles.
      if (pat[IN.runStop]) {
        const e = edges.runStop.edge(x[IN.runStop])
        if (e === 1) this.setRunning(true)
        else if (e === -1) this.setRunning(false)
      }
      if (pat[IN.adv]) {
        // An external clock moves the sequencer on while it runs; the TEMPO knob is ignored (pp. 29-30)
        if (edges.adv.edge(x[IN.adv]) === 1 && this.running) this.tick()
      } else if (this.running) {
        this.phase += (curve.tempo(s.tempo) * 2 ** clamp(x[IN.tempoCv], -10, 10)) / sr // TEMPO in: 1 V/oct (p. 28)
        if (this.phase >= 1) {
          this.phase -= Math.floor(this.phase)
          this.tick()
        }
      }
      if (pat[IN.trig] && edges.trig.edge(x[IN.trig]) === 1) this.fire()
      // VELOCITY in replaces the step knobs, 0 to 5 V (p. 25)
      const vel = pat[IN.velocity] ? clamp(x[IN.velocity] / 5, 0, 1.6) : this.stepVel

      // ---- Envelopes
      // Decay CV inputs are summed with their knobs, ±5 V covering the knob's range (pp. 25-26).
      // Higher velocities lengthen the decays slightly (p. 22); how much is an estimate.
      const velDecay = 0.8 + 0.3 * vel
      const vcoT = curve.decay(clamp(s.vcoDecay + x[IN.vcoDecayCv] / 10, 0, 1)) * velDecay
      const vcfT = curve.decay(clamp(s.vcfDecay + x[IN.vcfDecayCv] / 10, 0, 1)) * velDecay
      const vcaT = curve.decay(clamp(s.vcaDecay + x[IN.vcaDecayCv] / 10, 0, 1)) * velDecay
      // Velocity sets the amplitude of all three envelopes (p. 22)
      const vcoEnv = this.vcoEg.tick(ATTACK, vcoT, sr) * vel
      const vcfEnv = this.vcfEg.tick(ATTACK, vcfT, sr) * vel
      const vcaEnv = this.vcaEg.tick(p.vcaAttack === 'slow' ? SLOW_ATTACK : ATTACK, vcaT, sr) * vel

      // ---- Oscillators (1 V per octave)
      // VCO CV inputs are summed with the knob, the EG and the sequencer pitch (pp. 27-28)
      const seq = this.pitchV
      const pv1 = (p.seqPitch === 'both' ? seq : 0) + x[IN.vco1Cv]
      const pv2 = (p.seqPitch === 'off' ? 0 : seq) + x[IN.vco2Cv]
      // EG amount: full turn is ±5 octaves at full velocity (estimate)
      const f1 = clamp(curve.vco(s.vco1Freq) * 2 ** clamp(pv1 + s.vco1Eg * vcoEnv * 5, -12, 12), -sr * 0.45, sr * 0.45)
      const dt1 = f1 / sr
      this.ph1 += dt1
      let wrapped = false
      if (this.ph1 >= 1) {
        this.ph1 -= Math.floor(this.ph1)
        wrapped = true
      }
      const ph1 = this.ph1
      const v1 = p.vco1Wave === 'tri' ? 4 * Math.abs(ph1 - 0.5) - 1 : (ph1 < 0.5 ? 1 : -1) + blep(ph1, dt1) - blep((ph1 + 0.5) % 1, dt1)

      // Linear FM from VCO 1 (p. 28); the FM AMT input adds to the knob, 8 V is a full turn
      const fmAmt = clamp(s.fm + x[IN.fmCv] / 8, 0, 1.5)
      const f2base = curve.vco(s.vco2Freq) * 2 ** clamp(pv2 + s.vco2Eg * vcoEnv * 5, -12, 12)
      const f2 = clamp(f2base * (1 + fmAmt * 3 * v1), -sr * 0.45, sr * 0.45)
      const dt2 = f2 / sr
      // Hard sync resets VCO 2 to VCO 1's phase (p. 14)
      if (p.sync === 'on' && wrapped) this.ph2 = dt1 > 0 ? (ph1 / dt1) * Math.abs(dt2) : 0
      else this.ph2 += dt2
      this.ph2 -= Math.floor(this.ph2)
      const ph2 = this.ph2
      const adt2 = Math.abs(dt2)
      const v2 = p.vco2Wave === 'tri' ? 4 * Math.abs(ph2 - 0.5) - 1 : (ph2 < 0.5 ? 1 : -1) + blep(ph2, adt2) - blep((ph2 + 0.5) % 1, adt2)

      // ---- Mixer
      // EXT AUDIO replaces the noise, 10 V peak to peak at unity (p. 25).
      // NOISE LEVEL in adds to the knob, 8 V a full turn, and can clip (p. 26).
      const noise = Math.random() * 2 - 1
      const ext = pat[IN.extAudio] ? x[IN.extAudio] / 5 : noise
      const nLevel = softClip(Math.max(0, s.noiseLevel + x[IN.noiseCv] / 8))
      // High mixer levels clip (p. 16); the curve is an estimate
      const sum = v1 * s.vco1Level + v2 * s.vco2Level + ext * nLevel
      const mix = 1.4 * Math.tanh(sum / 1.4)

      // ---- Filter: four-pole ladder, zero-delay feedback
      // NOISE / VCF MOD sets how much noise, or the VCF MOD input in its place, moves the
      // cutoff; at full turn VCF MOD is taken as 1 V/oct (p. 27)
      const modV = pat[IN.vcfModCv] ? x[IN.vcfModCv] : noise * 5
      const oct = s.vcfEg * vcfEnv * 6 + s.vcfMod * modV // VCF EG: ±6 octaves at full turn (estimate)
      const fc = clamp(curve.cutoff(s.cutoff) * 2 ** clamp(oct, -12, 12), 10, sr * 0.42)
      const g = Math.tan((Math.PI * fc) / sr)
      const G = g / (1 + g)
      // Low pass self-oscillates above 3 o'clock (resonance 0.8). High pass scales
      // differently: at full resonance it starts to oscillate around 1 kHz (p. 18).
      const hp = p.vcfMode === 'hp'
      const k = hp ? s.resonance * 4.1 * clamp(0.976 + 0.08 * Math.log2(fc / 1000), 0.6, 1) : s.resonance * 5
      const L = this.lad
      const b = 1 / (1 + g)
      const S = G * G * G * b * L[0] + G * G * b * L[1] + G * b * L[2] + b * L[3]
      const G4 = G * G * G * G
      const uIn = mix * (1 + Math.min(1, s.resonance) * 0.5) + noise * 1e-4 // a little hiss, so the filter can ring on its own
      const y4est = (G4 * uIn + S) / (1 + k * G4)
      const u = Math.tanh(uIn - k * y4est)
      let xi = u
      const y = this.y
      for (let st = 0; st < 4; st++) {
        const v = (xi - L[st]) * G
        y[st] = v + L[st]
        L[st] = y[st] + v
        xi = y[st]
      }
      const filt = hp ? u - 4 * y[0] + 6 * y[1] - 4 * y[2] + y[3] : y[3]

      // ---- VCA: the VCA CV input is summed with the VCA envelope and can clip (p. 24)
      const vcaV = vcaEnv * 8 + x[IN.vcaCv]
      const voice = filt * softClip(Math.max(0, vcaV / 8))
      const level = voice * s.volume // VOLUME sets both the VCA jack and the audio out (p. 25)

      // ---- Outputs, in volts (pp. 25-29)
      o[OUT.vcaOut] = clamp(level * 5, -10, 10)
      o[OUT.vcaEgOut] = vcaEnv * 8
      o[OUT.vcfEgOut] = vcfEnv * 8
      o[OUT.vcoEgOut] = vcoEnv * 8
      o[OUT.vco1Out] = v1 * 5
      o[OUT.vco2Out] = v2 * 5
      o[OUT.trigOut] = this.pulse > 0 ? 5 : 0
      o[OUT.velOut] = this.stepVel * 5
      o[OUT.pitchOut] = seq
      if (this.pulse > 0) this.pulse--

      // Speaker: a gentle clip and a DC blocker
      const sp = Math.tanh(level * 2) * 0.9
      this.dcY = sp - this.dcX + 0.9995 * this.dcY
      this.dcX = sp
      out[n] = this.dcY

      this.io.collect(o, t)
    }
    return true
  }
}

registerProcessor('dfal-voice', DfalVoice)
