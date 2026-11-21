import { createKnob } from '../../isobeats/src/knob.js'
import { createRack, store } from './rack.js'
import { buildControls } from './controls.js'
import { SECTIONS, DEFAULTS, DEFAULT_STEPS, JACKS, STEP_COUNT, PITCH_RANGE, formatPitch } from './panel.js'
import workletUrl from './voice.worklet.js?worker&url'

const $ = (id) => document.getElementById(id)

let state
const rack = createRack({
  kind: 'dfal',
  title: 'DFAL',
  jacks: JACKS,
  workletUrl,
  processor: 'dfal-voice',
  options: () => ({ params: state.params, steps: state.steps }),
  onVoice(m) {
    if (m.type === 'step') setTimeout(() => showStep(m.step, m.fired), Math.max(0, rack.heardIn(m.t)))
    else if (m.type === 'running') showRunning(m.on)
  },
})
const { bus, post, say } = rack

const stateKey = () => `dfal.state.${bus.id}`
function loadState() {
  const saved = store.get(stateKey(), null)
  const params = { ...DEFAULTS, ...(saved?.params || {}) }
  params.vcfMod = Math.max(0, params.vcfMod) // this knob used to turn both ways
  const steps = Array.from({ length: STEP_COUNT }, (_, i) => ({ ...DEFAULT_STEPS[i], ...(saved?.steps?.[i] || {}) }))
  state = { params, steps }
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
      min: -PITCH_RANGE,
      max: PITCH_RANGE,
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
  panel.show()
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
  await rack.ensureAudio()
  post({ type: 'run', on })
}
$('run').addEventListener('click', () => setRunning(!running))
for (const id of ['trig', 'adv', 'reset']) {
  $(id).addEventListener('click', async () => {
    await rack.ensureAudio()
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
$('open-brother').addEventListener('click', () => window.open(new URL('../brother32/', location.href), '_blank', 'popup=yes,width=1240,height=940'))
$('new-window').addEventListener('click', () => {
  window.open(location.pathname, '_blank', 'popup=yes,width=1200,height=900')
})
document.addEventListener('keydown', (e) => {
  const tag = e.target.tagName
  if (e.key === ' ' && tag !== 'BUTTON' && tag !== 'INPUT' && tag !== 'SELECT') {
    e.preventDefault()
    setRunning(!running)
  }
})

// ---- Start -----------------------------------------------------------------------

async function init() {
  await rack.start(() => {
    loadState()
    panel = buildControls($('sections'), SECTIONS, () => state.params, setParam)
    buildSteps()
  })
  say('Press Run (or Space) to start.')
}
init()
