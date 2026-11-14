import { describe, expect, it } from 'vitest'
import {
  EVIDENCE,
  evidenceBySkill,
  reportableAttempts,
  statsForSkill,
  statusFor,
  suggestNextSkill,
} from './aggregation'
import { buildAttempt } from './marking'
import { DEFAULT_TIMING } from './sessions'
import { makeQuestion } from '@/test/factories'
import type { Attempt } from './types'

const q = makeQuestion({ id: 'q1', answer: 'opt-a', skill: 'ct-flaws' })

function att(over: { correct: boolean; fresh: boolean; at: number; skill?: string; fixture?: boolean }): Attempt {
  const question = makeQuestion({
    id: `q-${over.at}`,
    answer: 'opt-a',
    skill: over.skill ?? 'ct-flaws',
    provenance: over.fixture === false ? 'official' : 'app-fixture',
  })
  return buildAttempt({
    question,
    sessionId: null,
    selectedOptionId: over.correct ? 'opt-a' : 'opt-b',
    startedAt: over.at - 1000,
    submittedAt: over.at,
    durationMs: 1000,
    confidence: null,
    revealedBeforeAnswer: false,
    usedHint: false,
    exposedGroupsAtStart: over.fresh ? [] : [question.duplicateGroupId],
    timing: DEFAULT_TIMING,
  })
}

describe('fresh and repeat are never pooled', () => {
  it('keeps repeat successes out of fresh accuracy', () => {
    const attempts = [
      att({ correct: false, fresh: true, at: 1 }),
      ...Array.from({ length: 10 }, (_, i) => att({ correct: true, fresh: false, at: 10 + i })),
    ]
    const stats = statsForSkill(attempts, 'ct-flaws')
    expect(stats.fresh).toMatchObject({ n: 1, correct: 0, accuracy: 0 })
    expect(stats.repeat).toMatchObject({ n: 10, correct: 10, accuracy: 1 })
  })

  it('reports null rather than zero when there is nothing to divide by', () => {
    const stats = statsForSkill([], 'ct-flaws')
    expect(stats.fresh.accuracy).toBeNull()
    expect(stats.repeat.accuracy).toBeNull()
  })
})

describe('provisional status thresholds', () => {
  it('offers no status at all below the evidence threshold', () => {
    const attempts = Array.from({ length: EVIDENCE.minForStatus - 1 }, (_, i) =>
      att({ correct: true, fresh: true, at: i + 1 }),
    )
    expect(statsForSkill(attempts, 'ct-flaws').status).toBe('gathering-evidence')
  })

  it('says "consistent recently" only at 10 fresh attempts and 80% of the latest 10', () => {
    const attempts = Array.from({ length: 10 }, (_, i) => att({ correct: i > 1, fresh: true, at: i + 1 }))
    expect(statsForSkill(attempts, 'ct-flaws').status).toBe('consistent-recently')
  })

  it('drops to "needs practice" below half', () => {
    const attempts = Array.from({ length: 10 }, (_, i) => att({ correct: i > 6, fresh: true, at: i + 1 }))
    expect(statsForSkill(attempts, 'ct-flaws').status).toBe('needs-practice')
  })

  it('starts at "not started" with no attempts', () => {
    expect(statusFor({ n: 0, correct: 0, accuracy: null }, 0)).toBe('not-started')
  })
})

describe('fixtures are excluded from reports by default', () => {
  const attempts = [
    att({ correct: true, fresh: true, at: 1 }),
    att({ correct: true, fresh: true, at: 2, fixture: false }),
  ]

  it('drops fixture attempts unless asked for', () => {
    expect(reportableAttempts(attempts, false)).toHaveLength(1)
    expect(reportableAttempts(attempts, true)).toHaveLength(2)
  })
})

describe('a question listed under two skills is counted once', () => {
  it('reports the attempt only under its primary skill', () => {
    const shared = makeQuestion({
      id: 'shared',
      answer: 'opt-a',
      skill: 'ct-assumptions',
    })
    const withSecondary = { ...shared, secondaryTags: ['ct-strengthen-weaken'] }
    const attempt = buildAttempt({
      question: withSecondary,
      sessionId: null,
      selectedOptionId: 'opt-a',
      startedAt: 0,
      submittedAt: 1,
      durationMs: 1,
      confidence: null,
      revealedBeforeAnswer: false,
      usedHint: false,
      exposedGroupsAtStart: [],
      timing: DEFAULT_TIMING,
    })
    expect(statsForSkill([attempt], 'ct-assumptions').fresh.n).toBe(1)
    expect(statsForSkill([attempt], 'ct-strengthen-weaken').fresh.n).toBe(0)
  })
})

describe('suggestions come from real history', () => {
  it('returns null when there is nothing to point at', () => {
    expect(suggestNextSkill([], [])).toBeNull()
  })

  it('names the skill and the fraction behind the suggestion', () => {
    const attempts = [
      att({ correct: false, fresh: true, at: 1 }),
      att({ correct: false, fresh: true, at: 2 }),
      att({ correct: false, fresh: true, at: 3 }),
      att({ correct: true, fresh: true, at: 4 }),
      att({ correct: true, fresh: true, at: 5 }),
    ]
    const suggestion = suggestNextSkill(attempts, [
      { id: 'ct-flaws', componentId: 'critical-thinking', title: 'Flaws' },
    ])
    expect(suggestion?.skillId).toBe('ct-flaws')
    expect(suggestion?.reason).toBe('3 of your last 5 fresh attempts were incorrect.')
  })

  it('falls back to a skill with no attempts at all', () => {
    const suggestion = suggestNextSkill(
      [],
      [{ id: 'ct-assumptions', componentId: 'critical-thinking', title: 'Assumptions' }],
    )
    expect(suggestion?.reason).toContain('not attempted a question on this skill yet')
  })
})

describe('evidence for selection', () => {
  it('counts only fresh attempts', () => {
    const attempts = [
      att({ correct: true, fresh: true, at: 1 }),
      att({ correct: false, fresh: false, at: 2 }),
    ]
    expect(evidenceBySkill(attempts).get('ct-flaws')).toEqual({ freshCount: 1, recentAccuracy: 1 })
  })

  it('ignores a skill the learner has never met', () => {
    expect(evidenceBySkill([]).get(q.primarySkillId)).toBeUndefined()
  })
})
