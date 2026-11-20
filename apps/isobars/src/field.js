// The pressure field: sea-level pressure on a grid around a place, for the
// next two days, from Open-Meteo. Gives pressure, its gradient and its
// curvature anywhere in the region, at any time in the forecast.

export const STEP = 3 // degrees between grid points
export const LAT_SPAN = 30 // degrees of latitude shown
export const LON_SPAN = 60 // degrees of longitude shown
export const LINE = 4 // hPa between isobars, as on a weather chart
const KM_PER_DEG_LAT = 110.57

const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
const wrapLon = (lon) => ((((lon + 180) % 360) + 360) % 360) - 180

// A box around the place, snapped to the grid so nearby places share data
export function regionAround(place) {
  const lat0 = clamp(Math.round((place.lat - LAT_SPAN / 2) / STEP) * STEP, -84, 84 - LAT_SPAN)
  const lon0 = Math.round((place.lon - LON_SPAN / 2) / STEP) * STEP
  return {
    lat0, lat1: lat0 + LAT_SPAN, lon0, lon1: lon0 + LON_SPAN,
    nx: LON_SPAN / STEP + 1, ny: LAT_SPAN / STEP + 1,
    key: `${lat0},${lon0}`,
  }
}

export async function fetchField(region) {
  const cacheKey = `isobars:field:${region.key}`
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey))
    if (cached && Date.now() - cached.fetchedAt < 55 * 60 * 1000) return cached
  } catch {}
  const lats = [], lons = []
  for (let j = 0; j < region.ny; j++) {
    for (let i = 0; i < region.nx; i++) {
      lats.push(region.lat0 + j * STEP)
      lons.push(wrapLon(region.lon0 + i * STEP))
    }
  }
  const q = new URLSearchParams({
    latitude: lats.join(','), longitude: lons.join(','),
    hourly: 'pressure_msl', forecast_days: '2', timeformat: 'unixtime', cell_selection: 'nearest',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`)
  if (!res.ok) throw new Error(`Pressure service returned ${res.status}`)
  const list = await res.json()
  const times = list[0].hourly.time
  // values[hour][j * nx + i]
  const values = times.map((_, h) => list.map((loc) => loc.hourly.pressure_msl[h] ?? 1013))
  const field = { region, times, values, fetchedAt: Date.now() }
  try {
    localStorage.setItem(cacheKey, JSON.stringify(field))
  } catch {}
  return field
}

// The grid at time t (unix seconds), blended between hourly readings.
export function gridAt(field, t) {
  const { times, values } = field
  const h = clamp((t - times[0]) / 3600, 0, times.length - 1.001)
  const i = Math.floor(h), f = h - i
  const a = values[i], b = values[i + 1]
  const out = new Float64Array(a.length)
  let min = Infinity, max = -Infinity
  for (let k = 0; k < a.length; k++) {
    out[k] = a[k] + (b[k] - a[k]) * f
    min = Math.min(min, out[k])
    max = Math.max(max, out[k])
  }
  return { region: field.region, p: out, min, max, t }
}

// Pressure at a point, by bilinear interpolation.
export function pressureAt(g, lat, lon) {
  const { region: r, p } = g
  const x = clamp((lon - r.lon0) / STEP, 0, r.nx - 1.0001)
  const y = clamp((lat - r.lat0) / STEP, 0, r.ny - 1.0001)
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j
  const at = (ii, jj) => p[jj * r.nx + ii]
  return (at(i, j) * (1 - fx) + at(i + 1, j) * fx) * (1 - fy) + (at(i, j + 1) * (1 - fx) + at(i + 1, j + 1) * fx) * fy
}

// Gradient (hPa per km, east and north) and curvature (hPa per 100 km squared)
export function shapeAt(g, lat, lon) {
  const d = 0.75 // degrees
  const kmLon = KM_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180) * 1.007
  const pE = pressureAt(g, lat, lon + d), pW = pressureAt(g, lat, lon - d)
  const pN = pressureAt(g, lat + d, lon), pS = pressureAt(g, lat - d, lon)
  const p = pressureAt(g, lat, lon)
  const dx = (pE - pW) / (2 * d * kmLon)
  const dy = (pN - pS) / (2 * d * KM_PER_DEG_LAT)
  const hx = (d * kmLon) / 100, hy = (d * KM_PER_DEG_LAT) / 100
  const lap = (pE + pW - 2 * p) / (hx * hx) + (pN + pS - 2 * p) / (hy * hy)
  return { p, dx, dy, grad: Math.hypot(dx, dy) * 100, lap } // grad in hPa per 100 km
}

// Move a point by (east, north) km, wrapped to stay inside the region.
export function moveKm(region, pt, east, north) {
  let lat = pt.lat + north / KM_PER_DEG_LAT
  let lon = pt.lon + east / (KM_PER_DEG_LAT * 1.007 * Math.cos((pt.lat * Math.PI) / 180))
  const m = STEP * 0.5
  const w = region.lon1 - region.lon0 - 2 * m, h = region.lat1 - region.lat0 - 2 * m
  if (lon < region.lon0 + m) lon += w
  if (lon > region.lon1 - m) lon -= w
  if (lat < region.lat0 + m) lat += h
  if (lat > region.lat1 - m) lat -= h
  return { lat, lon }
}

// Highs and lows: grid points more extreme than all their neighbours
export function extremes(g) {
  const { region: r, p } = g
  const out = []
  for (let j = 1; j < r.ny - 1; j++) {
    for (let i = 1; i < r.nx - 1; i++) {
      const v = p[j * r.nx + i]
      let low = true, high = true
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          if (!di && !dj) continue
          const n = p[(j + dj) * r.nx + i + di]
          if (n <= v) low = false
          if (n >= v) high = false
        }
      }
      if (low || high) out.push({ type: low ? 'L' : 'H', lat: r.lat0 + j * STEP, lon: r.lon0 + i * STEP, p: v })
    }
  }
  return out
}
