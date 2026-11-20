// DFAL's voice and sequencer, sample by sample, on the audio thread.
// Two VCOs (triangle or square, 1 → 2 FM, hard sync) and noise feed a mixer,
// a four-pole ladder filter (low or high pass) and a VCA. Three decay envelopes
// (VCO, VCF, VCA) are fired by an 8-step sequencer whose steps each set a pitch
// and a velocity. Every jack in the patch bay is a signal here, in volts, so a
// cable can join any output to any input, even at audio rate.
//
// Messages in: params, steps, routes (cables within this window), remote
// (samples arriving from other windows), stream (which outputs to send to other
// windows), and the buttons: run, trig, adv, reset.
// Messages out: step (the sequencer moved), running, sig (samples to send).

const curve = {
  tempo: (x) => 0.5 * 2 ** (x * 9),
  decay: (x) => 0.004 * 2 ** (x * 11),
  vco: (x) => 8 * 2 ** (x * 10),
  cutoff: (x) => 20 * 2 ** (x * 10),
}
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x)
const BATCH = 16 // streamed samples per message, about 11 ms
const LN1000 = Math.log(1000) // decay times are the time to fall by 60 dB

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

// A Schmitt-trigger gate detector: true on each rising edge
class Edge {
  constructor() {
    this.high = false
  }
  rise(v) {
    if (!this.high && v > 1.5) return (this.high = true)
    if (this.high && v < 0.7) this.high = false
    return false
  }
}

const SMOOTHED = ['tempo', 'vcoDecay', 'vco1Eg', 'vco1Freq', 'fm', 'vco2Eg', 'vco2Freq', 'vco1Level', 'noiseLevel', 'vco2Level',
  'cutoff', 'resonance', 'vcfEg', 'vcfDecay', 'vcfMod', 'vcaDecay', 'volume']

class DfalVoice extends AudioWorkletProcessor {
  constructor({ processorOptions }) {
    super()
    const { ins, outs, params, steps } = processorOptions
    this.IN = Object.fromEntries(ins.map((id, i) => [id, i]))
    this.OUT = Object.fromEntries(outs.map((id, i) => [id, i]))
    this.x = new Float64Array(ins.length) // input voltages this sample
    this.o = new Float64Array(outs.length) // output voltages, last sample
    this.p = { ...params }
    this.s = { ...params } // smoothed copies of the knob values
    this.steps = steps
    this.routes = ins.map(() => []) // input index -> output indexes patched to it
    this.patched = new Uint8Array(ins.length)
    this.remote = new Map() // stream id -> { input, segs, hold }
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
    this.vcoEnv = 0
    this.vcfEnv = 0
    this.vcaEnv = 0
    this.vcaRising = false
    this.lad = new Float64Array(4)
    this.y = new Float64Array(4)
    this.dcX = 0
    this.dcY = 0

    // Streaming outputs to other windows
    this.stream = [] // output indexes
    this.streamIds = []
    this.decim = Math.max(1, Math.round(sampleRate / 1500))
    this.buf = null
    this.bufN = 0
    this.bufT0 = 0
    this.count = 0

    this.port.onmessage = ({ data }) => this.message(data)
  }

  message(m) {
    switch (m.type) {
      case 'params':
        Object.assign(this.p, m.params)
        break
      case 'steps':
        this.steps = m.steps
        break
      case 'routes':
        this.routes = m.routes.map((list) => list.map((id) => this.OUT[id]))
        this.patched = Uint8Array.from(m.patched)
        break
      case 'stream':
        this.streamIds = m.outs
        this.stream = m.outs.map((id) => this.OUT[id])
        this.buf = this.stream.map(() => new Float32Array(BATCH))
        this.bufN = 0
        break
      case 'remote': {
        let r = this.remote.get(m.id)
        if (!r) this.remote.set(m.id, (r = { input: this.IN[m.input], segs: [], hold: 0 }))
        r.input = this.IN[m.input]
        r.segs.push({ t: m.t, dt: m.dt, v: m.v })
        if (r.segs.length > 64) r.segs.splice(0, r.segs.length - 64)
        break
      }
      case 'unremote':
        for (const id of m.ids) this.remote.delete(id)
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
      case 'reset':
        this.step = -1
        this.phase = 0
        this.report(false)
        break
    }
  }

  setRunning(on) {
    if (on === this.running) return
    this.running = on
    if (on) this.phase = 1 // play the first step straight away
    this.port.postMessage({ type: 'running', on })
  }

  advance() {
    this.step = (this.step + 1) % this.steps.length
    const st = this.steps[this.step]
    this.pitchV = st.pitch / 12
    this.stepVel = st.vel
  }

  fire() {
    if (this.step < 0) this.advance()
    this.vcoEnv = 1
    this.vcfEnv = 1
    this.vcaRising = true
    this.pulse = Math.round(sampleRate * 0.005)
    this.report(true)
  }

  report(fired) {
    this.port.postMessage({ type: 'step', step: this.step, fired, t: this.now })
  }

  readRemote(r, t) {
    const segs = r.segs
    while (segs.length) {
      const s = segs[0]
      const n = s.v.length
      if (t > s.t + s.dt * (n - 1)) {
        r.hold = s.v[n - 1]
        segs.shift()
        continue
      }
      const f = (t - s.t) / s.dt
      if (f < 0) return r.hold
      const i = f | 0
      const a = s.v[i]
      const b = i + 1 < n ? s.v[i + 1] : a
      return a + (b - a) * (f - i)
    }
    return r.hold
  }

  process(_inputs, outputs) {
    const out = outputs[0][0]
    const N = out.length
    const sr = sampleRate
    const { IN, OUT, x, o, p, s } = this
    const remotes = [...this.remote.values()]
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
      for (const r of remotes) x[r.input] += this.readRemote(r, t)
      const pat = this.patched

      // ---- Sequencer
      if (pat[IN.runStop] && this.edges.runStop.rise(x[IN.runStop])) this.setRunning(!this.running)
      if (pat[IN.adv]) {
        if (this.edges.adv.rise(x[IN.adv])) {
          this.advance()
          this.fire()
        }
      } else if (this.running) {
        this.phase += (curve.tempo(s.tempo) * 2 ** clamp(x[IN.tempoCv], -8, 8)) / sr
        if (this.phase >= 1) {
          this.phase -= Math.floor(this.phase)
          this.advance()
          this.fire()
        }
      }
      if (pat[IN.trig] && this.edges.trig.rise(x[IN.trig])) this.fire()
      const vel = pat[IN.velocity] ? clamp(x[IN.velocity] / 5, 0, 1.5) : this.stepVel

      // ---- Envelopes
      const vcoT = curve.decay(s.vcoDecay) * 2 ** clamp(x[IN.vcoDecayCv], -6, 6)
      const vcfT = curve.decay(s.vcfDecay) * 2 ** clamp(x[IN.vcfDecayCv], -6, 6)
      const vcaT = curve.decay(s.vcaDecay)
      this.vcoEnv *= Math.exp(-LN1000 / (vcoT * sr))
      this.vcfEnv *= Math.exp(-LN1000 / (vcfT * sr))
      if (this.vcaRising) {
        this.vcaEnv += 1 / ((p.vcaAttack === 'slow' ? 0.06 : 0.0008) * sr)
        if (this.vcaEnv >= 1) {
          this.vcaEnv = 1
          this.vcaRising = false
        }
      } else this.vcaEnv *= Math.exp(-LN1000 / (vcaT * sr))

      // ---- Oscillators (1 V per octave)
      const seq = this.pitchV
      const pv1 = pat[IN.vco1Cv] ? x[IN.vco1Cv] : p.seqPitch === 'both' ? seq : 0
      const pv2 = pat[IN.vco2Cv] ? x[IN.vco2Cv] : p.seqPitch === 'off' ? 0 : seq
      const eg1 = s.vco1Eg * this.vcoEnv
      const eg2 = s.vco2Eg * this.vcoEnv
      const f1 = clamp(curve.vco(s.vco1Freq) * 2 ** clamp(pv1 + eg1 * 5, -10, 10), -sr * 0.45, sr * 0.45)
      const dt1 = f1 / sr
      this.ph1 += dt1
      let wrapped = false
      if (this.ph1 >= 1) {
        this.ph1 -= Math.floor(this.ph1)
        wrapped = true
      }
      const ph1 = this.ph1
      const v1 = p.vco1Wave === 'tri' ? 4 * Math.abs(ph1 - 0.5) - 1 : (ph1 < 0.5 ? 1 : -1) + blep(ph1, dt1) - blep((ph1 + 0.5) % 1, dt1)

      const fmAmt = clamp(s.fm + x[IN.fmCv] / 5, 0, 2)
      const f2base = curve.vco(s.vco2Freq) * 2 ** clamp(pv2 + eg2 * 5, -10, 10)
      const f2 = clamp(f2base * (1 + fmAmt * 3 * v1), -sr * 0.45, sr * 0.45)
      const dt2 = f2 / sr
      if (p.sync === 'on' && wrapped) this.ph2 = dt1 > 0 ? (ph1 / dt1) * Math.abs(dt2) : 0
      else this.ph2 += dt2
      this.ph2 -= Math.floor(this.ph2)
      const ph2 = this.ph2
      const adt2 = Math.abs(dt2)
      const v2 = p.vco2Wave === 'tri' ? 4 * Math.abs(ph2 - 0.5) - 1 : (ph2 < 0.5 ? 1 : -1) + blep(ph2, adt2) - blep((ph2 + 0.5) % 1, adt2)

      // ---- Mixer
      const noise = Math.random() * 2 - 1
      const ext = pat[IN.extAudio] ? x[IN.extAudio] / 5 : noise
      const nLevel = clamp(s.noiseLevel + x[IN.noiseCv] / 5, 0, 1.5)
      const mix = v1 * s.vco1Level + v2 * s.vco2Level + ext * nLevel

      // ---- Filter: four-pole ladder, zero-delay feedback
      const modSig = pat[IN.vcfModCv] ? x[IN.vcfModCv] / 5 : noise
      const oct = s.vcfEg * vel * this.vcfEnv * 6 + s.vcfMod * modSig * 4
      const fc = clamp(curve.cutoff(s.cutoff) * 2 ** clamp(oct, -12, 12), 10, sr * 0.42)
      const g = Math.tan((Math.PI * fc) / sr)
      const G = g / (1 + g)
      const k = s.resonance * 4.1
      const L = this.lad
      const b = 1 / (1 + g)
      const S = G * G * G * b * L[0] + G * G * b * L[1] + G * b * L[2] + b * L[3]
      const G4 = G * G * G * G
      const uIn = mix * (1 + s.resonance * 0.6) + noise * 1e-4 // a little hiss, so the filter can ring on its own
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
      const filt = p.vcfMode === 'hp' ? u - 4 * y[0] + 6 * y[1] - 4 * y[2] + y[3] : y[3]

      // ---- VCA
      const vcaCtl = pat[IN.vcaCv] ? clamp(x[IN.vcaCv] / 5, 0, 2) : this.vcaEnv * vel
      const voice = filt * vcaCtl

      // ---- Outputs, in volts
      o[OUT.vcaOut] = clamp(voice * 5, -10, 10)
      o[OUT.vcaEgOut] = this.vcaEnv * vel * 5
      o[OUT.vcfEgOut] = this.vcfEnv * 5
      o[OUT.vco1EgOut] = eg1 * 5
      o[OUT.vco2EgOut] = eg2 * 5
      o[OUT.vco1Out] = v1 * 5
      o[OUT.vco2Out] = v2 * 5
      o[OUT.trigOut] = this.pulse > 0 ? 5 : 0
      o[OUT.velOut] = vel * 5
      o[OUT.pitchOut] = seq
      if (this.pulse > 0) this.pulse--

      // Speaker: volume, a gentle clip and a DC blocker
      const sp = Math.tanh(voice * s.volume * 2) * 0.9
      this.dcY = sp - this.dcX + 0.9995 * this.dcY
      this.dcX = sp
      out[n] = this.dcY

      // ---- Streaming to other windows
      if (this.stream.length && ++this.count >= this.decim) {
        this.count = 0
        if (this.bufN === 0) this.bufT0 = t
        for (let j = 0; j < this.stream.length; j++) this.buf[j][this.bufN] = o[this.stream[j]]
        if (++this.bufN === BATCH) {
          this.port.postMessage({
            type: 'sig',
            jacks: this.streamIds,
            t: this.bufT0,
            dt: this.decim / sr,
            values: this.buf.map((b) => b.slice()),
          })
          this.bufN = 0
        }
      }
    }
    return true
  }
}

registerProcessor('dfal-voice', DfalVoice)
