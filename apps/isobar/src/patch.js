// Turns a weather sample plus the player's depth faders into concrete synth
// settings. Pure functions only: no audio, no DOM.

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const pct = (x) => `${Math.round(x * 100)}%`
const MPH = 2.23694
const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
const compass = (deg) => COMPASS[Math.round(deg / 45) % 8]

export const ROWS = ['Tone and space', 'Movement and rhythm', 'Colour and drama']
export const ROW_SHORT = ['Tone', 'Movement', 'Colour']
export const ROW_COLOURS = ['#f0a35e', '#6fb6ff', '#d98be0']

export const MODULES = [
  { id: 'temp', row: 0, label: 'Temperature', drives: 'Oscillator tone' },
  { id: 'pressure', row: 0, label: 'Pressure', drives: 'Sub, drone and stability' },
  { id: 'humidity', row: 0, label: 'Humidity', drives: 'Reverb' },
  { id: 'air', row: 0, label: 'Air quality', drives: 'Grit' },
  { id: 'sun', row: 0, label: 'Sun', drives: 'Harmony and mood' },
  { id: 'cloud', row: 1, label: 'Cloud cover', drives: 'Filter and rain pattern' },
  { id: 'wind', row: 1, label: 'Wind', drives: 'Clock, tremolo and arpeggio' },
  { id: 'gust', row: 1, label: 'Gusts', drives: 'Accents and swing' },
  { id: 'rain', row: 1, label: 'Rain and snow', drives: 'Droplets' },
  { id: 'fog', row: 1, label: 'Fog', drives: 'Blur and chorus' },
  { id: 'waves', row: 2, label: 'Waves or open air', drives: 'Echo' },
  { id: 'storm', row: 2, label: 'Storm energy', drives: 'Distortion and thunder' },
  { id: 'character', row: 2, label: 'Rain character', drives: 'Percussion' },
  { id: 'layers', row: 2, label: 'Cloud layers', drives: 'Three-band tone' },
  { id: 'moon', row: 2, label: 'Moon', drives: 'Night mood and shimmer' },
]

// The synth settings each module produces. When the rows are in different
// places, each setting is taken from its module's row.
const OWNS = {
  temp: ['triLevel', 'sawLevel', 'glassLevel', 'fmIndex', 'sawDetune'],
  pressure: ['subLevel', 'driftCents', 'droneLevel', 'tension'],
  cloud: ['cutoff', 'filterQ', 'pattern'],
  wind: ['bpm', 'tremRate', 'tremDepth', 'pan', 'autopanDepth', 'autopanRate', 'arpLevel'],
  gust: ['gustRate', 'gustCents', 'gustNoise', 'swing'],
  rain: ['rainLevel', 'rainProb', 'snow'],
  humidity: ['reverbWet', 'reverbSize', 'release'],
  fog: ['chorusWet', 'attack'],
  sun: ['harmony', 'harmLevel', 'fmRatio', 'tiltDb'],
  air: ['crushWet', 'crushSteps'],
  waves: ['delayTime', 'delayWet', 'delayFeedback'],
  storm: ['driveWet', 'rumble', 'thunderRate', 'thunderLevel'],
  character: ['perc', 'percLevel'],
  layers: ['lowDb', 'midDb', 'highDb'],
  moon: ['moonLevel'],
}
const ROW_OF = {}
for (const m of MODULES) for (const key of OWNS[m.id]) ROW_OF[key] = m.row

const echoEvery = (bpm) => (3 * 60) / bpm / 4
const echoText = (n, delayTime) => `Echo ${pct(n)}, every ${delayTime.toFixed(2)}s (wind's clock)`

// Combine one patch per row into the patch the engine plays.
export function mergePatches([p0, p1, p2]) {
  const rows = [p0, p1, p2]
  if (p0 === p1 && p1 === p2) return p0
  const out = { readings: {}, effects: {}, values: {} }
  for (const key of Object.keys(p0)) {
    if (key in out) continue
    if (!(key in ROW_OF)) console.warn(`Isobar: no row owns the setting "${key}"`)
    out[key] = rows[ROW_OF[key] ?? 0][key]
  }
  for (const m of MODULES) {
    for (const group of ['readings', 'effects', 'values']) out[group][m.id] = rows[m.row][group][m.id]
  }
  // Everything keeps one tempo: the echo follows the Movement row's wind
  out.delayTime = echoEvery(out.bpm)
  out.effects.waves = echoText(out.values.waves, out.delayTime)
  return out
}

// How each kind of rain plays as percussion. Probabilities are per clock step.
//   tick: short noise hit (freq = how bright, decay in seconds)
//   thud: low drum on these steps of 8; ping: glassy chime; bursts: comes and goes
const PERCUSSION = {
  drizzle: { name: 'fine hi-hat wash', tick: { prob: 0.75, freq: 8000, decay: 0.018, level: 0.35 } },
  rain: { name: 'ticks and a soft thud', tick: { prob: 0.5, freq: 5500, decay: 0.03, level: 0.5 }, thud: [0] },
  showers: { name: 'bursts with a drum pattern', tick: { prob: 0.85, freq: 5000, decay: 0.035, level: 0.6 }, thud: [0, 3, 6], bursts: true },
  hail: { name: 'hard clicks', tick: { prob: 0.6, freq: 2800, decay: 0.009, level: 1 }, thud: [0, 5] },
  freezing: { name: 'icy pings', tick: { prob: 0.4, freq: 7000, decay: 0.02, level: 0.4 }, ping: 0.35 },
  snow: { name: 'soft brushes', tick: { prob: 0.3, freq: 1800, decay: 0.09, level: 0.3 } },
}

export const DEFAULT_DEPTHS = Object.fromEntries(MODULES.map((m) => [m.id, 1]))

// k hits spread as evenly as possible over n steps.
export function euclid(k, n = 8) {
  return Array.from({ length: n }, (_, i) => (i * k) % n < k)
}

function harmonyFor(elev) {
  if (elev > 30) return { phase: 'High sun', intervals: [7, 12], name: 'fifth and octave' }
  if (elev > 6) return { phase: 'Low sun', intervals: [7], name: 'fifth' }
  // Only octaves and fifths: they thicken a chord without changing whether
  // it is major or minor. Mood comes from the timbre instead.
  if (elev > -6) return { phase: 'Twilight', intervals: [12], name: 'octave' }
  return { phase: 'Night', intervals: [-12], name: 'low octave' }
}

export function computePatch(w, d) {
  const warm = w.temp.n
  const press = w.pressure.n
  const wind = w.wind.n
  const tension = d.pressure * clamp(-w.pressure.trend / 4)
  const harmony = harmonyFor(w.sun.elev)
  const raining = w.rain.n > 0
  // Mood: night turns the tone dark and uneasy, direct sunshine makes it bright.
  // A bright moon takes the edge off the dark.
  const dark = smooth(6, -12, w.sun.elev)
  const night = d.sun * dark * (1 - 0.7 * d.moon * w.moon.illum)
  const perc = PERCUSSION[w.character.kind] ?? null
  const sunny = d.sun * smooth(0, 35, w.sun.elev) * (1 - 0.85 * w.cloud.n)
  const bpm = Math.round(64 + wind * 96)
  // Settled weather (high pressure, little wind) holds a drone.
  const settled = press * (1 - wind)
  const hits = raining ? Math.max(1, w.cloud.oktas) : w.cloud.oktas

  const p = {
    // Temperature: cold is glassy FM, warm is detuned saws.
    triLevel: 0.5 * (1 - 0.6 * d.temp),
    sawLevel: d.temp * warm * 0.34,
    glassLevel: d.temp * (1 - warm) * 0.32 + night * 0.08,
    fmIndex: Math.max(d.temp * (1 - warm) * 3, night * 1.5),
    sawDetune: 7 + d.temp * warm * 6 + tension * 16 + night * 9,
    // Pressure: high is a solid sub, low drifts out of tune; falling adds tension.
    subLevel: d.pressure * press * 0.4,
    driftCents: d.pressure * (1 - press) * 11 * (1 + tension),
    droneLevel: d.pressure * smooth(0.2, 0.55, settled) * 0.3,
    tension,
    // Cloud: overcast closes the filter. Oktas set the rain's 8-step pattern.
    cutoff: 18000 * Math.pow(750 / 18000, d.cloud * w.cloud.n),
    filterQ: 0.7 + d.cloud * w.cloud.n * 2,
    pattern: euclid(hits),
    // Wind: sets the clock everything rhythmic runs from.
    bpm,
    tremRate: 0.4 + wind * 7,
    tremDepth: d.wind * wind * 0.42,
    pan: d.wind * Math.sin((w.wind.dir * Math.PI) / 180) * 0.5,
    autopanDepth: d.wind * wind * 0.35,
    autopanRate: 0.05 + wind * 0.4,
    arpLevel: d.wind * smooth(0.3, 0.65, wind) * 0.36,
    // Gusts: random bursts that open the filter and throw the clock off-grid.
    gustRate: 0.04 + w.gust.n * 0.5,
    gustCents: d.gust * 3000 * (0.4 + 0.6 * w.gust.n),
    gustNoise: d.gust * w.gust.n * 0.22,
    swing: d.gust * w.gust.gustiness * 0.3,
    // Rain: droplets on the cloud pattern, at the wind's tempo.
    rainLevel: raining ? d.rain * (0.25 + 0.75 * w.rain.n) * 0.5 : 0,
    rainProb: 0.3 + 0.7 * w.rain.n,
    snow: w.rain.snow,
    // Humidity: wetter air, longer and louder reverb.
    reverbWet: d.humidity * w.humidity.n * 0.65,
    reverbSize: w.humidity.n,
    release: 0.25 + d.humidity * w.humidity.n * 1.2,
    // Fog: smears attacks and adds chorus.
    chorusWet: d.fog * w.fog.n * 0.55,
    attack: 0.008 + d.fog * w.fog.n * 0.26,
    // Sun: picks the harmony interval added to every note.
    harmony: harmony.intervals,
    harmLevel: d.sun * 0.25,
    // By day the bell partials are in tune (sweet); at night they go clangorous.
    fmRatio: 2 + night * 1.53,
    // Tilts the top end: up in sunshine, down after dark.
    tiltDb: sunny * 6 - night * 6,
    // Air quality: dirty air crushes the signal.
    crushWet: d.air * w.air.n * 0.8,
    crushSteps: Math.round(24 - w.air.n * 20),
    // Waves (or mountains and clear air on land): echo, timed to the wind's clock.
    delayTime: echoEvery(bpm),
    delayWet: d.waves * w.waves.n * 0.42,
    delayFeedback: 0.25 + w.waves.n * 0.35,
    // Storm energy: overdrive, a low rumble, and thunder when it breaks.
    driveWet: d.storm * w.storm.n * 0.8,
    rumble: d.storm * w.storm.n * 0.3,
    thunderRate: w.storm.thunder ? 0.12 : w.storm.n > 0.5 ? 0.04 : 0,
    thunderLevel: d.storm * (0.4 + 0.6 * w.storm.n),
    // Rain character: the kind of rain picks a percussion style.
    perc,
    percLevel: perc ? d.character * 0.4 : 0,
    // Cloud layers: low cloud thins the bass, mid scoops the middle, high dulls the top.
    lowDb: -d.layers * (w.layers.low / 100) * 6,
    midDb: -d.layers * (w.layers.mid / 100) * 5,
    highDb: -d.layers * (w.layers.high / 100) * 6,
    // Moon: a silvery top octave on moonlit nights.
    moonLevel: d.moon * w.moon.illum * dark * 0.12,
  }

  const dir = compass(w.wind.dir)
  const trend = w.pressure.trend
  const arrow = trend > 0.5 ? '↑' : trend < -0.5 ? '↓' : '→'
  p.readings = {
    temp: `${w.temp.v.toFixed(1)} °C`,
    pressure: `${Math.round(w.pressure.v)} hPa ${arrow}`,
    cloud: `${Math.round(w.cloud.v)}% · ${w.cloud.oktas} oktas`,
    wind: `${Math.round(w.wind.v * MPH)} mph from ${dir}`,
    gust: `${Math.round(w.gust.v * MPH)} mph`,
    rain: w.rain.snow ? `Snow ${w.rain.snowV.toFixed(1)} cm/h`
      : raining ? `${w.rain.v.toFixed(1)} mm/h` : 'Dry',
    humidity: `${Math.round(w.humidity.v)}%`,
    fog: w.fog.vis == null ? `Dew gap ${w.fog.spread.toFixed(1)}°`
      : `Visibility ${(w.fog.vis / 1000).toFixed(w.fog.vis < 10000 ? 1 : 0)} km`,
    sun: `${harmony.phase} · ${Math.round(w.sun.elev)}°`,
    air: w.air.v == null ? 'No data' : `PM2.5 ${Math.round(w.air.v)} µg/m³`,
    waves: w.waves.sea ? `Waves ${w.waves.height.toFixed(1)} m · ${Math.round(w.waves.period ?? 0)} s`
      : `${Math.round(w.waves.alt)} m up · ${w.waves.vis == null ? 'no view data' : 'clear to ' + Math.round(w.waves.vis / 1000) + ' km'}`,
    storm: w.storm.thunder ? 'Thunderstorm' : `CAPE ${Math.round(w.storm.cape)} J/kg`,
    character: w.character.kind ? w.character.kind[0].toUpperCase() + w.character.kind.slice(1) : 'Dry',
    layers: `L ${Math.round(w.layers.low)} · M ${Math.round(w.layers.mid)} · H ${Math.round(w.layers.high)}%`,
    moon: `${w.moon.name} · ${pct(w.moon.illum)}`,
  }
  p.effects = {
    temp: warm > 0.5 ? `Warm saws ${pct(warm)}` : `Cold glass ${pct(1 - warm)}`,
    pressure: p.droneLevel > 0.01 ? `Sub ${pct(press)}, drone on (calm)`
      : tension > 0.15 ? `Sub ${pct(press)}, falling: detuned`
      : `Sub ${pct(press)}, drift ${Math.round(p.driftCents)} cents`,
    cloud: `Filter ${p.cutoff >= 1000 ? (p.cutoff / 1000).toFixed(1) + ' kHz' : Math.round(p.cutoff) + ' Hz'}`,
    wind: p.arpLevel > 0.01 ? `${bpm} bpm, arpeggio on` : `${bpm} bpm, too calm to arpeggiate`,
    gust: `A gust every ${(1 / p.gustRate).toFixed(0)}s or so, swing ${pct(p.swing / 0.3)}`,
    rain: raining ? `${hits} in 8 pattern at ${bpm} bpm${p.snow ? ', soft' : ''}` : 'Silent until it rains',
    humidity: `Reverb ${pct(w.humidity.n)}, release ${p.release.toFixed(1)}s`,
    fog: `Attack ${Math.round(p.attack * 1000)} ms, chorus ${pct(w.fog.n)}`,
    sun: `${night > 0.3 ? 'Dark and uneasy' : sunny > 0.3 ? 'Bright' : sunny > 0.05 ? 'Hazy' : 'Neutral'}, adds a ${harmony.name}`,
    air: w.air.v == null ? 'Clean signal' : `Crush ${pct(w.air.n)}`,
    waves: echoText(w.waves.n, p.delayTime),
    storm: w.storm.thunder ? 'Overdrive, rumble and thunder' : w.storm.n > 0.05 ? `Overdrive ${pct(w.storm.n)}` : 'Calm: no distortion',
    character: perc ? `Adds ${perc.name}` : 'Silent until it rains',
    layers: `Bass ${p.lowDb.toFixed(0)} dB, mids ${p.midDb.toFixed(0)} dB, top ${p.highDb.toFixed(0)} dB`,
    moon: dark < 0.05 ? 'Waits for dark' : `Softens the night ${pct(0.7 * w.moon.illum)}, shimmer ${pct(w.moon.illum)}`,
  }
  p.values = {
    temp: warm, pressure: press, cloud: w.cloud.n, wind, gust: w.gust.n, rain: w.rain.n,
    humidity: w.humidity.n, fog: w.fog.n, sun: w.sun.n, air: w.air.n,
    waves: w.waves.n, storm: w.storm.n, character: w.character.n, layers: w.layers.n, moon: w.moon.n,
  }
  return p
}
