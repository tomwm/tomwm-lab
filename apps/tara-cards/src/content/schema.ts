import { z } from 'zod'

/**
 * The content-pack format. Anything entering interactive practice must pass
 * this schema *and* the eligibility checks in `validate.ts`.
 *
 * Learner data is versioned separately from content: see `storage/db.ts`.
 */

export const PACK_FORMAT_VERSION = 1

const contentBlockSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('paragraph'), text: z.string().min(1) }),
  z.object({ kind: z.literal('passage'), text: z.string().min(1), label: z.string().optional() }),
  z.object({
    kind: z.literal('list'),
    ordered: z.boolean(),
    items: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    kind: z.literal('table'),
    caption: z.string(),
    headers: z.array(z.string()).min(1),
    rows: z.array(z.array(z.string())).min(1),
  }),
  z.object({
    kind: z.literal('figure'),
    alt: z.string().min(1, 'Figures must carry alternative text describing the given information'),
    svg: z.string().optional(),
    assetId: z.string().optional(),
    caption: z.string().optional(),
  }),
])

export const sourceSchema = z.object({
  id: z.string().min(1),
  exam: z.string().min(1),
  year: z.string().nullable(),
  section: z.string().nullable(),
  title: z.string().min(1),
  paperUrl: z.string().url(),
  keyUrl: z.string().url().nullable(),
  retrievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'retrievedAt must be YYYY-MM-DD'),
  version: z.string().nullable(),
  attribution: z.string().min(1),
  contentUse: z.enum(['link-only', 'interactive-approved', 'unknown']),
  importStatus: z.enum(['not-imported', 'partially-imported', 'imported']),
  note: z.string(),
})

export const questionSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  componentId: z.enum(['critical-thinking', 'problem-solving']),
  primarySkillId: z.string().min(1),
  secondaryTags: z.array(z.string()),
  locator: z.object({
    sourceId: z.string().min(1),
    paper: z.string().nullable(),
    questionNumber: z.number().int().nullable(),
    page: z.number().int().nullable(),
    keyLocator: z.string().nullable(),
  }),
  blocks: z.array(contentBlockSchema).min(1),
  options: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        blocks: z.array(contentBlockSchema).min(1),
      }),
    )
    .min(2, 'A question needs at least two answer options'),
  answerOptionId: z.string().nullable(),
  answerVerification: z.enum(['verified-key', 'unverified', 'none']),
  explanation: z.object({
    status: z.enum(['none', 'official', 'app-authored-reviewed', 'app-authored-draft']),
    blocks: z.array(contentBlockSchema),
    distractors: z.array(z.object({ optionId: z.string(), note: z.string().min(1) })),
    method: z.string().nullable(),
    sourceNote: z.string().nullable(),
  }),
  flags: z.object({
    transcriptionChecked: z.boolean(),
    answerKeyChecked: z.boolean(),
    alignmentChecked: z.boolean(),
    assetsChecked: z.boolean(),
  }),
  availability: z.enum(['interactive', 'link-only', 'quarantined']),
  distributionMode: z.enum(['link-only', 'interactive-approved']),
  duplicateGroupId: z.string().min(1),
  reservedForMock: z.boolean(),
  provenance: z.enum(['official', 'app-fixture']),
  quarantineReason: z.string().nullable(),
})

export const writingPromptSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  provenance: z.enum(['official', 'app-fixture']),
  locator: z
    .object({
      sourceId: z.string().min(1),
      paper: z.string().nullable(),
      questionNumber: z.number().int().nullable(),
      page: z.number().int().nullable(),
      keyLocator: z.string().nullable(),
    })
    .nullable(),
  statement: z.string().min(1),
  requirements: z.array(z.string().min(1)).min(1, 'Each prompt states its own tasks'),
  coaching: z.object({
    status: z.enum(['app-authored-reviewed', 'app-authored-draft', 'none']),
    approaches: z.array(z.object({ heading: z.string().min(1), body: z.string().min(1) })),
    counterpoints: z.array(z.string().min(1)),
    checklist: z.array(z.string().min(1)),
  }),
  skillIds: z.array(z.string()),
  availability: z.enum(['interactive', 'link-only', 'quarantined']),
})

export const contentPackSchema = z.object({
  packFormatVersion: z.literal(PACK_FORMAT_VERSION),
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.number().int().positive(),
  createdAt: z.string().min(1),
  description: z.string().default(''),
  sources: z.array(sourceSchema).default([]),
  questions: z.array(questionSchema).default([]),
  writingPrompts: z.array(writingPromptSchema).default([]),
  /** Images shared by several questions, stored once and referenced by id. */
  assets: z.record(z.string(), z.string()).default({}),
})

export type ContentPackInput = z.input<typeof contentPackSchema>
export type ContentPack = z.output<typeof contentPackSchema>
