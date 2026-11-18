// Web Audio engine: one percussion voice built from two oscillators and noise,
// played by a step sequencer. The player sets each step's pitch and velocity;
// the weather patch sets the voice, the tempo and the generative layers
// (ghost notes, rolls, fills, hats, thunder), which only run while it plays.

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12)
const SMOOTH = 0.15
export const BASE_NOTE = 36 // C2: a step at pitch 0, with no transpose

function impulse(ctx, seconds, decay) {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}

function crushCurve(steps) {
  const curve = new Float32Array(2048)
  for (let i = 0; i < 2048; i++) curve[i] = Math.round(((i / 2047) * 2 - 1) * steps) / steps
  return curve
}

export class BeatEngine {
  constructor(pattern) {
    this.pattern = pattern // { steps: [{ pitch, vel }], length, transpose }
    this.ctx = null
    this.patch = null
    this.volume = 0.7
    this.running = false
    this.pos = 0 // the step that plays next
    this.bpm = 110 // tempo only changes at the start of a bar
    this.events = { ghost: 0, roll: 0, fill: 0, hats: 0, thunder: 0, accent: 0 }
    this.onStep = null // (index) when a step sounds
  }

  get started() {
    return this.ctx?.state === 'running'
  }

  async start() {
    if (!this.ctx) this._build()
    if (this.ctx.state !== 'running') await this.ctx.resume()
  }

  _build() {
    const ctx = (this.ctx = new AudioContext({ latencyHint: 'interactive' }))
    const gain = (v = 1) => {
      const g = ctx.createGain()
      g.gain.value = v
      return g
    }
    const filter = (type, freq, g = 0) => {
      const f = ctx.createBiquadFilter()
      f.type = type
      f.frequency.value = freq
      f.gain.value = g
      return f
    }

    // Output: master -> limiter -> analyser -> speakers
    this.master = gain(this.volume * 0.6)
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -8
    limiter.ratio.value = 12
    limiter.attack.value = 0.002
    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 1024
    this.master.connect(limiter).connect(this.analyser).connect(ctx.destination)

    // Space: dry + room (humidity) + dub delay (waves)
    this.space = gain(1)
    this.space.connect(this.master)
    this.reverbSend = gain(0)
    this.revShort = gain(1)
    this.revLong = gain(0)
    const convShort = ctx.createConvolver()
    convShort.buffer = impulse(ctx, 0.8, 3.5)
    const convLong = ctx.createConvolver()
    convLong.buffer = impulse(ctx, 3, 2.5)
    this.space.connect(this.reverbSend)
    this.reverbSend.connect(convShort).connect(this.revShort).connect(this.master)
    this.reverbSend.connect(convLong).connect(this.revLong).connect(this.master)
    this.delaySend = gain(0)
    this.delay = ctx.createDelay(2)
    this.delay.delayTime.value = 0.4
    this.delayFeedback = gain(0.4)
    const delayTone = filter('bandpass', 1400)
    delayTone.Q.value = 0.6
    this.space.connect(this.delaySend).connect(this.delay).connect(delayTone)
    delayTone.connect(this.delayFeedback).connect(this.delay)
    delayTone.connect(this.master)

    // Chorus (fog), alongside the dry signal
    this.post = gain(1)
    this.post.connect(this.space)
    const chorusDelay = ctx.createDelay(0.1)
    chorusDelay.delayTime.value = 0.018
    const chorusLfo = ctx.createOscillator()
    chorusLfo.frequency.value = 0.4
    const chorusDepth = gain(0.003)
    chorusLfo.connect(chorusDepth).connect(chorusDelay.delayTime)
    chorusLfo.start()
    this.chorusWet = gain(0)
    this.post.connect(chorusDelay).connect(this.chorusWet).connect(this.space)

    // Tone: sun tilt, then the three cloud-layer bands
    this.tilt = filter('highshelf', 2500)
    this.bandLow = filter('lowshelf', 200)
    this.bandMid = filter('peaking', 900)
    this.bandMid.Q.value = 0.8
    this.bandHigh = filter('highshelf', 6000)
    this.tone = gain(1)
    this.tone.connect(this.tilt).connect(this.bandLow).connect(this.bandMid).connect(this.bandHigh).connect(this.post)

    // Voice bus -> crush (air) -> drive (storm, night) -> tone
    this.voiceBus = gain(1)
    this.crushDry = gain(1)
    this.crushWet = gain(0)
    this.shaper = ctx.createWaveShaper()
    this.crushSteps = 0
    const preDrive = gain(1)
    this.voiceBus.connect(this.crushDry).connect(preDrive)
    this.voiceBus.connect(this.shaper).connect(this.crushWet).connect(preDrive)
    this.driveDry = gain(1)
    this.driveWet = gain(0)
    const driveShaper = ctx.createWaveShaper()
    const curve = new Float32Array(1024)
    for (let i = 0; i < 1024; i++) curve[i] = Math.tanh(((i / 1023) * 2 - 1) * 3) * 0.6
    driveShaper.curve = curve
    driveShaper.oversample = '2x'
    preDrive.connect(this.driveDry).connect(this.tone)
    preDrive.connect(gain(5)).connect(driveShaper).connect(this.driveWet).connect(this.tone)

    // Hats and thunder skip the voice filter but share the space
    this.hatBus = gain(0)
    this.hatBus.connect(this.tone)
    this.thunderBus = gain(0)
    this.thunderBus.connect(this.tone)

    const nbuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const nd = nbuf.getChannelData(0)
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1
    this.noiseBuffer = nbuf

    this.nextStep = ctx.currentTime + 0.1
    this.tick = 0
    setInterval(() => this._clock(), 25)
    if (this.patch) this.apply(this.patch)
  }

  setVolume(v) {
    this.volume = v
    if (this.ctx) this.master.gain.setTargetAtTime(v * 0.6, this.ctx.currentTime, 0.05)
  }

  apply(p) {
    this.patch = p
    if (!this.running) this.bpm = p.bpm // stopped: take the new tempo straight away
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const set = (param, v) => param.setTargetAtTime(v, t, SMOOTH)
    set(this.reverbSend.gain, p.reverbWet)
    set(this.revShort.gain, 1 - p.reverbSize)
    set(this.revLong.gain, p.reverbSize)
    set(this.delaySend.gain, p.delayWet)
    set(this.delayFeedback.gain, p.delayFeedback)
    this.delay.delayTime.setTargetAtTime(p.delayTime, t, 0.5)
    set(this.chorusWet.gain, p.chorusWet)
    set(this.tilt.gain, p.tiltDb)
    set(this.bandLow.gain, p.lowDb)
    set(this.bandMid.gain, p.midDb)
    set(this.bandHigh.gain, p.highDb)
    set(this.crushWet.gain, p.crushWet)
    set(this.crushDry.gain, 1 - p.crushWet)
    set(this.driveWet.gain, p.driveWet)
    set(this.driveDry.gain, 1 - p.driveWet * 0.7)
    set(this.hatBus.gain, p.hatLevel)
    set(this.thunderBus.gain, p.thunderLevel)
    if (p.crushSteps !== this.crushSteps) {
      this.crushSteps = p.crushSteps
      this.shaper.curve = crushCurve(p.crushSteps)
    }
  }

  // ---- Transport ----------------------------------------------------------

  run(on) {
    if (on === this.running) return
    this.running = on
    if (on) {
      this.tick = 0
      this.bpm = this.patch?.bpm ?? 110
      this.nextStep = this.ctx.currentTime + 0.05
    }
  }

  reset() {
    this.pos = 0
    this.tick = 0
    this.onStep?.(-1)
  }

  // Skip to the next step without playing it.
  advance() {
    this.pos = (this.pos + 1) % this.pattern.length
    this.onStep?.(-1, this.pos)
  }

  // Play the current step now and move on, as an external trigger would.
  trigger() {
    if (!this.ctx || !this.patch) return
    const i = this.pos
    const step = this.pattern.steps[i]
    this._hit(this.ctx.currentTime + 0.005, this._note(step), Math.max(step.vel, 0.6), { dur: 60 / this.bpm / 4 })
    this.onStep?.(i)
    this.pos = (i + 1) % this.pattern.length
  }

  _note(step) {
    return BASE_NOTE + this.pattern.transpose + step.pitch
  }

  // Look-ahead scheduler: each step is a 16th note.
  _clock() {
    const ctx = this.ctx, p = this.patch
    if (!p || !this.running || ctx.state !== 'running') return
    if (this.nextStep < ctx.currentTime) this.nextStep = ctx.currentTime + 0.02
    while (this.nextStep < ctx.currentTime + 0.12) {
      if (this.pos === 0) this.bpm = p.bpm // new tempo lands on the downbeat
      const dur = 60 / this.bpm / 4
      const swingDelay = this.tick % 2 === 1 ? p.swing * dur : 0
      this._step(this.pos, this.nextStep + swingDelay, dur)
      this.nextStep += dur
      this.pos = (this.pos + 1) % this.pattern.length
      this.tick++
    }
  }

  _step(i, t, dur) {
    const p = this.patch
    const step = this.pattern.steps[i]
    const now = performance.now()
    const ms = Math.max(0, (t - this.ctx.currentTime) * 1000)
    setTimeout(() => this.onStep?.(i), ms) // keep the step light in time with the sound
    const note = this._note(step)
    const lastOfPhrase = i === this.pattern.length - 1 && Math.floor(this.tick / this.pattern.length) % 2 === 1

    if (step.vel > 0) {
      const quiet = step.vel < 0.5
      if (!quiet || Math.random() < p.quietProb) {
        let vel = step.vel
        const accent = Math.random() < p.accentProb
        if (accent) {
          vel = Math.min(1.25, vel * 1.4)
          this.events.accent = now
        }
        if (lastOfPhrase && Math.random() < p.fillProb) {
          // Storm fill: a four-hit roll that climbs
          for (let k = 0; k < 4; k++) this._hit(t + (k * dur) / 4, note + k * 2, vel * (0.55 + k * 0.15), { dur: dur / 4, accent })
          this.events.fill = now
        } else if (Math.random() < p.ratchetProb) {
          const n = Math.random() < 0.7 ? 2 : 3
          for (let k = 0; k < n; k++) this._hit(t + (k * dur) / n, note, vel * (k ? 0.7 : 1), { dur: dur / n, accent })
          this.events.roll = now
        } else {
          this._hit(t, note, vel, { dur, accent })
        }
      }
    } else if (p.ghostLevel > 0.01 && p.ghost[i % 8]) {
      // Cloud ghost notes fill the rests, very quietly
      this._hit(t, note, p.ghostLevel * (0.6 + Math.random() * 0.4), { dur, ghost: true })
      this.events.ghost = now
    }

    if (p.hats && p.hatLevel > 0.01) this._hats(p.hats, this.tick, t, dur)
    if (p.thunderLevel > 0.01 && Math.random() < p.thunderRate * dur) this._thunder(t)
  }

  // ---- Sound sources --------------------------------------------------------

  // One percussion hit: two oscillators (1 frequency-modulates 2), a pitch
  // drop on both, noise, a decaying filter and a decaying amplifier.
  _hit(t, midi, vel, { dur = 0.15, accent = false, ghost = false } = {}) {
    const ctx = this.ctx, p = this.patch
    const f = mtof(midi)
    const peak = Math.min(1.2, vel * p.punch) * 0.8
    const decay = ghost ? p.decay * 0.5 : p.decay
    const end = t + p.attack + decay * 6 + 0.05
    const drop = Math.pow(2, p.dropSemis / 12)

    const osc1 = ctx.createOscillator()
    osc1.type = p.osc1Wave
    osc1.frequency.setValueAtTime(f * drop, t)
    osc1.frequency.exponentialRampToValueAtTime(f, t + p.pitchDecay)
    const osc2 = ctx.createOscillator()
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(f * p.osc2Ratio * drop, t)
    osc2.frequency.exponentialRampToValueAtTime(f * p.osc2Ratio, t + p.pitchDecay)
    // FM amount falls with the hit, so the clang is in the attack
    const fm = ctx.createGain()
    fm.gain.setValueAtTime(f * p.fmIndex * (accent ? 1.5 : 1), t)
    fm.gain.setTargetAtTime(f * p.fmIndex * 0.2, t, decay * 0.5)
    osc1.connect(fm).connect(osc2.frequency)

    const noise = ctx.createBufferSource()
    noise.buffer = this.noiseBuffer
    const mix1 = ctx.createGain()
    mix1.gain.value = 0.7
    const mix2 = ctx.createGain()
    mix2.gain.value = p.osc2Level
    const mixN = ctx.createGain()
    mixN.gain.value = p.noiseLevel

    // Filter opens with the hit (more on accents) and closes as it decays
    const vcf = ctx.createBiquadFilter()
    vcf.type = 'lowpass'
    vcf.Q.value = p.filterQ
    const open = Math.min(18000, p.cutoff * Math.pow(2, p.filterEnv * vel * (accent ? 1.3 : 1)))
    vcf.frequency.setValueAtTime(open, t)
    vcf.frequency.setTargetAtTime(p.cutoff, t + p.attack, decay * 0.6)

    const vca = ctx.createGain()
    vca.gain.setValueAtTime(0, t)
    vca.gain.linearRampToValueAtTime(peak, t + p.attack)
    vca.gain.setTargetAtTime(0, t + p.attack, decay)

    osc1.connect(mix1).connect(vcf)
    osc2.connect(mix2).connect(vcf)
    noise.connect(mixN).connect(vcf)
    vcf.connect(vca).connect(this.voiceBus)
    osc1.start(t)
    osc2.start(t)
    noise.start(t, Math.random() * 1.5)
    osc1.stop(end)
    osc2.stop(end)
    noise.stop(end)
  }

  _noiseHit(t, { type, freq, attack = 0.001, decay, level, bus }) {
    const ctx = this.ctx
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    const tone = ctx.createBiquadFilter()
    tone.type = type
    tone.frequency.value = freq
    const env = ctx.createGain()
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(level, t + attack)
    env.gain.setTargetAtTime(0, t + attack, decay)
    src.connect(tone).connect(env).connect(bus)
    src.start(t, Math.random() * 1.5)
    src.stop(t + attack + decay * 8 + 0.05)
    return tone
  }

  // The rain's hat layer, on every 16th.
  _hats(style, i, t, dur) {
    const ctx = this.ctx, p = this.patch
    if (i % 16 === 0) this.burst = !style.bursts || Math.random() < 0.7
    if (!this.burst) return
    const k = style.tick
    if (Math.random() < k.prob * p.hatProb) {
      const accent = i % 4 === 2 ? 1 : i % 2 === 0 ? 0.75 : 0.5 // offbeats lead, like a real hat
      this._noiseHit(t + Math.random() * dur * 0.08, {
        type: k.freq > 4000 ? 'highpass' : 'bandpass', freq: k.freq, decay: k.decay,
        level: k.level * accent, bus: this.hatBus,
      })
      this.events.hats = performance.now()
    }
    if (p.hatExtras > 0.01 && style.thud?.includes(i % 8)) {
      // A clap-like burst: three quick noise hits
      for (let n = 0; n < 3; n++) {
        this._noiseHit(t + n * 0.009, { type: 'bandpass', freq: 1500, decay: n === 2 ? 0.06 : 0.008, level: 0.6 * p.hatExtras, bus: this.hatBus })
      }
    }
    if (p.hatExtras > 0.01 && style.ping && Math.random() < style.ping) {
      const osc = ctx.createOscillator()
      osc.frequency.value = 3000 + Math.random() * 3000
      const env = ctx.createGain()
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(0.25 * p.hatExtras, t + 0.002)
      env.gain.setTargetAtTime(0, t + 0.002, 0.05)
      osc.connect(env).connect(this.hatBus)
      osc.start(t)
      osc.stop(t + 0.5)
    }
  }

  _thunder(t) {
    const tone = this._noiseHit(t, {
      type: 'lowpass', freq: 260, attack: 0.03, decay: 0.7 + Math.random() * 0.6, level: 1.6, bus: this.thunderBus,
    })
    tone.frequency.exponentialRampToValueAtTime(55, t + 1.2)
    this.events.thunder = performance.now()
  }

  level() {
    if (!this.analyser) return 0
    const buf = new Float32Array(this.analyser.fftSize)
    this.analyser.getFloatTimeDomainData(buf)
    let sum = 0
    for (const x of buf) sum += x * x
    return Math.sqrt(sum / buf.length)
  }
}
