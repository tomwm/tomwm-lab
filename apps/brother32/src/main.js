import { createRack, store } from '../../dfal/src/rack.js'
import { buildControls } from '../../dfal/src/controls.js'
import { SECTIONS, DEFAULTS, DEFAULT_PATTERN, MAX_STEPS, JACKS, noteName } from './panel.js'
import workletUrl from './voice.worklet.js?worker&url'

const $ = (id) => document.getElementById(id)
const clone = (x) => JSON.parse(JSON.stringify(x))

let state
const rack = createRack({
  kind: 'brother',
  title: 'Brother 32',
  jacks: JACKS,
  workletUrl,
  processor: 'brother-voice',
  options: () => ({ params: state.params, pattern: state.pattern, octave: state.octave }),
  onVoice(m) {
    if (m.type === 'step') setTimeout(() => showStep(m.step), Math.max(0, rack.heardIn(m.t)))
    else if (m.type === 'running') showRunning(m.on)
  },
})
const { bus, post, say } = rack

const stateKey = () => `brother32.state.${bus.id}`
function loadState() {
  const saved = store.get(stateKey(), null)
  state = {
    params: { ...DEFAULTS, ...(saved?.params || {}) },
    pattern: saved?.pattern?.steps?.length === MAX_STEPS ? saved.pattern : clone(DEFAULT_PATTERN),
    octave: saved?.octave ?? 0,
  }
}
let saveTimer = null
function save() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => store.set(stateKey(), state), 200)
}

// ---- Front panel ------------------------------------------------------------------

let panel = null
function setParam(id, v) {
  state.params[id] = v
  save()
  post({ type: 'params', params: { [id]: v } })
}

// ---- Sequencer ----------------------------------------------------------------------

let selected = 0
let entry = false
const stepEls = []

function sendPattern() {
  save()
  post({ type: 'pattern', pattern: state.pattern })
}

function buildSteps() {
  const root = $('steps')
  for (let i = 0; i < MAX_STEPS; i++) {
    const el = document.createElement('div')
    el.className = 'mstep'
    el.innerHTML = `<span class="num">${i + 1}</span>
      <button type="button" class="note" title="Step ${i + 1}: click to select, scroll or arrow keys to change the note"></button>
      <button type="button" class="gate" title="Gate: on, tie or rest"></button>
      <div class="flags">
        <button type="button" class="acc" title="Accent">A</button>
        <button type="button" class="gl" title="Glide into this step">G</button>
      </div>
      <button type="button" class="rat" title="Ratchet: play this step 1 to 4 times"></button>`
    const step = () => state.pattern.steps[i]
    const note = el.querySelector('.note')
    note.addEventListener('click', () => select(i))
    note.addEventListener('wheel', (e) => {
      e.preventDefault()
      setNote(i, step().note + (e.deltaY < 0 ? 1 : -1))
    }, { passive: false })
    note.addEventListener('keydown', (e) => {
      const d = { ArrowUp: 1, ArrowDown: -1, PageUp: 12, PageDown: -12 }[e.key]
      if (d) {
        e.preventDefault()
        setNote(i, step().note + d)
      }
    })
    el.querySelector('.gate').addEventListener('click', () => {
      const order = ['on', 'tie', 'rest']
      step().gate = order[(order.indexOf(step().gate) + 1) % 3]
      showSteps()
      sendPattern()
    })
    el.querySelector('.acc').addEventListener('click', () => {
      step().accent = !step().accent
      showSteps()
      sendPattern()
    })
    el.querySelector('.gl').addEventListener('click', () => {
      step().glide = !step().glide
      showSteps()
      sendPattern()
    })
    el.querySelector('.rat').addEventListener('click', () => {
      step().ratchet = (step().ratchet % 4) + 1
      showSteps()
      sendPattern()
    })
    root.append(el)
    stepEls.push(el)
  }
  const len = $('length')
  for (let n = 1; n <= MAX_STEPS; n++) len.add(new Option(String(n), String(n)))
  len.addEventListener('change', () => {
    state.pattern.length = Number(len.value)
    showSteps()
    sendPattern()
  })
}

function setNote(i, n) {
  state.pattern.steps[i].note = Math.max(-12, Math.min(36, n))
  showSteps()
  sendPattern()
}

function select(i) {
  selected = i
  showSteps()
}

function showSteps() {
  state.pattern.steps.forEach((st, i) => {
    const el = stepEls[i]
    el.classList.toggle('off', i >= state.pattern.length)
    el.classList.toggle('selected', i === selected)
    el.classList.toggle('rest', st.gate === 'rest')
    el.querySelector('.note').textContent = noteName(st.note)
    const g = el.querySelector('.gate')
    g.dataset.gate = st.gate
    g.textContent = { on: 'On', tie: 'Tie', rest: 'Rest' }[st.gate]
    el.querySelector('.acc').setAttribute('aria-pressed', String(st.accent))
    el.querySelector('.gl').setAttribute('aria-pressed', String(st.glide))
    el.querySelector('.rat').textContent = `×${st.ratchet}`
  })
  $('length').value = String(state.pattern.length)
}

let lit = -1
function showStep(step) {
  stepEls[lit]?.classList.remove('current')
  lit = step
  stepEls[step]?.classList.add('current')
}

$('entry').addEventListener('click', () => {
  entry = !entry
  $('entry').setAttribute('aria-pressed', String(entry))
  say(entry ? `Step entry: play a key to set step ${selected + 1}` : '')
})
$('randomise').addEventListener('click', () => {
  const scale = [0, 0, 0, 3, 5, 7, 7, 10, 12, 12, 15, -5]
  const pick = () => scale[Math.floor(Math.random() * scale.length)]
  state.pattern.steps = state.pattern.steps.map((_, i) => {
    const r = Math.random()
    return {
      note: i === 0 ? 0 : pick(),
      gate: i === 0 ? 'on' : r < 0.15 ? 'rest' : r < 0.25 ? 'tie' : 'on',
      accent: Math.random() < 0.25,
      glide: Math.random() < 0.2,
      ratchet: Math.random() < 0.08 ? 2 : 1,
    }
  })
  showSteps()
  sendPattern()
})
$('default-pattern').addEventListener('click', () => {
  state.pattern = clone(DEFAULT_PATTERN)
  showSteps()
  sendPattern()
})
$('clear').addEventListener('click', () => {
  state.pattern.steps = state.pattern.steps.map(() => ({ note: 0, gate: 'on', accent: false, glide: false, ratchet: 1 }))
  showSteps()
  sendPattern()
})

// ---- Keyboard -----------------------------------------------------------------------

const KEY_COUNT = 25 // C to C, two octaves
const BLACK = new Set([1, 3, 6, 8, 10])
const COMPUTER_KEYS = 'awsedftgyhujkolp;\''
const keyEls = []
const held = new Set()

function buildKeyboard() {
  const root = $('keyboard')
  let white = 0
  for (let n = 0; n < KEY_COUNT; n++) {
    const b = document.createElement('button')
    b.type = 'button'
    const black = BLACK.has(n % 12)
    b.className = `key${black ? ' black' : ''}`
    b.setAttribute('aria-label', noteName(n))
    const label = COMPUTER_KEYS[n]
    b.innerHTML = label ? `<span>${label.toUpperCase()}</span>` : ''
    if (black) b.style.left = `calc(${(white / 15) * 100}% - (100% / 15 * 0.31))`
    else white++
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      b.setPointerCapture?.(e.pointerId)
      keyOn(n)
    })
    const up = () => keyOff(n)
    b.addEventListener('pointerup', up)
    b.addEventListener('pointercancel', up)
    b.addEventListener('lostpointercapture', up)
    root.append(b)
    keyEls.push(b)
  }
}

async function keyOn(n) {
  if (held.has(n)) return
  held.add(n)
  keyEls[n]?.classList.add('down')
  await rack.ensureAudio()
  post({ type: 'key', note: n, on: true })
  if (entry) {
    const st = state.pattern.steps[selected]
    st.note = n
    if (st.gate === 'rest') st.gate = 'on'
    selected = (selected + 1) % state.pattern.length
    showSteps()
    sendPattern()
    say(`Step entry: play a key to set step ${selected + 1}`)
  }
}
function keyOff(n) {
  if (!held.delete(n)) return
  keyEls[n]?.classList.remove('down')
  post({ type: 'key', note: n, on: false })
}

const typing = (e) => ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName) || e.metaKey || e.ctrlKey || e.altKey
document.addEventListener('keydown', (e) => {
  if (typing(e) || e.repeat) return
  const n = COMPUTER_KEYS.indexOf(e.key.toLowerCase())
  if (n >= 0) {
    keyOn(n)
    return
  }
  if (e.key === ' ' && e.target.tagName !== 'BUTTON') {
    e.preventDefault()
    setRunning(!running)
  } else if (e.key === 'z') setOctave(state.octave - 1)
  else if (e.key === 'x') setOctave(state.octave + 1)
})
document.addEventListener('keyup', (e) => {
  const n = COMPUTER_KEYS.indexOf(e.key.toLowerCase())
  if (n >= 0) keyOff(n)
})
window.addEventListener('blur', () => [...held].forEach(keyOff))

function setOctave(o) {
  state.octave = Math.max(-2, Math.min(2, o))
  $('oct-value').textContent = state.octave > 0 ? `+${state.octave}` : String(state.octave)
  save()
  post({ type: 'octave', octave: state.octave })
}
$('oct-down').addEventListener('click', () => setOctave(state.octave - 1))
$('oct-up').addEventListener('click', () => setOctave(state.octave + 1))

// ---- Transport --------------------------------------------------------------------

let running = false
function showRunning(on) {
  running = on
  $('run').setAttribute('aria-pressed', String(on))
  $('run').textContent = on ? 'Stop' : 'Run'
  if (!on) showStep(-1)
}
async function setRunning(on) {
  await rack.ensureAudio()
  post({ type: 'run', on })
}
$('run').addEventListener('click', () => setRunning(!running))
$('reset').addEventListener('click', async () => {
  await rack.ensureAudio()
  post({ type: 'reset' })
})
$('default').addEventListener('click', () => {
  state.params = { ...DEFAULTS }
  panel.show()
  save()
  post({ type: 'params', params: state.params })
  say('Back to the default sound')
})
$('new-window').addEventListener('click', () => window.open(location.pathname, '_blank', 'popup=yes,width=1240,height=940'))
$('open-dfal').addEventListener('click', () => window.open(new URL('../dfal/', location.href), '_blank', 'popup=yes,width=1200,height=900'))

// ---- Start -----------------------------------------------------------------------

async function init() {
  await rack.start(() => {
    loadState()
    panel = buildControls($('sections'), SECTIONS, () => state.params, setParam)
    buildSteps()
    buildKeyboard()
    showSteps()
    setOctave(state.octave)
  })
  say('Press Run (or Space) to start, or play the keyboard.')
}
init()
