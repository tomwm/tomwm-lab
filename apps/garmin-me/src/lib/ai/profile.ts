/**
 * What the coach knows about you beyond the data: goals, equipment,
 * limitations and historical bests. Personal, so it lives outside the repo in
 * private/profile.json (see src/lib/private.ts) and is only ever sent to the
 * local model. Without that file the coach works from the data alone.
 */
import 'server-only'
import { readPrivateJson } from '../private'

export type Profile = {
  goals: string[]
  equipment: string[]
  limitations: string[]
  /** Historical bests, for context only: never used to prescribe working weights. */
  benchmarks: string[]
  /** Target race date, YYYY-MM-DD, if training for one. */
  marathon: string | null
  raceName?: string
  /** Folder in the private directory holding the day-by-day training plan CSVs. */
  trainingPlanFolder?: string
  /** When the strength plan's running-heavy options apply. */
  higherVolumeRunning: { weeklyKm: number; longRunKm: number }
}

const DEFAULT: Profile = {
  goals: ['general fitness'],
  equipment: [],
  limitations: [],
  benchmarks: [],
  marathon: null,
  higherVolumeRunning: { weeklyKm: 30, longRunKm: 16 },
}

export function getProfile(): Profile {
  return { ...DEFAULT, ...readPrivateJson<Partial<Profile>>('profile.json', {}) }
}
