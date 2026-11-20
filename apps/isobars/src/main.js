import { searchPlaces } from '../../isotones/src/weather.js'
import { Link, wallNow } from '../../isotones/src/link.js'
import { startTicker } from '../../isotones/src/ticker.js'
import { ALL_DESTS } from '../../isotones/src/mods.js'
import { createKnob } from '../../isobeats/src/knob.js'
import { regionAround, fetchField, gridAt, LINE } from './field.js'
import { MODES, OUTPUTS, advance, readOutputs, kmPerSecond, hoursPerSecond } from './motion.js'
import { createChart } from './chart.js'

const $ = (id) => document.getElementById(id)
const store = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(`isobars:${key}`)) ?? fallback
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`isobars:${key}`, JSON.stringify(value))
    } catch {}
  },
}
const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
const LONDON = { name: 'London, England, United Kingdom', lat: 51.51, lon: -0.13 }
const APP_NAMES = { isotones: 'Isotones', isobeats: 'Isobeats' }

const DEFAULT_PATCHES = [
  { src: 'crossing', app: 'isotones', dest: 'filter', amount: 60 },
  { src: 'gradient', app: 'isobeats', dest: 'decay', amount: -40 },
  { src: 'pressure', app: 'isobeats', dest: 'fm', amount: -30 },
]

const state = {
  place: store.get('place', LONDON),
  region: null,
  field: null,
  grid: null,
  patches: store.get('patches', DEFAULT_PATCHES),
  hours: 0, // time-lapse position, hours into the forecast
  out: null,
  shape: null,
  crossedAt: 0, // wall time the latest crossing pulse starts
  crossText: '',
}
const motion = {
  mode: store.get('mode', 'drift'),
  speed: store.get('speed', 40),
  point: store.get('point', null),
  dir: [1, 0],
  rideP: null,
  route: store.get('route', []),
  routeAt: 0,
  trail: [],
}

// ---- Chart and pointer ------------------------------------------------------

let drawingRoute = false
const chart = createChart($('chart'), {
  onPointer(type, at) {
    const pt = { lat: at.lat, lon: at.lon }
    if (motion.mode === 'route') {
      if (type === 'down') {
        motion.route = [pt]
        drawingRoute = true
      } else if (type === 'move' && drawingRoute) {
        const last = motion.route[motion.route.length - 1]
        if (Math.hypot(pt.lat - last.lat, pt.lon - last.lon) > 0.8) motion.route.push(pt)
      } else if (type === 'up') {
        drawingRoute = false
        motion.routeAt = 0
        store.set('route', motion.route)
        showMode()
      }
      return
    }
    // Every other mode: pressing places the point (and dragging moves it)
    motion.point = pt
    motion.rideP = null
    motion.trail = []
    if (type === 'up') store.set('point', motion.point)
  },
})

// ---- Pressure data -------------------------------------------------------------

async function load() {
  state.region = regionAround(state.place)
  if (!motion.point || !inRegion(motion.point)) {
    motion.point = { lat: state.place.lat, lon: state.place.lon }
    motion.trail = []
  }
  chart.setRegion(state.region)
  $('status').textContent = 'Fetching the pressure chart…'
  try {
    state.field = await fetchField(state.region)
    $('status').textContent = ''
    updateGrid(true)
  } catch (err) {
    $('status').textContent = `Couldn't load the pressure chart (${err.message}). Check your connection and reload.`
  }
}
const inRegion = (p) => state.region && p.lat > state.region.lat0 && p.lat < state.region.lat1
  && p.lon > state.region.lon0 && p.lon < state.region.lon1
setInterval(load, 60 * 60 * 1000) // the forecast updates hourly

let lastGridT = 0
function updateGrid(force) {
  if (!state.field) return
  const now = Date.now() / 1000
  const t = motion.mode === 'timelapse' ? state.field.times[0] + state.hours * 3600 : now
  // Rebuild the isobars when time has moved enough to show
  if (force || Math.abs(t - lastGridT) > (motion.mode === 'timelapse' ? 300 : 60)) {
    state.grid = gridAt(state.field, t)
    chart.setGrid(state.grid)
    lastGridT = t
  }
}

// ---- Clock from Isobeats, for landing crossings on the beat ------------------

let leader = null
function nextBeatWall(now) {
  if (!leader?.running) return now
  const dur = (60 / leader.bpm / 4) * 1000
  const k = Math.ceil((now - leader.anchorWall) / dur)
  return leader.anchorWall + k * dur
}
const pulseLength = () => (leader ? (60 / leader.bpm) * 600 : 400) // ms: a little over half a beat

// ---- The control loop: move, read, send ------------------------------------------

let lastTick = performance.now()
startTicker(() => {
  const nowPerf = performance.now()
  const dt = Math.min(0.25, (nowPerf - lastTick) / 1000)
  lastTick = nowPerf
  if (!state.field) return
  if (motion.mode === 'timelapse') {
    state.hours = (state.hours + hoursPerSecond(motion.speed) * dt) % (state.field.times.length - 1)
  }
  updateGrid(false)
  const g = state.grid
  const before = motion.point
  const s = advance(motion, g, dt)
  const out = readOutputs(g, s)
  // Crossing an isobar starts a pulse, on the next 16th if Isobeats is running
  if (state.out && out.line !== state.out.line) {
    const now = wallNow()
    state.crossedAt = nextBeatWall(now)
    const level = Math.max(out.line, state.out.line) * LINE
    state.crossText = `Crossed ${level} ${out.line > state.out.line ? '↑' : '↓'}`
  }
  const since = wallNow() - state.crossedAt
  out.crossing = state.crossedAt && since >= 0 ? Math.exp(-since / pulseLength()) : 0
  state.out = out
  state.shape = s
  if (before !== motion.point) {
    motion.trail.push(motion.point)
    if (motion.trail.length > 160) motion.trail.shift()
  }
  send()
}, 40)

// Sum each patch into per-app offsets and send them to the linked windows
function send() {
  if (!link.enabled || !state.out) return
  const offsets = {}
  for (const p of state.patches) {
    if (!p.dest) continue
    const v = state.out[p.src] ?? 0
    offsets[p.app] ??= {}
    offsets[p.app][p.dest] = clamp((offsets[p.app][p.dest] ?? 0) + v * (p.amount / 100), -1, 1)
  }
  link.send({ type: 'mod', offsets })
}

// ---- Movement controls ------------------------------------------------------------

for (const m of MODES) {
  const b = document.createElement('button')
  b.type = 'button'
  b.textContent = m.label
  b.dataset.mode = m.id
  b.addEventListener('click', () => {
    motion.mode = m.id
    motion.rideP = null
    store.set('mode', m.id)
    // Time-lapse starts from now and runs on through the forecast
    state.hours = m.id === 'timelapse' && state.field ? Math.max(0, (Date.now() / 1000 - state.field.times[0]) / 3600) : 0
    updateGrid(true)
    showMode()
  })
  $('modes').appendChild(b)
}
const speedKnob = createKnob({
  label: 'Speed', min: 0, max: 100, step: 1, value: motion.speed, defaultValue: 40,
  format: (v) => (motion.mode === 'timelapse' ? `${hoursPerSecond(v).toFixed(1)} h/s` : `${Math.round(kmPerSecond(v))} km/s`),
  onInput: (v) => {
    motion.speed = v
    store.set('speed', v)
  },
})
$('speed-wrap').appendChild(speedKnob)
$('clear-route').addEventListener('click', () => {
  motion.route = []
  store.set('route', [])
  showMode()
})

function showMode() {
  for (const b of $('modes').children) b.setAttribute('aria-pressed', String(b.dataset.mode === motion.mode))
  const m = MODES.find((x) => x.id === motion.mode)
  let hint = m.hint
  if (m.id === 'route') hint += motion.route.length > 1 ? ' Drag again to draw a new one.' : ' Drag on the map to draw one.'
  else if (m.id !== 'drag') hint += ' Click the map to move the point.'
  $('mode-hint').textContent = hint
  $('clear-route').hidden = m.id !== 'route' || motion.route.length < 2
  $('speed-name').textContent = m.id === 'timelapse' ? 'Time speed' : 'Speed'
  speedKnob.setValue(motion.speed)
  $('speed-wrap').hidden = m.id === 'drag'
}

// ---- Outputs ------------------------------------------------------------------------

const outEls = {}
for (const o of OUTPUTS) {
  const el = document.createElement('div')
  el.className = `out${o.id === 'gradient' || o.id === 'crossing' ? ' unipolar' : ''}`
  el.innerHTML = `<h3>${o.label}</h3><div class="bar"><i></i></div><p></p>`
  $('outputs').appendChild(el)
  outEls[o.id] = { bar: el.querySelector('i'), text: el.querySelector('p') }
}
function showOutputs() {
  const o = state.out, s = state.shape
  if (!o) return
  const set = (id, v, text) => {
    const bar = outEls[id].bar
    if (id === 'gradient' || id === 'crossing') {
      bar.style.left = '0'
      bar.style.width = `${v * 100}%`
    } else {
      bar.style.left = `${50 + Math.min(0, v) * 50}%`
      bar.style.width = `${Math.abs(v) * 50}%`
    }
    outEls[id].text.textContent = text
  }
  set('pressure', o.pressure, `${s.p.toFixed(1)} hPa`)
  set('gradient', o.gradient, `${s.grad.toFixed(2)} hPa per 100 km`)
  set('crossing', o.crossing, state.crossText || 'No line crossed yet')
  set('curve', o.curve, o.curve < -0.15 ? 'Round a low: tense' : o.curve > 0.15 ? 'Round a high: open' : 'Fairly straight')
  set('stave', o.stave, `${o.semis > 0 ? '+' : ''}${o.semis} semitones`)
}

// ---- Patches -------------------------------------------------------------------------

function renderPatches() {
  const list = $('patches')
  list.innerHTML = ''
  state.patches.forEach((p, i) => {
    const row = document.createElement('div')
    row.className = 'patch'
    const src = document.createElement('select')
    src.setAttribute('aria-label', 'Output')
    for (const o of OUTPUTS) src.add(new Option(o.label, o.id, false, o.id === p.src))
    const dest = document.createElement('select')
    dest.setAttribute('aria-label', 'Destination')
    for (const app of ['isotones', 'isobeats']) {
      const group = document.createElement('optgroup')
      group.label = APP_NAMES[app]
      for (const d of ALL_DESTS.filter((x) => x.app === app)) {
        group.appendChild(new Option(`${APP_NAMES[app]} · ${d.label}`, `${app}:${d.id}`, false, p.app === app && p.dest === d.id))
      }
      dest.appendChild(group)
    }
    const amount = document.createElement('label')
    amount.className = 'amount'
    amount.innerHTML = `<input type="range" min="-100" max="100" step="1" value="${p.amount}" aria-label="Amount" /><output>${p.amount > 0 ? '+' : ''}${p.amount}</output>`
    const remove = document.createElement('button')
    remove.type = 'button'
    remove.className = 'remove'
    remove.textContent = 'Remove'
    const arrow = document.createElement('span')
    arrow.className = 'arrow'
    arrow.textContent = '→'
    const note = document.createElement('p')
    note.className = 'state'
    row.append(src, arrow, dest, amount, remove, note)
    list.appendChild(row)

    src.addEventListener('change', () => {
      p.src = src.value
      savePatches()
    })
    dest.addEventListener('change', () => {
      ;[p.app, p.dest] = dest.value.split(':')
      savePatches()
    })
    amount.querySelector('input').addEventListener('input', (e) => {
      p.amount = Number(e.target.value)
      amount.querySelector('output').textContent = `${p.amount > 0 ? '+' : ''}${p.amount}`
      savePatches(false)
    })
    remove.addEventListener('click', () => {
      state.patches.splice(i, 1)
      savePatches()
    })
  })
  showPatchState()
}
function savePatches(redraw = true) {
  store.set('patches', state.patches)
  if (redraw) renderPatches()
}
$('add-patch').addEventListener('click', () => {
  state.patches.push({ src: 'gradient', app: 'isotones', dest: 'reverb', amount: 50 })
  savePatches()
})

// Mark patches whose app isn't open and linked
function showPatchState() {
  ;[...$('patches').children].forEach((row, i) => {
    const p = state.patches[i]
    const live = link.enabled && link.peerCount(p.app) > 0
    row.classList.toggle('offline', !live)
    row.querySelector('.state').textContent = live ? '' : `Waiting for a linked ${APP_NAMES[p.app]} window`
  })
}

// ---- Link ------------------------------------------------------------------------------

const link = new Link('isobars', {
  onMessage(msg) {
    if (msg.app === 'isobeats' && msg.clock) leader = msg.clock
  },
  onPeers() {
    if (!link.peerCount('isobeats')) leader = null
    showLink()
    showPatchState()
  },
})
function showLink() {
  const on = link.enabled
  $('link').textContent = on ? 'Linked' : 'Link timing'
  $('link').setAttribute('aria-pressed', String(on))
  $('link').classList.toggle('on', on)
  const apps = ['isotones', 'isobeats'].filter((a) => link.peerCount(a)).map((a) => APP_NAMES[a])
  $('link-status').textContent = !on ? 'Turn on to send modulation to Isotones and Isobeats windows in this browser'
    : apps.length ? `Modulating ${apps.join(' and ')}` : 'Waiting for an Isotones or Isobeats window in this browser'
}
function setLinked(on) {
  link.setEnabled(on)
  store.set('link', on)
  showLink()
  showPatchState()
}
$('link').addEventListener('click', () => setLinked(!link.enabled))

// ---- Place search ----------------------------------------------------------------------

function setPlace(place) {
  state.place = place
  store.set('place', place)
  motion.point = null
  $('place-input').value = ''
  $('place-results').hidden = true
  load()
}
let searchTimer
$('place-input').addEventListener('input', (e) => {
  clearTimeout(searchTimer)
  const q = e.target.value.trim()
  const list = $('place-results')
  if (q.length < 2) {
    list.hidden = true
    return
  }
  searchTimer = setTimeout(async () => {
    let places = []
    try {
      places = await searchPlaces(q)
    } catch {}
    list.innerHTML = ''
    if (!places.length) list.innerHTML = '<li class="none">No places found</li>'
    for (const p of places) {
      const li = document.createElement('li')
      const b = document.createElement('button')
      b.type = 'button'
      b.textContent = p.name
      b.addEventListener('click', () => setPlace(p))
      li.appendChild(b)
      list.appendChild(li)
    }
    list.hidden = false
  }, 250)
})
$('place-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('place-results').querySelector('button')?.click()
  if (e.key === 'Escape') $('place-results').hidden = true
})
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search')) $('place-results').hidden = true
})
$('locate').addEventListener('click', () => {
  if (!navigator.geolocation) return
  $('status').textContent = 'Finding your location…'
  navigator.geolocation.getCurrentPosition(
    (pos) => setPlace({ name: 'My location', lat: pos.coords.latitude, lon: pos.coords.longitude }),
    () => ($('status').textContent = "Couldn't get your location. Search for a place instead."),
    { maximumAge: 600000, timeout: 10000 },
  )
})

// ---- Drawing -------------------------------------------------------------------------------

let lastText = 0
function frame(now) {
  requestAnimationFrame(frame)
  chart.draw({ point: motion.point ?? state.place, trail: motion.trail, route: motion.route, mode: motion.mode, pulse: state.out?.crossing ?? 0 })
  if (now - lastText > 120) {
    lastText = now
    showOutputs()
    const name = state.place.name.split(/[,(]/)[0].trim()
    const when = motion.mode === 'timelapse' && state.field
      ? new Date((state.field.times[0] + state.hours * 3600) * 1000).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
      : 'now'
    $('summary').textContent = `Sea-level pressure around ${name} · ${when} · isobars every ${LINE} hPa`
    $('clock').textContent = leader ? `${leader.bpm} bpm from Isobeats${leader.running ? '' : ' (stopped)'}` : ''
  }
}

// Remember where the point is now and then
setInterval(() => motion.point && store.set('point', motion.point), 5000)

const folded = store.get('folded', {})
for (const panel of document.querySelectorAll('details.panel')) {
  if (folded[panel.id]) panel.open = false
  panel.addEventListener('toggle', () => {
    folded[panel.id] = !panel.open
    store.set('folded', folded)
  })
}

window.__isobars = { state, motion, link }
showMode()
renderPatches()
setLinked(store.get('link', false))
requestAnimationFrame(frame)
load()
