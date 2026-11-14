/**
 * Which muscles each Garmin exercise works. This mapping is this app's own
 * judgement, not Garmin data, so anything built from it is an estimate.
 *
 * Counting rule (agreed with Tom): every set counts in full towards an
 * exercise's main muscles and as half a set towards its helper muscles.
 * To support a new exercise, add a line to CATEGORY (or SUB for a variant).
 */
import type { Activity, Exercise } from './garmin/normalize'

export const MUSCLES = [
  'chest', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs',
  'upperBack', 'traps', 'lowerBack', 'glutes', 'quads', 'hamstrings', 'calves',
] as const
export type Muscle = (typeof MUSCLES)[number]

export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: 'Chest',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs & core',
  upperBack: 'Upper back & lats',
  traps: 'Traps',
  lowerBack: 'Lower back',
  glutes: 'Glutes',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
}

type Target = { main: Muscle[]; helpers?: Muscle[] }

const CATEGORY: Record<string, Target> = {
  BENCH_PRESS: { main: ['chest'], helpers: ['triceps', 'shoulders'] },
  PUSH_UP: { main: ['chest'], helpers: ['triceps', 'shoulders', 'abs'] },
  FLYE: { main: ['chest'], helpers: ['shoulders'] },
  SHOULDER_PRESS: { main: ['shoulders'], helpers: ['triceps', 'traps'] },
  LATERAL_RAISE: { main: ['shoulders'], helpers: ['traps'] },
  CURL: { main: ['biceps'], helpers: ['forearms'] },
  TRICEPS_EXTENSION: { main: ['triceps'] },
  ROW: { main: ['upperBack'], helpers: ['biceps', 'shoulders', 'forearms'] },
  PULL_UP: { main: ['upperBack'], helpers: ['biceps', 'forearms'] },
  SHRUG: { main: ['traps'], helpers: ['forearms'] },
  DEADLIFT: { main: ['glutes', 'hamstrings', 'lowerBack'], helpers: ['quads', 'traps', 'forearms'] },
  HYPEREXTENSION: { main: ['lowerBack'], helpers: ['glutes', 'hamstrings'] },
  SQUAT: { main: ['quads', 'glutes'], helpers: ['hamstrings', 'lowerBack'] },
  LUNGE: { main: ['quads', 'glutes'], helpers: ['hamstrings', 'calves'] },
  LEG_CURL: { main: ['hamstrings'] },
  CALF_RAISE: { main: ['calves'] },
  HIP_RAISE: { main: ['glutes'], helpers: ['hamstrings'] },
  OLYMPIC_LIFT: { main: ['quads', 'glutes', 'hamstrings'], helpers: ['traps', 'shoulders', 'calves'] },
  SIT_UP: { main: ['abs'] },
  CRUNCH: { main: ['abs'] },
  PLANK: { main: ['abs'], helpers: ['shoulders'] },
  CORE: { main: ['abs'] },
  LEG_RAISE: { main: ['abs'] },
  CHOP: { main: ['abs'], helpers: ['shoulders'] },
  CARRY: { main: ['forearms', 'traps'], helpers: ['abs'] },
  TOTAL_BODY: { main: ['quads', 'chest'], helpers: ['shoulders', 'abs'] },
}

/** Variants that work differently from their category. */
const SUB: Record<string, Target> = {
  BENCH_DIP: { main: ['triceps'], helpers: ['chest', 'shoulders'] },
  UPRIGHT_ROW: { main: ['shoulders', 'traps'], helpers: ['biceps'] },
  STRAIGHT_LEG_DEADLIFT: { main: ['hamstrings'], helpers: ['glutes', 'lowerBack'] },
  ROMANIAN_DEADLIFT: { main: ['hamstrings'], helpers: ['glutes', 'lowerBack'] },
  KETTLEBELL_SWING: { main: ['glutes', 'hamstrings'], helpers: ['lowerBack', 'shoulders'] },
  CHEST_PRESS_WITH_BAND: { main: ['chest'], helpers: ['triceps', 'shoulders'] },
}

export const targetOf = (e: Exercise): Target | null => (e.sub && SUB[e.sub]) || CATEGORY[e.category] || null

export type MuscleWork = {
  /** Weighted sets per muscle: main muscles count 1 per set, helpers 0.5. */
  sets: Record<Muscle, number>
  /** Sets the app could place on the body. */
  placed: number
  /** Sets the watch didn't identify, or with an exercise this app has no mapping for. */
  unplaced: number
}

export function muscleWork(activities: Activity[]): MuscleWork {
  const sets = Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>
  let placed = 0
  let unplaced = 0
  for (const a of activities) {
    for (const e of a.exercises) {
      const t = targetOf(e)
      if (!t) {
        unplaced += e.sets
        continue
      }
      placed += e.sets
      for (const m of t.main) sets[m] += e.sets
      for (const m of t.helpers ?? []) sets[m] += e.sets / 2
    }
  }
  return { sets, placed, unplaced }
}

const pretty = (key: string) => {
  const s = key.replace(/_/g, ' ').toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export type ExerciseRow = { name: string; main: string; sessions: number; sets: number; reps: number }

/** Exercises ranked by sets, with the muscle each mainly works. Unidentified sets are left out. */
export function topExercises(activities: Activity[], limit = 10): ExerciseRow[] {
  const rows = new Map<string, ExerciseRow & { ids: Set<number> }>()
  for (const a of activities) {
    for (const e of a.exercises) {
      const t = targetOf(e)
      if (!t) continue
      const name = pretty(e.sub ?? e.category)
      let r = rows.get(name)
      if (!r) rows.set(name, (r = { name, main: t.main.map((m) => MUSCLE_LABEL[m]).join(', '), sessions: 0, sets: 0, reps: 0, ids: new Set() }))
      r.ids.add(a.id)
      r.sets += e.sets
      r.reps += e.reps
    }
  }
  return [...rows.values()]
    .map(({ ids, ...r }) => ({ ...r, sessions: ids.size }))
    .sort((a, b) => b.sets - a.sets || b.reps - a.reps)
    .slice(0, limit)
}
