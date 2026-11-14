import type { ContentIndex } from '@/content/library'
import type { Session, SessionStage } from '@/domain/types'
import { getSession, saveAttempt } from '@/storage/repo'

/**
 * Turn a finished module's saved answers into attempt records.
 *
 * This runs wherever a module ends — on submission, on reconciling an expired
 * deadline, and again when the results page opens. `saveAttempt` is idempotent
 * per session and question, so calling it more than once is safe and a module
 * that expired while the tab was closed still records what the learner had
 * selected at the moment the clock stopped.
 */
export async function recordStageAttempts(
  session: Session,
  stage: SessionStage,
  content: ContentIndex,
  durations: Record<string, number> = {},
): Promise<void> {
  if (stage.kind !== 'module') return
  if (stage.status !== 'submitted' && stage.status !== 'expired') return
  const endedAt = stage.submittedAt ?? stage.deadlineAt ?? Date.now()

  for (const id of stage.itemIds) {
    const question = content.questionById.get(id)
    if (!question) continue
    await saveAttempt({
      question,
      sessionId: session.id,
      selectedOptionId: session.answers[id] ?? null,
      startedAt: stage.startedAt ?? session.createdAt,
      submittedAt: endedAt,
      durationMs: durations[id] ?? 0,
      confidence: null,
      revealedBeforeAnswer: false,
      usedHint: false,
      exposedGroupsAtStart: session.exposedGroupsAtStart,
      timing: session.timing,
    })
  }
}

export async function finaliseSession(
  sessionId: string,
  content: ContentIndex,
  durations: Record<string, number> = {},
): Promise<void> {
  const session = await getSession(sessionId)
  if (!session) return
  for (const stage of session.stages) {
    await recordStageAttempts(session, stage, content, durations)
  }
}
