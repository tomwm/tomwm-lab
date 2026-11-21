// Front-panel knobs and switches, built from a list of sections. Shared by the
// patchable synths. A control is { id, label, def, min?, format? } for a knob
// (0 to 1, or -1 to 1 with min: -1) or { id, label, type: 'switch', options }.

import { createKnob } from '../../isobeats/src/knob.js'

export function buildControls(root, sections, values, onChange) {
  const knobs = {}
  const switches = {}

  const showSwitch = (id) => {
    for (const b of switches[id].children) b.setAttribute('aria-pressed', String(b.dataset.value === values()[id]))
  }

  for (const s of sections) {
    const card = document.createElement('section')
    card.className = `section sec-${s.id}`
    card.innerHTML = `<h2>${s.title}</h2><div class="ctls"></div>`
    const ctls = card.querySelector('.ctls')
    for (const c of s.controls) {
      const wrap = document.createElement('div')
      const label = document.createElement('span')
      label.className = 'ctl-label'
      label.textContent = c.label
      if (c.type === 'switch') {
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
            onChange(c.id, value)
            showSwitch(c.id)
          })
          seg.append(b)
        }
        switches[c.id] = seg
        wrap.append(seg, label)
      } else {
        wrap.className = 'ctl'
        const k = createKnob({
          label: c.label,
          min: c.min ?? 0,
          max: 1,
          step: 0.005,
          value: values()[c.id],
          defaultValue: c.def,
          format: c.format,
          onInput: (v) => onChange(c.id, v),
        })
        if ((c.min ?? 0) < 0) k.classList.add('bipolar')
        knobs[c.id] = k
        wrap.append(k, label)
      }
      ctls.append(wrap)
    }
    root.append(card)
  }
  for (const id in switches) showSwitch(id)

  // Show new values (after a preset or reset)
  return {
    show() {
      for (const id in knobs) knobs[id].setValue(values()[id])
      for (const id in switches) showSwitch(id)
    },
  }
}
