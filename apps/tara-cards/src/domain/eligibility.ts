import type { Question, WritingPrompt } from './types'

/**
 * An item may be marked locally only when a verified key has been imported and
 * every review flag has been signed off. Everything else is link-only or
 * quarantined, and can never enter scored practice.
 */
export function isMarkable(q: Question): boolean {
  return q.answerVerification === 'verified-key' && q.answerOptionId !== null
}

export function allFlagsChecked(q: Question): boolean {
  return (
    q.flags.transcriptionChecked &&
    q.flags.answerKeyChecked &&
    q.flags.alignmentChecked &&
    q.flags.assetsChecked
  )
}

/** Eligible for interactive, scored practice inside the app. */
export function isInteractive(q: Question): boolean {
  return (
    q.availability === 'interactive' &&
    q.distributionMode === 'interactive-approved' &&
    allFlagsChecked(q) &&
    isMarkable(q)
  )
}

/**
 * TARA questions always have exactly five options. [S5] Older BMAT items with
 * four to eight are fine for practice but are kept out of timed modules and the
 * full rehearsal, which should look like the real thing.
 */
export const TARA_OPTION_COUNT = 5

export function isTaraFormat(q: Question): boolean {
  return q.options.length === TARA_OPTION_COUNT
}

/** Available to ordinary (non-mock) practice sets. */
export function isPractisable(q: Question): boolean {
  return isInteractive(q) && !q.reservedForMock
}

export function hasExplanation(q: Question): boolean {
  return q.explanation.status !== 'none' && q.explanation.blocks.length > 0
}

export function isPromptUsable(p: WritingPrompt): boolean {
  return p.availability === 'interactive'
}

export interface QuarantineFinding {
  questionId: string
  reasons: string[]
}

/** Recomputed at import time; the stored reason is what the UI shows. */
export function quarantineReasons(q: Question): string[] {
  const reasons: string[] = []
  if (q.options.length < 2) reasons.push('Fewer than two answer options')
  if (new Set(q.options.map((o) => o.id)).size !== q.options.length)
    reasons.push('Duplicate option ids')
  if (q.answerOptionId && !q.options.some((o) => o.id === q.answerOptionId))
    reasons.push('Answer key points at an option that does not exist')
  if (q.answerVerification === 'verified-key' && !q.answerOptionId)
    reasons.push('Marked as key-verified but carries no answer')
  if (
    q.blocks.some((b) => b.kind === 'figure' && !b.svg) &&
    q.distributionMode === 'interactive-approved'
  )
    reasons.push('Figure referenced but no asset present')
  if (q.blocks.some((b) => b.kind === 'figure' && !b.alt?.trim()))
    reasons.push('Figure missing alternative text')
  if (!q.flags.transcriptionChecked) reasons.push('Transcription not checked')
  if (!q.flags.answerKeyChecked) reasons.push('Answer key not checked')
  if (!q.flags.alignmentChecked) reasons.push('Skill alignment not checked')
  if (!q.flags.assetsChecked) reasons.push('Assets not checked')
  return reasons
}
