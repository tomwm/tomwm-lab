import { describe, expect, it } from 'vitest'
import { applyQuarantine, contentHash, detectExactDuplicates, validateContentPack } from './validate'
import { PACK_FORMAT_VERSION } from './schema'
import { SKILL_IDS } from './skills'
import { makeQuestion } from '@/test/factories'

function pack(over: Record<string, unknown> = {}) {
  return {
    packFormatVersion: PACK_FORMAT_VERSION,
    id: 'test-pack',
    name: 'Test pack',
    version: 1,
    createdAt: '2026-09-17',
    sources: [
      {
        id: 'src-1',
        exam: 'TSA',
        year: '2020',
        section: 'Section 1',
        title: '2020 TSA Section 1',
        paperUrl: 'https://example.org/paper.pdf',
        keyUrl: 'https://example.org/key.pdf',
        retrievedAt: '2026-09-17',
        version: null,
        attribution: 'UAT-UK',
        contentUse: 'interactive-approved',
        importStatus: 'imported',
        note: '',
      },
    ],
    questions: [],
    writingPrompts: [],
    ...over,
  }
}

function question(over: Record<string, unknown> = {}) {
  const q = makeQuestion({ id: 'src1-q1', answer: 'opt-a', provenance: 'official' })
  return { ...q, locator: { ...q.locator, sourceId: 'src-1' }, ...over }
}

describe('content pack validation', () => {
  it('rejects a pack with the wrong format version', () => {
    const result = validateContentPack(pack({ packFormatVersion: 99 }), SKILL_IDS)
    expect(result.ok).toBe(false)
    expect(result.issues[0].path).toBe('packFormatVersion')
  })

  it('rejects a question with fewer than two options, naming the field', () => {
    const result = validateContentPack(
      pack({ questions: [question({ options: [{ id: 'opt-a', label: 'A', blocks: [{ kind: 'paragraph', text: 'A' }] }] })] }),
      SKILL_IDS,
    )
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.path === 'questions.0.options')).toBe(true)
  })

  it('rejects an answer key pointing at an option that does not exist', () => {
    const result = validateContentPack(pack({ questions: [question({ answerOptionId: 'opt-z' })] }), SKILL_IDS)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.message.includes('not one of this question'))).toBe(true)
  })

  it('rejects an unknown skill id', () => {
    const result = validateContentPack(pack({ questions: [question({ primarySkillId: 'nope' })] }), SKILL_IDS)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.message.includes('Unknown skill'))).toBe(true)
  })

  it('rejects an unknown source id', () => {
    const q = question()
    const result = validateContentPack(
      pack({ questions: [{ ...q, locator: { ...q.locator, sourceId: 'missing' } }] }),
      SKILL_IDS,
    )
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.message.includes('Unknown source'))).toBe(true)
  })

  it('refuses to render a question whose source is only link-only', () => {
    const p = pack({ questions: [question()] })
    p.sources[0].contentUse = 'link-only'
    const result = validateContentPack(p, SKILL_IDS)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.message.includes('not a redistribution licence'))).toBe(true)
  })

  it('rejects a figure with no alternative text', () => {
    const result = validateContentPack(
      pack({ questions: [question({ blocks: [{ kind: 'figure', alt: '', svg: '<svg/>' }] })] }),
      SKILL_IDS,
    )
    expect(result.ok).toBe(false)
  })

  it('quarantines rather than accepts a question with a missing figure', () => {
    const p = pack({
      questions: [
        question({
          blocks: [{ kind: 'figure', alt: 'A bar chart of monthly totals.' }],
          flags: { transcriptionChecked: true, answerKeyChecked: true, alignmentChecked: true, assetsChecked: false },
        }),
      ],
    })
    const result = validateContentPack(p, SKILL_IDS)
    expect(result.quarantined).toHaveLength(1)
    expect(result.quarantined[0].reasons.join(' ')).toContain('no asset present')
    const applied = applyQuarantine(result.pack!, result)
    expect(applied.questions[0].availability).toBe('quarantined')
  })

  it('accepts a well-formed pack', () => {
    const result = validateContentPack(pack({ questions: [question()] }), SKILL_IDS)
    expect(result.ok).toBe(true)
    expect(result.pack?.questions).toHaveLength(1)
  })
})

describe('shared images', () => {
  it('resolves an asset reference to the shared image', () => {
    const q = question({ blocks: [{ kind: 'figure', alt: 'Shared passage.', assetId: 'shared-1' }] })
    const result = validateContentPack(pack({ questions: [q], assets: { 'shared-1': '<svg/>' } }), SKILL_IDS)
    expect(result.ok).toBe(true)
    const block = result.pack!.questions[0].blocks[0]
    expect(block.kind === 'figure' && block.svg).toBe('<svg/>')
    expect(result.quarantined).toHaveLength(0)
  })

  it('quarantines a question whose shared image is missing', () => {
    const q = question({ blocks: [{ kind: 'figure', alt: 'Shared passage.', assetId: 'nope' }] })
    const result = validateContentPack(pack({ questions: [q] }), SKILL_IDS)
    expect(result.quarantined).toHaveLength(1)
  })
})

describe('duplicate detection', () => {
  it('gives identical content the same hash', () => {
    const a = makeQuestion({ id: 'a', answer: 'opt-a' })
    const b = makeQuestion({ id: 'b', answer: 'opt-a' })
    expect(contentHash({ ...a, blocks: a.blocks })).not.toBe(contentHash(b))
    expect(contentHash(a)).toBe(contentHash({ ...a, id: 'other' } as typeof a))
  })

  it('finds exact duplicates across ids', () => {
    const a = makeQuestion({ id: 'a', answer: 'opt-a' })
    const twin = { ...a, id: 'a-copy' }
    const found = detectExactDuplicates([a, twin])
    expect([...found.values()][0]).toEqual(['a', 'a-copy'])
  })
})
