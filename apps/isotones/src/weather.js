// Fetches open weather data from Open-Meteo (no key needed) and turns it into
// normalised 0..1 readings the synth can use.

const HOURLY = [
  'temperature_2m', 'relative_humidity_2m', 'dew_point_2m', 'precipitation',
  'snowfall', 'cloud_cover', 'pressure_msl', 'wind_speed_10m',
  'wind_direction_10m', 'wind_gusts_10m', 'visibility', 'cape', 'weather_code',
  'cloud_cover_low', 'cloud_cover_mid', 'cloud_cover_high',
]

export const PAST_DAYS = 30
export const FUTURE_HOURS = 48

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Weather service returned ${res.status}`)
  return res.json()
}

export async function searchPlaces(name) {
  const q = new URLSearchParams({ name, count: '6', language: 'en', format: 'json' })
  const data = await getJson(`https://geocoding-api.open-meteo.com/v1/search?${q}`)
  return (data.results || []).map((r) => ({
    name: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
    lat: r.latitude,
    lon: r.longitude,
  }))
}

export async function fetchWeather({ lat, lon }) {
  const common = {
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
    past_days: String(PAST_DAYS),
    forecast_days: '3',
    timeformat: 'unixtime',
    timezone: 'auto',
  }
  const wq = new URLSearchParams({ ...common, hourly: HOURLY.join(','), wind_speed_unit: 'ms' })
  const aq = new URLSearchParams({ ...common, hourly: 'pm2_5' })
  const mq = new URLSearchParams({ ...common, hourly: 'wave_height,wave_period' })
  const [w, a, m] = await Promise.all([
    getJson(`https://api.open-meteo.com/v1/forecast?${wq}`),
    // Air quality and waves are nice-to-haves: carry on without them if they fail.
    getJson(`https://air-quality-api.open-meteo.com/v1/air-quality?${aq}`).catch(() => null),
    getJson(`https://marine-api.open-meteo.com/v1/marine?${mq}`).catch(() => null),
  ])
  // Inland, the wave service answers with nothing but blanks.
  const sea = m?.hourly?.wave_height?.some((v) => v != null)
  const now = Date.now() / 1000
  const h = w.hourly
  return {
    lat, lon,
    utcOffset: w.utc_offset_seconds || 0,
    fetchedAt: now,
    times: h.time,
    hourly: h,
    air: a ? { times: a.hourly.time, pm25: a.hourly.pm2_5 } : null,
    sea: sea ? { times: m.hourly.time, height: m.hourly.wave_height, period: m.hourly.wave_period } : null,
    elevation: w.elevation ?? 0,
    // What "low" and "high" mean at this place, from the last 30 days.
    range: {
      temp: range(h.temperature_2m, h.time, now),
      pressure: range(h.pressure_msl, h.time, now),
      humidity: range(h.relative_humidity_2m, h.time, now),
      wind: range(h.wind_speed_10m, h.time, now),
      gust: range(h.wind_gusts_10m, h.time, now),
    },
  }
}

// 5th and 95th percentile of the observed (past) values.
function range(series, times, now) {
  const vals = []
  for (let i = 0; i < series.length; i++) {
    if (times[i] <= now && series[i] != null) vals.push(series[i])
  }
  vals.sort((x, y) => x - y)
  if (!vals.length) return { lo: 0, hi: 1 }
  const pick = (p) => vals[Math.min(vals.length - 1, Math.floor(p * vals.length))]
  return { lo: pick(0.05), hi: pick(0.95) }
}

function locate(times, t) {
  const i = clamp(Math.floor((t - times[0]) / 3600), 0, times.length - 2)
  return { i, f: clamp((t - times[i]) / 3600) }
}

function at(series, times, t) {
  const { i, f } = locate(times, t)
  const a = series[i], b = series[i + 1]
  if (a == null) return b ?? null
  if (b == null) return a
  return a + (b - a) * f
}

function angleAt(series, times, t) {
  const { i, f } = locate(times, t)
  const a = series[i], b = series[i + 1]
  if (a == null || b == null) return a ?? b ?? 0
  const d = ((b - a + 540) % 360) - 180
  return (a + d * f + 360) % 360
}

const norm = (v, r, minSpan = 1e-6) => clamp((v - r.lo) / Math.max(r.hi - r.lo, minSpan))

// Sun elevation in degrees (low-precision astronomical formula, good to ~1°).
export function sunElevation(tSec, lat, lon) {
  const rad = Math.PI / 180
  const d = tSec / 86400 - 10957.5 // days since J2000
  const g = (357.529 + 0.98560028 * d) * rad
  const L = (280.459 + 0.98564736 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad
  const e = (23.439 - 0.00000036 * d) * rad
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L))
  const dec = Math.asin(Math.sin(e) * Math.sin(L))
  const gmst = (18.697374558 + 24.06570982441908 * d) % 24
  const ha = (gmst * 15 + lon) * rad - ra
  const la = lat * rad
  return Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(ha)) / rad
}

// What kind of precipitation the hour's weather code describes, if any.
function rainKind(code) {
  if (code === 96 || code === 99) return 'hail'
  if (code === 56 || code === 57 || code === 66 || code === 67) return 'freezing'
  if (code >= 51 && code <= 55) return 'drizzle'
  if (code >= 61 && code <= 65) return 'rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if ((code >= 80 && code <= 82) || code === 95) return 'showers'
  return null
}
const KIND_LEVEL = { drizzle: 0.3, snow: 0.3, rain: 0.5, freezing: 0.65, showers: 0.8, hail: 1 }

const MOON_NAMES = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous',
  'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent']

// Moon phase from the date alone: 0 = new, 0.5 = full.
export function moon(tSec) {
  const phase = (((tSec - 947182440) / 86400 / 29.530588853) % 1 + 1) % 1
  return {
    phase,
    illum: (1 - Math.cos(2 * Math.PI * phase)) / 2,
    name: MOON_NAMES[Math.round(phase * 8) % 8],
  }
}

// The weather at time t (unix seconds), interpolated between hourly readings.
// Each reading has v (the real value) and n (0..1, how the synth sees it).
export function sample(data, t) {
  const h = data.hourly, T = data.times
  const get = (k) => at(h[k], T, t)

  const temp = get('temperature_2m')
  const dew = get('dew_point_2m')
  const pressure = get('pressure_msl')
  const trend = pressure - at(h.pressure_msl, T, t - 3 * 3600) // hPa over 3h
  const cloud = get('cloud_cover') ?? 0
  const wind = get('wind_speed_10m') ?? 0
  const gust = Math.max(get('wind_gusts_10m') ?? wind, wind)
  const precip = get('precipitation') ?? 0
  const snow = get('snowfall') ?? 0
  const humidity = get('relative_humidity_2m') ?? 50
  const vis = get('visibility')
  const elev = sunElevation(t, data.lat, data.lon)
  const pm = data.air ? at(data.air.pm25, data.air.times, t) : null

  const code = h.weather_code[clamp(Math.round((t - T[0]) / 3600), 0, T.length - 1)] ?? 0
  const kind = rainKind(code)
  const cape = get('cape') ?? 0
  const thunder = code >= 95
  const low = get('cloud_cover_low') ?? 0
  const mid = get('cloud_cover_mid') ?? 0
  const high = get('cloud_cover_high') ?? 0
  const waveH = data.sea ? at(data.sea.height, data.sea.times, t) : null
  const waveP = data.sea ? at(data.sea.period, data.sea.times, t) : null
  const lunar = moon(t)

  const spread = temp - dew
  const visFog = vis == null ? 0 : clamp(1 - Math.log10(Math.max(vis, 200) / 200) / Math.log10(120))
  const spreadFog = clamp(1 - spread / 5) * 0.6

  return {
    t,
    temp: { v: temp, n: norm(temp, data.range.temp, 4) },
    pressure: { v: pressure, n: norm(pressure, data.range.pressure, 8), trend },
    cloud: { v: cloud, n: clamp(cloud / 100), oktas: Math.round(cloud / 12.5) },
    wind: {
      v: wind,
      n: clamp(wind / Math.max(data.range.wind.hi, 8)),
      dir: angleAt(h.wind_direction_10m, T, t),
    },
    gust: {
      v: gust,
      n: clamp(gust / Math.max(data.range.gust.hi, 12)),
      // How much stronger the gusts are than the steady wind.
      gustiness: clamp((gust / Math.max(wind, 0.5) - 1) / 1.5),
    },
    rain: {
      v: precip,
      n: precip < 0.05 ? 0 : clamp(Math.log1p(precip * 4) / Math.log1p(32)),
      snow: snow > 0.02,
      snowV: snow,
    },
    humidity: { v: humidity, n: norm(humidity, data.range.humidity, 15) },
    fog: { vis, spread, n: Math.max(visFog, spreadFog) },
    sun: { elev, n: clamp((elev + 18) / 78) },
    air: { v: pm, n: pm == null ? 0 : clamp(pm / 35) },
    // Echo: swell at sea; on land, mountains and clear far-seeing air.
    waves: waveH != null
      ? { sea: true, height: waveH, period: waveP, n: clamp(waveH / 4) }
      : { sea: false, alt: data.elevation, vis, n: Math.max(clamp(data.elevation / 2500), clamp((vis ?? 0) / 40000) * 0.6) },
    storm: { cape, thunder, n: Math.max(clamp(cape / 1500), thunder ? 0.8 : 0) },
    character: { kind, n: kind ? KIND_LEVEL[kind] : 0 },
    layers: { low, mid, high, n: Math.max(low, mid, high) / 100 },
    moon: { ...lunar, n: lunar.illum },
  }
}
