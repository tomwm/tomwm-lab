import { REVIEW_INTERVAL_DAYS } from './types'
import type { Attempt, ReviewState } from './types'

export const DAY_MS = 24 * 60 * 60 * 1000

/**
 * A deliberately transparent schedule. These intervals are this app's
 * configuration — they are not exam guidance and are shown to the learner.
 *
 *   wrong, unscored or revealed early -> tomorrow
 *   correct but marked "unsure"       -> 3 days
 *   correct, confident or unmarked    -> 7 days
 *   each later unaided success        -> 14, then 30 days
 *   any new error                     -> back to tomorrow
 */
export function nextStage(previous: ReviewState | undefined, attempt: Attempt): number {
  const failed =
    attempt.outcome === 'incorrect' ||
    attempt.outcome === 'unscored' ||
    attempt.revealedBeforeAnswer
  if (failed) return 0

  const unsure = attempt.confidence === 'unsure'
  if (!previous) return unsure ? 1 : 2

  // Later successful unaided reviews advance one rung at a time.
  const advanced = Math.min(previous.stage + 1, REVIEW_INTERVAL_DAYS.length - 1)
  if (unsure) return Math.max(1, Math.min(advanced, previous.stage))
  return advanced
}

export function scheduleReview(
  previous: ReviewState | undefined,
  attempt: Attempt,
  now = Date.now(),
): ReviewState {
  const stage = nextStage(previous, attempt)
  return {
    groupId: attempt.duplicateGroupId,
    itemId: attempt.questionId,
    stage,
    dueAt: now + REVIEW_INTERVAL_DAYS[stage] * DAY_MS,
    lastOutcome: attempt.outcome,
    lastReviewedAt: now,
  }
}

/** Manual "review tomorrow" keeps the ladder position but pulls the date in. */
export function reviewTomorrow(state: ReviewState, now = Date.now()): ReviewState {
  return { ...state, dueAt: now + DAY_MS }
}

export function dueGroups(states: readonly ReviewState[], now = Date.now()): ReviewState[] {
  return states.filter((s) => s.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt)
}

export function describeInterval(stage: number): string {
  const days = REVIEW_INTERVAL_DAYS[Math.max(0, Math.min(stage, REVIEW_INTERVAL_DAYS.length - 1))]
  return days === 1 ? 'tomorrow' : `in ${days} days`
}
