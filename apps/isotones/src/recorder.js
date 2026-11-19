// Captures the synth's final output (after the limiter) as raw samples and
// turns them into a 16-bit stereo WAV file, which opens in any audio app.

// Runs on the audio thread: collects blocks and sends them over in batches.
const WORKLET = `
class IsoTap extends AudioWorkletProcessor {
  constructor() {
    super()
    this.size = 8192
    this.reset()
    this.running = true
    this.port.onmessage = (e) => {
      if (e.data === 'stop') {
        this.flush()
        this.port.postMessage('done')
        this.running = false
      }
    }
  }
  reset() {
    this.buf = [new Float32Array(this.size), new Float32Array(this.size)]
    this.n = 0
  }
  flush() {
    if (!this.n) return
    this.port.postMessage([this.buf[0].slice(0, this.n), this.buf[1].slice(0, this.n)])
    this.reset()
  }
  process(inputs) {
    const input = inputs[0]
    if (input && input.length) {
      const left = input[0], right = input[1] || input[0]
      for (let i = 0; i < left.length; i++) {
        this.buf[0][this.n] = left[i]
        this.buf[1][this.n] = right[i]
        if (++this.n === this.size) this.flush()
      }
    }
    return this.running
  }
}
registerProcessor('iso-tap', IsoTap)
`

let moduleUrl = null

export class AudioRecorder {
  constructor(ctx, source) {
    this.ctx = ctx
    this.source = source
    this.node = null
    this.frames = 0
  }

  // Seconds since the first sound, or null if nothing has been heard yet.
  get heardSeconds() {
    return this.firstSound == null ? null : (this.frames - this.firstSound) / this.ctx.sampleRate
  }

  async start() {
    moduleUrl ??= URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }))
    if (!this.loaded) {
      await this.ctx.audioWorklet.addModule(moduleUrl)
      this.loaded = true
    }
    this.chunks = []
    this.frames = 0
    this.firstSound = null // frame of the first audible sample
    this.node = new AudioWorkletNode(this.ctx, 'iso-tap', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      channelCount: 2,
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
    })
    this.node.port.onmessage = (e) => {
      if (e.data === 'done') return this._done?.()
      const [l, r] = e.data
      if (this.firstSound == null) {
        for (let i = 0; i < l.length; i++) {
          if (Math.abs(l[i]) > 0.001 || Math.abs(r[i]) > 0.001) {
            this.firstSound = this.frames + i
            break
          }
        }
      }
      this.chunks.push(e.data)
      this.frames += l.length
    }
    // Some browsers only run nodes that lead somewhere, so feed a silent output
    this.mute = this.ctx.createGain()
    this.mute.gain.value = 0
    this.source.connect(this.node)
    this.node.connect(this.mute).connect(this.ctx.destination)
  }

  // Stops capturing and resolves with a WAV Blob, at most maxSeconds long.
  async stop(maxSeconds = Infinity) {
    const node = this.node
    if (!node) return null
    await new Promise((resolve) => {
      this._done = resolve
      node.port.postMessage('stop')
    })
    this.source.disconnect(node)
    node.disconnect()
    this.mute.disconnect()
    this.node = null
    const rate = this.ctx.sampleRate
    return encodeWav(trimEnd(trimStart(this.chunks), Math.round(maxSeconds * rate)), rate)
  }
}

// Drop the near-silence before the first note (at most half a second of it).
function trimStart(chunks) {
  let skip = 0
  outer: for (const [l, r] of chunks) {
    for (let i = 0; i < l.length; i++, skip++) {
      if (Math.abs(l[i]) > 0.001 || Math.abs(r[i]) > 0.001) break outer
    }
  }
  skip = Math.max(0, skip - 480) // keep ~10 ms before the attack
  const out = []
  for (const [l, r] of chunks) {
    if (skip >= l.length) {
      skip -= l.length
      continue
    }
    out.push([l.subarray(skip), r.subarray(skip)])
    skip = 0
  }
  return out
}

function trimEnd(chunks, maxFrames) {
  const out = []
  let left = maxFrames
  for (const [l, r] of chunks) {
    if (left <= 0) break
    out.push(l.length > left ? [l.subarray(0, left), r.subarray(0, left)] : [l, r])
    left -= l.length
  }
  return out
}

function encodeWav(chunks, rate) {
  const frames = chunks.reduce((n, c) => n + c[0].length, 0)
  const view = new DataView(new ArrayBuffer(44 + frames * 4))
  const text = (at, s) => [...s].forEach((ch, i) => view.setUint8(at + i, ch.charCodeAt(0)))
  text(0, 'RIFF')
  view.setUint32(4, 36 + frames * 4, true)
  text(8, 'WAVE')
  text(12, 'fmt ')
  view.setUint32(16, 16, true) // chunk size
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 2, true) // stereo
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * 4, true) // bytes per second
  view.setUint16(32, 4, true) // bytes per frame
  view.setUint16(34, 16, true) // bits per sample
  text(36, 'data')
  view.setUint32(40, frames * 4, true)
  // Fade the last 80 ms so the file never ends on a click
  const fadeFrom = frames - Math.min(frames, Math.round(rate * 0.08))
  let at = 44, f = 0
  for (const [l, r] of chunks) {
    for (let i = 0; i < l.length; i++, f++) {
      const g = f < fadeFrom ? 1 : (frames - f) / (frames - fadeFrom)
      view.setInt16(at, Math.max(-1, Math.min(1, l[i] * g)) * 0x7fff, true)
      view.setInt16(at + 2, Math.max(-1, Math.min(1, r[i] * g)) * 0x7fff, true)
      at += 4
    }
  }
  return new Blob([view], { type: 'audio/wav' })
}
