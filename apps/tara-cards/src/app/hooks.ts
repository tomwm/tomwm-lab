import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/storage/db'
import { useApp } from './AppContext'
import { evidenceBySkill, reportableAttempts } from '@/domain/aggregation'
import type { Attempt, Exposure, ReviewState } from '@/domain/types'

export function useAttempts(): Attempt[] {
  return useLiveQuery(() => db.attempts.orderBy('submittedAt').toArray(), [], []) ?? []
}

export function useExposures(): Exposure[] {
  return useLiveQuery(() => db.exposures.orderBy('at').toArray(), [], []) ?? []
}

export function useReviewStates(): ReviewState[] {
  return useLiveQuery(() => db.reviewStates.toArray(), [], []) ?? []
}

export function useEssays() {
  return useLiveQuery(() => db.essays.orderBy('createdAt').reverse().toArray(), [], []) ?? []
}

export function useSessions(limit = 25) {
  return (
    useLiveQuery(() => db.sessions.orderBy('createdAt').reverse().limit(limit).toArray(), [limit], []) ?? []
  )
}

export function useSelfReports() {
  return useLiveQuery(() => db.selfReports.orderBy('at').reverse().toArray(), [], []) ?? []
}

/** The set of duplicate groups the learner has met, for selection and labelling. */
export function useExposedGroups(): Set<string> {
  const exposures = useExposures()
  return useMemo(() => new Set(exposures.map((e) => e.duplicateGroupId)), [exposures])
}

/**
 * Attempts that count towards reported performance. Development fixtures are
 * excluded unless the learner has explicitly switched them on in Settings.
 */
export function useReportableAttempts(): Attempt[] {
  const attempts = useAttempts()
  const { prefs } = useApp()
  return useMemo(
    () => reportableAttempts(attempts, prefs.includeFixturesInProgress),
    [attempts, prefs.includeFixturesInProgress],
  )
}

/** Evidence used to bias selection towards weak skills — all attempts count here. */
export function useSkillEvidence() {
  const attempts = useAttempts()
  return useMemo(() => evidenceBySkill(attempts), [attempts])
}

export function useDueReviews(now = Date.now()) {
  const states = useReviewStates()
  return useMemo(() => states.filter((s) => s.dueAt <= now), [states, now])
}
