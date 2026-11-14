import type { StudyComponent } from '@/domain/types'

/**
 * The three TARA components.
 *
 * Verified format: two 22-question multiple-choice modules of 40 minutes each,
 * then one essay chosen from three prompts, with a 750-word limit. There is no
 * deduction for a wrong multiple-choice answer, unused module time does not
 * carry over, and calculators, dictionaries and electronic spell-checkers are
 * not permitted. UAT-UK reports the two reasoning scores separately and passes
 * the essay to participating universities without scoring it. [S1, S4]
 */
export const COMPONENTS: StudyComponent[] = [
  {
    id: 'critical-thinking',
    name: 'Critical Thinking',
    order: 1,
    accent: 'ct',
    description:
      'Reading short arguments closely: what is being concluded, what is being taken for granted, and what would make the reasoning better or worse.',
  },
  {
    id: 'problem-solving',
    name: 'Problem Solving',
    order: 2,
    accent: 'ps',
    description:
      'Working with numerical and spatial information: picking out what matters, finding a route to the answer, and spotting when two things are the same underneath.',
  },
  {
    id: 'writing',
    name: 'Writing',
    order: 3,
    accent: 'wr',
    description:
      'One response to a short statement, from a choice of three: explain what it means, give a reasoned argument against it, and say how far you agree. 40 minutes, at most 750 words.',
  },
]

export const COMPONENT_BY_ID = new Map(COMPONENTS.map((c) => [c.id, c]))
