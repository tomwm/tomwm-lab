import type { ContentBlock, Question, QuestionOption, WritingPrompt } from '@/domain/types'

/**
 * Helpers for the development fixtures.
 *
 * Fixtures are original content written for this app to demonstrate that the
 * software works. They are NOT official questions, they are not calibrated,
 * and attempts on them are excluded from performance reports by default.
 */
export const FIXTURE_SOURCE_ID = 'app-fixtures'

export const p = (text: string): ContentBlock => ({ kind: 'paragraph', text })

export const opts = (
  entries: [label: string, text: string][],
): QuestionOption[] =>
  entries.map(([label, text]) => ({ id: `opt-${label.toLowerCase()}`, label, blocks: [p(text)] }))

export interface FixtureSpec {
  id: string
  component: 'critical-thinking' | 'problem-solving'
  skill: string
  tags?: string[]
  blocks: ContentBlock[]
  options: QuestionOption[]
  /** Option label, e.g. 'C'. Null only for deliberately unverified fixtures. */
  answer: string | null
  why: string[]
  distractors?: [label: string, note: string][]
  method?: string
  /** Overrides for fixtures that exist to demonstrate a handling path. */
  explanationStatus?: Question['explanation']['status']
  availability?: Question['availability']
  quarantineReason?: string | null
  flags?: Partial<Question['flags']>
  duplicateGroupId?: string
  reservedForMock?: boolean
  answerVerification?: Question['answerVerification']
}

export function fixture(spec: FixtureSpec): Question {
  const explanationStatus = spec.explanationStatus ?? 'app-authored-reviewed'
  return {
    id: spec.id,
    version: 1,
    componentId: spec.component,
    primarySkillId: spec.skill,
    secondaryTags: spec.tags ?? [],
    locator: {
      sourceId: FIXTURE_SOURCE_ID,
      paper: 'Development fixtures',
      questionNumber: null,
      page: null,
      keyLocator: 'Authored with the question; no external key involved.',
    },
    blocks: spec.blocks,
    options: spec.options,
    answerOptionId: spec.answer ? `opt-${spec.answer.toLowerCase()}` : null,
    answerVerification: spec.answerVerification ?? (spec.answer ? 'verified-key' : 'none'),
    explanation: {
      status: explanationStatus,
      blocks: explanationStatus === 'none' ? [] : spec.why.map(p),
      distractors: (spec.distractors ?? []).map(([label, note]) => ({
        optionId: `opt-${label.toLowerCase()}`,
        note,
      })),
      method: spec.method ?? null,
      sourceNote:
        explanationStatus === 'none'
          ? null
          : 'Written for this app alongside the question. Not an official explanation.',
    },
    flags: {
      transcriptionChecked: true,
      answerKeyChecked: true,
      alignmentChecked: true,
      assetsChecked: true,
      ...spec.flags,
    },
    availability: spec.availability ?? 'interactive',
    distributionMode: 'interactive-approved',
    duplicateGroupId: spec.duplicateGroupId ?? `grp-${spec.id}`,
    reservedForMock: spec.reservedForMock ?? false,
    provenance: 'app-fixture',
    quarantineReason: spec.quarantineReason ?? null,
  }
}

export function writingFixture(spec: {
  id: string
  statement: string
  requirements: string[]
  approaches: { heading: string; body: string }[]
  counterpoints: string[]
  checklist: string[]
  skillIds: string[]
}): WritingPrompt {
  return {
    id: spec.id,
    version: 1,
    provenance: 'app-fixture',
    locator: null,
    statement: spec.statement,
    requirements: spec.requirements,
    coaching: {
      status: 'app-authored-reviewed',
      approaches: spec.approaches,
      counterpoints: spec.counterpoints,
      checklist: spec.checklist,
    },
    skillIds: spec.skillIds,
    availability: 'interactive',
  }
}
