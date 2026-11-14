import type { Question, Source, WritingPrompt } from '@/domain/types'
import { CT_FIXTURES } from './critical-thinking'
import { PS_FIXTURES } from './problem-solving'
import { WRITING_FIXTURES, PLANNING_EXERCISES } from './writing'
import { FIXTURE_SOURCE_ID } from './builder'

export { PLANNING_EXERCISES }
export type { PlanningExercise } from './writing'

export const FIXTURE_SOURCE: Source = {
  id: FIXTURE_SOURCE_ID,
  exam: 'TARA Cards',
  year: null,
  section: null,
  title: 'Development fixtures (original, not official)',
  paperUrl: 'https://esat-tmua.ac.uk/prepare/',
  keyUrl: null,
  retrievedAt: '2026-09-17',
  version: '1',
  attribution: 'Written for this app. Not produced or endorsed by UAT-UK.',
  contentUse: 'interactive-approved',
  importStatus: 'imported',
  note: 'Original questions written to demonstrate that the software works. They are not official questions, their difficulty is not calibrated, and attempts on them are excluded from progress reports unless you switch that on in Settings.',
}

export const FIXTURE_QUESTIONS: Question[] = [...CT_FIXTURES, ...PS_FIXTURES]
export const FIXTURE_PROMPTS: WritingPrompt[] = WRITING_FIXTURES
