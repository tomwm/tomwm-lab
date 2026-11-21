// The patch bus: patch cables between synth windows open in the same browser.
//
// Every module (DFAL now, others later) opens a window, joins the bus and says
// which jacks it has. A cable joins an output jack to an input jack. If both ends
// are on the same module, that module handles it at audio rate. If they're on
// different modules, the sender streams its output's voltage over the bus and
// the receiver plays it back into its input.
//
// Rules every module follows, so they can be patched together:
// - Signals are in volts, like hardware: 1 V per octave for pitch, 0 to 5 V for
//   envelopes, velocity and gates, ±5 V for audio. A gate is high above 1.5 V.
// - Between windows, a signal is sent as samples stamped with the computer's
//   clock (see wallNow): audio jacks at the full sample rate, others at about
//   1.5 kHz. bus-worklet.js does this on the audio thread. The receiver plays each one
//   BUS_DELAY seconds after that stamp, which hides the time messages take.
//   A module that sends signals delays its own sound by the same amount, so the
//   two windows' speakers stay in time.
// - Audio between windows works but is heavier, and can crackle if a window is
//   busy for longer than BUS_DELAY.
//
// The cable list is shared by every module (localStorage plus messages), so a
// cable made in one window appears in the other, and cables come back when the
// windows are reopened.

const CHANNEL = 'patch-bus'
const CABLES_KEY = 'patchbus.cables'
const BEAT_EVERY = 1000
const GONE_AFTER = 3500
const ARM_FOR = 30000 // ms an armed jack waits for its other end

export const BUS_DELAY = 0.05 // seconds

export const wallNow = () => performance.timeOrigin + performance.now()

// Convert between the computer's clock and an AudioContext's clock, allowing for
// the output's delay so that different windows' speakers line up.
export function wallToCtx(ctx, wall) {
  const ts = ctx.getOutputTimestamp?.()
  if (ts && ts.performanceTime > 0) return ts.contextTime + (wall - performance.timeOrigin - ts.performanceTime) / 1000
  return ctx.currentTime + (wall - wallNow()) / 1000
}
export function ctxToWall(ctx, t) {
  const ts = ctx.getOutputTimestamp?.()
  if (ts && ts.performanceTime > 0) return performance.timeOrigin + ts.performanceTime + (t - ts.contextTime) * 1000
  return wallNow() + (t - ctx.currentTime) * 1000
}

const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key)
      return v == null ? fallback : JSON.parse(v)
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  },
}
const session = {
  get(key) {
    try {
      return sessionStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key, value) {
    try {
      sessionStorage.setItem(key, value)
    } catch {}
  },
}

export const sameEnd = (a, b) => a.mod === b.mod && a.jack === b.jack

export class PatchBus {
  // kind: short lower-case name ('dfal'); title: shown to people ('DFAL');
  // jacks: [{ id, label, dir: 'in' | 'out', type: 'audio' | 'cv' | 'gate' }]
  // onChange(): modules or cables changed. onSignal(inJack, streamId, wallT0, dt, values)
  // onArm(end | null): a jack in any window is waiting for its other end.
  constructor({ kind, title, jacks, onChange, onSignal, onArm, onDrop }) {
    Object.assign(this, { kind, title, jacks, onChange, onSignal, onArm, onDrop })
    this.nonce = Math.random().toString(36).slice(2)
    this.born = wallNow()
    this.id = null
    this.modules = new Map() // other modules: id -> { id, kind, title, jacks, seen }
    this.cables = store.get(CABLES_KEY, [])
    this.armed = null
    this.armTimer = null
    this.channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL)
  }

  get name() {
    return this.id ? this.moduleName(this.id) : this.title
  }

  // Join the bus. Listens briefly to learn which numbers are taken, then picks
  // this window's number: the one it had before a reload if free, else the lowest.
  async start() {
    if (this.channel) {
      this.channel.onmessage = ({ data }) => this._receive(data)
      this._send({ type: 'who' })
      await new Promise((r) => setTimeout(r, 300))
    }
    this._pickId()
    window.addEventListener('storage', (e) => {
      if (e.key !== CABLES_KEY) return
      this.cables = store.get(CABLES_KEY, [])
      this.onChange?.()
    })
    window.addEventListener('pagehide', () => this._send({ type: 'bye' }))
    setInterval(() => this._beat(), BEAT_EVERY)
    this._beat()
    return this.id
  }

  _pickId(avoid) {
    const taken = new Set([...this.modules.keys(), avoid])
    const pref = session.get(`patchbus.id.${this.kind}`)
    let id = pref && !taken.has(pref) ? pref : null
    for (let n = 1; !id; n++) if (!taken.has(`${this.kind}-${n}`)) id = `${this.kind}-${n}`
    this.id = id
    session.set(`patchbus.id.${this.kind}`, id)
  }

  _send(msg) {
    this.channel?.postMessage({ ...msg, from: this.id, nonce: this.nonce })
  }

  _beat() {
    this._send({ type: 'here', kind: this.kind, title: this.title, jacks: this.jacks, born: this.born })
    const now = Date.now()
    let changed = false
    for (const [id, m] of this.modules) {
      if (now - m.seen > GONE_AFTER) {
        this.modules.delete(id)
        this.onDrop?.(id)
        changed = true
      }
    }
    if (changed) this.onChange?.()
  }

  _receive(msg) {
    if (!msg || msg.nonce === this.nonce) return
    if (msg.type === 'who') return this.id && this._beat()
    if (!msg.from) return
    if (msg.type === 'bye') {
      if (this.modules.delete(msg.from)) {
        this.onDrop?.(msg.from)
        this.onChange?.()
      }
      return
    }
    if (msg.type === 'here') {
      // Two windows took the same number (opened at the same moment, or a
      // duplicated tab): the younger one moves to another number.
      if (msg.from === this.id && (this.born > msg.born || (this.born === msg.born && this.nonce > msg.nonce))) {
        const old = this.id
        this._pickId(old)
        this.onRenamed?.(old, this.id)
        this._beat()
        this.onChange?.()
      }
      if (msg.from === this.id) return
      const known = this.modules.has(msg.from)
      this.modules.set(msg.from, { id: msg.from, kind: msg.kind, title: msg.title, jacks: msg.jacks, seen: Date.now() })
      if (!known) {
        this._beat()
        this.onChange?.()
      }
      return
    }
    if (msg.type === 'cables') {
      this.cables = msg.cables
      this.onChange?.()
      return
    }
    if (msg.type === 'arm') {
      this._setArmed(msg.end, false)
      return
    }
    if (msg.type === 'sig') {
      for (const c of this.cables) {
        if (c.to.mod === this.id && c.from.mod === msg.from && c.from.jack === msg.jack) {
          this.onSignal?.(c.to.jack, c.id, msg.t, msg.dt, msg.v)
        }
      }
    }
  }

  // ---- Modules and jacks ----

  module(id) {
    if (id === this.id) return { id, kind: this.kind, title: this.title, jacks: this.jacks }
    return this.modules.get(id)
  }
  moduleName(id) {
    const m = this.module(id)
    if (!m) return id
    const n = id.split('-').pop()
    return /\d$/.test(m.title) ? `${m.title} #${n}` : `${m.title} ${n}`
  }
  jack(end) {
    return this.module(end.mod)?.jacks.find((j) => j.id === end.jack)
  }
  present(modId) {
    return modId === this.id || this.modules.has(modId)
  }

  // ---- Cables ----

  _saveCables() {
    store.set(CABLES_KEY, this.cables)
    this._send({ type: 'cables', cables: this.cables })
    this.onChange?.()
  }
  // Cables with an end on this module
  myCables() {
    return this.cables.filter((c) => c.from.mod === this.id || c.to.mod === this.id)
  }
  // Join two jacks (either order). Returns { cable } or { error }.
  connect(a, b) {
    const ja = this.jack(a)
    const jb = this.jack(b)
    if (!ja || !jb) return { error: 'That jack has gone' }
    if (ja.dir === jb.dir) return { error: `Those are both ${ja.dir === 'in' ? 'inputs' : 'outputs'}` }
    const [from, to] = ja.dir === 'out' ? [a, b] : [b, a]
    if (this.cables.some((c) => sameEnd(c.from, from) && sameEnd(c.to, to))) return { error: 'Already patched' }
    const cable = { id: Math.random().toString(36).slice(2, 10), from: { ...from }, to: { ...to } }
    this.cables = [...this.cables, cable]
    this._saveCables()
    return { cable }
  }
  disconnect(id) {
    this.cables = this.cables.filter((c) => c.id !== id)
    this._saveCables()
  }
  disconnectAll(filter) {
    this.cables = this.cables.filter((c) => !filter(c))
    this._saveCables()
  }

  // Output jacks of this module that feed another, present module
  exportedJacks() {
    const out = new Set()
    for (const c of this.cables) if (c.from.mod === this.id && c.to.mod !== this.id && this.present(c.to.mod)) out.add(c.from.jack)
    return [...out]
  }

  // Stream one output's samples: values[i] is the voltage at wallT0 + i * dt ms
  sendSignal(jack, wallT0, dt, values) {
    this._send({ type: 'sig', jack, t: wallT0, dt, v: values })
  }

  // ---- Arming: the first click on a jack, in any window ----

  arm(end) {
    this._setArmed(end, true)
  }
  _setArmed(end, broadcast) {
    this.armed = end
    clearTimeout(this.armTimer)
    if (end) this.armTimer = setTimeout(() => this._setArmed(null, false), ARM_FOR)
    if (broadcast) this._send({ type: 'arm', end })
    this.onArm?.(end)
  }
}
