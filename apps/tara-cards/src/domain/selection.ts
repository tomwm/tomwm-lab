import type { ComponentId, Question, ReviewState } from './types'
import { isPractisable } from './eligibility'
import { makeRng, seededShuffle } from './random'

export type SelectionMode = 'mixed' | 'unseen-only' | 'review-only'

export interface SkillEvidence {
  /** Number of fresh first attempts recorded on this skill. */
  freshCount: number
  /** Accuracy over the most recent fresh attempts, or null when there are none. */
  recentAccuracy: number | null
}

export interface SelectionRequest {
  questions: readonly Question[]
  size: number
  mode: SelectionMode
  /** Empty means "any skill". */
  skillIds: readonly string[]
  /** Empty means "any reasoning component". */
  componentIds: readonly ComponentId[]
  exposedGroups: ReadonlySet<string>
  reviewStates: readonly ReviewState[]
  seed: string
  evidence: ReadonlyMap<string, SkillEvidence>
  now: number
  /** 0.6 by default: six unseen for every four reviews. */
  unseenRatio?: number
  /** Include items reserved for the full rehearsal. Off for ordinary practice. */
  allowReserved?: boolean
  /** Include labelled development fixtures in the candidate pool. */
  allowFixtures?: boolean
}

export interface SelectionResult {
  items: Question[]
  unseenCount: number
  reviewCount: number
  /** Requested size minus what could honestly be supplied. */
  shortfall: number
  /** Plain reasons, shown to the learner rather than silently patched over. */
  notes: string[]
  /** Unseen items that exist but were excluded by the current filters. */
  availableUnseen: number
  availableReviews: number
}

function matchesFilters(q: Question, req: SelectionRequest): boolean {
  if (req.componentIds.length && !req.componentIds.includes(q.componentId)) return false
  if (req.skillIds.length) {
    if (!req.skillIds.includes(q.primarySkillId)) return false
  }
  return true
}

function candidatePool(req: SelectionRequest): Question[] {
  return req.questions.filter((q) => {
    if (!isPractisable(q) && !(req.allowReserved && q.reservedForMock)) {
      if (!req.allowReserved) return false
    }
    if (!req.allowReserved && q.reservedForMock) return false
    if (!req.allowFixtures && q.provenance === 'app-fixture') return false
    return matchesFilters(q, req)
  })
}

/**
 * Rank unseen candidates: the learner's chosen skills first, then the skills
 * with the least fresh evidence, then the lowest recent accuracy. Ties are
 * broken by a seeded shuffle so the same seed reproduces the same set.
 */
function rankUnseen(items: Question[], req: SelectionRequest): Question[] {
  const rng = makeRng(`${req.seed}:unseen`)
  const shuffled = seededShuffle(items, rng)
  const order = new Map(shuffled.map((q, i) => [q.id, i]))
  const chosen = new Set(req.skillIds)
  return shuffled.slice().sort((a, b) => {
    const aChosen = chosen.size ? (chosen.has(a.primarySkillId) ? 0 : 1) : 0
    const bChosen = chosen.size ? (chosen.has(b.primarySkillId) ? 0 : 1) : 0
    if (aChosen !== bChosen) return aChosen - bChosen

    const ae = req.evidence.get(a.primarySkillId)
    const be = req.evidence.get(b.primarySkillId)
    const af = ae?.freshCount ?? 0
    const bf = be?.freshCount ?? 0
    if (af !== bf) return af - bf

    const aa = ae?.recentAccuracy ?? -1
    const ba = be?.recentAccuracy ?? -1
    // Unknown accuracy (-1) sorts first: gather evidence before re-drilling.
    if (aa !== ba) return aa - ba

    return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
  })
}

function rankReviews(items: Question[], req: SelectionRequest): Question[] {
  const dueAt = new Map(req.reviewStates.map((r) => [r.groupId, r.dueAt]))
  const rng = makeRng(`${req.seed}:review`)
  const shuffled = seededShuffle(items, rng)
  const order = new Map(shuffled.map((q, i) => [q.id, i]))
  return shuffled.slice().sort((a, b) => {
    const ad = dueAt.get(a.duplicateGroupId) ?? Number.POSITIVE_INFINITY
    const bd = dueAt.get(b.duplicateGroupId) ?? Number.POSITIVE_INFINITY
    if (ad !== bd) return ad - bd
    return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
  })
}

/** Take from a ranked list, never repeating a duplicate group within a session. */
function takeDistinctGroups(ranked: Question[], want: number, used: Set<string>): Question[] {
  const out: Question[] = []
  for (const q of ranked) {
    if (out.length >= want) break
    if (used.has(q.duplicateGroupId)) continue
    used.add(q.duplicateGroupId)
    out.push(q)
  }
  return out
}

/**
 * Build a practice set.
 *
 * The one rule this function will not break: when the learner asks for unseen
 * questions only, it never quietly substitutes something they have already
 * met. It returns a shorter set and says why.
 */
export function selectPracticeSet(req: SelectionRequest): SelectionResult {
  const notes: string[] = []
  const pool = candidatePool(req)
  const dueGroupIds = new Set(
    req.reviewStates.filter((r) => r.dueAt <= req.now).map((r) => r.groupId),
  )

  const unseen = pool.filter((q) => !req.exposedGroups.has(q.duplicateGroupId))
  const reviews = pool.filter(
    (q) => req.exposedGroups.has(q.duplicateGroupId) && dueGroupIds.has(q.duplicateGroupId),
  )

  const availableUnseen = new Set(unseen.map((q) => q.duplicateGroupId)).size
  const availableReviews = new Set(reviews.map((q) => q.duplicateGroupId)).size

  const usedGroups = new Set<string>()
  const ratio = req.unseenRatio ?? 0.6
  let wantUnseen = 0
  let wantReview = 0

  if (req.mode === 'unseen-only') {
    wantUnseen = req.size
  } else if (req.mode === 'review-only') {
    wantReview = req.size
  } else {
    wantUnseen = Math.round(req.size * ratio)
    wantReview = req.size - wantUnseen
  }

  const rankedUnseen = rankUnseen(unseen, req)
  const rankedReviews = rankReviews(reviews, req)

  let pickedUnseen = takeDistinctGroups(rankedUnseen, wantUnseen, usedGroups)
  let pickedReviews = takeDistinctGroups(rankedReviews, wantReview, usedGroups)

  if (req.mode === 'mixed') {
    // Rounding to fill the requested size is allowed in mixed mode only, and
    // only in the direction that does not turn "unseen" into a repeat.
    const deficitReview = wantReview - pickedReviews.length
    if (deficitReview > 0) {
      const extra = takeDistinctGroups(rankedUnseen, deficitReview, usedGroups)
      pickedUnseen = pickedUnseen.concat(extra)
      if (extra.length) notes.push(`Fewer reviews were due than planned, so ${extra.length} extra unseen ${extra.length === 1 ? 'question' : 'questions'} filled the set.`)
    }
    const deficitUnseen = wantUnseen - pickedUnseen.length
    if (deficitUnseen > 0) {
      const extra = takeDistinctGroups(rankedReviews, deficitUnseen, usedGroups)
      pickedReviews = pickedReviews.concat(extra)
      if (extra.length) notes.push(`Not enough unseen questions matched, so ${extra.length} due ${extra.length === 1 ? 'review' : 'reviews'} filled the set.`)
    }
  }

  if (req.mode === 'unseen-only' && pickedUnseen.length < req.size) {
    notes.push(
      `Only ${pickedUnseen.length} unseen ${pickedUnseen.length === 1 ? 'question matches' : 'questions match'} these filters. Nothing you have already seen has been added.`,
    )
  }
  if (req.mode === 'review-only' && pickedReviews.length < req.size) {
    notes.push(
      `Only ${pickedReviews.length} ${pickedReviews.length === 1 ? 'review is' : 'reviews are'} due under these filters.`,
    )
  }

  const rng = makeRng(`${req.seed}:order`)
  const items = seededShuffle(pickedUnseen.concat(pickedReviews), rng)

  return {
    items,
    unseenCount: pickedUnseen.length,
    reviewCount: pickedReviews.length,
    shortfall: Math.max(0, req.size - items.length),
    notes,
    availableUnseen,
    availableReviews,
  }
}
