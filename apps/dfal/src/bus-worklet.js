// The audio-thread half of the patch bus, shared by every patchable synth's
// AudioWorklet. It plays back signals arriving from other windows into input
// jacks, and collects this synth's output jacks to send to other windows.
// Audio jacks go at the full sample rate; other jacks at about 1.5 kHz.
//
// In the processor:  this.io = new BusIO(this.port, ins, outs, outTypes)
//   in onmessage:     if (this.io.message(m)) return
//   each sample:      this.io.addRemote(x, t) after filling inputs from local cables
//                     this.io.collect(o, t) after computing outputs

const BLOCK = 512 // samples per message, about 11 ms

export class BusIO {
  constructor(port, ins, outs, outTypes) {
    this.port = port
    this.IN = Object.fromEntries(ins.map((id, i) => [id, i]))
    this.OUT = Object.fromEntries(outs.map((id, i) => [id, i]))
    this.types = outTypes
    this.remote = new Map() // stream id -> { input, segs, hold }
    this.list = []
    this.stream = [] // { id, idx, d, buf }
    this.n = 0
    this.t0 = 0
    this.cvEvery = Math.max(1, Math.round(sampleRate / 1500))
  }

  message(m) {
    if (m.type === 'remote') {
      let r = this.remote.get(m.id)
      if (!r) {
        this.remote.set(m.id, (r = { input: 0, segs: [], hold: 0 }))
        this.list = [...this.remote.values()]
      }
      r.input = this.IN[m.input]
      r.segs.push({ t: m.t, dt: m.dt, v: m.v })
      if (r.segs.length > 64) r.segs.splice(0, r.segs.length - 64)
      return true
    }
    if (m.type === 'unremote') {
      for (const id of m.ids) this.remote.delete(id)
      this.list = [...this.remote.values()]
      return true
    }
    if (m.type === 'stream') {
      this.stream = m.outs.map((id) => {
        const d = this.types[id] === 'audio' ? 1 : this.cvEvery
        return { id, idx: this.OUT[id], d, buf: new Float32Array(Math.ceil(BLOCK / d)) }
      })
      this.n = 0
      return true
    }
    return false
  }

  addRemote(x, t) {
    for (let k = 0; k < this.list.length; k++) {
      const r = this.list[k]
      x[r.input] += this.read(r, t)
    }
  }

  read(r, t) {
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

  collect(o, t) {
    const st = this.stream
    if (!st.length) return
    if (this.n === 0) this.t0 = t
    for (let k = 0; k < st.length; k++) {
      const s = st[k]
      if (this.n % s.d === 0) s.buf[(this.n / s.d) | 0] = o[s.idx]
    }
    if (++this.n === BLOCK) {
      this.n = 0
      this.port.postMessage({
        type: 'sig',
        t: this.t0,
        sigs: st.map((s) => ({ jack: s.id, dt: s.d / sampleRate, v: s.buf.slice() })),
      })
    }
  }
}
