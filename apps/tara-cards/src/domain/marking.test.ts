import { describe, expect, it } from 'vitest'
import { gradeOutcome, buildAttempt, isFreshFirstAttempt, scoreModule } from './marking'
import { DEFAULT_TIMING } from './sessions'
import { makeQuestion } from '@/test/factories'

const q = makeQuestion({ id: 'q1', answer: 'opt-b' })

const base = {
  question: q,
  sessionId: 'ses1',
  startedAt: 1000,
  submittedAt: 3000,
  durationMs: 2000,
  confidence: null,
  usedHint: false,
  exposedGroupsAtStart: [] as string[],
  timing: DEFAULT_TIMING,
}

describe('grading', () => {
  it('marks a matching option correct', () => {
    expect(gradeOutcome(q, 'opt-b', false)).toBe('correct')
  })

  it('marks a different option incorrect', () => {
    expect(gradeOutcome(q, 'opt-a', false)).toBe('incorrect')
  })

  it('does not score an unanswered question', () => {
    expect(gradeOutcome(q, null, false)).toBe('unscored')
  })

  it('a reveal is not a correct answer, whatever is clicked afterwards', () => {
    expect(gradeOutcome(q, 'opt-b', true)).toBe('unscored')
  })

  it('never marks a question with no verified key', () => {
    const unverified = makeQuestion({ id: 'q2', answer: null })
    expect(gradeOutcome(unverified, 'opt-a', false)).toBe('unscored')
  })

  it('uses stable option ids, not positions', () => {
    const reordered = { ...q, options: [...q.options].reverse() }
    expect(gradeOutcome(reordered, 'opt-b', false)).toBe('correct')
  })
})

describe('fresh first attempts', () => {
  it('counts an unexposed group answered without help', () => {
    expect(isFreshFirstAttempt({ ...base, selectedOptionId: 'opt-b', revealedBeforeAnswer: false })).toBe(true)
  })

  it('does not count a group exposed before the session began', () => {
    expect(
      isFreshFirstAttempt({
        ...base,
        selectedOptionId: 'opt-b',
        revealedBeforeAnswer: false,
        exposedGroupsAtStart: [q.duplicateGroupId],
      }),
    ).toBe(false)
  })

  it('does not count an attempt made after revealing', () => {
    expect(isFreshFirstAttempt({ ...base, selectedOptionId: 'opt-b', revealedBeforeAnswer: true })).toBe(false)
  })

  it('does not count an attempt that used a hint', () => {
    expect(
      isFreshFirstAttempt({ ...base, selectedOptionId: 'opt-b', revealedBeforeAnswer: false, usedHint: true }),
    ).toBe(false)
  })

  it('treats a duplicate variant as already exposed', () => {
    const variant = makeQuestion({ id: 'q1b', answer: 'opt-b', duplicateGroupId: q.duplicateGroupId })
    expect(
      isFreshFirstAttempt({
        ...base,
        question: variant,
        selectedOptionId: 'opt-b',
        revealedBeforeAnswer: false,
        exposedGroupsAtStart: [q.duplicateGroupId],
      }),
    ).toBe(false)
  })
})

describe('attempt snapshots', () => {
  it('pins the skill, component, provenance and version at the time of answering', () => {
    const attempt = buildAttempt({ ...base, selectedOptionId: 'opt-b', revealedBeforeAnswer: false })
    expect(attempt.primarySkillIdSnapshot).toBe(q.primarySkillId)
    expect(attempt.componentIdSnapshot).toBe(q.componentId)
    expect(attempt.provenanceSnapshot).toBe(q.provenance)
    expect(attempt.questionVersion).toBe(q.version)
  })
})

describe('module scoring', () => {
  const a = makeQuestion({ id: 'a', answer: 'opt-a' })
  const b = makeQuestion({ id: 'b', answer: 'opt-b' })
  const c = makeQuestion({ id: 'c', answer: 'opt-c' })
  const d = makeQuestion({ id: 'd', answer: null })

  it('separates incorrect from unanswered and never guesses without a key', () => {
    const score = scoreModule([a, b, c, d], { a: 'opt-a', b: 'opt-c', c: null, d: 'opt-a' }, [])
    expect(score).toMatchObject({
      total: 4,
      correct: 1,
      incorrect: 1,
      unanswered: 1,
      unscored: 1,
    })
  })

  it('records how many items had already been seen', () => {
    const score = scoreModule([a, b], { a: 'opt-a', b: 'opt-b' }, [a.duplicateGroupId])
    expect(score.previouslyExposed).toBe(1)
    expect(score.correct).toBe(2)
  })
})
