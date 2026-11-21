// What every patchable synth window shares: joining the patch bus, starting the
// AudioWorklet voice, the patch bay, the "Other windows" panel, the cable list
// and the cables drawn over the page. Each synth supplies its own front panel.
//
// The page needs these ids: bay, bus, bus-status, cable-list, clear-cables,
// status, cables (an <svg>), scope (a <canvas>), me.

import { PatchBus, BUS_DELAY, wallToCtx, ctxToWall, sameEnd } from './bus.js'

const $ = (id) => document.getElementById(id)
const CABLE_COLOURS = ['#f2b84b', '#ef6b5b', '#5fc2a8', '#7aa7ff', '#d58cf0', '#e9e4d8']
const colourFor = (id) => CABLE_COLOURS[[...id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % CABLE_COLOURS.length]

export const store = {
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

// kind, title: as for PatchBus. jacks: [{ id, label, dir, type, help }].
// workletUrl, processor: the voice to load. options(): its processorOptions.
// onVoice(msg): messages from the voice other than streamed signals.
export function createRack({ kind, title, jacks, workletUrl, processor, options, onVoice }) {
  const ins = jacks.filter((j) => j.dir === 'in').map((j) => j.id)
  const outs = jacks.filter((j) => j.dir === 'out').map((j) => j.id)
  const outTypes = Object.fromEntries(jacks.filter((j) => j.dir === 'out').map((j) => [j.id, j.type]))

  const bus = new PatchBus({
    kind,
    title,
    jacks: jacks.map(({ id, label, dir, type }) => ({ id, label, dir, type })),
    onChange: () => refresh(),
    onSignal,
    onArm: () => showArmed(),
    onDrop: () => refresh(),
  })
  bus.onRenamed = () => showName()

  // ---- Audio ----

  const rack = { bus, ctx: null, node: null, outDelay: null, analyser: null }
  let starting = null
  let ready = false
  let remoteIds = new Set()

  rack.ensureAudio = () => {
    if (rack.ctx) {
      if (rack.ctx.state === 'suspended') rack.ctx.resume()
      return Promise.resolve()
    }
    starting ||= (async () => {
      if (!ready) throw new Error('Not ready yet')
      const c = new AudioContext({ latencyHint: 'interactive' })
      await c.audioWorklet.addModule(workletUrl)
      const node = new AudioWorkletNode(c, processor, {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [1],
        processorOptions: { ins, outs, outTypes, ...options() },
      })
      rack.outDelay = c.createDelay(1)
      rack.analyser = c.createAnalyser()
      rack.analyser.fftSize = 1024
      node.connect(rack.outDelay).connect(rack.analyser).connect(c.destination)
      node.port.onmessage = ({ data }) => fromVoice(data)
      node.onprocessorerror = (e) => {
        console.error(`${title} voice stopped`, e)
        say('The voice hit an error and stopped. Reload the page to restart it.')
      }
      rack.node = node
      rack.ctx = c
      if (c.state === 'suspended') await c.resume()
      remoteIds = new Set()
      sendPatch()
      drawScope()
      refresh()
    })()
    starting.catch(() => (starting = null)) // a failed start can be tried again
    return starting
  }
  rack.post = (msg) => rack.node?.port.postMessage(msg)
  // Milliseconds until a moment on the voice's clock is heard
  rack.heardIn = (t) => {
    const c = rack.ctx
    return (t - c.currentTime + (c.outputLatency || 0) + rack.outDelay.delayTime.value) * 1000
  }

  function fromVoice(m) {
    if (m.type === 'sig') {
      const wall = ctxToWall(rack.ctx, m.t)
      for (const s of m.sigs) bus.sendSignal(s.jack, wall, s.dt, s.v)
    } else onVoice?.(m)
  }

  function onSignal(inJack, streamId, wall, dt, values) {
    if (!rack.node) return
    rack.post({ type: 'remote', id: streamId, input: inJack, t: wallToCtx(rack.ctx, wall) + BUS_DELAY, dt, v: values })
  }

  // Tell the voice which cables reach it: ones within this window run at audio
  // rate inside the voice, ones from other windows arrive as streamed samples.
  function sendPatch() {
    if (!rack.node) return
    const routes = ins.map(() => [])
    const patched = ins.map(() => 0)
    const live = new Set()
    for (const c of bus.cables) {
      if (c.to.mod !== bus.id) continue
      const i = ins.indexOf(c.to.jack)
      if (i < 0) continue
      if (c.from.mod === bus.id) {
        routes[i].push(c.from.jack)
        patched[i] = 1
      } else if (bus.present(c.from.mod)) {
        patched[i] = 1
        live.add(c.id)
      }
    }
    rack.post({ type: 'routes', routes, patched })
    const gone = [...remoteIds].filter((id) => !live.has(id))
    if (gone.length) rack.post({ type: 'unremote', ids: gone })
    remoteIds = live

    const sending = bus.exportedJacks()
    rack.post({ type: 'stream', outs: sending })
    rack.outDelay.delayTime.setValueAtTime(sending.length ? BUS_DELAY : 0, rack.ctx.currentTime)
  }

  function drawScope() {
    const canvas = $('scope')
    if (!canvas) return
    const g = canvas.getContext('2d')
    const data = new Float32Array(rack.analyser.fftSize)
    const frame = () => {
      rack.analyser.getFloatTimeDomainData(data)
      g.clearRect(0, 0, canvas.width, canvas.height)
      g.strokeStyle = getComputedStyle(document.body).getPropertyValue('--accent')
      g.lineWidth = 1.5
      g.beginPath()
      for (let i = 0; i < data.length; i += 4) {
        const x = (i / data.length) * canvas.width
        const y = canvas.height / 2 - data[i] * canvas.height * 0.45
        i ? g.lineTo(x, y) : g.moveTo(x, y)
      }
      g.stroke()
      requestAnimationFrame(frame)
    }
    frame()
  }

  // ---- Status line ----

  let sayTimer = null
  function say(text) {
    $('status').textContent = text
    clearTimeout(sayTimer)
    if (text) sayTimer = setTimeout(() => ($('status').textContent = ''), 6000)
  }
  rack.say = say

  function showName() {
    $('me').textContent = bus.name
    document.title = bus.name
  }

  // ---- Patch bay ----

  function jackButton(mod, j) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = `jack ${j.dir} type-${j.type}`
    b.dataset.mod = mod
    b.dataset.jack = j.id
    const help = mod === bus.id ? jacks.find((x) => x.id === j.id)?.help : null
    b.title = `${j.label} ${j.dir === 'in' ? 'input' : 'output'}${j.type === 'audio' ? ' (audio)' : ''}${help ? `: ${help}` : ''}`
    b.setAttribute('aria-label', b.title)
    b.innerHTML = `<span class="hole"></span><span class="jl">${j.label}</span>`
    b.addEventListener('click', (e) => onJack({ mod, jack: j.id }, e))
    return b
  }

  const describe = (end) => {
    const j = bus.jack(end)
    const name = j ? `${j.label} ${j.dir === 'in' ? 'in' : 'out'}` : end.jack
    return end.mod === bus.id ? name : `${bus.moduleName(end.mod)} · ${name}`
  }

  function onJack(end, e) {
    if (e?.altKey) {
      const n = bus.cables.filter((c) => sameEnd(c.from, end) || sameEnd(c.to, end)).length
      bus.disconnectAll((c) => sameEnd(c.from, end) || sameEnd(c.to, end))
      say(n ? `Removed ${n} cable${n > 1 ? 's' : ''} from ${describe(end)}` : `Nothing patched to ${describe(end)}`)
      return
    }
    const a = bus.armed
    const ja = a && bus.jack(a)
    const jb = bus.jack(end)
    if (a && sameEnd(a, end)) {
      bus.arm(null)
      say('')
      return
    }
    if (!a || !ja || ja.dir === jb.dir) {
      bus.arm(end)
      say(`Now choose ${jb.dir === 'out' ? 'an input' : 'an output'} for ${describe(end)}, here or in another window. Esc cancels.`)
      return
    }
    const [from, to] = ja.dir === 'out' ? [a, end] : [end, a]
    const existing = bus.cables.find((c) => sameEnd(c.from, from) && sameEnd(c.to, to))
    if (existing) {
      bus.disconnect(existing.id)
      say(`Removed ${describe(from)} → ${describe(to)}`)
    } else {
      const r = bus.connect(from, to)
      const audio = !r.error && from.mod !== to.mod && bus.jack(from)?.type === 'audio'
      say(r.error || `Patched ${describe(from)} → ${describe(to)}${audio ? ' (audio between windows: it may crackle if either window is busy)' : ''}`)
    }
    bus.arm(null)
  }

  const jackEl = (end) => document.querySelector(`.jack[data-mod="${CSS.escape(end.mod)}"][data-jack="${CSS.escape(end.jack)}"]`)

  function showArmed() {
    document.querySelectorAll('.jack.armed').forEach((el) => el.classList.remove('armed'))
    document.body.classList.toggle('arming', !!bus.armed)
    if (!bus.armed) return
    jackEl(bus.armed)?.classList.add('armed')
    const j = bus.jack(bus.armed)
    if (bus.armed.mod !== bus.id && j) say(`${describe(bus.armed)} is waiting: choose ${j.dir === 'out' ? 'an input' : 'an output'} to finish the cable.`)
    document.querySelectorAll('.jack').forEach((el) => {
      const end = { mod: el.dataset.mod, jack: el.dataset.jack }
      const other = bus.jack(end)
      el.classList.toggle('dim', !!j && !!other && other.dir === j.dir && !sameEnd(bus.armed, end))
    })
  }

  function buildBus() {
    const root = $('bus')
    root.textContent = ''
    const others = [...bus.modules.values()].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    for (const m of others) {
      const card = document.createElement('div')
      card.className = 'remote'
      card.innerHTML = `<h3>${bus.moduleName(m.id)}</h3><div class="remote-jacks"><div class="col ins"></div><div class="col outs"></div></div>`
      for (const j of m.jacks) card.querySelector(j.dir === 'in' ? '.ins' : '.outs').append(jackButton(m.id, j))
      root.append(card)
    }
    if (!others.length) {
      root.innerHTML = '<p class="empty">No other synth windows are open in this browser yet. Open another synth (or another copy of this one) to patch between them.</p>'
    }
    const names = others.map((m) => bus.moduleName(m.id))
    $('bus-status').textContent = names.length ? `Connected: ${names.join(', ')}` : ''
  }

  function cableList() {
    const ul = $('cable-list')
    ul.textContent = ''
    const mine = bus.myCables()
    for (const c of mine) {
      const li = document.createElement('li')
      const waiting = !bus.present(c.from.mod) || !bus.present(c.to.mod)
      const absent = !bus.present(c.from.mod) ? c.from.mod : c.to.mod
      li.innerHTML = `<i style="--c:${colourFor(c.id)}"></i><span>${describe(c.from)} → ${describe(c.to)}</span>${waiting ? `<em>waiting for ${bus.moduleName(absent)}</em>` : ''}`
      const rm = document.createElement('button')
      rm.type = 'button'
      rm.textContent = 'Remove'
      rm.addEventListener('click', () => bus.disconnect(c.id))
      li.append(rm)
      ul.append(li)
    }
    if (!mine.length) ul.innerHTML = '<li class="empty">No cables. Everything runs on its normal connections.</li>'
    $('clear-cables').hidden = !mine.length
  }

  const svg = $('cables')
  function drawCables() {
    const doc = document.documentElement
    svg.setAttribute('width', doc.scrollWidth)
    svg.setAttribute('height', doc.scrollHeight)
    svg.textContent = ''
    document.querySelectorAll('.jack.patched').forEach((el) => el.classList.remove('patched'))
    const NS = 'http://www.w3.org/2000/svg'
    const centre = (el) => {
      const r = el.querySelector('.hole').getBoundingClientRect()
      return [r.left + r.width / 2 + scrollX, r.top + r.height / 2 + scrollY]
    }
    for (const c of bus.myCables()) {
      const a = jackEl(c.from)
      const b = jackEl(c.to)
      a?.classList.add('patched')
      b?.classList.add('patched')
      if (!a || !b) continue
      const [x1, y1] = centre(a)
      const [x2, y2] = centre(b)
      const sag = 30 + Math.hypot(x2 - x1, y2 - y1) * 0.22
      const d = `M ${x1} ${y1} C ${x1} ${y1 + sag}, ${x2} ${y2 + sag}, ${x2} ${y2}`
      const colour = colourFor(c.id)
      const g = document.createElementNS(NS, 'g')
      g.innerHTML = `<path class="cable-shadow" d="${d}" /><path class="cable" d="${d}" stroke="${colour}" />
        <circle class="plug" cx="${x1}" cy="${y1}" r="6" fill="${colour}" /><circle class="plug" cx="${x2}" cy="${y2}" r="6" fill="${colour}" />
        <path class="cable-hit" d="${d}"><title>${describe(c.from)} → ${describe(c.to)} (click to remove)</title></path>`
      g.querySelector('.cable-hit').addEventListener('click', () => {
        bus.disconnect(c.id)
        say(`Removed ${describe(c.from)} → ${describe(c.to)}`)
      })
      svg.append(g)
    }
  }

  let drawQueued = false
  function queueDraw() {
    if (drawQueued) return
    drawQueued = true
    requestAnimationFrame(() => {
      drawQueued = false
      drawCables()
    })
  }
  rack.redraw = queueDraw

  function refresh() {
    buildBus()
    cableList()
    sendPatch()
    showArmed()
    queueDraw()
  }

  // Join the bus, then run setup() (load settings, build the front panel) and
  // build the patch bay. Sound can only start after this.
  rack.start = async (setup) => {
    await bus.start()
    showName()
    setup?.()
    ready = true
    const bay = $('bay')
    for (const j of jacks) bay.append(jackButton(bus.id, j))
    $('clear-cables').addEventListener('click', () => {
      bus.disconnectAll((c) => c.from.mod === bus.id || c.to.mod === bus.id)
      say('Removed all cables to and from this window')
    })
    // The browser only lets sound start after a click or key press
    document.addEventListener('pointerdown', () => rack.ensureAudio().catch(() => {}), { once: true })
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && bus.armed) {
        bus.arm(null)
        say('')
      }
    })
    new ResizeObserver(queueDraw).observe(document.body)
    window.addEventListener('resize', queueDraw)
    refresh()
  }

  return rack
}
