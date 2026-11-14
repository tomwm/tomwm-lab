import { z } from 'zod'
import { db, DEFAULT_PREFERENCES, getPreferences } from './db'
import type { Essay } from '@/domain/types'

export const BACKUP_FORMAT_VERSION = 1

/**
 * Backups carry learner data only. Content packs are versioned separately, so
 * a restored attempt keeps pointing at the question id and version it saw —
 * and the import preview says plainly when that content is not present here.
 */
const backupSchema = z.object({
  backupFormatVersion: z.literal(BACKUP_FORMAT_VERSION),
  exportedAt: z.string(),
  app: z.literal('tara-cards'),
  attempts: z.array(z.record(z.string(), z.unknown())),
  exposures: z.array(z.record(z.string(), z.unknown())),
  sessions: z.array(z.record(z.string(), z.unknown())),
  essays: z.array(z.record(z.string(), z.unknown())),
  reviewStates: z.array(z.record(z.string(), z.unknown())),
  selfReports: z.array(z.record(z.string(), z.unknown())),
  preferences: z.record(z.string(), z.unknown()),
  packs: z.array(z.record(z.string(), z.unknown())).default([]),
})

export type Backup = z.infer<typeof backupSchema>

export async function exportBackup(): Promise<Backup> {
  const [attempts, exposures, sessions, essays, reviewStates, selfReports, preferences, packs] =
    await Promise.all([
      db.attempts.toArray(),
      db.exposures.toArray(),
      db.sessions.toArray(),
      db.essays.toArray(),
      db.reviewStates.toArray(),
      db.selfReports.toArray(),
      getPreferences(),
      db.packs.toArray(),
    ])
  return {
    backupFormatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'tara-cards',
    attempts,
    exposures,
    sessions,
    essays,
    reviewStates,
    selfReports,
    preferences,
    packs,
  } as unknown as Backup
}

export interface ImportPreview {
  ok: boolean
  errors: string[]
  backup: Backup | null
  incoming: Record<string, number>
  current: Record<string, number>
  /** Rows whose ids already exist here; merge keeps the local copy. */
  collisions: Record<string, number>
  /** Question ids referenced by incoming attempts that this build has no content for. */
  unknownQuestionIds: string[]
}

export async function previewImport(
  raw: unknown,
  knownQuestionIds: ReadonlySet<string>,
): Promise<ImportPreview> {
  const parsed = backupSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      backup: null,
      errors: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
      incoming: {},
      current: {},
      collisions: {},
      unknownQuestionIds: [],
    }
  }
  const backup = parsed.data

  const [attempts, exposures, sessions, essays, reviewStates, selfReports] = await Promise.all([
    db.attempts.toArray(),
    db.exposures.toArray(),
    db.sessions.toArray(),
    db.essays.toArray(),
    db.reviewStates.toArray(),
    db.selfReports.toArray(),
  ])

  const idsOf = (rows: Record<string, unknown>[], key: string) =>
    new Set(rows.map((r) => String(r[key])))

  const localAttemptIds = idsOf(attempts as unknown as Record<string, unknown>[], 'id')
  const localEssayIds = idsOf(essays as unknown as Record<string, unknown>[], 'id')
  const localSessionIds = idsOf(sessions as unknown as Record<string, unknown>[], 'id')
  const localExposureIds = idsOf(exposures as unknown as Record<string, unknown>[], 'id')
  const localReviewIds = idsOf(reviewStates as unknown as Record<string, unknown>[], 'groupId')
  const localSelfIds = idsOf(selfReports as unknown as Record<string, unknown>[], 'id')

  const count = (rows: Record<string, unknown>[], key: string, local: Set<string>) =>
    rows.filter((r) => local.has(String(r[key]))).length

  const unknown = new Set<string>()
  for (const a of backup.attempts) {
    const qid = String(a.questionId ?? '')
    if (qid && !knownQuestionIds.has(qid)) unknown.add(qid)
  }

  return {
    ok: true,
    backup,
    errors: [],
    incoming: {
      attempts: backup.attempts.length,
      exposures: backup.exposures.length,
      sessions: backup.sessions.length,
      essays: backup.essays.length,
      reviewStates: backup.reviewStates.length,
      selfReports: backup.selfReports.length,
      packs: backup.packs.length,
    },
    current: {
      attempts: attempts.length,
      exposures: exposures.length,
      sessions: sessions.length,
      essays: essays.length,
      reviewStates: reviewStates.length,
      selfReports: selfReports.length,
    },
    collisions: {
      attempts: count(backup.attempts, 'id', localAttemptIds),
      exposures: count(backup.exposures, 'id', localExposureIds),
      sessions: count(backup.sessions, 'id', localSessionIds),
      essays: count(backup.essays, 'id', localEssayIds),
      reviewStates: count(backup.reviewStates, 'groupId', localReviewIds),
      selfReports: count(backup.selfReports, 'id', localSelfIds),
    },
    unknownQuestionIds: [...unknown],
  }
}

export type ImportMode = 'merge' | 'replace'

/**
 * Merge keeps anything already here and adds what is missing.
 * Replace wipes local learner data first, and the caller must confirm it by
 * typing the word REPLACE — nothing here does that silently.
 */
export async function applyImport(backup: Backup, mode: ImportMode): Promise<void> {
  await db.transaction(
    'rw',
    [db.attempts, db.exposures, db.sessions, db.essays, db.reviewStates, db.selfReports, db.preferences, db.packs],
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.attempts.clear(),
          db.exposures.clear(),
          db.sessions.clear(),
          db.essays.clear(),
          db.reviewStates.clear(),
          db.selfReports.clear(),
          db.packs.clear(),
        ])
      }
      const put = mode === 'replace' ? 'bulkPut' : 'bulkAdd'
      const opts = mode === 'replace' ? undefined : { allKeys: false }
      const safe = async (fn: () => Promise<unknown>) => {
        try {
          await fn()
        } catch {
          /* bulkAdd rejects existing keys in merge mode; keeping the local row is intended. */
        }
      }
      await safe(() => db.attempts[put](backup.attempts as never, opts as never))
      await safe(() => db.exposures[put](backup.exposures as never, opts as never))
      await safe(() => db.sessions[put](backup.sessions as never, opts as never))
      await safe(() => db.essays[put](backup.essays as never, opts as never))
      await safe(() => db.reviewStates[put](backup.reviewStates as never, opts as never))
      await safe(() => db.selfReports[put](backup.selfReports as never, opts as never))
      await safe(() => db.packs[put](backup.packs as never, opts as never))
      if (mode === 'replace') {
        await db.preferences.put({ ...DEFAULT_PREFERENCES, ...backup.preferences, id: 'singleton' })
      }
    },
  )
}

/** Plain-text escape hatch, so an essay is never trapped inside the app. */
export function essayToPlainText(essay: Essay, promptStatement: string): string {
  const lines = [
    'TARA Cards — essay export',
    `Prompt: ${promptStatement}`,
    `Started: ${new Date(essay.createdAt).toLocaleString('en-GB')}`,
    `Words: ${essay.wordCount}`,
    '',
    '--- Plan ---',
    essay.plan || '(no plan)',
    '',
    '--- Current draft ---',
    essay.text || '(empty)',
  ]
  for (const [i, rev] of essay.revisions.entries()) {
    lines.push(
      '',
      `--- Submission ${i + 1} (${new Date(rev.at).toLocaleString('en-GB')}, ${rev.wordCount} words${rev.truncated ? ', truncated at the limit' : ''}) ---`,
      rev.text,
    )
    if (rev.truncated && rev.archivedFullText) {
      lines.push('', `--- Submission ${i + 1}: full text as written (archived) ---`, rev.archivedFullText)
    }
  }
  return lines.join('\n')
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  triggerDownload(blob, filename)
}

export function downloadText(text: string, filename: string): void {
  triggerDownload(new Blob([text], { type: 'text/plain' }), filename)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
