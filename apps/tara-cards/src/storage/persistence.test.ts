import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import {
  addEssayRevision,
  attemptsForGroup,
  createEssay,
  exposedGroupsAt,
  getEssay,
  historyFor,
  persistAnswer,
  recordExposure,
  saveAttempt,
  saveEssayDraft,
  saveSession,
} from './repo'
import { applyImport, exportBackup, previewImport } from './backup'
import { DEFAULT_TIMING, buildLearningSession, buildTimedModule, STRICT_TIMING } from '@/domain/sessions'
import { truncateToWords, WORD_LIMIT, countWords } from '@/domain/wordcount'
import { makeQuestion } from '@/test/factories'
import { submitStage } from '@/domain/timing'

const q = makeQuestion({ id: 'q1', answer: 'opt-a' })
const variant = makeQuestion({ id: 'q1-variant', answer: 'opt-a', duplicateGroupId: q.duplicateGroupId })

beforeEach(async () => {
  await Promise.all([
    db.attempts.clear(),
    db.exposures.clear(),
    db.sessions.clear(),
    db.essays.clear(),
    db.reviewStates.clear(),
    db.selfReports.clear(),
    db.packs.clear(),
    db.preferences.clear(),
  ])
})

function attemptInput(over: Partial<Parameters<typeof saveAttempt>[0]> = {}) {
  return {
    question: q,
    sessionId: 'ses1',
    selectedOptionId: 'opt-a' as string | null,
    startedAt: 1000,
    submittedAt: 2000,
    durationMs: 1000,
    confidence: null,
    revealedBeforeAnswer: false,
    usedHint: false,
    exposedGroupsAtStart: [] as string[],
    timing: DEFAULT_TIMING,
    ...over,
  }
}

describe('attempts persist exactly once', () => {
  it('saves an attempt and schedules its review in one go', async () => {
    const attempt = await saveAttempt(attemptInput())
    expect(attempt.outcome).toBe('correct')
    expect(await db.attempts.count()).toBe(1)
    expect(await db.reviewStates.get(q.duplicateGroupId)).toBeDefined()
  })

  it('navigating back and forward does not submit a second time', async () => {
    const first = await saveAttempt(attemptInput())
    const second = await saveAttempt(attemptInput({ selectedOptionId: 'opt-b' }))
    expect(second.id).toBe(first.id)
    expect(second.outcome).toBe('correct')
    expect(await db.attempts.count()).toBe(1)
  })

  it('survives a reload — the record is read back from storage', async () => {
    await saveAttempt(attemptInput())
    const reloaded = await db.attempts.where('sessionId').equals('ses1').first()
    expect(reloaded?.questionId).toBe('q1')
    expect(reloaded?.outcome).toBe('correct')
  })
})

describe('one canonical history per duplicate group', () => {
  it('shares attempts between two questions in the same group', async () => {
    await saveAttempt(attemptInput({ sessionId: 'a' }))
    await saveAttempt(attemptInput({ sessionId: 'b', question: variant, selectedOptionId: 'opt-b' }))
    const history = await attemptsForGroup(q.duplicateGroupId)
    expect(history).toHaveLength(2)
    const viaOriginal = await historyFor(q)
    const viaVariant = await historyFor(variant)
    expect(viaOriginal.attempts).toHaveLength(2)
    expect(viaVariant.attempts).toHaveLength(2)
  })

  it('does not log the same exposure twice when a card remounts', async () => {
    await recordExposure({ itemId: q.id, duplicateGroupId: q.duplicateGroupId, reason: 'prompt-viewed' })
    await recordExposure({ itemId: q.id, duplicateGroupId: q.duplicateGroupId, reason: 'prompt-viewed' })
    expect(await db.exposures.count()).toBe(1)
  })

  it('still logs a different kind of exposure on the same item', async () => {
    await recordExposure({ itemId: q.id, duplicateGroupId: q.duplicateGroupId, reason: 'prompt-viewed' })
    await recordExposure({ itemId: q.id, duplicateGroupId: q.duplicateGroupId, reason: 'answer-revealed' })
    expect(await db.exposures.count()).toBe(2)
  })

  it('a reveal records exposure but no scored attempt', async () => {
    await recordExposure({ itemId: q.id, duplicateGroupId: q.duplicateGroupId, reason: 'answer-revealed' })
    const attempt = await saveAttempt(attemptInput({ selectedOptionId: null, revealedBeforeAnswer: true }))
    expect(attempt.outcome).toBe('unscored')
    expect(attempt.freshFirstAttempt).toBe(false)
    expect(await db.exposures.count()).toBe(1)
  })

  it('a later correct answer on an exposed group is repeat practice', async () => {
    await recordExposure({ itemId: q.id, duplicateGroupId: q.duplicateGroupId, reason: 'prompt-viewed', at: 1 } as never)
    const exposedBefore = await exposedGroupsAt(Date.now())
    const attempt = await saveAttempt(attemptInput({ sessionId: 'later', exposedGroupsAtStart: exposedBefore }))
    expect(attempt.outcome).toBe('correct')
    expect(attempt.freshFirstAttempt).toBe(false)
  })

  it('seeing a question inside its own answering session does not disqualify it', async () => {
    const exposedBefore = await exposedGroupsAt(Date.now())
    await recordExposure({
      itemId: q.id,
      duplicateGroupId: q.duplicateGroupId,
      reason: 'prompt-viewed',
      sessionId: 'ses1',
    })
    const attempt = await saveAttempt(attemptInput({ exposedGroupsAtStart: exposedBefore }))
    expect(attempt.freshFirstAttempt).toBe(true)
  })
})

describe('module answers survive a refresh', () => {
  it('persists each selection immediately', async () => {
    const session = buildTimedModule({
      questions: [q],
      componentId: 'critical-thinking',
      timing: STRICT_TIMING,
      seed: 's',
      exposedGroupsAtStart: [],
      disclosedSeenCount: 0,
      now: Date.now(),
    })
    await saveSession(session)
    await persistAnswer(session.id, q.id, 'opt-c')
    expect((await db.sessions.get(session.id))?.answers[q.id]).toBe('opt-c')
  })

  it('refuses to change an answer once the module is submitted', async () => {
    const session = buildTimedModule({
      questions: [q],
      componentId: 'critical-thinking',
      timing: STRICT_TIMING,
      seed: 's',
      exposedGroupsAtStart: [],
      disclosedSeenCount: 0,
      now: Date.now(),
    })
    await saveSession({
      ...session,
      answers: { [q.id]: 'opt-a' },
      stages: [submitStage(session.stages[0], Date.now())],
    })
    await persistAnswer(session.id, q.id, 'opt-b')
    expect((await db.sessions.get(session.id))?.answers[q.id]).toBe('opt-a')
  })
})

describe('essays', () => {
  it('autosaves a draft and recovers it after reopening', async () => {
    const essay = await createEssay({ promptId: 'p1', promptVersion: 1, sessionId: null, timing: DEFAULT_TIMING })
    await saveEssayDraft(essay.id, { plan: 'three moves', text: 'one two three' })
    const reopened = await getEssay(essay.id)
    expect(reopened?.plan).toBe('three moves')
    expect(reopened?.text).toBe('one two three')
    expect(reopened?.wordCount).toBe(3)
    expect(reopened?.lastSavedAt).not.toBeNull()
  })

  it('keeps every submission rather than overwriting the last', async () => {
    const essay = await createEssay({ promptId: 'p1', promptVersion: 1, sessionId: null, timing: DEFAULT_TIMING })
    await saveEssayDraft(essay.id, { text: 'first version' })
    await addEssayRevision(
      essay.id,
      { at: 1, text: 'first version', wordCount: 2, truncated: false, archivedFullText: null, reason: 'manual-submit' },
      true,
    )
    await saveEssayDraft(essay.id, { text: 'second version, much better' })
    await addEssayRevision(
      essay.id,
      { at: 2, text: 'second version, much better', wordCount: 4, truncated: false, archivedFullText: null, reason: 'revision' },
      true,
    )
    const stored = await getEssay(essay.id)
    expect(stored?.revisions).toHaveLength(2)
    expect(stored?.revisions[0].text).toBe('first version')
  })

  it('archives the full text when expiry truncates an oversized draft', async () => {
    const essay = await createEssay({ promptId: 'p1', promptVersion: 1, sessionId: null, timing: DEFAULT_TIMING })
    const long = Array.from({ length: WORD_LIMIT + 25 }, (_, i) => `w${i}`).join(' ')
    await saveEssayDraft(essay.id, { text: long })
    const cut = truncateToWords(long)
    await addEssayRevision(
      essay.id,
      {
        at: 3,
        text: cut.kept,
        wordCount: cut.keptWords,
        truncated: true,
        archivedFullText: long,
        reason: 'expiry',
      },
      true,
    )
    const stored = await getEssay(essay.id)
    const revision = stored!.revisions[0]
    expect(revision.wordCount).toBe(WORD_LIMIT)
    expect(countWords(revision.archivedFullText!)).toBe(WORD_LIMIT + 25)
    expect(stored?.text).toBe(long)
  })
})

describe('backup round trip', () => {
  async function seed() {
    await saveAttempt(attemptInput())
    await recordExposure({ itemId: q.id, duplicateGroupId: q.duplicateGroupId, reason: 'prompt-viewed' })
    const essay = await createEssay({ promptId: 'p1', promptVersion: 1, sessionId: null, timing: DEFAULT_TIMING })
    await saveEssayDraft(essay.id, { text: 'a draft worth keeping' })
    await saveSession(
      buildLearningSession({
        mode: 'quick',
        questions: [q],
        componentId: 'critical-thinking',
        timing: DEFAULT_TIMING,
        seed: 's',
        exposedGroupsAtStart: [],
        now: Date.now(),
      }),
    )
  }

  it('exports and restores progress and essays without corrupting references', async () => {
    await seed()
    const backup = await exportBackup()
    expect(backup.attempts).toHaveLength(1)

    await db.attempts.clear()
    await db.essays.clear()
    await applyImport(backup, 'merge')

    const restored = await db.attempts.toArray()
    expect(restored).toHaveLength(1)
    expect(restored[0].questionId).toBe('q1')
    expect(restored[0].duplicateGroupId).toBe(q.duplicateGroupId)
    const essays = await db.essays.toArray()
    expect(essays[0].text).toBe('a draft worth keeping')
  })

  it('merging keeps what is already here and adds only what is missing', async () => {
    await seed()
    const backup = await exportBackup()
    await applyImport(backup, 'merge')
    expect(await db.attempts.count()).toBe(1)
  })

  it('replacing wipes local data first', async () => {
    await seed()
    const backup = await exportBackup()
    await db.attempts.clear()
    await saveAttempt(attemptInput({ sessionId: 'other' }))
    await applyImport(backup, 'replace')
    const ids = (await db.attempts.toArray()).map((a) => a.sessionId)
    expect(ids).toEqual(['ses1'])
  })

  it('rejects a file that is not a backup, with a readable reason', async () => {
    const preview = await previewImport({ hello: 'world' }, new Set())
    expect(preview.ok).toBe(false)
    expect(preview.errors.length).toBeGreaterThan(0)
  })

  it('warns when restored attempts refer to content that is not loaded', async () => {
    await seed()
    const backup = await exportBackup()
    const preview = await previewImport(backup, new Set(['something-else']))
    expect(preview.ok).toBe(true)
    expect(preview.unknownQuestionIds).toEqual(['q1'])
  })

  it('counts colliding ids so the learner sees what merge would skip', async () => {
    await seed()
    const backup = await exportBackup()
    const preview = await previewImport(backup, new Set(['q1']))
    expect(preview.collisions.attempts).toBe(1)
    expect(preview.current.attempts).toBe(1)
  })
})
