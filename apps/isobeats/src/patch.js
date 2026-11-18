// Turns a weather sample plus the player's depth faders into settings for a
// two-oscillator percussion voice and its generative layers. Pure functions.

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const pct = (x) => `${Math.round(x * 100)}%`
const MPH = 2.23694
const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
const compass = (deg) => COMPASS[Math.round(deg / 45) % 8]

export const ROWS = ['Voice', 'Groove', 'Space and drama']
export const ROW_SHORT = ['Voice', 'Groove', 'Space']
export const ROW_COLOURS = ['#ffd166', '#7ee0a3', '#c49bff']

export const MODULES = [
  { id: 'temp', row: 0, label: 'Temperature', drives: 'Metal or wood' },
  { id: 'pressure', row: 0, label: 'Pressure', drives: 'Pitch drop (kick weight)' },
  { id: 'humidity', row: 0, label: 'Humidity', drives: 'Decay length' },
  { id: 'sun', row: 0, label: 'Sun', drives: 'Brightness and bite' },
  { id: 'air', row: 0, label: 'Air quality', drives: 'Grit' },
  { id: 'wind', row: 1, label: 'Wind', drives: 'Tempo' },
  { id: 'gust', row: 1, label: 'Gusts', drives: 'Accents, rolls and swing' },
  { id: 'cloud', row: 1, label: 'Cloud cover', drives: 'Filter and ghost notes' },
  { id: 'rain', row: 1, label: 'Rain and snow', drives: 'Hi-hat layer' },
  { id: 'moon', row: 1, label: 'Moon', drives: 'Quiet steps' },
  { id: 'fog', row: 2, label: 'Fog', drives: 'Soft attack and chorus' },
  { id: 'waves', row: 2, label: 'Waves or open air', drives: 'Dub delay' },
  { id: 'storm', row: 2, label: 'Storm energy', drives: 'Drive, fills and thunder' },
  { id: 'character', row: 2, label: 'Rain character', drives: 'Hat style' },
  { id: 'layers', row: 2, label: 'Cloud layers', drives: 'Three-band tone' },
]

export const DEFAULT_DEPTHS = Object.fromEntries(MODULES.map((m) => [m.id, 1]))

// k hits spread as evenly as possible over n steps.
export function euclid(k, n = 8) {
  return Array.from({ length: n }, (_, i) => (i * k) % n < k)
}

// The hat layer's style comes from the kind of rain. Probabilities are per 16th.
//   tick: noise hit (freq = brightness, decay in seconds); thud: low hits on
//   these steps of 8; ping: glassy chime; bursts: comes and goes
const HATS = {
  drizzle: { name: 'fine closed hats', tick: { prob: 0.8, freq: 9000, decay: 0.014, level: 0.4 } },
  rain: { name: 'steady hats', tick: { prob: 0.6, freq: 7000, decay: 0.025, level: 0.5 }, thud: [4] },
  showers: { name: 'hat bursts and claps', tick: { prob: 0.85, freq: 6000, decay: 0.03, level: 0.55 }, thud: [2, 6], bursts: true },
  hail: { name: 'hard rimshots', tick: { prob: 0.55, freq: 3200, decay: 0.008, level: 0.9 }, thud: [3, 7] },
  freezing: { name: 'icy pings', tick: { prob: 0.45, freq: 8000, decay: 0.018, level: 0.4 }, ping: 0.35 },
  snow: { name: 'soft brushes', tick: { prob: 0.35, freq: 2200, decay: 0.08, level: 0.35 } },
}

// The synth settings each module produces, so split rows can be merged.
const OWNS = {
  temp: ['osc1Wave', 'osc2Ratio', 'osc2Level', 'fmIndex'],
  pressure: ['dropSemis', 'pitchDecay', 'tension'],
  humidity: ['decay', 'reverbWet', 'reverbSize'],
  sun: ['tiltDb', 'punch', 'nightDrive'],
  air: ['crushWet', 'crushSteps'],
  wind: ['bpm'],
  gust: ['accentProb', 'ratchetProb', 'swing'],
  cloud: ['cutoff', 'filterEnv', 'filterQ', 'ghost', 'ghostLevel'],
  rain: ['hatLevel', 'hatProb'],
  moon: ['quietProb'],
  fog: ['attack', 'chorusWet', 'noiseLevel'],
  waves: ['delayTime', 'delayWet', 'delayFeedback'],
  storm: ['driveWet', 'fillProb', 'thunderRate', 'thunderLevel'],
  character: ['hats', 'hatExtras'],
  layers: ['lowDb', 'midDb', 'highDb'],
}
const ROW_OF = {}
for (const m of MODULES) for (const key of OWNS[m.id]) ROW_OF[key] = m.row

// Dub delay: a dotted eighth at the current tempo
const echoEvery = (bpm) => (0.75 * 60) / bpm
const echoText = (n, t) => `Echo ${pct(n)}, dotted eighth (${t.toFixed(2)}s)`

export function computePatch(w, d) {
  const warm = w.temp.n
  const press = w.pressure.n
  const wind = w.wind.n
  const tension = d.pressure * clamp(-w.pressure.trend / 4)
  const dark = smooth(6, -12, w.sun.elev)
  const sunny = smooth(0, 35, w.sun.elev) * (1 - 0.85 * w.cloud.n)
  const night = d.sun * dark
  const raining = w.rain.n > 0
  // Tempo only follows the wind as far as its fader allows; at zero it is 110
  const bpm = Math.round(110 + d.wind * (wind * 80 - 40))
  const kind = w.character.kind ?? (raining ? 'rain' : null)
  const hats = kind ? HATS[kind] : null
  const cold = d.temp * (1 - warm)

  const p = {
    // Temperature: cold is clanky metal (square, inharmonic FM); warm is round wood
    osc1Wave: cold > 0.4 ? 'square' : 'triangle',
    osc2Ratio: 1.5 + cold * 1.26 + tension * 0.4,
    osc2Level: 0.3 + cold * 0.3,
    fmIndex: 0.3 + cold * 3.2 + tension * 2.5,
    // Pressure: high pressure is a deep, long pitch drop (a heavy kick)
    dropSemis: 12 + d.pressure * (press * 26 - 6),
    pitchDecay: 0.045 + d.pressure * press * 0.11,
    tension,
    // Humidity: dry air is tight clicks, humid air rings and booms
    decay: 0.2 + d.humidity * (w.humidity.n * 0.42 - 0.1),
    reverbWet: d.humidity * w.humidity.n * 0.3,
    reverbSize: w.humidity.n,
    // Sun: daylight is punchy and bright; night is darker and dirtier
    tiltDb: d.sun * sunny * 6 - night * 6,
    punch: 1 + d.sun * sunny * 0.35,
    nightDrive: night * 0.3,
    // Air quality: dirty air crushes the signal
    crushWet: d.air * w.air.n * 0.8,
    crushSteps: Math.round(24 - w.air.n * 20),
    bpm,
    // Gusts: accents, rolls (ratchets) and loose timing
    accentProb: d.gust * w.gust.n * 0.45,
    ratchetProb: d.gust * (0.02 + w.gust.gustiness * 0.1),
    swing: d.gust * w.gust.gustiness * 0.15,
    // Cloud: overcast closes the filter and fills rests with ghost notes
    cutoff: 14000 * Math.pow(900 / 14000, d.cloud * w.cloud.n),
    filterEnv: 3.5 * (1 - 0.55 * d.cloud * w.cloud.n),
    filterQ: 1 + d.cloud * w.cloud.n * 4,
    ghost: euclid(Math.round(w.cloud.oktas / 2)), // at most 4 in 8, so rests stay rests
    ghostLevel: d.cloud * 0.3,
    // Rain: a hi-hat layer, denser the harder it falls
    hatLevel: raining ? d.rain * (0.3 + 0.7 * w.rain.n) * 0.5 : 0,
    hatProb: 0.35 + 0.65 * w.rain.n,
    // Moon: quiet steps (velocity under half) play less as the moon wanes
    quietProb: 1 - d.moon * (1 - w.moon.illum) * 0.85,
    // Fog: soft attacks, chorus, and a breathy noise layer in the voice
    attack: 0.001 + d.fog * w.fog.n * 0.025,
    chorusWet: d.fog * w.fog.n * 0.45,
    noiseLevel: 0.12 + d.fog * w.fog.n * 0.25,
    // Waves (or mountains and clear air on land): dub delay
    delayTime: echoEvery(bpm),
    delayWet: d.waves * w.waves.n * 0.4,
    delayFeedback: 0.3 + w.waves.n * 0.4,
    // Storm energy: drive, end-of-phrase fills, and thunder when it breaks
    driveWet: clamp(d.storm * w.storm.n * 0.8 + night * 0.25),
    fillProb: d.storm * clamp(w.storm.n * 0.9 + (w.storm.thunder ? 0.3 : 0)),
    thunderRate: w.storm.thunder ? 0.1 : w.storm.n > 0.5 ? 0.03 : 0,
    thunderLevel: d.storm * (0.4 + 0.6 * w.storm.n),
    // Rain character: the hat layer's style and its extra hits
    hats,
    hatExtras: d.character * 0.8,
    // Cloud layers: low cloud thins the bass, mid scoops the middle, high dulls the top
    lowDb: -d.layers * (w.layers.low / 100) * 6,
    midDb: -d.layers * (w.layers.mid / 100) * 5,
    highDb: -d.layers * (w.layers.high / 100) * 6,
  }

  const trend = w.pressure.trend
  const arrow = trend > 0.5 ? '↑' : trend < -0.5 ? '↓' : '→'
  const phase = w.sun.elev > 30 ? 'High sun' : w.sun.elev > 6 ? 'Low sun' : w.sun.elev > -6 ? 'Twilight' : 'Night'
  p.readings = {
    temp: `${w.temp.v.toFixed(1)} °C`,
    pressure: `${Math.round(w.pressure.v)} hPa ${arrow}`,
    humidity: `${Math.round(w.humidity.v)}%`,
    sun: `${phase} · ${Math.round(w.sun.elev)}°`,
    air: w.air.v == null ? 'No data' : `PM2.5 ${Math.round(w.air.v)} µg/m³`,
    wind: `${Math.round(w.wind.v * MPH)} mph from ${compass(w.wind.dir)}`,
    gust: `${Math.round(w.gust.v * MPH)} mph`,
    cloud: `${Math.round(w.cloud.v)}% · ${w.cloud.oktas} oktas`,
    rain: w.rain.snow ? `Snow ${w.rain.snowV.toFixed(1)} cm/h` : raining ? `${w.rain.v.toFixed(1)} mm/h` : 'Dry',
    moon: `${w.moon.name} · ${pct(w.moon.illum)}`,
    fog: w.fog.vis == null ? `Dew gap ${w.fog.spread.toFixed(1)}°`
      : `Visibility ${(w.fog.vis / 1000).toFixed(w.fog.vis < 10000 ? 1 : 0)} km`,
    waves: w.waves.sea ? `Waves ${w.waves.height.toFixed(1)} m · ${Math.round(w.waves.period ?? 0)} s`
      : `${Math.round(w.waves.alt)} m up · ${w.waves.vis == null ? 'no view data' : 'clear to ' + Math.round(w.waves.vis / 1000) + ' km'}`,
    storm: w.storm.thunder ? 'Thunderstorm' : `CAPE ${Math.round(w.storm.cape)} J/kg`,
    character: w.character.kind ? w.character.kind[0].toUpperCase() + w.character.kind.slice(1) : 'Dry',
    layers: `L ${Math.round(w.layers.low)} · M ${Math.round(w.layers.mid)} · H ${Math.round(w.layers.high)}%`,
  }
  const hz = (f) => (f >= 1000 ? (f / 1000).toFixed(1) + ' kHz' : Math.round(f) + ' Hz')
  p.effects = {
    temp: cold > 0.4 ? `Metallic: FM ${p.fmIndex.toFixed(1)}` : `Woody: FM ${p.fmIndex.toFixed(1)}`,
    pressure: tension > 0.15 ? `Drop ${Math.round(p.dropSemis)} st, falling: tense`
      : `Drop ${Math.round(p.dropSemis)} semitones over ${Math.round(p.pitchDecay * 1000)} ms`,
    humidity: `Decay ${Math.round(p.decay * 1000)} ms, room ${pct(p.reverbWet / 0.3)}`,
    sun: night > 0.3 ? 'Dark and dirty' : p.punch > 1.1 ? `Punchy and bright` : 'Neutral',
    air: w.air.v == null ? 'Clean signal' : `Crush ${pct(w.air.n)}`,
    wind: `${bpm} bpm`,
    gust: `Accents ${pct(p.accentProb / 0.45)}, rolls ${pct(p.ratchetProb / 0.12)}, swing ${pct(p.swing / 0.15)}`,
    cloud: `Filter ${hz(p.cutoff)}, ${p.ghost.filter(Boolean).length} ghost notes in 8`,
    rain: raining ? `Hats at ${pct(p.hatProb)} density` : 'Silent until it rains',
    moon: `Quiet steps play ${pct(p.quietProb)} of the time`,
    fog: `Attack ${Math.round(p.attack * 1000)} ms, chorus ${pct(w.fog.n)}`,
    waves: echoText(w.waves.n, p.delayTime),
    storm: w.storm.thunder ? 'Drive, fills and thunder' : p.fillProb > 0.05 ? `Drive ${pct(p.driveWet)}, fills ${pct(p.fillProb)}` : 'Calm: no fills',
    character: hats ? `Hats play as ${hats.name}` : 'Waits for rain',
    layers: `Bass ${p.lowDb.toFixed(0)} dB, mids ${p.midDb.toFixed(0)} dB, top ${p.highDb.toFixed(0)} dB`,
  }
  p.values = {
    temp: warm, pressure: press, humidity: w.humidity.n, sun: w.sun.n, air: w.air.n,
    wind, gust: w.gust.n, cloud: w.cloud.n, rain: w.rain.n, moon: w.moon.n,
    fog: w.fog.n, waves: w.waves.n, storm: w.storm.n, character: w.character.n, layers: w.layers.n,
  }
  return p
}

// Combine one patch per row into the patch the engine plays.
export function mergePatches([p0, p1, p2]) {
  const rows = [p0, p1, p2]
  if (p0 === p1 && p1 === p2) return p0
  const out = { readings: {}, effects: {}, values: {} }
  for (const key of Object.keys(p0)) {
    if (key in out) continue
    if (!(key in ROW_OF)) console.warn(`Isobeats: no row owns the setting "${key}"`)
    out[key] = rows[ROW_OF[key] ?? 0][key]
  }
  for (const m of MODULES) {
    for (const group of ['readings', 'effects', 'values']) out[group][m.id] = rows[m.row][group][m.id]
  }
  // One tempo: the echo follows the Groove row's wind
  out.delayTime = echoEvery(out.bpm)
  out.effects.waves = echoText(out.values.waves, out.delayTime)
  return out
}
