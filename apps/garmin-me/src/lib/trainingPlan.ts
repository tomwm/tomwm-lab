/**
 * Your day-by-day training plan (e.g. a marathon plan), read from CSV files
 * exported from Numbers into the private folder:
 *   private/<trainingPlanFolder>/Daily Sessions-Table 1.csv   one row per day (required)
 *   private/<trainingPlanFolder>/Weekly Plan-Table 1.csv      one row per week (optional)
 *   private/<trainingPlanFolder>/Overview-Table 1.csv         rules and notes (optional)
 * Re-export over the same files to update it.
 */
import 'server-only'
import { join } from 'node:path'
import { getProfile } from './ai/profile'
import { csvObjects, parseCsv } from './csv'
import type { Dataset } from './data'
import { addDays, mondayOf } from './dates'
import { allRaw } from './garmin/db'
import type { Activity } from './garmin/normalize'
import { actsIn } from './metrics'
import { planWeek } from './plan'
import { readPrivate } from './private'

export type PlannedActivity = { activity: string; minutes: number }
export type PlannedDay = {
  date: string
  week: number
  day: string
  phase: string
  /** Main activity (morning), or null for a rest day. */
  main: PlannedActivity | null
  runMinutes: number
  /** The plan's own estimate (at its assumed easy pace). */
  estKm: number
  intensity: string
  /** Strength plan session name (e.g. "Upper A"), or null. */
  weights: (PlannedActivity & { session: string }) | null
  optional: PlannedActivity | null
  notes: string
  raceDay: boolean
}
export type PlannedWeek = {
  week: number
  start: string
  phase: string
  runMinutes: number
  estKm: number
  gymSessions: number
  runNote: string
  crossNote: string
}
export type TrainingPlan = { days: Map<string, PlannedDay>; weeks: PlannedWeek[]; overview: string[]; source: string }

const num = (v: string | undefined) => {
  const n = Number((v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

let cache: { key: string; plan: TrainingPlan | null } | null = null

export function getTrainingPlan(): TrainingPlan | null {
  const folder = getProfile().trainingPlanFolder
  if (!folder) return null
  const dailyText = readPrivate(join(folder, 'Daily Sessions-Table 1.csv'))
  if (!dailyText) return null
  const weeklyText = readPrivate(join(folder, 'Weekly Plan-Table 1.csv')) ?? ''
  const overviewText = readPrivate(join(folder, 'Overview-Table 1.csv')) ?? ''
  const key = `${folder}|${dailyText.length}|${weeklyText.length}|${overviewText.length}|${dailyText.slice(-200)}`
  if (cache?.key === key) return cache.plan

  const days = new Map<string, PlannedDay>()
  for (const r of csvObjects(dailyText)) {
    const date = r['Date']
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
    const mainAct = r['Morning activity'] || 'Rest'
    const mainMin = num(r['Morning minutes'])
    const raceDay = /marathon|race/i.test(mainAct) && !/run$/i.test(mainAct)
    const weights = r['Evening weights'] || 'Rest'
    const wMin = num(r['Weights minutes'])
    const opt = r['Optional aerobic']
    // Zero minutes means "not scheduled yet" in this plan (e.g. Thursday runs before week 6).
    days.set(date, {
      date,
      week: num(r['Week']),
      day: r['Day'],
      phase: r['Phase'],
      main: mainAct !== 'Rest' && (mainMin > 0 || raceDay) ? { activity: mainAct, minutes: mainMin } : null,
      runMinutes: num(r['Run minutes']),
      estKm: num(r['Estimated run km']),
      intensity: r['Intensity / structure'],
      weights: weights !== 'Rest' && wMin > 0 ? { activity: 'Weights', session: weights, minutes: wMin } : null,
      optional: opt && num(r['Optional minutes']) > 0 ? { activity: opt, minutes: num(r['Optional minutes']) } : null,
      notes: r['Notes'],
      raceDay,
    })
  }
  const weeks: PlannedWeek[] = csvObjects(weeklyText)
    .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r['Week beginning']))
    .map((r) => ({
      week: num(r['Week']),
      start: r['Week beginning'],
      phase: r['Phase'],
      runMinutes: num(r['Total run min']),
      estKm: num(r['Estimated run km']),
      gymSessions: num(r['Gym sessions']),
      runNote: r['Run note'],
      crossNote: r['Cross-training note'],
    }))
  // Overview: "label | value" lines, skipping the title and blanks.
  const overview = parseCsv(overviewText)
    .map((r) => r.map((c) => c.trim()).filter(Boolean))
    .filter((r) => r.length)
    .slice(1)
    .map((r) => r.join(': '))
  const plan = days.size ? { days, weeks, overview, source: folder } : null
  cache = { key, plan }
  return plan
}

/** Human-readable description of a planned day, e.g. "Easy run 25 min (Z1–2) + Lower A 60 min". */
export function describeDay(d: PlannedDay): string {
  const parts: string[] = []
  if (d.main) parts.push(`${d.main.activity}${d.main.minutes ? ` ${d.main.minutes} min` : ''}${d.intensity ? ` (${d.intensity})` : ''}${d.runMinutes && d.estKm ? `, plan estimate ${d.estKm} km` : ''}`)
  if (d.weights) parts.push(`${d.weights.session} ${d.weights.minutes} min`)
  if (d.optional) parts.push(`optional ${d.optional.activity} ${d.optional.minutes} min`)
  if (d.notes) parts.push(d.notes)
  return parts.length ? parts.join(' + ') : 'Rest'
}

// ---------------------------------------------------------------- heart rate zones

/** Garmin's zones as "Z1 106–131 bpm, …", preferring the running set. */
export function hrZonesText(): string | null {
  const row = allRaw('zones')[0]
  if (!row) return null
  const sets = JSON.parse(row.json) as Record<string, number | string>[]
  const z = sets.find((x) => x.sport === 'RUNNING') ?? sets.find((x) => x.sport === 'DEFAULT') ?? sets[0]
  if (!z) return null
  const f = [1, 2, 3, 4, 5].map((i) => Number(z[`zone${i}Floor`]))
  const max = Number(z.maxHeartRateUsed)
  if (f.some((v) => !Number.isFinite(v))) return null
  return f.map((lo, i) => `Z${i + 1} ${lo}–${i < 4 ? f[i + 1] - 1 : Number.isFinite(max) ? max : ''} bpm`).join(', ') + ` (Garmin ${String(z.sport).toLowerCase()} zones)`
}

// ---------------------------------------------------------------- planned vs done

export type ItemKind = 'run' | 'swim' | 'elliptical' | 'stepper' | 'weights' | 'race' | 'other'
export type DayItem = {
  label: string
  kind: ItemKind
  minutes: number
  optional: boolean
  /** true done, false missed, null still to come. */
  done: boolean | null
  /** For weights sessions done on a different day than planned. */
  doneOn?: string
}
export type DayVsPlan = {
  date: string
  planned: PlannedDay | null
  items: DayItem[]
  /** What Garmin recorded that day. */
  actual: Activity[]
  /** Matched strength plan session for a strength activity that day, if any. */
  strengthMatch: Record<number, string>
}
export type WeekVsPlan = {
  weekStart: string
  week: PlannedWeek | null
  phase: string | null
  days: DayVsPlan[]
  totals: {
    plannedRunMin: number
    plannedRunMinToDate: number
    actualRunMin: number
    actualRunKm: number
    plannedGym: number
    actualGym: number
    plannedCrossMin: number
    actualCrossMin: number
  }
}

export function kindOfPlanned(activity: string): ItemKind {
  const a = activity.toLowerCase()
  if (/marathon|race/.test(a) && !/run$/.test(a)) return 'race'
  if (a.includes('run')) return 'run'
  if (a.includes('swim')) return 'swim'
  if (a.includes('elliptical')) return 'elliptical'
  if (a.includes('stepper') || a.includes('stair')) return 'stepper'
  if (a.includes('weight') || a.includes('gym')) return 'weights'
  return 'other'
}

export function kindOfActivity(a: Activity): ItemKind {
  const t = a.typeKey.toLowerCase()
  if (a.sport === 'running') return 'run'
  if (a.sport === 'swimming') return 'swim'
  if (a.sport === 'strength') return 'weights'
  if (t.includes('elliptical')) return 'elliptical'
  if (t.includes('stair') || t.includes('stepper')) return 'stepper'
  return 'other'
}

export function weekVsPlan(data: Dataset, plan: TrainingPlan, anyDay: string, today: string): WeekVsPlan {
  const weekStart = mondayOf(anyDay)
  const strength = planWeek(data, weekStart)
  const strengthMatch: Record<number, string> = {}
  for (const s of strength.sessions) if (s.done) strengthMatch[s.done.activityId] = s.session.name
  const days: DayVsPlan[] = []
  const t = { plannedRunMin: 0, plannedRunMinToDate: 0, actualRunMin: 0, actualRunKm: 0, plannedGym: 0, actualGym: 0, plannedCrossMin: 0, actualCrossMin: 0 }
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i)
    const planned = plan.days.get(date) ?? null
    const actual = actsIn(data, date, date).sort((a, b) => (a.startLocal < b.startLocal ? -1 : 1))
    const kinds = new Set(actual.map(kindOfActivity))
    const past = date <= today
    const items: DayItem[] = []
    const add = (p: PlannedActivity, label: string, optional: boolean) => {
      const kind = kindOfPlanned(p.activity)
      if (kind === 'weights') {
        // Weights sessions move around the week: use the weekly strength matching.
        const m = strength.sessions.find((x) => x.session.name === label)?.done
        items.push({ label, kind, minutes: p.minutes, optional, done: m ? true : date < today ? false : null, doneOn: m && m.date !== date ? m.date : undefined })
        return
      }
      // Today counts as done only once it has happened; otherwise it's still to do.
      const done = kinds.has(kind === 'race' ? 'run' : kind) ? true : date < today ? false : null
      items.push({ label, kind, minutes: p.minutes, optional, done })
    }
    if (planned?.main) add(planned.main, planned.main.activity, false)
    if (planned?.weights) add(planned.weights, planned.weights.session, false)
    if (planned?.optional) add(planned.optional, planned.optional.activity, true)
    if (planned) {
      t.plannedRunMin += planned.runMinutes
      if (past) t.plannedRunMinToDate += planned.runMinutes
      if (planned.weights) t.plannedGym++
      for (const p of [planned.main, planned.optional]) if (p && ['swim', 'elliptical', 'stepper'].includes(kindOfPlanned(p.activity)) && !(p === planned.optional)) t.plannedCrossMin += p.minutes
    }
    for (const a of actual) {
      const k = kindOfActivity(a)
      if (k === 'run') {
        t.actualRunMin += (a.movingH ?? a.durationH) * 60
        t.actualRunKm += a.distanceKm ?? 0
      } else if (k === 'weights') t.actualGym++
      else if (k === 'swim' || k === 'elliptical' || k === 'stepper') t.actualCrossMin += a.durationH * 60
    }
    days.push({ date, planned, items, actual, strengthMatch })
  }
  const week = plan.weeks.find((w) => w.start === weekStart) ?? null
  return { weekStart, week, phase: week?.phase ?? days.find((d) => d.planned)?.planned?.phase ?? null, days, totals: t }
}

/** Runs only: planned minutes vs actual, for several past weeks. */
export function runHistory(data: Dataset, plan: TrainingPlan, today: string, weeks: number) {
  const out: { weekStart: string; plannedMin: number; actualMin: number; actualKm: number; gymPlanned: number; gymDone: number }[] = []
  const first = [...plan.days.keys()].sort()[0]
  for (let i = weeks; i >= 1; i--) {
    const ws = addDays(mondayOf(today), -7 * i)
    if (addDays(ws, 6) < first) continue
    const w = weekVsPlan(data, plan, ws, today)
    out.push({ weekStart: w.weekStart, plannedMin: w.totals.plannedRunMin, actualMin: Math.round(w.totals.actualRunMin), actualKm: w.totals.actualRunKm, gymPlanned: w.totals.plannedGym, gymDone: w.totals.actualGym })
  }
  return out
}
