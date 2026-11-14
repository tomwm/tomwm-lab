import { db } from './db'
import type {
  Attempt,
  Essay,
  EssayRevision,
  Exposure,
  ExposureReason,
  Question,
  ReviewState,
  SelfReport,
  Session,
} from '@/domain/types'
import { buildExposure, exposedGroupIdsBefore } from '@/domain/exposure'
import { buildAttempt, type AttemptInput } from '@/domain/marking'
import { scheduleReview } from '@/domain/review'
import { newId } from '@/domain/random'
import { countWords } from '@/domain/wordcount'

/* ---------------------------- exposures ---------------------------- */

/** Remounts and StrictMode double-invokes should not inflate the exposure log. */
const EXPOSURE_DEDUPE_MS = 30_000

export async function recordExposure(args: {
  itemId: string
  duplicateGroupId: string
  reason: ExposureReason
  sessionId?: string | null
}): Promise<void> {
  await db.transaction('rw', db.exposures, async () => {
    const since = Date.now() - EXPOSURE_DEDUPE_MS
    const recent = await db.exposures
      .where('duplicateGroupId')
      .equals(args.duplicateGroupId)
      .filter(
        (e) =>
          e.at >= since &&
          e.reason === args.reason &&
          e.itemId === args.itemId &&
          (e.sessionId ?? null) === (args.sessionId ?? null),
      )
      .first()
    if (recent) return
    await db.exposures.add(buildExposure(args))
  })
}

export async function allExposures(): Promise<Exposure[]> {
  return db.exposures.toArray()
}

export async function exposedGroupsAt(moment: number): Promise<string[]> {
  return exposedGroupIdsBefore(await db.exposures.toArray(), moment)
}

export async function exposedGroupSet(): Promise<Set<string>> {
  const rows = await db.exposures.toArray()
  return new Set(rows.map((e) => e.duplicateGroupId))
}

/* ----------------------------- attempts ---------------------------- */

/**
 * Save one attempt and advance its review schedule, in a single transaction.
 *
 * Idempotent per question per session: navigating back to a question the
 * learner has already committed returns the existing attempt instead of
 * recording a second one.
 */
export async function saveAttempt(input: AttemptInput): Promise<Attempt> {
  return db.transaction('rw', db.attempts, db.reviewStates, db.exposures, async () => {
    if (input.sessionId) {
      const existing = await db.attempts
        .where('sessionId')
        .equals(input.sessionId)
        .filter((a) => a.questionId === input.question.id)
        .first()
      if (existing) return existing
    }

    const attempt = buildAttempt(input)
    await db.attempts.add(attempt)

    const previous = await db.reviewStates.get(attempt.duplicateGroupId)
    await db.reviewStates.put(scheduleReview(previous, attempt, attempt.submittedAt))

    return attempt
  })
}

export async function updateAttempt(
  id: string,
  patch: Pick<Partial<Attempt>, 'errorLabels' | 'note'>,
): Promise<void> {
  await db.attempts.update(id, patch)
}

export async function attemptForQuestionInSession(
  sessionId: string,
  questionId: string,
): Promise<Attempt | undefined> {
  return db.attempts
    .where('sessionId')
    .equals(sessionId)
    .filter((a) => a.questionId === questionId)
    .first()
}

export async function allAttempts(): Promise<Attempt[]> {
  return db.attempts.orderBy('submittedAt').toArray()
}

export async function attemptsForQuestion(questionId: string): Promise<Attempt[]> {
  return db.attempts.where('questionId').equals(questionId).sortBy('submittedAt')
}

/** One canonical history per duplicate group, however the item was reached. */
export async function attemptsForGroup(groupId: string): Promise<Attempt[]> {
  return db.attempts.where('duplicateGroupId').equals(groupId).sortBy('submittedAt')
}

/* --------------------------- review states ------------------------- */

export async function allReviewStates(): Promise<ReviewState[]> {
  return db.reviewStates.toArray()
}

export async function putReviewState(state: ReviewState): Promise<void> {
  await db.reviewStates.put(state)
}

export async function dueCount(now = Date.now()): Promise<number> {
  return db.reviewStates.where('dueAt').belowOrEqual(now).count()
}

/* ----------------------------- sessions ---------------------------- */

export async function saveSession(session: Session): Promise<void> {
  await db.sessions.put(session)
}

export async function getSession(id: string): Promise<Session | undefined> {
  return db.sessions.get(id)
}

export async function activeSessions(): Promise<Session[]> {
  return db.sessions.where('status').equals('active').reverse().sortBy('createdAt')
}

export async function recentSessions(limit = 20): Promise<Session[]> {
  const all = await db.sessions.orderBy('createdAt').reverse().limit(limit).toArray()
  return all
}

/** Persist a single answer immediately — never batched, never debounced. */
export async function persistAnswer(
  sessionId: string,
  questionId: string,
  optionId: string | null,
): Promise<void> {
  await db.transaction('rw', db.sessions, async () => {
    const session = await db.sessions.get(sessionId)
    if (!session || session.status !== 'active') return
    const stage = session.stages[session.activeStageIndex]
    if (stage && (stage.status === 'submitted' || stage.status === 'expired')) return
    await db.sessions.put({
      ...session,
      answers: { ...session.answers, [questionId]: optionId },
    })
  })
}

export async function persistFlag(sessionId: string, questionId: string, flagged: boolean) {
  await db.transaction('rw', db.sessions, async () => {
    const session = await db.sessions.get(sessionId)
    if (!session) return
    await db.sessions.put({ ...session, flagged: { ...session.flagged, [questionId]: flagged } })
  })
}

/* ------------------------------ essays ----------------------------- */

export async function createEssay(args: {
  promptId: string
  promptVersion: number
  sessionId: string | null
  timing: Essay['timing']
}): Promise<Essay> {
  const essay: Essay = {
    id: newId('essay'),
    promptId: args.promptId,
    promptVersion: args.promptVersion,
    sessionId: args.sessionId,
    createdAt: Date.now(),
    plan: '',
    text: '',
    wordCount: 0,
    lastSavedAt: null,
    revisions: [],
    feedback: [],
    status: 'draft',
    timing: args.timing,
  }
  await db.essays.add(essay)
  return essay
}

export async function saveEssayDraft(
  id: string,
  patch: { plan?: string; text?: string },
): Promise<Essay | undefined> {
  return db.transaction('rw', db.essays, async () => {
    const essay = await db.essays.get(id)
    if (!essay) return undefined
    const text = patch.text ?? essay.text
    const next: Essay = {
      ...essay,
      ...patch,
      text,
      wordCount: countWords(text),
      lastSavedAt: Date.now(),
    }
    await db.essays.put(next)
    return next
  })
}

/** Submitting never overwrites earlier work — revisions accumulate. */
export async function addEssayRevision(
  id: string,
  revision: Omit<EssayRevision, 'id'>,
  markSubmitted: boolean,
): Promise<Essay | undefined> {
  return db.transaction('rw', db.essays, async () => {
    const essay = await db.essays.get(id)
    if (!essay) return undefined
    const next: Essay = {
      ...essay,
      revisions: [...essay.revisions, { ...revision, id: newId('rev') }],
      status: markSubmitted ? 'submitted' : essay.status,
      lastSavedAt: Date.now(),
    }
    await db.essays.put(next)
    return next
  })
}

export async function getEssay(id: string): Promise<Essay | undefined> {
  return db.essays.get(id)
}

export async function allEssays(): Promise<Essay[]> {
  return db.essays.orderBy('createdAt').reverse().toArray()
}

export async function essayForSession(sessionId: string): Promise<Essay | undefined> {
  return db.essays.where('sessionId').equals(sessionId).first()
}

export async function deleteEssay(id: string): Promise<void> {
  await db.essays.delete(id)
}

/* --------------------------- self reports -------------------------- */

export async function addSelfReport(report: Omit<SelfReport, 'id'>): Promise<SelfReport> {
  const row = { ...report, id: newId('self') }
  await db.selfReports.add(row)
  return row
}

export async function allSelfReports(): Promise<SelfReport[]> {
  return db.selfReports.orderBy('at').reverse().toArray()
}

export async function deleteSelfReport(id: string): Promise<void> {
  await db.selfReports.delete(id)
}

/* ------------------------------ packs ------------------------------ */

export async function storedPacks() {
  return db.packs.orderBy('importedAt').toArray()
}

export async function deletePack(id: string): Promise<void> {
  await db.packs.delete(id)
}

/* ---------------------------- convenience -------------------------- */

/** Everything the question card needs about one item's history. */
export async function historyFor(question: Question) {
  const [attempts, exposures, review] = await Promise.all([
    attemptsForGroup(question.duplicateGroupId),
    db.exposures.where('duplicateGroupId').equals(question.duplicateGroupId).sortBy('at'),
    db.reviewStates.get(question.duplicateGroupId),
  ])
  return { attempts, exposures, review }
}
