import { fetchWeather, sample, searchPlaces, FUTURE_HOURS } from '../../isobar/src/weather.js'
import { createMap } from '../../isobar/src/map.js'
import { AudioRecorder } from '../../isobar/src/recorder.js'
import { connectMidi } from '../../isobar/src/input.js'
import { MODULES, ROWS, ROW_SHORT, ROW_COLOURS, DEFAULT_DEPTHS, computePatch, mergePatches } from './patch.js'
import { BeatEngine, BASE_NOTE } from './engine.js'
import { createKnob } from './knob.js'

const $ = (id) => document.getElementById(id)
const store = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(`isobeats:${key}`)) ?? fallback
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`isobeats:${key}`, JSON.stringify(value))
    } catch {}
  },
}

// ---- Pattern ------------------------------------------------------------
// 16 steps are always kept; the length decides how many play.

const MAX_STEPS = 16
const DEFAULT_STEPS = [
  [0, 1], [12, 0.35], [7, 0.7], [0, 0.45], [0, 0.9], [19, 0.3], [5, 0.75], [24, 0.4],
  [0, 1], [12, 0.35], [10, 0.7], [0, 0.45], [0, 0.9], [17, 0.6], [3, 0.8], [22, 0.5],
].map(([pitch, vel]) => ({ pitch, vel }))
const saved = store.get('pattern', null)
const pattern = {
  steps: saved?.steps?.length === MAX_STEPS ? saved.steps : DEFAULT_STEPS.map((s) => ({ ...s })),
  length: saved?.length === 16 ? 16 : 8,
  transpose: saved?.transpose ?? 0,
}
const savePattern = () => store.set('pattern', pattern)

const engine = new BeatEngine(pattern)
const LONDON = { name: 'London, England, United Kingdom', lat: 51.51, lon: -0.13 }
const state = {
  // One place per row: Voice, Groove, Space and drama
  places: store.get('places', [LONDON, LONDON, LONDON]),
  target: 'all',
  depths: { ...DEFAULT_DEPTHS, ...store.get('depths', {}) },
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
    store.set('depths', state.depths)
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
  store.set('depths', state.depths)
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
  const tempo = datas[1] // the Groove row sets the tempo, so its clock leads
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

// ---- Sequencer ------------------------------------------------------------

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
const noteName = (m) => NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1)
const stepEls = []
const pitchKnobs = []
const velKnobs = []

for (let i = 0; i < MAX_STEPS; i++) {
  const col = document.createElement('div')
  col.className = 'step'
  col.setAttribute('role', 'group')
  col.setAttribute('aria-label', `Step ${i + 1}`)
  col.innerHTML = `<div class="step-head"><span class="led"></span><span>${i + 1}</span></div>`
  const pitch = createKnob({
    label: `Step ${i + 1} pitch`, min: 0, max: 36, step: 1, value: pattern.steps[i].pitch, defaultValue: 0,
    format: (v) => noteName(BASE_NOTE + pattern.transpose + v),
    onInput: (v) => {
      pattern.steps[i].pitch = v
      savePattern()
    },
  })
  const vel = createKnob({
    label: `Step ${i + 1} velocity`, min: 0, max: 100, step: 1, value: Math.round(pattern.steps[i].vel * 100), defaultValue: 70,
    format: (v) => (v === 0 ? 'rest' : `${v}%`),
    onInput: (v) => {
      pattern.steps[i].vel = v / 100
      col.classList.toggle('rest', v === 0)
      col.classList.toggle('quiet', v > 0 && v < 50)
      savePattern()
    },
  })
  pitch.classList.add('pitch')
  vel.classList.add('vel')
  col.append(pitch, vel)
  col.classList.toggle('rest', pattern.steps[i].vel === 0)
  col.classList.toggle('quiet', pattern.steps[i].vel > 0 && pattern.steps[i].vel < 0.5)
  $('steps').appendChild(col)
  stepEls.push(col)
  pitchKnobs.push(pitch)
  velKnobs.push(vel)
}

function showPattern() {
  stepEls.forEach((col, i) => {
    col.hidden = i >= pattern.length
    pitchKnobs[i].setValue(pattern.steps[i].pitch)
    velKnobs[i].setValue(Math.round(pattern.steps[i].vel * 100))
    col.classList.toggle('rest', pattern.steps[i].vel === 0)
    col.classList.toggle('quiet', pattern.steps[i].vel > 0 && pattern.steps[i].vel < 0.5)
  })
  $('steps').classList.toggle('sixteen', pattern.length === 16)
  $('tr-value').textContent = pattern.transpose > 0 ? `+${pattern.transpose}` : pattern.transpose
  $('length').value = pattern.length
}

function setTranspose(n) {
  pattern.transpose = Math.max(-24, Math.min(24, n))
  savePattern()
  showPattern()
}
$('tr-down').addEventListener('click', () => setTranspose(pattern.transpose - 1))
$('tr-up').addEventListener('click', () => setTranspose(pattern.transpose + 1))
$('length').addEventListener('change', (e) => {
  pattern.length = Number(e.target.value)
  if (engine.pos >= pattern.length) engine.pos = 0
  savePattern()
  showPattern()
})
$('randomise').addEventListener('click', () => {
  pattern.steps = pattern.steps.map((_, i) => {
    const strong = i % 4 === 0
    const vel = !strong && Math.random() < 0.3 ? 0 : strong ? 0.8 + Math.random() * 0.2 : 0.25 + Math.random() * 0.6
    const pitch = strong ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 31)
    return { pitch, vel: Math.round(vel * 100) / 100 }
  })
  savePattern()
  showPattern()
})
$('default').addEventListener('click', () => {
  pattern.steps = DEFAULT_STEPS.map((s) => ({ ...s }))
  savePattern()
  showPattern()
})
$('clear').addEventListener('click', () => {
  pattern.steps = pattern.steps.map((s) => ({ pitch: s.pitch, vel: 0 }))
  savePattern()
  showPattern()
})

// ---- Transport ------------------------------------------------------------

let lastPlayed = -1
let lastPlayedAt = 0
engine.onStep = (i) => {
  lastPlayed = i
  lastPlayedAt = performance.now()
}

const power = () => engine.start()
async function setRunning(on) {
  if (on) await power()
  engine.run(on)
}
$('run').addEventListener('click', () => setRunning(!engine.running))
$('hit').addEventListener('click', async () => {
  await power()
  engine.trigger()
})
$('advance').addEventListener('click', () => engine.advance())
$('reset').addEventListener('click', () => engine.reset())

window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
  if (e.target.closest('input, select, textarea')) return
  if (e.code === 'Space' && !e.target.closest('button')) {
    e.preventDefault()
    setRunning(!engine.running)
  } else if (e.key === 'z' || e.key === 'Z') setTranspose(pattern.transpose - 1)
  else if (e.key === 'x' || e.key === 'X') setTranspose(pattern.transpose + 1)
})

// MIDI: a note transposes the pattern (middle C plays it as written). When the
// sequencer is stopped, a note also plays the current step and moves on.
$('midi').addEventListener('click', () =>
  connectMidi({
    on: async (note) => {
      setTranspose(note - 60)
      if (!engine.running) {
        await power()
        engine.trigger()
      }
    },
    off: () => {},
    sustain: () => {},
    status: (text, ok) => {
      $('midi-status').textContent = text
      $('midi').textContent = ok ? 'MIDI connected' : 'Connect MIDI'
      $('midi').classList.toggle('on', ok)
    },
  }),
)

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
  return `isobeats-${place}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.wav`
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

// ---- Scope, layer lights and step lights -----------------------------------

const scope = $('scope')
const g = scope.getContext('2d')
const layerEls = Object.fromEntries([...document.querySelectorAll('[data-layer]')].map((el) => [el.dataset.layer, el]))
const wave = new Float32Array(1024)
function draw() {
  requestAnimationFrame(draw)
  const now = performance.now()
  for (const [name, el] of Object.entries(layerEls)) {
    el.classList.toggle('on', now - engine.events[name] < (name === 'thunder' ? 1500 : 200))
  }
  $('tempo').textContent = `${engine.bpm} bpm${engine.running && engine.patch && engine.patch.bpm !== engine.bpm ? ` → ${engine.patch.bpm}` : ''}`
  $('run').textContent = engine.running ? 'Stop' : 'Run'
  $('run').setAttribute('aria-pressed', String(engine.running))
  $('run').classList.toggle('on', engine.running)
  stepEls.forEach((col, i) => {
    col.classList.toggle('hit', i === lastPlayed && now - lastPlayedAt < 120)
    col.classList.toggle('current', engine.running ? i === lastPlayed : i === engine.pos)
  })
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

window.__beats = { engine, pattern }
showPattern()
showPlaces()
load()
