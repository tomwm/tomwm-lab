// Three ways to play: on-screen keys, the computer keyboard, and Web MIDI.

const LOW = 48 // C3
const HIGH = 72 // C5
const BLACK = new Set([1, 3, 6, 8, 10])
const KEYMAP = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ';': 16 }

export function buildKeyboard(el, { on, off }) {
  const keys = new Map()
  let whiteIndex = 0
  const whites = [...Array(HIGH - LOW + 1).keys()].filter((i) => !BLACK.has(i % 12)).length
  for (let midi = LOW; midi <= HIGH; midi++) {
    const black = BLACK.has(midi % 12)
    const key = document.createElement('button')
    key.type = 'button'
    key.className = black ? 'key black' : 'key white'
    key.tabIndex = -1
    key.setAttribute('aria-label', `Note ${midi}`)
    if (black) key.style.left = `calc(${(whiteIndex / whites) * 100}% - var(--black-w) / 2)`
    else {
      key.style.left = `${(whiteIndex / whites) * 100}%`
      key.style.width = `${100 / whites}%`
      whiteIndex++
    }
    let held = false
    const press = (e) => {
      if (held) return
      held = true
      // Higher up the key is quieter, like a touch-strip
      const r = key.getBoundingClientRect()
      on(midi, 0.45 + 0.5 * Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)))
    }
    const lift = () => {
      if (!held) return
      held = false
      off(midi)
    }
    key.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      key.releasePointerCapture?.(e.pointerId)
      press(e)
    })
    key.addEventListener('pointerenter', (e) => e.buttons && press(e))
    key.addEventListener('pointerleave', lift)
    key.addEventListener('pointerup', lift)
    key.addEventListener('pointercancel', lift)
    el.appendChild(key)
    keys.set(midi, key)
  }
  return {
    show(activeNotes) {
      const active = new Set(activeNotes)
      for (const [midi, key] of keys) key.classList.toggle('on', active.has(midi))
    },
  }
}

export function bindComputerKeys({ on, off, onOctave }) {
  let octave = 0
  const sounding = new Map() // key -> midi it started, so octave shifts don't strand notes
  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
    if (e.target.matches('input[type="search"], input[type="text"], textarea')) return
    const k = e.key.toLowerCase()
    if (k === 'z' || k === 'x') {
      octave = Math.min(2, Math.max(-2, octave + (k === 'x' ? 1 : -1)))
      onOctave?.(octave)
      return
    }
    if (!(k in KEYMAP) || sounding.has(k)) return
    const midi = LOW + 12 * octave + KEYMAP[k]
    sounding.set(k, midi)
    on(midi, 0.8)
  })
  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase()
    if (!sounding.has(k)) return
    off(sounding.get(k))
    sounding.delete(k)
  })
  window.addEventListener('blur', () => {
    for (const midi of sounding.values()) off(midi)
    sounding.clear()
  })
}

export async function connectMidi({ on, off, sustain, status }) {
  if (!navigator.requestMIDIAccess) {
    status('This browser has no Web MIDI. Try Chrome, Edge or Firefox.', false)
    return
  }
  let access
  try {
    access = await navigator.requestMIDIAccess()
  } catch {
    status('MIDI access was blocked. Allow it in the site settings and try again.', false)
    return
  }
  const handle = ({ data }) => {
    const type = data[0] & 0xf0
    if (type === 0x90 && data[2] > 0) on(data[1], data[2] / 127)
    else if (type === 0x80 || type === 0x90) off(data[1])
    else if (type === 0xb0 && data[1] === 64) sustain(data[2] >= 64)
  }
  const hook = () => {
    const names = []
    for (const input of access.inputs.values()) {
      input.onmidimessage = handle
      names.push(input.name)
    }
    status(names.length ? names.join(', ') : 'No MIDI keyboard found. Plug one in and it will appear.', names.length > 0)
  }
  access.onstatechange = hook
  hook()
}
