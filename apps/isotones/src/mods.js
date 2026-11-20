// What Isobars can modulate in Isotones and Isobeats, and how. Shared by all
// three apps so they agree on names. An offset runs from -1 to 1; each
// destination turns it into a change on top of the weather's own setting.

const clamp = (x, a, b) => Math.min(b, Math.max(a, x))

export const DESTS = {
  isotones: [
    { id: 'filter', label: 'Filter', apply: (p, o) => ({ cutoff: clamp(p.cutoff * 2 ** (o * 3), 120, 18000) }) },
    { id: 'reverb', label: 'Reverb', apply: (p, o) => ({ reverbWet: clamp(p.reverbWet + o * 0.5, 0, 0.9) }) },
    { id: 'bright', label: 'Brightness', apply: (p, o) => ({ tiltDb: clamp(p.tiltDb + o * 8, -12, 12) }) },
    { id: 'arp', label: 'Arpeggio', apply: (p, o) => ({ arpLevel: clamp(p.arpLevel + o * 0.36, 0, 0.45) }) },
    { id: 'echo', label: 'Echo', apply: (p, o) => ({ delayWet: clamp(p.delayWet + o * 0.45, 0, 0.7) }) },
    { id: 'drive', label: 'Drive', apply: (p, o) => ({ driveWet: clamp(p.driveWet + o * 0.7, 0, 1) }) },
  ],
  isobeats: [
    { id: 'filter', label: 'Filter', apply: (p, o) => ({ cutoff: clamp(p.cutoff * 2 ** (o * 3), 200, 18000) }) },
    { id: 'decay', label: 'Decay', apply: (p, o) => ({ decay: clamp(p.decay * 2 ** (o * 1.5), 0.04, 1.2) }) },
    { id: 'drop', label: 'Pitch drop', apply: (p, o) => ({ dropSemis: clamp(p.dropSemis + o * 18, 0, 40) }) },
    { id: 'fm', label: 'FM', apply: (p, o) => ({ fmIndex: clamp(p.fmIndex + o * 3, 0, 7) }) },
    { id: 'rolls', label: 'Rolls', apply: (p, o) => ({ ratchetProb: clamp(p.ratchetProb + o * 0.35, 0, 0.5) }) },
    { id: 'echo', label: 'Echo', apply: (p, o) => ({ delayWet: clamp(p.delayWet + o * 0.45, 0, 0.7) }) },
    // Transpose is handled by the engine (it shifts the pattern, like a MIDI key)
    { id: 'transpose', label: 'Transpose', apply: () => ({}), semitones: (o) => Math.round(o * 12) },
  ],
}

export const ALL_DESTS = Object.entries(DESTS).flatMap(([app, list]) => list.map((d) => ({ app, ...d })))

// Apply one app's offsets ({ destId: offset }) to its weather patch.
export function applyMods(app, patch, offsets) {
  if (!offsets) return patch
  let out = patch
  for (const d of DESTS[app]) {
    const o = offsets[d.id]
    if (o) out = { ...out, ...d.apply(out, o) }
  }
  return out
}

// Labels of the destinations currently being moved, for status lines
export function modLabels(app, offsets) {
  if (!offsets) return []
  return DESTS[app].filter((d) => d.id in offsets).map((d) => d.label)
}
