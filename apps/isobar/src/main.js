import { fetchWeather, sample, searchPlaces, FUTURE_HOURS } from './weather.js'
import { MODULES, ROWS, DEFAULT_DEPTHS, computePatch } from './patch.js'
import { Engine } from './engine.js'
import { buildKeyboard, bindComputerKeys, connectMidi } from './input.js'
import { Sequencer } from './sequencer.js'
import { createMap } from './map.js'

const $ = (id) => document.getElementById(id)
const store = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(`isobar:${key}`)) ?? fallback
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`isobar:${key}`, JSON.stringify(value))
    } catch {}
  },
}

const engine = new Engine()
const state = {
  place: store.get('place', { name: 'London, England, United Kingdom', lat: 51.51, lon: -0.13 }),
  depths: { ...DEFAULT_DEPTHS, ...store.get('depths-v2', {}) },
  data: null,
  offsetHours: 0,
}

// ---- Module cards -------------------------------------------------------

const cards = {}
const rows = ROWS.map((name) => {
  const row = document.createElement('div')
  row.className = 'module-row'
  row.setAttribute('role', 'group')
  row.setAttribute('aria-label', name)
  row.innerHTML = `<h2 class="row-name">${name}</h2><div class="row-cards"></div>`
  $('modules').appendChild(row)
  return row.lastElementChild
})
for (const m of MODULES) {
  const card = document.createElement('article')
  card.className = 'module'
  card.innerHTML = `
    <div class="module-head"><h3>${m.label}</h3><span class="reading">–</span></div>
    <div class="meter" role="img"><div class="meter-fill"></div></div>
    <p class="drives">${m.drives}</p>
    <p class="effect">–</p>
    <label class="depth">Depth
      <input type="range" min="0" max="1" step="0.01" value="${state.depths[m.id]}" />
      <output>${Math.round(state.depths[m.id] * 100)}</output>
    </label>`
  const fader = card.querySelector('input')
  const out = card.querySelector('output')
  fader.addEventListener('input', () => {
    state.depths[m.id] = Number(fader.value)
    out.textContent = Math.round(fader.value * 100)
    store.set('depths-v2', state.depths)
    refresh()
  })
  cards[m.id] = {
    fader, out,
    reading: card.querySelector('.reading'),
    meter: card.querySelector('.meter'),
    fill: card.querySelector('.meter-fill'),
    effect: card.querySelector('.effect'),
  }
  rows[m.row].appendChild(card)
}

$('reset-depths').addEventListener('click', () => {
  for (const m of MODULES) {
    state.depths[m.id] = 1
    cards[m.id].fader.value = 1
    cards[m.id].out.textContent = 100
  }
  store.set('depths-v2', state.depths)
  refresh()
})

// Sections fold away; remember which ones are open.
const folded = store.get('folded', {})
for (const panel of document.querySelectorAll('details.panel')) {
  if (folded[panel.id]) panel.open = false
  panel.addEventListener('toggle', () => {
    folded[panel.id] = !panel.open
    store.set('folded', folded)
  })
}

// ---- Weather -> patch -> engine -----------------------------------------

function localTime(t, withDay) {
  const d = new Date((t + state.data.utcOffset) * 1000)
  const opts = { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }
  if (withDay) Object.assign(opts, { weekday: 'short', day: 'numeric', month: 'short' })
  return d.toLocaleString('en-GB', opts)
}

function refresh() {
  if (!state.data) return
  const t = Date.now() / 1000 + state.offsetHours * 3600
  const w = sample(state.data, t)
  const patch = computePatch(w, state.depths)
  engine.apply(patch)
  for (const m of MODULES) {
    const c = cards[m.id]
    c.reading.textContent = patch.readings[m.id]
    c.effect.textContent = patch.effects[m.id]
    c.fill.style.width = `${Math.round(patch.values[m.id] * 100)}%`
    c.meter.setAttribute('aria-label', `${m.label} is at ${Math.round(patch.values[m.id] * 100)}% of its range`)
  }
  const when = state.offsetHours === 0 ? `now, ${localTime(t)} local time` : localTime(t, true)
  $('summary').textContent = `${state.place.name} · ${when}`
  $('scrub-label').textContent = state.offsetHours === 0 ? 'Now'
    : `${localTime(t, true)} (${state.offsetHours > 0 ? 'forecast' : 'past'})`
  window.__synth = { engine, patch, weather: w } // handy in the console
}

async function load() {
  $('status').textContent = `Fetching the weather for ${state.place.name}…`
  try {
    state.data = await fetchWeather(state.place)
    $('status').textContent = ''
    refresh()
  } catch (err) {
    $('status').textContent = `Couldn't load the weather (${err.message}). ${state.data ? 'Still using the last reading.' : 'Check your connection and reload.'}`
  }
}

setInterval(refresh, 5000) // the weather drifts continuously between hourly readings
setInterval(load, 30 * 60 * 1000)

// ---- Location picker ----------------------------------------------------

function setPlace(place) {
  state.place = place
  map.setPlace(place)
  store.set('place', place)
  $('place-input').value = ''
  $('place-results').hidden = true
  load()
}

const map = createMap($('map'), { onPick: setPlace })
map.setPlace(state.place)

function setView(view) {
  const isMap = view === 'map'
  $('sec-map').hidden = !isMap
  document.querySelector('.search').classList.toggle('off', isMap) // keeps its space so nothing shifts
  $('view-map').setAttribute('aria-pressed', isMap)
  $('view-search').setAttribute('aria-pressed', !isMap)
  store.set('view', view)
}
$('view-map').addEventListener('click', () => setView('map'))
$('view-search').addEventListener('click', () => setView('search'))
setView(store.get('view', 'search'))

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
  if (!navigator.geolocation) {
    $('status').textContent = "This browser can't share its location."
    return
  }
  $('status').textContent = 'Finding your location…'
  navigator.geolocation.getCurrentPosition(
    (pos) => setPlace({ name: 'My location', lat: pos.coords.latitude, lon: pos.coords.longitude }),
    () => ($('status').textContent = "Couldn't get your location. Search for a place instead."),
    { maximumAge: 600000, timeout: 10000 },
  )
})

// ---- Playing ------------------------------------------------------------

const power = () => engine.start()
const pressed = new Set() // keys physically down, on any input
const latched = new Set() // notes the latch is holding
let latch = false

const on = (midi, vel) => {
  if (latch) {
    // A fresh note or chord replaces whatever was latched before
    if (!pressed.size) {
      for (const m of latched) if (m !== midi) engine.noteOff(m)
      latched.clear()
    }
    latched.add(midi)
  }
  pressed.add(midi)
  seq.noteOn(midi, vel)
  if (!engine.running) power().then(() => engine.down.has(midi) && engine.noteOn(midi, vel))
  engine.noteOn(midi, vel)
}
const off = (midi) => {
  pressed.delete(midi)
  if (!pressed.size) seq.keysUp()
  if (latch && latched.has(midi)) return
  engine.noteOff(midi)
}

$('latch').addEventListener('click', () => {
  latch = !latch
  $('latch').classList.toggle('on', latch)
  $('latch').setAttribute('aria-pressed', latch)
  if (!latch) {
    for (const m of latched) if (!pressed.has(m)) engine.noteOff(m)
    latched.clear()
  }
})

// ---- Step sequencer -----------------------------------------------------

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
const noteName = (m) => NOTE_NAMES[m % 12] + (Math.floor(m / 12) - 1)

function renderSeq() {
  const grid = $('seq-steps')
  grid.innerHTML = ''
  for (let i = 0; i < seq.max; i++) {
    const cell = document.createElement('li')
    const step = seq.steps[i] ?? (seq.recording && i === seq.steps.length ? seq.pending : null)
    cell.textContent = !step ? '' : step.length ? step.map((n) => noteName(n.midi)).join(' ') : 'rest'
    if (seq.steps[i]) cell.classList.add('filled')
    if (seq.playing && i === seq.pos) cell.classList.add('current')
    if (seq.recording && i === seq.steps.length) cell.classList.add('next')
    grid.appendChild(cell)
  }
  $('seq-record').textContent = seq.recording ? 'Stop recording' : 'Record'
  $('seq-record').classList.toggle('recording', seq.recording)
  $('seq-play').textContent = seq.playing ? 'Stop' : 'Play'
  $('seq-play').classList.toggle('on', seq.playing)
  $('seq-play').disabled = !seq.steps.length && !seq.recording
  $('seq-rest').disabled = !seq.recording
  $('seq-clear').disabled = !seq.steps.length && !seq.recording
  $('seq-status').textContent = seq.recording
    ? `Recording step ${seq.steps.length + 1} of ${seq.max}: play a note or chord, or add a rest.`
    : seq.steps.length
      ? `${seq.steps.length} step${seq.steps.length > 1 ? 's' : ''} recorded. It loops at the wind's tempo.`
      : `Press Record, then play up to ${seq.max} notes or chords, one per step.`
  store.set('seq', { steps: seq.steps, max: seq.max, rate: seq.rate })
}

const seq = new Sequencer(engine, renderSeq)
Object.assign(seq, store.get('seq', {}))
engine.onStep = (t) => seq.clock(t)
$('seq-max').value = seq.max
$('seq-rate').value = seq.rate
$('seq-record').addEventListener('click', () => (seq.recording ? seq.finishRecording() : seq.record()))
$('seq-play').addEventListener('click', async () => {
  if (seq.playing) return seq.stop()
  await power()
  seq.play()
})
$('seq-rest').addEventListener('click', () => seq.rest())
$('seq-clear').addEventListener('click', () => seq.clear())
$('seq-max').addEventListener('change', (e) => seq.setMax(Number(e.target.value)))
$('seq-rate').addEventListener('change', (e) => {
  seq.rate = Number(e.target.value)
  renderSeq()
})
renderSeq()

const keyboard = buildKeyboard($('keyboard'), { on, off })
engine.onNotes = (notes) => keyboard.show(notes)
bindComputerKeys({
  on, off,
  onOctave: (o) => ($('octave').textContent = o ? ` (now ${o > 0 ? '+' : ''}${o})` : ''),
})

$('power').addEventListener('click', power)
$('midi').addEventListener('click', () =>
  connectMidi({
    on, off,
    sustain: (down) => engine.setSustain(down),
    status: (text, ok) => {
      $('midi-status').textContent = text
      $('midi').textContent = ok ? 'MIDI connected' : 'Connect MIDI keyboard'
      $('midi').classList.toggle('on', ok)
    },
  }),
)

const volume = $('volume')
volume.value = store.get('volume', 0.7)
engine.setVolume(Number(volume.value))
volume.addEventListener('input', () => {
  engine.setVolume(Number(volume.value))
  store.set('volume', Number(volume.value))
})

// ---- Test scrubber ------------------------------------------------------

$('scrub').max = FUTURE_HOURS
$('scrub').addEventListener('input', (e) => {
  state.offsetHours = Number(e.target.value)
  refresh()
})
$('scrub-reset').addEventListener('click', () => {
  state.offsetHours = 0
  $('scrub').value = 0
  refresh()
})

// ---- Scope and layer lights ---------------------------------------------

const scope = $('scope')
const g = scope.getContext('2d')
const layerEls = Object.fromEntries([...document.querySelectorAll('[data-layer]')].map((el) => [el.dataset.layer, el]))
const wave = new Float32Array(1024)
function draw() {
  requestAnimationFrame(draw)
  const now = performance.now()
  layerEls.arp.classList.toggle('on', now - engine.events.arp < 250)
  layerEls.rain.classList.toggle('on', now - engine.events.rain < 250)
  layerEls.gust.classList.toggle('on', now - engine.events.gust < 900)
  layerEls.thunder.classList.toggle('on', now - engine.events.thunder < 1500)
  layerEls.drone.classList.toggle('on', engine.droneOn)
  $('power').textContent = engine.running ? 'Audio on' : 'Start audio'
  $('power').classList.toggle('on', engine.running)
  g.clearRect(0, 0, scope.width, scope.height)
  if (!engine.analyser) return
  engine.analyser.getFloatTimeDomainData(wave)
  g.strokeStyle = getComputedStyle(scope).color
  g.lineWidth = 1.5
  g.beginPath()
  for (let x = 0; x < scope.width; x++) {
    const y = scope.height / 2 - wave[Math.floor((x / scope.width) * wave.length)] * scope.height * 0.9
    x ? g.lineTo(x, y) : g.moveTo(x, y)
  }
  g.stroke()
}
draw()

load()
