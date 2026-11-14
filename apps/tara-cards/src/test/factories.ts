import type { Question, WritingPrompt } from '@/domain/types'

/** A minimal, fully eligible question for tests. */
export function makeQuestion(over: {
  id: string
  answer: string | null
  skill?: string
  component?: 'critical-thinking' | 'problem-solving'
  duplicateGroupId?: string
  reservedForMock?: boolean
  availability?: Question['availability']
  provenance?: Question['provenance']
  flags?: Partial<Question['flags']>
}): Question {
  return {
    id: over.id,
    version: 1,
    componentId: over.component ?? 'critical-thinking',
    primarySkillId: over.skill ?? 'ct-assumptions',
    secondaryTags: [],
    locator: { sourceId: 'app-fixtures', paper: null, questionNumber: null, page: null, keyLocator: null },
    blocks: [{ kind: 'paragraph', text: `Stem for ${over.id}` }],
    options: [
      { id: 'opt-a', label: 'A', blocks: [{ kind: 'paragraph', text: 'A' }] },
      { id: 'opt-b', label: 'B', blocks: [{ kind: 'paragraph', text: 'B' }] },
      { id: 'opt-c', label: 'C', blocks: [{ kind: 'paragraph', text: 'C' }] },
      { id: 'opt-d', label: 'D', blocks: [{ kind: 'paragraph', text: 'D' }] },
      { id: 'opt-e', label: 'E', blocks: [{ kind: 'paragraph', text: 'E' }] },
    ],
    answerOptionId: over.answer,
    answerVerification: over.answer ? 'verified-key' : 'none',
    explanation: { status: 'none', blocks: [], distractors: [], method: null, sourceNote: null },
    flags: {
      transcriptionChecked: true,
      answerKeyChecked: true,
      alignmentChecked: true,
      assetsChecked: true,
      ...over.flags,
    },
    availability: over.availability ?? 'interactive',
    distributionMode: 'interactive-approved',
    duplicateGroupId: over.duplicateGroupId ?? `grp-${over.id}`,
    reservedForMock: over.reservedForMock ?? false,
    provenance: over.provenance ?? 'app-fixture',
    quarantineReason: null,
  }
}

export function makePrompt(id: string): WritingPrompt {
  return {
    id,
    version: 1,
    provenance: 'app-fixture',
    locator: null,
    statement: `Statement ${id}`,
    requirements: ['Do the thing'],
    coaching: { status: 'app-authored-reviewed', approaches: [], counterpoints: [], checklist: ['Check'] },
    skillIds: [],
    availability: 'interactive',
  }
}
