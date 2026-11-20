import { createKnob } from '../../isobeats/src/knob.js'
import { PatchBus, BUS_DELAY, wallToCtx, ctxToWall, sameEnd } from './bus.js'
import { SECTIONS, CONTROLS, DEFAULTS, DEFAULT_STEPS, JACKS, IN_JACKS, OUT_JACKS, STEP_COUNT, formatPitch } from './panel.js'
import workletUrl from './voice.worklet.js?url'

const $ = (id) => document.getElementById(id)
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
const CABLE_COLOURS = ['#f2b84b', '#ef6b5b', '#5fc2a8', '#7aa7ff', '#d58cf0', '#e9e4d8']
const colourFor = (id) => CABLE_COLOURS[[...id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % CABLE_COLOURS.length]

// ---- The patch bus ------------------------------------------------------------

const bus = new PatchBus({
  kind: 'dfal',
  title: 'DFAL',
  jacks: JACKS.map(({ id, label, dir, type }) => ({ id, label, dir, type })),
  onChange: () => refresh(),
  onSignal,
  onArm: () => showArmed(),
  onDrop: () => refresh(),
})
bus.onRenamed = () => {
  $('me').textContent = bus.name
  document.title = bus.name
}

let state
const stateKey = () => `dfal.state.${bus.id}`
function loadState() {
  const saved = store.get(stateKey(), null)
  const params = { ...DEFAULTS, ...(saved?.params || {}) }
  const steps = Array.from({ length: STEP_COUNT }, (_, i) => ({ ...DEFAULT_STEPS[i], ...(saved?.steps?.[i] || {}) }))
  state = { params, steps }
}
let saveTimer = null
function save() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => store.set(stateKey(), state), 200)
}

// ---- Audio ------------------------------------------------------------------------

let ctx = null
let node = null
let outDelay = null
let analyser = null
let starting = null
let remoteIds = new Set()

function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume()
    return Promise.resolve()
  }
  starting ||= (async () => {
    const c = new AudioContext({ latencyHint: 'interactive' })
    await c.audioWorklet.addModule(workletUrl)
    node = new AudioWorkletNode(c, 'dfal-voice', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: { ins: IN_JACKS, outs: OUT_JACKS, params: state.params, steps: state.steps },
    })
    outDelay = c.createDelay(1)
    analyser = c.createAnalyser()
    analyser.fftSize = 1024
    node.connect(outDelay).connect(analyser).connect(c.destination)
    node.port.onmessage = ({ data }) => fromVoice(data)
    node.onprocessorerror = (e) => {
      console.error('DFAL voice stopped', e)
      say('The voice hit an error and stopped. Reload the page to restart it.')
    }
    ctx = c
    if (ctx.state === 'suspended') await ctx.resume()
    remoteIds = new Set()
    sendPatch()
    drawScope()
    refresh()
  })()
  return starting
}
const post = (msg) => node?.port.postMessage(msg)

function fromVoice(m) {
  if (m.type === 'sig') {
    const wall = ctxToWall(ctx, m.t)
    m.jacks.forEach((jack, j) => bus.sendSignal(jack, wall, m.dt, m.values[j]))
  } else if (m.type === 'step') {
    // Light the step when it is heard, not when it is worked out
    const wait = (m.t - ctx.currentTime + (ctx.outputLatency || 0) + outDelay.delayTime.value) * 1000
    setTimeout(() => showStep(m.step, m.fired), Math.max(0, wait))
  } else if (m.type === 'running') {
    showRunning(m.on)
  }
}

function onSignal(inJack, streamId, wall, dt, values) {
  if (!node) return
  post({ type: 'remote', id: streamId, input: inJack, t: wallToCtx(ctx, wall) + BUS_DELAY, dt, v: values })
}

// Tell the voice which cables reach it: ones within this window run at audio
// rate inside the voice, ones from other windows arrive as streamed samples.
function sendPatch() {
  if (!node) return
  const routes = IN_JACKS.map(() => [])
  const patched = IN_JACKS.map(() => 0)
  const live = new Set()
  for (const c of bus.cables) {
    if (c.to.mod !== bus.id) continue
    const i = IN_JACKS.indexOf(c.to.jack)
    if (i < 0) continue
    if (c.from.mod === bus.id) {
      routes[i].push(c.from.jack)
      patched[i] = 1
    } else if (bus.present(c.from.mod)) {
      patched[i] = 1
      live.add(c.id)
    }
  }
  post({ type: 'routes', routes, patched })
  const gone = [...remoteIds].filter((id) => !live.has(id))
  if (gone.length) post({ type: 'unremote', ids: gone })
  remoteIds = live

  const outs = bus.exportedJacks()
  post({ type: 'stream', outs })
  outDelay.delayTime.setValueAtTime(outs.length ? BUS_DELAY : 0, ctx.currentTime)
}

function drawScope() {
  const canvas = $('scope')
  const g = canvas.getContext('2d')
  const data = new Float32Array(analyser.fftSize)
  const frame = () => {
    analyser.getFloatTimeDomainData(data)
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

// ---- Front panel ------------------------------------------------------------------

const knobs = {}
const switches = {}

function setParam(id, v) {
  state.params[id] = v
  save()
  post({ type: 'params', params: { [id]: v } })
}

function buildSwitch(c) {
  const wrap = document.createElement('div')
  wrap.className = 'ctl switch'
  const seg = document.createElement('div')
  seg.className = 'seg vertical'
  seg.setAttribute('role', 'group')
  seg.setAttribute('aria-label', c.label)
  for (const [value, text] of c.options) {
    const b = document.createElement('button')
    b.type = 'button'
    b.textContent = text
    b.dataset.value = value
    b.addEventListener('click', () => {
      setParam(c.id, value)
      showSwitch(c.id)
    })
    seg.append(b)
  }
  const label = document.createElement('span')
  label.className = 'ctl-label'
  label.textContent = c.label
  wrap.append(seg, label)
  switches[c.id] = seg
  return wrap
}
function showSwitch(id) {
  for (const b of switches[id].children) b.setAttribute('aria-pressed', String(b.dataset.value === state.params[id]))
}

function buildKnob(c) {
  const wrap = document.createElement('div')
  wrap.className = 'ctl'
  const k = createKnob({
    label: c.label,
    min: c.min ?? 0,
    max: 1,
    step: 0.005,
    value: state.params[c.id],
    defaultValue: c.def,
    format: c.format,
    onInput: (v) => setParam(c.id, v),
  })
  if ((c.min ?? 0) < 0) k.classList.add('bipolar')
  const label = document.createElement('span')
  label.className = 'ctl-label'
  label.textContent = c.label
  wrap.append(k, label)
  knobs[c.id] = k
  return wrap
}

function buildPanel() {
  const root = $('sections')
  for (const s of SECTIONS) {
    const card = document.createElement('section')
    card.className = `section sec-${s.id}`
    card.innerHTML = `<h2>${s.title}</h2><div class="ctls"></div>`
    const ctls = card.querySelector('.ctls')
    for (const c of s.controls) ctls.append(c.type === 'switch' ? buildSwitch(c) : buildKnob(c))
    root.append(card)
  }
  for (const c of CONTROLS) if (c.type === 'switch') showSwitch(c.id)
}

const stepEls = []
const stepKnobs = []
function buildSteps() {
  const root = $('steps')
  for (let i = 0; i < STEP_COUNT; i++) {
    const el = document.createElement('div')
    el.className = 'step'
    el.innerHTML = `<div class="step-head"><span class="led"></span>${i + 1}</div>`
    const pitch = createKnob({
      label: `Step ${i + 1} pitch`,
      min: -24,
      max: 24,
      step: 0.1,
      value: state.steps[i].pitch,
      defaultValue: 0,
      format: formatPitch,
      onInput: (v) => setStep(i, 'pitch', v),
    })
    pitch.classList.add('pitch')
    const vel = createKnob({
      label: `Step ${i + 1} velocity`,
      min: 0,
      max: 1,
      step: 0.01,
      value: state.steps[i].vel,
      defaultValue: 0.7,
      format: (v) => `${Math.round(v * 100)}`,
      onInput: (v) => setStep(i, 'vel', v),
    })
    vel.classList.add('vel')
    el.append(pitch, vel)
    root.append(el)
    stepEls.push(el)
    stepKnobs.push({ pitch, vel })
    el.classList.toggle('rest', state.steps[i].vel === 0)
  }
}
function setStep(i, key, v) {
  state.steps[i][key] = v
  stepEls[i].classList.toggle('rest', state.steps[i].vel === 0)
  save()
  post({ type: 'steps', steps: state.steps })
}

let lit = -1
function showStep(step, fired) {
  if (lit >= 0) stepEls[lit]?.classList.remove('current')
  lit = step
  const el = stepEls[step]
  if (!el) return
  el.classList.add('current')
  if (fired) {
    el.classList.remove('hit')
    void el.offsetWidth
    el.classList.add('hit')
  }
}

function showAll() {
  for (const c of CONTROLS) {
    if (c.type === 'switch') showSwitch(c.id)
    else knobs[c.id].setValue(state.params[c.id])
  }
  state.steps.forEach((s, i) => {
    stepKnobs[i].pitch.setValue(s.pitch)
    stepKnobs[i].vel.setValue(s.vel)
    stepEls[i].classList.toggle('rest', s.vel === 0)
  })
  save()
  post({ type: 'params', params: state.params })
  post({ type: 'steps', steps: state.steps })
}

// ---- Transport --------------------------------------------------------------------

let running = false
function showRunning(on) {
  running = on
  $('run').setAttribute('aria-pressed', String(on))
  $('run').textContent = on ? 'Stop' : 'Run'
  if (!on && lit >= 0) stepEls[lit]?.classList.remove('hit')
}
async function setRunning(on) {
  await ensureAudio()
  post({ type: 'run', on })
}
$('run').addEventListener('click', () => setRunning(!running))
for (const id of ['trig', 'adv', 'reset']) {
  $(id).addEventListener('click', async () => {
    await ensureAudio()
    post({ type: id })
  })
}
$('default').addEventListener('click', () => {
  state.params = { ...DEFAULTS }
  state.steps = DEFAULT_STEPS.map((s) => ({ ...s }))
  showAll()
  say('Back to the default sound and pattern')
})
$('randomise').addEventListener('click', () => {
  const scale = [0, 0, 0, 3, 5, 7, 7, 10, 12, -5, -12, 15, 19]
  state.steps = state.steps.map((_, i) => ({
    pitch: scale[Math.floor(Math.random() * scale.length)],
    vel: i === 0 ? 1 : Math.random() < 0.2 ? 0 : Math.round((0.15 + Math.random() * 0.85) * 100) / 100,
  }))
  showAll()
})
$('new-window').addEventListener('click', () => {
  window.open(location.pathname, '_blank', 'popup=yes,width=1200,height=900')
})

// The browser only lets sound start after a click or key press
document.addEventListener('pointerdown', () => ensureAudio(), { once: true })
document.addEventListener('keydown', (e) => {
  const tag = e.target.tagName
  if (e.key === 'Escape' && bus.armed) {
    bus.arm(null)
    say('')
  } else if (e.key === ' ' && tag !== 'BUTTON' && tag !== 'INPUT' && tag !== 'SELECT') {
    e.preventDefault()
    setRunning(!running)
  }
})

let sayTimer = null
function say(text) {
  $('status').textContent = text
  clearTimeout(sayTimer)
  if (text) sayTimer = setTimeout(() => ($('status').textContent = ''), 6000)
}

// ---- Patch bay and cables -------------------------------------------------------

function jackButton(mod, j) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = `jack ${j.dir} type-${j.type}`
  b.dataset.mod = mod
  b.dataset.jack = j.id
  const help = JACKS.find((x) => x.id === j.id && mod === bus.id)?.help
  b.title = `${j.label} ${j.dir === 'in' ? 'input' : 'output'}${j.type === 'audio' ? ' (audio)' : ''}${help ? `: ${help}` : ''}`
  b.setAttribute('aria-label', b.title)
  b.innerHTML = `<span class="hole"></span><span class="jl">${j.label}</span>`
  b.addEventListener('click', (e) => onJack({ mod, jack: j.id }, e))
  return b
}

function buildBay() {
  const bay = $('bay')
  for (const j of JACKS) bay.append(jackButton(bus.id, j))
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
  if (!a || !ja || sameEnd(a, end) || ja.dir === jb.dir) {
    if (a && sameEnd(a, end)) {
      bus.arm(null)
      say('')
      return
    }
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
    say(r.error || `Patched ${describe(from)} → ${describe(to)}`)
  }
  bus.arm(null)
}

function showArmed() {
  document.querySelectorAll('.jack.armed').forEach((el) => el.classList.remove('armed'))
  document.body.classList.toggle('arming', !!bus.armed)
  if (!bus.armed) return
  jackEl(bus.armed)?.classList.add('armed')
  const j = bus.jack(bus.armed)
  if (bus.armed.mod !== bus.id && j) say(`${describe(bus.armed)} is waiting: choose ${j.dir === 'out' ? 'an input' : 'an output'} to finish the cable.`)
  document.querySelectorAll('.jack').forEach((el) => {
    const other = bus.jack({ mod: el.dataset.mod, jack: el.dataset.jack })
    el.classList.toggle('dim', !!j && !!other && other.dir === j.dir && !sameEnd(bus.armed, { mod: el.dataset.mod, jack: el.dataset.jack }))
  })
}

const jackEl = (end) => document.querySelector(`.jack[data-mod="${CSS.escape(end.mod)}"][data-jack="${CSS.escape(end.jack)}"]`)

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
    root.innerHTML = '<p class="empty">No other synth windows are open in this browser yet. Use “Open another window” to try patching two DFALs together.</p>'
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
$('clear-cables').addEventListener('click', () => {
  bus.disconnectAll((c) => c.from.mod === bus.id || c.to.mod === bus.id)
  say('Removed all cables to and from this window')
})

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

function refresh() {
  buildBus()
  cableList()
  sendPatch()
  showArmed()
  queueDraw()
}

// ---- Start -----------------------------------------------------------------------

async function init() {
  await bus.start()
  $('me').textContent = bus.name
  document.title = bus.name
  loadState()
  buildPanel()
  buildSteps()
  buildBay()
  refresh()
  new ResizeObserver(queueDraw).observe(document.body)
  window.addEventListener('resize', queueDraw)
  say('Press Run (or Space) to start.')
}
init()
