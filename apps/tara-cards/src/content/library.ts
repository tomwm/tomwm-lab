import type { Question, Skill, Source, StudyComponent, WritingPrompt } from '@/domain/types'
import { COMPONENTS } from './components'
import { SKILLS, SKILL_BY_ID } from './skills'
import { SOURCES } from './sources'
import { FIXTURE_PROMPTS, FIXTURE_QUESTIONS, FIXTURE_SOURCE } from './fixtures'
import { applyQuarantine, detectExactDuplicates, validateContentPack } from './validate'
import type { ContentPack } from './schema'
import { isInteractive, hasExplanation } from '@/domain/eligibility'

export interface ContentIndex {
  components: StudyComponent[]
  skills: Skill[]
  sources: Source[]
  questions: Question[]
  prompts: WritingPrompt[]
  questionById: Map<string, Question>
  promptById: Map<string, WritingPrompt>
  sourceById: Map<string, Source>
  skillById: Map<string, Skill>
  /** Packs that failed validation, so Settings can explain why. */
  rejectedPacks: { id: string; issues: { path: string; message: string }[] }[]
  /** Duplicate groups the content hash found but no human has confirmed. */
  unconfirmedDuplicates: { hash: string; questionIds: string[] }[]
}

/**
 * Build the in-memory content index from the built-in content plus any
 * validated packs the learner has imported. Packs are always re-validated on
 * load: a pack that was stored before a schema change must still pass.
 */
export function buildContentIndex(packs: readonly unknown[] = []): ContentIndex {
  const sources: Source[] = [...SOURCES, FIXTURE_SOURCE]
  const questions: Question[] = [...FIXTURE_QUESTIONS]
  const prompts: WritingPrompt[] = [...FIXTURE_PROMPTS]
  const rejectedPacks: ContentIndex['rejectedPacks'] = []
  const skillIds = SKILLS.map((s) => s.id)

  for (const raw of packs) {
    const result = validateContentPack(raw, skillIds)
    if (!result.ok || !result.pack) {
      const id =
        raw && typeof raw === 'object' && 'id' in raw ? String((raw as { id: unknown }).id) : 'unknown pack'
      rejectedPacks.push({
        id,
        issues: result.issues.filter((i) => i.severity === 'error').map(({ path, message }) => ({ path, message })),
      })
      continue
    }
    const pack: ContentPack = applyQuarantine(result.pack, result)
    // A pack's own source record replaces the built-in link-only entry, so an
    // imported paper shows as imported rather than as a bare link.
    for (const s of pack.sources) {
      const at = sources.findIndex((x) => x.id === s.id)
      if (at === -1) sources.push(s)
      else sources[at] = s
    }
    for (const q of pack.questions) if (!questions.some((x) => x.id === q.id)) questions.push(q as Question)
    for (const p of pack.writingPrompts)
      if (!prompts.some((x) => x.id === p.id)) prompts.push(p as WritingPrompt)
  }

  // Exact duplicates across packs that share no duplicate group need a human.
  const unconfirmedDuplicates: ContentIndex['unconfirmedDuplicates'] = []
  for (const [hash, ids] of detectExactDuplicates(questions)) {
    const groups = new Set(ids.map((id) => questions.find((q) => q.id === id)!.duplicateGroupId))
    if (groups.size > 1) unconfirmedDuplicates.push({ hash, questionIds: ids })
  }

  return {
    components: COMPONENTS,
    skills: SKILLS,
    sources,
    questions,
    prompts,
    questionById: new Map(questions.map((q) => [q.id, q])),
    promptById: new Map(prompts.map((p) => [p.id, p])),
    sourceById: new Map(sources.map((s) => [s.id, s])),
    skillById: SKILL_BY_ID,
    rejectedPacks,
    unconfirmedDuplicates,
  }
}

/* ------------------------------------------------------------------ */
/* Coverage reporting                                                  */
/* ------------------------------------------------------------------ */

export interface CoverageRow {
  skillId: string
  title: string
  componentId: string
  interactive: number
  fixtures: number
  official: number
  withExplanation: number
  quarantined: number
  reservedForMock: number
}

export interface CoverageReport {
  rows: CoverageRow[]
  totals: {
    questions: number
    interactive: number
    official: number
    officialInteractive: number
    fixtures: number
    fixturesInteractive: number
    quarantined: number
    linkOnlyQuestions: number
    missingExplanations: number
    duplicateGroups: number
    reservedForMock: number
    prompts: number
    sources: number
    linkOnlySources: number
    importedSources: number
  }
  /** Skills with no interactive question at all. */
  emptySkillIds: string[]
}

export function buildCoverageReport(index: ContentIndex): CoverageReport {
  const rows: CoverageRow[] = index.skills
    .filter((s) => s.componentId !== 'writing')
    .map((skill) => {
      const mine = index.questions.filter((q) => q.primarySkillId === skill.id)
      return {
        skillId: skill.id,
        title: skill.title,
        componentId: skill.componentId,
        interactive: mine.filter(isInteractive).length,
        fixtures: mine.filter((q) => q.provenance === 'app-fixture').length,
        official: mine.filter((q) => q.provenance === 'official').length,
        withExplanation: mine.filter(hasExplanation).length,
        quarantined: mine.filter((q) => q.availability === 'quarantined').length,
        reservedForMock: mine.filter((q) => q.reservedForMock).length,
      }
    })

  return {
    rows,
    emptySkillIds: rows.filter((r) => r.interactive === 0).map((r) => r.skillId),
    totals: {
      questions: index.questions.length,
      interactive: index.questions.filter(isInteractive).length,
      official: index.questions.filter((q) => q.provenance === 'official').length,
      officialInteractive: index.questions.filter((q) => q.provenance === 'official' && isInteractive(q))
        .length,
      fixtures: index.questions.filter((q) => q.provenance === 'app-fixture').length,
      fixturesInteractive: index.questions.filter(
        (q) => q.provenance === 'app-fixture' && isInteractive(q),
      ).length,
      quarantined: index.questions.filter((q) => q.availability === 'quarantined').length,
      linkOnlyQuestions: index.questions.filter((q) => q.availability === 'link-only').length,
      missingExplanations: index.questions.filter((q) => !hasExplanation(q)).length,
      duplicateGroups: new Set(index.questions.map((q) => q.duplicateGroupId)).size,
      reservedForMock: index.questions.filter((q) => q.reservedForMock).length,
      prompts: index.prompts.length,
      sources: index.sources.length,
      linkOnlySources: index.sources.filter((s) => s.contentUse !== 'interactive-approved').length,
      importedSources: index.sources.filter((s) => s.importStatus !== 'not-imported').length,
    },
  }
}
