import { describe, expect, it } from 'vitest'
import { assessRehearsal, buildFullRehearsal, pickRehearsalItems, planDiagnostic, STRICT_TIMING } from './sessions'
import { MODULE_QUESTION_COUNT } from './timing'
import { makePrompt, makeQuestion } from '@/test/factories'

const CT_SKILLS = ['ct-main-conclusion', 'ct-inference', 'ct-assumptions']
const PS_SKILLS = ['ps-relevant-selection', 'ps-finding-method']

function bank(component: 'critical-thinking' | 'problem-solving', n: number, skill: string, reserved = false) {
  return Array.from({ length: n }, (_, i) =>
    makeQuestion({ id: `${component}-${skill}-${i}`, answer: 'opt-a', component, skill, reservedForMock: reserved }),
  )
}

describe('full rehearsal availability', () => {
  it('names exactly what is missing rather than failing silently', () => {
    const result = assessRehearsal({
      questions: bank('critical-thinking', 5, 'ct-assumptions'),
      prompts: [makePrompt('p1')],
      exposedGroups: new Set(),
      allowFixtures: true,
    })
    expect(result.available).toBe(false)
    expect(result.shortfalls).toEqual([
      'Critical Thinking: 5 of 22 approved questions available.',
      'Problem Solving: 0 of 22 approved questions available.',
      'Writing: 1 of 3 eligible prompts available.',
    ])
  })

  it('becomes available once both components and three prompts are covered', () => {
    const result = assessRehearsal({
      questions: [
        ...bank('critical-thinking', 22, 'ct-assumptions'),
        ...bank('problem-solving', 22, 'ps-finding-method'),
      ],
      prompts: [makePrompt('p1'), makePrompt('p2'), makePrompt('p3')],
      exposedGroups: new Set(),
      allowFixtures: true,
    })
    expect(result.available).toBe(true)
    expect(result.shortfalls).toEqual([])
  })

  it('discloses how many items would be reused from material already seen', () => {
    const questions = [
      ...bank('critical-thinking', 22, 'ct-assumptions'),
      ...bank('problem-solving', 22, 'ps-finding-method'),
    ]
    const result = assessRehearsal({
      questions,
      prompts: [makePrompt('p1'), makePrompt('p2'), makePrompt('p3')],
      exposedGroups: new Set(questions.slice(0, 10).map((q) => q.duplicateGroupId)),
      allowFixtures: true,
    })
    expect(result.seenReuseCount).toBe(10)
  })

  it('counts unique questions, not duplicates of the same item', () => {
    const twins = Array.from({ length: 22 }, () =>
      makeQuestion({ id: `dup-${Math.random()}`, answer: 'opt-a', duplicateGroupId: 'one-group' }),
    )
    const result = assessRehearsal({
      questions: twins,
      prompts: [],
      exposedGroups: new Set(),
      allowFixtures: true,
    })
    expect(result.counts[0].approved).toBe(1)
  })
})

describe('TARA format', () => {
  it('keeps questions without exactly five options out of the rehearsal', () => {
    const fiveOption = bank('critical-thinking', 22, 'ct-assumptions')
    const eightOption = bank('critical-thinking', 22, 'ct-inference').map((q) => ({
      ...q,
      options: [...q.options, ...['f', 'g', 'h'].map((l) => ({ id: `opt-${l}`, label: l.toUpperCase(), blocks: [] }))],
    }))
    const picked = pickRehearsalItems([...eightOption, ...fiveOption], 'critical-thinking', new Set(), 's', true)
    expect(picked).toHaveLength(22)
    expect(picked.every((q) => q.options.length === 5)).toBe(true)
  })
})

describe('rehearsal item selection', () => {
  it('prefers held-out material before anything the learner has seen', () => {
    const heldOut = bank('critical-thinking', 22, 'ct-assumptions', true)
    const ordinary = bank('critical-thinking', 22, 'ct-inference')
    const picked = pickRehearsalItems(
      [...ordinary, ...heldOut],
      'critical-thinking',
      new Set(),
      'seed',
      true,
    )
    expect(picked).toHaveLength(MODULE_QUESTION_COUNT)
    expect(picked.every((q) => q.reservedForMock)).toBe(true)
  })

  it('builds three sequential stages with a writing choice of three', () => {
    const { session, promptIds } = buildFullRehearsal({
      questions: [
        ...bank('critical-thinking', 22, 'ct-assumptions'),
        ...bank('problem-solving', 22, 'ps-finding-method'),
      ],
      prompts: [makePrompt('p1'), makePrompt('p2'), makePrompt('p3'), makePrompt('p4')],
      exposedGroups: new Set(),
      timing: STRICT_TIMING,
      seed: 'seed',
      allowFixtures: true,
      now: 0,
    })
    expect(session.stages).toHaveLength(3)
    expect(session.stages[0].itemIds).toHaveLength(22)
    expect(session.stages[1].itemIds).toHaveLength(22)
    expect(promptIds).toHaveLength(3)
  })
})

describe('short diagnostic', () => {
  const questions = [
    ...CT_SKILLS.flatMap((s) => bank('critical-thinking', 2, s)),
    ...PS_SKILLS.flatMap((s) => bank('problem-solving', 3, s)),
  ]

  it('takes one per Critical Thinking skill and two per Problem Solving skill', () => {
    const plan = planDiagnostic({
      questions,
      ctSkillIds: CT_SKILLS,
      psSkillIds: PS_SKILLS,
      exposedGroups: new Set(),
      seed: 'seed',
      allowFixtures: true,
    })
    expect(plan.available).toBe(true)
    expect(plan.items).toHaveLength(CT_SKILLS.length + PS_SKILLS.length * 2)
  })

  it('names the skills it could not cover instead of quietly shrinking', () => {
    const plan = planDiagnostic({
      questions: bank('critical-thinking', 2, 'ct-assumptions'),
      ctSkillIds: CT_SKILLS,
      psSkillIds: PS_SKILLS,
      exposedGroups: new Set(),
      seed: 'seed',
      allowFixtures: true,
    })
    expect(plan.available).toBe(false)
    expect(plan.missingSkillIds).toContain('ct-inference')
    expect(plan.missingSkillIds).toContain('ps-finding-method')
    expect(plan.note).toContain('not enough unseen questions')
  })

  it('only uses questions the learner has never met', () => {
    const plan = planDiagnostic({
      questions,
      ctSkillIds: CT_SKILLS,
      psSkillIds: PS_SKILLS,
      exposedGroups: new Set(questions.map((q) => q.duplicateGroupId)),
      seed: 'seed',
      allowFixtures: true,
    })
    expect(plan.items).toHaveLength(0)
  })
})
