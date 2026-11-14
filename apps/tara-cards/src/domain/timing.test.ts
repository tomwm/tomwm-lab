import { describe, expect, it } from 'vitest'
import { reconcileSession, stageRemainingMs, submitStage, MINUTE_MS } from './timing'
import { buildFullRehearsal, buildTimedModule, STRICT_TIMING } from './sessions'
import { makePrompt, makeQuestion } from '@/test/factories'

const T0 = 1_700_000_000_000
const questions = Array.from({ length: 4 }, (_, i) => makeQuestion({ id: `q${i}`, answer: 'opt-a' }))

function timedModule() {
  return buildTimedModule({
    questions,
    componentId: 'critical-thinking',
    timing: STRICT_TIMING,
    seed: 's',
    exposedGroupsAtStart: [],
    disclosedSeenCount: 0,
    now: T0,
  })
}

describe('deadline reconciliation', () => {
  it('derives remaining time from the persisted deadline, not a counter', () => {
    const session = timedModule()
    expect(stageRemainingMs(session.stages[0], T0)).toBe(40 * MINUTE_MS)
    expect(stageRemainingMs(session.stages[0], T0 + 10 * MINUTE_MS)).toBe(30 * MINUTE_MS)
  })

  it('a closed tab does not buy extra time', () => {
    const session = timedModule()
    // Simulate the tab being gone for an hour.
    const { session: next } = reconcileSession(session, T0 + 60 * MINUTE_MS)
    expect(next.stages[0].status).toBe('expired')
    expect(next.stages[0].submittedAt).toBe(T0 + 40 * MINUTE_MS)
    expect(next.status).toBe('expired')
  })

  it('reconciling twice is stable', () => {
    const session = timedModule()
    const first = reconcileSession(session, T0 + 60 * MINUTE_MS)
    const second = reconcileSession(first.session, T0 + 90 * MINUTE_MS)
    expect(second.session.stages[0].submittedAt).toBe(T0 + 40 * MINUTE_MS)
    expect(second.changed).toBe(false)
  })

  it('a submitted stage cannot be reopened or re-expired', () => {
    const session = timedModule()
    const submitted = {
      ...session,
      stages: [submitStage(session.stages[0], T0 + 5 * MINUTE_MS)],
    }
    const { session: next } = reconcileSession(submitted, T0 + 999 * MINUTE_MS)
    expect(next.stages[0].status).toBe('submitted')
    expect(next.stages[0].submittedAt).toBe(T0 + 5 * MINUTE_MS)
    expect(next.status).toBe('submitted')
  })
})

describe('full rehearsal staging', () => {
  const prompts = [makePrompt('p1'), makePrompt('p2'), makePrompt('p3')]

  function rehearsal() {
    return buildFullRehearsal({
      questions,
      prompts,
      exposedGroups: new Set(),
      timing: STRICT_TIMING,
      seed: 's',
      allowFixtures: true,
      now: T0,
    }).session
  }

  it('starts the second module at the first one’s completion, not at resume time', () => {
    const session = rehearsal()
    const submitted = {
      ...session,
      stages: session.stages.map((s, i) => (i === 0 ? submitStage(s, T0 + 12 * MINUTE_MS) : s)),
    }
    // The learner walks away for two minutes before reopening.
    const { session: next } = reconcileSession(submitted, T0 + 14 * MINUTE_MS)
    expect(next.stages[1].status).toBe('active')
    expect(next.stages[1].startedAt).toBe(T0 + 12 * MINUTE_MS)
    expect(next.stages[1].deadlineAt).toBe(T0 + 52 * MINUTE_MS)
    expect(next.activeStageIndex).toBe(1)
  })

  it('a refresh cannot insert an unlimited break between stages', () => {
    const session = rehearsal()
    // Gone for three hours, having submitted nothing.
    const { session: next } = reconcileSession(session, T0 + 180 * MINUTE_MS)
    expect(next.stages.map((s) => s.status)).toEqual(['expired', 'expired', 'expired'])
    expect(next.stages[1].startedAt).toBe(T0 + 40 * MINUTE_MS)
    expect(next.stages[2].startedAt).toBe(T0 + 80 * MINUTE_MS)
    expect(next.status).toBe('expired')
  })

  it('gives the three stages independent deadlines in order', () => {
    const session = rehearsal()
    expect(session.stages.map((s) => s.kind)).toEqual(['module', 'module', 'writing'])
    expect(session.stages[0].status).toBe('active')
    expect(session.stages[1].status).toBe('pending')
    expect(session.stages[2].status).toBe('pending')
  })
})
