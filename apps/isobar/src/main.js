import { fetchWeather, sample, searchPlaces, FUTURE_HOURS } from './weather.js'
import { MODULES, ROWS, ROW_SHORT, ROW_COLOURS, DEFAULT_DEPTHS, computePatch, mergePatches } from './patch.js'
import { Engine } from './engine.js'
import { buildKeyboard, bindComputerKeys, connectMidi } from './input.js'
import { Sequencer } from './sequencer.js'
import { createMap } from './map.js'
import { AudioRecorder } from './recorder.js'

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
const LONDON = { name: 'London, England, United Kingdom', lat: 51.51, lon: -0.13 }
const firstPlace = store.get('place', LONDON) // from before rows could be split
const state = {
  // One place per row: Tone and space, Movement and rhythm, Colour and drama
  places: store.get('places', [firstPlace, firstPlace, firstPlace]),
  target: 'all', // which rows the next chosen place applies to
  depths: { ...DEFAULT_DEPTHS, ...store.get('depths-v2', {}) },
  offsetHours: 0,
}
const weather = new Map() // place key -> fetched data
const placeKey = (p) => `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`
const shortName = (p) => p.name.split(/[,(]/)[0].trim().replace(/^Near /, '')
const isSplit = () => new Set(state.places.map(placeKey)).size > 1
for (const [i, c] of ROW_COLOURS.entries()) document.documentElement.style.setProperty(`--row${i}`, c)

// ---- Module cards -------------------------------------------------------

const cards = {}
const rows = ROWS.map((name, i) => {
  const row = document.createElement('div')
  row.className = 'module-row'
  row.setAttribute('role', 'group')
  row.setAttribute('aria-label', name)
  row.innerHTML = `
    <div class="row-head" style="--c: var(--row${i})">
      <h2 class="row-name">${name}</h2>
      <button type="button" class="row-place" title="Choose a place for this row"></button>
    </div>
    <div class="row-cards"></div>`
  row.querySelector('.row-place').addEventListener('click', () => setTarget(state.target === i ? 'all' : i))
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

function localTime(t, data, withDay) {
  const d = new Date((t + data.utcOffset) * 1000)
  const opts = { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }
  if (withDay) Object.assign(opts, { weekday: 'short', day: 'numeric', month: 'short' })
  return d.toLocaleString('en-GB', opts)
}

function refresh() {
  const loaded = state.places.map((p) => weather.get(placeKey(p)))
  const fallback = loaded.find(Boolean)
  if (!fallback) return
  const datas = loaded.map((d) => d ?? fallback)
  const t = Date.now() / 1000 + state.offsetHours * 3600
  // One patch per distinct place, then each row takes its own modules' settings
  const byData = new Map()
  const patchFor = (d) => {
    if (!byData.has(d)) byData.set(d, computePatch(sample(d, t), state.depths))
    return byData.get(d)
  }
  const patch = mergePatches(datas.map(patchFor))
  engine.apply(patch)
  for (const m of MODULES) {
    const c = cards[m.id]
    c.reading.textContent = patch.readings[m.id]
    c.effect.textContent = patch.effects[m.id]
    c.fill.style.width = `${Math.round(patch.values[m.id] * 100)}%`
    c.meter.setAttribute('aria-label', `${m.label} is at ${Math.round(patch.values[m.id] * 100)}% of its range`)
  }
  const tempo = datas[1] // the Movement row sets the tempo, so its clock leads
  if (!isSplit()) {
    const when = state.offsetHours === 0 ? `now, ${localTime(t, tempo)} local time` : localTime(t, tempo, true)
    $('summary').textContent = `${state.places[0].name} · ${when}`
  } else {
    $('summary').textContent = ROW_SHORT.map((r, i) => `${r} in ${shortName(state.places[i])} ${localTime(t, datas[i])}`).join(' · ')
  }
  $('scrub-label').textContent = state.offsetHours === 0 ? 'Now'
    : `${localTime(t, tempo, true)}${isSplit() ? ` in ${shortName(state.places[1])}` : ''} (${state.offsetHours > 0 ? 'forecast' : 'past'})`
  window.__synth = { engine, patch, weather: datas.map((d) => sample(d, t)) } // handy in the console
}

async function load() {
  const missing = [...new Map(state.places.map((p) => [placeKey(p), p])).values()]
  $('status').textContent = `Fetching the weather for ${missing.map(shortName).join(', ')}…`
  const results = await Promise.allSettled(missing.map(async (p) => weather.set(placeKey(p), await fetchWeather(p))))
  const failed = results.filter((r) => r.status === 'rejected')
  $('status').textContent = failed.length
    ? `Couldn't load the weather (${failed[0].reason.message}). ${weather.size ? 'Using the last reading where there is one.' : 'Check your connection and reload.'}`
    : ''
  refresh()
}

setInterval(refresh, 5000) // the weather drifts continuously between hourly readings
setInterval(() => {
  weather.clear()
  load()
}, 30 * 60 * 1000)

// ---- Location picker ----------------------------------------------------
// A chosen place goes to every row, or only the targeted one.

function setPlace(place) {
  if (state.target === 'all') state.places = [place, place, place]
  else state.places = state.places.map((p, i) => (i === state.target ? place : p))
  store.set('places', state.places)
  $('place-input').value = ''
  $('place-results').hidden = true
  showPlaces()
  if (weather.has(placeKey(place))) refresh()
  else load()
}

function setTarget(target) {
  state.target = target
  for (const b of document.querySelectorAll('#target button')) {
    b.setAttribute('aria-pressed', String(b.dataset.target === String(target)))
  }
  showPlaces()
}
for (const b of document.querySelectorAll('#target button')) {
  b.addEventListener('click', () => setTarget(b.dataset.target === 'all' ? 'all' : Number(b.dataset.target)))
}

function pickLabel() {
  return state.target === 'all' ? 'Click to use for everything' : `Click to set ${ROWS[state.target]}`
}

// Row chips, map pins, the search label and the "join" button
function showPlaces() {
  const split = isSplit()
  document.querySelectorAll('.module-row').forEach((row, i) => {
    const chip = row.querySelector('.row-place')
    chip.textContent = shortName(state.places[i])
    chip.classList.toggle('targeted', state.target === i)
    chip.setAttribute('aria-pressed', String(state.target === i))
    row.classList.toggle('split', split)
  })
  const groups = new Map()
  state.places.forEach((p, i) => {
    const key = placeKey(p)
    if (!groups.has(key)) groups.set(key, { lat: p.lat, lon: p.lon, colours: [] })
    groups.get(key).colours.push(ROW_COLOURS[i])
  })
  map.setPins(split ? [...groups.values()] : [{ ...state.places[0], colours: ['var(--accent)'] }])
  $('place-label').textContent = state.target === 'all' ? 'Location' : `Location for ${ROWS[state.target]}`
  const join = $('join')
  join.hidden = !split
  const from = state.target === 'all' ? 1 : state.target
  join.textContent = `Use ${shortName(state.places[from])} for everything`
  join.onclick = () => {
    const place = state.places[from]
    setTarget('all')
    setPlace(place)
  }
}

const map = createMap($('map'), { onPick: setPlace, pickLabel })

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

// ---- Audio recording ----------------------------------------------------
// Records whatever you hear (free play, the sequence, or both) to a WAV file.
// The clock starts at the first sound and stops at MAX_SECONDS.

const MAX_SECONDS = 10
const ARM_TIMEOUT = 60 // seconds to wait for a first note before giving up
const rec = { busy: false, stopRequested: false, recorder: null }
const recBtn = $('rec-audio')
const recStatus = (text) => ($('rec-status').textContent = text)

function fileName() {
  const place = [...new Set(state.places.map(shortName))].join(' ').toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'somewhere'
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `isobar-${place}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.wav`
}

function save(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function recordAudio() {
  if (rec.busy) {
    rec.stopRequested = true
    return
  }
  rec.busy = true
  rec.stopRequested = false
  recBtn.textContent = 'Stop'
  recBtn.classList.add('recording')
  try {
    await power()
    rec.recorder ??= new AudioRecorder(engine.ctx, engine.analyser)
    const r = rec.recorder
    await r.start()

    // Armed: wait for the first sound
    const armedAt = performance.now()
    recStatus('Ready: recording starts when you play')
    while (r.heardSeconds == null && !rec.stopRequested) {
      if (performance.now() - armedAt > ARM_TIMEOUT * 1000) {
        rec.stopRequested = true
        break
      }
      await wait(50)
    }
    if (r.heardSeconds == null) {
      await r.stop()
      recStatus('Nothing was played, so nothing was saved.')
      return
    }

    // Recording until Stop or the limit
    while (!rec.stopRequested && r.heardSeconds < MAX_SECONDS) {
      recStatus(`Recording ${r.heardSeconds.toFixed(1)} of ${MAX_SECONDS} s`)
      await wait(50)
    }

    // Stopped early: let the reverb and echo ring out, still within the limit
    if (r.heardSeconds < MAX_SECONDS) {
      let quietSince = null
      while (r.heardSeconds < MAX_SECONDS) {
        recStatus(`Letting the echo ring out… ${r.heardSeconds.toFixed(1)} s`)
        if (engine.level() < 0.002) {
          quietSince ??= performance.now()
          if (performance.now() - quietSince > 400) break
        } else quietSince = null
        await wait(50)
      }
    }

    const blob = await r.stop(MAX_SECONDS)
    const name = fileName()
    save(blob, name)
    recStatus(`Saved ${name} (${(blob.size / 4 / engine.ctx.sampleRate).toFixed(1)} s) to your downloads.`)
    rec.lastBlob = blob // handy for testing
  } catch (err) {
    recStatus(`Couldn't record audio: ${err.message}`)
  } finally {
    rec.busy = false
    recBtn.textContent = 'Record audio'
    recBtn.classList.remove('recording')
  }
}

recBtn.addEventListener('click', recordAudio)
window.__rec = rec

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

showPlaces()
load()
