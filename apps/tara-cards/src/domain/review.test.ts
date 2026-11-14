import { describe, expect, it } from 'vitest'
import { DAY_MS, dueGroups, nextStage, reviewTomorrow, scheduleReview } from './review'
import { buildAttempt } from './marking'
import { DEFAULT_TIMING } from './sessions'
import { makeQuestion } from '@/test/factories'
import type { Confidence, ReviewState } from './types'

const q = makeQuestion({ id: 'q1', answer: 'opt-a' })
const NOW = 1_700_000_000_000

function attempt(opts: { correct: boolean; confidence?: Confidence | null; revealed?: boolean }) {
  return buildAttempt({
    question: q,
    sessionId: null,
    selectedOptionId: opts.revealed ? null : opts.correct ? 'opt-a' : 'opt-b',
    startedAt: NOW - 1000,
    submittedAt: NOW,
    durationMs: 1000,
    confidence: opts.confidence ?? null,
    revealedBeforeAnswer: opts.revealed ?? false,
    usedHint: false,
    exposedGroupsAtStart: [],
    timing: DEFAULT_TIMING,
  })
}

describe('review scheduling', () => {
  it('brings a wrong answer back tomorrow', () => {
    const state = scheduleReview(undefined, attempt({ correct: false }), NOW)
    expect(state.stage).toBe(0)
    expect(state.dueAt).toBe(NOW + DAY_MS)
  })

  it('brings an early reveal back tomorrow', () => {
    const state = scheduleReview(undefined, attempt({ correct: false, revealed: true }), NOW)
    expect(state.dueAt).toBe(NOW + DAY_MS)
  })

  it('waits three days after a correct but unsure answer', () => {
    const state = scheduleReview(undefined, attempt({ correct: true, confidence: 'unsure' }), NOW)
    expect(state.dueAt).toBe(NOW + 3 * DAY_MS)
  })

  it('waits a week after a correct, confident answer', () => {
    const state = scheduleReview(undefined, attempt({ correct: true, confidence: 'certain' }), NOW)
    expect(state.dueAt).toBe(NOW + 7 * DAY_MS)
  })

  it('advances up the ladder on later successes', () => {
    let state = scheduleReview(undefined, attempt({ correct: true, confidence: 'certain' }), NOW)
    state = scheduleReview(state, attempt({ correct: true, confidence: 'certain' }), NOW)
    expect(state.dueAt).toBe(NOW + 14 * DAY_MS)
    state = scheduleReview(state, attempt({ correct: true, confidence: 'certain' }), NOW)
    expect(state.dueAt).toBe(NOW + 30 * DAY_MS)
    state = scheduleReview(state, attempt({ correct: true, confidence: 'certain' }), NOW)
    expect(state.dueAt).toBe(NOW + 30 * DAY_MS)
  })

  it('resets to tomorrow on a new error, however far up the ladder', () => {
    let state: ReviewState | undefined
    for (let i = 0; i < 4; i++) state = scheduleReview(state, attempt({ correct: true, confidence: 'certain' }), NOW)
    state = scheduleReview(state, attempt({ correct: false }), NOW)
    expect(state.stage).toBe(0)
    expect(state.dueAt).toBe(NOW + DAY_MS)
  })

  it('never advances an item the learner was unsure about', () => {
    const start = scheduleReview(undefined, attempt({ correct: true, confidence: 'certain' }), NOW)
    const next = nextStage(start, attempt({ correct: true, confidence: 'unsure' }))
    expect(next).toBe(start.stage)
  })

  it('supports pulling a review forward by hand', () => {
    const state = scheduleReview(undefined, attempt({ correct: true, confidence: 'certain' }), NOW)
    expect(reviewTomorrow(state, NOW).dueAt).toBe(NOW + DAY_MS)
  })

  it('lists only what is actually due', () => {
    const states: ReviewState[] = [
      { groupId: 'a', itemId: 'a', dueAt: NOW - 10, stage: 0, lastOutcome: 'incorrect', lastReviewedAt: NOW },
      { groupId: 'b', itemId: 'b', dueAt: NOW + 10, stage: 1, lastOutcome: 'correct', lastReviewedAt: NOW },
    ]
    expect(dueGroups(states, NOW).map((s) => s.groupId)).toEqual(['a'])
  })
})
