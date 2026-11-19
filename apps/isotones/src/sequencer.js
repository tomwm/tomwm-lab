// Step sequencer. Record notes or chords one step at a time, then loop them
// at the wind's tempo. Sequenced notes go through the engine like played
// ones, so the weather's generative layers respond to them too.

export class Sequencer {
  constructor(engine, onChange) {
    this.engine = engine
    this.onChange = onChange
    this.steps = [] // each step is an array of { midi, vel }; empty = rest
    this.max = 8
    this.rate = 2 // clock steps (16th notes) per sequencer step
    this.recording = false
    this.playing = false
    this.pending = null // chord being built while keys are down
    this.pos = -1
    this.tick = 0
    this.sounding = []
    this.waitForBar = false // linked: hold the first step until the next bar line
  }

  record() {
    this.stop()
    this.steps = []
    this.pending = null
    this.recording = true
    this.onChange()
  }

  finishRecording() {
    if (this.pending) this.steps.push(this.pending)
    this.pending = null
    this.recording = false
    this.onChange()
  }

  // Called for every note the player presses.
  noteOn(midi, vel) {
    if (!this.recording) return
    ;(this.pending ??= []).push({ midi, vel })
    this.onChange()
  }

  // Called when the player has let go of every key: the chord becomes a step.
  keysUp() {
    if (this.recording && this.pending) this._commit(this.pending)
  }

  rest() {
    if (this.recording && !this.pending) this._commit([])
  }

  _commit(step) {
    this.steps.push(step)
    this.pending = null
    if (this.steps.length >= this.max) this.recording = false
    this.onChange()
  }

  setMax(n) {
    this.max = n
    if (this.steps.length > n) this.steps.length = n
    if (this.recording && this.steps.length >= n) this.recording = false
    this.onChange()
  }

  clear() {
    this.stop()
    this.recording = false
    this.pending = null
    this.steps = []
    this.onChange()
  }

  play(alignToBar = false) {
    if (this.recording) this.finishRecording()
    if (!this.steps.length) return
    this.waitForBar = alignToBar
    this.playing = true
    this.tick = 0
    this.pos = -1
    this.onChange()
  }

  stop() {
    if (!this.playing) return
    this.playing = false
    this._release()
    this.pos = -1
    this.onChange()
  }

  _release(t) {
    for (const midi of this.sounding) this.engine.noteOff(midi, t)
    this.sounding = []
  }

  // Called by the engine on every clock step, with the exact audio time.
  // t: audio time of this clock step; i: its step number (16 to a bar)
  clock(t, i = 0) {
    if (!this.playing) return
    if (this.waitForBar) {
      if (i % 16 !== 0) return
      this.waitForBar = false
    }
    const phase = this.tick++ % this.rate
    if (phase === 0) {
      this._release(t)
      this.pos = (this.pos + 1) % this.steps.length
      for (const n of this.steps[this.pos]) this.engine.noteOn(n.midi, n.vel, t)
      this.sounding = this.steps[this.pos].map((n) => n.midi)
      this.onChange()
    } else if (phase === this.rate - 1) {
      this._release(t) // leave a gap before the next step
    }
  }
}
