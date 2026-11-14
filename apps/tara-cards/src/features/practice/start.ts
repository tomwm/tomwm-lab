import type { ComponentId, Preferences, Question, TimingSetting, WritingPrompt } from '@/domain/types'
import type { ContentIndex } from '@/content/library'
import { selectPracticeSet, type SelectionMode, type SelectionResult } from '@/domain/selection'
import {
  buildFullRehearsal,
  buildLearningSession,
  buildTimedModule,
  planDiagnostic,
} from '@/domain/sessions'
import { exposedGroupsAt } from '@/storage/repo'
import { saveSession } from '@/storage/repo'
import { newId } from '@/domain/random'
import { db } from '@/storage/db'
import { skillsForComponent } from '@/content/skills'

export interface BuildRequest {
  content: ContentIndex
  size: number
  mode: SelectionMode
  componentIds: ComponentId[]
  skillIds: string[]
  timing: TimingSetting
  prefs: Preferences
  evidence: ReadonlyMap<string, { freshCount: number; recentAccuracy: number | null }>
  seed?: string
}

/** Preview a set without creating a session, so the learner sees the trade-off first. */
export async function previewSet(req: BuildRequest): Promise<SelectionResult> {
  const now = Date.now()
  const exposed = new Set(await exposedGroupsAt(now))
  const reviewStates = await db.reviewStates.toArray()
  return selectPracticeSet({
    questions: req.content.questions,
    size: req.size,
    mode: req.mode,
    skillIds: req.skillIds,
    componentIds: req.componentIds.filter((c) => c !== 'writing'),
    exposedGroups: exposed,
    reviewStates,
    seed: req.seed ?? 'preview',
    evidence: req.evidence,
    now,
    allowFixtures: true,
  })
}

export async function startPracticeSession(
  req: BuildRequest,
  mode: 'quick' | 'custom' | 'review' = 'custom',
): Promise<{ sessionId: string; result: SelectionResult } | { error: string }> {
  const now = Date.now()
  const seed = req.seed ?? newId('seed')
  const exposedBefore = await exposedGroupsAt(now)
  const result = await previewSet({ ...req, seed })

  if (result.items.length === 0) {
    return { error: 'No questions match those filters yet.' }
  }

  const session = buildLearningSession({
    mode,
    questions: result.items,
    componentId: req.componentIds[0] ?? 'critical-thinking',
    timing: req.timing,
    seed,
    exposedGroupsAtStart: exposedBefore,
    requestedSkillIds: req.skillIds,
    now,
  })
  await saveSession(session)
  return { sessionId: session.id, result }
}

export async function startDiagnostic(content: ContentIndex, timing: TimingSetting) {
  const now = Date.now()
  const seed = newId('seed')
  const exposedBefore = await exposedGroupsAt(now)
  const plan = planDiagnostic({
    questions: content.questions,
    ctSkillIds: skillsForComponent('critical-thinking').map((s) => s.id),
    psSkillIds: skillsForComponent('problem-solving').map((s) => s.id),
    exposedGroups: new Set(exposedBefore),
    seed,
    allowFixtures: true,
  })
  if (plan.items.length === 0) return { error: plan.note, plan }
  const session = buildLearningSession({
    mode: 'diagnostic',
    questions: plan.items,
    componentId: 'critical-thinking',
    timing,
    seed,
    exposedGroupsAtStart: exposedBefore,
    now,
  })
  await saveSession(session)
  return { sessionId: session.id, plan }
}

export async function startTimedModule(args: {
  content: ContentIndex
  componentId: Exclude<ComponentId, 'writing'>
  questions: Question[]
  timing: TimingSetting
}) {
  const now = Date.now()
  const exposedBefore = await exposedGroupsAt(now)
  const exposedSet = new Set(exposedBefore)
  const session = buildTimedModule({
    questions: args.questions,
    componentId: args.componentId,
    timing: args.timing,
    seed: newId('seed'),
    exposedGroupsAtStart: exposedBefore,
    disclosedSeenCount: args.questions.filter((q) => exposedSet.has(q.duplicateGroupId)).length,
    now,
  })
  await saveSession(session)
  return session
}

export async function startRehearsal(args: {
  content: ContentIndex
  prompts: WritingPrompt[]
  timing: TimingSetting
}) {
  const now = Date.now()
  const exposedBefore = await exposedGroupsAt(now)
  const { session } = buildFullRehearsal({
    questions: args.content.questions,
    prompts: args.prompts,
    exposedGroups: new Set(exposedBefore),
    timing: args.timing,
    seed: newId('seed'),
    allowFixtures: true,
    now,
  })
  await saveSession(session)
  return session
}
