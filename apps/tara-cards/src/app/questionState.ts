import type { Attempt, Question, ReviewState } from '@/domain/types'
import { isInteractive } from '@/domain/eligibility'

export type QuestionStateId =
  | 'unavailable'
  | 'unseen'
  | 'exposed'
  | 'attempted-correct'
  | 'attempted-incorrect'
  | 'due-review'

export interface QuestionState {
  id: QuestionStateId
  label: string
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
}

/**
 * How a question looks in a list. Deliberately never leaks the answer — only
 * whether the learner has met it and how the last scored attempt went.
 */
export function questionState(
  question: Question,
  attemptsByGroup: ReadonlyMap<string, Attempt[]>,
  exposedGroups: ReadonlySet<string>,
  reviewByGroup: ReadonlyMap<string, ReviewState>,
  now = Date.now(),
): QuestionState {
  if (!isInteractive(question)) {
    return {
      id: 'unavailable',
      label: question.availability === 'quarantined' ? 'Not available' : 'Link only',
      tone: 'neutral',
    }
  }

  const review = reviewByGroup.get(question.duplicateGroupId)
  if (review && review.dueAt <= now) return { id: 'due-review', label: 'Due for review', tone: 'warning' }

  const attempts = attemptsByGroup.get(question.duplicateGroupId) ?? []
  const lastScored = [...attempts].reverse().find((a) => a.outcome !== 'unscored')
  if (lastScored) {
    return lastScored.outcome === 'correct'
      ? { id: 'attempted-correct', label: 'Last: correct', tone: 'success' }
      : { id: 'attempted-incorrect', label: 'Last: incorrect', tone: 'danger' }
  }

  if (exposedGroups.has(question.duplicateGroupId)) {
    return { id: 'exposed', label: 'Seen, not answered', tone: 'info' }
  }
  return { id: 'unseen', label: 'Unseen', tone: 'neutral' }
}

export function groupBy<T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>()
  for (const item of items) {
    const k = key(item)
    const list = out.get(k)
    if (list) list.push(item)
    else out.set(k, [item])
  }
  return out
}

/** Unique descendants, so a collection card never sums overlapping tag counts. */
export function uniqueQuestionCount(questions: readonly Question[]): number {
  return new Set(questions.map((q) => q.duplicateGroupId)).size
}
