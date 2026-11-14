import Dexie, { type EntityTable } from 'dexie'
import type {
  Attempt,
  Essay,
  Exposure,
  Preferences,
  ReviewState,
  SelfReport,
  Session,
} from '@/domain/types'
import { DEFAULT_TIMING } from '@/domain/sessions'

/** A content pack as stored: the raw JSON, re-validated on every load. */
export interface StoredPack {
  id: string
  name: string
  version: number
  importedAt: number
  raw: unknown
}

/** Cross-tab lock, so two tabs cannot write conflicting session state. */
export interface SessionLock {
  id: 'active-session'
  sessionId: string
  tabId: string
  heartbeatAt: number
}

/**
 * Learner data lives here; content is versioned separately in `content/`.
 * Everything is local to this browser on this device — see Settings.
 */
export class TaraDb extends Dexie {
  attempts!: EntityTable<Attempt, 'id'>
  exposures!: EntityTable<Exposure, 'id'>
  sessions!: EntityTable<Session, 'id'>
  essays!: EntityTable<Essay, 'id'>
  reviewStates!: EntityTable<ReviewState, 'groupId'>
  preferences!: EntityTable<Preferences, 'id'>
  packs!: EntityTable<StoredPack, 'id'>
  selfReports!: EntityTable<SelfReport, 'id'>
  locks!: EntityTable<SessionLock, 'id'>

  constructor(name = 'tara-cards') {
    super(name)
    this.version(1).stores({
      attempts: 'id, questionId, duplicateGroupId, sessionId, primarySkillIdSnapshot, componentIdSnapshot, submittedAt, freshFirstAttempt',
      exposures: 'id, itemId, duplicateGroupId, at, reason',
      sessions: 'id, mode, status, createdAt',
      essays: 'id, promptId, sessionId, status, createdAt',
      reviewStates: 'groupId, itemId, dueAt, stage',
      preferences: 'id',
      packs: 'id, importedAt',
      selfReports: 'id, sourceId, at',
      locks: 'id',
    })
  }
}

export const db = new TaraDb()

export const DEFAULT_PREFERENCES: Preferences = {
  id: 'singleton',
  testDate: null,
  weeklyTargetMinutes: null,
  dailyMinutes: null,
  theme: 'system',
  reducedMotion: false,
  timing: DEFAULT_TIMING,
  includeFixturesInProgress: false,
  onboardingDismissed: false,
  aiFeedbackEndpoint: null,
}

export async function getPreferences(): Promise<Preferences> {
  const stored = await db.preferences.get('singleton')
  return stored ? { ...DEFAULT_PREFERENCES, ...stored } : DEFAULT_PREFERENCES
}

export async function savePreferences(patch: Partial<Preferences>): Promise<Preferences> {
  const next = { ...(await getPreferences()), ...patch, id: 'singleton' as const }
  await db.preferences.put(next)
  return next
}
