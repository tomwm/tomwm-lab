import type { Session, SessionStage } from './types'

export const MINUTE_MS = 60 * 1000

/** Verified format: two 22-question modules, 40 minutes each. [S1] */
export const MODULE_QUESTION_COUNT = 22
export const MODULE_MINUTES = 40

/**
 * The Writing Task is 40 minutes, one prompt from three, at most 750 words.
 * [S4, S5] UAT-UK recommends planning for 5 to 10 minutes before writing [S5];
 * the planning preset sits inside that range.
 */
export const WRITING_PRESET_MINUTES = 40
export const WRITING_PLAN_PRESET_MINUTES = 8
export const WRITING_PROMPT_CHOICES = 3

/**
 * Remaining time is always derived from the persisted absolute deadline, never
 * from a counter that decrements in memory. Closing the tab does not buy time.
 */
export function stageRemainingMs(stage: SessionStage, now: number): number {
  if (stage.status === 'submitted' || stage.status === 'expired') return 0
  if (stage.deadlineAt === null) return stage.allowedMs
  const reference = stage.pausedAt ?? now
  return Math.max(0, stage.deadlineAt + stage.pausedMs - reference)
}

export function stageEndedAt(stage: SessionStage): number | null {
  if (stage.status === 'submitted' || stage.status === 'expired') {
    return stage.submittedAt ?? stage.deadlineAt ?? null
  }
  return null
}

export function startStage(stage: SessionStage, at: number): SessionStage {
  if (stage.status !== 'pending') return stage
  return {
    ...stage,
    status: 'active',
    startedAt: at,
    deadlineAt: at + stage.allowedMs,
  }
}

export function submitStage(stage: SessionStage, at: number): SessionStage {
  if (stage.status === 'submitted' || stage.status === 'expired') return stage
  return { ...stage, status: 'submitted', submittedAt: at }
}

export function pauseStage(stage: SessionStage, at: number): SessionStage {
  if (stage.status !== 'active' || stage.pausedAt !== null) return stage
  return { ...stage, pausedAt: at }
}

export function resumeStage(stage: SessionStage, at: number): SessionStage {
  if (stage.pausedAt === null) return stage
  return { ...stage, pausedMs: stage.pausedMs + (at - stage.pausedAt), pausedAt: null }
}

export interface Reconciliation {
  session: Session
  changed: boolean
  /** Stage ids that expired during this reconciliation. */
  expiredStageIds: string[]
}

/**
 * Bring a persisted session up to date with the wall clock.
 *
 * Called on load, on resume, on focus and on every tick. It cascades: if the
 * learner closed the laptop during module one of a full rehearsal, module one
 * expires at its own deadline, module two starts at that instant with its own
 * independent deadline, and it may expire too. A refresh cannot insert an
 * unlimited break between stages.
 */
export function reconcileSession(session: Session, now: number): Reconciliation {
  if (session.status === 'submitted' || session.status === 'abandoned') {
    return { session, changed: false, expiredStageIds: [] }
  }

  const stages = session.stages.slice()
  const expiredStageIds: string[] = []
  let changed = false

  for (let i = 0; i < stages.length; i++) {
    let stage = stages[i]

    if (stage.status === 'pending' && i > 0) {
      const prevEnd = stageEndedAt(stages[i - 1])
      if (prevEnd === null) break
      stage = startStage(stage, prevEnd)
      stages[i] = stage
      changed = true
    }

    if (stage.status === 'active' && stage.pausedAt === null && stage.deadlineAt !== null) {
      const effectiveDeadline = stage.deadlineAt + stage.pausedMs
      if (now >= effectiveDeadline) {
        stages[i] = { ...stage, status: 'expired', submittedAt: effectiveDeadline }
        expiredStageIds.push(stage.id)
        changed = true
        continue
      }
    }

    if (stage.status === 'pending' || stage.status === 'active') break
  }

  const firstOpen = stages.findIndex((s) => s.status === 'pending' || s.status === 'active')
  const activeStageIndex = firstOpen === -1 ? stages.length - 1 : firstOpen
  const allDone = firstOpen === -1
  const anyExpired = stages.some((s) => s.status === 'expired')

  const next: Session = {
    ...session,
    stages,
    activeStageIndex,
    status: allDone ? (anyExpired ? 'expired' : 'submitted') : session.status,
    submittedAt: allDone ? (session.submittedAt ?? Math.max(...stages.map((s) => s.submittedAt ?? 0))) : session.submittedAt,
  }

  if (allDone && session.status !== next.status) changed = true
  if (activeStageIndex !== session.activeStageIndex) changed = true

  return { session: next, changed, expiredStageIds }
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return '—'
  const total = Math.round(ms / 1000)
  if (total < 60) return `${total}s`
  const m = Math.floor(total / 60)
  const s = total % 60
  return s ? `${m}m ${s}s` : `${m}m`
}

/** Announce only at meaningful milestones, not on every tick. */
export const TIMER_ANNOUNCE_SECONDS = [20 * 60, 10 * 60, 5 * 60, 60, 0]
