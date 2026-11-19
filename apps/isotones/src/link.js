// Links the timing of an Isobeats window and an Isotones window open in the
// same browser. Isobeats leads: it publishes its tempo and a grid of 16th-note
// steps, pinned to the computer's clock. Isotones follows that grid on its own
// audio clock, so both play in time without sending a message per note.

const CHANNEL = 'iso-link'
const BEAT_EVERY = 1000 // ms between "I'm here" messages
const GONE_AFTER = 3500 // ms of silence before a window counts as closed

// The same moment, as milliseconds on the computer's clock, in every window
export const wallNow = () => performance.timeOrigin + performance.now()

// Convert between that clock and an AudioContext's own clock, allowing for
// the output's delay so that both windows' speakers line up.
export function wallToCtx(ctx, wall) {
  const ts = ctx.getOutputTimestamp?.()
  if (ts && ts.performanceTime > 0) {
    return ts.contextTime + (wall - performance.timeOrigin - ts.performanceTime) / 1000
  }
  return ctx.currentTime + (wall - wallNow()) / 1000
}
export function ctxToWall(ctx, t) {
  const ts = ctx.getOutputTimestamp?.()
  if (ts && ts.performanceTime > 0) {
    return performance.timeOrigin + ts.performanceTime + (t - ts.contextTime) * 1000
  }
  return wallNow() + (t - ctx.currentTime) * 1000
}

export class Link {
  // app: 'isobeats' or 'isotones'. onMessage(msg) gets every message from the other app.
  constructor(app, { onMessage, onPeers }) {
    this.app = app
    this.id = Math.random().toString(36).slice(2)
    this.onMessage = onMessage
    this.onPeers = onPeers
    this.peers = new Map() // window id -> { app, seen }
    this.channel = null
    this.timer = null
    this.extra = () => ({}) // more fields for each "I'm here" message
  }

  get enabled() {
    return !!this.channel
  }

  peerCount(app) {
    return [...this.peers.values()].filter((p) => p.app === app).length
  }

  setEnabled(on) {
    if (on === this.enabled) return
    if (!on) {
      this.send({ type: 'bye' })
      this.channel.close()
      this.channel = null
      clearInterval(this.timer)
      this.peers.clear()
      this.onPeers?.()
      return
    }
    if (typeof BroadcastChannel === 'undefined') return
    this.channel = new BroadcastChannel(CHANNEL)
    this.channel.onmessage = ({ data }) => this._receive(data)
    this.timer = setInterval(() => this._beat(), BEAT_EVERY)
    this._beat()
  }

  send(msg) {
    this.channel?.postMessage({ ...msg, from: this.id, app: this.app })
  }

  _beat() {
    this.send({ type: 'here', ...this.extra() })
    const now = Date.now()
    let changed = false
    for (const [id, p] of this.peers) {
      if (now - p.seen > GONE_AFTER) {
        this.peers.delete(id)
        changed = true
      }
    }
    if (changed) this.onPeers?.()
  }

  _receive(msg) {
    if (!msg || msg.from === this.id || msg.app === this.app) return
    if (msg.type === 'bye') {
      this.peers.delete(msg.from)
      this.onPeers?.()
      return
    }
    const known = this.peers.has(msg.from)
    this.peers.set(msg.from, { app: msg.app, seen: Date.now() })
    if (!known) {
      this.onPeers?.()
      this._beat() // say hello straight back, so a new window hears us at once
    }
    this.onMessage?.(msg)
  }
}
