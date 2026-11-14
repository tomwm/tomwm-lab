import type {
  Attempt,
  AttemptOutcome,
  Confidence,
  ErrorLabel,
  Question,
  TimingSetting,
} from './types'
import { isMarkable } from './eligibility'
import { newId } from './random'

export interface AttemptInput {
  question: Question
  sessionId: string | null
  selectedOptionId: string | null
  startedAt: number
  submittedAt: number
  durationMs: number
  confidence: Confidence | null
  /** The learner opened the back before committing an answer. */
  revealedBeforeAnswer: boolean
  usedHint: boolean
  /** Duplicate groups already exposed when this session started. */
  exposedGroupsAtStart: readonly string[]
  errorLabels?: ErrorLabel[]
  note?: string | null
  timing: TimingSetting
}

/**
 * Grade a single response.
 *
 * A reveal is not a correct answer: if the learner opened the back before
 * committing, the attempt is recorded as `unscored` however they later click.
 * An item with no verified key is never guessed at — it is also `unscored`.
 */
export function gradeOutcome(
  question: Question,
  selectedOptionId: string | null,
  revealedBeforeAnswer: boolean,
): AttemptOutcome {
  if (revealedBeforeAnswer) return 'unscored'
  if (selectedOptionId === null) return 'unscored'
  if (!isMarkable(question)) return 'unscored'
  return selectedOptionId === question.answerOptionId ? 'correct' : 'incorrect'
}

/**
 * "Fresh first attempt" — the only evidence used for transfer measurement.
 *
 * All three must hold: the item's duplicate group was unexposed before this
 * session began, the learner answered before revealing, and no assistance was
 * used. Opening the question inside its own answering session does not
 * disqualify it; browsing it yesterday does.
 */
export function isFreshFirstAttempt(input: AttemptInput): boolean {
  const { question, selectedOptionId, revealedBeforeAnswer, usedHint, exposedGroupsAtStart } = input
  if (revealedBeforeAnswer || usedHint) return false
  if (selectedOptionId === null) return false
  if (!isMarkable(question)) return false
  return !exposedGroupsAtStart.includes(question.duplicateGroupId)
}

export function buildAttempt(input: AttemptInput): Attempt {
  const outcome = gradeOutcome(input.question, input.selectedOptionId, input.revealedBeforeAnswer)
  return {
    id: newId('att'),
    questionId: input.question.id,
    questionVersion: input.question.version,
    duplicateGroupId: input.question.duplicateGroupId,
    sessionId: input.sessionId,
    selectedOptionId: input.selectedOptionId,
    outcome,
    startedAt: input.startedAt,
    submittedAt: input.submittedAt,
    durationMs: Math.max(0, Math.round(input.durationMs)),
    confidence: input.confidence,
    revealedBeforeAnswer: input.revealedBeforeAnswer,
    usedHint: input.usedHint,
    errorLabels: input.errorLabels ?? [],
    note: input.note ?? null,
    freshFirstAttempt: isFreshFirstAttempt(input),
    primarySkillIdSnapshot: input.question.primarySkillId,
    componentIdSnapshot: input.question.componentId,
    provenanceSnapshot: input.question.provenance,
    timingSetting: input.timing,
  }
}

/** Score a completed multiple-choice module. Unanswered is never "incorrect only". */
export interface ModuleScore {
  total: number
  correct: number
  incorrect: number
  unanswered: number
  unscored: number
  previouslyExposed: number
}

export function scoreModule(
  questions: readonly Question[],
  answers: Readonly<Record<string, string | null>>,
  exposedGroupsAtStart: readonly string[],
): ModuleScore {
  let correct = 0
  let incorrect = 0
  let unanswered = 0
  let unscored = 0
  let previouslyExposed = 0
  for (const q of questions) {
    if (exposedGroupsAtStart.includes(q.duplicateGroupId)) previouslyExposed++
    const selected = answers[q.id] ?? null
    if (selected === null) {
      unanswered++
      continue
    }
    if (!isMarkable(q)) {
      unscored++
      continue
    }
    if (selected === q.answerOptionId) correct++
    else incorrect++
  }
  return {
    total: questions.length,
    correct,
    incorrect,
    unanswered,
    unscored,
    previouslyExposed,
  }
}
