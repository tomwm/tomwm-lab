// The listening point: how it moves across the isobars, and the five control
// outputs it reads from them.

import { shapeAt, moveKm, LINE } from './field.js'

const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
const norm = (x, y) => {
  const m = Math.hypot(x, y)
  return m > 1e-9 ? [x / m, y / m] : [0, 0]
}

export const MODES = [
  { id: 'drift', label: 'Drift', hint: 'Carried along the isobars by the wind they make, while the weather systems’ own eastward drift carries it across the chart. Faster where the lines are packed.' },
  { id: 'ride', label: 'Ride a line', hint: 'Follows one isobar, so pressure holds steady while the curve changes.' },
  { id: 'route', label: 'Route', hint: 'Draw a path on the map; the point loops along it.' },
  { id: 'drag', label: 'Drag', hint: 'Move the point by hand.' },
  { id: 'timelapse', label: 'Time-lapse', hint: 'The point stays put and the next two days of isobars sweep past it.' },
]

export const OUTPUTS = [
  { id: 'pressure', label: 'Pressure', kind: 'smooth' },
  { id: 'gradient', label: 'Gradient', kind: 'smooth' },
  { id: 'crossing', label: 'Crossing', kind: 'pulse' },
  { id: 'curve', label: 'Curve', kind: 'smooth' },
  { id: 'stave', label: 'Stave note', kind: 'stepped' },
]

// Speed knob (0-100) to map travel, or to forecast hours per second in time-lapse
export const kmPerSecond = (k) => 5 * 2 ** ((k / 100) * 6) // 5 to 320 km/s
export const hoursPerSecond = (k) => 0.25 * 2 ** ((k / 100) * 6) // 0.25 to 16 h/s

const kmBetween = (a, b) => {
  const x = (b.lon - a.lon) * 111.3 * Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180)
  const y = (b.lat - a.lat) * 110.57
  return Math.hypot(x, y)
}

// Move the point for dt seconds. m: { point, mode, speed, dir, rideP, route, routeAt }
export function advance(m, g, dt) {
  const s = shapeAt(g, m.point.lat, m.point.lon)
  const km = kmPerSecond(m.speed) * dt
  if (m.mode === 'drift') {
    // Geostrophic wind runs along the isobars (low pressure on its left in the
    // north, right in the south). Weather systems themselves drift east in the
    // mid-latitudes, so add that steering too: it carries the point across the
    // chart instead of letting it circle a low for ever.
    const hemi = m.point.lat >= 0 ? 1 : -1
    const [gx, gy] = norm(s.dx, s.dy)
    const steer = Math.abs(m.point.lat) > 25 ? 0.75 : -0.5 // easterlies in the tropics
    let [ex, ey] = norm(-gy * hemi + steer, gx * hemi)
    if (s.grad < 0.02) [ex, ey] = norm(m.dir[0] + steer * 0.2, m.dir[1]) // flat pressure: keep going
    m.dir = [ex, ey]
    const go = km * (0.3 + 0.7 * Math.min(1, s.grad / 1.5))
    m.point = moveKm(g.region, m.point, ex * go, ey * go)
  } else if (m.mode === 'ride') {
    let [tx, ty] = norm(-s.dy, s.dx)
    if (tx * m.dir[0] + ty * m.dir[1] < 0) [tx, ty] = [-tx, -ty] // keep heading the same way
    if (tx || ty) m.dir = [tx, ty]
    m.rideP ??= s.p
    // Steer back onto the chosen line
    const g1 = Math.max(1e-4, Math.hypot(s.dx, s.dy))
    const back = clamp((s.p - m.rideP) / g1, -60, 60)
    const [gx, gy] = norm(s.dx, s.dy)
    m.point = moveKm(g.region, m.point, m.dir[0] * km - gx * back, m.dir[1] * km - gy * back)
  } else if (m.mode === 'route' && m.route.length > 1) {
    let left = km
    for (let guard = 0; guard < 50 && left > 0; guard++) {
      const i = Math.floor(m.routeAt) % m.route.length
      const a = m.route[i], b = m.route[(i + 1) % m.route.length]
      const seg = Math.max(1, kmBetween(a, b))
      const f = m.routeAt - Math.floor(m.routeAt)
      const room = seg * (1 - f)
      if (left < room) {
        m.routeAt += left / seg
        left = 0
      } else {
        m.routeAt = Math.floor(m.routeAt) + 1
        left -= room
      }
    }
    m.routeAt %= m.route.length
    const i = Math.floor(m.routeAt), f = m.routeAt - i
    const a = m.route[i], b = m.route[(i + 1) % m.route.length]
    m.point = { lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f }
  }
  return s
}

// The pentatonic steps a run of isobars climbs, as semitones, counted from the
// isobar nearest the middle of the chart (so a deep low doesn't sit at the floor)
const PENT = [0, 2, 4, 7, 9]
export function staveSemitones(p, ref) {
  const L = Math.round((p - ref) / LINE)
  return clamp(12 * Math.floor(L / 5) + PENT[((L % 5) + 5) % 5], -12, 12)
}

// The smooth and stepped outputs, each -1 to 1 (gradient 0 to 1)
export function readOutputs(g, s) {
  const mid = (g.max + g.min) / 2
  const half = Math.max(4, (g.max - g.min) / 2)
  const semis = staveSemitones(s.p, Math.round(mid / LINE) * LINE)
  return {
    pressure: clamp((s.p - mid) / half, -1, 1),
    gradient: clamp(s.grad / 1.5, 0, 1),
    curve: clamp(-s.lap / 0.4, -1, 1), // round a low is negative (tense), round a high positive (open)
    stave: semis / 12,
    semis,
    line: Math.floor(s.p / LINE),
  }
}
