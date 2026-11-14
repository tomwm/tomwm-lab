import { contentPackSchema, type ContentPack } from './schema'
import type { Question } from '@/domain/types'
import { quarantineReasons } from '@/domain/eligibility'

export interface ValidationIssue {
  /** Dotted path into the pack, so the error points at a real field. */
  path: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  ok: boolean
  pack: ContentPack | null
  issues: ValidationIssue[]
  /** Items that parsed but were forced to `quarantined`, with reasons. */
  quarantined: { questionId: string; reasons: string[] }[]
}

/**
 * Parse and check a content pack.
 *
 * A pack that fails is rejected outright with field-level errors. A pack that
 * parses may still contain items that cannot be trusted; those are quarantined
 * rather than dropped, so the coverage report can explain what is missing.
 */
export function validateContentPack(input: unknown, knownSkillIds: readonly string[]): ValidationResult {
  const parsed = contentPackSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      pack: null,
      quarantined: [],
      issues: parsed.error.issues.map((i) => ({
        path: i.path.join('.') || '(root)',
        message: i.message,
        severity: 'error' as const,
      })),
    }
  }

  const pack = resolveAssets(parsed.data)
  const issues: ValidationIssue[] = []
  const sourceIds = new Set(pack.sources.map((s) => s.id))
  const questionIds = new Set<string>()
  const quarantined: { questionId: string; reasons: string[] }[] = []

  for (const [i, s] of pack.sources.entries()) {
    if (s.contentUse === 'unknown' && s.importStatus !== 'not-imported') {
      issues.push({
        path: `sources.${i}.contentUse`,
        message: `Source "${s.id}" has unknown content-use status but is marked as imported. Unknown permission defaults to link-only.`,
        severity: 'error',
      })
    }
  }

  for (const [i, q] of pack.questions.entries()) {
    const at = `questions.${i}`
    if (questionIds.has(q.id)) {
      issues.push({ path: `${at}.id`, message: `Duplicate question id "${q.id}"`, severity: 'error' })
    }
    questionIds.add(q.id)

    if (q.provenance === 'official' && !sourceIds.has(q.locator.sourceId)) {
      issues.push({
        path: `${at}.locator.sourceId`,
        message: `Unknown source "${q.locator.sourceId}". Every official question must name a source in this pack.`,
        severity: 'error',
      })
    }
    if (!knownSkillIds.includes(q.primarySkillId)) {
      issues.push({
        path: `${at}.primarySkillId`,
        message: `Unknown skill "${q.primarySkillId}"`,
        severity: 'error',
      })
    }
    if (q.answerOptionId && !q.options.some((o) => o.id === q.answerOptionId)) {
      issues.push({
        path: `${at}.answerOptionId`,
        message: `Answer "${q.answerOptionId}" is not one of this question's options`,
        severity: 'error',
      })
    }
    if (q.explanation.distractors.some((d) => !q.options.some((o) => o.id === d.optionId))) {
      issues.push({
        path: `${at}.explanation.distractors`,
        message: 'A distractor note refers to an option that does not exist',
        severity: 'error',
      })
    }
    if (q.distributionMode === 'interactive-approved') {
      const source = pack.sources.find((s) => s.id === q.locator.sourceId)
      if (q.provenance === 'official' && source && source.contentUse !== 'interactive-approved') {
        issues.push({
          path: `${at}.distributionMode`,
          message: `Question is marked interactive but source "${source.id}" is "${source.contentUse}". Public reachability is not a redistribution licence.`,
          severity: 'error',
        })
      }
    }

    const reasons = quarantineReasons(q as Question)
    if (reasons.length && q.availability === 'interactive') {
      quarantined.push({ questionId: q.id, reasons })
      issues.push({
        path: `${at}.availability`,
        message: `Cannot enter scored practice: ${reasons.join('; ')}`,
        severity: 'warning',
      })
    }
  }

  const promptIds = new Set<string>()
  for (const [i, p] of pack.writingPrompts.entries()) {
    if (promptIds.has(p.id)) {
      issues.push({
        path: `writingPrompts.${i}.id`,
        message: `Duplicate prompt id "${p.id}"`,
        severity: 'error',
      })
    }
    promptIds.add(p.id)
    if (p.availability === 'interactive' && p.coaching.status === 'none' && p.coaching.checklist.length === 0) {
      issues.push({
        path: `writingPrompts.${i}.coaching`,
        message: 'An interactive prompt needs at least its own review checklist',
        severity: 'warning',
      })
    }
  }

  return {
    ok: !issues.some((i) => i.severity === 'error'),
    pack,
    issues,
    quarantined,
  }
}

/**
 * Replace figure `assetId` references with the shared image. The same string is
 * assigned to every block that uses it, so nothing is copied in memory. A
 * reference to a missing asset leaves the figure without an image, which the
 * eligibility checks then quarantine.
 */
function resolveAssets(pack: ContentPack): ContentPack {
  const assets = pack.assets ?? {}
  if (!Object.keys(assets).length) return pack
  const resolve = <B extends { kind: string }>(blocks: B[]): B[] =>
    blocks.map((b) => {
      if (b.kind !== 'figure') return b
      const fig = b as unknown as { assetId?: string; svg?: string }
      if (!fig.assetId || fig.svg) return b
      return { ...b, svg: assets[fig.assetId] }
    })
  return {
    ...pack,
    questions: pack.questions.map((q) => ({ ...q, blocks: resolve(q.blocks) })),
  }
}

/** Apply the validator's findings: quarantined items can never be practised. */
export function applyQuarantine(pack: ContentPack, result: ValidationResult): ContentPack {
  if (!result.quarantined.length) return pack
  const byId = new Map(result.quarantined.map((q) => [q.questionId, q.reasons]))
  return {
    ...pack,
    questions: pack.questions.map((q) => {
      const reasons = byId.get(q.id)
      if (!reasons) return q
      return { ...q, availability: 'quarantined' as const, quarantineReason: reasons.join('; ') }
    }),
  }
}

/** Normalised hash for exact-duplicate detection across packs. */
export function contentHash(q: Pick<Question, 'blocks' | 'options'>): string {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').replace(/[^\p{L}\p{N} ]/gu, '').trim()
  const parts: string[] = []
  for (const b of q.blocks) {
    if (b.kind === 'paragraph' || b.kind === 'passage') parts.push(norm(b.text))
    if (b.kind === 'list') parts.push(b.items.map(norm).join('|'))
    if (b.kind === 'table') parts.push([b.headers.join('|'), ...b.rows.map((r) => r.join('|'))].map(norm).join('||'))
    if (b.kind === 'figure') parts.push(norm(b.alt))
  }
  for (const o of q.options) {
    for (const b of o.blocks) if (b.kind === 'paragraph' || b.kind === 'passage') parts.push(norm(b.text))
  }
  const joined = parts.join('~')
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < joined.length; i++) {
    h1 = Math.imul(h1 ^ joined.charCodeAt(i), 16777619) >>> 0
    h2 = Math.imul(h2 + joined.charCodeAt(i) * (i + 1), 2246822519) >>> 0
  }
  return `h${h1.toString(16)}${h2.toString(16)}`
}

/** Exact duplicates get one group; variants need a human to confirm the link. */
export function detectExactDuplicates(questions: readonly Question[]): Map<string, string[]> {
  const byHash = new Map<string, string[]>()
  for (const q of questions) {
    const h = contentHash(q)
    byHash.set(h, (byHash.get(h) ?? []).concat(q.id))
  }
  return new Map([...byHash].filter(([, ids]) => ids.length > 1))
}
