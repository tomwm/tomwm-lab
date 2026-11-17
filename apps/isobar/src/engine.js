// Web Audio engine. The player supplies notes; the patch (from the weather)
// supplies everything else, including the generative layers that only run
// while notes are held: arpeggio (wind), droplets (rain) and drone (calm).

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12)
const SMOOTH = 0.15 // seconds; how quickly settings glide to new values

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
  const n = 2048
  const curve = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1
    curve[i] = Math.round(x * steps) / steps
  }
  return curve
}

export class Engine {
  constructor() {
    this.ctx = null
    this.patch = null
    this.voices = new Map() // midi -> voice, for notes still held or sustained
    this.down = new Set() // keys physically held
    this.sustain = false
    this.volume = 0.7
    this.events = { arp: 0, rain: 0, gust: 0, thunder: 0 } // last time each layer fired
    this.onNotes = null
    this.onStep = null
  }

  get running() {
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
    const lfo = (freq) => {
      const o = ctx.createOscillator()
      o.frequency.value = freq
      o.start()
      return o
    }

    // Output: master -> limiter -> analyser -> speakers
    this.master = gain(this.volume * 0.6)
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -10
    limiter.ratio.value = 12
    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 1024
    this.master.connect(limiter).connect(this.analyser).connect(ctx.destination)

    // Space: pan -> dry + two reverbs (short and long, crossfaded by humidity)
    this.panner = ctx.createStereoPanner()
    this.panner.connect(this.master)
    this.reverbSend = gain(0)
    this.panner.connect(this.reverbSend)
    this.revShort = gain(1)
    this.revLong = gain(0)
    const convShort = ctx.createConvolver()
    convShort.buffer = impulse(ctx, 1.2, 3)
    const convLong = ctx.createConvolver()
    convLong.buffer = impulse(ctx, 5, 2.2)
    this.reverbSend.connect(convShort).connect(this.revShort).connect(this.master)
    this.reverbSend.connect(convLong).connect(this.revLong).connect(this.master)
    // Echo (waves): a feedback delay timed to the wind's clock, darkening as it repeats
    this.delaySend = gain(0)
    this.delay = ctx.createDelay(2)
    this.delay.delayTime.value = 0.3
    this.delayFeedback = gain(0.3)
    const delayTone = ctx.createBiquadFilter()
    delayTone.type = 'lowpass'
    delayTone.frequency.value = 2800
    this.panner.connect(this.delaySend).connect(this.delay).connect(delayTone)
    delayTone.connect(this.delayFeedback).connect(this.delay)
    delayTone.connect(this.master)
    delayTone.connect(this.reverbSend)
    this.panLfo = lfo(0.1)
    this.panLfoGain = gain(0)
    this.panLfo.connect(this.panLfoGain).connect(this.panner.pan)

    // Post-filter bus, with a chorus alongside (fog)
    this.post = gain(1)
    this.post.connect(this.panner)
    const chorusDelay = ctx.createDelay(0.1)
    chorusDelay.delayTime.value = 0.022
    const chorusLfoGain = gain(0.004)
    lfo(0.35).connect(chorusLfoGain).connect(chorusDelay.delayTime)
    this.chorusWet = gain(0)
    this.post.connect(chorusDelay).connect(this.chorusWet).connect(this.panner)

    // Filter (cloud), opened briefly by gusts, then tremolo (wind)
    this.filter = ctx.createBiquadFilter()
    this.filter.type = 'lowpass'
    this.filter.frequency.value = 18000
    this.gustCv = ctx.createConstantSource()
    this.gustCv.offset.value = 0
    this.gustCv.start()
    this.gustCv.connect(this.filter.detune)
    this.trem = gain(1)
    this.tremLfo = lfo(1)
    this.tremLfoGain = gain(0)
    this.tremLfo.connect(this.tremLfoGain).connect(this.trem.gain)
    // Tone tilt (sun): brighter in sunshine, darker at night
    this.tilt = ctx.createBiquadFilter()
    this.tilt.type = 'highshelf'
    this.tilt.frequency.value = 2200
    this.tilt.gain.value = 0
    // Cloud layers: three bands, each pulled down by its own layer of cloud
    const band = (type, freq) => {
      const f = ctx.createBiquadFilter()
      f.type = type
      f.frequency.value = freq
      f.gain.value = 0
      return f
    }
    this.bandLow = band('lowshelf', 220)
    this.bandMid = band('peaking', 900)
    this.bandMid.Q.value = 0.8
    this.bandHigh = band('highshelf', 5000)
    this.filter.connect(this.trem).connect(this.tilt).connect(this.bandLow)
      .connect(this.bandMid).connect(this.bandHigh).connect(this.post)

    // Voice bus, split clean / crushed (air quality)
    this.voiceBus = gain(1)
    this.crushDry = gain(1)
    this.crushWet = gain(0)
    this.shaper = ctx.createWaveShaper()
    this.crushSteps = 0
    // ...then clean / overdriven (storm energy)
    const preDrive = gain(1)
    this.voiceBus.connect(this.crushDry).connect(preDrive)
    this.voiceBus.connect(this.shaper).connect(this.crushWet).connect(preDrive)
    this.driveDry = gain(1)
    this.driveWet = gain(0)
    const driveBoost = gain(6)
    const driveShaper = ctx.createWaveShaper()
    const curve = new Float32Array(1024)
    for (let i = 0; i < 1024; i++) curve[i] = Math.tanh(((i / 1023) * 2 - 1) * 2.5) * 0.55
    driveShaper.curve = curve
    driveShaper.oversample = '2x'
    preDrive.connect(this.driveDry).connect(this.filter)
    preDrive.connect(driveBoost).connect(driveShaper).connect(this.driveWet).connect(this.filter)

    // One bus per oscillator layer, so the weather can remix held notes live
    this.bus = {}
    for (const k of ['tri', 'saw', 'glass', 'sub', 'harm', 'moon']) {
      this.bus[k] = gain(0)
      this.bus[k].connect(this.voiceBus)
    }
    this.bus.tri.gain.value = 0.5
    this.arpBus = gain(0)
    this.arpBus.connect(this.voiceBus)
    // Droplets skip the filter, or an overcast sky would swallow them
    this.rainBus = gain(0)
    this.rainBus.connect(this.post)
    // Rain percussion and thunder also go in after the filter
    this.percBus = gain(0)
    this.percBus.connect(this.post)
    this.thunderBus = gain(0)
    this.thunderBus.connect(this.post)

    // Pitch drift (low pressure): one shared wandering offset, in cents
    this.drift = ctx.createConstantSource()
    this.drift.offset.value = 0
    this.drift.start()

    // Drone: follows the lowest held note
    this.droneGain = gain(0)
    const droneFilter = ctx.createBiquadFilter()
    droneFilter.type = 'lowpass'
    droneFilter.frequency.value = 500
    this.droneOscs = [['sawtooth', 0, 0.5], ['sine', 0, 0.7], ['triangle', 7, 0.35]].map(([type, iv, lvl]) => {
      const o = ctx.createOscillator()
      o.type = type
      o.frequency.value = 55
      this.drift.connect(o.detune)
      const g = gain(lvl)
      o.connect(g).connect(droneFilter)
      o.start()
      return { o, iv }
    })
    droneFilter.connect(this.droneGain).connect(this.voiceBus)

    // Gust noise: a looping noise bed, let through in bursts
    const noise = ctx.createBufferSource()
    const nbuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const nd = nbuf.getChannelData(0)
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1
    noise.buffer = nbuf
    noise.loop = true
    noise.start()
    this.noiseBuffer = nbuf
    // Storm rumble: the same noise, kept very low
    const rumbleTone = ctx.createBiquadFilter()
    rumbleTone.type = 'lowpass'
    rumbleTone.frequency.value = 70
    this.rumble = gain(0)
    noise.connect(rumbleTone).connect(this.rumble).connect(this.post)
    this.burst = true
    this.gustBand = ctx.createBiquadFilter()
    this.gustBand.type = 'bandpass'
    this.gustBand.frequency.value = 600
    this.gustBand.Q.value = 0.8
    this.gustNoise = gain(0)
    noise.connect(this.gustBand).connect(this.gustNoise).connect(this.post)

    this.step = 0
    this.arpIdx = 0
    this.nextStep = ctx.currentTime + 0.1
    setInterval(() => this._clock(), 25)
    setInterval(() => this._wander(), 250)
    if (this.patch) this.apply(this.patch)
  }

  setVolume(v) {
    this.volume = v
    if (this.ctx) this.master.gain.setTargetAtTime(v * 0.6, this.ctx.currentTime, 0.05)
  }

  // Apply a new patch. Safe to call often; everything glides.
  apply(p) {
    this.patch = p
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const set = (param, v) => param.setTargetAtTime(v, t, SMOOTH)
    set(this.bus.tri.gain, p.triLevel)
    set(this.bus.saw.gain, p.sawLevel)
    set(this.bus.glass.gain, p.glassLevel)
    set(this.bus.sub.gain, p.subLevel)
    set(this.bus.harm.gain, p.harmLevel)
    set(this.arpBus.gain, p.arpLevel)
    set(this.rainBus.gain, p.rainLevel)
    set(this.filter.frequency, p.cutoff)
    set(this.filter.Q, p.filterQ)
    set(this.tilt.gain, p.tiltDb)
    set(this.bus.moon.gain, p.moonLevel)
    set(this.bandLow.gain, p.lowDb)
    set(this.bandMid.gain, p.midDb)
    set(this.bandHigh.gain, p.highDb)
    set(this.delaySend.gain, p.delayWet)
    set(this.delayFeedback.gain, p.delayFeedback)
    this.delay.delayTime.setTargetAtTime(p.delayTime, t, 0.5)
    set(this.driveWet.gain, p.driveWet)
    set(this.driveDry.gain, 1 - p.driveWet * 0.7)
    set(this.percBus.gain, p.percLevel)
    set(this.thunderBus.gain, p.thunderLevel)
    set(this.trem.gain, 1 - p.tremDepth / 2)
    set(this.tremLfoGain.gain, p.tremDepth / 2)
    set(this.tremLfo.frequency, p.tremRate)
    set(this.panner.pan, p.pan)
    set(this.panLfoGain.gain, p.autopanDepth)
    set(this.panLfo.frequency, p.autopanRate)
    set(this.reverbSend.gain, p.reverbWet)
    set(this.revShort.gain, 1 - p.reverbSize)
    set(this.revLong.gain, p.reverbSize)
    set(this.chorusWet.gain, p.chorusWet)
    set(this.crushWet.gain, p.crushWet)
    set(this.crushDry.gain, 1 - p.crushWet)
    if (p.crushSteps !== this.crushSteps) {
      this.crushSteps = p.crushSteps
      this.shaper.curve = crushCurve(p.crushSteps)
    }
    this._updateDrone()
  }

  activeNotes() {
    return [...this.voices.keys()].sort((a, b) => a - b)
  }

  // `at` is an optional audio-clock time, used by the sequencer for tight timing.
  noteOn(midi, velocity = 0.8, at = 0) {
    this.down.add(midi)
    if (!this.ctx || !this.patch) return
    const ctx = this.ctx, p = this.patch, t = Math.max(at, ctx.currentTime), f = mtof(midi)
    if (this.voices.has(midi)) this._release(midi, 0.05, t)
    const voice = { oscs: [], envs: [] }
    const add = (type, freq, bus, level = 1, detune = 0) => {
      const osc = ctx.createOscillator()
      osc.type = type
      osc.frequency.value = freq
      osc.detune.value = detune
      this.drift.connect(osc.detune)
      const env = ctx.createGain()
      env.gain.value = 0
      osc.connect(env).connect(bus)
      osc.start(t)
      voice.oscs.push(osc)
      voice.envs.push({ node: env, peak: velocity * level })
      return osc
    }
    add('triangle', f, this.bus.tri)
    add('sawtooth', f, this.bus.saw, 0.5, p.sawDetune)
    add('sawtooth', f, this.bus.saw, 0.5, -p.sawDetune)
    // Glass: a sine an octave up, frequency-modulated for a bell-like edge
    const carrier = add('sine', f * 2, this.bus.glass)
    const mod = ctx.createOscillator()
    mod.frequency.value = f * p.fmRatio
    const modGain = ctx.createGain()
    modGain.gain.value = f * 2 * p.fmIndex
    mod.connect(modGain).connect(carrier.frequency)
    mod.start(t)
    voice.oscs.push(mod)
    add('sine', f / 2, this.bus.sub)
    add('sine', f * (midi <= 72 ? 4 : 2), this.bus.moon) // moonlight: a pure high octave
    for (const iv of p.harmony) {
      add('triangle', f * Math.pow(2, iv / 12), this.bus.harm, 1 / p.harmony.length)
    }
    for (const e of voice.envs) {
      e.node.gain.setValueAtTime(0, t)
      e.node.gain.linearRampToValueAtTime(e.peak, t + p.attack)
      e.node.gain.setTargetAtTime(e.peak * 0.8, t + p.attack, 0.4)
    }
    this.voices.set(midi, voice)
    this._notesChanged()
  }

  noteOff(midi, at = 0) {
    this.down.delete(midi)
    if (this.sustain) return
    this._release(midi, undefined, at)
    this._notesChanged()
  }

  setSustain(on) {
    this.sustain = on
    if (on) return
    for (const midi of [...this.voices.keys()]) {
      if (!this.down.has(midi)) this._release(midi)
    }
    this._notesChanged()
  }

  _release(midi, time, at = 0) {
    const voice = this.voices.get(midi)
    if (!voice) return
    this.voices.delete(midi)
    const t = Math.max(at, this.ctx.currentTime)
    const rel = time ?? this.patch.release
    for (const e of voice.envs) {
      const g = e.node.gain
      if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t)
      else {
        g.cancelScheduledValues(t)
        g.setValueAtTime(g.value, t)
      }
      g.setTargetAtTime(0, t, rel / 3)
    }
    for (const o of voice.oscs) o.stop(t + rel * 2 + 0.1)
  }

  _notesChanged() {
    if (!this.voices.size) this.arpIdx = 0
    this._updateDrone()
    this.onNotes?.(this.activeNotes())
  }

  _updateDrone() {
    if (!this.ctx || !this.patch) return
    const t = this.ctx.currentTime
    const notes = this.activeNotes()
    if (!notes.length) {
      this.droneGain.gain.setTargetAtTime(0, t, 2.5) // lingers after you let go
      this.rumble.gain.setTargetAtTime(0, t, 1.5)
      return
    }
    this.rumble.gain.setTargetAtTime(this.patch.rumble, t, 0.8)
    let root = notes[0] - 12
    while (root < 28) root += 12
    for (const { o, iv } of this.droneOscs) o.frequency.setTargetAtTime(mtof(root + iv), t, 0.15)
    this.droneGain.gain.setTargetAtTime(this.patch.droneLevel, t, 1.2)
  }

  get droneOn() {
    return this.voices.size > 0 && (this.patch?.droneLevel ?? 0) > 0.01
  }

  // Slow random walk for the pitch drift.
  _wander() {
    const cents = this.patch?.driftCents ?? 0
    this.drift.offset.setTargetAtTime((Math.random() * 2 - 1) * cents, this.ctx.currentTime, 0.8)
  }

  // Look-ahead scheduler: one step is a 16th note at the wind's tempo.
  _clock() {
    const ctx = this.ctx, p = this.patch
    if (!p || ctx.state !== 'running') return
    if (this.nextStep < ctx.currentTime) this.nextStep = ctx.currentTime + 0.02
    while (this.nextStep < ctx.currentTime + 0.12) {
      const dur = 60 / p.bpm / 4
      this._step(this.step, this.nextStep, dur)
      this.nextStep += dur * (this.step % 2 === 0 ? 1 + p.swing : 1 - p.swing)
      this.step++
    }
  }

  _step(i, t, dur) {
    const p = this.patch
    this.onStep?.(t) // the sequencer starts and stops its notes here
    const notes = this.activeNotes()
    if (Math.random() < p.gustRate * dur) this._gust(t, notes.length > 0)
    if (!notes.length) return

    if (p.arpLevel > 0.01) {
      // Climb the held notes over two octaves
      const seq = [...notes, ...notes.map((n) => n + 12)]
      const accent = i % 4 === 0 ? 1 : 0.55 + Math.random() * 0.3
      this._pluck(seq[this.arpIdx++ % seq.length], t, accent, dur)
      this.events.arp = performance.now()
    }
    if (p.perc && p.percLevel > 0.01) this._percussion(p.perc, i, t, dur)
    if (p.thunderLevel > 0.01 && Math.random() < p.thunderRate * dur) this._thunder(t)
    if (p.rainLevel > 0.01 && p.pattern[i % 8] && Math.random() < p.rainProb) {
      const base = notes[Math.floor(Math.random() * notes.length)]
      const up = [12, 19, 24][Math.floor(Math.random() * 3)]
      this._droplet(base + up + (p.snow ? 12 : 0), t + Math.random() * dur * 0.3)
      this.events.rain = performance.now()
    }
  }

  _pluck(midi, t, level, dur) {
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = mtof(midi)
    this.drift.connect(osc.detune)
    const env = ctx.createGain()
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(level, t + 0.004)
    env.gain.setTargetAtTime(0, t + 0.004, Math.max(0.04, dur * 0.6))
    osc.connect(env).connect(this.arpBus)
    osc.start(t)
    osc.stop(t + dur * 6 + 0.3)
  }

  _droplet(midi, t) {
    const ctx = this.ctx, snow = this.patch.snow
    const f = mtof(Math.min(midi, 108))
    const osc = ctx.createOscillator()
    osc.frequency.setValueAtTime(snow ? f : f * 1.5, t)
    if (!snow) osc.frequency.exponentialRampToValueAtTime(f, t + 0.03)
    const env = ctx.createGain()
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(snow ? 0.5 : 0.9, t + (snow ? 0.08 : 0.003))
    env.gain.setTargetAtTime(0, t + (snow ? 0.08 : 0.003), snow ? 0.35 : 0.07)
    const pan = ctx.createStereoPanner()
    pan.pan.value = Math.random() * 1.6 - 0.8
    osc.connect(env).connect(pan).connect(this.rainBus)
    osc.start(t)
    osc.stop(t + (snow ? 2.5 : 0.8))
  }

  // A burst of noise through a filter: the basis of every percussion sound.
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

  // Rain percussion. The style comes from the kind of rain that is falling.
  _percussion(style, i, t, dur) {
    const ctx = this.ctx
    // Showers come and go: re-roll every two bars whether this one is a burst
    if (i % 16 === 0) this.burst = !style.bursts || Math.random() < 0.7
    if (!this.burst) return
    const k = style.tick
    if (Math.random() < k.prob) {
      const accent = i % 2 === 0 ? 1 : 0.6
      this._noiseHit(t + Math.random() * dur * 0.15, {
        type: k.freq > 4000 ? 'highpass' : 'bandpass', freq: k.freq, decay: k.decay,
        level: k.level * accent * (0.7 + Math.random() * 0.3), bus: this.percBus,
      })
    }
    if (style.thud?.includes(i % 8)) {
      const osc = ctx.createOscillator()
      osc.frequency.setValueAtTime(170, t)
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.09)
      const env = ctx.createGain()
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(0.9, t + 0.003)
      env.gain.setTargetAtTime(0, t + 0.003, 0.06)
      osc.connect(env).connect(this.percBus)
      osc.start(t)
      osc.stop(t + 0.6)
    }
    if (style.ping && Math.random() < style.ping) {
      const osc = ctx.createOscillator()
      osc.frequency.value = 3000 + Math.random() * 3000
      const env = ctx.createGain()
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(0.25, t + 0.002)
      env.gain.setTargetAtTime(0, t + 0.002, 0.05)
      osc.connect(env).connect(this.percBus)
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

  _gust(t, audible) {
    const p = this.patch
    const len = 0.3 + Math.random() * 0.9
    this.gustCv.offset.setTargetAtTime(p.gustCents, t, 0.08)
    this.gustCv.offset.setTargetAtTime(0, t + len, 0.3)
    if (audible && p.gustNoise > 0.005) {
      this.gustNoise.gain.setTargetAtTime(p.gustNoise, t, 0.15)
      this.gustNoise.gain.setTargetAtTime(0, t + len, 0.4)
      this.gustBand.frequency.setTargetAtTime(400 + Math.random() * 400, t, 0.01)
      this.gustBand.frequency.setTargetAtTime(1200 + Math.random() * 800, t + 0.05, len / 2)
    }
    if (p.gustCents > 1) this.events.gust = performance.now()
  }

  // 0..1 output level, for the meter and for testing.
  level() {
    if (!this.analyser) return 0
    const buf = new Float32Array(this.analyser.fftSize)
    this.analyser.getFloatTimeDomainData(buf)
    let sum = 0
    for (const x of buf) sum += x * x
    return Math.sqrt(sum / buf.length)
  }
}
