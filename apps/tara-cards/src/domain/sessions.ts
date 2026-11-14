import type {
  ComponentId,
  Question,
  Session,
  SessionMode,
  SessionStage,
  TimingSetting,
  WritingPrompt,
} from './types'
import { isInteractive, isPromptUsable, isTaraFormat } from './eligibility'
import { makeRng, newId, seededShuffle } from './random'
import {
  MINUTE_MS,
  MODULE_MINUTES,
  MODULE_QUESTION_COUNT,
  WRITING_PRESET_MINUTES,
  WRITING_PROMPT_CHOICES,
} from './timing'

export const DEFAULT_TIMING: TimingSetting = { kind: 'untimed', multiplier: 1, pausable: false }
export const STRICT_TIMING: TimingSetting = { kind: 'strict', multiplier: 1, pausable: false }

export function allowedMsFor(minutes: number, timing: TimingSetting): number {
  return Math.round(minutes * MINUTE_MS * timing.multiplier)
}

function blankSession(args: {
  mode: SessionMode
  seed: string
  timing: TimingSetting
  stages: SessionStage[]
  exposedGroupsAtStart: string[]
  requestedSkillIds?: string[]
  disclosedSeenCount?: number
  contentVersions?: Record<string, number>
  now: number
}): Session {
  return {
    id: newId('ses'),
    mode: args.mode,
    createdAt: args.now,
    seed: args.seed,
    timing: args.timing,
    stages: args.stages,
    activeStageIndex: 0,
    answers: {},
    flagged: {},
    status: 'active',
    submittedAt: null,
    exposedGroupsAtStart: args.exposedGroupsAtStart,
    requestedSkillIds: args.requestedSkillIds ?? [],
    disclosedSeenCount: args.disclosedSeenCount ?? 0,
    essayId: null,
    contentVersions: args.contentVersions ?? {},
  }
}

function versionMap(items: readonly { id: string; version: number }[]): Record<string, number> {
  return Object.fromEntries(items.map((i) => [i.id, i.version]))
}

/** A learning session: untimed by default, answers checked one at a time. */
export function buildLearningSession(args: {
  mode: Extract<SessionMode, 'quick' | 'custom' | 'diagnostic' | 'review'>
  questions: readonly Question[]
  componentId: ComponentId
  timing: TimingSetting
  seed: string
  exposedGroupsAtStart: string[]
  requestedSkillIds?: string[]
  now: number
}): Session {
  const stage: SessionStage = {
    id: newId('stg'),
    kind: 'module',
    label: 'Practice',
    componentId: args.componentId,
    itemIds: args.questions.map((q) => q.id),
    itemVersions: versionMap(args.questions),
    allowedMs: 0,
    startedAt: args.now,
    deadlineAt: null,
    submittedAt: null,
    status: 'active',
    pausedMs: 0,
    pausedAt: null,
  }
  return blankSession({
    ...args,
    stages: [stage],
    contentVersions: versionMap(args.questions),
  })
}

/** A single strictly timed module: current TARA length and timing. */
export function buildTimedModule(args: {
  questions: readonly Question[]
  componentId: Exclude<ComponentId, 'writing'>
  timing: TimingSetting
  seed: string
  exposedGroupsAtStart: string[]
  disclosedSeenCount: number
  now: number
}): Session {
  const stage: SessionStage = {
    id: newId('stg'),
    kind: 'module',
    label: `Timed module — ${args.questions.length} questions`,
    componentId: args.componentId,
    itemIds: args.questions.map((q) => q.id),
    itemVersions: versionMap(args.questions),
    allowedMs: allowedMsFor(MODULE_MINUTES, args.timing),
    startedAt: args.now,
    deadlineAt: args.now + allowedMsFor(MODULE_MINUTES, args.timing),
    submittedAt: null,
    status: 'active',
    pausedMs: 0,
    pausedAt: null,
  }
  return blankSession({
    mode: 'timed-module',
    seed: args.seed,
    timing: args.timing,
    stages: [stage],
    exposedGroupsAtStart: args.exposedGroupsAtStart,
    disclosedSeenCount: args.disclosedSeenCount,
    contentVersions: versionMap(args.questions),
    now: args.now,
  })
}

/* ------------------------------------------------------------------ */
/* Full rehearsal                                                      */
/* ------------------------------------------------------------------ */

export interface RehearsalAvailability {
  available: boolean
  /** Per reasoning component: how many approved unique items exist. */
  counts: { componentId: Exclude<ComponentId, 'writing'>; approved: number; heldOut: number }[]
  promptCount: number
  /** Exact, itemised reasons it cannot start. */
  shortfalls: string[]
  /** Items that would be reused despite having been seen already. */
  seenReuseCount: number
}

function uniqueByGroup(questions: readonly Question[]): Question[] {
  const seen = new Set<string>()
  const out: Question[] = []
  for (const q of questions) {
    if (seen.has(q.duplicateGroupId)) continue
    seen.add(q.duplicateGroupId)
    out.push(q)
  }
  return out
}

export function assessRehearsal(args: {
  questions: readonly Question[]
  prompts: readonly WritingPrompt[]
  exposedGroups: ReadonlySet<string>
  allowFixtures: boolean
}): RehearsalAvailability {
  const components: Exclude<ComponentId, 'writing'>[] = ['critical-thinking', 'problem-solving']
  const shortfalls: string[] = []
  const counts: RehearsalAvailability['counts'] = []
  let seenReuseCount = 0

  for (const componentId of components) {
    const pool = uniqueByGroup(
      args.questions.filter(
        (q) =>
          q.componentId === componentId &&
          isInteractive(q) &&
          isTaraFormat(q) &&
          (args.allowFixtures || q.provenance !== 'app-fixture'),
      ),
    )
    const heldOut = pool.filter((q) => q.reservedForMock && !args.exposedGroups.has(q.duplicateGroupId))
    const unseen = pool.filter((q) => !args.exposedGroups.has(q.duplicateGroupId))
    counts.push({ componentId, approved: pool.length, heldOut: heldOut.length })

    if (pool.length < MODULE_QUESTION_COUNT) {
      shortfalls.push(
        `${labelFor(componentId)}: ${pool.length} of ${MODULE_QUESTION_COUNT} approved questions available.`,
      )
    } else if (unseen.length < MODULE_QUESTION_COUNT) {
      seenReuseCount += MODULE_QUESTION_COUNT - unseen.length
    }
  }

  const prompts = args.prompts.filter(
    (p) => isPromptUsable(p) && (args.allowFixtures || p.provenance !== 'app-fixture'),
  )
  if (prompts.length < WRITING_PROMPT_CHOICES) {
    shortfalls.push(
      `Writing: ${prompts.length} of ${WRITING_PROMPT_CHOICES} eligible prompts available.`,
    )
  }

  return {
    available: shortfalls.length === 0,
    counts,
    promptCount: prompts.length,
    shortfalls,
    seenReuseCount,
  }
}

function labelFor(componentId: ComponentId): string {
  if (componentId === 'critical-thinking') return 'Critical Thinking'
  if (componentId === 'problem-solving') return 'Problem Solving'
  return 'Writing'
}

/**
 * Pick 22 items per reasoning component, preferring held-out mock material and
 * then unseen items, and only then reusing something already met.
 */
export function pickRehearsalItems(
  questions: readonly Question[],
  componentId: Exclude<ComponentId, 'writing'>,
  exposedGroups: ReadonlySet<string>,
  seed: string,
  allowFixtures: boolean,
): Question[] {
  const rng = makeRng(`${seed}:${componentId}`)
  const pool = uniqueByGroup(
    seededShuffle(
      questions.filter(
        (q) =>
          q.componentId === componentId &&
          isInteractive(q) &&
          isTaraFormat(q) &&
          (allowFixtures || q.provenance !== 'app-fixture'),
      ),
      rng,
    ),
  )
  const heldOutUnseen = pool.filter((q) => q.reservedForMock && !exposedGroups.has(q.duplicateGroupId))
  const otherUnseen = pool.filter((q) => !q.reservedForMock && !exposedGroups.has(q.duplicateGroupId))
  const seen = pool.filter((q) => exposedGroups.has(q.duplicateGroupId))
  return heldOutUnseen.concat(otherUnseen, seen).slice(0, MODULE_QUESTION_COUNT)
}

export function buildFullRehearsal(args: {
  questions: readonly Question[]
  prompts: readonly WritingPrompt[]
  exposedGroups: ReadonlySet<string>
  timing: TimingSetting
  seed: string
  allowFixtures: boolean
  now: number
}): { session: Session; promptIds: string[]; seenReuseCount: number } {
  const ct = pickRehearsalItems(args.questions, 'critical-thinking', args.exposedGroups, args.seed, args.allowFixtures)
  const ps = pickRehearsalItems(args.questions, 'problem-solving', args.exposedGroups, args.seed, args.allowFixtures)
  const rng = makeRng(`${args.seed}:prompts`)
  const promptIds = seededShuffle(
    args.prompts.filter((p) => isPromptUsable(p) && (args.allowFixtures || p.provenance !== 'app-fixture')),
    rng,
  )
    .slice(0, WRITING_PROMPT_CHOICES)
    .map((p) => p.id)

  const moduleMs = allowedMsFor(MODULE_MINUTES, args.timing)
  const writingMs = allowedMsFor(WRITING_PRESET_MINUTES, args.timing)

  const stages: SessionStage[] = [
    {
      id: newId('stg'),
      kind: 'module',
      label: 'Module 1 — Critical Thinking',
      componentId: 'critical-thinking',
      itemIds: ct.map((q) => q.id),
      itemVersions: versionMap(ct),
      allowedMs: moduleMs,
      startedAt: args.now,
      deadlineAt: args.now + moduleMs,
      submittedAt: null,
      status: 'active',
      pausedMs: 0,
      pausedAt: null,
    },
    {
      id: newId('stg'),
      kind: 'module',
      label: 'Module 2 — Problem Solving',
      componentId: 'problem-solving',
      itemIds: ps.map((q) => q.id),
      itemVersions: versionMap(ps),
      allowedMs: moduleMs,
      startedAt: null,
      deadlineAt: null,
      submittedAt: null,
      status: 'pending',
      pausedMs: 0,
      pausedAt: null,
    },
    {
      id: newId('stg'),
      kind: 'writing',
      label: 'Writing — one prompt from three',
      componentId: 'writing',
      itemIds: promptIds,
      itemVersions: Object.fromEntries(
        args.prompts.filter((p) => promptIds.includes(p.id)).map((p) => [p.id, p.version]),
      ),
      allowedMs: writingMs,
      startedAt: null,
      deadlineAt: null,
      submittedAt: null,
      status: 'pending',
      pausedMs: 0,
      pausedAt: null,
    },
  ]

  const seenReuseCount = [...ct, ...ps].filter((q) => args.exposedGroups.has(q.duplicateGroupId)).length

  return {
    session: blankSession({
      mode: 'full-rehearsal',
      seed: args.seed,
      timing: args.timing,
      stages,
      exposedGroupsAtStart: [...args.exposedGroups].sort(),
      disclosedSeenCount: seenReuseCount,
      contentVersions: { ...versionMap(ct), ...versionMap(ps) },
      now: args.now,
    }),
    promptIds,
    seenReuseCount,
  }
}

/* ------------------------------------------------------------------ */
/* Short diagnostic                                                    */
/* ------------------------------------------------------------------ */

export interface DiagnosticPlan {
  available: boolean
  items: Question[]
  /** Skills with no fresh item to offer, named rather than silently skipped. */
  missingSkillIds: string[]
  note: string
}

/**
 * 7 fresh Critical Thinking items (one per primary skill) and 6 fresh Problem
 * Solving items (two per primary skill), where coverage allows. This is an
 * initial practice snapshot over very small samples, not a mock or an
 * ability estimate.
 */
export function planDiagnostic(args: {
  questions: readonly Question[]
  ctSkillIds: readonly string[]
  psSkillIds: readonly string[]
  exposedGroups: ReadonlySet<string>
  seed: string
  allowFixtures: boolean
}): DiagnosticPlan {
  const rng = makeRng(`${args.seed}:diagnostic`)
  const usedGroups = new Set<string>()
  const items: Question[] = []
  const missingSkillIds: string[] = []

  const pickFor = (skillId: string, want: number) => {
    const pool = seededShuffle(
      args.questions.filter(
        (q) =>
          q.primarySkillId === skillId &&
          isInteractive(q) &&
          !q.reservedForMock &&
          !args.exposedGroups.has(q.duplicateGroupId) &&
          !usedGroups.has(q.duplicateGroupId) &&
          (args.allowFixtures || q.provenance !== 'app-fixture'),
      ),
      rng,
    )
    const taken = pool.slice(0, want)
    for (const q of taken) usedGroups.add(q.duplicateGroupId)
    if (taken.length < want) missingSkillIds.push(skillId)
    items.push(...taken)
  }

  for (const s of args.ctSkillIds) pickFor(s, 1)
  for (const s of args.psSkillIds) pickFor(s, 2)

  const wanted = args.ctSkillIds.length + args.psSkillIds.length * 2
  return {
    available: missingSkillIds.length === 0 && items.length === wanted,
    items: seededShuffle(items, rng),
    missingSkillIds,
    note:
      missingSkillIds.length === 0
        ? 'An initial practice snapshot over small samples. It is not a mock and not a reliable ability estimate.'
        : 'There are not enough unseen questions to cover every skill once.',
  }
}
