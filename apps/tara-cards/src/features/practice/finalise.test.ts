import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/storage/db'
import { saveSession } from '@/storage/repo'
import { buildTimedModule, STRICT_TIMING } from '@/domain/sessions'
import { reconcileSession, MINUTE_MS } from '@/domain/timing'
import { finaliseSession } from './finalise'
import { makeQuestion } from '@/test/factories'
import type { ContentIndex } from '@/content/library'

const questions = [
  makeQuestion({ id: 'a', answer: 'opt-a' }),
  makeQuestion({ id: 'b', answer: 'opt-b' }),
  makeQuestion({ id: 'c', answer: 'opt-c' }),
]

const content = {
  questionById: new Map(questions.map((q) => [q.id, q])),
} as unknown as ContentIndex

const T0 = 1_700_000_000_000

beforeEach(async () => {
  await Promise.all([db.attempts.clear(), db.sessions.clear(), db.reviewStates.clear(), db.exposures.clear()])
})

async function expiredModule(answers: Record<string, string | null>) {
  const session = buildTimedModule({
    questions,
    componentId: 'critical-thinking',
    timing: STRICT_TIMING,
    seed: 's',
    exposedGroupsAtStart: [],
    disclosedSeenCount: 0,
    now: T0,
  })
  // The learner answers, then the tab is closed well past the deadline.
  const { session: reconciled } = reconcileSession({ ...session, answers }, T0 + 90 * MINUTE_MS)
  await saveSession(reconciled)
  return reconciled
}

describe('a module that expired while the tab was closed', () => {
  it('records every answer exactly as it stood when the clock stopped', async () => {
    const session = await expiredModule({ a: 'opt-a', b: 'opt-c' })
    await finaliseSession(session.id, content)

    const attempts = await db.attempts.where('sessionId').equals(session.id).toArray()
    expect(attempts).toHaveLength(3)
    const byQuestion = Object.fromEntries(attempts.map((a) => [a.questionId, a]))
    expect(byQuestion.a.outcome).toBe('correct')
    expect(byQuestion.b.outcome).toBe('incorrect')
    expect(byQuestion.c.outcome).toBe('unscored')
    expect(byQuestion.c.selectedOptionId).toBeNull()
  })

  it('stamps the attempts at the deadline, not at the moment of reopening', async () => {
    const session = await expiredModule({ a: 'opt-a' })
    await finaliseSession(session.id, content)
    const attempt = await db.attempts.where('sessionId').equals(session.id).first()
    expect(attempt?.submittedAt).toBe(T0 + 40 * MINUTE_MS)
  })

  it('is safe to run more than once', async () => {
    const session = await expiredModule({ a: 'opt-a' })
    await finaliseSession(session.id, content)
    await finaliseSession(session.id, content)
    await finaliseSession(session.id, content)
    expect(await db.attempts.where('sessionId').equals(session.id).count()).toBe(3)
  })

  it('does nothing for a module that is still running', async () => {
    const session = buildTimedModule({
      questions,
      componentId: 'critical-thinking',
      timing: STRICT_TIMING,
      seed: 's',
      exposedGroupsAtStart: [],
      disclosedSeenCount: 0,
      now: Date.now(),
    })
    await saveSession({ ...session, answers: { a: 'opt-a' } })
    await finaliseSession(session.id, content)
    expect(await db.attempts.count()).toBe(0)
  })
})
