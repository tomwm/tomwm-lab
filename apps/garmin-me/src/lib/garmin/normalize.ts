/**
 * Raw Garmin JSON -> the app's own clean types. This is the only file that
 * knows Garmin's field names. Everything here is a Garmin-provided value with
 * units normalised (km, hours, sec/km); the one exception is `paceSecPerKm`,
 * which is calculated from distance and moving time.
 *
 * To add a metric: add a field to the type and one line to the mapper.
 */
type Raw = Record<string, any>

/** Changes whenever this module is reloaded, so cached normalised data is rebuilt after an edit here. */
export const NORMALIZER_STAMP = String(Date.now())

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const hours = (sec: unknown): number | null => {
  const n = num(sec)
  return n === null ? null : n / 3600
}

export type Sport = 'running' | 'strength' | 'cardio' | 'walking' | 'cycling' | 'swimming' | 'other'

export const SPORT_LABEL: Record<Sport, string> = {
  running: 'Running',
  strength: 'Strength',
  cardio: 'Cardio',
  walking: 'Walking & hiking',
  cycling: 'Cycling',
  swimming: 'Swimming',
  other: 'Other',
}
export const SPORTS = Object.keys(SPORT_LABEL) as Sport[]

export function sportOf(typeKey: string): Sport {
  const k = typeKey.toLowerCase()
  if (k.includes('running')) return 'running'
  if (k.includes('strength')) return 'strength'
  if (k.includes('cycling') || k.includes('biking')) return 'cycling'
  if (k.includes('swimming')) return 'swimming'
  if (k.includes('walking') || k.includes('hiking')) return 'walking'
  if (/elliptical|stair|rowing|cardio|hiit|fitness_equipment/.test(k)) return 'cardio'
  return 'other'
}

export type Activity = {
  id: number
  date: string // local calendar date
  startLocal: string // 'YYYY-MM-DD HH:mm:ss'
  name: string
  typeKey: string
  sport: Sport
  distanceKm: number | null
  durationH: number // elapsed timer duration
  movingH: number | null
  elevGainM: number | null
  avgHr: number | null
  maxHr: number | null
  calories: number | null
  /** Calculated: moving time / distance. */
  paceSecPerKm: number | null
  cadence: number | null
  /** Garmin's per-activity training load (EPOC-based). */
  trainingLoad: number | null
  aerobicTE: number | null
  /** Seconds in HR zones 1-5, as recorded by Garmin. */
  zonesSec: number[] | null
  location: string | null
}

export function normalizeActivity(a: Raw): Activity | null {
  const id = num(a.activityId)
  const start = typeof a.startTimeLocal === 'string' ? a.startTimeLocal : null
  if (id === null || !start) return null
  const typeKey = String(a.activityType?.typeKey ?? 'other')
  const distM = num(a.distance)
  const durS = num(a.duration) ?? 0
  const movS = num(a.movingDuration)
  const hasDistance = distM !== null && distM >= 100
  const zones = [1, 2, 3, 4, 5].map((z) => num(a[`hrTimeInZone_${z}`]))
  return {
    id,
    date: start.slice(0, 10),
    startLocal: start,
    name: String(a.activityName ?? typeKey),
    typeKey,
    sport: sportOf(typeKey),
    distanceKm: hasDistance ? distM / 1000 : null,
    durationH: durS / 3600,
    movingH: hours(movS),
    elevGainM: num(a.elevationGain),
    avgHr: num(a.averageHR),
    maxHr: num(a.maxHR),
    calories: num(a.calories),
    paceSecPerKm: hasDistance && (movS ?? durS) > 0 ? (movS ?? durS) / (distM / 1000) : null,
    cadence: num(a.averageRunningCadenceInStepsPerMinute),
    trainingLoad: num(a.activityTrainingLoad),
    aerobicTE: num(a.aerobicTrainingEffect),
    zonesSec: zones.some((z) => z !== null) ? zones.map((z) => z ?? 0) : null,
    location: typeof a.locationName === 'string' ? a.locationName : null,
  }
}

/** One calendar day of wellness data. Every field is null when Garmin has no record. */
export type Day = {
  date: string
  // daily summary
  steps: number | null
  stepGoal: number | null
  restingHr: number | null
  stressAvg: number | null
  bbHigh: number | null
  bbLow: number | null
  bbWake: number | null
  activeKcal: number | null
  intensityMod: number | null
  intensityVig: number | null
  spo2: number | null
  /** All distance on foot that day (walking, running, everything), km. */
  distanceKm: number | null
  /** Metres climbed that day, from the watch's barometer ("floors"). */
  climbM: number | null
  // sleep for the night ending this morning
  sleepH: number | null
  deepH: number | null
  lightH: number | null
  remH: number | null
  awakeH: number | null
  sleepScore: number | null
  sleepQuality: string | null
  // weigh-in (the day's latest reading)
  weightKg: number | null
  bodyFatPct: number | null
  muscleKg: number | null
  bmi: number | null
  // overnight HRV
  hrv: number | null
  hrvWeekly: number | null
  hrvStatus: string | null
  hrvBaseLow: number | null
  hrvBaseHigh: number | null
}

export function emptyDay(date: string): Day {
  return {
    date, steps: null, stepGoal: null, restingHr: null, stressAvg: null, bbHigh: null, bbLow: null,
    bbWake: null, activeKcal: null, intensityMod: null, intensityVig: null, spo2: null, distanceKm: null, climbM: null, sleepH: null,
    deepH: null, lightH: null, remH: null, awakeH: null, sleepScore: null, sleepQuality: null,
    weightKg: null, bodyFatPct: null, muscleKg: null, bmi: null,
    hrv: null, hrvWeekly: null, hrvStatus: null, hrvBaseLow: null, hrvBaseHigh: null,
  }
}

export function applySummary(d: Day, s: Raw | null) {
  if (!s) return
  d.steps = num(s.totalSteps)
  d.stepGoal = num(s.dailyStepGoal)
  d.restingHr = num(s.restingHeartRate)
  // Garmin uses negative values (-1, -2) for "not enough data".
  const stress = num(s.averageStressLevel)
  d.stressAvg = stress !== null && stress >= 0 ? stress : null
  d.bbHigh = num(s.bodyBatteryHighestValue)
  d.bbLow = num(s.bodyBatteryLowestValue)
  d.bbWake = num(s.bodyBatteryAtWakeTime)
  d.activeKcal = num(s.activeKilocalories)
  d.intensityMod = num(s.moderateIntensityMinutes)
  d.intensityVig = num(s.vigorousIntensityMinutes)
  d.spo2 = num(s.averageSpo2)
  const dist = num(s.totalDistanceMeters)
  d.distanceKm = dist === null ? null : dist / 1000
  d.climbM = num(s.floorsAscendedInMeters)
}

export function applySleep(d: Day, s: Raw | null) {
  // Garmin returns a record full of nulls for nights the watch wasn't worn.
  if (!s || !num(s.sleepTimeSeconds)) return
  d.sleepH = hours(s.sleepTimeSeconds)
  d.deepH = hours(s.deepSleepSeconds)
  d.lightH = hours(s.lightSleepSeconds)
  d.remH = hours(s.remSleepSeconds)
  d.awakeH = hours(s.awakeSleepSeconds)
  d.sleepScore = num(s.sleepScores?.overall?.value)
  d.sleepQuality = typeof s.sleepScores?.overall?.qualifierKey === 'string' ? s.sleepScores.overall.qualifierKey : null
}

export function applyHrv(d: Day, h: Raw | null) {
  if (!h) return
  d.hrv = num(h.lastNightAvg)
  d.hrvWeekly = num(h.weeklyAvg)
  d.hrvStatus = typeof h.status === 'string' ? h.status : null
  d.hrvBaseLow = num(h.baseline?.balancedLow)
  d.hrvBaseHigh = num(h.baseline?.balancedUpper)
}

export function applyWeight(d: Day, w: Raw | null) {
  const latest = w?.latestWeight
  if (!latest) return
  // Garmin stores mass in grams.
  const kg = (v: unknown) => {
    const n = num(v)
    return n === null || n <= 0 ? null : n / 1000
  }
  d.weightKg = kg(latest.weight)
  // A weigh-in typed in by hand has no body composition; Garmin sends 0, not null.
  const positive = (v: unknown) => {
    const n = num(v)
    return n === null || n <= 0 ? null : n
  }
  d.bodyFatPct = positive(latest.bodyFat)
  d.muscleKg = kg(latest.muscleMass)
  d.bmi = positive(latest.bmi)
}
