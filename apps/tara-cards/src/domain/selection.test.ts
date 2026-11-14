import { describe, expect, it } from 'vitest'
import { selectPracticeSet, type SelectionRequest } from './selection'
import { makeQuestion } from '@/test/factories'
import type { ReviewState } from './types'

const NOW = 1_000_000

function req(over: Partial<SelectionRequest>): SelectionRequest {
  return {
    questions: [],
    size: 10,
    mode: 'mixed',
    skillIds: [],
    componentIds: [],
    exposedGroups: new Set<string>(),
    reviewStates: [],
    seed: 'seed-1',
    evidence: new Map(),
    now: NOW,
    allowFixtures: true,
    ...over,
  }
}

const pool = Array.from({ length: 20 }, (_, i) =>
  makeQuestion({ id: `q${i}`, answer: 'opt-a', skill: i % 2 ? 'ct-flaws' : 'ct-assumptions' }),
)

describe('unseen-only mode', () => {
  it('never substitutes a question the learner has already met', () => {
    const exposed = new Set(pool.slice(0, 18).map((q) => q.duplicateGroupId))
    const result = selectPracticeSet(req({ questions: pool, size: 10, mode: 'unseen-only', exposedGroups: exposed }))
    expect(result.items).toHaveLength(2)
    expect(result.items.every((q) => !exposed.has(q.duplicateGroupId))).toBe(true)
    expect(result.shortfall).toBe(8)
    expect(result.notes.join(' ')).toContain('Nothing you have already seen has been added')
  })

  it('reports how many unseen questions exist under the filters', () => {
    const result = selectPracticeSet(req({ questions: pool, size: 5, mode: 'unseen-only' }))
    expect(result.availableUnseen).toBe(20)
    expect(result.items).toHaveLength(5)
  })
})

describe('mixed mode', () => {
  it('aims for roughly 60% unseen and fills the requested size', () => {
    const exposed = new Set(pool.slice(0, 8).map((q) => q.duplicateGroupId))
    const reviewStates: ReviewState[] = pool.slice(0, 8).map((q) => ({
      groupId: q.duplicateGroupId,
      itemId: q.id,
      dueAt: NOW - 1000,
      stage: 0,
      lastOutcome: 'incorrect',
      lastReviewedAt: NOW - 90_000,
    }))
    const result = selectPracticeSet(
      req({ questions: pool, size: 10, exposedGroups: exposed, reviewStates }),
    )
    expect(result.items).toHaveLength(10)
    expect(result.unseenCount).toBe(6)
    expect(result.reviewCount).toBe(4)
  })

  it('fills with unseen questions when fewer reviews are due, and says so', () => {
    const result = selectPracticeSet(req({ questions: pool, size: 10 }))
    expect(result.items).toHaveLength(10)
    expect(result.reviewCount).toBe(0)
    expect(result.notes.join(' ')).toContain('Fewer reviews were due than planned')
  })
})

describe('session integrity', () => {
  it('never includes two members of the same duplicate group', () => {
    const twins = [
      makeQuestion({ id: 'a1', answer: 'opt-a', duplicateGroupId: 'grp-shared' }),
      makeQuestion({ id: 'a2', answer: 'opt-a', duplicateGroupId: 'grp-shared' }),
    ]
    const result = selectPracticeSet(req({ questions: twins, size: 2, mode: 'unseen-only' }))
    expect(result.items).toHaveLength(1)
  })

  it('keeps mock-only content out of ordinary practice', () => {
    const questions = [
      makeQuestion({ id: 'ordinary', answer: 'opt-a' }),
      makeQuestion({ id: 'held-out', answer: 'opt-a', reservedForMock: true }),
    ]
    const result = selectPracticeSet(req({ questions, size: 5, mode: 'unseen-only' }))
    expect(result.items.map((q) => q.id)).toEqual(['ordinary'])
  })

  it('excludes questions that cannot be marked', () => {
    const questions = [
      makeQuestion({ id: 'ok', answer: 'opt-a' }),
      makeQuestion({ id: 'no-key', answer: null }),
      makeQuestion({ id: 'quarantined', answer: 'opt-a', availability: 'quarantined' }),
      makeQuestion({ id: 'unchecked', answer: 'opt-a', flags: { assetsChecked: false } }),
    ]
    const result = selectPracticeSet(req({ questions, size: 10, mode: 'unseen-only' }))
    expect(result.items.map((q) => q.id)).toEqual(['ok'])
  })

  it('can leave fixtures out of the pool', () => {
    const result = selectPracticeSet(req({ questions: pool, size: 5, allowFixtures: false }))
    expect(result.items).toHaveLength(0)
  })
})

describe('determinism and ranking', () => {
  it('produces the same set for the same seed', () => {
    const a = selectPracticeSet(req({ questions: pool, size: 6, seed: 'abc' }))
    const b = selectPracticeSet(req({ questions: pool, size: 6, seed: 'abc' }))
    expect(a.items.map((q) => q.id)).toEqual(b.items.map((q) => q.id))
  })

  it('produces a different set for a different seed', () => {
    const a = selectPracticeSet(req({ questions: pool, size: 6, seed: 'abc' }))
    const b = selectPracticeSet(req({ questions: pool, size: 6, seed: 'xyz' }))
    expect(a.items.map((q) => q.id)).not.toEqual(b.items.map((q) => q.id))
  })

  it('prefers the skills the learner asked for', () => {
    const result = selectPracticeSet(req({ questions: pool, size: 5, skillIds: ['ct-flaws'] }))
    expect(result.items.every((q) => q.primarySkillId === 'ct-flaws')).toBe(true)
  })

  it('prefers skills with the least fresh evidence when no skill is chosen', () => {
    const evidence = new Map([
      ['ct-assumptions', { freshCount: 40, recentAccuracy: 0.9 }],
      ['ct-flaws', { freshCount: 0, recentAccuracy: null }],
    ])
    const result = selectPracticeSet(req({ questions: pool, size: 4, evidence }))
    expect(result.items.every((q) => q.primarySkillId === 'ct-flaws')).toBe(true)
  })
})
