/**
 * Your strength programme (kept privately, outside the repo), and which of
 * its sessions are done in a given week.
 *
 * Garmin only sometimes records the exercises in a strength session and never
 * says which plan session it was, so matching is a best guess: the muscles the
 * identified exercises work tell upper from lower, and quads from posterior
 * chain; the rest is decided by the plan's order. The UI says which.
 */
import 'server-only'
import type { Dataset } from './data'
import { addDays, mondayOf } from './dates'
import type { Activity } from './garmin/normalize'
import { actsIn } from './metrics'
import { targetOf, type Muscle } from './muscles'
import { readPrivateJson } from './private'

export type PlanExercise = { name: string; sets: string; reps: string }
export type PlanSession = {
  key: 'upperA' | 'lowerA' | 'upperB' | 'lowerB'
  name: string
  /** Scheduled weekday, 1 = Monday. Sessions can move. */
  day: number
  emphasis: string
  kind: 'upper' | 'lower'
  /** Can be dropped during higher-volume running phases. */
  optional?: string
  exercises: PlanExercise[]
}

/** Your plan, from private/strength-plan.json (see src/lib/private.ts). Empty if there isn't one. */
export function getStrengthPlan(): PlanSession[] {
  return readPrivateJson<PlanSession[]>('strength-plan.json', [])
}

export const WEEKDAY = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const UPPER = new Set<Muscle>(['chest', 'shoulders', 'biceps', 'triceps', 'forearms', 'upperBack', 'traps'])
const QUADS = new Set<Muscle>(['quads'])
const POSTERIOR = new Set<Muscle>(['hamstrings', 'glutes', 'lowerBack'])

/** What a strength session's identified exercises say about it. */
function classify(a: Activity): { kind: 'upper' | 'lower' | null; lowerFocus: 'quads' | 'posterior' | null } {
  let upper = 0
  let lower = 0
  let quads = 0
  let posterior = 0
  for (const e of a.exercises) {
    const t = targetOf(e)
    if (!t || e.sets <= 0) continue
    for (const m of t.main) {
      if (UPPER.has(m)) upper += e.sets
      else if (m !== 'abs') lower += e.sets
      if (QUADS.has(m)) quads += e.sets
      if (POSTERIOR.has(m)) posterior += e.sets
    }
  }
  // Too few identified sets to tell (the watch often saves a session as one long set).
  if (upper + lower < 3) return { kind: null, lowerFocus: null }
  return { kind: upper >= lower ? 'upper' : 'lower', lowerFocus: lower ? (quads >= posterior ? 'quads' : 'posterior') : null }
}

export type SessionStatus = {
  session: PlanSession
  /** The strength activity counted as this session, if any. */
  done: { date: string; activityId: number; how: 'exercises' | 'order' } | null
}
export type WeekStatus = {
  weekStart: string
  sessions: SessionStatus[]
  /** Strength sessions beyond the four, or that couldn't be placed. */
  extra: Activity[]
  /** Next plan session not yet done, in plan order. */
  next: PlanSession | null
}

export function planWeek(data: Dataset, anyDayInWeek: string): WeekStatus {
  const PLAN = getStrengthPlan()
  const weekStart = mondayOf(anyDayInWeek)
  const strength = actsIn(data, weekStart, addDays(weekStart, 6), (a) => a.sport === 'strength').sort((a, b) => (a.startLocal < b.startLocal ? -1 : 1))
  const sessions: SessionStatus[] = PLAN.map((session) => ({ session, done: null }))
  const extra: Activity[] = []
  const free = (pred: (s: PlanSession) => boolean) => sessions.find((s) => !s.done && pred(s.session))
  for (const a of strength) {
    const c = classify(a)
    let slot: SessionStatus | undefined
    let how: 'exercises' | 'order' = 'exercises'
    if (c.kind === 'upper') slot = free((s) => s.kind === 'upper')
    else if (c.kind === 'lower') {
      const want = c.lowerFocus === 'posterior' ? 'lowerB' : 'lowerA'
      slot = free((s) => s.key === want) ?? free((s) => s.kind === 'lower')
    }
    if (!slot) {
      how = 'order'
      slot = c.kind ? undefined : free(() => true)
    }
    if (slot) slot.done = { date: a.date, activityId: a.id, how }
    else extra.push(a)
  }
  return { weekStart, sessions, extra, next: sessions.find((s) => !s.done)?.session ?? null }
}

export const planText = (s: PlanSession) =>
  `${s.name} (${s.emphasis}, usually ${WEEKDAY[s.day]}${s.optional ? `; ${s.optional}` : ''}): ${s.exercises.map((e) => `${e.name} ${e.sets}x${e.reps}`).join('; ')}`
