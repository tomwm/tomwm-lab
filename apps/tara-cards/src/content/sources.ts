import type { Source } from '@/domain/types'
import { ARCHIVE_SOURCES, SOURCES_RETRIEVED_AT } from './sources.generated'

export { SOURCES_RETRIEVED_AT }

/**
 * Reference material: the pages and documents that define the test, plus the
 * provider's own practice tests. None of these are imported; they are links
 * the app sends the learner to.
 */
export const REFERENCE_SOURCES: Source[] = [
  {
    id: 'uatuk-tara-overview',
    exam: 'TARA',
    year: null,
    section: null,
    title: 'TARA overview (UAT-UK)',
    paperUrl: 'https://esat-tmua.ac.uk/about-the-tests/tara/',
    keyUrl: null,
    retrievedAt: SOURCES_RETRIEVED_AT,
    version: null,
    attribution: 'UAT-UK',
    contentUse: 'link-only',
    importStatus: 'not-imported',
    note: 'The authority for test format: two 22-question modules of 40 minutes each, then one essay from three prompts with a 750-word limit, no negative marking, reasoning scores reported separately and the essay passed on unscored.',
  },
  {
    id: 'uatuk-prepare',
    exam: 'TARA',
    year: null,
    section: null,
    title: 'Preparation hub (UAT-UK)',
    paperUrl: 'https://esat-tmua.ac.uk/prepare/',
    keyUrl: null,
    retrievedAt: SOURCES_RETRIEVED_AT,
    version: null,
    attribution: 'UAT-UK',
    contentUse: 'link-only',
    importStatus: 'not-imported',
    note: 'Lists every official resource. States that all necessary preparation is free from UAT-UK and Pearson, and that sharing test content during or after the cycle is prohibited.',
  },
  {
    id: 'uatuk-content-spec',
    exam: 'TARA',
    year: '2026-27',
    section: null,
    title: 'TARA content specification (2026-27)',
    paperUrl:
      'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2026/06/08142350/TARA_Content_Specification.pdf',
    keyUrl: null,
    retrievedAt: SOURCES_RETRIEVED_AT,
    version: '2026-27',
    attribution: 'UAT-UK',
    contentUse: 'link-only',
    importStatus: 'not-imported',
    note: 'Defines the assessed content and test conditions, including that unused module time does not carry over and that calculators, dictionaries and electronic spell-checkers are not permitted. Check the mathematical scope of Problem Solving against this document during content review.',
  },
  {
    id: 'uatuk-question-guide',
    exam: 'TARA',
    year: '2026-27',
    section: null,
    title: 'TARA question guide (2026-27)',
    paperUrl:
      'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2026/06/08142344/TARA_Question_Guide.pdf',
    keyUrl: null,
    retrievedAt: SOURCES_RETRIEVED_AT,
    version: '2026-27',
    attribution: 'UAT-UK',
    contentUse: 'link-only',
    importStatus: 'not-imported',
    note: "Describes the question types behind this app's Critical Thinking and Problem Solving skill cards. Any worked examples it contains should be tagged as exposed if you study them.",
  },
  {
    id: 'pearson-vue-practice-tests',
    exam: 'TARA',
    year: null,
    section: null,
    title: 'Official TARA specimen and practice tests (Pearson VUE)',
    paperUrl: 'https://www.pearsonvue.com/us/en/uatuk.html',
    keyUrl: null,
    retrievedAt: SOURCES_RETRIEVED_AT,
    version: null,
    attribution: 'UAT-UK and Pearson VUE',
    contentUse: 'link-only',
    importStatus: 'not-imported',
    note: 'Two practice tests run in the provider’s own player and mirror the live test software. Take them there, under timed conditions, then record the result here manually. This app cannot and does not reproduce that player.',
  },
  {
    id: 'uatuk-archive',
    exam: 'UAT-UK',
    year: null,
    section: null,
    title: 'Archive of past papers (UAT-UK)',
    paperUrl: 'https://esat-tmua.ac.uk/tara-preparation-materials/',
    keyUrl: null,
    retrievedAt: SOURCES_RETRIEVED_AT,
    version: null,
    attribution: 'UAT-UK',
    contentUse: 'link-only',
    importStatus: 'not-imported',
    note: 'The index page for the BMAT and TSA Section 1 papers listed below. UAT-UK offers them because those tests share a common history with TARA’s reasoning components — they are not past TARA papers.',
  },
]

export const SOURCES: Source[] = [...REFERENCE_SOURCES, ...ARCHIVE_SOURCES]

export const SOURCE_BY_ID = new Map(SOURCES.map((s) => [s.id, s]))

export const PAPER_SOURCES = ARCHIVE_SOURCES

/**
 * Sources whose official explained answers exist. Recorded so the coverage
 * report does not imply that explanations are generally available.
 */
export const SOURCES_WITH_OFFICIAL_EXPLANATIONS = ['tsa-2020-s1']
