import type { Attempt, ComponentId, ErrorLabel, ProvisionalStatus } from './types'

export interface AccuracyBlock {
  n: number
  correct: number
  /** Null rather than 0 when there is nothing to divide by. */
  accuracy: number | null
}

export interface SkillStats {
  skillId: string
  fresh: AccuracyBlock
  repeat: AccuracyBlock
  unscored: number
  /** Median duration over fresh attempts, in ms. Null when none. */
  medianTimeMs: number | null
  errorLabels: Record<ErrorLabel, number>
  /** Accuracy over the most recent 10 fresh attempts. */
  recentFresh: AccuracyBlock
  status: ProvisionalStatus
}

/**
 * Evidence thresholds. These are product settings chosen for this app, not
 * validated readiness judgements, and the underlying fraction is always shown.
 */
export const EVIDENCE = {
  /** Fresh first attempts needed before any judgement is offered at all. */
  minForStatus: 10,
  /** Window the status is computed over. */
  recentWindow: 10,
  consistentThreshold: 0.8,
  improvingThreshold: 0.5,
} as const

const EMPTY_LABELS: Record<ErrorLabel, number> = {
  'misread-prompt': 0,
  'missed-condition': 0,
  'wrong-method': 0,
  calculation: 0,
  'time-pressure': 0,
  guessed: 0,
  other: 0,
}

function block(items: readonly Attempt[]): AccuracyBlock {
  const scored = items.filter((a) => a.outcome === 'correct' || a.outcome === 'incorrect')
  const correct = scored.filter((a) => a.outcome === 'correct').length
  return {
    n: scored.length,
    correct,
    accuracy: scored.length ? correct / scored.length : null,
  }
}

function median(values: number[]): number | null {
  if (!values.length) return null
  const s = values.slice().sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}

export function statusFor(recent: AccuracyBlock, freshTotal: number): ProvisionalStatus {
  if (freshTotal === 0) return 'not-started'
  if (freshTotal < EVIDENCE.minForStatus) return 'gathering-evidence'
  const acc = recent.accuracy ?? 0
  if (acc >= EVIDENCE.consistentThreshold) return 'consistent-recently'
  if (acc >= EVIDENCE.improvingThreshold) return 'improving'
  return 'needs-practice'
}

export const STATUS_LABEL: Record<ProvisionalStatus, string> = {
  'not-started': 'Not started',
  'gathering-evidence': 'Gathering evidence',
  'needs-practice': 'Needs practice',
  improving: 'Improving',
  'consistent-recently': 'Consistent recently',
}

/** Attempts that count towards reported performance. */
export function reportableAttempts(
  attempts: readonly Attempt[],
  includeFixtures: boolean,
): Attempt[] {
  return includeFixtures
    ? attempts.slice()
    : attempts.filter((a) => a.provenanceSnapshot !== 'app-fixture')
}

export function statsForSkill(attempts: readonly Attempt[], skillId: string): SkillStats {
  const mine = attempts
    .filter((a) => a.primarySkillIdSnapshot === skillId)
    .sort((a, b) => a.submittedAt - b.submittedAt)

  const fresh = mine.filter((a) => a.freshFirstAttempt)
  const repeat = mine.filter((a) => !a.freshFirstAttempt && a.outcome !== 'unscored')
  const recent = fresh.slice(-EVIDENCE.recentWindow)

  const errorLabels = { ...EMPTY_LABELS }
  for (const a of mine) for (const l of a.errorLabels) errorLabels[l]++

  const freshBlock = block(fresh)
  return {
    skillId,
    fresh: freshBlock,
    repeat: block(repeat),
    unscored: mine.filter((a) => a.outcome === 'unscored').length,
    medianTimeMs: median(fresh.map((a) => a.durationMs).filter((d) => d > 0)),
    errorLabels,
    recentFresh: block(recent),
    status: statusFor(block(recent), freshBlock.n),
  }
}

export interface ComponentStats {
  componentId: ComponentId
  fresh: AccuracyBlock
  repeat: AccuracyBlock
  unscored: number
  medianTimeMs: number | null
  errorLabels: Record<ErrorLabel, number>
  attemptCount: number
}

export function statsForComponent(
  attempts: readonly Attempt[],
  componentId: ComponentId,
): ComponentStats {
  const mine = attempts.filter((a) => a.componentIdSnapshot === componentId)
  const fresh = mine.filter((a) => a.freshFirstAttempt)
  const repeat = mine.filter((a) => !a.freshFirstAttempt && a.outcome !== 'unscored')
  const errorLabels = { ...EMPTY_LABELS }
  for (const a of mine) for (const l of a.errorLabels) errorLabels[l]++
  return {
    componentId,
    fresh: block(fresh),
    repeat: block(repeat),
    unscored: mine.filter((a) => a.outcome === 'unscored').length,
    medianTimeMs: median(fresh.map((a) => a.durationMs).filter((d) => d > 0)),
    errorLabels,
    attemptCount: mine.length,
  }
}

/** Evidence map consumed by practice selection. */
export function evidenceBySkill(
  attempts: readonly Attempt[],
): Map<string, { freshCount: number; recentAccuracy: number | null }> {
  const bySkill = new Map<string, Attempt[]>()
  for (const a of attempts) {
    if (!a.freshFirstAttempt) continue
    const list = bySkill.get(a.primarySkillIdSnapshot) ?? []
    list.push(a)
    bySkill.set(a.primarySkillIdSnapshot, list)
  }
  const out = new Map<string, { freshCount: number; recentAccuracy: number | null }>()
  for (const [skillId, list] of bySkill) {
    list.sort((a, b) => a.submittedAt - b.submittedAt)
    const recent = block(list.slice(-EVIDENCE.recentWindow))
    out.set(skillId, { freshCount: list.length, recentAccuracy: recent.accuracy })
  }
  return out
}

export interface Suggestion {
  skillId: string
  componentId: ComponentId
  /** A plain reason the learner can check against their own history. */
  reason: string
}

/**
 * One suggested next session, justified by the learner's actual attempts.
 * Returns null rather than inventing a recommendation from no data.
 */
export function suggestNextSkill(
  attempts: readonly Attempt[],
  knownSkills: readonly { id: string; componentId: ComponentId; title: string }[],
): Suggestion | null {
  const recentWindow = 5
  let worst: { skill: (typeof knownSkills)[number]; wrong: number; n: number } | null = null

  for (const skill of knownSkills) {
    const fresh = attempts
      .filter((a) => a.primarySkillIdSnapshot === skill.id && a.freshFirstAttempt)
      .sort((a, b) => a.submittedAt - b.submittedAt)
      .slice(-recentWindow)
    if (fresh.length < 2) continue
    const wrong = fresh.filter((a) => a.outcome === 'incorrect').length
    if (wrong === 0) continue
    if (!worst || wrong / fresh.length > worst.wrong / worst.n) {
      worst = { skill, wrong, n: fresh.length }
    }
  }

  if (worst) {
    return {
      skillId: worst.skill.id,
      componentId: worst.skill.componentId,
      reason: `${worst.wrong} of your last ${worst.n} fresh ${worst.n === 1 ? 'attempt was' : 'attempts were'} incorrect.`,
    }
  }

  const untouched = knownSkills.find(
    (s) => !attempts.some((a) => a.primarySkillIdSnapshot === s.id),
  )
  if (untouched) {
    return {
      skillId: untouched.id,
      componentId: untouched.componentId,
      reason: 'You have not attempted a question on this skill yet.',
    }
  }
  return null
}
