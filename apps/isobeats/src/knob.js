// A rotary knob: drag up or down, scroll, or use the arrow keys.
// Double-click returns it to its default value.

const START = -135
const SWEEP = 270

function arcPath(from, to, r = 15) {
  const pt = (deg) => {
    const a = ((deg - 90) * Math.PI) / 180
    return [20 + r * Math.cos(a), 20 + r * Math.sin(a)]
  }
  const [x1, y1] = pt(from)
  const [x2, y2] = pt(to)
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

export function createKnob({ label, min, max, step = 1, value, defaultValue = value, format = String, onInput }) {
  const el = document.createElement('div')
  el.className = 'knob'
  el.tabIndex = 0
  el.setAttribute('role', 'slider')
  el.setAttribute('aria-label', label)
  el.setAttribute('aria-valuemin', min)
  el.setAttribute('aria-valuemax', max)
  el.innerHTML = `
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path class="knob-track" d="${arcPath(START, START + SWEEP)}" />
      <path class="knob-arc" />
      <line class="knob-pointer" x1="20" y1="20" x2="20" y2="8" />
    </svg>
    <span class="knob-value"></span>`
  const arc = el.querySelector('.knob-arc')
  const pointer = el.querySelector('.knob-pointer')
  const readout = el.querySelector('.knob-value')
  let current = value

  const snap = (v) => Math.min(max, Math.max(min, Math.round(v / step) * step))
  function show() {
    const frac = (current - min) / (max - min)
    const deg = START + frac * SWEEP
    arc.setAttribute('d', frac > 0.002 ? arcPath(START, deg) : '')
    pointer.setAttribute('transform', `rotate(${deg} 20 20)`)
    readout.textContent = format(current)
    el.setAttribute('aria-valuenow', current)
    el.setAttribute('aria-valuetext', format(current))
  }
  function set(v, emit = true) {
    const next = snap(v)
    if (next === current) return
    current = next
    show()
    if (emit) onInput?.(current)
  }

  let drag = null
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    el.focus()
    try {
      el.setPointerCapture(e.pointerId) // keep turning even if the pointer leaves the knob
    } catch {}
    drag = { y: e.clientY, v: current }
    el.classList.add('turning')
    document.body.classList.add('knob-turning') // no text selection while dragging
  })
  el.addEventListener('pointermove', (e) => {
    if (!drag) return
    const range = max - min
    const pxPerRange = e.shiftKey ? 600 : 160 // hold Shift for fine control
    set(drag.v + ((drag.y - e.clientY) / pxPerRange) * range)
  })
  const end = () => {
    drag = null
    el.classList.remove('turning')
    document.body.classList.remove('knob-turning')
  }
  el.addEventListener('mousedown', (e) => e.preventDefault())
  el.addEventListener('pointerup', end)
  el.addEventListener('pointercancel', end)
  el.addEventListener('wheel', (e) => {
    e.preventDefault()
    set(current + (e.deltaY < 0 ? step : -step) * (e.shiftKey ? 1 : Math.max(1, Math.round((max - min) / step / 40))))
  }, { passive: false })
  el.addEventListener('keydown', (e) => {
    const big = Math.max(step, Math.round((max - min) / 10 / step) * step)
    const moves = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step, PageUp: big, PageDown: -big }
    if (e.key in moves) set(current + moves[e.key])
    else if (e.key === 'Home') set(min)
    else if (e.key === 'End') set(max)
    else return
    e.preventDefault()
  })
  el.addEventListener('dblclick', () => set(defaultValue))

  show()
  el.setValue = (v) => {
    current = snap(v)
    show()
  }
  return el
}
